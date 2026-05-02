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
        "https://pablo2389-pablo2389-pos-bebidas.vercel.app",
        "https://kiosco-grace.vercel.app",  # frontend en Vercel
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
class Login(BaseModel):
    email: str
    password: str

class UsuarioCreate(BaseModel):
    email: str
    nombre: str
    password: str

# =====================
# LOGIN (BODY JSON)
# =====================
@app.post("/auth/login")
def login(data: Login):
    res = (
        supabase.table("usuarios")
        .select("*")
        .eq("email", data.email)
        .execute()
    )

    if not res.data:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    user = res.data[0]  # tomar el primer usuario

    if user["password"] != data.password:
        raise HTTPException(status_code=401, detail="Password incorrecto")

    token = crear_token(
        user["id"],
        user["email"],
        user["rol"],
        user["kiosco_id"],
    )

    return {
        "token": token,
        "nombre": user["nombre"],
    }

# =====================
# REGISTRO
# =====================
@app.post("/auth/registrar")
def registrar(usuario: UsuarioCreate):
    existe = (
        supabase.table("usuarios")
        .select("id")
        .eq("email", usuario.email)
        .execute()
    )

    if existe.data:
        raise HTTPException(status_code=400, detail="Usuario ya existe")

    kiosco_id = str(uuid.uuid4())

    supabase.table("kioscos").insert(
        {
            "id": kiosco_id,
            "nombre": f"Kiosco de {usuario.nombre}",
        }
    ).execute()

    res = supabase.table("usuarios").insert(
        {
            "email": usuario.email,
            "nombre": usuario.nombre,
            "password": usuario.password,
            "rol": "admin",
            "kiosco_id": kiosco_id,
        }
    ).execute()

    user = res.data[0]

    token = crear_token(user["id"], user["email"], "admin", kiosco_id)

    return {
        "token": token,
        "nombre": user["nombre"],
    }

# =====================
# CAJA HOY (FIX SAFE)
# =====================
@app.get("/dashboard/caja-hoy")
def caja_hoy(token=Depends(verificar_token)):
    kiosco_id = token["kiosco_id"]
    hoy = datetime.now().date()

    res = (
        supabase.table("pedidos")
        .select("total, metodo_pago")
        .eq("kiosco_id", kiosco_id)
        .gte("created_at", f"{hoy}T00:00:00")
        .lte("created_at", f"{hoy}T23:59:59")
        .execute()
    )

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
        "por_metodo": por_metodo,
    }

# =====================
# STOCK (SAFE RETURN)
# =====================
@app.get("/dashboard/productos-bajo-stock")
def productos_bajo_stock(token=Depends(verificar_token)):
    kiosco_id = token["kiosco_id"]

    res = (
        supabase.table("productos")
        .select("*")
        .eq("kiosco_id", kiosco_id)
        .lt("stock", 5)
        .execute()
    )

    return res.data or []