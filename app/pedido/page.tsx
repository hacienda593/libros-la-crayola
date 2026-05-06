"use client";
export const dynamic = "force-dynamic";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { ChevronLeft, Send, AlertCircle } from "lucide-react";

function generarCodigo() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function PedidoInner() {
  const router       = useRouter();
  const params       = useSearchParams();

  const unidadId     = params.get("unidad_id") ?? "";
  const unidadNombre = params.get("unidad_nombre") ?? "";
  const libroId      = params.get("libro_id") ?? "";
  const libroTitulo  = params.get("libro_titulo") ?? "";
  const libroGrado   = params.get("libro_grado") ?? "";
  const libroPrec    = parseFloat(params.get("libro_precio") ?? "0");

  const [nombreEst, setNombreEst] = useState("");
  const [nombrePad, setNombrePad] = useState("");
  const [cedula, setCedula]       = useState("");
  const [telefono, setTelefono]   = useState("");
  const [enviando, setEnviando]   = useState(false);
  const [error, setError]         = useState("");

  async function enviarPedido() {
    if (!nombreEst.trim() || !nombrePad.trim() || !cedula.trim() || !telefono.trim()) {
      setError("Por favor completa todos los campos.");
      return;
    }
    setError("");
    setEnviando(true);

    let codigo = generarCodigo();
    for (let i = 0; i < 5; i++) {
      const { data } = await getSupabase()
        .from("lb_pedidos").select("id").eq("codigo", codigo).maybeSingle();
      if (!data) break;
      codigo = generarCodigo();
    }

    const { error: err } = await getSupabase().from("lb_pedidos").insert({
      codigo,
      nombre_est:  nombreEst.trim(),
      nombre_pad:  nombrePad.trim(),
      cedula:      cedula.trim(),
      telefono:    telefono.trim(),
      unidad_id:   unidadId,
      libro_id:    libroId,
      cantidad:    1,
      precio_unit: libroPrec,
      total:       libroPrec,
      estado_pago: "pendiente_pago",
      estado_prov: "pendiente_pedir",
      punto_venta: "web",
    });

    if (err) {
      setError("Error al registrar el pedido. Intenta de nuevo.");
      setEnviando(false);
      return;
    }

    router.push(`/confirmacion/${codigo}?precio=${libroPrec}&titulo=${encodeURIComponent(libroTitulo)}&grado=${encodeURIComponent(libroGrado)}&comprador=${encodeURIComponent(nombrePad.trim())}&estudiante=${encodeURIComponent(nombreEst.trim())}`);
  }

  const inputCls = "w-full border-2 border-zinc-200 rounded-2xl px-4 py-3 text-sm font-bold text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-black transition-colors";
  const labelCls = "block text-xs font-black uppercase tracking-wider text-zinc-700 mb-1";

  return (
    <main className="min-h-screen bg-white px-4 py-8 max-w-lg mx-auto">
      <button onClick={() => router.back()}
        className="flex items-center gap-1 text-xs font-black uppercase text-zinc-500 mb-6 hover:text-black transition-colors">
        <ChevronLeft size={14}/> Volver
      </button>

      {/* Recordatorio transferencia */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 mb-6">
        <div className="flex items-start gap-2">
          <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5"/>
          <div>
            <p className="text-xs font-black text-amber-700 uppercase tracking-widest mb-1">Recuerda transferir antes de continuar</p>
            <p className="text-xs font-bold text-zinc-800 leading-relaxed">
              Banco Pichincha · Cuenta de ahorros <strong>2204882211</strong><br/>
              Titular: <strong>Liliana González</strong> · Monto: <strong>${libroPrec.toFixed(2)}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Resumen libro */}
      <div className="bg-zinc-50 border-2 border-zinc-200 rounded-2xl p-4 mb-6">
        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Libro seleccionado</p>
        <p className="font-black text-sm text-zinc-900">{libroTitulo}</p>
        <p className="text-xs text-zinc-700 font-bold">{libroGrado} · {unidadNombre}</p>
        <p className="font-black text-lg text-zinc-900 mt-1">${libroPrec.toFixed(2)}</p>
      </div>

      {/* Datos del estudiante */}
      <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-3">Datos del estudiante</p>
      <div className="space-y-3 mb-5">
        <div>
          <label className={labelCls}>Nombre completo del estudiante</label>
          <input type="text" value={nombreEst} onChange={e => setNombreEst(e.target.value)}
            placeholder="Ej: María García" className={inputCls}/>
        </div>
      </div>

      {/* Datos del representante */}
      <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-3">Datos del representante (facturación)</p>
      <div className="space-y-3 mb-6">
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
          <label className={labelCls}>Teléfono / WhatsApp</label>
          <input type="tel" value={telefono} onChange={e => setTelefono(e.target.value)}
            placeholder="Ej: 0999123456" className={inputCls}/>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-3 mb-4">
          <p className="text-xs font-bold text-red-600">{error}</p>
        </div>
      )}

      <button onClick={enviarPedido} disabled={enviando}
        className="w-full bg-black text-yellow-400 py-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50">
        {enviando ? "Registrando..." : <><Send size={16}/> Registrar pedido</>}
      </button>
    </main>
  );
}

export default function PedidoPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-white flex items-center justify-center"><div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"/></main>}>
      <PedidoInner/>
    </Suspense>
  );
}
