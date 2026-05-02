"use client";

import { useMemo, useState } from "react";

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
      `Hola, este es tu ticket:%0ACliente: ${
        cliente || "-"
      }%0A${detalle}%0ATotal: ${formatCurrency(total)}`
    );

    const url = `https://wa.me/${phone}?text=${mensaje}`;
    window.open(url, "_blank");
  };

  return (
<<<<<<< HEAD
    <div className="min-h-screen bg-slate-100 overflow-x-hidden pb-4">
      {/* Header más compacto en móvil */}
      <header className="px-3 py-2 md:px-4 md:py-4 border-b bg-white shadow-sm">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-lg md:text-2xl font-bold text-slate-800">
            Caja rápida
          </h1>
          <p className="text-xs md:text-sm text-gray-500">
            Punto de venta optimizado para cualquier dispositivo.
=======
    <div className="min-h-screen bg-slate-100 overflow-x-hidden">
      <header className="px-4 sm:px-6 py-3 border-b bg-white flex justify-between items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Caja rápida</h1>
          <p className="text-xs sm:text-sm text-gray-600">
            Escribí producto y precio, como una caja registradora.
>>>>>>> c3d07b9397ac26ad722c84914f1eb640b470d86b
          </p>
        </div>
      </header>

<<<<<<< HEAD
      {/* Main responsive */}
      <main className="max-w-6xl mx-auto px-2 py-3 grid grid-cols-1 md:grid-cols-12 gap-3">
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
=======
      <main className="max-w-5xl mx-auto px-2 sm:px-4 py-3 flex flex-col md:flex-row gap-4">
        {/* Alta de ítem */}
        <section className="md:w-1/3 bg-white border rounded shadow-sm p-3 flex flex-col gap-3">
          <h2 className="text-base sm:text-lg font-semibold">Agregar ítem</h2>

          <div>
            <label className="block text-xs mb-1">Descripción</label>
            <input
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="border px-2 py-2 w-full rounded text-sm"
              placeholder="Ej: Azúcar Ledesma 1kg"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="block text-xs mb-1">Precio</label>
              <input
                type="number"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                className="border px-2 py-2 w-full rounded text-sm"
                placeholder="0"
              />
            </div>
            <div className="sm:w-24">
              <label className="block text-xs mb-1">Cantidad</label>
              <input
                type="number"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                className="border px-2 py-2 w-full rounded text-sm"
                placeholder="1"
                min={1}
              />
            </div>
          </div>

          <button
            onClick={agregarItem}
            className="mt-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
          >
            Agregar al carrito
          </button>
          <button
            onClick={vaciarCaja}
            className="mt-2 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded text-xs self-start"
          >
            Reset caja
          </button>
        </section>

        {/* Carrito */}
        <section className="md:w-2/3 bg-slate-50 rounded flex flex-col">
          <div className="p-3">
            <h2 className="text-base sm:text-lg font-semibold mb-2">
              Carrito
            </h2>

            {carrito.length === 0 ? (
              <p className="text-sm text-gray-600">
                No hay ítems agregados. Cargá uno desde la izquierda.
              </p>
            ) : (
              <div className="flex-1 border rounded bg-white shadow-sm mb-3 max-h-80 overflow-y-auto">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="border px-2 py-1 text-left">
                          Descripción
                        </th>
                        <th className="border px-2 py-1 text-center">
                          Cant.
                        </th>
                        <th className="border px-2 py-1 text-right">
                          Precio
                        </th>
                        <th className="border px-2 py-1 text-right">
                          Subt.
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {carrito.map((item) => {
                        const subt =
                          safeNumber(item.cantidad) *
                          safeNumber(item.precioUnitario);
                        return (
                          <tr key={item.id}>
                            <td className="border px-2 py-1">
                              {item.descripcion}
                            </td>
                            <td className="border px-2 py-1 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    decrementarCantidad(item.id)
                                  }
                                  className="px-2 py-1 border rounded"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min={1}
                                  value={item.cantidad}
                                  onChange={(e) =>
                                    cambiarCantidadItem(
                                      item.id,
                                      Number(e.target.value)
                                    )
                                  }
                                  className="w-14 border px-1 text-center"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    incrementarCantidad(item.id)
                                  }
                                  className="px-2 py-1 border rounded"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="border px-2 py-1 text-right">
                              <input
                                type="number"
                                min={0}
                                value={item.precioUnitario}
                                onChange={(e) =>
                                  cambiarPrecioItem(
                                    item.id,
                                    e.target.value
                                  )
                                }
                                className="w-20 border px-1 text-right"
                              />
                            </td>
                            <td className="border px-2 py-1 text-right">
                              {formatCurrency(subt)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Datos venta + WhatsApp */}
          <div className="mt-auto border-t bg-white rounded-t p-3 space-y-3 shadow-sm">
            <div>
              <label className="block text-xs mb-1">Cliente</label>
              <input
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                className="border px-2 py-2 w-full rounded text-sm"
              />
            </div>

            <div>
              <label className="block text-xs mb-1">
                Método de pago
              </label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                className="border px-2 py-2 w-full rounded text-sm"
>>>>>>> c3d07b9397ac26ad722c84914f1eb640b470d86b
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

          {/* Sección Cliente y Pago */}
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

<<<<<<< HEAD
            <div className="pt-3 border-t">
              <div className="flex justify-between items-center mb-3">
                <span className="text-slate-500 font-medium text-sm">
                  TOTAL:
                </span>
                <span className="text-xl md:text-2xl font-black text-blue-600">
                  {formatCurrency(total)}
                </span>
              </div>

              <button
                onClick={confirmarVenta}
                disabled={carrito.length === 0}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl disabled:opacity-50 shadow-lg transition-all transform active:scale-95 mb-2 text-sm md:text-base"
              >
                CONFIRMAR VENTA
              </button>

=======
            <div>
              <label className="block text-xs mb-1">
                Número WhatsApp (con código de país, solo dígitos)
              </label>
              <input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="border px-2 py-2 w-full rounded text-sm"
                placeholder="5492991234567"
              />
>>>>>>> c3d07b9397ac26ad722c84914f1eb640b470d86b
              <button
                type="button"
                onClick={enviarTicketWhatsApp}
                className="w-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 py-2 md:py-3 rounded-lg text-xs md:text-sm font-bold transition-all"
              >
                Enviar Ticket WhatsApp
              </button>
            </div>
          </section>
        </div>

<<<<<<< HEAD
        {/* Columna de Carrito */}
        <div className="md:col-span-8">
          <section className="bg-white border rounded-xl shadow-sm h-fit">
            <div className="p-3 md:p-4 border-b bg-slate-50 flex justify-between items-center">
              <h2 className="text-base md:text-lg font-semibold text-slate-800">
                Carrito ({carrito.length})
              </h2>
              {carrito.length > 0 && (
                <span className="text-xs md:text-sm font-bold text-blue-600 md:hidden">
                  {formatCurrency(total)}
                </span>
              )}
            </div>

            <div className="p-0">
              {carrito.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <p className="text-base md:text-lg">El carrito está vacío</p>
                  <p className="text-xs md:text-sm">
                    Agregá productos para empezar
                  </p>
                </div>
              ) : (
                <div className="table-responsive-container">
                  <table className="text-sm">
                    <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="px-4 py-3 text-left">Producto</th>
                        <th className="px-4 py-3 text-center">Cant.</th>
                        <th className="px-4 py-3 text-right">Unitario</th>
                        <th className="px-4 py-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {carrito.map((item) => {
                        const subt =
                          safeNumber(item.cantidad) *
                          safeNumber(item.precioUnitario);
                        return (
                          <tr
                            key={item.id}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="px-4 py-4 font-medium text-slate-800">
                              {item.descripcion}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => decrementarCantidad(item.id)}
                                  className="w-8 h-8 flex items-center justify-center border rounded-full bg-white hover:bg-red-50 hover:text-red-600 transition-all"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  value={item.cantidad}
                                  onChange={(e) =>
                                    cambiarCantidadItem(
                                      item.id,
                                      Number(e.target.value)
                                    )
                                  }
                                  className="w-12 text-center font-bold bg-transparent"
                                />
                                <button
                                  onClick={() => incrementarCantidad(item.id)}
                                  className="w-8 h-8 flex items-center justify-center border rounded-full bg-white hover:bg-green-50 hover:text-green-600 transition-all"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <input
                                type="number"
                                value={item.precioUnitario}
                                onChange={(e) =>
                                  cambiarPrecioItem(item.id, e.target.value)
                                }
                                className="w-20 text-right border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none"
                              />
                            </td>
                            <td className="px-4 py-4 text-right font-bold text-slate-900">
                              {formatCurrency(subt)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>
=======
            <p className="font-semibold text-right text-lg">
              Total: {formatCurrency(total)}
            </p>
            <button
              onClick={confirmarVenta}
              disabled={carrito.length === 0}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded disabled:opacity-50 shadow-lg"
            >
              Confirmar venta
            </button>
          </div>
        </section>
>>>>>>> c3d07b9397ac26ad722c84914f1eb640b470d86b
      </main>
    </div>
  );
}