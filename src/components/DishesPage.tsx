import { useState } from "react";
import { Eye, Pencil, Trash2, ChevronLeft, ChevronRight, ArrowDownRightFromCircle } from "lucide-react";
import { PAGE_SIZE } from "../constants";
import { MONO } from "../styles/shared";
import { fmt, cs, clsx } from "../utils";
import type { PlatilloResumen, CategoriaPlatillo, EstadoPlatillo } from "../services/inventarioDishes.services";

// A diferencia de la versión anterior, ya NO recibe `ingredients` ni calcula
// costo/margen localmente con dishCost(): costo, margenBruto y pctMargenCosto
// ya vienen calculados por fn_filtrar_platillos en el backend.
export function DishesPage({
  platillos, categorias, search, setSearch, filterCategoriaId, setFilterCategoriaId,
  estado, setEstado, onView, onEdit, onDelete, onReactivate,
}: {
  platillos: PlatilloResumen[];
  categorias: CategoriaPlatillo[];
  search: string;
  setSearch: (v: string) => void;
  filterCategoriaId: number | "todas";
  setFilterCategoriaId: (v: number | "todas") => void;
  /** "activos" (default), "inactivos" o "todos" — para poder buscar y
   *  reactivar un platillo dado de baja en vez de duplicarlo. */
  estado: EstadoPlatillo;
  setEstado: (v: EstadoPlatillo) => void;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onReactivate: (id: number) => void;
}) {
  const [page, setPage] = useState(1);

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
            { label: "Platillos", val: platillos.length },
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
        <input
          placeholder="Buscar platillo…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 w-52"
        />
        <select
          value={filterCategoriaId}
          onChange={(e) => { setFilterCategoriaId(e.target.value === "todas" ? "todas" : Number(e.target.value)); setPage(1); }}
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
        >
          <option value="todas">Todas</option>
          {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <select
          value={estado}
          onChange={(e) => { setEstado(e.target.value as EstadoPlatillo); setPage(1); }}
          title="Filtrar por estado (útil para reactivar un platillo dado de baja)"
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
        >
          <option value="activos">Activos</option>
          <option value="inactivos">Dados de baja</option>
          <option value="todos">Todos</option>
        </select>
        <span className="text-xs text-muted-foreground ml-auto">{platillos.length} resultados</span>
      </div>

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
              {paged.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">Sin resultados.</td></tr>
              )}
              {paged.map((dish, idx) => {
                // dish.activo todavía no lo manda el backend (pendiente
                // agregar la columna a vw_margen_platillos). Mientras tanto,
                // cuando el filtro es "inactivos" TODAS las filas que llegan
                // son inactivas por definición del propio filtro — no hace
                // falta el campo para saberlo. Con "todos" sí dependemos de
                // dish.activo si en algún momento el backend lo manda.
                const esInactivo = estado === "inactivos" || (estado === "todos" && dish.activo === false);
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
                  <td className="px-4 py-3 font-medium text-foreground" style={MONO}>{cs(dish.precioVenta)}</td>
                  <td className="px-4 py-3 text-foreground" style={MONO}>{cs(dish.costo)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={clsx("text-sm font-semibold", dish.margenBruto >= 0 ? "text-green-600" : "text-destructive")} style={MONO}>
                        {cs(dish.margenBruto)}
                      </span>
                      <span className={clsx("text-[11px] px-1.5 py-0.5 rounded font-medium",
                        dish.pctMargenCosto > 50 ? "bg-green-100 text-green-700" : dish.pctMargenCosto > 25 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700")}>
                        {fmt(dish.pctMargenCosto)}%
                      </span>
                    </div>
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
