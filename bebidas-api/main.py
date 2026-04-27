from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import jwt
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
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
app = FastAPI(title="POS Bebidas API", version="2.0")



# =====================
# CORS
# =====================
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)



# =====================
# SECURITY / JWT
# =====================
security = HTTPBearer()


def verificar_token(
    token: HTTPAuthorizationCredentials = Depends(security),
) -> Dict[str, Any]:
    try:
        payload = jwt.decode(token.credentials, SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido")


def crear_token(user_id: int, email: str, rol: str, kiosco_id: str | None) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "rol": rol,
        "kiosco_id": kiosco_id,
        "exp": datetime.utcnow() + timedelta(days=30),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")



# =====================
# Pydantic Models
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


class CajaHoyResponse(BaseModel):
    total: float
    cantidad_pedidos: int
    por_metodo: Dict[str, float]


class ClienteResumen(BaseModel):
    nombre: str
    deuda_total: float
    compras_total: int


class CierreCajaResponse(BaseModel):
    fecha_cierre: str
    total_efectivo: float
    total_transferencia: float
    total_mp: float
    total_fiado: float
    total_vendido: float
    cantidad_pedidos: int
    productos_vendidos: List[Dict[str, Any]]
    resumen_categorias: Dict[str, float]



# =====================
# ENDPOINT RAÍZ
# =====================
@app.get("/")
def root():
    return {
        "mensaje": "API POS Bebidas funcionando",
        "version": "2.0",
        "status": "online"
    }



# =====================
# AUTH
# =====================
@app.post("/
auth/registrar")
def registrar(usuario: UsuarioCreate):
    print(f"DEBUG: email={usuario.email}, nombre={usuario.nombre}, password={usuario.password}")  # <-- AGREGAR
    
    existe = (
        supabase.table("usuarios")
        .select("id")
        .eq("email", usuario.email)
        .execute()
    )


    if existe.data:
        raise HTTPException(status_code=400, detail="Usuario ya existe")


    res = (
        supabase.table("usuarios")
        .insert(
            {
                "email": usuario.email,
                "nombre": usuario.nombre,
                "password": usuario.password,
                "rol": "vendedor",
            }
        )
        .execute()
    )


    if not res.data:
        raise HTTPException(status_code=500, detail="Error creando usuario")


    user = res.data[0]
    token = crear_token(user["id"], usuario.email, "vendedor", user.get("kiosco_id"))


    return {"token": token, "nombre": usuario.nombre, "rol": "vendedor"}



@app.post("/auth/login")
def login(credenciales: Login):
    res = (
        supabase.table("usuarios")
        .select("*")
        .eq("email", credenciales.email)
        .execute()
    )


    if not res.data:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")


    user = res.data[0]


    if user["password"] != credenciales.password:
        raise HTTPException(status_code=401, detail="Contraseña incorrecta")


    token = crear_token(
        user["id"],
        credenciales.email,
        user["rol"],
        user.get("kiosco_id"),
    )


    return {"token": token, "nombre": user["nombre"], "rol": user["rol"]}



# =====================
# PRODUCTOS
# =====================
@app.get("/productos")
def listar_productos(token_payload: dict = Depends(verificar_token)):
    kiosco_id = token_payload.get("kiosco_id")
    if not kiosco_id:
        raise HTTPException(status_code=400, detail="Usuario sin kiosco asignado")


    res = (
        supabase.table("productos")
        .select("*")
        .eq("kiosco_id", kiosco_id)
        .gt("stock", 0)
        .order("nombre")
        .execute()
    )
    return res.data



@app.get("/productos/{id}")
def obtener_producto(id: int, token_payload: dict = Depends(verificar_token)):
    kiosco_id = token_payload.get("kiosco_id")
    res = (
        supabase.table("productos")
        .select("*")
        .eq("id", id)
        .eq("kiosco_id", kiosco_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return res.data[0]



@app.post("/productos")
def crear_producto(producto: Producto, token_payload: dict = Depends(verificar_token)):
    kiosco_id = token_payload.get("kiosco_id")
    if not kiosco_id:
        raise HTTPException(status_code=400, detail="Usuario sin kiosco asignado")


    data = {
        "nombre": producto.nombre,
        "precio": producto.precio,
        "stock": producto.stock,
        "kiosco_id": kiosco_id,
    }
    res = supabase.table("productos").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Error creando producto")
    return res.data[0]



@app.put("/productos/{id}")
def actualizar_producto(
    id: int, producto: Producto, token_payload: dict = Depends(verificar_token)
):
    kiosco_id = token_payload.get("kiosco_id")
    data = {
        "nombre": producto.nombre,
        "precio": producto.precio,
        "stock": producto.stock,
    }
    supabase.table("productos").update(data).eq("id", id).eq("kiosco_id", kiosco_id).execute()
    return {"mensaje": "Producto actualizado"}



@app.delete("/productos/{id}")
def borrar_producto(id: int, token_payload: dict = Depends(verificar_token)):
    kiosco_id = token_payload.get("kiosco_id")
    supabase.table("productos").delete().eq("id", id).eq("kiosco_id", kiosco_id).execute()
    return {"mensaje": "Producto borrado"}



# =====================
# PEDIDOS
# =====================
@app.get("/pedidos")
def listar_pedidos(token_payload: dict = Depends(verificar_token)):
    kiosco_id = token_payload.get("kiosco_id")
    res = (
        supabase.table("pedidos")
        .select("*, pedido_items(*)")
        .eq("kiosco_id", kiosco_id)
        .order("created_at", desc=True)
        .limit(50)
        .execute()
    )
    return res.data



@app.post("/pedidos")
def crear_pedido(pedido: PedidoCreate, token_payload: dict = Depends(verificar_token)):
    kiosco_id = token_payload.get("kiosco_id")
    if not kiosco_id:
        raise HTTPException(status_code=400, detail="Usuario sin kiosco asignado")


    pedido_data = {
        "cliente": pedido.cliente,
        "metodo_pago": pedido.metodo_pago,
        "estado": "completado" if pedido.metodo_pago != "fiado" else "pendiente",
        "kiosco_id": kiosco_id,
    }
    pedido_res = supabase.table("pedidos").insert(pedido_data).execute()


    if not pedido_res.data:
        raise HTTPException(status_code=500, detail="Error creando pedido")


    pedido_row = pedido_res.data[0]
    pedido_id = pedido_row["id"]
    numero_ticket = pedido_row.get("numero_ticket")


    total = 0
    for item in pedido.items:
        prod_res = (
            supabase.table("productos")
            .select("precio, stock")
            .eq("id", item.producto_id)
            .eq("kiosco_id", kiosco_id)
            .execute()
        )
        if not prod_res.data:
            raise HTTPException(
                status_code=400,
                detail=f"Producto {item.producto_id} no encontrado",
            )


        precio = prod_res.data[0]["precio"]
        stock_actual = prod_res.data[0]["stock"]
        subtotal = precio * item.cantidad
        total += subtotal


        nuevo_stock = stock_actual - item.cantidad
        supabase.table("productos").update({"stock": nuevo_stock}).eq("id", item.producto_id).execute()


        supabase.table("pedido_items").insert(
            {
                "pedido_id": pedido_id,
                "producto_id": item.producto_id,
                "cantidad": item.cantidad,
                "precio_unitario": precio,
                "kiosco_id": kiosco_id,
            }
        ).execute()


    supabase.table("pedidos").update({"total": total}).eq("id", pedido_id).execute()


    return {
        "pedido_id": pedido_id,
        "numero_ticket": numero_ticket,
        "total": total,
    }



# =====================
# CAJA / DASHBOARD
# =====================
@app.get("/dashboard/caja-hoy", response_model=CajaHoyResponse)
def caja_hoy(token_payload: dict = Depends(verificar_token)):
    kiosco_id = token_payload.get("kiosco_id")
    if not kiosco_id:
        raise HTTPException(status_code=400, detail="Usuario sin kiosco asignado")


    hoy = datetime.now().strftime("%Y-%m-%d")


    res = (
        supabase.table("pedidos")
        .select("total, metodo_pago, created_at, estado")
        .eq("kiosco_id", kiosco_id)
        .gte("created_at", f"{hoy} 00:00:00")
        .lte("created_at", f"{hoy} 23:59:59")
        .execute()
    )


    pedidos = res.data or []


    def safe_total(p):
        valor = p.get("total")
        if valor is None or valor == "":
            return 0.0
        return float(valor)


    total = sum(safe_total(p) for p in pedidos)
    cantidad_pedidos = len(pedidos)


    por_metodo: Dict[str, float] = defaultdict(float)
    for p in pedidos:
        metodo = p.get("metodo_pago") or "desconocido"
        por_metodo[metodo] += safe_total(p)


    return {
        "total": total,
        "cantidad_pedidos": cantidad_pedidos,
        "por_metodo": dict(por_metodo),
    }



@app.get("/dashboard/productos-bajo-stock")
def productos_bajo_stock(token_payload: dict = Depends(verificar_token)):
    kiosco_id = token_payload.get("kiosco_id")
    res = (
        supabase.table("productos")
        .select("*")
        .eq("kiosco_id", kiosco_id)
        .lte("stock", 10)
        .execute()
    )
    return res.data



# =====================
# CIERRE DE CAJA - CORREGIDO
# =====================
@app.get("/caja/cierre-hoy", response_model=CierreCajaResponse)
def cierre_caja_hoy(token_payload: dict = Depends(verificar_token)):
    """
    Genera el cierre de caja del día actual con desglose completo
    """
    kiosco_id = token_payload.get("kiosco_id")
    if not kiosco_id:
        raise HTTPException(status_code=400, detail="Usuario sin kiosco asignado")


    hoy = datetime.now().strftime("%Y-%m-%d")


    pedidos_res = (
        supabase.table("pedidos")
        .select("id, total, metodo_pago, estado, created_at")
        .eq("kiosco_id", kiosco_id)
        .gte("created_at", f"{hoy} 00:00:00")
        .lte("created_at", f"{hoy} 23:59:59")
        .execute()
    )


    pedidos = pedidos_res.data or []


    total_efectivo = 0
    total_transferencia = 0
    total_mp = 0
    total_fiado = 0
    total_vendido = 0


    for pedido in pedidos:
        total_pedido = pedido.get("total")
        if total_pedido is None or total_pedido == "":
            monto = 0.0
        else:
            monto = float(total_pedido)

        metodo = pedido.get("metodo_pago", "").lower()


        total_vendido += monto


        if metodo == "efectivo":
            total_efectivo += monto
        elif metodo == "transferencia":
            total_transferencia += monto
        elif metodo == "mp":
            total_mp += monto
        elif metodo == "fiado":
            total_fiado += monto


    productos_vendidos = []
    if pedidos:
        items_res = (
            supabase.table("pedido_items")
            .select("producto_id, cantidad, precio_unitario")
            .in_("pedido_id", [p["id"] for p in pedidos])
            .execute()
        )


        productos_vendidos_dict = defaultdict(lambda: {"cantidad": 0, "total": 0, "nombre": ""})


        for item in items_res.data:
            prod_id = item["producto_id"]
            cantidad = item["cantidad"]

            precio_item = item.get("precio_unitario")
            if precio_item is None or precio_item == "":
                precio = 0.0
            else:
                precio = float(precio_item)


            prod_res = (
                supabase.table("productos")
                .select("nombre")
                .eq("id", prod_id)
                .execute()
            )


            nombre = "Producto desconocido"
            if prod_res.data:
                nombre = prod_res.data[0]["nombre"]


            productos_vendidos_dict[prod_id]["nombre"] = nombre
            productos_vendidos_dict[prod_id]["cantidad"] += cantidad
            productos_vendidos_dict[prod_id]["total"] += precio * cantidad


        productos_vendidos = [
            {
                "nombre": data["nombre"],
                "cantidad": data["cantidad"],
                "total": data["total"]
            }
            for data in productos_vendidos_dict.values()
        ]


        productos_vendidos.sort(key=lambda x: x["total"], reverse=True)


    return {
        "fecha_cierre": datetime.now().isoformat(),
        "total_efectivo": total_efectivo,
        "total_transferencia": total_transferencia,
        "total_mp": total_mp,
        "total_fiado": total_fiado,
        "total_vendido": total_vendido,
        "cantidad_pedidos": len(pedidos),
        "productos_vendidos": productos_vendidos,
        "resumen_categorias": {}
    }



# =====================
# HISTORIAL DE CLIENTES
# =====================
@app.get("/clientes/lista")
def lista_clientes(token_payload: dict = Depends(verificar_token)):
    kiosco_id = token_payload.get("kiosco_id")
    if not kiosco_id:
        raise HTTPException(status_code=400, detail="Usuario sin kiosco asignado")


    res = (
        supabase.table("pedidos")
        .select("cliente, total, estado, metodo_pago")
        .eq("kiosco_id", kiosco_id)
        .execute()
    )


    clientes_dict = {}


    for pedido in res.data:
        cliente = pedido["cliente"]

        total_pedido = pedido.get("total")
        if total_pedido is None or total_pedido == "":
            total = 0.0
        else:
            total = float(total_pedido)

        estado = pedido.get("estado", "pendiente").lower()
        metodo = pedido.get("metodo_pago", "").lower()


        if cliente not in clientes_dict:
            clientes_dict[cliente] = {
                "nombre": cliente,
                "deuda_total": 0,
                "compras_total": 0
            }


        clientes_dict[cliente]["compras_total"] += 1


        if estado == "pendiente" or metodo == "fiado":
            clientes_dict[cliente]["deuda_total"] += total


    return list(clientes_dict.values())



@app.get("/clientes/historial/{nombre_cliente}")
def obtener_historial_cliente(
    nombre_cliente: str,
    token_payload: dict = Depends(verificar_token)
):
    kiosco_id = token_payload.get("kiosco_id")
    if not kiosco_id:
        raise HTTPException(status_code=400, detail="Usuario sin kiosco asignado")


    pedidos_res = (
        supabase.table("pedidos")
        .select("id, numero_ticket, created_at, fecha, total, metodo_pago, estado")
        .eq("cliente", nombre_cliente)
        .eq("kiosco_id", kiosco_id)
        .order("created_at", desc=True)
        .execute()
    )


    pedidos = pedidos_res.data


    if not pedidos:
        raise HTTPException(
            status_code=404,
            detail=f"No se encontraron pedidos para {nombre_cliente}"
        )


    total_deuda = 0
    total_pagado = 0
    historial_compras = []


    for pedido in pedidos:
        total_pedido = pedido.get("total")
        if total_pedido is None or total_pedido == "":
            monto_pedido = 0.0
        else:
            monto_pedido = float(total_pedido)

        estado = pedido.get("estado", "pendiente").lower()
        metodo_pago = pedido.get("metodo_pago", "").lower()


        if metodo_pago == "fiado" or estado == "pendiente":
            total_deuda += monto_pedido
        else:
            total_pagado += monto_pedido


        items_res = (
            supabase.table("pedido_items")
            .select("cantidad, precio_unitario, producto_id")
            .eq("pedido_id", pedido["id"])
            .execute()
        )


        productos_detalle = []
        for item in items_res.data:
            prod_res = (
                supabase.table("productos")
                .select("nombre")
                .eq("id", item["producto_id"])
                .execute()
            )


            nombre_prod = "Producto desconocido"
            if prod_res.data:
                nombre_prod = prod_res.data[0]["nombre"]


            precio_item = item.get("precio_unitario")
            if precio_item is None or precio_item == "":
                precio_unit = 0.0
            else:
                precio_unit = float(precio_item)

            cantidad = item.get("cantidad", 0)


            productos_detalle.append({
                "nombre": nombre_prod,
                "cantidad": cantidad,
                "precio_unitario": precio_unit,
                "subtotal": precio_unit * cantidad
            })


        historial_compras.append({
            "pedido_id": pedido["id"],
            "numero_ticket": pedido.get("numero_ticket", pedido["id"]),
            "fecha": pedido.get("fecha") or pedido.get("created_at"),
            "total": monto_pedido,
            "metodo_pago": pedido.get("metodo_pago", "N/A"),
            "estado": estado,
            "productos": productos_detalle
        })


    ultima_compra = pedidos[0] if pedidos else None
    ultima_compra_fecha = None
    ultima_compra_monto = None


    if ultima_compra:
        ultima_compra_fecha = ultima_compra.get("fecha") or ultima_compra.get("created_at")
        total_uc = ultima_compra.get("total")
        if total_uc is None or total_uc == "":
            ultima_compra_monto = 0.0
        else:
            ultima_compra_monto = float(total_uc)


    estado_cuenta = "debe" if total_deuda > 0 else "al día"


    return {
        "nombre_cliente": nombre_cliente,
        "total_deuda": total_deuda,
        "total_pagado": total_pagado,
        "ultima_compra_fecha": ultima_compra_fecha,
        "ultima_compra_monto": ultima_compra_monto,
        "estado_cuenta": estado_cuenta,
        "cantidad_compras": len(pedidos),
        "historial_compras": historial_compras
    }



@app.post("/clientes/marcar-pagado/{pedido_id}")
def marcar_pedido_pagado(
    pedido_id: int,
    token_payload: dict = Depends(verificar_token)
):
    kiosco_id = token_payload.get("kiosco_id")
    if not kiosco_id:
        raise HTTPException(status_code=400, detail="Usuario sin kiosco asignado")


    res = (
        supabase.table("pedidos")
        .update({
            "estado": "completado",
            "metodo_pago": "efectivo"
        })
        .eq("id", pedido_id)
        .eq("kiosco_id", kiosco_id)
        .execute()
    )


    return {"mensaje": "Pedido marcado como pagado", "pedido_id": pedido_id}



# =====================
# USER INFO
# =====================
@app.get("/auth/yo")
def yo(token_payload: dict = Depends(verificar_token)):
    user_id = token_payload["user_id"]
    res = (
        supabase.table("usuarios")
        .select("nombre, rol, kiosco_id")
        .eq("id", user_id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return res.data[0]
