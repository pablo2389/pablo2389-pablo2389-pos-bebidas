"use client";
import axios from "axios";
import jsPDF from "jspdf";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const API_URL = "https://pablo2389-pablo2389-pos-bebidas.onrender.com";
const api = axios.create({ baseURL: API_URL });

// Interceptor para el token (Importante para que no de error 401)
api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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

  const generarPDF = () => {
    if (!estadisticas) return;

    // IMPORTACIÓN DINÁMICA: Esto evita el error de TypeScript en el Build de Render
    const autoTable = require("jspdf-autotable");
    const doc = new jsPDF();
    
    // Configuración estética del PDF
    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text("Reporte de Ventas - POS Bebidas", 14, 20);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Operador: ${usuario?.nombre || "Admin"}`, 14, 30);
    doc.text(`Fecha del Reporte: ${new Date(estadisticas.fecha).toLocaleDateString("es-AR")}`, 14, 37);

    // Tabla de Resumen General
    autoTable(doc, {
      startY: 45,
      head: [["Concepto", "Valor"]],
      body: [
        ["Total Ventas", `$${Number(estadisticas.total_ventas).toLocaleString("es-AR")}`],
        ["Pedidos Realizados", estadisticas.cantidad_pedidos.toString()],
        ["Items Vendidos", estadisticas.cantidad_items.toString()],
        ["Ticket Promedio", `$${(estadisticas.total_ventas / estadisticas.cantidad_pedidos || 0).toLocaleString("es-AR")}`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] } // Color Indigo
    });

    // Tabla de Métodos de Pago
    const pagosBody = Object.entries(estadisticas.metodos_pago).map(([metodo, monto]) => [
      metodo,
      `$${Number(monto).toLocaleString("es-AR")}`
    ]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [["Método de Pago", "Monto"]],
      body: pagosBody,
      headStyles: { fillColor: [16, 185, 129] } // Color Esmeralda
    });

    doc.save(`Reporte_Ventas_${fechaSeleccionada}.pdf`);
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
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">📊 Dashboard</h1>
            <p className="text-gray-600 mt-1">POS Bebidas - Mendoza, Argentina</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={generarPDF}
              className="bg-emerald-400 hover:bg-emerald-500 text-gray-900 px-4 py-2 rounded-lg font-bold shadow-md transition"
            >
              📄 Descargar PDF
            </button>
            <button
              onClick={irAPOS}
              className="bg-blue-400 hover:bg-blue-500 text-gray-900 px-4 py-2 rounded-lg font-bold shadow-md transition"
            >
              🛒 Ir a POS
            </button>
            <button
              onClick={logout}
              className="bg-red-400 hover:bg-red-500 text-gray-900 px-4 py-2 rounded-lg font-bold shadow-md transition"
            >
              🚪 Salir
            </button>
          </div>
        </div>

        {/* SELECTOR DE FECHA */}
        <div className="mb-6 flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm w-fit border border-purple-100">
          <label className="text-gray-700 font-bold">Ver día:</label>
          <input
            type="date"
            value={fechaSeleccionada}
            onChange={(e) => setFechaSeleccionada(e.target.value)}
            className="px-4 py-2 border-2 border-purple-200 rounded-lg text-gray-900 bg-purple-50 font-semibold focus:outline-none focus:border-purple-400"
          />
          <button
            onClick={() => setFechaSeleccionada(new Date().toISOString().split("T")[0])}
            className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-4 py-2 rounded-lg font-bold transition"
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
          <div className="text-center py-20">
             <div className="animate-spin inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mb-4"></div>
             <p className="text-gray-600 text-lg font-medium italic">Sincronizando con el servidor...</p>
          </div>
        ) : (
          <>
            {/* TARJETAS PRINCIPALES */}
            {estadisticas && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-br from-blue-200 to-blue-100 p-6 rounded-2xl shadow-lg border-2 border-blue-300 transform hover:scale-105 transition">
                  <p className="text-gray-700 text-sm font-semibold uppercase tracking-wider">💰 Ventas Totales</p>
                  <p className="text-3xl font-black text-gray-900 mt-2">
                    ${Number(estadisticas.total_ventas).toLocaleString("es-AR")}
                  </p>
                  <p className="text-xs text-blue-800 mt-2 font-bold">{estadisticas.cantidad_pedidos} operaciones</p>
                </div>

                <div className="bg-gradient-to-br from-green-200 to-green-100 p-6 rounded-2xl shadow-lg border-2 border-green-300 transform hover:scale-105 transition">
                  <p className="text-gray-700 text-sm font-semibold uppercase tracking-wider">📦 Pedidos</p>
                  <p className="text-3xl font-black text-gray-900 mt-2">{estadisticas.cantidad_pedidos}</p>
                  <p className="text-xs text-green-800 mt-2 font-bold">{estadisticas.cantidad_items} productos vendidos</p>
                </div>

                <div className="bg-gradient-to-br from-yellow-200 to-yellow-100 p-6 rounded-2xl shadow-lg border-2 border-yellow-300 transform hover:scale-105 transition">
                  <p className="text-gray-700 text-sm font-semibold uppercase tracking-wider">💵 Efectivo</p>
                  <p className="text-3xl font-black text-gray-900 mt-2">
                    ${Number(estadisticas.metodos_pago["Efectivo"] || 0).toLocaleString("es-AR")}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-orange-200 to-orange-100 p-6 rounded-2xl shadow-lg border-2 border-orange-300 transform hover:scale-105 transition">
                  <p className="text-gray-700 text-sm font-semibold uppercase tracking-wider">📝 Fiado</p>
                  <p className="text-3xl font-black text-gray-900 mt-2">
                    ${Number(estadisticas.metodos_pago["Fiado"] || 0).toLocaleString("es-AR")}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* MÉTODOS DE PAGO */}
              {estadisticas && (
                <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-purple-200">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    💳 Métodos de Pago
                  </h2>
                  <div className="space-y-5">
                    {Object.entries(estadisticas.metodos_pago).map(([metodo, cantidad]: [string, any]) => {
                      const porcentaje = Math.round((cantidad / (estadisticas.total_ventas || 1)) * 100);
                      return (
                        <div key={metodo} className="group">
                          <div className="flex justify-between mb-2">
                            <span className="font-bold text-gray-700">{metodo}</span>
                            <span className="text-gray-900 font-black">${Number(cantidad).toLocaleString("es-AR")} ({porcentaje}%)</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden border border-gray-200">
                            <div
                              className="bg-gradient-to-r from-purple-500 to-indigo-400 h-full rounded-full transition-all duration-500"
                              style={{ width: `${porcentaje}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TOP PRODUCTOS */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">🏆 Más Vendidos (Mes)</h2>
                <div className="space-y-4">
                  {topProductos.slice(0, 5).map((prod, i) => (
                    <div key={prod.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <div className="flex items-center gap-3">
                        <span className="bg-blue-500 text-white w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold">{i+1}</span>
                        <span className="font-bold text-gray-800">{prod.nombre}</span>
                      </div>
                      <span className="bg-white px-3 py-1 rounded-lg text-blue-700 font-black shadow-sm">
                        x{prod.cantidad_vendida}
                      </span>
                    </div>
                  ))}
                  {topProductos.length === 0 && <p className="text-center text-gray-400 py-10 italic">Aún no hay ventas registradas</p>}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}