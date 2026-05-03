"use client";

import { useState } from "react";
import { api } from "../utils/api"; // ajustá la ruta si este archivo está en otra carpeta

type Item = {
  descripcion: string;
  precio: number;
  cantidad: number;
};

export default function POSPage() {
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState(0);
  const [cantidad, setCantidad] = useState(1);
  const [carrito, setCarrito] = useState<Item[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const agregarItem = () => {
    if (!descripcion || precio <= 0) return;

    setCarrito([
      ...carrito,
      { descripcion, precio, cantidad },
    ]);

    setDescripcion("");
    setPrecio(0);
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
      // Ajustá este body al formato que espera tu backend en /pedidos
      const body = {
        items: carrito.map((i) => ({
          descripcion: i.descripcion,
          precio: i.precio,
          cantidad: i.cantidad,
        })),
        total,
        metodo_pago: "efectivo",
      };

      await api("/pedidos", {
        method: "POST",
        body: JSON.stringify(body),
      });

      // Si todo ok, limpiamos carrito
      setCarrito([]);
    } catch (err: any) {
      setError(err.message || "Error al crear pedido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5e6d3] p-4">
      {/* CONTENEDOR PRINCIPAL */}
      <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-md p-4 space-y-4">
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-bold">Speed Box</h1>
          <button className="bg-gray-800 text-white px-3 py-1 rounded text-sm">
            Dashboard
          </button>
        </div>

        {/* FORM */}
        <div className="space-y-2">
          <h2 className="font-semibold">Agregar ítem</h2>

          <input
            type="text"
            placeholder="Descripción"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full border rounded p-2 text-sm"
          />

          {/* FILA RESPONSIVE */}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="number"
              placeholder="Precio"
              value={precio}
              onChange={(e) => setPrecio(Number(e.target.value))}
              className="w-full border rounded p-2 text-sm"
            />

            <input
              type="number"
              placeholder="Cantidad"
              value={cantidad}
              onChange={(e) => setCantidad(Number(e.target.value))}
              className="w-full sm:w-24 border rounded p-2 text-sm"
            />
          </div>

          <button
            onClick={agregarItem}
            className="w-full bg-blue-600 text-white py-2 rounded"
          >
            Agregar al carrito
          </button>
        </div>

        {/* CARRITO */}
        <div className="space-y-2">
          <h2 className="font-semibold">Carrito</h2>

          {carrito.length === 0 ? (
            <p className="text-sm text-gray-500">
              No hay ítems agregados
            </p>
          ) : (
            <div className="space-y-2">
              {carrito.map((item, i) => (
                <div
                  key={i}
                  className="border rounded p-2 text-sm flex justify-between"
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

          {/* TOTAL + CONFIRMAR */}
          <div className="space-y-2 border-t pt-2">
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>${total}</span>
            </div>

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <button
              onClick={confirmarVenta}
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 rounded"
            >
              {loading ? "Registrando..." : "Confirmar venta"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}