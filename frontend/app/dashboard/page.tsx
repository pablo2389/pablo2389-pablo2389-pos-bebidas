"use client";

// Icons replaced with emojis for stability

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CierreCajaModal from "../components/CierreCajaModal";
import { API_URL } from "../utils/api";

type DashboardData = {
  total_vendido: number;
  cantidad_pedidos: number;
  total_efectivo: number;
  total_transferencia: number;
  total_mp: number;
  total_fiado: number;
};

type ProductoBajoStock = {
  id: number;
  nombre: string;
  stock: number;
  precio: number;
};

type PedidoHistorial = {
  id: number;
  cliente: string | null;
  total: number;
  metodo_pago: string;
  estado: string;
  created_at: string;
};

type ProductoVendido = {
  nombre: string;
  cantidad: number;
  total: number;
};

type HistorialDiarioData = {
  fecha: string;
  total_vendido: number;
  total_efectivo: number;
  total_transferencia: number;
  total_mp: number;
  total_fiado: number;
  cantidad_pedidos: number;
  historial_pedidos: PedidoHistorial[];
  productos_vendidos: ProductoVendido[];
};

export default function DashboardPage() {
  const router = useRouter();

  const [data, setData] = useState<DashboardData | null>(null);
  const [productosBajoStock, setProductosBajoStock] = useState<
    ProductoBajoStock[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalCierreOpen, setModalCierreOpen] = useState(false);

  // Historial diario
  const [fechaHistorial, setFechaHistorial] = useState<string>(() => {
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, "0");
    const dd = String(hoy.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  const [historial, setHistorial] = useState<HistorialDiarioData | null>(null);
  const [loadingHist, setLoadingHist] = useState(false);
  const [errorHist, setErrorHist] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      // ===== CAJA HOY =====
      const resCaja = await fetch(`${API_URL}/caja/cierre-hoy`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!resCaja.ok) {
        throw new Error("Error al cargar caja");
      }

      const dataCaja = await resCaja.json();

      setData({
        total_vendido: dataCaja.total_vendido || 0,
        cantidad_pedidos: dataCaja.cantidad_pedidos || 0,
        total_efectivo: dataCaja.total_efectivo || 0,
        total_transferencia: dataCaja.total_transferencia || 0,
        total_mp: dataCaja.total_mp || 0,
        total_fiado: dataCaja.total_fiado || 0,
      });

      // ===== STOCK =====
      const resStock = await fetch(`${API_URL}/dashboard/productos-bajo-stock`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (resStock.ok) {
        const stock = await resStock.json();
        setProductosBajoStock(stock ?? []);
      } else {
        setProductosBajoStock([]);
      }
    } catch (err: any) {
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const cargarHistorial = async (fechaStr: string) => {
    try {
      setLoadingHist(true);
      setErrorHist(null);
      const token = localStorage.getItem("token");
      if (!token) {
        setErrorHist("Sin token");
        return;
      }

      const res = await fetch(
        `${API_URL}/caja/historial-diario?fecha=${fechaStr}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `Error ${res.status}`);
      }

      const json = (await res.json()) as HistorialDiarioData;
      setHistorial(json);
    } catch (e: any) {
      console.error(e);
      setErrorHist(e.message || "Error al cargar historial");
    } finally {
      setLoadingHist(false);
    }
  };

  useEffect(() => {
    cargarHistorial(fechaHistorial);
  }, [fechaHistorial]);

  const formatearMoneda = (monto: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(monto || 0);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto w-full">
        {/* HEADER */}
        <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold flex items-center gap-2 text-gray-800">
                📈 Dashboard
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              {new Date().toLocaleDateString("es-AR")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full md:w-auto">
            <button
              onClick={() => setModalCierreOpen(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-bold"
            >
              💰 Caja
            </button>

            <button
              onClick={() => router.push("/")}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold"
            >
              🛒 POS
            </button>

            <button
              onClick={() => router.push("/clientes")}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-bold"
            >
              👥 Clientes
            </button>
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <p className="text-center text-gray-600">⏳ Cargando...</p>
        )}

        {/* ERROR */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded-lg">
            ⚠️ {error}
          </div>
        )}

        {/* DATA */}
        {data && !loading && (
          <>
            {/* CARDS CAJA HOY */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white p-4 rounded-xl shadow border">
                <div className="flex items-center gap-3">
                  <span className="text-green-600 text-2xl">💵</span>
                  <div>
                    <p className="text-sm text-gray-500">Total del día</p>
                    <p className="text-2xl font-bold">
                      {formatearMoneda(data.total_vendido)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl shadow border">
                <div className="flex items-center gap-3">
                  <span className="text-blue-600 text-2xl">🛒</span>
                  <div>
                    <p className="text-sm text-gray-500">Pedidos</p>
                    <p className="text-2xl font-bold">
                      {data.cantidad_pedidos}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* METODOS PAGO HOY */}
            <div className="bg-white p-4 rounded-xl shadow mb-6">
              <h2 className="font-bold mb-4">Métodos de pago (hoy)</h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-gray-50 p-3 rounded-lg border">
                  <p className="text-xs uppercase">Efectivo</p>
                  <p className="font-bold">
                    {formatearMoneda(data.total_efectivo)}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border">
                  <p className="text-xs uppercase">Transferencia</p>
                  <p className="font-bold">
                    {formatearMoneda(data.total_transferencia)}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border">
                  <p className="text-xs uppercase">Mercado Pago</p>
                  <p className="font-bold">
                    {formatearMoneda(data.total_mp)}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border">
                  <p className="text-xs uppercase">Fiado</p>
                  <p className="font-bold">
                    {formatearMoneda(data.total_fiado)}
                  </p>
                </div>
              </div>
            </div>

            {/* HISTORIAL DIARIO */}
            <div className="bg-white p-4 rounded-xl shadow mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <h2 className="font-bold">Historial diario</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Fecha:</span>
                  <input
                    type="date"
                    value={fechaHistorial}
                    onChange={(e) => setFechaHistorial(e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                  />
                </div>
              </div>

              {loadingHist && (
                <p className="text-sm text-gray-500">
                  Cargando historial...
                </p>
              )}
              {errorHist && (
                <p className="text-sm text-red-500 mb-2">⚠ {errorHist}</p>
              )}

              {historial && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div className="p-2 border rounded bg-gray-50">
                      <p className="text-xs text-gray-500">Total vendido</p>
                      <p className="font-semibold">
                        {formatearMoneda(historial.total_vendido)}
                      </p>
                    </div>
                    <div className="p-2 border rounded bg-gray-50">
                      <p className="text-xs text-gray-500">Pedidos</p>
                      <p className="font-semibold">
                        {historial.cantidad_pedidos}
                      </p>
                    </div>
                    <div className="p-2 border rounded bg-gray-50">
                      <p className="text-xs text-gray-500">Efectivo</p>
                      <p className="font-semibold">
                        {formatearMoneda(historial.total_efectivo)}
                      </p>
                    </div>
                    <div className="p-2 border rounded bg-gray-50">
                      <p className="text-xs text-gray-500">
                        Transferencia
                      </p>
                      <p className="font-semibold">
                        {formatearMoneda(historial.total_transferencia)}
                      </p>
                    </div>
                  </div>

                  {historial.historial_pedidos.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No hay pedidos en esta fecha.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left px-2 py-1">Ticket</th>
                            <th className="text-left px-2 py-1">Cliente</th>
                            <th className="text-left px-2 py-1">
                              Fecha y hora
                            </th>
                            <th className="text-right px-2 py-1">Total</th>
                            <th className="text-left px-2 py-1">Método</th>
                            <th className="text-left px-2 py-1">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {historial.historial_pedidos.map((p) => {
                            const fechaHora = new Date(p.created_at);
                            const fechaStr =
                              fechaHora.toLocaleDateString("es-AR");
                            const horaStr =
                              fechaHora.toLocaleTimeString("es-AR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              });
                            return (
                              <tr
                                key={p.id}
                                className="border-b hover:bg-gray-50"
                              >
                                <td className="px-2 py-1">#{p.id}</td>
                                <td className="px-2 py-1">
                                  {p.cliente || "Sin nombre"}
                                </td>
                                <td className="px-2 py-1">
                                  {fechaStr} {horaStr}
                                </td>
                                <td className="px-2 py-1 text-right">
                                  {formatearMoneda(p.total)}
                                </td>
                                <td className="px-2 py-1">
                                  {p.metodo_pago}
                                </td>
                                <td className="px-2 py-1">{p.estado}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Productos vendidos en el día */}
                  {historial.productos_vendidos &&
                    historial.productos_vendidos.length > 0 && (
                      <div className="mt-4">
                        <h3 className="font-semibold mb-2 text-sm">
                          Productos vendidos en el día
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-xs">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left px-2 py-1">
                                  Producto
                                </th>
                                <th className="text-right px-2 py-1">
                                  Cantidad
                                </th>
                                <th className="text-right px-2 py-1">
                                  Total
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {historial.productos_vendidos.map(
                                (prod, i) => (
                                  <tr key={i} className="border-b">
                                    <td className="px-2 py-1">
                                      {prod.nombre}
                                    </td>
                                    <td className="px-2 py-1 text-right">
                                      {prod.cantidad}
                                    </td>
                                    <td className="px-2 py-1 text-right">
                                      {formatearMoneda(prod.total)}
                                    </td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                </>
              )}
            </div>

            {/* STOCK */}
            {productosBajoStock.length > 0 && (
              <div className="bg-white p-4 rounded-xl shadow mb-6">
                <h2 className="flex items-center gap-2 font-bold mb-4">
                  <span className="text-orange-500 text-2xl">⚠️</span>
                  Stock bajo
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {productosBajoStock.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 border rounded-lg bg-orange-50"
                    >
                      <p className="font-bold">{p.nombre}</p>
                      <p>Stock: {p.stock}</p>
                      <p>${p.precio}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ACCIONES */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => router.push("/clientes")}
                className="bg-purple-500 text-white p-4 rounded-xl font-bold"
              >
                👥
                Clientes
              </button>

              <button
                onClick={() => router.push("/productos")}
                className="bg-blue-500 text-white p-4 rounded-xl font-bold"
              >
                📦
                Productos
              </button>

              <button
                onClick={() => setModalCierreOpen(true)}
                className="bg-green-500 text-white p-4 rounded-xl font-bold"
              >
                💰
                Caja
              </button>
            </div>
          </>
        )}
      </div>

      <CierreCajaModal
        isOpen={modalCierreOpen}
        onClose={() => setModalCierreOpen(false)}
      />
    </div>
  );
}