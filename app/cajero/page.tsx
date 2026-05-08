"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { BookOpen, Send, ChevronLeft, CheckCircle } from "lucide-react";

const CAJERO_PASSWORD  = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "crayola2025";
const NEGOCIO_WA       = "593984341953";

type Libro = { id: string; titulo: string; grado: string; precio: number; unidad_id: string };
type Unidad = { id: string; nombre: string };

function generarCodigo() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function CajeroPage() {
  /* ── auth ── */
  const [autenticado, setAutenticado] = useState(false);
  const [password, setPassword]       = useState("");
  const [errPass, setErrPass]         = useState("");

  /* ── datos catálogo ── */
  const [libros,   setLibros]   = useState<Libro[]>([]);
  const [unidades, setUnidades] = useState<Unidad[]>([]);

  /* ── formulario ── */
  const [libroId,    setLibroId]    = useState("");
  const [nombrePad,  setNombrePad]  = useState("");
  const [cedula,     setCedula]     = useState("");
  const [telefono,   setTelefono]   = useState("");
  const [compNum,    setCompNum]    = useState("");
  const [compMonto,  setCompMonto]  = useState("");

  /* ── estado ── */
  const [enviando,   setEnviando]   = useState(false);
  const [error,      setError]      = useState("");
  const [exito,      setExito]      = useState<{ codigo: string; libro: string; grado: string; precio: number; comprador: string } | null>(null);

  function login() {
    if (password === CAJERO_PASSWORD) { setAutenticado(true); cargarCatalogo(); }
    else setErrPass("Contraseña incorrecta.");
  }

  async function cargarCatalogo() {
    const [{ data: unis }, { data: libs }] = await Promise.all([
      getSupabase().from("lb_unidades").select("id, nombre").eq("activo", true).order("nombre"),
      getSupabase().from("lb_libros").select("id, titulo, grado, precio, unidad_id").eq("activo", true).order("grado"),
    ]);
    setUnidades(unis ?? []);
    setLibros(libs ?? []);
  }

  const libroSel = libros.find(l => l.id === libroId) ?? null;
  const unidadNombre = (uid: string) => unidades.find(u => u.id === uid)?.nombre ?? "";

  async function registrar() {
    setError("");
    if (!libroId)            { setError("Selecciona un libro."); return; }
    if (!nombrePad.trim())   { setError("Ingresa el nombre del representante."); return; }
    if (!cedula.trim())      { setError("Ingresa la cédula o RUC."); return; }
    if (!compNum.trim())     { setError("Ingresa el número de comprobante."); return; }
    if (!compMonto.trim())   { setError("Ingresa el monto del comprobante."); return; }

    const soloDigCed = cedula.replace(/\D/g, "");
    if (soloDigCed.length !== 10 && soloDigCed.length !== 13) {
      setError("La cédula debe tener 10 dígitos o el RUC 13 dígitos."); return;
    }
    const soloDigTel = telefono.replace(/\D/g, "");
    if (telefono.trim() && soloDigTel.length !== 10) {
      setError("El teléfono debe tener 10 dígitos."); return;
    }

    const monto = parseFloat(compMonto);
    if (isNaN(monto) || monto <= 0) { setError("Monto de comprobante inválido."); return; }

    if (!libroSel) return;
    setEnviando(true);

    /* código único */
    let codigo = generarCodigo();
    for (let i = 0; i < 5; i++) {
      const { data } = await getSupabase().from("lb_pedidos").select("id").eq("codigo", codigo).maybeSingle();
      if (!data) break;
      codigo = generarCodigo();
    }

    /* registrar/actualizar comprobante */
    const { data: compExistente } = await getSupabase()
      .from("lb_comprobantes").select("*").eq("numero", compNum.trim()).maybeSingle();

    const montoUsadoPrevio = compExistente?.monto_usado ?? 0;
    const totalComp        = compExistente?.monto_total ?? monto;
    const disponible       = totalComp - montoUsadoPrevio;

    if (disponible < libroSel.precio) {
      setError(`El comprobante solo tiene $${disponible.toFixed(2)} disponibles. El libro vale $${libroSel.precio.toFixed(2)}.`);
      setEnviando(false); return;
    }

    if (compExistente) {
      await getSupabase().from("lb_comprobantes")
        .update({ monto_usado: montoUsadoPrevio + libroSel.precio }).eq("numero", compNum.trim());
    } else {
      await getSupabase().from("lb_comprobantes")
        .insert({ numero: compNum.trim(), monto_total: monto, monto_usado: libroSel.precio });
    }

    /* insertar pedido ya pagado */
    const { error: err } = await getSupabase().from("lb_pedidos").insert({
      codigo,
      nombre_est:  "",
      nombre_pad:  nombrePad.trim(),
      cedula:      cedula.trim(),
      telefono:    telefono.trim(),
      unidad_id:   libroSel.unidad_id,
      libro_id:    libroId,
      cantidad:    1,
      precio_unit: libroSel.precio,
      total:       libroSel.precio,
      estado_pago: "pagado",
      estado_prov: "pendiente_pedir",
      comp_numero: compNum.trim(),
      comp_monto:  monto,
      punto_venta: "caja",
    });

    if (err) {
      setError("Error al registrar. Intenta de nuevo.");
      setEnviando(false); return;
    }

    setExito({ codigo, libro: libroSel.titulo, grado: libroSel.grado, precio: libroSel.precio, comprador: nombrePad.trim() });
    setEnviando(false);
  }

  function enviarWA() {
    if (!exito || !telefono.trim()) return;
    const tel = telefono.replace(/\D/g, "").replace(/^0/, "593");
    const msg = encodeURIComponent(
      `Hola ${exito.comprador}!\n\n` +
      `Hemos registrado tu pedido en La Crayola.\n\n` +
      `Libro: ${exito.libro}\n` +
      `Grado: ${exito.grado}\n` +
      `Valor: $${exito.precio.toFixed(2)}\n` +
      `Codigo de pedido: *${exito.codigo}*\n\n` +
      `Tu pago fue recibido y verificado. Te avisamos cuando el libro este listo para entregar.\n` +
      `Gracias por tu compra!`
    );
    window.open(`https://wa.me/${tel}?text=${msg}`, "_blank");
  }

  function nuevo() {
    setExito(null);
    setLibroId(""); setNombrePad(""); setCedula("");
    setTelefono(""); setCompNum(""); setCompMonto("");
    setError("");
  }

  /* ── Login ── */
  if (!autenticado) return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-xs">
        <div className="w-14 h-14 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_rgba(0,0,0,1)] mb-6 mx-auto">
          <BookOpen size={28} className="text-black"/>
        </div>
        <h1 className="text-xl font-black uppercase text-center mb-1 text-zinc-900">Caja · Libros</h1>
        <p className="text-xs text-zinc-600 font-bold text-center mb-6">Registro asistido de pedidos</p>
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

  /* ── Éxito ── */
  if (exito) return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center py-10">
      <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mb-4 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
        <CheckCircle size={32} className="text-black" fill="black"/>
      </div>
      <h1 className="text-2xl font-black uppercase tracking-tight mb-1 text-zinc-900">Pedido registrado</h1>
      <p className="text-zinc-700 text-sm font-bold max-w-xs mb-5">Pago verificado · Pendiente de entrega</p>

      <div className="bg-black text-yellow-400 rounded-3xl px-12 py-6 mb-6">
        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Código de pedido</p>
        <p className="text-5xl font-black tracking-widest">{exito.codigo}</p>
        <p className="text-xs font-black text-zinc-400 mt-2">${exito.precio.toFixed(2)} · {exito.libro} · {exito.grado}</p>
      </div>

      <div className="space-y-3 w-full max-w-xs">
        {telefono.trim() && (
          <button onClick={enviarWA}
            className="flex items-center justify-center gap-3 w-full bg-[#25D366] text-white py-4 rounded-2xl font-black text-sm uppercase tracking-wider">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Enviar confirmacion al padre
          </button>
        )}
        <button onClick={nuevo}
          className="w-full bg-black text-yellow-400 py-3 rounded-2xl font-black text-sm uppercase tracking-wider">
          Registrar otro pedido
        </button>
      </div>
    </main>
  );

  /* ── Formulario ── */
  const inputCls = "w-full border-2 border-zinc-200 rounded-2xl px-4 py-3 text-sm font-bold text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-black transition-colors bg-white";
  const labelCls = "block text-xs font-black uppercase tracking-wider text-zinc-700 mb-1";

  return (
    <main className="min-h-screen bg-white px-4 py-8 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 bg-yellow-400 rounded-xl flex items-center justify-center shrink-0">
          <BookOpen size={18} className="text-black"/>
        </div>
        <div>
          <h1 className="font-black text-base uppercase text-zinc-900 leading-none">Caja · Libros</h1>
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Registro asistido</p>
        </div>
      </div>

      {/* Aviso */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 mb-6">
        <p className="text-xs font-black text-blue-800 uppercase tracking-widest mb-1">Uso exclusivo cajero</p>
        <p className="text-xs font-bold text-zinc-800 leading-relaxed">
          El padre ya depositó en caja o corresponsal. Ingresa los datos y el comprobante de pago para registrar el pedido como <strong>pagado</strong>.
        </p>
      </div>

      <div className="space-y-4">
        {/* Libro */}
        <div>
          <label className={labelCls}>Libro</label>
          <select value={libroId} onChange={e => setLibroId(e.target.value)} className={inputCls}>
            <option value="">-- Selecciona el libro --</option>
            {libros.map(l => (
              <option key={l.id} value={l.id}>
                {l.titulo} · {l.grado} — ${l.precio.toFixed(2)} ({unidadNombre(l.unidad_id)})
              </option>
            ))}
          </select>
        </div>

        {libroSel && (
          <div className="bg-zinc-50 border-2 border-zinc-200 rounded-2xl px-4 py-3 flex justify-between items-center">
            <div>
              <p className="font-black text-sm text-zinc-900">{libroSel.titulo}</p>
              <p className="text-xs font-bold text-zinc-700">{libroSel.grado} · {unidadNombre(libroSel.unidad_id)}</p>
            </div>
            <p className="font-black text-xl text-zinc-900">${libroSel.precio.toFixed(2)}</p>
          </div>
        )}

        {/* Datos representante */}
        <p className="text-xs font-black text-zinc-500 uppercase tracking-widest pt-2">Datos del representante</p>

        <div>
          <label className={labelCls}>Nombre completo</label>
          <input type="text" value={nombrePad} onChange={e => setNombrePad(e.target.value)}
            placeholder="Ej: Juan García" className={inputCls}/>
        </div>
        <div>
          <label className={labelCls}>Cédula o RUC</label>
          <input type="text" value={cedula} onChange={e => setCedula(e.target.value)}
            placeholder="Ej: 1700000000" className={inputCls}/>
        </div>
        <div>
          <label className={labelCls}>Teléfono / WhatsApp <span className="text-zinc-400 font-bold normal-case">(opcional, para enviarle confirmación)</span></label>
          <input type="tel" value={telefono} onChange={e => setTelefono(e.target.value)}
            placeholder="Ej: 0999123456" className={inputCls}/>
        </div>

        {/* Comprobante de pago */}
        <p className="text-xs font-black text-zinc-500 uppercase tracking-widest pt-2">Comprobante de pago</p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>N° comprobante</label>
            <input type="text" value={compNum} onChange={e => setCompNum(e.target.value)}
              placeholder="Ej: 00123456" className={inputCls}/>
          </div>
          <div>
            <label className={labelCls}>Monto depositado $</label>
            <input type="number" value={compMonto} onChange={e => setCompMonto(e.target.value)}
              placeholder="Ej: 12.50" className={inputCls}/>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-3">
            <p className="text-xs font-bold text-red-700">{error}</p>
          </div>
        )}

        <button onClick={registrar} disabled={enviando}
          className="w-full bg-black text-yellow-400 py-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50">
          {enviando ? "Registrando..." : <><Send size={16}/> Registrar pedido pagado</>}
        </button>
      </div>
    </main>
  );
}
