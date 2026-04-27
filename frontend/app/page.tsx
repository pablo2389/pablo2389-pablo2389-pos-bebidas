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

  const confirmarVenta = async () => {
    if (carrito.length === 0) {
      alert("No hay ítems en la caja");
      return;
    }
    if (!cliente.trim()) {
      alert("Ingresá el cliente");
      return;
    }

    const payload = {
      cliente,
      metodo_pago: metodoPago,
      items: carrito.map((i) => ({
        producto_id: 1,
        cantidad: i.cantidad,
      })),
    };

    // >>>>>> ACA REUSAMOS EL TOKEN DEL POS GRANDE
    const token = localStorage.getItem("token");

    try {
      const resp = await fetch("https://pablo2389-pablo2389-pos-bebidas.onrender.com/pedidos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const texto = await resp.text();
        console.error("Error al crear pedido:", texto);
        alert("Error al registrar la venta en el backend");
        return;
      }

      alert(
        `Venta confirmada\nCliente: ${cliente}\nPago: ${metodoPago}\n\nTOTAL: ${formatCurrency(
          total
        )}`
      );

      setCarrito([]);
      setCliente("");
    } catch (err) {
      console.error(err);
      alert("No se pudo conectar con el backend (pablo2389-pablo2389-pos-bebidas.onrender.com)");
    }
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

    const phone = whatsapp.replace(/\D/g, "");

    const detalle = carrito
      .map(
        (i) =>
          `${i.cantidad} x ${i.descripcion}  -  ${formatCurrency(
            i.precioUnitario
          )}`
      )
      .join("\n");

    const mensajePlano =
      `*MARKET GRACE*\n` +
      `Ticket de compra\n\n` +
      `Cliente: ${cliente || "-"}\n` +
      `--------------------\n` +
      `${detalle}\n` +
      `--------------------\n` +
      `*Total: ${formatCurrency(total)}*\n` +
      `Método de pago: ${metodoPago}`;

    const mensaje = encodeURIComponent(mensajePlano);

    const url = `https://wa.me/${phone}?text=${mensaje}`;
    window.open(url, "_blank");
  };

  // =====================
  // Ticket PDF
  // =====================

  const generarTicketPDF = async () => {
    if (carrito.length === 0) {
      alert("No hay ítems en el carrito para imprimir.");
      return;
    }

    const { default: JsPDF } = await import("jspdf");

    const doc = new JsPDF({
      unit: "mm",
      format: [80, 200],
    });

    let y = 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("MARKET GRACE", 40, y, { align: "center" });
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Caja rápida", 40, y, { align: "center" });
    y += 4;

    const fechaHora = new Date().toLocaleString();
    doc.text(`Fecha: ${fechaHora}`, 4, y);
    y += 4;

    doc.text(`Cliente: ${cliente || "-"}`, 4, y);
    y += 4;

    doc.text(`Pago: ${metodoPago}`, 4, y);
    y += 4;

    doc.text("----------------------------------------", 4, y);
    y += 4;

    doc.setFont("helvetica", "bold");
    doc.text("Cant", 4, y);
    doc.text("Desc", 18, y);
    doc.text("P.U.", 48, y);
    doc.text("Subt.", 64, y);
    y += 3;

    doc.setFont("helvetica", "normal");

    carrito.forEach((item) => {
      const cant = String(item.cantidad);
      const desc = item.descripcion;
      const precioUnit = formatCurrency(item.precioUnitario);
      const sub = formatCurrency(
        safeNumber(item.cantidad) * safeNumber(item.precioUnitario)
      );

      doc.text(cant, 4, y);

      const maxWidthDesc = 28;
      const descLines = doc.splitTextToSize(desc, maxWidthDesc);
      doc.text(descLines as string[], 18, y);

      doc.text(precioUnit, 76, y, { align: "right" });
      doc.text(sub, 76, y + 3, { align: "right" });

      y += 6;
      if (y > 180) {
        doc.addPage();
        y = 6;
      }
    });

    doc.text("----------------------------------------", 4, y);
    y += 5;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`TOTAL: ${formatCurrency(total)}`, 76, y, { align: "right" });

    y += 8;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("¡Gracias por su compra!", 40, y, { align: "center" });

    doc.save("ticket-caja-rapida.pdf");
  };

  // =====================
  // UI
  // =====================

  return (
    <div className="h-screen flex flex-col bg-slate-100">
      <header className="px-6 py-3 border-b bg-white flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Speed Box</h1>
          <p className="text-sm text-gray-600">
            Escribí producto y precio, como en una caja registradora.
          </p>
        </div>
        <button
          type="button"
          onClick={() => (window.location.href = "/dashboard")}
          className="text-sm bg-slate-800 text-white px-3 py-1 rounded"
        >
          Ver dashboard
        </button>
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
                          <div className="flex items center justify-center gap-1">
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

          {/* Datos venta + WhatsApp + PDF */}
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
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={enviarTicketWhatsApp}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded text-sm"
                >
                  WhatsApp
                </button>
                <button
                  type="button"
                  onClick={generarTicketPDF}
                  className="flex-1 bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded text-sm"
                >
                  Ticket PDF
                </button>
              </div>
            </div>

            <p className="font-semibold text-right text-lg">
              Total: {formatCurrency(total)}
            </p>
            <button
              onClick={confirmarVenta}
              disabled={carrito.length === 0}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Confirmar venta
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}// Force rebuild
