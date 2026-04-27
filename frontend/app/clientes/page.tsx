"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Users, AlertCircle } from "lucide-react";
import HistorialClienteModal from "../components/HistorialClienteModal";

type Cliente = {
  nombre: string;
  deuda_total: number;
  compras_total: number;
};

export default function ClientesPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("https://pablo2389-pablo2389-pos-bebidas.onrender.com/clientes/lista", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.clear();
          router.push("/login");
          return;
        }
        throw new Error("Error al cargar clientes");
      }

      const data = await response.json();
      data.sort((a: Cliente, b: Cliente) => b.deuda_total - a.deuda_total);
      setClientes(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const abrirHistorial = (nombreCliente: string) => {
    setClienteSeleccionado(nombreCliente);
    setModalOpen(true);
  };

  const totalDeudaGeneral = clientes.reduce(
    (sum, c) => sum + c.deuda_total,
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
              <Users size={40} className="text-purple-600" />
              Clientes
            </h1>
            <p className="text-gray-600 mt-1">
              Gestión de clientes y control de deudas
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/")}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold transition"
            >
              🛒 Ir a POS
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-bold transition"
            >
              📊 Dashboard
            </button>
          </div>
        </div>

        {/* Tarjetas Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-200 to-blue-100 p-6 rounded-2xl shadow-lg border-2 border-blue-300">
            <p className="text-sm text-gray-700 font-semibold">👥 Total Clientes</p>
            <p className="text-4xl font-bold text-gray-900 mt-2">
              {clientes.length}
            </p>
          </div>

          <div className="bg-gradient-to-br from-red-200 to-red-100 p-6 rounded-2xl shadow-lg border-2 border-red-300">
            <p className="text-sm text-gray-700 font-semibold">💰 Deuda Total</p>
            <p className="text-4xl font-bold text-gray-900 mt-2">
              {new Intl.NumberFormat("es-AR", {
                style: "currency",
                currency: "ARS",
              }).format(totalDeudaGeneral)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-200 to-green-100 p-6 rounded-2xl shadow-lg border-2 border-green-300">
            <p className="text-sm text-gray-700 font-semibold">
              ⚠️ Clientes con Deuda
            </p>
            <p className="text-4xl font-bold text-gray-900 mt-2">
              {clientes.filter((c) => c.deuda_total > 0).length}
            </p>
          </div>
        </div>

        {/* Tabla de Clientes */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">⏳ Cargando clientes...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 border-2 border-red-400 text-red-800 px-4 py-3 rounded-lg">
            ⚠️ {error}
          </div>
        ) : clientes.length === 0 ? (
          <div className="bg-yellow-100 border-2 border-yellow-400 text-yellow-800 px-4 py-3 rounded-lg text-center">
            <AlertCircle size={24} className="inline mr-2" />
            No hay clientes registrados aún
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-purple-100 to-blue-100 border-b-2 border-gray-300">
                  <th className="text-left p-4 font-bold text-gray-800">
                    Cliente
                  </th>
                  <th className="text-center p-4 font-bold text-gray-800">
                    Compras
                  </th>
                  <th className="text-right p-4 font-bold text-gray-800">
                    Deuda
                  </th>
                  <th className="text-center p-4 font-bold text-gray-800">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((cliente, index) => (
                  <tr
                    key={index}
                    className={`border-b hover:bg-purple-50 transition ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="p-4 font-semibold text-gray-900">
                      {cliente.nombre}
                    </td>
                    <td className="p-4 text-center text-gray-800">
                      <span className="bg-blue-200 text-blue-900 px-3 py-1 rounded-full font-bold">
                        {cliente.compras_total}
                      </span>
                    </td>
                    <td
                      className={`p-4 text-right font-bold text-lg ${
                        cliente.deuda_total > 0
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {new Intl.NumberFormat("es-AR", {
                        style: "currency",
                        currency: "ARS",
                      }).format(cliente.deuda_total)}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => abrirHistorial(cliente.nombre)}
                        className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-bold transition flex items-center gap-2 mx-auto"
                      >
                        <Eye size={18} />
                        Ver Historial
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Historial */}
      <HistorialClienteModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        clienteNombre={clienteSeleccionado}
      />
    </div>
  );
}
