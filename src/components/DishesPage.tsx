import { useState } from "react";
import { Eye, Pencil, Trash2, ChevronLeft, ChevronRight, ArrowDownRightFromCircle, Download, FilterX } from "lucide-react";
import { PAGE_SIZE } from "../constants";
import { MONO } from "../styles/shared";
import { fmt, cs, clsx } from "../utils";
import type { PlatilloResumen, CategoriaPlatillo } from "../services/inventarioDishes.services";
import type { RestaurantePlatillo } from "../services/dish.services";

// A diferencia de la versión anterior, ya NO recibe `ingredients` ni calcula
// costo/margen localmente con dishCost(): costo, margenBruto y pctMargenCosto

// búsqueda siempre trae activos + inactivos que coincidan con el texto, y
// cada fila se resuelve inline según `dish.activo` — tachado + badge
// "Inactivo" + botón "Activar" en vez de Editar/Eliminar.

export function DishesPage({
  platillos, categorias, search, setSearch, filterCategoriaId, setFilterCategoriaId,
  restaurantes, filterRestauranteId, setFilterRestauranteId, onClearFilters,
  onView, onEdit, onDelete, onReactivate, onExport,
}: {
  platillos: PlatilloResumen[];
  categorias: CategoriaPlatillo[];
  search: string;
  setSearch: (v: string) => void;
  filterCategoriaId: number | "todas";
  setFilterCategoriaId: (v: number | "todas") => void;
  restaurantes: RestaurantePlatillo[];
  filterRestauranteId: number | "todos";
  setFilterRestauranteId: (v: number | "todos") => void;
  /** Vuelve búsqueda, categoría y restaurante a su valor inicial */
  onClearFilters: () => void;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onReactivate: (id: number) => void;
  /** Abre el modal "Exportar" (PDF / Excel) */
  onExport: () => void;
}) {
  const [page, setPage] = useState(1);
  const hayFiltros = search.trim() !== "" || filterCategoriaId !== "todas" || filterRestauranteId !== "todos";

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
            // Solo activos: la tabla también lista inactivos (para reactivarlos)
            { label: "Platillos", val: platillos.filter((p) => p.activo !== false).length },
            { label: "Categorías", val: categorias.length },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-xl px-4 py-2.5 shadow-sm text-center">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
              <p className="text-xl font-bold text-foreground mt-0.5" style={MONO}>{s.val}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <div className="flex gap-3 flex-wrap items-center">
        <input
          placeholder="Buscar platillo…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 w-44"
        />
        <select
          value={filterCategoriaId}
          onChange={(e) => { setFilterCategoriaId(e.target.value === "todas" ? "todas" : Number(e.target.value)); setPage(1); }}
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
        >
          <option value="todas">Todas las categorías</option>
          {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <select
          aria-label="Filtrar por restaurante"
          value={filterRestauranteId}
          onChange={(e) => { setFilterRestauranteId(e.target.value === "todos" ? "todos" : Number(e.target.value)); setPage(1); }}
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
        >
          <option value="todos">Todos los restaurantes</option>
          {restaurantes.map((r) => <option key={r.id} value={r.id}>{r.nombre_restaurante}</option>)}
        </select>
        {/* Siempre visible; deshabilitado cuando no hay filtros que quitar */}
        <button onClick={() => { onClearFilters(); setPage(1); }} disabled={!hayFiltros} title="Quitar búsqueda y filtros"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground">
          <FilterX size={14} /> Limpiar filtros
        </button>
        </div>
        {/* Resultados + Exportar siempre juntos a la derecha */}
        <div className="flex items-center gap-3 ml-auto shrink-0">
        <span className="text-xs text-muted-foreground whitespace-nowrap">{platillos.length} resultados</span>
        <button onClick={onExport} title="Exportar reporte en PDF o Excel"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all">
          <Download size={14} /> Exportar
        </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                {["#", "Nombre del Platillo", "Categoría", "Precio venta", "Costo Unit", "M Bruto", "%M/costo", "Acciones"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paged.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">Sin resultados.</td></tr>
              )}
              {paged.map((dish, idx) => {
                const esInactivo = dish.activo === false;
                return (
                <tr key={dish.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3 text-xs text-muted-foreground" style={MONO}>
                    {String((safePage - 1) * PAGE_SIZE + idx + 1).padStart(2, "0")}
                  </td>
                  <td className="px-4 py-3 font-semibold text-foreground min-w-[160px]">
                    <div className="flex items-center gap-2">
                      <span className={esInactivo ? "text-muted-foreground line-through" : ""}>{dish.nombre}</span>
                      {esInactivo && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-secondary text-muted-foreground">Inactivo</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-secondary text-secondary-foreground">{dish.categoria}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap" style={MONO}>{cs(dish.precioVenta)}</td>
                  <td className="px-4 py-3 text-foreground whitespace-nowrap" style={MONO}>{cs(dish.costo)}</td>
                  {/* M Bruto y %M/costo en columnas separadas (vw_margen_platillos ya los entrega por separado) */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={clsx("text-sm font-semibold", dish.margenBruto >= 0 ? "text-green-600" : "text-destructive")} style={MONO}>
                      {cs(dish.margenBruto)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {/* Mismo tamaño y estilo que M Bruto (sin fondo/etiqueta) */}
                    <span className={clsx("text-sm font-semibold", dish.pctMargenCosto >= 0 ? "text-green-600" : "text-destructive")} style={MONO}>
                      {fmt(dish.pctMargenCosto)}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button title="Ver ingredientes y costos" onClick={() => onView(dish.id)}
                        className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors whitespace-nowrap">
                        <Eye size={12} /> Ver
                      </button>
                      {esInactivo ? (
                        <button title="Reactivar platillo" onClick={() => onReactivate(dish.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors whitespace-nowrap">
                          <ArrowDownRightFromCircle size={12} /> Activar
                        </button>
                      ) : (
                        <>
                          <button title="Editar platillo" onClick={() => onEdit(dish.id)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                            <Pencil size={13} />
                          </button>
                          <button title="Eliminar" onClick={() => onDelete(dish.id)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
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
    </div>
  );
}