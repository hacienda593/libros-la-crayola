"use client";
export const dynamic = "force-dynamic";

import { useParams, useSearchParams } from "next/navigation";
import { CheckCircle, Share2 } from "lucide-react";
import Link from "next/link";

const NEGOCIO_WA = "593984341953";
const LOGO_URL   = "https://hjdtjxxtqcrtbzftpqkn.supabase.co/storage/v1/object/public/logos-empresas/1717067647001.png";
const URL_TIENDA = "https://libros-la-crayola.vercel.app";

export default function ConfirmacionPage() {
  const { codigo }    = useParams<{ codigo: string }>();
  const params        = useSearchParams();
  const precio        = params.get("precio") ?? "";
  const titulo        = decodeURIComponent(params.get("titulo") ?? "");
  const grado         = decodeURIComponent(params.get("grado") ?? "");
  const comprador     = decodeURIComponent(params.get("comprador") ?? "");

  const msgWA = encodeURIComponent(
    `Hola La Crayola! Registre mi pedido de libro escolar.\n\n` +
    `Libro: ${titulo}\n` +
    `Grado: ${grado}\n` +
    `Comprador: ${comprador}\n` +
    `Valor: $${precio}\n` +
    `Codigo de pedido: *${codigo}*\n\n` +
    `Adjunto el comprobante de transferencia.`
  );
  const waUrl = `https://wa.me/${NEGOCIO_WA}?text=${msgWA}`;

  const msgCompartir = encodeURIComponent(
    `Hola! Te comparto el link para pedir los libros de ingles *My English Workbook* disponibles en La Crayola.\n\n` +
    `Puedes escoger el libro de tu hijo, registrar tu pedido y pagar por transferencia desde aqui:\n${URL_TIENDA}`
  );
  const waCompartir = `https://wa.me/?text=${msgCompartir}`;

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center py-10">
      {/* Logo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={LOGO_URL} alt="La Crayola" className="h-16 object-contain mb-4"/>

      <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mb-4 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
        <CheckCircle size={32} className="text-black" fill="black"/>
      </div>

      <h1 className="text-2xl font-black uppercase tracking-tight mb-1 text-zinc-900">¡Pedido registrado!</h1>
      <p className="text-zinc-700 text-sm font-bold max-w-xs mb-6">
        Envía tu comprobante por WhatsApp con el código de abajo
      </p>

      {/* Código */}
      <div className="bg-black text-yellow-400 rounded-3xl px-12 py-6 mb-6 shadow-[6px_6px_0px_rgba(0,0,0,0.2)]">
        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Código de pedido</p>
        <p className="text-6xl font-black tracking-widest">{codigo}</p>
        <p className="text-xs font-black text-zinc-400 mt-2">${precio} · {titulo} · {grado}</p>
      </div>

      <div className="space-y-3 w-full max-w-xs">

        {/* Botón WhatsApp principal */}
        <a href={waUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full bg-[#25D366] text-white py-4 rounded-2xl font-black text-sm uppercase tracking-wider shadow-[4px_4px_0px_rgba(0,0,0,0.15)]">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Enviar comprobante por WhatsApp
        </a>

        {/* Próximos pasos */}
        <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-left">
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">Próximos pasos</p>
          <ol className="space-y-1.5">
            {[
              "Recuerda que previo a continuar ya debes haber realizado el pago.",
              "Envía tu pedido por WhatsApp con los datos del mismo dando clic en el botón de arriba.",
              "No olvides adjuntar el comprobante de pago al mensaje.",
              "Puedes seguir comprando libros si lo necesitas, o compartir la página con otro padre.",
              "Cuando tu libro esté en nuestra tienda te avisamos para coordinar la entrega.",
            ].map((paso, i) => (
              <li key={i} className="flex gap-2 text-xs text-zinc-700 font-bold leading-snug">
                <span className="w-4 h-4 bg-black text-yellow-400 rounded-full text-[9px] font-black flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
                {paso}
              </li>
            ))}
          </ol>
        </div>

        {/* Comprar otro libro */}
        <Link href="/"
          className="flex items-center justify-center gap-2 w-full bg-black text-yellow-400 py-3 rounded-2xl text-sm font-black uppercase tracking-wider">
          Comprar otro libro
        </Link>

        {/* Compartir página */}
        <a href={waCompartir} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full bg-zinc-900 text-white py-3.5 rounded-2xl text-sm font-black uppercase tracking-wider hover:bg-zinc-700 transition-colors shadow-[3px_3px_0px_rgba(0,0,0,0.2)]">
          <Share2 size={15}/>
          <span>Compartir con otro padre</span>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="white" className="opacity-70">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>
      </div>
    </main>
  );
}
