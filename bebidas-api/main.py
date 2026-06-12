from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import jwt
import uuid
import bcrypt
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
SECRET_KEY = os.getenv("SECRET_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise Exception("Faltan SUPABASE_URL o SUPABASE_KEY")

if not SECRET_KEY:
    raise Exception("Falta SECRET_KEY en variables de entorno")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# =====================
# CORS
# =====================
# En deploys transitorios podemos permitir todos los orígenes mientras
# verificamos que el dominio de Vercel esté correctamente configurado.
# IMPORTANTE: sustituir por orígenes concretos en producción.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # temporal
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================
# AUTH & SECURITY
# =====================
security = HTTPBearer()


def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash. Handles both new hashes and old plaintext."""
    try:
        # Try to verify as bcrypt hash
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except (ValueError, TypeError):
        # If bcrypt fails, it might be an old plaintext password
        # Return True if plaintext matches (for migration)
        return plain_password == hashed_password


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
    producto_id: Optional[int] = None
    descripcion: Optional[str] = None
    precio: Optional[float] = None
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

    # Verify password (handles both hashed and plaintext for migration)
    if not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Password incorrecto")

    # Auto-migrate old plaintext passwords to bcrypt hash
    if user["password"] == data.password:  # Old plaintext detected
        new_hash = hash_password(data.password)
        supabase.table("usuarios").update({"password": new_hash}).eq("id", user["id"]).execute()
        print(f"[SECURITY] Auto-migrated plaintext password for user {user['email']} to bcrypt")

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

    password_hash = hash_password(usuario.password)

    res = supabase.table("usuarios").insert(
        {
            "email": usuario.email,
            "nombre": usuario.nombre,
            "password": password_hash,
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
# PEDIDOS
# =====================
@app.post("/pedidos")
def crear_pedido(pedido: PedidoCreate, token=Depends(verificar_token)):
    kiosco_id = token["kiosco_id"]

    total = 0.0
    items_guardar: List[Dict] = []

    # 1) Validar/crear productos y calcular total
    for item in pedido.items:
        # Si viene producto_id -> usar flujo actual (producto ya existe)
        if item.producto_id is not None:
            producto_res = (
                supabase.table("productos")
                .select("id, precio, stock")
                .eq("id", item.producto_id)
                .eq("kiosco_id", kiosco_id)
                .execute()
            )

            if not producto_res.data:
                raise HTTPException(
                    status_code=404,
                    detail=f"Producto {item.producto_id} no encontrado",
                )

            producto = producto_res.data[0]
            producto_id = producto["id"]
            precio = float(producto["precio"])

        else:
            # Si NO viene producto_id -> crear producto al vuelo en Supabase
            nuevo_prod_res = (
                supabase.table("productos")
                .insert(
                    {
                        "kiosco_id": kiosco_id,
                        "nombre": item.descripcion,
                        "precio": item.precio,
                        "stock": None,  # o 0 si preferís
                    }
                )
                .execute()
            )

            if not nuevo_prod_res.data:
                raise HTTPException(
                    status_code=500,
                    detail="No se pudo crear el producto",
                )

            nuevo_prod = nuevo_prod_res.data[0]
            producto_id = nuevo_prod["id"]
            precio = float(nuevo_prod["precio"])

        total += precio * item.cantidad

        items_guardar.append(
            {
                "producto_id": producto_id,
                "cantidad": item.cantidad,
                "precio_unitario": precio,
            }
        )

    # 2) Crear pedido
    pedido_db = (
        supabase.table("pedidos")
        .insert(
            {
                "kiosco_id": kiosco_id,
                "cliente": pedido.cliente,
                # "telefono": pedido.telefono,
                "metodo_pago": pedido.metodo_pago,
                "estado": pedido.estado,
                "total": total,
                "created_at": datetime.utcnow().isoformat(),
            }
        )
        .execute()
    )

    print("DEBUG pedido_db:", pedido_db)

    if not pedido_db.data:
        raise HTTPException(status_code=500, detail="Error al crear pedido")

    pedido_id = pedido_db.data[0]["id"]

    # 3) CLIENTE AUTOCREADO (igual que antes)
    nombre_cliente = (pedido.cliente or "").strip()
    telefono_cliente = (pedido.telefono or "").strip()

    if nombre_cliente:
        cli_res = (
            supabase.table("clientes")
            .select("id")
            .eq("kiosco_id", kiosco_id)
            .eq("nombre", nombre_cliente)
            .execute()
        )

        if not cli_res.data:
            supabase.table("clientes").insert(
                {
                    "kiosco_id": kiosco_id,
                    "nombre": nombre_cliente,
                    "telefono": telefono_cliente,
                }
            ).execute()

    # 4) Insertar items
    for item in items_guardar:
        item["pedido_id"] = pedido_id
        supabase.table("pedido_items").insert(item).execute()

    # 5) Actualizar stock
    for item in items_guardar:
        producto_res = (
            supabase.table("productos")
            .select("stock")
            .eq("id", item["producto_id"])
            .eq("kiosco_id", kiosco_id)
            .execute()
        )

        if producto_res.data:
            producto = producto_res.data[0]
            stock_actual = int(producto["stock"]) if producto["stock"] is not None else 0
            nuevo_stock = stock_actual - item["cantidad"]

            supabase.table("productos").update(
                {"stock": nuevo_stock}
            ).eq("id", item["producto_id"]).execute()

    return {
        "message": "Pedido creado",
        "total": total,
        "pedido_id": pedido_id,
    }

# =====================
# PRODUCTOS
# =====================
@app.get("/productos", response_model=List[ProductoOut])
def listar_productos(token=Depends(verificar_token)):
    kiosco_id = token["kiosco_id"]

    res = (
        supabase.table("productos")
        .select("*")
        .eq("kiosco_id", kiosco_id)
        .order("id")
        .execute()
    )

    return res.data or []


@app.post("/productos", response_model=ProductoOut)
def crear_producto(data: ProductoCreate, token=Depends(verificar_token)):
    kiosco_id = token["kiosco_id"]

    payload = {
        "kiosco_id": kiosco_id,
        "nombre": data.nombre,
        "precio": data.precio,
        "stock": data.stock,
    }

    res = supabase.table("productos").insert(payload).execute()

    if not res.data:
        raise HTTPException(status_code=500, detail="Error al crear producto")

    return res.data[0]

# =====================
# CLIENTES LISTA (NUEVA CON DEUDA)
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

# =====================
# HISTORIAL POR CLIENTE
# =====================
@app.get("/clientes/historial/{nombre_cliente}")
def historial_cliente(nombre_cliente: str, token=Depends(verificar_token)):
    kiosco_id = token["kiosco_id"]

    nombre_cliente = nombre_cliente.strip()

    # Traer solo pedidos de este kiosco y de ese cliente exacto
    res_pedidos = (
        supabase.table("pedidos")
        .select("id, total, metodo_pago, estado, created_at, cliente")
        .eq("kiosco_id", kiosco_id)
        .eq("cliente", nombre_cliente)
        .order("created_at", desc=True)
        .execute()
    )

    pedidos = res_pedidos.data or []

    if not pedidos:
        return {
            "nombre_cliente": nombre_cliente,
            "total_deuda": 0.0,
            "total_pagado": 0.0,
            "ultima_compra_fecha": None,
            "ultima_compra_monto": None,
            "estado_cuenta": "al_dia",
            "cantidad_compras": 0,
            "historial_compras": [],
        }

    historial_compras = []
    total_deuda = 0.0
    total_pagado = 0.0

    # Recorremos cada pedido real del cliente
    for pedido in pedidos:
        pedido_id = int(pedido.get("id"))
        total = float(pedido.get("total") or 0)
        metodo_pago = (pedido.get("metodo_pago") or "").lower()
        estado = (pedido.get("estado") or "").lower()

        # Deuda = fiado o pendiente, Pagado = resto
        if metodo_pago == "fiado" or estado == "pendiente":
            total_deuda += total
        else:
            total_pagado += total

        # Productos del pedido (usando relación pedido_items_producto_fk(nombre))
        res_items = (
            supabase.table("pedido_items")
            .select(
                "producto_id, cantidad, precio_unitario, "
                "pedido_items_producto_fk(nombre)"
            )
            .eq("pedido_id", pedido_id)
            .execute()
        )

        items = res_items.data or []

        productos = []
        for it in items:
            prod_id = it.get("producto_id")
            cantidad = int(it.get("cantidad") or 0)
            precio_unitario = float(it.get("precio_unitario") or 0)

            # Relación: { pedido_items_producto_fk: { nombre: "Gelatina" } }
            prod_rel = it.get("pedido_items_producto_fk")
            nombre_prod = prod_rel.get("nombre") if isinstance(prod_rel, dict) else None

            productos.append(
                {
                    "nombre": nombre_prod or f"Producto #{prod_id}",
                    "cantidad": cantidad,
                    "precio_unitario": precio_unitario,
                    "subtotal": precio_unitario * cantidad,
                }
            )

        historial_compras.append(
            {
                "pedido_id": pedido_id,
                "numero_ticket": pedido_id,
                "fecha": pedido.get("created_at"),
                "total": total,
                "metodo_pago": metodo_pago,
                "estado": estado,
                "productos": productos,
            }
        )

    # La última compra es el primer pedido por created_at desc
    ultima_compra = pedidos[0]
    ultima_compra_fecha = ultima_compra.get("created_at")
    ultima_compra_monto = float(ultima_compra.get("total") or 0)

    estado_cuenta = "debe" if total_deuda > 0 else "al_dia"

    return {
        "nombre_cliente": nombre_cliente,
        "total_deuda": total_deuda,
        "total_pagado": total_pagado,
        "ultima_compra_fecha": ultima_compra_fecha,
        "ultima_compra_monto": ultima_compra_monto,
        "estado_cuenta": estado_cuenta,
        "cantidad_compras": len(pedidos),
        "historial_compras": historial_compras,
    }

# =====================
# MARCAR PEDIDO COMO PAGADO
# =====================
@app.post("/clientes/marcar-pagado/{pedido_id}")
def marcar_pedido_pagado(pedido_id: int, token=Depends(verificar_token)):
    kiosco_id = token["kiosco_id"]

    # Verificar que el pedido pertenezca al kiosco
    res = (
        supabase.table("pedidos")
        .select("id, metodo_pago, estado")
        .eq("id", pedido_id)
        .eq("kiosco_id", kiosco_id)
        .execute()
    )

    if not res.data:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    # Actualizar estado y método de pago si querés marcar como pagado
    supabase.table("pedidos").update(
        {
            "estado": "pagado",
            # "metodo_pago": "efectivo",
        }
    ).eq("id", pedido_id).execute()

    return {"message": "Pedido marcado como pagado"}

# =====================
# ESTADÍSTICAS
# =====================
@app.get("/estadisticas/diarias")
def obtener_estadisticas_diarias(fecha: str, token=Depends(verificar_token)):
    kiosco_id = token["kiosco_id"]

    res = (
        supabase.table("pedidos")
        .select("total, metodo_pago")
        .eq("kiosco_id", kiosco_id)
        .gte("created_at", f"{fecha}T00:00:00")
        .lte("created_at", f"{fecha}T23:59:59")
        .execute()
    )

    pedidos = res.data or []

    total_ventas = sum(float(p["total"]) for p in pedidos)

    metodos: Dict[str, float] = {}
    for p in pedidos:
        metodo = p["metodo_pago"]
        metodos[metodo] = metodos.get(metodo, 0) + float(p["total"])

    return {
        "fecha": fecha,
        "total_ventas": total_ventas,
        "cantidad_pedidos": len(pedidos),
        "metodos_pago": metodos,
    }

# =====================
# DASHBOARD STOCK
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

# =====================
# CAJA / CIERRE DE HOY
# =====================
@app.get("/caja/cierre-hoy")
def cierre_caja_hoy(token=Depends(verificar_token)):
    kiosco_id = token["kiosco_id"]

    hoy = datetime.utcnow().date().isoformat()

    res_pedidos = (
        supabase.table("pedidos")
        .select("id, total, metodo_pago, estado, created_at")
        .eq("kiosco_id", kiosco_id)
        .gte("created_at", f"{hoy}T00:00:00")
        .lte("created_at", f"{hoy}T23:59:59")
        .execute()
    )

    pedidos = res_pedidos.data or []
    cantidad_pedidos = len(pedidos)

    total_efectivo = 0.0
    total_transferencia = 0.0
    total_mp = 0.0
    total_fiado = 0.0

    for p in pedidos:
        total = float(p["total"])
        mp = p["metodo_pago"]

        if mp == "efectivo":
            total_efectivo += total
        elif mp == "transferencia":
            total_transferencia += total
        elif mp in ("mp", "mercado_pago", "mercadopago"):
            total_mp += total
        elif mp == "fiado":
            total_fiado += total

    total_vendido = total_efectivo + total_transferencia + total_mp + total_fiado

    # Evitamos romper la consulta in_ si no hay pedidos hoy
    lista_ids = [p["id"] for p in pedidos] if pedidos else [-1]

    res_items = (
        supabase.table("pedido_items")
        .select(
            "producto_id, cantidad, precio_unitario, "
            "pedido_items_producto_fk(nombre)"
        )
        .in_("pedido_id", lista_ids)
        .execute()
    )

    items = res_items.data or []
    productos_map: Dict[int, Dict] = {}

    for it in items:
        pid = it["producto_id"]

        prod_rel = it.get("pedido_items_producto_fk")
        nombre_prod = prod_rel.get("nombre") if isinstance(prod_rel, dict) else None

        cantidad = it["cantidad"]
        total_item = float(it["precio_unitario"]) * cantidad

        if pid not in productos_map:
            productos_map[pid] = {
                "nombre": nombre_prod or "Producto",
                "cantidad": 0,
                "total": 0.0,
            }

        productos_map[pid]["cantidad"] += cantidad
        productos_map[pid]["total"] += total_item

    productos_vendidos = list(productos_map.values())

    return {
        "fecha_cierre": hoy,
        "total_efectivo": total_efectivo,
        "total_transferencia": total_transferencia,
        "total_mp": total_mp,
        "total_fiado": total_fiado,
        "total_vendido": total_vendido,
        "cantidad_pedidos": cantidad_pedidos,
        "productos_vendidos": productos_vendidos,
    }

# =====================
# CAJA / HISTORIAL DIARIO POR FECHA
# =====================
@app.get("/caja/historial-diario")
def historial_diario(fecha: str, token=Depends(verificar_token)):
    kiosco_id = token["kiosco_id"]

    try:
        datetime.strptime(fecha, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Fecha inválida, usar YYYY-MM-DD")

    res_pedidos = (
        supabase.table("pedidos")
        .select("id, total, metodo_pago, estado, created_at, cliente")
        .eq("kiosco_id", kiosco_id)
        .gte("created_at", f"{fecha}T00:00:00")
        .lte("created_at", f"{fecha}T23:59:59")
        .order("created_at", desc=True)
        .execute()
    )

    pedidos = res_pedidos.data or []

    total_efectivo = 0.0
    total_transferencia = 0.0
    total_mp = 0.0
    total_fiado = 0.0

    for p in pedidos:
        total = float(p.get("total") or 0)
        mp = (p.get("metodo_pago") or "").lower()

        if mp == "efectivo":
            total_efectivo += total
        elif mp == "transferencia":
            total_transferencia += total
        elif mp in ("mp", "mercado_pago", "mercadopago"):
            total_mp += total
        elif mp == "fiado":
            total_fiado += total

    total_vendido = total_efectivo + total_transferencia + total_mp + total_fiado

    lista_ids = [p["id"] for p in pedidos] if pedidos else [-1]

    res_items = (
        supabase.table("pedido_items")
        .select(
            "pedido_id, producto_id, cantidad, precio_unitario, "
            "pedido_items_producto_fk(nombre)"
        )
        .in_("pedido_id", lista_ids)
        .execute()
    )

    items = res_items.data or []
    productos_map: Dict[int, Dict] = {}

    for it in items:
        pid_prod = it["producto_id"]
        prod_rel = it.get("pedido_items_producto_fk")
        nombre_prod = prod_rel.get("nombre") if isinstance(prod_rel, dict) else None
        cantidad = int(it.get("cantidad") or 0)
        total_item = float(it.get("precio_unitario") or 0) * cantidad

        if pid_prod not in productos_map:
            productos_map[pid_prod] = {
                "nombre": nombre_prod or "Producto",
                "cantidad": 0,
                "total": 0.0,
            }

        productos_map[pid_prod]["cantidad"] += cantidad
        productos_map[pid_prod]["total"] += total_item

    productos_vendidos = list(productos_map.values())

    historial_pedidos = []
    for p in pedidos:
        historial_pedidos.append(
            {
                "id": p["id"],
                "cliente": p.get("cliente"),
                "total": float(p.get("total") or 0),
                "metodo_pago": p.get("metodo_pago"),
                "estado": p.get("estado"),
                "created_at": p.get("created_at"),
            }
        )

    return {
        "fecha": fecha,
        "total_efectivo": total_efectivo,
        "total_transferencia": total_transferencia,
        "total_mp": total_mp,
        "total_fiado": total_fiado,
        "total_vendido": total_vendido,
        "cantidad_pedidos": len(pedidos),
        "productos_vendidos": productos_vendidos,
        "historial_pedidos": historial_pedidos,
    }