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
    estado: str = "completado"  # o "pendiente" si es fiado
    descuento: float = 0        # no se persiste en la tabla
    items: List[ItemPedido]


# Productos
class ProductoBase(BaseModel):
    nombre: str
    precio: float
    stock: Optional[int] = 0    # permite NULL en DB
    estado: Optional[str] = "activo"


class ProductoCreate(ProductoBase):
    pass


class ProductoOut(ProductoBase):
    id: int


# Clientes
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
# AUTH
# =====================
@app.post("/auth/login")
def login(data: Login):
    res = supabase.table("usuarios").select("*").eq("email", data.email).execute()

    if not res.data:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    user = res.data[0]

    # Ojo: en producción deberías hashear la contraseña
    if user["password"] != data.password:
        raise HTTPException(status_code=401, detail="Password incorrecto")

    token = crear_token(user["id"], user["email"], user["rol"], user["kiosco_id"])

    return {
        "token": token,
        "nombre": user["nombre"],
    }


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
            "password": usuario.password,  # en producción, hasheada
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
# PEDIDOS / PRODUCTOS / HISTORIAL / CAJA
# =====================
# 👉 Acá pegás todo lo que ya tenías (crear pedido, listar productos,
# historial, caja, estadísticas, etc.) SIN tocar nada.

# =====================
# CLIENTES LISTA (NUEVA VERSIÓN CON DEUDA)
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