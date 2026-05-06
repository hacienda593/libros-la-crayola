"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { BookOpen, ChevronRight, School } from "lucide-react";

type Unidad = { id: string; nombre: string };
type Libro  = {
  id: string; titulo: string; materia: string;
  grado: string; precio: number; imagen_url: string | null;
};

export default function HomePage() {
  const router = useRouter();
  const [unidades, setUnidades]             = useState<Unidad[]>([]);
  const [unidadSel, setUnidadSel]           = useState<Unidad | null>(null);
  const [libros, setLibros]                 = useState<Libro[]>([]);
  const [libroSel, setLibroSel]             = useState<Libro | null>(null);
  const [cargando, setCargando]             = useState(true);
  const [cargandoLibros, setCargandoLibros] = useState(false);

  useEffect(() => {
    getSupabase()
      .from("lb_unidades")
      .select("id, nombre")
      .eq("activo", true)
      .order("nombre")
      .then(({ data }) => { setUnidades(data ?? []); setCargando(false); });
  }, []);

  async function seleccionarUnidad(u: Unidad) {
    setUnidadSel(u);
    setLibroSel(null);
    setCargandoLibros(true);
    const { data } = await getSupabase()
      .from("lb_libros")
      .select("id, titulo, materia, grado, precio, imagen_url")
      .eq("unidad_id", u.id)
      .eq("activo", true)
      .order("grado")
      .order("materia");
    setLibros(data ?? []);
    setCargandoLibros(false);
  }

  function continuar() {
    if (!unidadSel || !libroSel) return;
    const params = new URLSearchParams({
      unidad_id:     unidadSel.id,
      unidad_nombre: unidadSel.nombre,
      libro_id:      libroSel.id,
      libro_titulo:  libroSel.titulo,
      libro_grado:   libroSel.grado,
      libro_precio:  String(libroSel.precio),
    });
    router.push(`/pedido?${params}`);
  }

  if (cargando) return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"/>
    </main>
  );

  return (
    <main className="min-h-screen bg-white px-4 py-8 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          <BookOpen size={24} className="text-black"/>
        </div>
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight">La Crayola</h1>
          <p className="text-xs text-zinc-500 font-bold">Preventa de Libros Escolares</p>
        </div>
      </div>

      {/* Paso 1: Unidad educativa */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 bg-black text-yellow-400 rounded-full text-xs font-black flex items-center justify-center">1</span>
          <h2 className="font-black uppercase text-sm tracking-wide">Selecciona tu unidad educativa</h2>
        </div>
        <div className="space-y-2">
          {unidades.map(u => (
            <button key={u.id} onClick={() => seleccionarUnidad(u)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all
                ${unidadSel?.id === u.id
                  ? "border-black bg-yellow-400 shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                  : "border-zinc-200 hover:border-black"}`}>
              <School size={18} className="shrink-0"/>
              <span className="font-bold text-sm">{u.nombre}</span>
            </button>
          ))}
          {unidades.length === 0 && (
            <p className="text-sm text-zinc-400 font-bold text-center py-4">No hay unidades educativas disponibles.</p>
          )}
        </div>
      </section>

      {/* Paso 2: Libro */}
      {unidadSel && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 bg-black text-yellow-400 rounded-full text-xs font-black flex items-center justify-center">2</span>
            <h2 className="font-black uppercase text-sm tracking-wide">Selecciona el libro</h2>
          </div>

          {cargandoLibros ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"/>
            </div>
          ) : libros.length === 0 ? (
            <p className="text-sm text-zinc-400 font-bold text-center py-4">No hay libros disponibles para esta unidad.</p>
          ) : (
            <div className="space-y-2">
              {libros.map(l => (
                <button key={l.id} onClick={() => setLibroSel(l)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all
                    ${libroSel?.id === l.id
                      ? "border-black bg-yellow-400 shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                      : "border-zinc-200 hover:border-black"}`}>
                  {l.imagen_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.imagen_url} alt={l.titulo}
                      className="w-12 h-16 object-cover rounded-lg shrink-0 border border-zinc-200"/>
                  ) : (
                    <div className="w-12 h-16 bg-zinc-100 rounded-lg shrink-0 flex items-center justify-center">
                      <BookOpen size={20} className="text-zinc-300"/>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm leading-tight">{l.titulo}</p>
                    <p className="text-xs text-zinc-500 font-bold mt-1">{l.materia} · {l.grado}</p>
                  </div>
                  <p className="font-black text-sm shrink-0">${l.precio.toFixed(2)}</p>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Botón continuar */}
      {libroSel && (
        <button onClick={continuar}
          className="w-full bg-black text-yellow-400 py-4 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[4px_4px_0px_rgba(0,0,0,0.2)]">
          Continuar <ChevronRight size={18}/>
        </button>
      )}
    </main>
  );
}
