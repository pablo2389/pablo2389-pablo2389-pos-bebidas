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

      const resCaja = await fetch(
        "https://pablo2389-pablo2389-pos-bebidas.onrender.com/dashboard/caja-hoy",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

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

      const resStock = await fetch(
        "https://pablo2389-pablo2389-pos-bebidas.onrender.com/dashboard/productos-bajo-stock",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

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

  const formatearMoneda = (monto: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(monto);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-3 sm:p-6">
      <div className="w-full max-w-full">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 flex items-center gap-3">
              <TrendingUp size={40} className="text-purple-600" />
              Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Resumen de ventas del día - {new Date().toLocaleDateString("es-AR")}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setModalCierreOpen(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg"
            >
              💰 Cerrar Caja
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

        {/* LOADING / ERROR */}
        {loading ? (
          <p className="text-center text-gray-600">⏳ Cargando datos...</p>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-800 p-4 rounded-lg">
            ⚠️ {error}
          </div>
        ) : (
          data && (
            <>
              {/* CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

                <div className="bg-green-100 p-6 rounded-2xl shadow border">
                  <div className="flex items-center gap-4">
                    <DollarSign size={40} className="text-green-600" />
                    <div>
                      <p>Total del Día</p>
                      <p className="text-3xl font-bold">
                        {formatearMoneda(data.total)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-100 p-6 rounded-2xl shadow border">
                  <div className="flex items-center gap-4">
                    <ShoppingCart size={40} className="text-blue-600" />
                    <div>
                      <p>Pedidos</p>
                      <p className="text-3xl font-bold">
                        {data.cantidad_pedidos}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* METODOS */}
              <div className="bg-white p-6 rounded-2xl shadow mb-6">
                <h2 className="text-xl font-bold mb-4">
                  Desglose de pagos
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(data.por_metodo).map(([metodo, monto]) => (
                    <div key={metodo} className="p-4 rounded-lg border bg-gray-50">
                      <p className="font-semibold uppercase">{metodo}</p>
                      <p className="text-xl font-bold">
                        {formatearMoneda(monto)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* STOCK */}
              {productosBajoStock.length > 0 && (
                <div className="bg-white p-6 rounded-2xl shadow mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <AlertCircle className="text-orange-500" />
                    Stock bajo
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    {productosBajoStock.map((p) => (
                      <div
                        key={p.id}
                        className="p-4 border rounded-lg bg-orange-50"
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => router.push("/clientes")}
                  className="bg-purple-500 text-white p-4 rounded-xl"
                >
                  <Users /> Clientes
                </button>

                <button
                  onClick={() => router.push("/productos")}
                  className="bg-blue-500 text-white p-4 rounded-xl"
                >
                  <Package /> Productos
                </button>

                <button
                  onClick={() => setModalCierreOpen(true)}
                  className="bg-green-500 text-white p-4 rounded-xl"
                >
                  <DollarSign /> Caja
                </button>
              </div>
            </>
          )
        )}
      </div>

      <CierreCajaModal
        isOpen={modalCierreOpen}
        onClose={() => setModalCierreOpen(false)}
      />
    </div>
  );
}