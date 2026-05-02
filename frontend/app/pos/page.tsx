"use client";

import { useState } from "react";

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

  const agregarItem = () => {
    if (!descripcion || precio <= 0) return;

    setCarrito([
      ...carrito,
      { descripcion, precio, cantidad }
    ]);

    setDescripcion("");
    setPrecio(0);
    setCantidad(1);
  };

  const total = carrito.reduce(
    (acc, item) => acc + item.precio * item.cantidad,
    0
  );

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

          {/* TOTAL */}
          <div className="flex justify-between font-bold border-t pt-2">
            <span>Total</span>
            <span>${total}</span>
          </div>
        </div>

      </div>
    </div>
  );
}