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

      if (!resCaja.ok) throw new Error("Error al cargar caja");

      const dataCaja = await resCaja.json();
      setData(dataCaja);

      const resStock = await fetch(
        "https://pablo2389-pablo2389-pos-bebidas.onrender.com/dashboard/productos-bajo-stock",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (resStock.ok) {
        setProductosBajoStock(await resStock.json());
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
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-3 sm:p-6">
      
      <div className="max-w-7xl mx-auto w-full">

        {/* HEADER */}
        <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-6">

          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold flex items-center gap-2 text-gray-800">
              <TrendingUp className="text-purple-600" />
              Dashboard
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              {new Date().toLocaleDateString("es-AR")}
            </p>
          </div>

          {/* BOTONES */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full md:w-auto">

            <button
              onClick={() => setModalCierreOpen(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-bold w-full sm:w-auto"
            >
              💰 Caja
            </button>

            <button
              onClick={() => router.push("/")}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold w-full sm:w-auto"
            >
              🛒 POS
            </button>

            <button
              onClick={() => router.push("/clientes")}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-bold w-full sm:w-auto"
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

        {/* CONTENT */}
        {data && !loading && (
          <>
            {/* CARDS PRINCIPALES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

              <div className="bg-white p-4 md:p-6 rounded-xl shadow border">
                <div className="flex items-center gap-3">
                  <DollarSign className="text-green-600" />
                  <div>
                    <p className="text-sm text-gray-500">Total del día</p>
                    <p className="text-2xl md:text-3xl font-bold">
                      {formatearMoneda(data.total)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 md:p-6 rounded-xl shadow border">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-500">Pedidos</p>
                    <p className="text-2xl md:text-3xl font-bold">
                      {data.cantidad_pedidos}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* METODOS */}
            <div className="bg-white p-4 md:p-6 rounded-xl shadow mb-6">
              <h2 className="font-bold mb-4">Métodos de pago</h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(data?.por_metodo ?? {}).map(([m, v]) => (
                  <div key={m} className="bg-gray-50 p-3 rounded-lg border">
                    <p className="text-xs uppercase">{m}</p>
                    <p className="font-bold">{formatearMoneda(v)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* STOCK */}
            {productosBajoStock.length > 0 && (
              <div className="bg-white p-4 md:p-6 rounded-xl shadow mb-6">
                <h2 className="flex items-center gap-2 font-bold mb-4">
                  <AlertCircle className="text-orange-500" />
                  Stock bajo
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {productosBajoStock.map((p) => (
                    <div key={p.id} className="p-3 border rounded-lg bg-orange-50">
                      <p className="font-bold">{p.nombre}</p>
                      <p>Stock: {p.stock}</p>
                      <p className="text-sm">${p.precio}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ACCIONES */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

              <button
                onClick={() => router.push("/clientes")}
                className="bg-purple-500 text-white p-4 rounded-xl font-bold w-full"
              >
                <Users className="mx-auto mb-1" />
                Clientes
              </button>

              <button
                onClick={() => router.push("/productos")}
                className="bg-blue-500 text-white p-4 rounded-xl font-bold w-full"
              >
                <Package className="mx-auto mb-1" />
                Productos
              </button>

              <button
                onClick={() => setModalCierreOpen(true)}
                className="bg-green-500 text-white p-4 rounded-xl font-bold w-full"
              >
                <DollarSign className="mx-auto mb-1" />
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