import { ChefHat, X } from "lucide-react";
import type { Dish, Ingredient } from "../types";
import { MONO } from "../styles/shared";
import { fmt, cs, clsx, dishCost, convertToBaseUnit } from "../utils";

export function DishIngredientsModal({
  dish, ingredients, onClose,
}: {
  dish: Dish;
  ingredients: Ingredient[];
  onClose: () => void;
}) {
  const cost = dishCost(dish, ingredients);
  const margin = dish.price - cost;
  const marginPct = dish.price > 0 ? (margin / dish.price) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[3px]" />
      <div
        className="relative bg-card rounded-2xl shadow-2xl w-full max-w-2xl border border-border overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <ChefHat size={16} className="text-primary" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">{dish.name}</p>
              <p className="text-xs text-muted-foreground">{dish.category} · {(dish.ingredients ?? []).length} ingredientes</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-0 border-b border-border shrink-0">
          {[
            { label: "Precio de venta",    val: cs(dish.price), color: "text-foreground" },
            { label: "Costo ingredientes", val: cs(cost),       color: "text-foreground" },
            { label: "Margen neto",        val: `${fmt(marginPct)}%`, sub: cs(margin), color: margin >= 0 ? "text-green-600" : "text-destructive" },
          ].map((k, i) => (
            <div key={k.label} className={clsx("px-5 py-3 text-center", i < 2 && "border-r border-border")}>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">{k.label}</p>
              <p className={clsx("text-lg font-bold", k.color)} style={MONO}>{k.val}</p>
              {k.sub && <p className={clsx("text-xs mt-0.5", k.color)} style={MONO}>{k.sub}</p>}
            </div>
          ))}
        </div>

        {/* Table */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(200,200,200,0.3) transparent" }}
        >
          {(dish.ingredients ?? []).length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground italic">
              Este platillo no tiene ingredientes asignados.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0">
                <tr className="border-b border-border bg-secondary/50">
                  {["#", "Ingrediente", "Categoría", "Cantidad", "Unidad", "C$ / Unidad", "Subtotal"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(dish.ingredients ?? []).map((di, idx) => {
                  const ing = ingredients.find((i) => i.id === di.ingredientId);
                  if (!ing) return null;
                  const quantityInBaseUnit = convertToBaseUnit(di.quantity, di.selectedUnit || ing.unit, ing.unit);
                  const subtotal = ing.costPerUnit * quantityInBaseUnit;
                  const pct = cost > 0 ? (subtotal / cost) * 100 : 0;
                  const displayUnit = di.selectedUnit || ing.unit;
                  return (
                    <tr key={di.ingredientId} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3 text-xs text-muted-foreground" style={MONO}>{String(idx + 1).padStart(2, "0")}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{ing.name}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-secondary text-secondary-foreground">{ing.category}</span>
                      </td>
                      <td className="px-4 py-3" style={MONO}>{di.quantity}</td>
                      <td className="px-4 py-3 text-muted-foreground">{displayUnit}</td>
                      <td className="px-4 py-3" style={MONO}>{cs(ing.costPerUnit)}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-foreground" style={MONO}>{cs(subtotal)}</span>
                        <span className="ml-2 text-[11px] text-muted-foreground">({fmt(pct)}%)</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-secondary/20">
                  <td colSpan={6} className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Total costo ingredientes
                  </td>
                  <td className="px-4 py-3 font-bold text-foreground" style={MONO}>{cs(cost)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-secondary/10 shrink-0">
          <button onClick={onClose}
            className="w-full py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
