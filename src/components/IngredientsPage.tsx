import { useState } from "react";
import { AlertTriangle, Pencil, Trash2, ChevronLeft, ChevronRight, ArrowDownRightFromCircle, Loader2, FilterX } from "lucide-react";
import type { Ingredient } from "../types";
import type { Categoria, UnidadMedida } from "../services/catalogos.services";
import { ING_CATEGORIES, PAGE_SIZE } from "../constants";
import { MONO } from "../styles/shared";
import { cs, clsx } from "../utils";
import { IngredientEditModal } from "./IngredientEditModal";

export function IngredientsPage({
  ingredients, categorias, unidades, onUpdate, onDelete, onReactivate,
}: {
  ingredients: Ingredient[];
  categorias: Categoria[];
  unidades: UnidadMedida[];
  onUpdate: (updated: Ingredient) => void;
  onDelete: (id: number) => void;
  onReactivate: (id: number) => void;
}) {
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("Todas");
  const [page, setPage] = useState(1);

  const filtered = ingredients.filter((i) => {
    const matchS = i.name.toLowerCase().includes(search.toLowerCase());
    const matchC = filterCat === "Todas" || i.category === filterCat;
    return matchS && matchC;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  // Las cards cuentan solo ingredientes activos (la tabla sigue mostrando los
  // inactivos para poder reactivarlos). Misma regla que el Dashboard y la BD
  // (vw_cards_ingredientes): stock bajo = stock actual <= stock mínimo.
  const activosFiltrados = filtered.filter((i) => i.active !== false);
  const totalVal = activosFiltrados.reduce((s, i) => s + i.costPerUnit * i.stock, 0);
  const lowStock = activosFiltrados.filter((i) =>
    i.bajoStockMinimo ?? (i.stockMinimo !== undefined && i.stock <= i.stockMinimo)
  ).length;
  const [confirmingDelete, setConfirmingDelete] = useState<{ id: number; nombre: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmarEliminar = async () => {
    if (!confirmingDelete) return;
    setDeleting(true);
    try {
      await onDelete(confirmingDelete.id);
      setConfirmingDelete(null);
    } finally {
      setDeleting(false);
    }
  };
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 overflow-y-auto">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Ingredientes</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Usa el botón Editar para modificar todos los campos de un registro.</p>
        </div>
        <div className="grid grid-cols-2 lg:flex gap-3">
          <div className="bg-card border border-border rounded-xl px-3 sm:px-4 py-2.5 shadow-sm text-center">
            <p className="text-[10px] sm:text-[11px] uppercase tracking-wide text-muted-foreground">Total registros</p>
            <p className="text-lg sm:text-xl font-bold text-foreground mt-0.5" style={MONO}>{activosFiltrados.length}</p>
          </div>
          <div className="bg-card border border-border rounded-xl px-3 sm:px-4 py-2.5 shadow-sm text-center">
            <p className="text-[10px] sm:text-[11px] uppercase tracking-wide text-muted-foreground">Valor inventario</p>
            <p className="text-lg sm:text-xl font-bold text-foreground mt-0.5" style={MONO}>{cs(totalVal)}</p>
          </div>
          {lowStock > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 sm:px-4 py-2.5 shadow-sm text-center col-span-2 lg:col-span-1">
              <p className="text-[10px] sm:text-[11px] uppercase tracking-wide text-amber-600 flex items-center gap-1 justify-center">
                <AlertTriangle size={10} />Stock bajo
              </p>
              <p className="text-lg sm:text-xl font-bold text-amber-700 mt-0.5" style={MONO}>{lowStock}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap items-start sm:items-center">
        <input
          placeholder="Buscar ingrediente…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full sm:w-52 bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <select
          value={filterCat}
          onChange={(e) => { setFilterCat(e.target.value); setPage(1); }}
          className="flex-1 sm:flex-none bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
        >
          <option>Todas</option>
          {ING_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        {(search.trim() !== "" || filterCat !== "Todas") && (
          <button onClick={() => { setSearch(""); setFilterCat("Todas"); setPage(1); }} title="Quitar búsqueda y filtros"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <FilterX size={14} /> Limpiar filtros
          </button>
        )}
        <span className="text-xs text-muted-foreground sm:ml-auto">{filtered.length} resultados</span>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto text-xs sm:text-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                {["#", "Nombre", "Unidad", "Categoría", "C$ / Unidad", "Stock", "Valor total", "Acciones"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paged.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">Sin resultados.</td></tr>
              )}
              {paged.map((ing, idx) => (
                <tr key={ing.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3 text-xs text-muted-foreground" style={MONO}>
                    {String((safePage - 1) * PAGE_SIZE + idx + 1).padStart(2, "0")}
                  </td> 
                  <td className="px-4 py-3 font-medium text-foreground min-w-[150px]">
                    <span className={ing.active ? "" : "line-through text-muted-foreground"}>
                      {ing.name}
                    </span>
                    {!ing.active && (
                      <span className="ml-2 inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground align-middle">
                        Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{ing.unit}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-secondary text-secondary-foreground">{ing.category}</span>
                  </td>
                  <td className="px-4 py-3 text-foreground" style={MONO}>{cs(ing.costPerUnit)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className={clsx("text-sm", ing.stock < 10 ? "text-amber-600 font-semibold" : "text-foreground")} style={MONO}>
                        {ing.stock}
                      </span>
                      {ing.stock < 10 && <AlertTriangle size={12} className="text-amber-500 shrink-0" />}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground" style={MONO}>{cs(ing.costPerUnit * ing.stock)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        title="Editar todos los campos"
                        onClick={() => setEditing(ing)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
                      >
                        <Pencil size={12} /> Editar
                      </button>
                      <button
                        title="Eliminar ingrediente"
                        onClick={() => setConfirmingDelete({ id: ing.id, nombre: ing.name })}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                      {!ing.active && (
                        <button
                          title="Reactivar ingrediente"
                          onClick={() => onReactivate(ing.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
                        >
                          <ArrowDownRightFromCircle size={12} /> Activar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {paged.length > 0 && (
              <tfoot>
                <tr className="border-t border-border bg-secondary/20">
                  <td colSpan={6} className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Valor total página</td>
                  <td className="px-4 py-3 font-bold text-foreground" style={MONO}>
                    {cs(paged.reduce((s, i) => s + i.costPerUnit * i.stock, 0))}
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-secondary/10">
          <p className="text-xs text-muted-foreground">
            Página <span className="font-semibold text-foreground">{safePage}</span> de{" "}
            <span className="font-semibold text-foreground">{totalPages}</span> · {paged.length} de {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={safePage === 1}
              className="px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 transition-colors font-medium">«</button>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 transition-colors">
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((n) => Math.abs(n - safePage) <= 2)
              .map((n) => (
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
            <button onClick={() => setPage(totalPages)} disabled={safePage === totalPages}
              className="px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 transition-colors font-medium">»</button>
          </div>
        </div>
      </div>

      {editing && (
        <IngredientEditModal
          ingredient={editing}
          categorias={categorias}
          unidades={unidades}
          onSave={(updated) => { onUpdate(updated); setEditing(null); }}
          onClose={() => setEditing(null)}
        />
      )}

      {confirmingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => !deleting && setConfirmingDelete(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[3px]" />
          <div
            className="relative bg-card rounded-2xl shadow-2xl w-full max-w-sm border border-border overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-6 pb-4 flex gap-3">
              <div className="w-9 h-9 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle size={16} className="text-destructive" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">¿Eliminar este ingrediente?</p>
                <p className="text-sm text-muted-foreground mt-1">
                  <span className="font-medium text-foreground">{confirmingDelete.nombre}</span> se dará de baja.
                  No se borra su historial ni sus recetas — si vuelves a buscarlo por nombre, aparecerá marcado como
                  "Inactivo" con la opción de reactivarlo.
                </p>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setConfirmingDelete(null)} disabled={deleting}
                className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50">
                Cancelar
              </button>
              <button onClick={confirmarEliminar} disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-destructive text-white text-sm font-semibold hover:bg-destructive/90 active:scale-[0.98] transition-all disabled:opacity-60">
                {deleting ? <Loader2 size={14} className="animate-spin" /> : null}
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
