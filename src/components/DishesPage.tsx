import { useEffect, useState } from "react";
import { Eye, Pencil, Trash2, ChevronLeft, ChevronRight, Loader2, AlertCircle, Check, X } from "lucide-react";
import { MONO } from "../styles/shared";
import { fmt, cs, clsx } from "../utils";
import { ApiError } from "../services/apiClient";
import {
  obtenerResumenPlatillos,
  listarCategoriasInventario,
  listarPlatillosInventario,
  eliminarPlatillo,
  type ResumenPlatillos,
  type CategoriaInventario,
  type PlatilloInventario,
} from "../services/dishesInventory.services";
import { DishIngredientsModal } from "./DishIngredientsModal";
import { DishEditDrawer } from "./DishEditDrawer";

const PAGE_SIZE = 6;

export function DishesPage() {
  const [resumen, setResumen] = useState<ResumenPlatillos | null>(null);
  const [categorias, setCategorias] = useState<CategoriaInventario[]>([]);
  const [platillos, setPlatillos] = useState<PlatilloInventario[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState(""); // "" = Todas
  const [page, setPage] = useState(1);

  const [viewingId, setViewingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Cards + categorías: se cargan una sola vez.
  useEffect(() => {
    let cancelled = false;
    Promise.all([obtenerResumenPlatillos(), listarCategoriasInventario()])
      .then(([r, c]) => {
        if (cancelled) return;
        setResumen(r);
        setCategorias(c);
      })
      .catch(() => { /* las cards no son criticas para operar la tabla */ });
    return () => { cancelled = true; };
  }, []);

  // Tabla: se recarga con debounce cuando cambia la búsqueda o la categoría.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    const t = setTimeout(() => {
      listarPlatillosInventario({
        search: search.trim() || undefined,
        categoriaId: filterCat ? parseInt(filterCat) : null,
      })
        .then((data) => {
          if (cancelled) return;
          setPlatillos(data);
          setPage(1);
        })
        .catch((err) => {
          if (cancelled) return;
          setLoadError(err instanceof ApiError ? err.message : "No se pudo cargar la lista de platillos.");
        })
        .finally(() => { if (!cancelled) setLoading(false); });
    }, 350);
    return () => { cancelled = true; clearTimeout(t); };
  }, [search, filterCat]);

  async function refrescarTabla() {
    try {
      const data = await listarPlatillosInventario({
        search: search.trim() || undefined,
        categoriaId: filterCat ? parseInt(filterCat) : null,
      });
      setPlatillos(data);
    } catch {
      // silencioso: la tabla se queda con lo que ya tenia
    }
    obtenerResumenPlatillos().then(setResumen).catch(() => {});
  }

  async function confirmarEliminar(id: number) {
    setDeleteError(null);
    setDeletingId(id);
    try {
      await eliminarPlatillo(id);
      setConfirmDeleteId(null);
      await refrescarTabla();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "No se pudo eliminar el platillo.");
    } finally {
      setDeletingId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(platillos.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = platillos.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Platillos</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestión de platillos, costos y márgenes.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {[
            { label: "Platillos", val: resumen?.total_platillos ?? "—" },
            { label: "Categorías", val: resumen?.total_categorias_platillo ?? "—" },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-xl px-4 py-2.5 shadow-sm text-center">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
              <p className="text-xl font-bold text-foreground mt-0.5" style={MONO}>{s.val}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <input
          placeholder="Buscar platillo…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 w-52"
        />
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
        >
          <option value="">Todas</option>
          {categorias.map((c) => <option key={c.categoria_id} value={c.categoria_id}>{c.categoria}</option>)}
        </select>
        {loading && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
        <span className="text-xs text-muted-foreground ml-auto">{platillos.length} resultados</span>
      </div>

      {deleteError && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-destructive/10 text-destructive text-xs">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <span>{deleteError}</span>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                {["#", "Platillo", "Categoría", "Precio venta", "Costo ingred.", "Margen", "Acciones"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {!loading && loadError && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-destructive">{loadError}</td></tr>
              )}
              {!loading && !loadError && paged.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">Sin resultados.</td></tr>
              )}
              {!loadError && paged.map((dish, idx) => {
                const precio = Number(dish.precio_venta);
                const costo = Number(dish.costo);
                const margin = Number(dish.margen_bruto);
                const marginPct = Number(dish.pct_margen_costo);
                return (
                  <tr key={dish.platillo_id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted-foreground" style={MONO}>
                      {String((safePage - 1) * PAGE_SIZE + idx + 1).padStart(2, "0")}
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground min-w-[160px]">{dish.platillo}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-secondary text-secondary-foreground">{dish.categoria}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground" style={MONO}>{cs(precio)}</td>
                    <td className="px-4 py-3 text-foreground" style={MONO}>{cs(costo)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={clsx("text-sm font-semibold", margin >= 0 ? "text-green-600" : "text-destructive")} style={MONO}>
                          {cs(margin)}
                        </span>
                        <span className={clsx("text-[11px] px-1.5 py-0.5 rounded font-medium",
                          marginPct > 50 ? "bg-green-100 text-green-700" : marginPct > 25 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700")}>
                          {fmt(marginPct)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {confirmDeleteId === dish.platillo_id ? (
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-muted-foreground mr-1">¿Eliminar?</span>
                          <button
                            title="Confirmar"
                            onClick={() => confirmarEliminar(dish.platillo_id)}
                            disabled={deletingId === dish.platillo_id}
                            className="p-1.5 rounded-md text-white bg-destructive hover:bg-destructive/90 transition-colors disabled:opacity-50"
                          >
                            {deletingId === dish.platillo_id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                          </button>
                          <button
                            title="Cancelar"
                            onClick={() => setConfirmDeleteId(null)}
                            disabled={deletingId === dish.platillo_id}
                            className="p-1.5 rounded-md text-muted-foreground hover:bg-secondary transition-colors"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            title="Ver ingredientes y costos"
                            onClick={() => setViewingId(dish.platillo_id)}
                            className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors whitespace-nowrap"
                          >
                            <Eye size={12} /> Ver
                          </button>
                          <button
                            title="Editar platillo"
                            onClick={() => setEditingId(dish.platillo_id)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            title="Eliminar"
                            onClick={() => { setDeleteError(null); setConfirmDeleteId(dish.platillo_id); }}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-secondary/10">
          <p className="text-xs text-muted-foreground">
            Página <span className="font-semibold text-foreground">{safePage}</span> de{" "}
            <span className="font-semibold text-foreground">{totalPages}</span> · {paged.length} de {platillos.length}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 transition-colors">
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).filter((n) => Math.abs(n - safePage) <= 2).map((n) => (
              <button key={n} onClick={() => setPage(n)}
                className={clsx("w-7 h-7 rounded-md text-xs font-semibold transition-colors",
                  n === safePage ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground hover:bg-secondary")}>
                {n}
              </button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 transition-colors">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {viewingId !== null && (
        <DishIngredientsModal platilloId={viewingId} onClose={() => setViewingId(null)} />
      )}
      {editingId !== null && (
        <DishEditDrawer
          platilloId={editingId}
          categorias={categorias}
          onClose={() => setEditingId(null)}
          onSaved={() => { setEditingId(null); refrescarTabla(); }}
        />
      )}
    </div>
  );
}
