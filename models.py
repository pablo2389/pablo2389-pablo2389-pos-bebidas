from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

# ============================================
# USUARIOS
# ============================================
class UsuarioBase(BaseModel):
    email: str
    nombre: str
    rol: str = "vendedor"  # 'admin', 'vendedor'

class UsuarioCreate(UsuarioBase):
    pass

class Usuario(UsuarioBase):
    id: int
    activo: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# ============================================
# PRODUCTOS
# ============================================
class ProductoBase(BaseModel):
    nombre: str
    precio: Decimal
    stock: int = 0
    categoria: Optional[str] = None

class ProductoCreate(ProductoBase):
    pass

class ProductoUpdate(BaseModel):
    nombre: Optional[str] = None
    precio: Optional[Decimal] = None
    stock: Optional[int] = None
    categoria: Optional[str] = None

class Producto(ProductoBase):
    id: int
    activo: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# ============================================
# METODOS DE PAGO
# ============================================
class MetodoPagoBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None

class MetodoPago(MetodoPagoBase):
    id: int
    activo: bool
    
    class Config:
        from_attributes = True

# ============================================
# DETALLES DE PEDIDO (items)
# ============================================
class PedidoItemBase(BaseModel):
    producto_id: int
    cantidad: int = Field(..., gt=0)
    precio_unitario: Decimal

class PedidoItemCreate(PedidoItemBase):
    pass

class PedidoItem(PedidoItemBase):
    id: int
    pedido_id: int
    subtotal: Decimal
    created_at: datetime
    
    class Config:
        from_attributes = True

# ============================================
# PEDIDOS (Ventas)
# ============================================
class PedidoBase(BaseModel):
    cliente: str
    telefono: Optional[str] = None
    metodo_pago: str  # 'Efectivo', 'Transferencia', 'Fiado'
    estado: str = "completado"  # 'pendiente', 'completado', 'cancelado'

class PedidoCreate(PedidoBase):
    items: List[PedidoItemCreate]  # Al menos 1 item
    descuento: Decimal = Decimal("0.00")

class Pedido(PedidoBase):
    id: int
    usuario_id: Optional[int] = None
    subtotal: Decimal
    descuento: Decimal
    total: Decimal
    fecha: datetime
    created_at: datetime
    items: List[PedidoItem] = []
    
    class Config:
        from_attributes = True

# ============================================
# RESPUESTAS
# ============================================
class RespuestaExito(BaseModel):
    mensaje: str
    datos: Optional[dict] = None

class RespuestaError(BaseModel):
    error: str
    detalles: Optional[str] = None

# ============================================
# ESTADÍSTICAS/DASHBOARD
# ============================================
class EstadisticasDiarias(BaseModel):
    fecha: str
    total_ventas: Decimal
    cantidad_pedidos: int
    cantidad_items: int
    metodos_pago: dict  # ej: {"Efectivo": 1000, "Transferencia": 500}

class ProductoTopVentas(BaseModel):
    id: int
    nombre: str
    cantidad_vendida: int
    ingresos_totales: Decimal
    categoria: Optional[str] = None