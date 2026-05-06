"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase";
import {
  ChevronDown, ChevronUp, Search, LogOut, BookOpen, BarChart3
} from "lucide-react";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "crayola2025";

type Pedido = {
  id: string; codigo: string;
  nombre_estudiante: string; nombre_padre: string; telefono: string;
  libro: { titulo: string; grado: string; precio: number } | null;
  unidad: { nombre: string } | null;
  cantidad: number; total: number;
  estado_pago: string; estado_proveedor: string;
  comprobante_numero: string | null; comprobante_monto: number | null;
  created_at: string;
};

type ResumenLibro = {
  libro_id: string; titulo: string; grado: string;
  pagados: number; pendiente_pedir: number; pedidos_prov: number; entregados: number;
};

const ESTADO_PAGO_LABEL: Record<string, string> = {
  pendiente_pago: "Pendiente pago",
  pagado:         "Pagado",
};
const ESTADO_PROV_LABEL: Record<string, string> = {
  pendiente_pedir: "Sin pedir",
  pedido:          "Pedido",
  recibido:        "Recibido",
  entregado:       "Entregado",
};

function badgePago(estado: string) {
  const base = "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase";
  if (estado === "pagado")        return `${base} bg-green-100 text-green-700`;
  return `${base} bg-yellow-100 text-yellow-700`;
}
function badgeProv(estado: string) {
  const base = "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase";
  if (estado === "entregado")     return `${base} bg-green-100 text-green-700`;
  if (estado === "recibido")      return `${base} bg-blue-100 text-blue-700`;
  if (estado === "pedido")        return `${base} bg-purple-100 text-purple-700`;
  return `${base} bg-zinc-100 text-zinc-500`;
}

export default function AdminPage() {
  const [autenticado, setAutenticado] = useState(false);
  const [password, setPassword]       = useState("");
  const [errPass, setErrPass]         = useState("");

  const [tab, setTab]               = useState<"pedidos" | "consolidado">("pedidos");
  const [pedidos, setPedidos]       = useState<Pedido[]>([]);
  const [cargando, setCargando]     = useState(false);
  const [busqueda, setBusqueda]     = useState("");
  const [filtroPago, setFiltroPago] = useState("todos");
  const [filtroProv, setFiltroProv] = useState("todos");
  const [expandido, setExpandido]   = useState<string | null>(null);
  const [resumen, setResumen]       = useState<ResumenLibro[]>([]);

  // Comprobante
  const [compNumero, setCompNumero] = useState("");
  const [compMonto, setCompMonto]   = useState("");
  const [guardando, setGuardando]   = useState(false);
  const [msgComp, setMsgComp]       = useState("");

  function login() {
    if (password === ADMIN_PASSWORD) { setAutenticado(true); cargarPedidos(); }
    else setErrPass("Contraseña incorrecta.");
  }

  async function cargarPedidos() {
    setCargando(true);
    const { data } = await getSupabase()
      .from("pedidos_libros")
      .select(`id, codigo, nombre_estudiante, nombre_padre, telefono,
               cantidad, total, estado_pago, estado_proveedor,
               comprobante_numero, comprobante_monto, created_at,
               libro:libros(titulo, grado, precio),
               unidad:unidades_educativas(nombre)`)
      .order("created_at", { ascending: false });
    setPedidos((data as unknown as Pedido[]) ?? []);
    calcularResumen((data as unknown as Pedido[]) ?? []);
    setCargando(false);
  }

  function calcularResumen(lista: Pedido[]) {
    const map: Record<string, ResumenLibro> = {};
    lista.forEach(p => {
      if (!p.libro) return;
      const key = p.libro.titulo + p.libro.grado;
      if (!map[key]) map[key] = {
        libro_id: p.id, titulo: p.libro.titulo, grado: p.libro.grado,
        pagados: 0, pendiente_pedir: 0, pedidos_prov: 0, entregados: 0,
      };
      if (p.estado_pago === "pagado") map[key].pagados++;
      if (p.estado_proveedor === "pendiente_pedir" && p.estado_pago === "pagado") map[key].pendiente_pedir++;
      if (p.estado_proveedor === "pedido") map[key].pedidos_prov++;
      if (p.estado_proveedor === "entregado") map[key].entregados++;
    });
    setResumen(Object.values(map));
  }

  async function guardarComprobante(pedido: Pedido) {
    if (!compNumero.trim() || !compMonto.trim()) {
      setMsgComp("Completa número y monto del comprobante.");
      return;
    }
    const monto = parseFloat(compMonto);
    if (isNaN(monto) || monto <= 0) { setMsgComp("Monto inválido."); return; }

    setGuardando(true);
    setMsgComp("");

    // Ver si el comprobante ya existe
    const { data: compExistente } = await getSupabase()
      .from("comprobantes")
      .select("*")
      .eq("numero", compNumero.trim())
      .maybeSingle();

    const montoUsadoPrevio = compExistente?.monto_usado ?? 0;
    const totalComprobante = compExistente?.monto_total ?? monto;
    const disponible = totalComprobante - montoUsadoPrevio;

    if (disponible < pedido.total) {
      setMsgComp(`El comprobante solo tiene $${disponible.toFixed(2)} disponibles. El pedido vale $${pedido.total.toFixed(2)}.`);
      setGuardando(false);
      return;
    }

    // Registrar o actualizar comprobante
    if (compExistente) {
      await getSupabase().from("comprobantes").update({
        monto_usado: montoUsadoPrevio + pedido.total,
      }).eq("numero", compNumero.trim());
    } else {
      await getSupabase().from("comprobantes").insert({
        numero:      compNumero.trim(),
        monto_total: monto,
        monto_usado: pedido.total,
      });
    }

    // Actualizar pedido
    await getSupabase().from("pedidos_libros").update({
      estado_pago:        "pagado",
      comprobante_numero: compNumero.trim(),
      comprobante_monto:  monto,
    }).eq("id", pedido.id);

    setMsgComp("✓ Pago verificado correctamente.");
    setCompNumero("");
    setCompMonto("");
    setGuardando(false);
    cargarPedidos();
  }

  async function actualizarEstadoProv(pedidoId: string, estado: string) {
    await getSupabase().from("pedidos_libros")
      .update({ estado_proveedor: estado })
      .eq("id", pedidoId);
    cargarPedidos();
  }

  const pedidosFiltrados = pedidos.filter(p => {
    const q = busqueda.toLowerCase();
    const matchBusq = !q || p.codigo.toLowerCase().includes(q)
      || p.nombre_estudiante.toLowerCase().includes(q)
      || p.nombre_padre.toLowerCase().includes(q)
      || p.telefono.includes(q);
    const matchPago = filtroPago === "todos" || p.estado_pago === filtroPago;
    const matchProv = filtroProv === "todos" || p.estado_proveedor === filtroProv;
    return matchBusq && matchPago && matchProv;
  });

  if (!autenticado) return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-xs">
        <div className="w-14 h-14 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_rgba(0,0,0,1)] mb-6 mx-auto">
          <BookOpen size={28} className="text-black"/>
        </div>
        <h1 className="text-xl font-black uppercase text-center mb-6">Admin · Libros</h1>
        <input type="password" placeholder="Contraseña" value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && login()}
          className="w-full border-2 border-zinc-200 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-black mb-3"/>
        {errPass && <p className="text-xs text-red-500 font-bold mb-3">{errPass}</p>}
        <button onClick={login}
          className="w-full bg-black text-yellow-400 py-3 rounded-2xl font-black text-sm uppercase tracking-wider">
          Ingresar
        </button>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen bg-zinc-50">
      {/* Top bar */}
      <div className="bg-white border-b border-zinc-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-yellow-400 rounded-xl flex items-center justify-center">
            <BookOpen size={16} className="text-black"/>
          </div>
          <span className="font-black text-sm uppercase">Admin · Libros</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setTab("pedidos"); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-colors ${tab === "pedidos" ? "bg-black text-yellow-400" : "text-zinc-500 hover:bg-zinc-100"}`}>
            Pedidos
          </button>
          <button onClick={() => setTab("consolidado")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-colors ${tab === "consolidado" ? "bg-black text-yellow-400" : "text-zinc-500 hover:bg-zinc-100"}`}>
            <BarChart3 size={14} className="inline mr-1"/>Consolidado
          </button>
          <button onClick={() => setAutenticado(false)}
            className="p-1.5 text-zinc-400 hover:text-black transition-colors">
            <LogOut size={16}/>
          </button>
        </div>
      </div>

      {tab === "consolidado" ? (
        /* ===== CONSOLIDADO ===== */
        <div className="max-w-2xl mx-auto px-4 py-6">
          <h2 className="font-black uppercase text-sm tracking-wide mb-4">Consolidado por libro</h2>
          <div className="space-y-3">
            {resumen.map((r, i) => (
              <div key={i} className="bg-white rounded-2xl border border-zinc-200 p-4">
                <p className="font-black text-sm">{r.titulo}</p>
                <p className="text-xs text-zinc-500 font-bold mb-3">{r.grado}</p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-green-50 rounded-xl p-2">
                    <p className="text-lg font-black text-green-700">{r.pagados}</p>
                    <p className="text-[9px] font-black text-green-600 uppercase">Pagados</p>
                  </div>
                  <div className="bg-yellow-50 rounded-xl p-2">
                    <p className="text-lg font-black text-yellow-700">{r.pendiente_pedir}</p>
                    <p className="text-[9px] font-black text-yellow-600 uppercase">Sin pedir</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-2">
                    <p className="text-lg font-black text-purple-700">{r.pedidos_prov}</p>
                    <p className="text-[9px] font-black text-purple-600 uppercase">Pedidos</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-2">
                    <p className="text-lg font-black text-blue-700">{r.entregados}</p>
                    <p className="text-[9px] font-black text-blue-600 uppercase">Entregados</p>
                  </div>
                </div>
                {r.pendiente_pedir > 0 && (
                  <div className="mt-3 bg-yellow-400 rounded-xl px-3 py-2 flex items-center justify-between">
                    <span className="text-xs font-black">Pedir al proveedor esta semana</span>
                    <span className="font-black text-lg">{r.pendiente_pedir}</span>
                  </div>
                )}
              </div>
            ))}
            {resumen.length === 0 && (
              <p className="text-sm text-zinc-400 font-bold text-center py-8">Sin datos aún.</p>
            )}
          </div>
        </div>
      ) : (
        /* ===== PEDIDOS ===== */
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Filtros */}
          <div className="flex flex-col gap-2 mb-4">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"/>
              <input placeholder="Buscar por código, nombre, teléfono..."
                value={busqueda} onChange={e => setBusqueda(e.target.value)}
                className="w-full border-2 border-zinc-200 rounded-2xl pl-8 pr-4 py-2.5 text-sm font-bold focus:outline-none focus:border-black"/>
            </div>
            <div className="flex gap-2">
              <select value={filtroPago} onChange={e => setFiltroPago(e.target.value)}
                className="flex-1 border-2 border-zinc-200 rounded-2xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-black bg-white">
                <option value="todos">Todos los pagos</option>
                <option value="pendiente_pago">Pendiente pago</option>
                <option value="pagado">Pagado</option>
              </select>
              <select value={filtroProv} onChange={e => setFiltroProv(e.target.value)}
                className="flex-1 border-2 border-zinc-200 rounded-2xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-black bg-white">
                <option value="todos">Todos los estados</option>
                <option value="pendiente_pedir">Sin pedir</option>
                <option value="pedido">Pedido</option>
                <option value="recibido">Recibido</option>
                <option value="entregado">Entregado</option>
              </select>
            </div>
          </div>

          {cargando ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"/>
            </div>
          ) : (
            <div className="space-y-2">
              {pedidosFiltrados.map(p => (
                <div key={p.id} className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
                  {/* Fila resumen */}
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-left"
                    onClick={() => setExpandido(expandido === p.id ? null : p.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm">{p.codigo}</span>
                        <span className={badgePago(p.estado_pago)}>{ESTADO_PAGO_LABEL[p.estado_pago]}</span>
                        <span className={badgeProv(p.estado_proveedor)}>{ESTADO_PROV_LABEL[p.estado_proveedor]}</span>
                      </div>
                      <p className="text-xs text-zinc-500 font-bold truncate mt-0.5">
                        {p.nombre_estudiante} · {p.libro?.titulo}
                      </p>
                    </div>
                    <span className="font-black text-sm shrink-0">${p.total.toFixed(2)}</span>
                    {expandido === p.id ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                  </button>

                  {/* Detalle expandido */}
                  {expandido === p.id && (
                    <div className="border-t border-zinc-100 px-4 py-4 space-y-4">
                      {/* Info */}
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-zinc-400 font-black uppercase tracking-widest text-[9px]">Estudiante</p>
                          <p className="font-bold">{p.nombre_estudiante}</p>
                        </div>
                        <div>
                          <p className="text-zinc-400 font-black uppercase tracking-widest text-[9px]">Representante</p>
                          <p className="font-bold">{p.nombre_padre}</p>
                        </div>
                        <div>
                          <p className="text-zinc-400 font-black uppercase tracking-widest text-[9px]">Teléfono</p>
                          <a href={`https://wa.me/593${p.telefono.replace(/^0/, "")}`} target="_blank"
                            className="font-bold text-green-600 underline">{p.telefono}</a>
                        </div>
                        <div>
                          <p className="text-zinc-400 font-black uppercase tracking-widest text-[9px]">Unidad</p>
                          <p className="font-bold">{p.unidad?.nombre}</p>
                        </div>
                        <div>
                          <p className="text-zinc-400 font-black uppercase tracking-widest text-[9px]">Libro</p>
                          <p className="font-bold">{p.libro?.titulo}</p>
                        </div>
                        <div>
                          <p className="text-zinc-400 font-black uppercase tracking-widest text-[9px]">Grado</p>
                          <p className="font-bold">{p.libro?.grado}</p>
                        </div>
                        {p.comprobante_numero && (
                          <div>
                            <p className="text-zinc-400 font-black uppercase tracking-widest text-[9px]">Comprobante</p>
                            <p className="font-bold">{p.comprobante_numero} · ${p.comprobante_monto?.toFixed(2)}</p>
                          </div>
                        )}
                      </div>

                      {/* Verificar pago */}
                      {p.estado_pago === "pendiente_pago" && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                          <p className="text-[10px] font-black text-yellow-700 uppercase tracking-widest mb-2">Verificar transferencia</p>
                          <div className="flex gap-2 mb-2">
                            <input placeholder="N° comprobante" value={compNumero}
                              onChange={e => setCompNumero(e.target.value)}
                              className="flex-1 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-black"/>
                            <input placeholder="Monto $" value={compMonto} type="number"
                              onChange={e => setCompMonto(e.target.value)}
                              className="w-24 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-black"/>
                          </div>
                          {msgComp && <p className="text-[10px] font-bold text-red-600 mb-2">{msgComp}</p>}
                          <button onClick={() => guardarComprobante(p)} disabled={guardando}
                            className="w-full bg-black text-yellow-400 py-2 rounded-xl text-xs font-black uppercase disabled:opacity-50">
                            {guardando ? "Guardando..." : "Marcar como pagado"}
                          </button>
                        </div>
                      )}

                      {/* Estado proveedor */}
                      <div>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Estado con proveedor</p>
                        <div className="grid grid-cols-2 gap-2">
                          {["pendiente_pedir","pedido","recibido","entregado"].map(est => (
                            <button key={est} onClick={() => actualizarEstadoProv(p.id, est)}
                              className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all border-2
                                ${p.estado_proveedor === est
                                  ? "bg-black text-yellow-400 border-black"
                                  : "border-zinc-200 text-zinc-500 hover:border-black"}`}>
                              {ESTADO_PROV_LABEL[est]}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {pedidosFiltrados.length === 0 && (
                <p className="text-sm text-zinc-400 font-bold text-center py-8">No hay pedidos que coincidan.</p>
              )}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
