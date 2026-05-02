"use client";

import {
  AlertCircle,
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CierreCajaModal from "../components/CierreCajaModal";

type DashboardData = {
  total: number;
  cantidad_pedidos: number;
  por_metodo: {
    [key: string]: number;
  };
};

type ProductoBajoStock = {
  id: number;
  nombre: string;
  stock: number;
  precio: number;
};

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [productosBajoStock, setProductosBajoStock] = useState<ProductoBajoStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalCierreOpen, setModalCierreOpen] = useState(false);

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

      const resCaja = await fetch("https://pablo2389-pablo2389-pos-bebidas.onrender.com/dashboard/caja-hoy", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!resCaja.ok) {
        if (resCaja.status === 401) {
          localStorage.clear();
          router.push("/login");
          return;
        }
        throw new Error("Error al cargar datos de caja");
      }

      const dataCaja = await resCaja.json();
      setData(dataCaja);

      const resStock = await fetch("https://pablo2389-pablo2389-pos-bebidas.onrender.com/dashboard/productos-bajo-stock", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (resStock.ok) {
        const dataStock = await resStock.json();
        setProductosBajoStock(dataStock);
      }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
     <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
              <TrendingUp size={40} className="text-purple-600" />
              Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Resumen de ventas del día - {new Date().toLocaleDateString("es-AR")}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setModalCierreOpen(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold transition flex items-center gap-2 shadow-lg"
            >
              💰 Cerrar Caja
            </button>
            <button
              onClick={() => router.push("/")}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold transition"
            >
              🛒 Ir a POS
            </button>
            <button
              onClick={() => router.push("/clientes")}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-bold transition"
            >
              👥 Clientes
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">⏳ Cargando datos...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 border-2 border-red-400 text-red-800 px-4 py-3 rounded-lg">
            ⚠️ {error}
          </div>
        ) : (
          data && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gradient-to-br from-green-200 to-green-100 p-8 rounded-2xl shadow-lg border-2 border-green-300">
                  <div className="flex items-center gap-4">
                    <DollarSign size={48} className="text-green-600" />
                    <div>
                      <p className="text-sm text-gray-700 font-semibold">💰 Total del Día</p>
                      <p className="text-5xl font-bold text-gray-900 mt-2">
                        {formatearMoneda(data.total)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-200 to-blue-100 p-8 rounded-2xl shadow-lg border-2 border-blue-300">
                  <div className="flex items-center gap-4">
                    <ShoppingCart size={48} className="text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-700 font-semibold">🛍️ Pedidos Realizados</p>
                      <p className="text-5xl font-bold text-gray-900 mt-2">
                        {data.cantidad_pedidos}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6 mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <DollarSign size={28} className="text-purple-600" />
                  Desglose por Método de Pago
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {Object.entries(data.por_metodo).map(([metodo, monto]) => (
                    <div
                      key={metodo}
                      className={`p-5 rounded-xl shadow-md border-2 ${
                        metodo.toLowerCase() === "efectivo"
                          ? "bg-gradient-to-br from-green-100 to-green-50 border-green-300"
                          : metodo.toLowerCase() === "transferencia"
                          ? "bg-gradient-to-br from-blue-100 to-blue-50 border-blue-300"
                          : metodo.toLowerCase() === "mp"
                          ? "bg-gradient-to-br from-cyan-100 to-cyan-50 border-cyan-300"
                          : "bg-gradient-to-br from-orange-100 to-orange-50 border-orange-300"
                      }`}
                    >
                      <p className="text-sm font-semibold text-gray-700 uppercase">{metodo}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {formatearMoneda(monto)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {productosBajoStock.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg border-2 border-orange-300 p-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <AlertCircle size={28} className="text-orange-600" />
                    ⚠️ Productos con Stock Bajo
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {productosBajoStock.map((prod) => (
                      <div
                        key={prod.id}
                        className="bg-gradient-to-br from-orange-100 to-orange-50 p-4 rounded-xl border-2 border-orange-300"
                      >
                        <p className="font-bold text-gray-900 text-lg">{prod.nombre}</p>
                        <p className="text-sm text-gray-700 mt-1">
                          Stock: <span className="font-bold text-orange-600">{prod.stock} unidades</span>
                        </p>
                        <p className="text-sm text-gray-700">Precio: {formatearMoneda(prod.precio)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <button
                  onClick={() => router.push("/clientes")}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white p-6 rounded-xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg transition"
                >
                  <Users size={32} />
                  Ver Clientes
                </button>

                <button
                  onClick={() => router.push("/productos")}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-6 rounded-xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg transition"
                >
                  <Package size={32} />
                  Productos
                </button>

                <button
                  onClick={() => setModalCierreOpen(true)}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-6 rounded-xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg transition"
                >
                  <DollarSign size={32} />
                  Cerrar Caja
                </button>
              </div>
            </>
          )
        )}
      </div>

      <CierreCajaModal isOpen={modalCierreOpen} onClose={() => setModalCierreOpen(false)} />
    </div>
  );
}
