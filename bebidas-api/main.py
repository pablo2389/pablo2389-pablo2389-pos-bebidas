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
# CONFIGURACIÓN INICIAL
# =====================
load_dotenv()

app = FastAPI(title="API POS Bebidas", version="1.0.0")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise Exception("Faltan SUPABASE_URL o SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# =====================
# CORS (CORRECTO)
# =====================
origins = [
    "http://localhost:3000",
    "https://kiosco-grace.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,  # IMPORTANTE para Authorization header
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================
# AUTH & SECURITY
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
class Login(BaseModel):
    email: str
    password: str

class UsuarioCreate(BaseModel):
    email: str
    nombre: str
    password: str

class ItemPedido(BaseModel):
    producto_id: int
    cantidad: int

class PedidoCreate(BaseModel):
    cliente: str
    telefono: str | None = ""
    metodo_pago: str
    estado: str = "completado"
    descuento: float = 0
    items: List[ItemPedido]

# =====================
# RUTAS
# =====================
@app.get("/")
def root():
    return {"status": "API OK", "time": datetime.utcnow().isoformat()}

@app.get("/ping")
def ping():
    return {"pong": True}

# =====================
# AUTH
# =====================
@app.post("/auth/login")
def login(data: Login):
    res = supabase.table("usuarios").select("*").eq("email", data.email).execute()

    if not res.data:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    user = res.data[0]

    if user["password"] != data.password:
        raise HTTPException(status_code=401, detail="Password incorrecto")

    token = crear_token(user["id"], user["email"], user["rol"], user["kiosco_id"])

    return {
        "token": token,
        "nombre": user["nombre"]
    }

@app.post("/auth/registrar")
def registrar(usuario: UsuarioCreate):
    existe = supabase.table("usuarios").select("id").eq("email", usuario.email).execute()

    if existe.data:
        raise HTTPException(status_code=400, detail="Usuario ya existe")

    kiosco_id = str(uuid.uuid4())

    supabase.table("kioscos").insert({
        "id": kiosco_id,
        "nombre": f"Kiosco de {usuario.nombre}"
    }).execute()

    res = supabase.table("usuarios").insert({
        "email": usuario.email,
        "nombre": usuario.nombre,
        "password": usuario.password,
        "rol": "admin",
        "kiosco_id": kiosco_id,
    }).execute()

    user = res.data[0]

    token = crear_token(user["id"], user["email"], "admin", kiosco_id)

    return {
        "token": token,
        "nombre": user["nombre"]
    }

# =====================
# PEDIDOS
# =====================
@app.post("/pedidos")
def crear_pedido(pedido: PedidoCreate, token=Depends(verificar_token)):
    kiosco_id = token["kiosco_id"]

    total = 0
    items_guardar = []

    for item in pedido.items:
        producto_res = supabase.table("productos") \
            .select("precio") \
            .eq("id", item.producto_id) \
            .single() \
            .execute()

        producto = producto_res.data

        if not producto:
            raise HTTPException(
                status_code=404,
                detail=f"Producto {item.producto_id} no encontrado"
            )

        precio = producto["precio"]
        total += precio * item.cantidad

        items_guardar.append({
            "producto_id": item.producto_id,
            "cantidad": item.cantidad,
            "precio_unitario": precio
        })

    pedido_db = supabase.table("pedidos").insert({
        "kiosco_id": kiosco_id,
        "cliente": pedido.cliente,
        "telefono": pedido.telefono,
        "metodo_pago": pedido.metodo_pago,
        "estado": pedido.estado,
        "descuento": pedido.descuento,
        "total": total,
        "created_at": datetime.utcnow().isoformat()
    }).execute()

    if not pedido_db.data:
        raise HTTPException(status_code=500, detail="Error al crear pedido")

    pedido_id = pedido_db.data[0]["id"]

    for item in items_guardar:
        item["pedido_id"] = pedido_id
        supabase.table("pedido_items").insert(item).execute()

    return {
        "message": "Pedido creado",
        "total": total,
        "pedido_id": pedido_id
    }

# =====================
# ESTADÍSTICAS
# =====================
@app.get("/estadisticas/diarias")
def obtener_estadisticas_diarias(fecha: str, token=Depends(verificar_token)):
    kiosco_id = token["kiosco_id"]

    res = supabase.table("pedidos") \
        .select("total, metodo_pago") \
        .eq("kiosco_id", kiosco_id) \
        .gte("created_at", f"{fecha}T00:00:00") \
        .lte("created_at", f"{fecha}T23:59:59") \
        .execute()

    pedidos = res.data or []

    total_ventas = sum(p["total"] for p in pedidos)

    metodos = {}
    for p in pedidos:
        metodo = p["metodo_pago"]
        metodos[metodo] = metodos.get(metodo, 0) + p["total"]

    return {
        "fecha": fecha,
        "total_ventas": total_ventas,
        "cantidad_pedidos": len(pedidos),
        "metodos_pago": metodos
    }

@app.get("/dashboard/productos-bajo-stock")
def productos_bajo_stock(token=Depends(verificar_token)):
    kiosco_id = token["kiosco_id"]

    res = supabase.table("productos") \
        .select("*") \
        .eq("kiosco_id", kiosco_id) \
        .lt("stock", 5) \
        .execute()

    return res.data or []