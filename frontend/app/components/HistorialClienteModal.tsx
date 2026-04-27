"use client";

import { useEffect, useState } from "react";
import { X, Check } from "lucide-react";

type Producto = {
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
};

type Compra = {
  pedido_id: number;
  numero_ticket: number;
  fecha: string;
  total: number;
  metodo_pago: string;
  estado: string;
  productos: Producto[];
};

type HistorialData = {
  nombre_cliente: string;
  total_deuda: number;
  total_pagado: number;
  ultima_compra_fecha: string;
  ultima_compra_monto: number;
  estado_cuenta: string;
  cantidad_compras: number;
  historial_compras: Compra[];
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  clienteNombre: string;
};

export default function HistorialClienteModal({
  isOpen,
  onClose,
  clienteNombre,
}: Props) {
  const [data, setData] = useState<HistorialData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && clienteNombre) {
      cargarHistorial();
    }
  }, [isOpen, clienteNombre]);

  const cargarHistorial = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `https://pablo2389-pablo2389-pos-bebidas.onrender.com/clientes/historial/${encodeURIComponent(
          clienteNombre
        )}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al cargar historial");
      }

      const resultado = await response.json();
      setData(resultado);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const marcarComoPagado = async (pedidoId: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `https://pablo2389-pablo2389-pos-bebidas.onrender.com/clientes/marcar-pagado/${pedidoId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al marcar como pagado");
      }

      alert("✅ Pedido marcado como pagado");
      cargarHistorial();
    } catch (err: any) {
      alert("❌ " + err.message);
    }
  };

  const formatearMoneda = (monto: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(monto);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Historial de {clienteNombre}</h2>
            {data && (
              <p className="text-sm mt-1">
                {data.cantidad_compras} compras -{" "}
                {data.estado_cuenta === "debe" ? "❌ Debe" : "✅ Al día"}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:text-purple-600 p-2 rounded-lg transition"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">⏳ Cargando historial...</p>
            </div>
          ) : error ? (
            <div className="bg-red-100 border-2 border-red-400 text-red-800 px-4 py-3 rounded-lg">
              ⚠️ {error}
            </div>
          ) : data ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-red-100 to-red-50 p-6 rounded-xl border-2 border-red-300">
                  <p className="text-sm text-gray-700 font-semibold">💰 Deuda Total</p>
                  <p className="text-3xl font-bold text-red-700 mt-2">
                    {formatearMoneda(data.total_deuda)}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-green-100 to-green-50 p-6 rounded-xl border-2 border-green-300">
                  <p className="text-sm text-gray-700 font-semibold">✅ Pagado</p>
                  <p className="text-3xl font-bold text-green-700 mt-2">
                    {formatearMoneda(data.total_pagado)}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-blue-100 to-blue-50 p-6 rounded-xl border-2 border-blue-300">
                  <p className="text-sm text-gray-700 font-semibold">📅 Última Compra</p>
                  <p className="text-lg font-bold text-blue-700 mt-2">
                    {formatearMoneda(data.ultima_compra_monto)}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {new Date(data.ultima_compra_fecha).toLocaleDateString("es-AR")}
                  </p>
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-4">
                📋 Historial de Compras
              </h3>

              <div className="space-y-4">
                {data.historial_compras.map((compra) => (
                  <div
                    key={compra.pedido_id}
                    className={`border-2 rounded-xl p-4 ${
                      compra.estado === "pendiente" || compra.metodo_pago === "fiado"
                        ? "bg-orange-50 border-orange-300"
                        : "bg-green-50 border-green-300"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-bold text-gray-900">
                          Ticket #{compra.numero_ticket}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(compra.fecha).toLocaleString("es-AR")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          {formatearMoneda(compra.total)}
                        </p>
                        <p className="text-sm">
                          <span
                            className={`px-3 py-1 rounded-full font-bold ${
                              compra.estado === "pendiente" || compra.metodo_pago === "fiado"
                                ? "bg-orange-200 text-orange-900"
                                : "bg-green-200 text-green-900"
                            }`}
                          >
                            {compra.metodo_pago.toUpperCase()}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-3 mb-3">
                      <p className="text-sm font-semibold text-gray-700 mb-2">
                        Productos:
                      </p>
                      <ul className="space-y-1">
                        {compra.productos.map((prod, idx) => (
                          <li
                            key={idx}
                            className="flex justify-between text-sm text-gray-800"
                          >
                            <span>
                              {prod.cantidad}x {prod.nombre}
                            </span>
                            <span className="font-bold">
                              {formatearMoneda(prod.subtotal)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {(compra.estado === "pendiente" || compra.metodo_pago === "fiado") && (
                      <button
                        onClick={() => marcarComoPagado(compra.pedido_id)}
                        className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-bold transition flex items-center justify-center gap-2"
                      >
                        <Check size={18} />
                        Marcar como Pagado
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
