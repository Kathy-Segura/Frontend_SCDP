import { useEffect, useMemo, useState } from "react";
import { ChefHat, X, Plus, Check, Loader2, AlertCircle } from "lucide-react";
import { inputCls, selectCls, labelCls, MONO } from "../styles/shared";
import { fmt, cs, clsx, convertToBaseUnit, getCompatibleUnits, setUnidadesCatalogo } from "../utils";
import { ApiError } from "../services/apiClient";
import {
  obtenerDetallePlatillo,
  listarIngredientesParaReceta,
  listarUnidadesInventario,
  agregarIngredienteAPlatillo,
  quitarIngredienteDePlatillo,
  actualizarPlatillo,
  type PlatilloDetalleEncabezado,
  type RecetaLinea,
  type IngredienteParaReceta,
} from "../services/dishesInventory.services";
import type { CategoriaInventario } from "../services/dishesInventory.services";

export function DishEditDrawer({
  platilloId, categorias, onClose, onSaved,
}: {
  platilloId: number;
  categorias: CategoriaInventario[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [encabezado, setEncabezado] = useState<PlatilloDetalleEncabezado | null>(null);
  const [receta, setReceta] = useState<RecetaLinea[]>([]);
  const [ingredientesDisponibles, setIngredientesDisponibles] = useState<IngredienteParaReceta[]>([]);

  const [name, setName] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [price, setPrice] = useState("");

  const [pickId, setPickId] = useState("");
  const [pickQty, setPickQty] = useState("");
  const [pickUnit, setPickUnit] = useState("Seleccione");
  const [addingIng, setAddingIng] = useState(false);
  const [ingError, setIngError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    Promise.all([
      obtenerDetallePlatillo(platilloId),
      listarIngredientesParaReceta(),
      listarUnidadesInventario(),
    ])
      .then(([detalle, ings, unids]) => {
        if (cancelled) return;
        setEncabezado(detalle.encabezado);
        setReceta(detalle.receta);
        setIngredientesDisponibles(ings);
        setUnidadesCatalogo(unids); // alimenta el cache que usa utils.ts
        if (detalle.encabezado) {
          setName(detalle.encabezado.platillo);
          setCategoriaId(String(detalle.encabezado.categoria_id ?? ""));
          setPrice(String(Number(detalle.encabezado.precio_venta ?? 0)));
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err instanceof ApiError ? err.message : "No se pudo cargar el platillo.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [platilloId]);

  const totalCost = receta.reduce((s, l) => s + Number(l.costo_subtotal), 0);
  const priceNum = parseFloat(price) || 0;
  const margin = priceNum - totalCost;
  const marginPct = priceNum > 0 ? (margin / priceNum) * 100 : 0;

  const available = useMemo(
    () => ingredientesDisponibles.filter((i) => !receta.find((l) => l.ingrediente_id === i.id)),
    [ingredientesDisponibles, receta]
  );

  const selectedIngrediente = ingredientesDisponibles.find((i) => i.id === parseInt(pickId));
  const compatibleUnits = selectedIngrediente ? getCompatibleUnits(selectedIngrediente.unidad) : [];

  async function addIng() {
    if (!pickId || !pickQty || parseFloat(pickQty) <= 0 || pickUnit === "Seleccione" || !selectedIngrediente) return;
    setIngError(null);
    setAddingIng(true);
    try {
      // Igual que en Crear Platillo: convertimos a la unidad base del
      // ingrediente antes de mandarla, y mandamos el unidad_id base.
      const cantidadBase = convertToBaseUnit(parseFloat(pickQty), pickUnit, selectedIngrediente.unidad);
      const resumen = await agregarIngredienteAPlatillo(platilloId, {
        ingrediente_id: selectedIngrediente.id,
        cantidad: cantidadBase,
        unidad_id: selectedIngrediente.unidad_id,
      });
      setReceta(resumen.receta);
      if (resumen.resumen) {
        setEncabezado((prev) => prev ? { ...prev, costo: resumen.resumen!.costo, precio_venta: resumen.resumen!.precio_venta } : prev);
      }
      setPickId(""); setPickQty(""); setPickUnit("Seleccione");
    } catch (err) {
      setIngError(err instanceof ApiError ? err.message : "No se pudo agregar el ingrediente.");
    } finally {
      setAddingIng(false);
    }
  }

  async function removeIng(ingredienteId: number) {
    setIngError(null);
    setRemovingId(ingredienteId);
    try {
      const resumen = await quitarIngredienteDePlatillo(platilloId, ingredienteId);
      setReceta(resumen.receta);
      if (resumen.resumen) {
        setEncabezado((prev) => prev ? { ...prev, costo: resumen.resumen!.costo, precio_venta: resumen.resumen!.precio_venta } : prev);
      }
    } catch (err) {
      setIngError(err instanceof ApiError ? err.message : "No se pudo quitar el ingrediente.");
    } finally {
      setRemovingId(null);
    }
  }

  async function save() {
    if (!name.trim()) return;
    setSaveError(null);
    setSaving(true);
    try {
      await actualizarPlatillo(platilloId, {
        nombre_platillo: name.trim(),
        categoria_id: categoriaId ? parseInt(categoriaId) : undefined,
        precio_venta: priceNum,
      });
      onSaved();
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "No se pudo guardar el platillo.");
    } finally {
      setSaving(false);
    }
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
              <p className="text-xs text-muted-foreground truncate max-w-[200px]">{encabezado?.platillo ?? "Cargando…"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <X size={16} />
          </button>
        </div>

        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 size={16} className="animate-spin" /> Cargando…
            </div>
          </div>
        )}

        {!loading && loadError && (
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="max-w-sm text-center space-y-2">
              <AlertCircle size={20} className="mx-auto text-destructive" />
              <p className="text-sm text-foreground font-medium">No se pudo cargar</p>
              <p className="text-xs text-muted-foreground">{loadError}</p>
            </div>
          </div>
        )}

        {!loading && !loadError && (
          <>
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
                    <select className={selectCls} value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
                      <option value="">Seleccione</option>
                      {categorias.map((c) => <option key={c.categoria_id} value={c.categoria_id}>{c.categoria}</option>)}
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
                    {available.map((i) => <option key={i.id} value={i.id}>{i.nombre} · {i.unidad} · {cs(Number(i.costo_unitario))}</option>)}
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <input className={inputCls} type="number" min="0" step="0.001"
                      placeholder="Cantidad" value={pickQty} onChange={(e) => setPickQty(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addIng())} />
                    <select className={selectCls} value={pickUnit} onChange={(e) => setPickUnit(e.target.value)} disabled={!pickId}>
                      <option value="Seleccione">Unidad</option>
                      {compatibleUnits.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                  <button type="button" onClick={addIng} disabled={!pickId || !pickQty || pickUnit === "Seleccione" || addingIng}
                    className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                    {addingIng ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Agregar
                  </button>
                  {ingError && (
                    <p className="text-[11px] text-destructive flex items-start gap-1">
                      <AlertCircle size={12} className="shrink-0 mt-0.5" /> {ingError}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className={labelCls}>Ingredientes del platillo ({receta.length})</label>
                {receta.length === 0 ? (
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
                        {receta.map((linea) => (
                          <tr key={linea.ingrediente_id} className="hover:bg-secondary/20 transition-colors">
                            <td className="px-3 py-2.5">
                              <p className="font-medium text-foreground text-xs">{linea.ingrediente}</p>
                            </td>
                            <td className="px-2 py-2.5 text-center">
                              <div className="flex flex-col gap-1 items-center">
                                <span className="text-xs" style={MONO}>{Number(linea.cantidad_receta)}</span>
                                <span className="text-[10px] text-muted-foreground">{linea.unidad_receta}</span>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-right text-xs font-semibold text-foreground" style={MONO}>
                              {cs(Number(linea.costo_subtotal))}
                            </td>
                            <td className="px-2 py-2.5">
                              <button onClick={() => removeIng(linea.ingrediente_id)} disabled={removingId === linea.ingrediente_id}
                                className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40">
                                {removingId === linea.ingrediente_id ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground mt-2">
                  Agregar y quitar ingredientes se guarda de inmediato. "Guardar cambios" abajo solo actualiza nombre, categoría y precio.
                </p>
              </div>
            </div>

            <div className="shrink-0 border-t border-border px-6 py-4 space-y-3 bg-secondary/20">
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: "Costo ingred.", val: cs(totalCost), color: "text-foreground" },
                  { label: "Precio venta", val: cs(priceNum), color: "text-foreground" },
                  { label: "Margen", val: `${fmt(marginPct)}%`, color: margin >= 0 ? "text-green-600" : "text-destructive" },
                ].map((s) => (
                  <div key={s.label} className="bg-card rounded-lg px-2 py-2 border border-border">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
                    <p className={clsx("text-xs font-bold mt-0.5", s.color)} style={MONO}>{s.val}</p>
                  </div>
                ))}
              </div>
              {saveError && (
                <p className="text-[11px] text-destructive flex items-start gap-1">
                  <AlertCircle size={12} className="shrink-0 mt-0.5" /> {saveError}
                </p>
              )}
              <button onClick={save} disabled={saving || !name.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Guardar cambios
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
