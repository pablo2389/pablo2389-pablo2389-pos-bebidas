"use client";

import { useEffect, useState } from "react";
import { api } from "../utils/api";

type Producto = {
  id: number;
  nombre: string;
  precio: number;
  stock: number | null;
};

type Item = {
  producto_id: number;
  descripcion: string;
  precio: number;
  cantidad: number;
};

export default function POSPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productoSeleccionadoId, setProductoSeleccionadoId] = useState<number | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [carrito, setCarrito] = useState<Item[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      const res = await api("/productos", { method: "GET" });
      const data: Producto[] = await res.json();
      setProductos(data);
      if (data.length > 0) {
        // primer producto por defecto: su ID REAL (por ejemplo 19)
        setProductoSeleccionadoId(data[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar productos");
    }
  };

  const agregarItem = () => {
    if (!productoSeleccionadoId || cantidad <= 0) return;

    const prod = productos.find((p) => p.id === productoSeleccionadoId);
    if (!prod) return;

    const nuevoItem: Item = {
      producto_id: prod.id,      // <- usa SIEMPRE el id real (19, 20, etc.)
      descripcion: prod.nombre,
      precio: prod.precio,
      cantidad,
    };

    setCarrito((prev) => [...prev, nuevoItem]);
    setCantidad(1);
  };

  const total = carrito.reduce(
    (acc, item) => acc + item.precio * item.cantidad,
    0
  );

  const confirmarVenta = async () => {
    if (carrito.length === 0) {
      setError("No hay ítems en el carrito");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const body = {
        cliente: "Mostrador",
        telefono: "",
        metodo_pago: "efectivo",
        estado: "completado",
        descuento: 0,
        items: carrito.map((i) => ({
          producto_id: i.producto_id,
          cantidad: i.cantidad,
        })),
      };

      await api("/pedidos", {
        method: "POST",
        body: JSON.stringify(body),
      });

      setCarrito([]);
    } catch (err: any) {
      setError(err.message || "Error al crear pedido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-start justify-center">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-3 sm:p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-base sm:text-lg font-bold">Speed Box</h1>
          <button className="bg-gray-800 text-white rounded text-xs sm:text-sm px-2 sm:px-3 py-1">
            Dashboard
          </button>
        </div>

        {/* Formulario */}
        <section className="space-y-2">
          <h2 className="font-semibold text-sm sm:text-base">
            Agregar ítem
          </h2>

          {/* Selector de producto */}
          <select
            value={productoSeleccionadoId ?? ""}
            onChange={(e) => setProductoSeleccionadoId(Number(e.target.value))}
            className="border rounded px-2 py-1 text-sm w-full"
          >
            {productos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} - ${p.precio}
              </option>
            ))}
          </select>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="number"
              placeholder="Cantidad"
              value={cantidad}
              onChange={(e) => setCantidad(Number(e.target.value))}
              className="border rounded px-2 py-1 text-sm sm:w-24"
            />
          </div>

          <button
            onClick={agregarItem}
            className="bg-blue-600 text-white rounded mt-1"
          >
            Agregar al carrito
          </button>
        </section>

        {/* Carrito */}
        <section className="space-y-2">
          <h2 className="font-semibold text-sm sm:text-base">
            Carrito
          </h2>

          {carrito.length === 0 ? (
            <p className="text-xs sm:text-sm text-gray-500">
              No hay ítems agregados
            </p>
          ) : (
            <div className="space-y-2 max-h-[40vh] overflow-y-auto">
              {carrito.map((item, i) => (
                <div
                  key={i}
                  className="border rounded p-2 text-xs sm:text-sm flex justify-between"
                >
                  <div>
                    <p className="font-medium">{item.descripcion}</p>
                    <p className="text-gray-500">
                      {item.cantidad} x ${item.precio}
                    </p>
                  </div>
                  <div className="font-bold">
                    ${item.precio * item.cantidad}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Total + acción */}
          <div className="space-y-2 border-t pt-2">
            <div className="flex justify-between font-bold text-sm">
              <span>Total</span>
              <span>${total}</span>
            </div>

            {error && (
              <p className="text-red-500 text-xs sm:text-sm">
                {error}
              </p>
            )}

            <button
              onClick={confirmarVenta}
              disabled={loading}
              className="bg-green-600 text-white rounded"
            >
              {loading ? "Registrando..." : "Confirmar venta"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}