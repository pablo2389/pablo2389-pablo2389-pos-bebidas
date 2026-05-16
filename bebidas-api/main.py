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
from typing import List, Optional, Dict
from collections import defaultdict

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
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
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
    telefono: Optional[str] = ""
    metodo_pago: str
    estado: str = "completado"
    descuento: float = 0
    items: List[ItemPedido]

class ProductoBase(BaseModel):
    nombre: str
    precio: float
    stock: Optional[int] = 0
    estado: Optional[str] = "activo"

class ProductoCreate(ProductoBase):
    pass

class ProductoOut(ProductoBase):
    id: int

class ClienteBase(BaseModel):
    nombre: str
    telefono: Optional[str] = ""

class ClienteOut(ClienteBase):
    id: int

# =====================
# RUTAS BÁSICAS
# =====================
@app.get("/")
def root():
    return {"status": "API OK", "time": datetime.utcnow().isoformat()}

@app.get("/ping")
def ping():
    return {"pong": True}

# =====================
# CLIENTES LISTA (MODIFICADO)
# =====================
@app.get("/clientes/lista")
def listar_clientes(token=Depends(verificar_token)):
    kiosco_id = token["kiosco_id"]

    # 1) Traer todos los clientes del kiosco
    res_clientes = (
        supabase.table("clientes")
        .select("id, nombre, telefono")
        .eq("kiosco_id", kiosco_id)
        .order("id")
        .execute()
    )

    clientes = res_clientes.data or []

    if not clientes:
        return []

    # 2) Nombres de clientes para filtrar pedidos
    nombres = [c["nombre"] for c in clientes]

    # 3) Traer todos los pedidos de esos clientes
    res_pedidos = (
        supabase.table("pedidos")
        .select("cliente, total, metodo_pago, estado")
        .eq("kiosco_id", kiosco_id)
        .in_("cliente", nombres)
        .execute()
    )

    pedidos = res_pedidos.data or []

    # 4) Agregar por cliente
    resumen_compras = defaultdict(lambda: {"compras_total": 0, "deuda_total": 0.0})

    for p in pedidos:
        nombre_cli = (p.get("cliente") or "").strip()
        if not nombre_cli:
            continue

        total = float(p.get("total") or 0)
        metodo_pago = (p.get("metodo_pago") or "").lower()
        estado = (p.get("estado") or "").lower()

        resumen_compras[nombre_cli]["compras_total"] += 1

        if metodo_pago == "fiado" or estado == "pendiente":
            resumen_compras[nombre_cli]["deuda_total"] += total

    # 5) Armar respuesta final combinando clientes + resumen
    resultado = []
    for c in clientes:
        nombre = c["nombre"]
        info = resumen_compras.get(nombre, {"compras_total": 0, "deuda_total": 0.0})

        resultado.append(
            {
                "id": c["id"],
                "nombre": nombre,
                "telefono": c.get("telefono") or "",
                "compras_total": info["compras_total"],
                "deuda_total": info["deuda_total"],
            }
        )

    resultado.sort(key=lambda x: x["deuda_total"], reverse=True)

    return resultado
