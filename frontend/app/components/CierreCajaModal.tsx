"use client";

import { useEffect, useState } from "react";
import { X, Printer, DollarSign } from "lucide-react";

type CierreCajaData = {
  fecha_cierre: string;
  total_efectivo: number;
  total_transferencia: number;
  total_mp: number;
  total_fiado: number;
  total_vendido: number;
  cantidad_pedidos: number;
  productos_vendidos: Array<{
    nombre: string;
    cantidad: number;
    total: number;
  }>;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function CierreCajaModal({ isOpen, onClose }: Props) {
  const [data, setData] = useState<CierreCajaData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      cargarCierre();
    }
  }, [isOpen]);

  const cargarCierre = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/caja/cierre-hoy", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar cierre de caja");
      }

      const resultado = await response.json();
      setData(resultado);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatearMoneda = (monto: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(monto);
  };

  const imprimir = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
          <div className="flex items-center gap-3">
            <DollarSign size={32} />
            <h2 className="text-2xl font-bold">Cierre de Caja</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:text-green-600 p-2 rounded-lg transition"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">⏳ Generando cierre...</p>
            </div>
          ) : error ? (
            <div className="bg-red-100 border-2 border-red-400 text-red-800 px-4 py-3 rounded-lg">
              ⚠️ {error}
            </div>
          ) : data ? (
            <>
              <div className="mb-6">
                <p className="text-gray-600 text-sm">
                  Fecha: {new Date(data.fecha_cierre).toLocaleString("es-AR")}
                </p>
                <p className="text-gray-600 text-sm">
                  Total de pedidos: {data.cantidad_pedidos}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-green-100 to-green-50 p-6 rounded-xl border-2 border-green-300">
                  <p className="text-sm text-gray-700 font-semibold">💵 Efectivo</p>
                  <p className="text-3xl font-bold text-green-700 mt-2">
                    {formatearMoneda(data.total_efectivo)}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">En caja física</p>
                </div>

                <div className="bg-gradient-to-br from-blue-100 to-blue-50 p-6 rounded-xl border-2 border-blue-300">
                  <p className="text-sm text-gray-700 font-semibold">🏦 Transferencia</p>
                  <p className="text-3xl font-bold text-blue-700 mt-2">
                    {formatearMoneda(data.total_transferencia)}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">En cuenta bancaria</p>
                </div>

                <div className="bg-gradient-to-br from-cyan-100 to-cyan-50 p-6 rounded-xl border-2 border-cyan-300">
                  <p className="text-sm text-gray-700 font-semibold">💳 Mercado Pago</p>
                  <p className="text-3xl font-bold text-cyan-700 mt-2">
                    {formatearMoneda(data.total_mp)}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">En cuenta MP</p>
                </div>

                <div className="bg-gradient-to-br from-orange-100 to-orange-50 p-6 rounded-xl border-2 border-orange-300">
                  <p className="text-sm text-gray-700 font-semibold">📝 Fiado (Deuda)</p>
                  <p className="text-3xl font-bold text-orange-700 mt-2">
                    {formatearMoneda(data.total_fiado)}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Pendiente de cobro</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-100 to-purple-50 p-6 rounded-xl border-2 border-purple-300 mb-6">
                <p className="text-sm text-gray-700 font-semibold">💰 TOTAL VENDIDO</p>
                <p className="text-5xl font-bold text-purple-900 mt-2">
                  {formatearMoneda(data.total_vendido)}
                </p>
              </div>

              {data.productos_vendidos.length > 0 && (
                <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">
                    📦 Productos Vendidos
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-100 border-b-2 border-gray-300">
                          <th className="text-left p-3 font-bold">Producto</th>
                          <th className="text-center p-3 font-bold">Cantidad</th>
                          <th className="text-right p-3 font-bold">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.productos_vendidos.map((prod, idx) => (
                          <tr
                            key={idx}
                            className={`border-b ${
                              idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                            }`}
                          >
                            <td className="p-3 font-semibold">{prod.nombre}</td>
                            <td className="p-3 text-center">
                              <span className="bg-blue-200 text-blue-900 px-3 py-1 rounded-full font-bold">
                                {prod.cantidad}
                              </span>
                            </td>
                            <td className="p-3 text-right font-bold">
                              {formatearMoneda(prod.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={imprimir}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-bold transition flex items-center justify-center gap-2"
                >
                  <Printer size={20} />
                  Imprimir
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold transition"
                >
                  Cerrar
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
