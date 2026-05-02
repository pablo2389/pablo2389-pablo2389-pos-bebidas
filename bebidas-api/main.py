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
from typing import List, Dict, Any
from collections import defaultdict

# =====================
# ENV
# =====================
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-prod")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise Exception("Faltan variables .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# =====================
# APP
# =====================
app = FastAPI()

# =====================
# CORS
# =====================
origins = [
    "http://localhost:3000",
    "https://kiosco-grace.vercel.app",
    "https://pablo2389-pablo2389-pos-bebidas.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================
# AUTH
# =====================
security = HTTPBearer()

def verificar_token(token: HTTPAuthorizationCredentials = Depends(security)):
    try:
        return jwt.decode(token.credentials, SECRET_KEY, algorithms=["HS256"])
    except:
        raise HTTPException(status_code=401, detail="Token inválido")

def crear_token(user_id, email, rol, kiosco_id):
    payload = {
        "user_id": user_id,
        "email": email,
        "rol": rol,
        "kiosco_id": kiosco_id,
        "exp": datetime.utcnow() + timedelta(days=30),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

# =====================
# MODELOS
# =====================
class UsuarioCreate(BaseModel):
    email: str
    nombre: str
    password: str

class Login(BaseModel):
    email: str
    password: str

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
# AUTH
# =====================
@app.post("/auth/registrar")
def registrar(usuario: UsuarioCreate):

    existe = supabase.table("usuarios").select("id").eq("email", usuario.email).execute()

    if existe.data:
        raise HTTPException(400, "Usuario ya existe")

    kiosco_id = str(uuid.uuid4())

    # crear kiosco
    supabase.table("kioscos").insert({
        "id": kiosco_id,
        "nombre": f"Kiosco de {usuario.nombre}"
    }).execute()

    # crear admin
    res = supabase.table("usuarios").insert({
        "email": usuario.email,
        "nombre": usuario.nombre,
        "password": usuario.password,
        "rol": "admin",
        "kiosco_id": kiosco_id
    }).execute()

    user = res.data[0]

    token = crear_token(user["id"], usuario.email, "admin", kiosco_id)

    return {"token": token, "nombre": usuario.nombre, "rol": "admin"}


@app.post("/auth/login")
def login(data: Login):

    res = supabase.table("usuarios").select("*").eq("email", data.email).execute()

    if not res.data:
        raise HTTPException(404, "Usuario no encontrado")

    user = res.data[0]

    if user["password"] != data.password:
        raise HTTPException(401, "Contraseña incorrecta")

    token = crear_token(
        user["id"],
        user["email"],
        user["rol"],
        user["kiosco_id"]
    )

    return {"token": token, "nombre": user["nombre"], "rol": user["rol"]}


# =====================
# CREAR EMPLEADO
# =====================
@app.post("/auth/invitar")
def crear_empleado(data: UsuarioCreate, token=Depends(verificar_token)):

    kiosco_id = token.get("kiosco_id")

    supabase.table("usuarios").insert({
        "email": data.email,
        "nombre": data.nombre,
        "password": data.password,
        "rol": "vendedor",
        "kiosco_id": kiosco_id
    }).execute()

    return {"msg": "Empleado creado"}


# =====================
# PRODUCTOS
# =====================
@app.get("/productos")
def productos(token=Depends(verificar_token)):

    kiosco_id = token.get("kiosco_id")

    return supabase.table("productos")\
        .select("*")\
        .eq("kiosco_id", kiosco_id)\
        .execute().data


@app.post("/productos")
def crear_producto(prod: Producto, token=Depends(verificar_token)):

    kiosco_id = token.get("kiosco_id")

    return supabase.table("productos").insert({
        "nombre": prod.nombre,
        "precio": prod.precio,
        "stock": prod.stock,
        "kiosco_id": kiosco_id
    }).execute().data


# =====================
# PEDIDOS
# =====================
@app.post("/pedidos")
def crear_pedido(pedido: PedidoCreate, token=Depends(verificar_token)):

    kiosco_id = token.get("kiosco_id")

    pedido_res = supabase.table("pedidos").insert({
        "cliente": pedido.cliente,
        "metodo_pago": pedido.metodo_pago,
        "kiosco_id": kiosco_id
    }).execute()

    pedido_id = pedido_res.data[0]["id"]

    total = 0

    for item in pedido.items:
        prod = supabase.table("productos")\
            .select("*")\
            .eq("id", item.producto_id)\
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

    supabase.table("pedidos").update({
        "total": total
    }).eq("id", pedido_id).execute()

    return {"total": total}