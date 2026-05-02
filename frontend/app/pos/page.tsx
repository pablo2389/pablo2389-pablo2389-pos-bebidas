"use client";

import { useMemo, useState, useEffect } from "react";

type ItemCarrito = {
  id: number;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
};

export default function CajaRapida() {
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState<string>("");
  const [cantidad, setCantidad] = useState<string>("1");
  const [cliente, setCliente] = useState("");
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [ultimoId, setUltimoId] = useState(1);
  const [whatsapp, setWhatsapp] = useState("");

  const safeNumber = (v: any): number => {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(value);

  const total = useMemo(
    () =>
      carrito.reduce(
        (acc, item) =>
          acc + safeNumber(item.precioUnitario) * safeNumber(item.cantidad),
        0
      ),
    [carrito]
  );

  const agregarItem = () => {
    const desc = descripcion.trim();
    const p = safeNumber(precio);
    const c = safeNumber(cantidad);

    if (!desc) {
      alert("Escribí la descripción del producto");
      return;
    }
    if (p <= 0) {
      alert("El precio debe ser mayor a 0");
      return;
    }
    if (c <= 0) {
      alert("La cantidad debe ser mayor a 0");
      return;
    }

    const nuevo: ItemCarrito = {
      id: ultimoId,
      descripcion: desc,
      cantidad: c,
      precioUnitario: p,
    };

    setCarrito((prev) => [...prev, nuevo]);
    setUltimoId((id) => id + 1);
    setDescripcion("");
    setPrecio("");
    setCantidad("1");
  };

  const cambiarCantidadItem = (id: number, nuevaCantidad: number) => {
    const c = safeNumber(nuevaCantidad);
    if (c <= 0) {
      setCarrito((prev) => prev.filter((i) => i.id !== id));
      return;
    }
    setCarrito((prev) =>
      prev.map((i) => (i.id === id ? { ...i, cantidad: c } : i))
    );
  };

  const incrementarCantidad = (id: number) => {
    setCarrito((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, cantidad: i.cantidad + 1 } : i
      )
    );
  };

  const decrementarCantidad = (id: number) => {
    setCarrito((prev) =>
      prev
        .map((i) =>
          i.id === id ? { ...i, cantidad: i.cantidad - 1 } : i
        )
        .filter((i) => i.cantidad > 0)
    );
  };

  const cambiarPrecioItem = (id: number, nuevoPrecio: string) => {
    const p = safeNumber(nuevoPrecio);
    setCarrito((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, precioUnitario: p } : i
      )
    );
  };

  const vaciarCaja = () => {
    if (!confirm("¿Resetear caja? Se borra todo el carrito.")) return;
    setCarrito([]);
    setCliente("");
    setMetodoPago("efectivo");
    setWhatsapp("");
  };

  const confirmarVenta = () => {
    if (carrito.length === 0) {
      alert("No hay ítems en la caja");
      return;
    }
    if (!cliente.trim()) {
      alert("Ingresá el cliente");
      return;
    }

    const resumen = carrito
      .map(
        (i) =>
          `${i.cantidad} x ${i.descripcion} @ ${formatCurrency(
            i.precioUnitario
          )} = ${formatCurrency(i.cantidad * i.precioUnitario)}`
      )
      .join("\n");

    alert(
      `Venta confirmada\nCliente: ${cliente}\nPago: ${metodoPago}\n\n${resumen}\n\nTOTAL: ${formatCurrency(
        total
      )}`
    );

    setCarrito([]);
    setCliente("");
  };

  const enviarTicketWhatsApp = () => {
    if (!whatsapp.trim()) {
      alert("Ingresá un número de WhatsApp");
      return;
    }
    if (carrito.length === 0) {
      alert("No hay ítems en el carrito para enviar.");
      return;
    }

    const phone = whatsapp.replace(/\D/g, "");

    const detalle = carrito
      .map(
        (i) =>
          `${i.cantidad} x ${i.descripcion} (${formatCurrency(
            i.precioUnitario
          )})`
      )
      .join("%0A");

    const mensaje = encodeURIComponent(
      `Hola, este es tu ticket:\nCliente: ${
        cliente || "-"
      }\n${detalle.replace(/%0A/g, '\n')}\nTotal: ${formatCurrency(total)}`
    );

    const url = `https://wa.me/${phone}?text=${mensaje}`;
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-slate-100 overflow-x-hidden pb-4">
      <header className="px-3 py-2 md:px-4 md:py-4 border-b bg-white shadow-sm">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-lg md:text-2xl font-bold text-slate-800">
            Caja rápida
          </h1>
          <p className="text-xs md:text-sm text-gray-500">
            Punto de venta optimizado para cualquier dispositivo.
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-2 py-3 pb-32 md:pb-3 grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Columna de Carga */}
        <div className="md:col-span-4 flex flex-col gap-3">
          <section className="bg-white border rounded-xl shadow-sm p-3 flex flex-col gap-3">
            <h2 className="text-base md:text-lg font-semibold border-b pb-2">
              Nuevo Ítem
            </h2>

            <div className="space-y-2">
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700">
                  Descripción
                </label>
                <input
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="border-slate-300 border px-3 py-2 w-full rounded-lg text-sm md:text-base focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Ej: Coca 2.25L"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">
                    Precio
                  </label>
                  <input
                    type="number"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    className="border-slate-300 border px-3 py-2 w-full rounded-lg text-sm md:text-base focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    className="border-slate-300 border px-3 py-2 w-full rounded-lg text-sm md:text-base focus:ring-2 focus:ring-blue-500 outline-none transition-all text-center"
                    min={1}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={agregarItem}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 md:py-3 rounded-lg shadow-md transition-colors"
              >
                Agregar
              </button>
              <button
                onClick={vaciarCaja}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-2 md:px-4 md:py-3 rounded-lg text-xs md:text-sm font-medium transition-colors"
              >
                Reset
              </button>
            </div>
          </section>

          <section className="bg-white border rounded-xl shadow-sm p-3 flex flex-col gap-3">
            <h2 className="text-base md:text-lg font-semibold border-b pb-2">
              Finalizar
            </h2>

            <div className="space-y-2">
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700">
                  Cliente
                </label>
                <input
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  className="border-slate-300 border px-3 py-2 w-full rounded-lg text-sm md:text-base focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Nombre del cliente"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700">
                  Método de pago
                </label>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  className="border-slate-300 border px-3 py-2 w-full rounded-lg text-sm md:text-base bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="mp">MercadoPago</option>
                  <option value="fiado">Fiado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700">
                  WhatsApp
                </label>
                <input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="border-slate-300 border px-3 py-2 w-full rounded-lg text-sm md:text-base focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="549..."
                />
              </div>
            </div>

            <div className="pt-3 border-t">
              <div className="flex justify-between items-center mb-3">
                <span className="text-slate-500 font-medium text-sm">TOTAL:</span>
                <span className="text-xl md:text-2xl font-black text-blue-600">
                  {formatCurrency(total)}
                </span>
              </div>

              {/* Botones visibles en Desktop */}
              <div className="hidden md:flex flex-col gap-2">
                <button
                  onClick={confirmarVenta}
                  disabled={carrito.length === 0}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl disabled:opacity-50 shadow-lg transition-all transform active:scale-95"
                >
                  CONFIRMAR VENTA
                </button>
                <button
                  onClick={enviarTicketWhatsApp}
                  className="w-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 py-3 rounded-lg text-sm font-bold transition-all"
                >
                  Enviar Ticket WhatsApp
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Columna de Carrito */}
        <div className="md:col-span-8">
          <section className="bg-white border rounded-xl shadow-sm h-fit">
            <div className="p-3 md:p-4 border-b bg-slate-50 flex justify-between items-center">
              <h2 className="text-base md:text-lg font-semibold text-slate-800">
                Carrito ({carrito.length})
              </h2>
            </div>

            <div className="overflow-x-auto">
              {carrito.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <p className="text-base md:text-lg">El carrito está vacío</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="px-4 py-3 text-left">Producto</th>
                      <th className="px-4 py-3 text-center">Cant.</th>
                      <th className="px-4 py-3 text-right">Unitario</th>
                      <th className="px-4 py-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {carrito.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-4 font-medium text-slate-800">
                          {item.descripcion}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => decrementarCantidad(item.id)}
                              className="w-8 h-8 flex items-center justify-center border rounded-full bg-white hover:bg-red-50 hover:text-red-600"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-bold">{item.cantidad}</span>
                            <button
                              onClick={() => incrementarCantidad(item.id)}
                              className="w-8 h-8 flex items-center justify-center border rounded-full bg-white hover:bg-green-50 hover:text-green-600"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          {formatCurrency(item.precioUnitario)}
                        </td>
                        <td className="px-4 py-4 text-right font-bold text-slate-900">
                          {formatCurrency(item.cantidad * item.precioUnitario)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Footer fijo solo en móviles */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col gap-2">
          <button
            onClick={confirmarVenta}
            disabled={carrito.length === 0}
            className="w-full bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-transform"
          >
            CONFIRMAR VENTA ({formatCurrency(total)})
          </button>
          <button
            onClick={enviarTicketWhatsApp}
            className="w-full bg-emerald-100 text-emerald-700 font-bold py-3 rounded-lg text-sm"
          >
            Enviar WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}