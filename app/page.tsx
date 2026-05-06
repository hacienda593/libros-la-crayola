"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { BookOpen, ShoppingCart, School, X } from "lucide-react";

type Unidad = { id: string; nombre: string };
type Libro  = {
  id: string; titulo: string; materia: string;
  grado: string; precio: number; imagen_url: string | null;
  unidad_id: string;
};

export default function HomePage() {
  const router = useRouter();
  const [unidades, setUnidades]   = useState<Unidad[]>([]);
  const [unidadSel, setUnidadSel] = useState<string>("todas");
  const [libros, setLibros]       = useState<Libro[]>([]);
  const [cargando, setCargando]   = useState(true);
  const [modal, setModal]         = useState<Libro | null>(null);

  useEffect(() => {
    async function cargar() {
      const [{ data: unis }, { data: libs }] = await Promise.all([
        getSupabase().from("lb_unidades").select("id, nombre").eq("activo", true).order("nombre"),
        getSupabase().from("lb_libros").select("id, titulo, materia, grado, precio, imagen_url, unidad_id")
          .eq("activo", true).order("grado").order("materia"),
      ]);
      setUnidades(unis ?? []);
      setLibros(libs ?? []);
      setCargando(false);
    }
    cargar();
  }, []);

  const librosFiltrados = unidadSel === "todas"
    ? libros
    : libros.filter(l => l.unidad_id === unidadSel);

  const unidadNombre = (id: string) => unidades.find(u => u.id === id)?.nombre ?? "";

  function comprar(l: Libro) {
    setModal(l);
  }

  function irAPedido() {
    if (!modal) return;
    const params = new URLSearchParams({
      unidad_id:     modal.unidad_id,
      unidad_nombre: unidadNombre(modal.unidad_id),
      libro_id:      modal.id,
      libro_titulo:  modal.titulo,
      libro_grado:   modal.grado,
      libro_precio:  String(modal.precio),
    });
    router.push(`/pedido?${params}`);
  }

  if (cargando) return (
    <main className="min-h-screen bg-zinc-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"/>
    </main>
  );

  return (
    <main className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center shadow-[3px_3px_0px_rgba(0,0,0,1)]">
            <BookOpen size={20} className="text-black"/>
          </div>
          <div>
            <h1 className="text-base font-black uppercase tracking-tight leading-none">La Crayola</h1>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Libros Escolares</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Filtro por unidad */}
        {unidades.length > 1 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            <button onClick={() => setUnidadSel("todas")}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase transition-all border-2
                ${unidadSel === "todas" ? "bg-black text-yellow-400 border-black" : "bg-white border-zinc-200 text-zinc-500 hover:border-black"}`}>
              <School size={12}/> Todas
            </button>
            {unidades.map(u => (
              <button key={u.id} onClick={() => setUnidadSel(u.id)}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase transition-all border-2
                  ${unidadSel === u.id ? "bg-black text-yellow-400 border-black" : "bg-white border-zinc-200 text-zinc-500 hover:border-black"}`}>
                <School size={12}/> {u.nombre.split(" ").slice(0, 3).join(" ")}
              </button>
            ))}
          </div>
        )}

        {/* Grid de libros */}
        {librosFiltrados.length === 0 ? (
          <p className="text-center text-zinc-400 font-bold py-12">No hay libros disponibles.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {librosFiltrados.map(l => (
              <div key={l.id} className="bg-white rounded-2xl border border-zinc-200 overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow">
                {/* Portada */}
                <div className="bg-zinc-50 flex items-center justify-center p-3 border-b border-zinc-100" style={{height: "160px"}}>
                  {l.imagen_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.imagen_url} alt={l.titulo} className="h-full w-auto object-contain"/>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <BookOpen size={32} className="text-zinc-200"/>
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="p-3 flex flex-col flex-1">
                  <p className="font-black text-xs leading-tight mb-0.5 text-zinc-900">{l.titulo}</p>
                  <p className="text-[10px] text-zinc-600 font-bold mb-2">{l.grado}</p>
                  <div className="mt-auto flex items-center justify-between">
                    <p className="font-black text-base text-zinc-900">${l.precio.toFixed(2)}</p>
                    <button onClick={() => comprar(l)}
                      className="bg-black text-yellow-400 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-1 hover:bg-zinc-800 transition-colors">
                      <ShoppingCart size={10}/> Comprar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal confirmación */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <p className="font-black text-sm uppercase tracking-wide text-zinc-900">Confirmar pedido</p>
              <button onClick={() => setModal(null)} className="text-zinc-400 hover:text-black transition-colors">
                <X size={18}/>
              </button>
            </div>

            <div className="flex gap-4 mb-5">
              {modal.imagen_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={modal.imagen_url} alt={modal.titulo} className="w-16 h-24 object-contain rounded-xl border border-zinc-100 bg-zinc-50"/>
              ) : (
                <div className="w-16 h-24 bg-zinc-100 rounded-xl flex items-center justify-center shrink-0">
                  <BookOpen size={24} className="text-zinc-300"/>
                </div>
              )}
              <div>
                <p className="font-black text-sm leading-tight text-zinc-900">{modal.titulo}</p>
                <p className="text-xs text-zinc-700 font-bold mt-1">{modal.grado}</p>
                <p className="text-xs text-zinc-700 font-bold">{unidadNombre(modal.unidad_id)}</p>
                <p className="font-black text-xl mt-2 text-zinc-900">${modal.precio.toFixed(2)}</p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-3 mb-4">
              <p className="text-[10px] font-black text-yellow-700 uppercase tracking-widest mb-1">Pago por transferencia</p>
              <p className="text-xs text-zinc-600 font-bold leading-relaxed">
                Registra tu pedido → transfiere ${modal.precio.toFixed(2)} → envía el comprobante por WhatsApp con tu código
              </p>
            </div>

            <button onClick={irAPedido}
              className="w-full bg-black text-yellow-400 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2">
              <ShoppingCart size={16}/> Registrar pedido
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
