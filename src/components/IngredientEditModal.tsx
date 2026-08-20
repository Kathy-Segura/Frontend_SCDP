import { useState } from "react";
import { ShoppingBasket, X, Check } from "lucide-react";
import type { Ingredient } from "../types";
import type { Categoria, UnidadMedida } from "../services/catalogos.services";
import { inputCls, selectCls, labelCls, MONO } from "../styles/shared";
import { cs } from "../utils";

export function IngredientEditModal({
  ingredient, categorias, unidades, onSave, onClose,
}: {
  ingredient: Ingredient;
  categorias: Categoria[];
  unidades: UnidadMedida[];
  onSave: (updated: Ingredient) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ ...ingredient });

  const unidadActual = unidades.find((u) => u.id === ingredient.unitId);
  const unidadesCompatibles = unidadActual
    ? unidades.filter((u) => u.tipo_medida === unidadActual.tipo_medida)
    : unidades;

  function save() {
    if (!form.name.trim()) return;
    onSave({
      ...form,
      costPerUnit: Number(form.costPerUnit) || 0,
      stock: Number(form.stock) || 0,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[3px]" />
      <div
        className="relative bg-card rounded-2xl shadow-2xl w-full max-w-md border border-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShoppingBasket size={15} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Editar ingrediente</p>
              <p className="text-xs text-muted-foreground truncate max-w-[200px]">{ingredient.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className={labelCls}>Nombre</label>
            <input className={inputCls} value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Unidad</label>
              <select
                className={selectCls}
                value={form.unitId ?? ""}
                onChange={(e) => {
                  const u = unidades.find((x) => x.id === Number(e.target.value));
                  if (!u) return;
                  setForm({ ...form, unitId: u.id, unit: u.nombre_unidad });
                }}
              >
                {unidadesCompatibles.map((u) => (
                  <option key={u.id} value={u.id}>{u.nombre_unidad}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Categoría</label>
              <select
                className={selectCls}
                value={form.categoryId ?? ""}
                onChange={(e) => {
                  const c = categorias.find((x) => x.id === Number(e.target.value));
                  if (!c) return;
                  setForm({ ...form, categoryId: c.id, category: c.nombre_categoria });
                }}
              >
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre_categoria}</option>
                ))}
              </select>
            </div>
          </div>
         <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Costo / Unidad (C$)</label>
          <input className={inputCls} type="number" min="0" step="0.01"
            value={Number.isNaN(form.costPerUnit) ? "" : form.costPerUnit}
            onFocus={(e) => e.target.select()}
            onMouseUp={(e) => e.preventDefault()}
            onChange={(e) =>
              setForm({
                ...form,
                costPerUnit: e.target.value === "" ? NaN : parseFloat(e.target.value),
              })
            }
          />
        </div>
          <div>
            <label className={labelCls}>Stock</label>
            <input className={inputCls} type="number" min="0" step="0.1"
              value={Number.isNaN(form.stock) ? "" : form.stock}
              onFocus={(e) => e.target.select()}
              onMouseUp={(e) => e.preventDefault()}
              onChange={(e) =>
                setForm({
                  ...form,
                  stock: e.target.value === "" ? NaN : parseFloat(e.target.value),
                })
              }
            />
          </div>
        </div>

      <div className="bg-secondary/40 rounded-xl p-3 flex items-center justify-between border border-border">
        <span className="text-xs text-muted-foreground">Valor en inventario</span>
        <span className="text-sm font-bold text-foreground" style={MONO}>
          {cs((form.costPerUnit || 0) * (form.stock || 0))}
        </span>
      </div>
        </div>
        
        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            Cancelar
          </button>
          <button onClick={save}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all">
            <Check size={14} />Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}
