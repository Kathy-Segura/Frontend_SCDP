import { useState } from "react";
import { ChefHat, Plus, Check, X } from "lucide-react";
import type { Dish, DishIngredient, Ingredient } from "../types";
import { DISH_CATEGORIES } from "../constants";
import { inputCls, selectCls, labelCls, MONO } from "../styles/shared";
import { cs, clsx, dishCost, getCompatibleUnits, convertToBaseUnit } from "../utils";

export function DishFormPage({
  onAddDish, ingredients, dishes,
}: {
  onAddDish: (d: Omit<Dish, "id">) => void;
  ingredients: Ingredient[];
  dishes: Dish[];
}) {
  const [dishForm, setDishForm] = useState({ name: "", category: "Seleccione", price: "" });
  const [dishIngList, setDishIngList] = useState<DishIngredient[]>([]);
  const [pickIngId, setPickIngId] = useState("");
  const [pickQty, setPickQty] = useState("");
  const [dishOk, setDishOk] = useState(false);
  const [pickUnit, setPickUnit] = useState("Seleccione");
  const [pickRest, setPickRest] = useState("Seleccione");

  function addDishIng() {
    if (!pickIngId || !pickQty || parseFloat(pickQty) <= 0 || pickUnit === "Seleccione") return;
    const id = parseInt(pickIngId);
    setDishIngList((prev) => {
      const exists = prev.find((x) => x.ingredientId === id);
      const newDishIng: DishIngredient = {
        ingredientId: id,
        quantity: parseFloat(pickQty),
        selectedUnit: pickUnit,
      };
      if (exists) return prev.map((x) => x.ingredientId === id ? newDishIng : x);
      return [...prev, newDishIng];
    });
    setPickIngId(""); setPickQty(""); setPickUnit("Seleccione");
  }

  function submitDish(e: React.FormEvent) {
    e.preventDefault();
    if (!dishForm.name || !dishForm.price) return;
    onAddDish({ name: dishForm.name, category: dishForm.category, price: parseFloat(dishForm.price), ingredients: dishIngList });
    setDishForm({ name: "", category: "Seleccione", price: "" });
    setDishIngList([]);
    setDishOk(true);
    setTimeout(() => setDishOk(false), 2000);
  }

  const dishIngCost = dishIngList.reduce((s, di) => {
    const found = ingredients.find((i) => i.id === di.ingredientId);
    if (!found) return s;
    const quantityInBaseUnit = convertToBaseUnit(di.quantity, di.selectedUnit || found.unit, found.unit);
    return s + (found.costPerUnit * quantityInBaseUnit);
  }, 0);

  const priceNum = parseFloat(dishForm.price) || 0;
  const margin = priceNum - dishIngCost;
  const marginPct = priceNum > 0 ? (margin / priceNum) * 100 : 0;
  const availableForDish = ingredients.filter((i) => !dishIngList.find((x) => x.ingredientId === i.id));

  const selectedIngredient = ingredients.find(i => i.id === parseInt(pickIngId));
  const compatibleUnits = selectedIngredient ? getCompatibleUnits(selectedIngredient.unit) : [];

  const unitLabels: Record<string, string> = {
    'Gramos': 'gr - Gramos', 'Kilogramos': 'Kilogramos', 'Onzas': 'onz - Onzas',
    'Libras': 'Libras', 'Mililitros': 'ml - Mililitros', 'Litros': 'Litros',
    'Onzas fluidas': 'onzfl - Onzas fluidas', 'Galon': 'Galón',
    'Unidad': 'und - Unidad', 'Caja': 'Caja', 'Bolsa': 'Bolsa',
  };

  const rest = [
    { value: "select", label: "Seleccione" },
    { value: "aji", label: "Ají" },
    { value: "df", label: "Df" },
    { value: "fritoni", label: "Fritoni" },
    { value: "bario", label: "Barrio Café" },
    { value: "barriols", label: "Barrio Café LS" },
    { value: "laconten", label: "La Contentera" },
  ];

  return (
    <div className="min-h-full flex flex-col">
      <div className="px-8 pt-8 pb-4">
        <h1 className="text-2xl font-semibold text-foreground">Crear Platillo</h1>
        <p className="text-sm text-muted-foreground mt-1">Crea un platillo y asígnale sus ingredientes con cantidades.</p>
      </div>

      <div className="flex-1 px-8 pb-8 grid lg:grid-cols-[1fr_320px] gap-6 min-h-0">
        {/* Form card */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm self-start">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <ChefHat size={16} className="text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Datos del platillo</h2>
              <p className="text-xs text-muted-foreground">{dishes.length} registrado{dishes.length !== 1 ? "s" : ""} en sistema</p>
            </div>
          </div>

          <form onSubmit={submitDish} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Nombre del platillo</label>
                <input
                  className={inputCls}
                  placeholder="ej. Pizza Margherita"
                  value={dishForm.name}
                  onChange={(e) => setDishForm({ ...dishForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className={labelCls}>Restaurante</label>
                <select className={selectCls} value={pickRest} onChange={(e) => setPickRest(e.target.value)}>
                  {rest.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Categoría</label>
                <select className={selectCls} value={dishForm.category}
                  onChange={(e) => setDishForm({ ...dishForm, category: e.target.value })}>
                  {DISH_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Precio de venta (C$)</label>
                <input
                  className={inputCls}
                  type="number" min="0" step="0.01" placeholder="0.00"
                  value={dishForm.price}
                  onChange={(e) => setDishForm({ ...dishForm, price: e.target.value })}
                />
              </div>
            </div>

            {/* Ingredient adder */}
            <div>
              <label className={labelCls}>Asociar ingrediente</label>
              <div className="space-y-2">
                <select className={selectCls} value={pickIngId} onChange={(e) => setPickIngId(e.target.value)}>
                  <option value="">— Seleccionar ingrediente —</option>
                  {availableForDish.map((i) => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
                <div className="grid grid-cols-3 gap-3 items-end">
                  <div>
                    <input
                      className={clsx(inputCls, "w-full")}
                      type="number" min="0" step="0.001" placeholder="Cantidad"
                      value={pickQty}
                      onChange={(e) => setPickQty(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDishIng())}
                    />
                  </div>
                  <div>
                    <select
                      className={clsx(inputCls, "w-full")}
                      value={pickUnit}
                      onChange={(e) => setPickUnit(e.target.value)}
                      disabled={!selectedIngredient}
                    >
                      <option value="Seleccione">Unidad</option>
                      {compatibleUnits.map((unit) => (
                        <option key={unit} value={unit}>{unitLabels[unit] || unit}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <button
                      type="button" onClick={addDishIng}
                      disabled={!pickIngId || !pickQty}
                      className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                    >
                      <Plus size={14} /> Agregar
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Ingredient list */}
            {dishIngList.length > 0 && (
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="bg-secondary/50 px-3 py-2 flex justify-between items-center border-b border-border">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Ingredientes añadidos</span>
                  <span className="text-[11px] text-muted-foreground">{dishIngList.length} ítem(s)</span>
                </div>
                <div className="divide-y divide-border">
                  {dishIngList.map((di) => {
                    const found = ingredients.find((i) => i.id === di.ingredientId);
                    if (!found) return null;
                    const displayUnit = di.selectedUnit || found.unit;
                    const unitLabel = unitLabels[displayUnit] || displayUnit;
                    return (
                      <div key={di.ingredientId} className="flex items-center justify-between px-3 py-2.5 hover:bg-secondary/20 transition-colors">
                        <div>
                          <p className="text-sm font-medium text-foreground">{found.name}</p>
                          <p className="text-xs text-muted-foreground">{di.quantity} {unitLabel}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-foreground" style={MONO}>
                            {cs(found.costPerUnit * convertToBaseUnit(di.quantity, di.selectedUnit || found.unit, found.unit))}
                          </span>
                          <button type="button"
                            onClick={() => setDishIngList((p) => p.filter((x) => x.ingredientId !== di.ingredientId))}
                            className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="px-3 py-3 bg-secondary/20 border-t border-border space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Costo ingredientes</span>
                    <span className="text-sm font-bold text-foreground" style={MONO}>{cs(dishIngCost)}</span>
                  </div>
                  {priceNum > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Margen estimado</span>
                      <span className={clsx("text-sm font-bold", margin >= 0 ? "text-green-600" : "text-destructive")} style={MONO}>
                        {cs(margin)} ({marginPct.toFixed(1)}%)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              className={clsx(
                "w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all",
                dishOk ? "bg-green-500 text-white" : "bg-primary text-white hover:bg-primary/90 active:scale-[0.98]"
              )}
            >
              {dishOk ? <><Check size={14} />Platillo guardado</> : <><Plus size={14} />Crear platillo</>}
            </button>
          </form>
        </div>

        {/* History panel */}
        <div className="bg-card rounded-2xl border border-border shadow-sm flex flex-col min-h-0 max-h-[calc(100vh-180px)]">
          <div className="px-5 py-4 border-b border-border shrink-0">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Historial reciente</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{dishes.length} platillo{dishes.length !== 1 ? "s" : ""} registrado{dishes.length !== 1 ? "s" : ""}</p>
          </div>
          <div
            className="flex-1 overflow-y-auto divide-y divide-border"
            style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(200,200,200,0.3) transparent" }}
          >
            {dishes.length === 0 && (
              <div className="px-5 py-10 text-center text-xs text-muted-foreground italic">
                Aún no hay platillos registrados.
              </div>
            )}
            {[...dishes].reverse().map((d) => {
              const cost = dishCost(d, ingredients);
              const m = d.price - cost;
              return (
                <div key={d.id} className="flex items-center justify-between px-5 py-3 hover:bg-secondary/20 transition-colors">
                  <div className="min-w-0 mr-2">
                    <p className="text-sm font-medium text-foreground truncate">{d.name}</p>
                    <p className="text-[11px] text-muted-foreground">{d.category} · {(d.ingredients ?? []).length} ing.</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-foreground" style={MONO}>{cs(d.price)}</p>
                    <p className={clsx("text-[11px]", m >= 0 ? "text-green-600" : "text-destructive")} style={MONO}>
                      Mg: {cs(m)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
