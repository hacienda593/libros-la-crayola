import Link from "next/link";

export const metadata = {
  title: "La Crayola · Pausa",
  description: "Aplicación en pausa por mantenimiento.",
};

export default function PausaPage() {
  return (
    <main className="min-h-screen bg-zinc-900 text-zinc-100 flex items-center justify-center px-4">
      <div className="max-w-xl w-full bg-zinc-950/95 border border-zinc-800 rounded-3xl p-8 text-center shadow-2xl">
        <p className="text-amber-400 uppercase text-xs font-bold tracking-[0.35em] mb-4">Sitio en pausa</p>
        <h1 className="text-4xl font-black mb-4">Estamos en mantenimiento</h1>
        <p className="text-sm leading-7 text-zinc-300 mb-6">
          La tienda está temporalmente en pausa para ajustes y mejoras. Gracias por tu paciencia. Vuelve a intentarlo más tarde.
        </p>
        <Link href="/" className="inline-flex items-center justify-center rounded-full bg-yellow-400 px-6 py-3 text-sm font-black uppercase tracking-[0.2em] text-zinc-950 hover:bg-yellow-300 transition-colors">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
