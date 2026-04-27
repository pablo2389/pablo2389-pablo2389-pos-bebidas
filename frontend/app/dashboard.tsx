"use client";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const API_URL = "http://localhost:8000";
const api = axios.create({ baseURL: API_URL });

interface Estadisticas {
  fecha: string;
  total_ventas: number;
  cantidad_pedidos: number;
  cantidad_items: number;
  metodos_pago: Record<string, number>;
}

interface ProductoTop {
  id: number;
  nombre: string;
  cantidad_vendida: number;
  ingresos_totales: number;
  categoria?: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [topProductos, setTopProductos] = useState<ProductoTop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    const nombreUsuario = localStorage.getItem("usuario_nombre");

    if (!token) {
      router.push("/login");
      return;
    }

    setUsuario({ nombre: nombreUsuario });
    cargarDatos();
  }, [fechaSeleccionada]);

  const cargarDatos = async () => {
    setLoading(true);
    setError("");
    try {
      const [resEstadisticas, resTop] = await Promise.all([
        api.get(`/estadisticas/diarias?fecha=${fechaSeleccionada}`),
        api.get(`/estadisticas/top-productos?limite=10&dias=30`),
      ]);

      setEstadisticas(resEstadisticas.data);
      setTopProductos(resTop.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario_email");
    localStorage.removeItem("usuario_nombre");
    router.push("/login");
  };

  const irAPOS = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">📊 Dashboard</h1>
            <p className="text-gray-600 mt-1">POS Bebidas - Estadísticas de Ventas</p>
          </div>
          <div className="flex gap-3">
            {usuario && (
              <span className="bg-yellow-200 text-gray-900 px-4 py-2 rounded-lg font-semibold flex items-center gap-2">
                👤 {usuario.nombre}
              </span>
            )}
            <button
              onClick={irAPOS}
              className="bg-blue-400 hover:bg-blue-500 text-gray-900 px-4 py-2 rounded-lg font-bold transition"
            >
              🛒 Ir a POS
            </button>
            <button
              onClick={logout}
              className="bg-red-400 hover:bg-red-500 text-gray-900 px-4 py-2 rounded-lg font-bold transition"
            >
              🚪 Salir
            </button>
          </div>
        </div>

        {/* SELECTOR DE FECHA */}
        <div className="mb-6 flex gap-4">
          <input
            type="date"
            value={fechaSeleccionada}
            onChange={(e) => setFechaSeleccionada(e.target.value)}
            className="px-4 py-2 border-2 border-purple-300 rounded-lg text-gray-900 bg-purple-50 font-semibold"
          />
          <button
            onClick={() =>
              setFechaSeleccionada(new Date().toISOString().split("T")[0])
            }
            className="bg-purple-400 hover:bg-purple-500 text-gray-900 px-4 py-2 rounded-lg font-bold transition"
          >
            Hoy
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border-2 border-red-400 text-red-800 px-4 py-3 rounded-lg mb-6 font-semibold">
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">⏳ Cargando datos...</p>
          </div>
        ) : (
          <>
            {/* TARJETAS PRINCIPALES */}
            {estadisticas && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                
                {/* TOTAL VENTAS */}
                <div className="bg-gradient-to-br from-blue-200 to-blue-100 p-6 rounded-2xl shadow-lg border-2 border-blue-300">
                  <p className="text-gray-700 text-sm font-semibold">💰 Total de Ventas</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    ${Number(estadisticas.total_ventas).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-700 mt-2">
                    {estadisticas.cantidad_pedidos} pedidos
                  </p>
                </div>

                {/* CANTIDAD PEDIDOS */}
                <div className="bg-gradient-to-br from-green-200 to-green-100 p-6 rounded-2xl shadow-lg border-2 border-green-300">
                  <p className="text-gray-700 text-sm font-semibold">📦 Pedidos</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {estadisticas.cantidad_pedidos}
                  </p>
                  <p className="text-xs text-gray-700 mt-2">
                    {estadisticas.cantidad_items} items vendidos
                  </p>
                </div>

                {/* EFECTIVO */}
                <div className="bg-gradient-to-br from-yellow-200 to-yellow-100 p-6 rounded-2xl shadow-lg border-2 border-yellow-300">
                  <p className="text-gray-700 text-sm font-semibold">💵 Efectivo</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    ${Number(estadisticas.metodos_pago["Efectivo"] || 0).toFixed(2)}
                  </p>
                </div>

                {/* FIADO */}
                <div className="bg-gradient-to-br from-orange-200 to-orange-100 p-6 rounded-2xl shadow-lg border-2 border-orange-300">
                  <p className="text-gray-700 text-sm font-semibold">📝 Fiado</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    ${Number(estadisticas.metodos_pago["Fiado"] || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            {/* MÉTODOS DE PAGO */}
            {estadisticas && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                
                {/* DESGLOSE DE MÉTODOS */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-purple-200">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    💳 Métodos de Pago
                  </h2>
                  <div className="space-y-3">
                    {Object.entries(estadisticas.metodos_pago).map(
                      ([metodo, cantidad]: [string, any]) => {
                        const total = estadisticas.total_ventas || 1;
                        const porcentaje = Math.round((cantidad / total) * 100);
                        const colores: Record<string, string> = {
                          Efectivo: "from-green-300 to-green-200",
                          Transferencia: "from-blue-300 to-blue-200",
                          Fiado: "from-orange-300 to-orange-200",
                        };

                        return (
                          <div key={metodo}>
                            <div className="flex justify-between mb-1">
                              <span className="font-semibold text-gray-800">
                                {metodo}
                              </span>
                              <span className="text-gray-700 font-bold">
                                ${Number(cantidad).toFixed(2)} ({porcentaje}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div
                                className={`bg-gradient-to-r ${
                                  colores[metodo] || "from-gray-400 to-gray-300"
                                } h-3 rounded-full`}
                                style={{ width: `${porcentaje}%` }}
                              />
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* RESUMEN RÁPIDO */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-pink-200">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    📈 Resumen del Día
                  </h2>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b-2 border-pink-100">
                      <span className="text-gray-700">Fecha:</span>
                      <span className="font-bold text-gray-900">
                        {new Date(estadisticas.fecha).toLocaleDateString("es-AR")}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b-2 border-pink-100">
                      <span className="text-gray-700">Total Ventas:</span>
                      <span className="font-bold text-blue-700 text-lg">
                        ${Number(estadisticas.total_ventas).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b-2 border-pink-100">
                      <span className="text-gray-700">Cantidad Pedidos:</span>
                      <span className="font-bold text-green-700 text-lg">
                        {estadisticas.cantidad_pedidos}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b-2 border-pink-100">
                      <span className="text-gray-700">Items Vendidos:</span>
                      <span className="font-bold text-purple-700 text-lg">
                        {estadisticas.cantidad_items}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 bg-blue-50 p-2 rounded-lg mt-2">
                      <span className="text-gray-700 font-semibold">Ticket Promedio:</span>
                      <span className="font-bold text-blue-900 text-lg">
                        $
                        {estadisticas.cantidad_pedidos > 0
                          ? (
                              estadisticas.total_ventas /
                              estadisticas.cantidad_pedidos
                            ).toFixed(2)
                          : "0.00"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TOP PRODUCTOS */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                🏆 Top Productos (Últimos 30 días)
              </h2>
              {topProductos.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  Sin datos de ventas aún
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-blue-200 bg-blue-50">
                        <th className="text-left py-3 px-4 font-bold text-gray-800">
                          Producto
                        </th>
                        <th className="text-center py-3 px-4 font-bold text-gray-800">
                          Cantidad
                        </th>
                        <th className="text-right py-3 px-4 font-bold text-gray-800">
                          Ingresos
                        </th>
                        <th className="text-center py-3 px-4 font-bold text-gray-800">
                          Categoría
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProductos.map((producto, idx) => (
                        <tr
                          key={producto.id}
                          className={`border-b border-gray-200 ${
                            idx % 2 === 0 ? "bg-white" : "bg-blue-50"
                          } hover:bg-blue-100 transition`}
                        >
                          <td className="py-3 px-4 text-gray-900 font-semibold">
                            {idx + 1}. {producto.nombre}
                          </td>
                          <td className="py-3 px-4 text-center text-gray-900 font-bold">
                            {producto.cantidad_vendida}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-900 font-bold text-lg">
                            ${Number(producto.ingresos_totales).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="bg-purple-200 text-gray-900 px-3 py-1 rounded-full text-sm font-semibold">
                              {producto.categoria || "Sin categoría"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
