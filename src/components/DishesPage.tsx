import { useState } from "react";
import { Eye, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import type { Dish, Ingredient } from "../types";
import { DISH_CATEGORIES, PAGE_SIZE } from "../constants";
import { MONO } from "../styles/shared";
import { fmt, cs, clsx, dishCost } from "../utils";
import { DishIngredientsModal } from "./DishIngredientsModal";
import { DishEditDrawer } from "./DishEditDrawer";

export function DishesPage({
  dishes, ingredients, onDelete, onUpdate,
}: {
  dishes: Dish[];
  ingredients: Ingredient[];
  onDelete: (id: number) => void;
  onUpdate: (updated: Dish) => void;
}) {
  const [editing, setEditing] = useState<Dish | null>(null);
  const [viewing, setViewing] = useState<Dish | null>(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("Todas");
  const [page, setPage] = useState(1);

  const filtered = dishes.filter((d) => {
    const matchS = d.name.toLowerCase().includes(search.toLowerCase());
    const matchC = filterCat === "Todas" || d.category === filterCat;
    return matchS && matchC;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Platillos</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestión de platillos, costos y márgenes.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {[
            { label: "Platillos", val: dishes.length },
            { label: "Categorías", val: new Set(dishes.map((d) => d.category)).size },
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
          value={filterCat}
          onChange={(e) => { setFilterCat(e.target.value); setPage(1); }}
          className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
        >
          <option>Todas</option>
          {DISH_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} resultados</span>
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
                const cost = dishCost(dish, ingredients);
                const margin = dish.price - cost;
                const marginPct = dish.price > 0 ? (margin / dish.price) * 100 : 0;
                return (
                  <tr key={dish.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted-foreground" style={MONO}>
                      {String((safePage - 1) * PAGE_SIZE + idx + 1).padStart(2, "0")}
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground min-w-[160px]">{dish.name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-secondary text-secondary-foreground">{dish.category}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground" style={MONO}>{cs(dish.price)}</td>
                    <td className="px-4 py-3 text-foreground" style={MONO}>{cs(cost)}</td>
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
                      <div className="flex items-center gap-1">
                        <button
                          title="Ver ingredientes y costos"
                          onClick={() => setViewing(dish)}
                          className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors whitespace-nowrap"
                        >
                          <Eye size={12} /> Ver
                        </button>
                        <button
                          title="Editar platillo"
                          onClick={() => setEditing(dish)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          title="Eliminar"
                          onClick={() => onDelete(dish.id)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
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
            <span className="font-semibold text-foreground">{totalPages}</span> · {paged.length} de {filtered.length}
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

      {viewing && (
        <DishIngredientsModal dish={viewing} ingredients={ingredients} onClose={() => setViewing(null)} />
      )}
      {editing && (
        <DishEditDrawer
          dish={editing}
          ingredients={ingredients}
          onSave={(updated) => { onUpdate(updated); setEditing(null); }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
