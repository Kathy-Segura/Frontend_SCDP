import { useState } from "react";
import { ShoppingBasket, Plus, Check } from "lucide-react";
import type { Ingredient } from "../types";
import { ING_CATEGORIES } from "../constants";
import { inputCls, selectCls, labelCls, MONO } from "../styles/shared";
import { cs, clsx } from "../utils";

export function IngredientFormPage({
  onAddIngredient, ingredients,
}: {
  onAddIngredient: (i: Omit<Ingredient, "id">) => void;
  ingredients: Ingredient[];
}) {
  const [ing, setIng] = useState({ name: "", unit: "Kilogramos", costPerUnit: "", stock: "", category: "Otros", stockmin: "" });
  const [ingOk, setIngOk] = useState(false);

  function submitIng(e: React.FormEvent) {
    e.preventDefault();
    if (!ing.name || !ing.costPerUnit || !ing.stock) return;
    onAddIngredient({
      name: ing.name,
      unit: ing.unit,
      costPerUnit: parseFloat(ing.costPerUnit),
      stock: parseFloat(ing.stock),
      category: ing.category,
    });
    setIng({ name: "", unit: "Kilogramos", costPerUnit: "", stock: "", category: "Otros", stockmin: "" });
    setIngOk(true);
    setTimeout(() => setIngOk(false), 2000);
  }

  return (
    <div className="min-h-full flex flex-col">
      <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Nuevo Insumo</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">Agrega un nuevo ingrediente al inventario.</p>
      </div>

      <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8 grid lg:grid-cols-[1fr_320px] gap-4 sm:gap-6 min-h-0 overflow-y-auto">
        {/* Form card */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm self-start">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShoppingBasket size={16} className="text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Datos del ingrediente</h2>
              <p className="text-xs text-muted-foreground">{ingredients.length} registrado{ingredients.length !== 1 ? "s" : ""} en sistema</p>
            </div>
          </div>

          <form onSubmit={submitIng} className="space-y-4">
            <div>
              <label className={labelCls}>Nombre del ingrediente</label>
              <input
                className={inputCls}
                placeholder="ej. Harina de trigo"
                value={ing.name}
                onChange={(e) => setIng({ ...ing, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Unidad de medida</label>
                <select className={selectCls} value={ing.unit} onChange={(e) => setIng({ ...ing, unit: e.target.value })}>
                  <option value="Seleccione">Seleccione</option>
                  <option value="Gramos">Gramos</option>
                  <option value="Onzas">Onzas</option>
                  <option value="Libras">Libras</option>
                  <option value="Kilogramos">Kilogramos</option>
                  <option value="Onzas fluidas">Onzas fluidas</option>
                  <option value="Mililitros">Mililitros</option>
                  <option value="Litros">Litros</option>
                  <option value="Galon">Galon</option>
                  <option value="Unidad">Unidad</option>
                  <option value="Caja">Caja</option>
                  <option value="Bolsa">Bolsa</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Categoría</label>
                <select className={selectCls} value={ing.category} onChange={(e) => setIng({ ...ing, category: e.target.value })}>
                  {ING_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Costo / Unidad (C$)</label>
                <input
                  className={inputCls}
                  type="number" min="0" step="0.01" placeholder="0.00"
                  value={ing.costPerUnit}
                  onChange={(e) => setIng({ ...ing, costPerUnit: e.target.value })}
                />
              </div>
              <div>
                <label className={labelCls}>Stock inicial</label>
                <input
                  className={inputCls}
                  type="number" min="0" step="0.1" placeholder="0"
                  value={ing.stock}
                  onChange={(e) => setIng({ ...ing, stock: e.target.value })}
                />
              </div>
              <div>
                <label className={labelCls}>Stock mínimo</label>
                <input
                  className={inputCls}
                  type="number" min="0" step="0.1" placeholder="0"
                  value={ing.stockmin}
                  onChange={(e) => setIng({ ...ing, stockmin: e.target.value })}
                />
              </div>
            </div>

            {ing.costPerUnit && ing.stock && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">Valor en inventario</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{ing.stock} {ing.unit} × {cs(parseFloat(ing.costPerUnit) || 0)}</p>
                </div>
                <span className="text-base font-bold text-primary" style={MONO}>
                  {cs((parseFloat(ing.costPerUnit) || 0) * (parseFloat(ing.stock) || 0))}
                </span>
              </div>
            )}

            <button
              type="submit"
              className={clsx(
                "w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all",
                ingOk
                  ? "bg-green-500 text-white"
                  : "bg-primary text-white hover:bg-primary/90 active:scale-[0.98]"
              )}
            >
              {ingOk ? <><Check size={14} />Guardado correctamente</> : <><Plus size={14} />Agregar ingrediente</>}
            </button>
          </form>
        </div>

        {/* History panel */}
        <div className="hidden lg:flex bg-card rounded-2xl border border-border shadow-sm flex-col min-h-0 max-h-[calc(100vh-180px)]">
          <div className="px-5 py-4 border-b border-border shrink-0">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Historial reciente</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{ingredients.length} ingrediente{ingredients.length !== 1 ? "s" : ""} registrado{ingredients.length !== 1 ? "s" : ""}</p>
          </div>
          <div
            className="flex-1 overflow-y-auto divide-y divide-border"
            style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(200,200,200,0.3) transparent" }}
          >
            {ingredients.length === 0 && (
              <div className="px-5 py-10 text-center text-xs text-muted-foreground italic">
                Aún no hay ingredientes registrados.
              </div>
            )}
            {[...ingredients].reverse().map((i) => (
              <div key={i.id} className="flex items-center justify-between px-5 py-3 hover:bg-secondary/20 transition-colors">
                <div className="min-w-0 mr-2">
                  <p className="text-sm font-medium text-foreground truncate">{i.name}</p>
                  <p className="text-[11px] text-muted-foreground">{i.category} · {i.unit}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-foreground" style={MONO}>{cs(i.costPerUnit)}</p>
                  <p className="text-[11px] text-muted-foreground">Stock: {i.stock}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
