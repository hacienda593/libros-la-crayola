"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase";
import {
  ChevronDown, ChevronUp, Search, LogOut, BookOpen, BarChart3,
  Printer, RefreshCw, XCircle, MessageCircle
} from "lucide-react";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "crayola2025";

type Pedido = {
  id: string; codigo: string;
  nombre_est: string; nombre_pad: string; telefono: string; cedula: string;
  libro: { titulo: string; grado: string; precio: number } | null;
  unidad: { nombre: string } | null;
  cantidad: number; total: number;
  estado_pago: string; estado_prov: string;
  comp_numero: string | null; comp_monto: number | null;
  punto_venta: string | null;
  created_at: string;
};

type ResumenLibro = {
  libro_id: string; titulo: string; grado: string;
  pagados: number; pendiente_pedir: number; pedidos_prov: number;
  recibidos: number; entregados: number;
};

const ESTADO_PROV_LABEL: Record<string, string> = {
  pendiente_pedir: "Sin pedir",
  pedido:          "Pedido",
  recibido:        "Recibido",
  entregado:       "Entregado",
};

function badgeProv(estado: string) {
  const base = "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase";
  if (estado === "entregado") return `${base} bg-green-100 text-green-700`;
  if (estado === "recibido")  return `${base} bg-blue-100 text-blue-700`;
  if (estado === "pedido")    return `${base} bg-purple-100 text-purple-700`;
  return `${base} bg-zinc-200 text-zinc-700`;
}

function badgeVenta(pv: string | null) {
  if (pv === "caja") return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-orange-100 text-orange-700">Caja</span>
  );
  return null;
}

type TabVista = "pendiente_pago" | "pagado" | "entregado" | "anulado" | "consolidado";

/* ── WhatsApp helpers ── */
function waUrl(telefono: string, msg: string) {
  const tel = telefono.replace(/\D/g, "").replace(/^0/, "593");
  return `https://wa.me/${tel}?text=${encodeURIComponent(msg)}`;
}

function msgPendientePago(p: Pedido) {
  const fecha = new Date(p.created_at).toLocaleDateString("es-EC", { day: "2-digit", month: "2-digit", year: "numeric" });
  return (
    `Estimado/a ${p.nombre_pad}, le informamos que hemos recibido su solicitud de pedido del libro ` +
    `*${p.libro?.titulo ?? ""}* (${p.libro?.grado ?? ""}) por un valor de *$${p.total.toFixed(2)}*, ` +
    `registrada el ${fecha} con codigo *${p.codigo}*.\n\n` +
    `Sin embargo, aun no hemos recibido el comprobante de pago correspondiente. ` +
    `Le solicitamos adjuntar el comprobante de transferencia a la brevedad posible; ` +
    `de lo contrario, el pedido sera anulado automaticamente.\n\n` +
    `Banco Pichincha · Ahorro: *2204882211* · Titular: Liliana Gonzalez\n\n` +
    `Gracias por su comprension. — La Crayola`
  );
}

function msgPagadoListo(p: Pedido) {
  const fecha = new Date(p.created_at).toLocaleDateString("es-EC", { day: "2-digit", month: "2-digit", year: "numeric" });
  return (
    `Estimado/a ${p.nombre_pad}, nos complace informarle que su libro ` +
    `*${p.libro?.titulo ?? ""}* (${p.libro?.grado ?? ""}), solicitado el ${fecha} con codigo *${p.codigo}*, ` +
    `ya se encuentra disponible en nuestra libreria *La Crayola*.\n\n` +
    `Le invitamos a acercarse en nuestro horario de atencion para retirar su pedido. ` +
    `Por favor presente el codigo de pedido al momento de retirar.\n\n` +
    `Gracias por su preferencia. — La Crayola`
  );
}

function msgEntregado(p: Pedido) {
  const hoy = new Date().toLocaleDateString("es-EC", { day: "2-digit", month: "2-digit", year: "numeric" });
  return (
    `Estimado/a ${p.nombre_pad}, confirmamos que el dia de hoy *${hoy}* le fue entregado el libro ` +
    `*${p.libro?.titulo ?? ""}* (${p.libro?.grado ?? ""}) correspondiente al pedido *${p.codigo}*.\n\n` +
    `Esperamos que sea de mucho provecho. Gracias por confiar en La Crayola.`
  );
}

/* ── Recibo impresora 80mm ── */
function imprimirRecibo(p: Pedido) {
  const fecha = new Date(p.created_at).toLocaleDateString("es-EC", { day: "2-digit", month: "2-digit", year: "numeric" });
  const fechaEntrega = new Date().toLocaleDateString("es-EC", { day: "2-digit", month: "2-digit", year: "numeric" });
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Recibo ${p.codigo}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Courier New',monospace;font-size:11px;width:72mm;padding:4mm 3mm;color:#000}
  .c{text-align:center}.b{font-weight:bold}
  .line{border-top:1px dashed #000;margin:3mm 0}
  .row{display:flex;justify-content:space-between;margin-bottom:1.5mm}
  .big{font-size:20px;font-weight:bold;letter-spacing:3px}
  @media print{body{margin:0}@page{margin:0;size:80mm auto}}
</style></head><body>
  <div class="c b" style="font-size:13px;margin-bottom:1mm">LA CRAYOLA</div>
  <div class="c" style="font-size:10px;margin-bottom:1mm">Libros Escolares</div>
  <div class="c" style="font-size:9px;margin-bottom:3mm">WhatsApp: 0984341953</div>
  <div class="line"></div>
  <div class="c b" style="font-size:10px;margin-bottom:2mm">RECIBO DE ENTREGA</div>
  <div class="c big" style="margin-bottom:3mm">${p.codigo}</div>
  <div class="line"></div>
  <div class="row"><span>Fecha pedido:</span><span>${fecha}</span></div>
  <div class="row"><span>Fecha entrega:</span><span>${fechaEntrega}</span></div>
  <div class="line"></div>
  <div style="margin-bottom:1mm">Representante:</div>
  <div style="margin-bottom:2mm;font-weight:bold">${p.nombre_pad}</div>
  ${p.cedula ? `<div class="row"><span>Cedula/RUC:</span><span>${p.cedula}</span></div>` : ""}
  <div class="row"><span>Telefono:</span><span>${p.telefono}</span></div>
  ${p.unidad ? `<div class="row"><span>Unidad:</span><span>${p.unidad.nombre}</span></div>` : ""}
  <div class="line"></div>
  <div style="margin-bottom:1mm">Libro:</div>
  <div style="margin-bottom:1mm;font-weight:bold">${p.libro?.titulo ?? ""}</div>
  <div class="row"><span>Grado:</span><span>${p.libro?.grado ?? ""}</span></div>
  <div class="line"></div>
  <div class="row b" style="font-size:13px"><span>TOTAL PAGADO:</span><span>$${p.total.toFixed(2)}</span></div>
  ${p.comp_numero ? `<div class="row" style="font-size:9px"><span>Comprobante:</span><span>${p.comp_numero}</span></div>` : ""}
  <div class="line"></div>
  <div style="margin-bottom:10mm;font-size:10px">Firma de recibido:</div>
  <div style="border-top:1px solid #000;width:55mm;margin:0 auto 1mm"></div>
  <div class="c" style="font-size:9px;margin-top:1mm">${p.nombre_pad}</div>
  <div class="c" style="font-size:9px">${p.cedula ?? ""}</div>
  <div class="line" style="margin-top:5mm"></div>
  <div class="c" style="font-size:9px">Entregado por: _______________</div>
  <div class="c" style="font-size:8px;margin-top:3mm">Gracias por su compra · La Crayola</div>
</body></html>`;
  const win = window.open("", "_blank", "width=400,height=600");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}

export default function AdminPage() {
  const [autenticado, setAutenticado] = useState(false);
  const [password, setPassword]       = useState("");
  const [errPass, setErrPass]         = useState("");

  const [tab, setTab]               = useState<TabVista>("pendiente_pago");
  const [pedidos, setPedidos]       = useState<Pedido[]>([]);
  const [cargando, setCargando]     = useState(false);
  const [busqueda, setBusqueda]     = useState("");
  const [expandido, setExpandido]   = useState<string | null>(null);
  const [resumen, setResumen]       = useState<ResumenLibro[]>([]);

  const [compNumero, setCompNumero] = useState("");
  const [compMonto, setCompMonto]   = useState("");
  const [guardando, setGuardando]   = useState(false);
  const [msgComp, setMsgComp]       = useState<Record<string, string>>({});

  /* confirmación de anulación */
  const [confirmAnular, setConfirmAnular] = useState<string | null>(null);

  function login() {
    if (password === ADMIN_PASSWORD) { setAutenticado(true); cargarPedidos(); }
    else setErrPass("Contraseña incorrecta.");
  }

  async function cargarPedidos() {
    setCargando(true);
    const { data } = await getSupabase()
      .from("lb_pedidos")
      .select(`id, codigo, nombre_est, nombre_pad, cedula, telefono,
               cantidad, total, estado_pago, estado_prov, punto_venta,
               comp_numero, comp_monto, created_at,
               libro:lb_libros(titulo, grado, precio),
               unidad:lb_unidades(nombre)`)
      .order("created_at", { ascending: false });
    setPedidos((data as unknown as Pedido[]) ?? []);
    calcularResumen((data as unknown as Pedido[]) ?? []);
    setCargando(false);
  }

  function calcularResumen(lista: Pedido[]) {
    const map: Record<string, ResumenLibro> = {};
    lista.filter(p => p.estado_pago !== "anulado").forEach(p => {
      if (!p.libro) return;
      const key = p.libro.titulo + p.libro.grado;
      if (!map[key]) map[key] = {
        libro_id: p.id, titulo: p.libro.titulo, grado: p.libro.grado,
        pagados: 0, pendiente_pedir: 0, pedidos_prov: 0, recibidos: 0, entregados: 0,
      };
      if (p.estado_pago === "pagado") map[key].pagados++;
      if (p.estado_prov === "pendiente_pedir" && p.estado_pago === "pagado") map[key].pendiente_pedir++;
      if (p.estado_prov === "pedido")    map[key].pedidos_prov++;
      if (p.estado_prov === "recibido")  map[key].recibidos++;
      if (p.estado_prov === "entregado") map[key].entregados++;
    });
    setResumen(Object.values(map));
  }

  async function guardarComprobante(pedido: Pedido) {
    if (!compNumero.trim() || !compMonto.trim()) {
      setMsgComp(m => ({ ...m, [pedido.id]: "Completa número y monto." })); return;
    }
    const monto = parseFloat(compMonto);
    if (isNaN(monto) || monto <= 0) { setMsgComp(m => ({ ...m, [pedido.id]: "Monto inválido." })); return; }

    setGuardando(true);
    setMsgComp(m => ({ ...m, [pedido.id]: "" }));

    const { data: compExistente } = await getSupabase()
      .from("lb_comprobantes").select("*").eq("numero", compNumero.trim()).maybeSingle();

    const montoUsadoPrevio = compExistente?.monto_usado ?? 0;
    const totalComp        = compExistente?.monto_total ?? monto;
    const disponible       = totalComp - montoUsadoPrevio;

    if (disponible < pedido.total) {
      setMsgComp(m => ({ ...m, [pedido.id]: `Comprobante solo tiene $${disponible.toFixed(2)} disponibles.` }));
      setGuardando(false); return;
    }

    if (compExistente) {
      await getSupabase().from("lb_comprobantes")
        .update({ monto_usado: montoUsadoPrevio + pedido.total }).eq("numero", compNumero.trim());
    } else {
      await getSupabase().from("lb_comprobantes")
        .insert({ numero: compNumero.trim(), monto_total: monto, monto_usado: pedido.total });
    }

    await getSupabase().from("lb_pedidos").update({
      estado_pago: "pagado", comp_numero: compNumero.trim(), comp_monto: monto,
    }).eq("id", pedido.id);

    setMsgComp(m => ({ ...m, [pedido.id]: "Pago verificado." }));
    setCompNumero(""); setCompMonto("");
    setGuardando(false);
    cargarPedidos();
  }

  async function actualizarEstadoProv(pedido: Pedido, estado: string) {
    await getSupabase().from("lb_pedidos").update({ estado_prov: estado }).eq("id", pedido.id);
    /* al marcar entregado: imprimir + abrir WhatsApp */
    if (estado === "entregado") {
      imprimirRecibo({ ...pedido, estado_prov: "entregado" });
      setTimeout(() => {
        window.open(waUrl(pedido.telefono, msgEntregado(pedido)), "_blank");
      }, 600);
    }
    cargarPedidos();
  }

  async function anularPedido(pedidoId: string) {
    await getSupabase().from("lb_pedidos")
      .update({ estado_pago: "anulado", estado_prov: "pendiente_pedir" })
      .eq("id", pedidoId);
    setConfirmAnular(null);
    setExpandido(null);
    cargarPedidos();
  }

  /* ── Contadores ── */
  const contadores = {
    pendiente_pago: pedidos.filter(p => p.estado_pago === "pendiente_pago").length,
    pagado:         pedidos.filter(p => p.estado_pago === "pagado" && p.estado_prov !== "entregado").length,
    entregado:      pedidos.filter(p => p.estado_prov === "entregado").length,
    anulado:        pedidos.filter(p => p.estado_pago === "anulado").length,
  };

  function filtrarPorTab(lista: Pedido[]): Pedido[] {
    const q = busqueda.toLowerCase();
    const match = (p: Pedido) => !q
      || p.codigo.toLowerCase().includes(q)
      || p.nombre_pad.toLowerCase().includes(q)
      || p.telefono.includes(q)
      || (p.libro?.titulo ?? "").toLowerCase().includes(q);

    if (tab === "pendiente_pago") return lista.filter(p => p.estado_pago === "pendiente_pago" && match(p));
    if (tab === "pagado")         return lista.filter(p => p.estado_pago === "pagado" && p.estado_prov !== "entregado" && match(p));
    if (tab === "entregado")      return lista.filter(p => p.estado_prov === "entregado" && match(p));
    if (tab === "anulado")        return lista.filter(p => p.estado_pago === "anulado" && match(p));
    return lista;
  }

  const pedidosFiltrados = filtrarPorTab(pedidos);

  /* ── Login ── */
  if (!autenticado) return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-xs">
        <div className="w-14 h-14 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_rgba(0,0,0,1)] mb-6 mx-auto">
          <BookOpen size={28} className="text-black"/>
        </div>
        <h1 className="text-xl font-black uppercase text-center mb-6 text-zinc-900">Admin · Libros</h1>
        <input type="password" placeholder="Contraseña" value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && login()}
          className="w-full border-2 border-zinc-200 rounded-2xl px-4 py-3 text-sm font-bold text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:border-black mb-3"/>
        {errPass && <p className="text-xs text-red-600 font-bold mb-3">{errPass}</p>}
        <button onClick={login}
          className="w-full bg-black text-yellow-400 py-3 rounded-2xl font-black text-sm uppercase tracking-wider">
          Ingresar
        </button>
      </div>
    </main>
  );

  function TabBtn({ id, label, count, color }: { id: TabVista; label: string | React.ReactNode; count?: number; color?: string }) {
    const active = tab === id;
    return (
      <button onClick={() => { setTab(id); setExpandido(null); setBusqueda(""); }}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-black uppercase transition-colors whitespace-nowrap
          ${active ? "bg-black text-yellow-400" : "text-zinc-700 hover:bg-zinc-100"}`}>
        {label}
        {count !== undefined && count > 0 && (
          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black
            ${active ? "bg-yellow-400 text-black" : (color ?? "bg-zinc-200 text-zinc-700")}`}>
            {count}
          </span>
        )}
      </button>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50">
      {/* Top bar */}
      <div className="bg-white border-b border-zinc-200 px-3 py-2.5 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 bg-yellow-400 rounded-lg flex items-center justify-center">
            <BookOpen size={14} className="text-black"/>
          </div>
          <span className="font-black text-xs uppercase text-zinc-900 hidden sm:block">Admin</span>
        </div>

        <div className="flex items-center gap-0.5 overflow-x-auto">
          <TabBtn id="pendiente_pago" label="Pend. pago"
            count={contadores.pendiente_pago} color="bg-yellow-100 text-yellow-700"/>
          <TabBtn id="pagado" label="Pagados"
            count={contadores.pagado} color="bg-green-100 text-green-700"/>
          <TabBtn id="entregado" label="Entregados"
            count={contadores.entregado} color="bg-blue-100 text-blue-700"/>
          <TabBtn id="anulado" label="Anulados"
            count={contadores.anulado} color="bg-red-100 text-red-700"/>
          <TabBtn id="consolidado" label={<BarChart3 size={13}/>}/>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button onClick={cargarPedidos} className="p-1.5 text-zinc-600 hover:text-black" title="Actualizar">
            <RefreshCw size={14}/>
          </button>
          <button onClick={() => setAutenticado(false)} className="p-1.5 text-zinc-600 hover:text-black">
            <LogOut size={14}/>
          </button>
        </div>
      </div>

      {tab === "consolidado" ? (
        /* ===== CONSOLIDADO ===== */
        <div className="max-w-2xl mx-auto px-4 py-6">
          <h2 className="font-black uppercase text-sm tracking-wide mb-4 text-zinc-900">Consolidado por libro</h2>
          <div className="space-y-3">
            {resumen.map((r, i) => (
              <div key={i} className="bg-white rounded-2xl border border-zinc-200 p-4">
                <p className="font-black text-sm text-zinc-900">{r.titulo}</p>
                <p className="text-xs text-zinc-700 font-bold mb-3">{r.grado}</p>
                <div className="grid grid-cols-5 gap-1.5 text-center">
                  <div className="bg-green-50 rounded-xl p-2">
                    <p className="text-lg font-black text-green-700">{r.pagados}</p>
                    <p className="text-[8px] font-black text-green-700 uppercase">Pagados</p>
                  </div>
                  <div className="bg-yellow-50 rounded-xl p-2">
                    <p className="text-lg font-black text-yellow-700">{r.pendiente_pedir}</p>
                    <p className="text-[8px] font-black text-yellow-700 uppercase">Sin pedir</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-2">
                    <p className="text-lg font-black text-purple-700">{r.pedidos_prov}</p>
                    <p className="text-[8px] font-black text-purple-700 uppercase">Pedidos</p>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-2">
                    <p className="text-lg font-black text-orange-700">{r.recibidos}</p>
                    <p className="text-[8px] font-black text-orange-700 uppercase">En tienda</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-2">
                    <p className="text-lg font-black text-blue-700">{r.entregados}</p>
                    <p className="text-[8px] font-black text-blue-700 uppercase">Entregados</p>
                  </div>
                </div>
                {r.pendiente_pedir > 0 && (
                  <div className="mt-3 bg-yellow-400 rounded-xl px-3 py-2 flex items-center justify-between">
                    <span className="text-xs font-black text-zinc-900">Pedir al proveedor</span>
                    <span className="font-black text-lg text-zinc-900">{r.pendiente_pedir}</span>
                  </div>
                )}
                {r.recibidos > 0 && (
                  <div className="mt-2 bg-orange-100 rounded-xl px-3 py-2 flex items-center justify-between">
                    <span className="text-xs font-black text-orange-800">Disponibles en tienda para entregar</span>
                    <span className="font-black text-lg text-orange-800">{r.recibidos}</span>
                  </div>
                )}
              </div>
            ))}
            {resumen.length === 0 && <p className="text-sm text-zinc-600 font-bold text-center py-8">Sin datos aún.</p>}
          </div>
        </div>
      ) : (
        /* ===== LISTA ===== */
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black text-sm uppercase text-zinc-900">
              {tab === "pendiente_pago" && "Pendiente de pago"}
              {tab === "pagado"         && "Pagados · Pendiente entrega"}
              {tab === "entregado"      && "Entregados"}
              {tab === "anulado"        && "Anulados"}
            </h2>
            <span className="text-xs font-black text-zinc-500">{pedidosFiltrados.length} pedidos</span>
          </div>

          <div className="relative mb-4">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"/>
            <input placeholder="Buscar código, nombre, libro..."
              value={busqueda} onChange={e => setBusqueda(e.target.value)}
              className="w-full border-2 border-zinc-200 rounded-2xl pl-8 pr-4 py-2.5 text-sm font-bold text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:border-black"/>
          </div>

          {cargando ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"/>
            </div>
          ) : (
            <div className="space-y-2">
              {pedidosFiltrados.map(p => (
                <div key={p.id} className={`bg-white rounded-2xl border overflow-hidden
                  ${p.estado_pago === "anulado" ? "border-red-200 opacity-75" : "border-zinc-200"}`}>

                  {/* Fila resumen */}
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-left"
                    onClick={() => setExpandido(expandido === p.id ? null : p.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`font-black text-sm ${p.estado_pago === "anulado" ? "line-through text-zinc-400" : "text-zinc-900"}`}>
                          {p.codigo}
                        </span>
                        {p.estado_pago === "anulado"
                          ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-100 text-red-700">Anulado</span>
                          : <span className={badgeProv(p.estado_prov)}>{ESTADO_PROV_LABEL[p.estado_prov]}</span>
                        }
                        {badgeVenta(p.punto_venta)}
                      </div>
                      <p className="text-xs text-zinc-700 font-bold truncate mt-0.5">
                        {p.nombre_pad} · {p.libro?.titulo}
                      </p>
                    </div>
                    <span className="font-black text-sm shrink-0 text-zinc-900">${p.total.toFixed(2)}</span>
                    {expandido === p.id
                      ? <ChevronUp size={14} className="text-zinc-700 shrink-0"/>
                      : <ChevronDown size={14} className="text-zinc-700 shrink-0"/>}
                  </button>

                  {/* Detalle expandido */}
                  {expandido === p.id && (
                    <div className="border-t border-zinc-100 px-4 py-4 space-y-4">
                      {/* Datos */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-zinc-500 font-black uppercase tracking-widest text-[9px]">Representante</p>
                          <p className="font-bold text-zinc-900">{p.nombre_pad}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500 font-black uppercase tracking-widest text-[9px]">Cédula / RUC</p>
                          <p className="font-bold text-zinc-900">{p.cedula || "—"}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500 font-black uppercase tracking-widest text-[9px]">Teléfono</p>
                          <a href={`https://wa.me/593${p.telefono.replace(/^0/, "")}`} target="_blank"
                            className="font-bold text-green-700 underline">{p.telefono}</a>
                        </div>
                        <div>
                          <p className="text-zinc-500 font-black uppercase tracking-widest text-[9px]">Unidad</p>
                          <p className="font-bold text-zinc-900">{p.unidad?.nombre}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500 font-black uppercase tracking-widest text-[9px]">Libro</p>
                          <p className="font-bold text-zinc-900">{p.libro?.titulo}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500 font-black uppercase tracking-widest text-[9px]">Grado</p>
                          <p className="font-bold text-zinc-900">{p.libro?.grado}</p>
                        </div>
                        {p.comp_numero && (
                          <div>
                            <p className="text-zinc-500 font-black uppercase tracking-widest text-[9px]">Comprobante</p>
                            <p className="font-bold text-zinc-900">{p.comp_numero} · ${p.comp_monto?.toFixed(2)}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-zinc-500 font-black uppercase tracking-widest text-[9px]">Fecha pedido</p>
                          <p className="font-bold text-zinc-900">{new Date(p.created_at).toLocaleDateString("es-EC")}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500 font-black uppercase tracking-widest text-[9px]">Canal</p>
                          <p className="font-bold text-zinc-900">{p.punto_venta === "caja" ? "Caja" : "Web"}</p>
                        </div>
                      </div>

                      {/* ── Acciones según estado ── */}
                      {p.estado_pago !== "anulado" && (
                        <>
                          {/* WhatsApp contextual */}
                          {p.estado_pago === "pendiente_pago" && (
                            <a href={waUrl(p.telefono, msgPendientePago(p))} target="_blank"
                              className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white py-2.5 rounded-xl font-black text-xs uppercase tracking-wider">
                              <MessageCircle size={13}/>
                              WhatsApp · Solicitar comprobante de pago
                            </a>
                          )}

                          {p.estado_pago === "pagado" && p.estado_prov !== "entregado" && (
                            <a href={waUrl(p.telefono, msgPagadoListo(p))} target="_blank"
                              className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white py-2.5 rounded-xl font-black text-xs uppercase tracking-wider">
                              <MessageCircle size={13}/>
                              WhatsApp · Libro listo para retirar
                            </a>
                          )}

                          {/* Verificar pago */}
                          {p.estado_pago === "pendiente_pago" && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                              <p className="text-[10px] font-black text-yellow-800 uppercase tracking-widest mb-2">Verificar transferencia</p>
                              <div className="flex gap-2 mb-2">
                                <input placeholder="N° comprobante" value={compNumero}
                                  onChange={e => setCompNumero(e.target.value)}
                                  className="flex-1 border border-zinc-300 rounded-xl px-3 py-2 text-xs font-bold text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:border-black"/>
                                <input placeholder="Monto $" value={compMonto} type="number"
                                  onChange={e => setCompMonto(e.target.value)}
                                  className="w-24 border border-zinc-300 rounded-xl px-3 py-2 text-xs font-bold text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:border-black"/>
                              </div>
                              {msgComp[p.id] && <p className="text-[10px] font-bold text-red-700 mb-2">{msgComp[p.id]}</p>}
                              <button onClick={() => guardarComprobante(p)} disabled={guardando}
                                className="w-full bg-black text-yellow-400 py-2 rounded-xl text-xs font-black uppercase disabled:opacity-50">
                                {guardando ? "Guardando..." : "Marcar como pagado"}
                              </button>
                            </div>
                          )}

                          {/* Estado proveedor */}
                          <div>
                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">Estado con proveedor</p>
                            <div className="grid grid-cols-2 gap-2">
                              {(["pendiente_pedir","pedido","recibido","entregado"] as const).map(est => (
                                <button key={est} onClick={() => actualizarEstadoProv(p, est)}
                                  className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all border-2
                                    ${p.estado_prov === est
                                      ? "bg-black text-yellow-400 border-black"
                                      : "border-zinc-300 text-zinc-700 hover:border-black"}`}>
                                  {ESTADO_PROV_LABEL[est]}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Imprimir recibo — solo cuando entregado */}
                          {p.estado_prov === "entregado" && (
                            <button onClick={() => imprimirRecibo(p)}
                              className="w-full flex items-center justify-center gap-2 bg-zinc-900 text-white py-3 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-black transition-colors">
                              <Printer size={14}/>
                              Imprimir recibo de entrega
                            </button>
                          )}

                          {/* Anular pedido */}
                          {confirmAnular === p.id ? (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                              <p className="text-xs font-black text-red-800 mb-3">
                                ¿Confirmas anular el pedido <strong>{p.codigo}</strong>? Esta accion no se puede deshacer.
                              </p>
                              <div className="flex gap-2">
                                <button onClick={() => anularPedido(p.id)}
                                  className="flex-1 bg-red-600 text-white py-2 rounded-xl text-xs font-black uppercase">
                                  Si, anular
                                </button>
                                <button onClick={() => setConfirmAnular(null)}
                                  className="flex-1 border-2 border-zinc-300 py-2 rounded-xl text-xs font-black uppercase text-zinc-700">
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmAnular(p.id)}
                              className="w-full flex items-center justify-center gap-2 border-2 border-red-200 text-red-600 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-red-50 transition-colors">
                              <XCircle size={13}/>
                              Anular pedido
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {pedidosFiltrados.length === 0 && (
                <p className="text-sm text-zinc-600 font-bold text-center py-8">
                  {busqueda ? "No hay resultados para tu búsqueda." : "No hay pedidos en este estado."}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
