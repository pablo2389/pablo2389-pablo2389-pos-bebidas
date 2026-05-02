from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import jwt
import uuid
from pydantic import BaseModel
from typing import List

# =====================
# ENV
# =====================
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise Exception("Faltan variables .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI()

# =====================
# CORS
# =====================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://kiosco-grace.vercel.app",
        "https://pablo2389-pablo2389-pos-bebidas.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================
# AUTH
# =====================
security = HTTPBearer()

def crear_token(user_id, email, rol, kiosco_id):
    payload = {
        "user_id": user_id,
        "email": email,
        "rol": rol,
        "kiosco_id": kiosco_id,
        "exp": datetime.utcnow() + timedelta(days=30),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


def verificar_token(token: HTTPAuthorizationCredentials = Depends(security)):
    try:
        return jwt.decode(token.credentials, SECRET_KEY, algorithms=["HS256"])
    except:
        raise HTTPException(status_code=401, detail="Token inválido")

# =====================
# MODELOS
# =====================
class Producto(BaseModel):
    nombre: str
    precio: float
    stock: int = 0


class PedidoItem(BaseModel):
    producto_id: int
    cantidad: int


class PedidoCreate(BaseModel):
    cliente: str
    metodo_pago: str
    items: List[PedidoItem]

# =====================
# ROOT
# =====================
@app.get("/")
def root():
    return {"status": "ok"}

# =====================
# CAJA ESTADO (ON/OFF SYSTEM)
# =====================

@app.get("/caja/estado")
def obtener_estado_caja(token=Depends(verificar_token)):

    kiosco_id = token["kiosco_id"]

    res = supabase.table("caja_estado") \
        .select("*") \
        .eq("kiosco_id", kiosco_id) \
        .order("updated_at", desc=True) \
        .limit(1) \
        .execute()

    if not res.data:
        return {"estado": "closed"}

    return res.data[0]


@app.post("/caja/toggle")
def toggle_caja(token=Depends(verificar_token)):

    kiosco_id = token["kiosco_id"]
    user_id = token["user_id"]

    res = supabase.table("caja_estado") \
        .select("*") \
        .eq("kiosco_id", kiosco_id) \
        .order("updated_at", desc=True) \
        .limit(1) \
        .execute()

    estado_actual = "closed"

    if res.data:
        estado_actual = res.data[0]["estado"]

    nuevo_estado = "open" if estado_actual == "closed" else "closed"

    supabase.table("caja_estado").insert({
        "kiosco_id": kiosco_id,
        "usuario_id": user_id,
        "estado": nuevo_estado,
        "updated_at": datetime.utcnow().isoformat()
    }).execute()

    return {"estado": nuevo_estado}

# =====================
# PRODUCTOS BAJO STOCK
# =====================
@app.get("/dashboard/productos-bajo-stock")
def productos_bajo_stock(token=Depends(verificar_token)):

    kiosco_id = token["kiosco_id"]

    res = supabase.table("productos") \
        .select("*") \
        .eq("kiosco_id", kiosco_id) \
        .lt("stock", 5) \
        .execute()

    return res.data or []

# =====================
# CAJA HOY
# =====================
@app.get("/dashboard/caja-hoy")
def caja_hoy(token=Depends(verificar_token)):

    kiosco_id = token["kiosco_id"]
    hoy = datetime.now().date()

    res = supabase.table("pedidos") \
        .select("total, metodo_pago") \
        .eq("kiosco_id", kiosco_id) \
        .gte("created_at", f"{hoy}T00:00:00") \
        .lte("created_at", f"{hoy}T23:59:59") \
        .execute()

    pedidos = res.data or []

    total = 0
    por_metodo = {}

    for p in pedidos:
        monto = p.get("total") or 0
        metodo = (p.get("metodo_pago") or "sin_metodo").lower()

        total += monto
        por_metodo[metodo] = por_metodo.get(metodo, 0) + monto

    return {
        "total": total,
        "cantidad_pedidos": len(pedidos),
        "por_metodo": por_metodo
    }

# =====================
# CLIENTES
# =====================
@app.get("/clientes/lista")
def clientes_lista(token=Depends(verificar_token)):

    kiosco_id = token["kiosco_id"]

    res = supabase.table("clientes") \
        .select("*") \
        .eq("kiosco_id", kiosco_id) \
        .execute()

    return res.data or []

# =====================
# PRODUCTOS
# =====================
@app.get("/productos")
def get_productos(token=Depends(verificar_token)):

    kiosco_id = token["kiosco_id"]

    return supabase.table("productos") \
        .select("*") \
        .eq("kiosco_id", kiosco_id) \
        .execute().data


@app.post("/productos")
def crear_producto(prod: Producto, token=Depends(verificar_token)):

    kiosco_id = token["kiosco_id"]

    return supabase.table("productos").insert({
        "nombre": prod.nombre,
        "precio": prod.precio,
        "stock": prod.stock,
        "kiosco_id": kiosco_id
    }).execute().data

# =====================
# PEDIDOS (CON BLOQUEO DE CAJA)
# =====================
@app.post("/pedidos")
def crear_pedido(pedido: PedidoCreate, token=Depends(verificar_token)):

    kiosco_id = token["kiosco_id"]

    # 🔒 VALIDAR CAJA ABIERTA
    caja = supabase.table("caja_estado") \
        .select("*") \
        .eq("kiosco_id", kiosco_id) \
        .order("updated_at", desc=True) \
        .limit(1) \
        .execute()

    estado = "closed"
    if caja.data:
        estado = caja.data[0]["estado"]

    if estado != "open":
        raise HTTPException(403, "La caja está cerrada")

    # CREAR PEDIDO
    pedido_res = supabase.table("pedidos").insert({
        "cliente": pedido.cliente,
        "metodo_pago": pedido.metodo_pago,
        "kiosco_id": kiosco_id,
        "created_at": datetime.utcnow().isoformat()
    }).execute()

    pedido_id = pedido_res.data[0]["id"]

    total = 0

    for item in pedido.items:

        prod = supabase.table("productos") \
            .select("*") \
            .eq("id", item.producto_id) \
            .execute().data[0]

        subtotal = prod["precio"] * item.cantidad
        total += subtotal

        supabase.table("pedido_items").insert({
            "pedido_id": pedido_id,
            "producto_id": item.producto_id,
            "cantidad": item.cantidad,
            "precio_unitario": prod["precio"],
            "kiosco_id": kiosco_id
        }).execute()

        supabase.table("productos").update({
            "stock": prod["stock"] - item.cantidad
        }).eq("id", item.producto_id).execute()

    supabase.table("pedidos").update({
        "total": total
    }).eq("id", pedido_id).execute()

    return {
        "total": total,
        "pedido_id": pedido_id
    }