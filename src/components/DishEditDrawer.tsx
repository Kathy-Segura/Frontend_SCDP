import { useEffect, useState } from "react";
import { ChefHat, X, Plus, Check, Loader2 } from "lucide-react";
import { inputCls, selectCls, labelCls, MONO } from "../styles/shared";
import { fmt, cs, clsx } from "../utils";
import type { UnidadMedida } from "../services/catalogos.services";
import {
  obtenerDetallePlatillo,
  agregarOActualizarIngrediente,
  quitarIngrediente,
  actualizarPlatillo,
  type RecetaLineaEdicion,
  type IngredienteDisponible,
} from "../services/inventarioDishes.services";

// A diferencia de la versión anterior, este drawer YA NO acumula todos los
// cambios para un solo onSave: el backend guarda cada línea de receta al
// vuelo (POST agrega/actualiza,   DELETE quita), así que ese botón + / la X
// de cada fila llaman al backend de inmediato. "Guardar cambios" solo
// aplica a nombre / categoría / precio de venta (PUT separado).
export function DishEditDrawer({
  dishId, dishName, categorias, ingredientesDisponibles, unidades, onSaved, onClose,
}: {
  dishId: number;
  dishName: string;
  categorias: { id: number; nombre: string }[];
  ingredientesDisponibles: IngredienteDisponible[];
  unidades: UnidadMedida[];
  /** Se llama tras cualquier cambio persistido (header o receta), para que
   *  la página que contiene este drawer refresque la tabla principal. */
  onSaved: () => void;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(dishName);
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [price, setPrice] = useState("0");
  const [receta, setReceta] = useState<RecetaLineaEdicion[]>([]);
  const [costoActual, setCostoActual] = useState(0);
  const [savingHeader, setSavingHeader] = useState(false);
  const [mutandoReceta, setMutandoReceta] = useState(false);

  const [pickId, setPickId] = useState("");
  const [pickQty, setPickQty] = useState("");
  const [pickUnitId, setPickUnitId] = useState("");

  useEffect(() => {
    let cancelado = false;
    obtenerDetallePlatillo(dishId)
      .then((d) => {
        if (cancelado) return;
        setName(d.encabezado?.nombre ?? dishName);
        setCategoryId(d.encabezado?.categoriaId);
        setPrice(String(d.encabezado?.precioVenta ?? 0));
        setReceta(d.receta.map((r) => ({
          ingredienteId: r.ingredienteId, ingrediente: r.ingrediente, cantidad: r.cantidad,
          unidad: r.unidad, costoSubtotal: r.costoSubtotal,
        })));
        setCostoActual(d.encabezado?.costo ?? d.receta.reduce((s, r) => s + r.costoSubtotal, 0));
      })
      .catch((err) => { if (!cancelado) setError(err?.message || "No se pudo cargar el platillo."); })
      .finally(() => { if (!cancelado) setLoading(false); });
    return () => { cancelado = true; };
  }, [dishId]);

  const priceNum = parseFloat(price) || 0;
  const margin = priceNum - costoActual;
  const marginPct = priceNum > 0 ? (margin / priceNum) * 100 : 0;

  const yaEnReceta = new Set(receta.map((r) => r.ingredienteId));
  const disponibles = ingredientesDisponibles.filter((i) => !yaEnReceta.has(i.id));
  const ingredienteSeleccionado = ingredientesDisponibles.find((i) => i.id === Number(pickId));
  const unidadDelSeleccionado = unidades.find((u) => u.id === ingredienteSeleccionado?.unidadId);
  const unidadesCompatibles = unidadDelSeleccionado
    ? unidades.filter((u) => u.tipo_medida === unidadDelSeleccionado.tipo_medida)
    : [];

  async function agregar() {
    const ingredienteId = Number(pickId);
    const cantidad = parseFloat(pickQty);
    if (!ingredienteId || !cantidad || cantidad <= 0) return;
    setMutandoReceta(true);
    setError(null);
    try {
      const resumen = await agregarOActualizarIngrediente(dishId, {
        ingredienteId,
        cantidad,
        unidadId: pickUnitId ? Number(pickUnitId) : undefined,
      });
      setReceta(resumen.receta);
      if (resumen.resumen) setCostoActual(resumen.resumen.costo);
      setPickId(""); setPickQty(""); setPickUnitId("");
      onSaved();
    } catch (err: any) {
      setError(err?.message || "No se pudo agregar el ingrediente.");
    } finally {
      setMutandoReceta(false);
    }
  }

  async function quitar(ingredienteId: number) {
    setMutandoReceta(true);
    setError(null);
    try {
      const resumen = await quitarIngrediente(dishId, ingredienteId);
      setReceta(resumen.receta);
      if (resumen.resumen) setCostoActual(resumen.resumen.costo);
      onSaved();
    } catch (err: any) {
      setError(err?.message || "No se pudo quitar el ingrediente.");
    } finally {
      setMutandoReceta(false);
    }
  }

  async function guardarHeader() {
    if (!name.trim()) return;
    setSavingHeader(true);
    setError(null);
    try {
      await actualizarPlatillo(dishId, { nombre: name.trim(), categoriaId: categoryId, precioVenta: priceNum });
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.message || "No se pudo guardar el platillo.");
    } finally {
      setSavingHeader(false);
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
              <p className="text-xs text-muted-foreground truncate max-w-[200px]">{name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">Cargando…</div>
        ) : (
          <>
            <div
              className="flex-1 overflow-y-auto px-6 py-5 space-y-5"
              style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(200,200,200,0.3) transparent" }}
            >
              {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Nombre del platillo</label>
                  <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Categoría</label>
                    <select className={selectCls} value={categoryId ?? ""} onChange={(e) => setCategoryId(Number(e.target.value))}>
                      {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
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
                <label className={labelCls}>Agregar ingrediente <span className="normal-case font-normal text-muted-foreground">(se guarda al instante)</span></label>
                <div className="space-y-2">
                  <select className={selectCls} value={pickId}
                    onChange={(e) => {
                      setPickId(e.target.value);
                      const ing = ingredientesDisponibles.find((i) => i.id === Number(e.target.value));
                      setPickUnitId(ing ? String(ing.unidadId) : "");
                    }}>
                    <option value="">— Seleccionar ingrediente —</option>
                    {disponibles.map((i) => <option key={i.id} value={i.id}>{i.nombre} · {i.unidad} · {cs(i.costoUnitario)}</option>)}
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <input className={inputCls} type="number" min="0" step="0.001"
                      placeholder="Cantidad" value={pickQty} onChange={(e) => setPickQty(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && agregar()} />
                    <select className={selectCls} value={pickUnitId} onChange={(e) => setPickUnitId(e.target.value)} disabled={!pickId}>
                      {unidadesCompatibles.map((u) => <option key={u.id} value={u.id}>{u.nombre_unidad}</option>)}
                    </select>
                  </div>
                  <button type="button" onClick={agregar} disabled={!pickId || !pickQty || mutandoReceta}
                    className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                    {mutandoReceta ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Agregar
                  </button>
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
                        {receta.map((r) => (
                          <tr key={r.ingredienteId} className="hover:bg-secondary/20 transition-colors">
                            <td className="px-3 py-2.5">
                              <p className="font-medium text-foreground text-xs">{r.ingrediente}</p>
                            </td>
                            <td className="px-2 py-2.5 text-center">
                              <p className="text-xs" style={MONO}>{r.cantidad}</p>
                              <span className="text-[10px] text-muted-foreground">{r.unidad}</span>
                            </td>
                            <td className="px-3 py-2.5 text-right text-xs font-semibold text-foreground" style={MONO}>
                              {cs(r.costoSubtotal)}
                            </td>
                            <td className="px-2 py-2.5">
                              <button onClick={() => quitar(r.ingredienteId)} disabled={mutandoReceta}
                                className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40">
                                <X size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  La cantidad de una línea se ajusta agregando de nuevo el mismo ingrediente con la nueva cantidad.
                </p>
              </div>
            </div>

            <div className="shrink-0 border-t border-border px-6 py-4 space-y-3 bg-secondary/20">
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: "Costo ingred.", val: cs(costoActual), color: "text-foreground" },
                  { label: "Precio venta", val: cs(priceNum), color: "text-foreground" },
                  { label: "Margen", val: `${fmt(marginPct)}%`, color: margin >= 0 ? "text-green-600" : "text-destructive" },
                ].map((s) => (
                  <div key={s.label} className="bg-card rounded-lg px-2 py-2 border border-border">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
                    <p className={clsx("text-xs font-bold mt-0.5", s.color)} style={MONO}>{s.val}</p>
                  </div>
                ))}
              </div>
              <button onClick={guardarHeader} disabled={savingHeader}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60">
                {savingHeader ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Guardar cambios (nombre, categoría, precio)
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
