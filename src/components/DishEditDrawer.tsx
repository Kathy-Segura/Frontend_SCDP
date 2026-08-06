import { useState } from "react";
import { ChefHat, X, Plus, Check } from "lucide-react";
import type { Dish, DishIngredient, Ingredient } from "../types";
import { DISH_CATEGORIES } from "../constants";
import { inputCls, selectCls, labelCls, MONO } from "../styles/shared";
import { fmt, cs, clsx, convertToBaseUnit, dishCost, getCompatibleUnits } from "../utils";

export function DishEditDrawer({
  dish, ingredients, onSave, onClose,
}: {
  dish: Dish;
  ingredients: Ingredient[];
  onSave: (updated: Dish) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(dish.name);
  const [category, setCategory] = useState(dish.category);
  const [price, setPrice] = useState(String(dish.price));
  const [ingList, setIngList] = useState<DishIngredient[]>([...(dish.ingredients ?? [])]);
  const [pickId, setPickId] = useState("");
  const [pickQty, setPickQty] = useState("");
  const [pickUnit, setPickUnit] = useState("Seleccione");

  const totalCost = ingList.reduce((s, di) => {
    const ing = ingredients.find((i) => i.id === di.ingredientId);
    if (!ing) return s;
    const quantityInBaseUnit = convertToBaseUnit(di.quantity, di.selectedUnit || ing.unit, ing.unit);
    return s + (ing.costPerUnit * quantityInBaseUnit);
  }, 0);
  const priceNum = parseFloat(price) || 0;
  const margin = priceNum - totalCost;
  const marginPct = priceNum > 0 ? (margin / priceNum) * 100 : 0;
  const available = ingredients.filter((i) => !ingList.find((x) => x.ingredientId === i.id));

  function addIng() {
    if (!pickId || !pickQty || parseFloat(pickQty) <= 0 || pickUnit === "Seleccione") return;
    const id = parseInt(pickId);
    setIngList((prev) => {
      const newDishIng: DishIngredient = {
        ingredientId: id,
        quantity: parseFloat(pickQty),
        selectedUnit: pickUnit,
      };
      const exists = prev.find((x) => x.ingredientId === id);
      if (exists) return prev.map((x) => x.ingredientId === id ? newDishIng : x);
      return [...prev, newDishIng];
    });
    setPickId(""); setPickQty(""); setPickUnit("Seleccione");
  }

  function save() {
    if (!name.trim()) return;
    onSave({ ...dish, name: name.trim(), category, price: priceNum, ingredients: ingList });
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end items-start pt-4 pr-4 pb-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      <div
        className="relative w-full max-w-md h-full bg-card shadow-2xl flex flex-col rounded-2xl overflow-hidden"
        style={{ border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <ChefHat size={15} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Editar platillo</p>
              <p className="text-xs text-muted-foreground truncate max-w-[200px]">{dish.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <X size={16} />
          </button>
        </div>

        <div
          className="flex-1 overflow-y-auto px-6 py-5 space-y-5"
          style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(200,200,200,0.3) transparent" }}
        >
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Nombre del platillo</label>
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Categoría</label>
                <select className={selectCls} value={category} onChange={(e) => setCategory(e.target.value)}>
                  {DISH_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Precio venta (C$)</label>
                <input className={inputCls} type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="border-t border-border" />

          <div>
            <label className={labelCls}>Agregar ingrediente</label>
            <div className="space-y-2">
              <select className={selectCls} value={pickId} onChange={(e) => { setPickId(e.target.value); setPickUnit("Seleccione"); }}>
                <option value="">— Seleccionar ingrediente —</option>
                {available.map((i) => <option key={i.id} value={i.id}>{i.name} · {i.unit} · {cs(i.costPerUnit)}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input className={inputCls} type="number" min="0" step="0.001"
                  placeholder="Cantidad" value={pickQty} onChange={(e) => setPickQty(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addIng()} />
                <select className={selectCls} value={pickUnit} onChange={(e) => setPickUnit(e.target.value)} disabled={!pickId}>
                  <option value="Seleccione">Unidad</option>
                  {pickId && getCompatibleUnits(ingredients.find((i) => i.id === parseInt(pickId))?.unit || "").map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
              <button type="button" onClick={addIng} disabled={!pickId || !pickQty || pickUnit === "Seleccione"}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                <Plus size={14} /> Agregar
              </button>
            </div>
          </div>

          <div>
            <label className={labelCls}>Ingredientes del platillo ({ingList.length})</label>
            {ingList.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-4 text-center border border-dashed border-border rounded-xl">
                Sin ingredientes asignados.
              </p>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-secondary/40 border-b border-border">
                      <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-3 py-2">Ingrediente</th>
                      <th className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-2">Cant.</th>
                      <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-3 py-2">Costo</th>
                      <th className="px-2 py-2 w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {ingList.map((di) => {
                      const ing = ingredients.find((i) => i.id === di.ingredientId);
                      if (!ing) return null;
                      const displayUnit = di.selectedUnit || ing.unit;
                      const quantityInBaseUnit = convertToBaseUnit(di.quantity, displayUnit, ing.unit);
                      const cost = ing.costPerUnit * quantityInBaseUnit;
                      return (
                        <tr key={di.ingredientId} className="hover:bg-secondary/20 transition-colors">
                          <td className="px-3 py-2.5">
                            <p className="font-medium text-foreground text-xs">{ing.name}</p>
                            <p className="text-[11px] text-muted-foreground">{cs(ing.costPerUnit)}/{ing.unit}</p>
                          </td>
                          <td className="px-2 py-2.5 text-center">
                            <div className="flex flex-col gap-1">
                              <input type="number" min="0" step="0.001" value={di.quantity}
                                onChange={(e) => {
                                  const q = parseFloat(e.target.value) || 0;
                                  setIngList((p) => p.map((x) => x.ingredientId === di.ingredientId ? { ...x, quantity: q } : x));
                                }}
                                className="w-16 text-center rounded-md border border-border bg-input-background px-1.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                                style={MONO} />
                              <span className="text-[10px] text-muted-foreground">{displayUnit}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-right text-xs font-semibold text-foreground" style={MONO}>
                            {cs(cost)}
                          </td>
                          <td className="px-2 py-2.5">
                            <button onClick={() => setIngList((p) => p.filter((x) => x.ingredientId !== di.ingredientId))}
                              className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                              <X size={12} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-border px-6 py-4 space-y-3 bg-secondary/20">
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: "Costo ingred.", val: cs(totalCost),        color: "text-foreground" },
              { label: "Precio venta",  val: cs(priceNum),         color: "text-foreground" },
              { label: "Margen",        val: `${fmt(marginPct)}%`, color: margin >= 0 ? "text-green-600" : "text-destructive" },
            ].map((s) => (
              <div key={s.label} className="bg-card rounded-lg px-2 py-2 border border-border">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
                <p className={clsx("text-xs font-bold mt-0.5", s.color)} style={MONO}>{s.val}</p>
              </div>
            ))}
          </div>
          <button onClick={save}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all">
            <Check size={14} />Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}
