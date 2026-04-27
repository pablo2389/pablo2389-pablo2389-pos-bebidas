"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Producto {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
}

export default function ProductosPage() {
  const router = useRouter();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Producto | null>(null);

  // Form state
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("");

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/");
        return;
      }

      const res = await fetch("https://pablo2389-pablo2389-pos-bebidas.onrender.com/productos", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Error al cargar productos");
      }

      const data = await res.json();
      setProductos(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const abrirModalNuevo = () => {
    setEditando(null);
    setNombre("");
    setPrecio("");
    setStock("");
    setShowModal(true);
  };

  const abrirModalEditar = (producto: Producto) => {
    setEditando(producto);
    setNombre(producto.nombre);
    setPrecio(producto.precio.toString());
    setStock(producto.stock.toString());
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditando(null);
    setNombre("");
    setPrecio("");
    setStock("");
  };

  const guardarProducto = async () => {
    try {
      const token = localStorage.getItem("token");

      const body = {
        nombre,
        precio: parseFloat(precio),
        stock: parseInt(stock),
      };

      let res;
      if (editando) {
        // Actualizar
        res = await fetch(`https://pablo2389-pablo2389-pos-bebidas.onrender.com/productos/${editando.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
      } else {
        // Crear
        res = await fetch("https://pablo2389-pablo2389-pos-bebidas.onrender.com/productos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
      }

      if (!res.ok) {
        throw new Error("Error al guardar producto");
      }

      cerrarModal();
      cargarProductos();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const eliminarProducto = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return;

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`https://pablo2389-pablo2389-pos-bebidas.onrender.com/productos/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Error al eliminar producto");
      }

      cargarProductos();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-2xl font-bold text-indigo-600">Cargando productos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">📦 Gestión de Productos</h1>
              <p className="text-gray-600">Administra tu inventario completo</p>
            </div>
            <button
              onClick={cerrarSesion}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              Cerrar Sesión
            </button>
          </div>

          {/* Botones de navegación */}
          <div className="mt-6 flex gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition font-semibold"
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => router.push("/pos")}
              className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition font-semibold"
            >
              🛒 POS
            </button>
            <button
              onClick={() => router.push("/clientes")}
              className="px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition font-semibold"
            >
              👥 Clientes
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Productos</p>
                <p className="text-3xl font-bold text-indigo-600">{productos.length}</p>
              </div>
              <div className="text-4xl">📦</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Stock Total</p>
                <p className="text-3xl font-bold text-green-600">
                  {productos.reduce((sum, p) => sum + p.stock, 0)}
                </p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Bajo Stock</p>
                <p className="text-3xl font-bold text-red-600">
                  {productos.filter((p) => p.stock <= 10).length}
                </p>
              </div>
              <div className="text-4xl">⚠️</div>
            </div>
          </div>
        </div>

        {/* Botón Agregar */}
        <div className="mb-6">
          <button
            onClick={abrirModalNuevo}
            className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition font-bold text-lg shadow-lg"
          >
            ➕ Agregar Producto Nuevo
          </button>
        </div>

        {/* Tabla de productos */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">ID</th>
                  <th className="px-6 py-4 text-left font-semibold">Producto</th>
                  <th className="px-6 py-4 text-left font-semibold">Precio</th>
                  <th className="px-6 py-4 text-left font-semibold">Stock</th>
                  <th className="px-6 py-4 text-left font-semibold">Estado</th>
                  <th className="px-6 py-4 text-center font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <div className="text-6xl mb-4">📦</div>
                      <p className="text-xl">No hay productos registrados</p>
                      <p className="text-sm mt-2">Agregá tu primer producto usando el botón de arriba</p>
                    </td>
                  </tr>
                ) : (
                  productos.map((producto, idx) => (
                    <tr
                      key={producto.id}
                      className={`border-b hover:bg-gray-50 transition ${
                        idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="px-6 py-4 font-medium text-gray-700">{producto.id}</td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-800">{producto.nombre}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-green-600 font-bold">
                          $ {producto.precio.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-700">{producto.stock} unidades</div>
                      </td>
                      <td className="px-6 py-4">
                        {producto.stock <= 5 ? (
                          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                            ⚠️ Crítico
                          </span>
                        ) : producto.stock <= 10 ? (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">
                            ⚡ Bajo
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                            ✅ OK
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => abrirModalEditar(producto)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-semibold"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => eliminarProducto(producto.id)}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-semibold"
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Agregar/Editar */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {editando ? "✏️ Editar Producto" : "➕ Nuevo Producto"}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre del Producto
                  </label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Ej: Coca Cola 2L"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Precio ($)
                  </label>
                  <input
                    type="number"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="1500.00"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Stock (unidades)
                  </label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="50"
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-4">
                <button
                  onClick={guardarProducto}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition font-bold"
                >
                  💾 Guardar
                </button>
                <button
                  onClick={cerrarModal}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition font-bold"
                >
                  ❌ Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
