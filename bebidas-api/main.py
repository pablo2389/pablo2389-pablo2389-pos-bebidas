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
# CAJA HOY (🔥 FIX PRINCIPAL)
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