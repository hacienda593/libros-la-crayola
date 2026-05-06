"use client";
export const dynamic = "force-dynamic";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { BookOpen, ChevronLeft, Send } from "lucide-react";

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

  const [nombreEst, setNombreEst]   = useState("");
  const [nombrePad, setNombrePad]   = useState("");
  const [telefono, setTelefono]     = useState("");
  const [enviando, setEnviando]     = useState(false);
  const [error, setError]           = useState("");

  async function enviarPedido() {
    if (!nombreEst.trim() || !nombrePad.trim() || !telefono.trim()) {
      setError("Por favor completa todos los campos.");
      return;
    }
    setError("");
    setEnviando(true);

    let codigo = generarCodigo();
    // Asegurar unicidad
    for (let i = 0; i < 5; i++) {
      const { data } = await getSupabase()
        .from("pedidos_libros")
        .select("id")
        .eq("codigo", codigo)
        .maybeSingle();
      if (!data) break;
      codigo = generarCodigo();
    }

    const { error: err } = await getSupabase().from("pedidos_libros").insert({
      codigo,
      nombre_estudiante:   nombreEst.trim(),
      nombre_padre:        nombrePad.trim(),
      telefono:            telefono.trim(),
      unidad_educativa_id: unidadId,
      libro_id:            libroId,
      cantidad:            1,
      precio_unitario:     libroPrec,
      total:               libroPrec,
      estado_pago:         "pendiente_pago",
      estado_proveedor:    "pendiente_pedir",
      punto_venta:         "web",
    });

    if (err) {
      setError("Error al registrar el pedido. Intenta de nuevo.");
      setEnviando(false);
      return;
    }

    router.push(`/confirmacion/${codigo}?precio=${libroPrec}&titulo=${encodeURIComponent(libroTitulo)}`);
  }

  return (
    <main className="min-h-screen bg-white px-4 py-8 max-w-lg mx-auto">
      {/* Header */}
      <button onClick={() => router.back()}
        className="flex items-center gap-1 text-xs font-black uppercase text-zinc-400 mb-6 hover:text-black transition-colors">
        <ChevronLeft size={14}/> Volver
      </button>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          <BookOpen size={24} className="text-black"/>
        </div>
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight">Tu pedido</h1>
          <p className="text-xs text-zinc-500 font-bold">Completa tus datos</p>
        </div>
      </div>

      {/* Resumen libro */}
      <div className="bg-zinc-50 border-2 border-zinc-200 rounded-2xl p-4 mb-6">
        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Libro seleccionado</p>
        <p className="font-black text-sm">{libroTitulo}</p>
        <p className="text-xs text-zinc-500 font-bold">{libroGrado} · {unidadNombre}</p>
        <p className="font-black text-lg mt-2">${libroPrec.toFixed(2)}</p>
      </div>

      {/* Formulario */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1">
            Nombre del estudiante
          </label>
          <input
            type="text"
            value={nombreEst}
            onChange={e => setNombreEst(e.target.value)}
            placeholder="Ej: María García"
            className="w-full border-2 border-zinc-200 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-black transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1">
            Nombre del padre / representante
          </label>
          <input
            type="text"
            value={nombrePad}
            onChange={e => setNombrePad(e.target.value)}
            placeholder="Ej: Juan García"
            className="w-full border-2 border-zinc-200 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-black transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1">
            Teléfono / WhatsApp
          </label>
          <input
            type="tel"
            value={telefono}
            onChange={e => setTelefono(e.target.value)}
            placeholder="Ej: 0999123456"
            className="w-full border-2 border-zinc-200 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-black transition-colors"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-3 mb-4">
          <p className="text-xs font-bold text-red-600">{error}</p>
        </div>
      )}

      <button onClick={enviarPedido} disabled={enviando}
        className="w-full bg-black text-yellow-400 py-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[4px_4px_0px_rgba(0,0,0,0.2)] disabled:opacity-50">
        {enviando ? "Registrando..." : <><Send size={16}/> Registrar pedido</>}
      </button>

      {/* Instrucciones pago */}
      <div className="mt-6 bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4">
        <p className="text-[10px] font-black text-yellow-600 uppercase tracking-widest mb-2">Cómo pagar</p>
        <p className="text-xs font-bold text-zinc-600 leading-relaxed">
          1. Registra tu pedido y obtén tu código<br/>
          2. Realiza una transferencia por <strong>${libroPrec.toFixed(2)}</strong><br/>
          3. Envía el comprobante por WhatsApp al negocio indicando tu código de pedido
        </p>
      </div>
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
