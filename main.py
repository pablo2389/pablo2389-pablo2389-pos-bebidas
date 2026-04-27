from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from typing import List, Optional
import requests
import os
from dotenv import load_dotenv
from decimal import Decimal
import jwt
import bcrypt

# Importar modelos
from models import (
    ProductoCreate, Producto, ProductoUpdate,
    PedidoCreate, Pedido, PedidoItem,
    UsuarioCreate, Usuario,
    EstadisticasDiarias, ProductoTopVentas,
    RespuestaExito, RespuestaError
)

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise Exception("Faltan variables SUPABASE_URL y SUPABASE_KEY")

app = FastAPI(title="API POS Bebidas", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}

# ============================================
# CONFIGURACIÓN JWT
# ============================================
SECRET_KEY = os.getenv("SECRET_KEY", "tu-clave-secreta-cambiar-en-produccion")
ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    """Encriptar contraseña con bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode(), salt).decode()


def verify_password(password: str, hashed: str) -> bool:
    """Verificar contraseña encriptada"""
    return bcrypt.checkpw(password.encode(), hashed.encode())


def crear_token_jwt(usuario_id: int, email: str, kiosco_id: Optional[str]) -> str:
    """Crear token JWT con kiosco_id"""
    payload = {
        "usuario_id": usuario_id,
        "email": email,
        "kiosco_id": kiosco_id,
        "exp": datetime.utcnow() + timedelta(days=7),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def verificar_token_jwt(authorization: Optional[str] = Query(None)) -> dict:
    """Verificar token JWT y obtener datos del usuario"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Token requerido")

    try:
        parts = authorization.split()
        if len(parts) != 2 or parts[0] != "Bearer":
            token = authorization
        else:
            token = parts[1]

        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

# ============================================
# HELPER: Hacer requests a Supabase
# ============================================
def hacer_request(metodo: str, tabla: str, payload=None, filtros: str = ""):
    """Helper para hacer requests a Supabase"""
    url = f"{SUPABASE_URL}/rest/v1/{tabla}"
    if filtros:
        url += filtros

    try:
        if metodo == "GET":
            res = requests.get(url, headers=HEADERS)
        elif metodo == "POST":
            res = requests.post(url, headers=HEADERS, json=payload)
        elif metodo == "PUT":
            res = requests.put(url, headers=HEADERS, json=payload)
        elif metodo == "DELETE":
            res = requests.delete(url, headers=HEADERS)
        else:
            raise Exception(f"Método HTTP no soportado: {metodo}")

        if res.status_code >= 400:
            raise HTTPException(status_code=res.status_code, detail=res.text)

        return res.json() if res.text else []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# ENDPOINTS: PRODUCTOS (multi-kiosco)
# ============================================
@app.get("/productos", response_model=List[Producto])
def obtener_productos(
    activo: Optional[bool] = None,
    usuario_data: dict = Depends(verificar_token_jwt),
):
    """Obtener productos del kiosco del usuario"""
    kiosco_id = usuario_data.get("kiosco_id")
    if not kiosco_id:
        raise HTTPException(status_code=400, detail="Usuario sin kiosco asignado")

    filtros = f"?kiosco_id=eq.{kiosco_id}"
    if activo:
        filtros += "&activo=eq.true"

    return hacer_request("GET", "productos", filtros=filtros)


@app.get("/productos/{producto_id}", response_model=Producto)
def obtener_producto(
    producto_id: int,
    usuario_data: dict = Depends(verificar_token_jwt),
):
    """Obtener un producto por ID (solo del kiosco)"""
    kiosco_id = usuario_data.get("kiosco_id")
    filtros = f"?id=eq.{producto_id}&kiosco_id=eq.{kiosco_id}"
    resultado = hacer_request("GET", "productos", filtros=filtros)
    if not resultado:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return resultado[0]


@app.post("/productos", response_model=dict)
def crear_producto(
    producto: ProductoCreate,
    usuario_data: dict = Depends(verificar_token_jwt),
):
    """Crear un nuevo producto para el kiosco del usuario"""
    kiosco_id = usuario_data.get("kiosco_id")
    if not kiosco_id:
        raise HTTPException(status_code=400, detail="Usuario sin kiosco asignado")

    payload = {
        "nombre": producto.nombre,
        "precio": float(producto.precio),
        "stock": producto.stock,
        "categoria": producto.categoria,
        "activo": True,
        "kiosco_id": kiosco_id,
    }
    resultado = hacer_request("POST", "productos", payload=payload)
    return {"id": resultado[0]["id"], "mensaje": "Producto creado"}


@app.put("/productos/{producto_id}", response_model=dict)
def actualizar_producto(
    producto_id: int,
    producto: ProductoUpdate,
    usuario_data: dict = Depends(verificar_token_jwt),
):
    """Actualizar un producto del kiosco"""
    kiosco_id = usuario_data.get("kiosco_id")
    payload = {k: v for k, v in producto.dict().items() if v is not None}
    if "precio" in payload:
        payload["precio"] = float(payload["precio"])

    filtros = f"?id=eq.{producto_id}&kiosco_id=eq.{kiosco_id}"
    hacer_request("PUT", "productos", payload=payload, filtros=filtros)
    return {"mensaje": "Producto actualizado"}


@app.delete("/productos/{producto_id}", response_model=dict)
def eliminar_producto(
    producto_id: int,
    usuario_data: dict = Depends(verificar_token_jwt),
):
    """Soft delete de producto del kiosco"""
    kiosco_id = usuario_data.get("kiosco_id")
    filtros = f"?id=eq.{producto_id}&kiosco_id=eq.{kiosco_id}"
    hacer_request("PUT", "productos", payload={"activo": False}, filtros=filtros)
    return {"mensaje": "Producto eliminado"}

# ============================================
# ENDPOINTS: PEDIDOS / VENTAS (multi-kiosco)
# ============================================
@app.get("/pedidos", response_model=List[Pedido])
def obtener_pedidos(
    estado: Optional[str] = None,
    usuario_data: dict = Depends(verificar_token_jwt),
):
    """Obtener pedidos del kiosco del usuario"""
    kiosco_id = usuario_data.get("kiosco_id")
    if not kiosco_id:
        raise HTTPException(status_code=400, detail="Usuario sin kiosco asignado")

    filtros = f"?kiosco_id=eq.{kiosco_id}"
    if estado:
        filtros += f"&estado=eq.{estado}"

    return hacer_request("GET", "pedidos", filtros=filtros)


@app.get("/pedidos/{pedido_id}", response_model=Pedido)
def obtener_pedido(
    pedido_id: int,
    usuario_data: dict = Depends(verificar_token_jwt),
):
    """Obtener un pedido por ID con sus items (solo del kiosco)"""
    kiosco_id = usuario_data.get("kiosco_id")
    if not kiosco_id:
        raise HTTPException(status_code=400, detail="Usuario sin kiosco asignado")

    filtros = f"?id=eq.{pedido_id}&kiosco_id=eq.{kiosco_id}"
    resultado = hacer_request("GET", "pedidos", filtros=filtros)
    if not resultado:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    pedido = resultado[0]
    items = hacer_request(
        "GET",
        "pedido_items",
        filtros=f"?pedido_id=eq.{pedido_id}&kiosco_id=eq.{kiosco_id}",
    )
    pedido["items"] = items

    return pedido


@app.post("/pedidos", response_model=dict)
def crear_pedido(
    pedido: PedidoCreate,
    usuario_data: dict = Depends(verificar_token_jwt),
):
    """Crear un nuevo pedido/venta para el kiosco del usuario"""
    kiosco_id = usuario_data.get("kiosco_id")
    if not kiosco_id:
        raise HTTPException(status_code=400, detail="Usuario sin kiosco asignado")

    if not pedido.items:
        raise HTTPException(status_code=400, detail="El pedido debe tener al menos 1 item")

    subtotal = sum(item.cantidad * item.precio_unitario for item in pedido.items)
    total = subtotal - pedido.descuento

    payload_pedido = {
        "cliente": pedido.cliente,
        "telefono": pedido.telefono,
        "metodo_pago": pedido.metodo_pago,
        "estado": pedido.estado,
        "subtotal": float(subtotal),
        "descuento": float(pedido.descuento),
        "total": float(total),
        "fecha": datetime.now().isoformat(),
        "kiosco_id": kiosco_id,
    }

    resultado = hacer_request("POST", "pedidos", payload=payload_pedido)
    pedido_id = resultado[0]["id"]

    for item in pedido.items:
        payload_item = {
            "pedido_id": pedido_id,
            "producto_id": item.producto_id,
            "cantidad": item.cantidad,
            "precio_unitario": float(item.precio_unitario),
            "kiosco_id": kiosco_id,
        }
        hacer_request("POST", "pedido_items", payload=payload_item)

    return {"id": pedido_id, "mensaje": "Pedido creado", "total": float(total)}

# ============================================
# ENDPOINTS: ESTADÍSTICAS Y DASHBOARD (por kiosco)
# ============================================
@app.get("/estadisticas/diarias", response_model=EstadisticasDiarias)
def estadisticas_diarias(
    fecha: Optional[str] = None,
    usuario_data: dict = Depends(verificar_token_jwt),
):
    """Estadísticas de ventas de un día, por kiosco"""
    kiosco_id = usuario_data.get("kiosco_id")
    if not kiosco_id:
        raise HTTPException(status_code=400, detail="Usuario sin kiosco asignado")

    if not fecha:
        fecha = datetime.now().strftime("%Y-%m-%d")

    pedidos = hacer_request(
        "GET",
        "pedidos",
        filtros=f"?kiosco_id=eq.{kiosco_id}&fecha=gte.{fecha}T00:00:00&fecha=lt.{fecha}T23:59:59",
    )

    total_ventas = sum(p.get("total", 0) for p in pedidos)
    cantidad_pedidos = len(pedidos)

    items_totales = 0
    metodos_pago = {"Efectivo": 0, "Transferencia": 0, "Fiado": 0}

    for pedido in pedidos:
        mp = pedido.get("metodo_pago", "Efectivo")
        if mp not in metodos_pago:
            metodos_pago[mp] = 0
        metodos_pago[mp] += pedido.get("total", 0)

        items = hacer_request(
            "GET",
            "pedido_items",
            filtros=f"?pedido_id=eq.{pedido['id']}&kiosco_id=eq.{kiosco_id}",
        )
        items_totales += sum(i.get("cantidad", 0) for i in items)

    return {
        "fecha": fecha,
        "total_ventas": Decimal(str(total_ventas)),
        "cantidad_pedidos": cantidad_pedidos,
        "cantidad_items": items_totales,
        "metodos_pago": metodos_pago,
    }


@app.get("/estadisticas/top-productos", response_model=List[ProductoTopVentas])
def top_productos(
    limite: int = Query(5, ge=1, le=20),
    dias: int = Query(30, ge=1),
    usuario_data: dict = Depends(verificar_token_jwt),
):
    """Top N productos más vendidos del kiosco en los últimos N días"""
    kiosco_id = usuario_data.get("kiosco_id")
    if not kiosco_id:
        raise HTTPException(status_code=400, detail="Usuario sin kiosco asignado")

    fecha_desde = (datetime.now() - timedelta(days=dias)).strftime("%Y-%m-%d")

    pedidos = hacer_request(
        "GET",
        "pedidos",
        filtros=f"?kiosco_id=eq.{kiosco_id}&fecha=gte.{fecha_desde}T00:00:00",
    )

    productos_vendidos = {}

    for pedido in pedidos:
        items = hacer_request(
            "GET",
            "pedido_items",
            filtros=f"?pedido_id=eq.{pedido['id']}&kiosco_id=eq.{kiosco_id}",
        )

        for item in items:
            prod_id = item["producto_id"]
            if prod_id not in productos_vendidos:
                productos_vendidos[prod_id] = {
                    "nombre": "",
                    "cantidad": 0,
                    "ingresos": Decimal("0"),
                    "categoria": None,
                }

            productos_vendidos[prod_id]["cantidad"] += item.get("cantidad", 0)
            productos_vendidos[prod_id]["ingresos"] += Decimal(
                str(item.get("cantidad", 0) * item.get("precio_unitario", 0))
            )

    top = []
    for prod_id, datos in list(productos_vendidos.items()):
        producto = hacer_request(
            "GET",
            "productos",
            filtros=f"?id=eq.{prod_id}&kiosco_id=eq.{kiosco_id}",
        )
        if producto:
            top.append({
                "id": prod_id,
                "nombre": producto[0].get("nombre", ""),
                "cantidad_vendida": datos["cantidad"],
                "ingresos_totales": datos["ingresos"],
                "categoria": producto[0].get("categoria"),
            })

    top_ordenado = sorted(top, key=lambda x: x["cantidad_vendida"], reverse=True)
    return top_ordenado[:limite]

# ============================================
# ENDPOINTS: AUTENTICACIÓN
# ============================================
@app.post("/auth/registrar", response_model=dict)
def registrar(usuario: UsuarioCreate):
    """Registrar un nuevo usuario (sin contraseña por ahora)"""
    usuarios_existentes = hacer_request("GET", "usuarios", filtros=f"?email=eq.{usuario.email}")
    if usuarios_existentes:
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    payload = {
        "email": usuario.email,
        "nombre": usuario.nombre,
        "rol": usuario.rol or "vendedor",
        "activo": True,
        # kiosco_id se asigna luego vía SQL/panel
    }

    resultado = hacer_request("POST", "usuarios", payload=payload)
    usuario_creado = resultado[0]
    usuario_id = usuario_creado["id"]
    kiosco_id = usuario_creado.get("kiosco_id")

    token = crear_token_jwt(usuario_id, usuario.email, kiosco_id)

    return {
        "id": usuario_id,
        "email": usuario.email,
        "token": token,
        "mensaje": "Usuario registrado exitosamente",
    }


@app.post("/auth/login", response_model=dict)
def login(email: str, password: str):
    """Login (por ahora no verifica password)"""
    usuarios = hacer_request("GET", "usuarios", filtros=f"?email=eq.{email}")

    if not usuarios:
        raise HTTPException(status_code=401, detail="Email no encontrado")

    usuario = usuarios[0]

    if not usuario.get("activo"):
        raise HTTPException(status_code=403, detail="Usuario desactivado")

    kiosco_id = usuario.get("kiosco_id")

    token = crear_token_jwt(usuario["id"], usuario["email"], kiosco_id)

    return {
        "id": usuario["id"],
        "email": usuario["email"],
        "nombre": usuario["nombre"],
        "rol": usuario["rol"],
        "token": token,
        "mensaje": "Login exitoso",
    }


@app.get("/usuarios/me", response_model=Usuario)
def obtener_usuario_actual(authorization: str = Query(..., description="Token JWT")):
    """Obtener datos del usuario autenticado"""
    usuario_data = verificar_token_jwt(authorization)
    usuario_id = usuario_data.get("usuario_id")
    usuarios = hacer_request("GET", "usuarios", filtros=f"?id=eq.{usuario_id}")

    if not usuarios:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return usuarios[0]

# ============================================
# ENDPOINTS: USUARIOS
# ============================================
@app.get("/usuarios", response_model=List[Usuario])
def obtener_usuarios():
    """Obtener todos los usuarios"""
    return hacer_request("GET", "usuarios")


@app.post("/usuarios", response_model=dict)
def crear_usuario(usuario: UsuarioCreate):
    """Crear un nuevo usuario (sin token)"""
    payload = {
        "email": usuario.email,
        "nombre": usuario.nombre,
        "rol": usuario.rol,
        "activo": True,
        # kiosco_id se puede asignar después
    }
    resultado = hacer_request("POST", "usuarios", payload=payload)
    return {"id": resultado[0]["id"], "mensaje": "Usuario creado"}

# ============================================
# HEALTH CHECK
# ============================================
@app.get("/health")
def health():
    """Verificar que la API está funcionando"""
    return {"status": "ok", "timestamp": datetime.now().isoformat()}