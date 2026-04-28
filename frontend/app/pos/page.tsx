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

  // WhatsApp
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
    }).format(value); // [web:27][web:83]

  const total = useMemo(
    () =>
      carrito.reduce(
        (acc, item) =>
          acc +
          safeNumber(item.precioUnitario) * safeNumber(item.cantidad),
        0
      ),
    [carrito]
  );

  // =====================
  // Acciones de caja
  // =====================

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
          )} = ${formatCurrency(
            i.cantidad * i.precioUnitario
          )}`
      )
      .join("\n");

    alert(
      `Venta confirmada\nCliente: ${cliente}\nPago: ${metodoPago}\n\n${resumen}\n\nTOTAL: ${formatCurrency(
        total
      )}`
    );

    // Más adelante acá hacés POST a tu API si querés.
    setCarrito([]);
    setCliente("");
  };

  // =====================
  // WhatsApp
  // =====================

  const enviarTicketWhatsApp = () => {
    if (!whatsapp.trim()) {
      alert("Ingresá un número de WhatsApp");
      return;
    }
    if (carrito.length === 0) {
      alert("No hay ítems en el carrito para enviar.");
      return;
    }

    const phone = whatsapp.replace(/\D/g, ""); // solo dígitos

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
    window.open(url, "_blank"); // [web:79][web:84]
  };

  // =====================
  // UI
  // =====================

  return (
    <div className="h-screen flex flex-col bg-slate-100">
      <header className="px-6 py-3 border-b bg-white flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Caja rápida</h1>
          <p className="text-sm text-gray-600">
            Escribí producto y precio, como una caja registradora.
          </p>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Alta de ítem */}
        <section className="md:w-1/3 p-4 border-r bg-white flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Agregar ítem</h2>
          <div>
            <label className="block text-xs mb-1">Descripción</label>
            <input
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="border px-2 py-1 w-full rounded"
              placeholder="Ej: Azúcar Ledesma 1kg"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs mb-1">Precio</label>
              <input
                type="number"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                className="border px-2 py-1 w-full rounded"
                placeholder="0"
              />
            </div>
            <div className="w-24">
              <label className="block text-xs mb-1">Cantidad</label>
              <input
                type="number"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                className="border px-2 py-1 w-full rounded"
                placeholder="1"
                min={1}
              />
            </div>
          </div>
          <button
            onClick={agregarItem}
            className="mt-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Agregar al carrito
          </button>
          <button
            onClick={vaciarCaja}
            className="mt-2 bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-xs self-start"
          >
            Reset caja
          </button>
        </section>

        {/* Carrito */}
        <section className="md:w-2/3 p-4 flex flex-col bg-slate-50">
          <h2 className="text-lg font-semibold mb-2">Carrito</h2>

          {carrito.length === 0 ? (
            <p className="text-sm text-gray-600">
              No hay ítems agregados. Cargá uno desde la izquierda.
            </p>
          ) : (
            <div className="flex-1 overflow-y-auto border rounded bg-white shadow-sm mb-3">
              <table className="w-full text-xs">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="border px-2 py-1 text-left">
                      Descripción
                    </th>
                    <th className="border px-2 py-1 text-center">Cant.</th>
                    <th className="border px-2 py-1 text-right">Precio</th>
                    <th className="border px-2 py-1 text-right">Subt.</th>
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
                              cambiarPrecioItem(item.id, e.target.value)
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
          )}

          {/* Datos venta + WhatsApp */}
          <div className="mt-auto border-t pt-3 space-y-2 bg-white rounded shadow-sm p-3">
            <div>
              <label className="block text-xs mb-1">Cliente</label>
              <input
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                className="border px-2 py-1 w-full rounded"
              />
            </div>
            <div>
              <label className="block text-xs mb-1">
                Método de pago
              </label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                className="border px-2 py-1 w-full rounded"
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="mp">MercadoPago</option>
                <option value="fiado">Fiado</option>
              </select>
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-xs mb-1">
                Número WhatsApp (con código de país, solo dígitos)
              </label>
              <input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="border px-2 py-1 w-full rounded"
                placeholder="5492991234567"
              />
              <button
                type="button"
                onClick={enviarTicketWhatsApp}
                className="mt-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded text-sm"
              >
                Abrir WhatsApp con ticket
              </button>
            </div>

            <p className="font-semibold text-right text-lg">
              Total: {formatCurrency(total)}
            </p>
            <button
              onClick={confirmarVenta}
              disabled={carrito.length === 0}
                           className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded disabled:opacity-50 sticky bottom-0 z-10 md:relative"
              Confirmar venta
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

