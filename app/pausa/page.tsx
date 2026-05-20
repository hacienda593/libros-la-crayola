const WA_NUMBER = "593984341953";
const WA_MESSAGE = "Hola! La preventa de libros está desactivada y quiero consultar sobre el fin de temporada.";
const WA_URL = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(WA_MESSAGE)}`;

export const metadata = {
  title: "La Crayola · Preventa desactivada",
  description: "Fin de temporada: preventa de libros desactivada. Consulta por WhatsApp.",
};

export default function PausaPage() {
  return (
    <main className="min-h-screen bg-zinc-900 text-zinc-100 flex items-center justify-center px-4">
      <div className="max-w-xl w-full bg-zinc-950/95 border border-zinc-800 rounded-3xl p-8 text-center shadow-2xl">
        <p className="text-amber-400 uppercase text-xs font-bold tracking-[0.35em] mb-4">Fin de temporada</p>
        <h1 className="text-4xl font-black mb-4">Preventa de libros desactivada</h1>
        <p className="text-sm leading-7 text-zinc-300 mb-6">
          El sistema de preventa de libros está desactivado porque ha terminado la temporada. Para cualquier consulta, comunícate por WhatsApp.
        </p>
        <a href={WA_URL} target="_blank" rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-green-500 px-6 py-3 text-sm font-black uppercase tracking-[0.2em] text-white hover:bg-green-400 transition-colors">
          Contactar por WhatsApp
          <span className="text-base">📱</span>
        </a>
        <p className="mt-4 text-xs text-zinc-500">WhatsApp: +593 98 434 1953</p>
      </div>
    </main>
  );
}
