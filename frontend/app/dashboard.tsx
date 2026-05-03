"use client";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable"; // Importación necesaria para cargar el plugin
import { UserOptions } from "jspdf-autotable";

// 1. Definimos la interfaz para que TypeScript reconozca autoTable en el objeto doc
interface jsPDFWithPlugin extends jsPDF {
  autoTable: (options: UserOptions) => jsPDF;
}

const API_URL = "https://pablo2389-pablo2389-pos-bebidas.onrender.com";

const api = axios.create({ baseURL: API_URL });

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
  metodos_pago: Record<string, number>;
}

export default function Dashboard() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<{ nombre: string | null } | null>(null);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const nombreUsuario = localStorage.getItem("usuario_nombre");

    if (!token) {
      router.push("/login");
      return;
    }

    setUsuario({ nombre: nombreUsuario });
    cargarDatos();
  }, [router]);

  const cargarDatos = async () => {
    setLoading(true);
    setError("");
    try {
      const resEstadisticas = await api.get(`/dashboard/caja-hoy`);
      
      setEstadisticas({
        fecha: new Date().toISOString().split("T")[0],
        total_ventas: resEstadisticas.data.total,
        cantidad_pedidos: resEstadisticas.data.cantidad_pedidos,
        metodos_pago: resEstadisticas.data.por_metodo || {},
      });
    } catch (err: any) {
      setError("Error al cargar datos. Verifica la conexión.");
    } finally {
      setLoading(false);
    }
  };

  const generarPDF = () => {
    if (!estadisticas) return;

    // 2. Casteamos el documento a nuestra interfaz extendida
    const doc = new jsPDF() as jsPDFWithPlugin;
    const fechaFmt = new Date().toLocaleDateString("es-AR");

    doc.setFontSize(18);
    doc.text("Reporte de Ventas Diario - POS Bebidas", 14, 20);
    
    doc.setFontSize(11);
    doc.text(`Operador: ${usuario?.nombre || "N/A"}`, 14, 30);
    doc.text(`Fecha: ${fechaFmt}`, 14, 35);

    // 3. Usamos autoTable como método del documento
    doc.autoTable({
      startY: 45,
      head: [["Concepto", "Valor"]],
      body: [
        ["Total Ventas", `$${estadisticas.total_ventas.toLocaleString("es-AR")}`],
        ["Cantidad Pedidos", estadisticas.cantidad_pedidos.toString()],
      ],
      theme: 'striped',
      headStyles: { fillColor: [5, 150, 105] } // Color verde esmeralda
    });

    const pagosBody = Object.entries(estadisticas.metodos_pago).map(([m, v]) => [
      m, 
      `$${v.toLocaleString("es-AR")}`
    ]);

    doc.autoTable({
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [["Método de Pago", "Monto"]],
      body: pagosBody,
    });

    doc.save(`Reporte_Ventas_${estadisticas.fecha}.pdf`);
  };

  const logout = () => {
    localStorage.clear();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">📊 Dashboard</h1>
            <p className="text-slate-500 text-sm">Resumen de ventas y caja</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={generarPDF}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Descargar PDF
            </button>
            <button 
              onClick={logout} 
              className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </header>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-100">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 rounded-2xl shadow-md">
              <p className="text-blue-100 text-sm font-medium">Ventas Totales</p>
              <h2 className="text-4xl font-bold mt-2">
                ${estadisticas?.total_ventas.toLocaleString("es-AR")}
              </h2>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <p className="text-slate-500 text-sm font-medium">Pedidos Realizados</p>
              <h2 className="text-4xl font-bold text-slate-800 mt-2">
                {estadisticas?.cantidad_pedidos}
              </h2>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <p className="text-slate-500 text-sm font-medium">Ticket Promedio</p>
              <h2 className="text-4xl font-bold text-slate-800 mt-2">
                ${estadisticas?.cantidad_pedidos 
                  ? (estadisticas.total_ventas / estadisticas.cantidad_pedidos).toLocaleString("es-AR", { maximumFractionDigits: 0 }) 
                  : "0"}
              </h2>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}