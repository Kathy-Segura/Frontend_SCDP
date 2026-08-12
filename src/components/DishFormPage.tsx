import { useEffect, useMemo, useState } from "react";
import { ChefHat, Plus, Check, X, Loader2, AlertCircle } from "lucide-react";
import type { DishIngredient, Ingredient } from "../types";
import { inputCls, selectCls, labelCls, MONO } from "../styles/shared";
import { cs, clsx, getCompatibleUnits, setUnidadesCatalogo } from "../utils";
import { ApiError } from "../services/apiClient";
import { listarUnidadesMedida, type UnidadMedida } from "../services/catalogos.services";
import {
  listarCategoriasPlatillo,
  listarRestaurantesPlatillo,
  listarIngredientesDisponibles,
  calcularCostoPlatillo,
  crearPlatillo,
  listarHistorialPlatillos,
  type CategoriaPlatillo,
  type RestaurantePlatillo,
  type IngredienteDisponible,
  type HistorialPlatillo,
} from "../services/dish.services";

// Factores de conversión a la unidad "ancla" de cada grupo de medida.
// Masa -> gramos, Volumen -> mililitros. "Unidad", "Caja" y "Bolsa" son
// unidades de conteo sin conversión (factor 1:1).
const UNIT_TO_GRAMOS: Record<string, number> = {
  'Gramos': 1,
  'Kilogramos': 1000,
  'Onzas': 28.3495,
  'Libras': 453.592,
};

const UNIT_TO_MILILITROS: Record<string, number> = {
  'Mililitros': 1,
  'Litros': 1000,
  'Onzas fluidas': 29.5735,
  'Galon': 3785.41,
};

// Convierte `quantity` (en `fromUnit`) a la unidad base registrada del
// ingrediente (`baseUnit`), para poder multiplicar por costPerUnit y obtener
// el costo real de la porción usada (no el costo del ingrediente completo).
function convertirAUnidadBase(quantity: number, fromUnit: string, baseUnit: string): number {
  if (!fromUnit || !baseUnit || fromUnit === baseUnit) return quantity;

  if (fromUnit in UNIT_TO_GRAMOS && baseUnit in UNIT_TO_GRAMOS) {
    return (quantity * UNIT_TO_GRAMOS[fromUnit]) / UNIT_TO_GRAMOS[baseUnit];
  }
  if (fromUnit in UNIT_TO_MILILITROS && baseUnit in UNIT_TO_MILILITROS) {
    return (quantity * UNIT_TO_MILILITROS[fromUnit]) / UNIT_TO_MILILITROS[baseUnit];
  }

  // Unidad / Caja / Bolsa u otro caso sin tabla de conversión: 1:1
  return quantity;
}

const unitLabels: Record<string, string> = {
  'Gramos': 'gr - Gramos', 'Kilogramos': 'Kilogramos', 'Onzas': 'onz - Onzas',
  'Libras': 'Libras', 'Mililitros': 'ml - Mililitros', 'Litros': 'Litros',
  'Onzas fluidas': 'onzfl - Onzas fluidas', 'Galon': 'Galón',
  'Unidad': 'und - Unidad', 'Caja': 'Caja', 'Bolsa': 'Bolsa',
};

// El backend solo da unidad_medida_id en /dishes/available-ingredients.
// Convertimos cada fila a la forma Ingredient que ya usan utils.ts
// (dishCost, convertirAUnidadBase, getCompatibleUnits) cruzando con el
// catalogo de unidades.
function mapIngredienteDisponible(
  row: IngredienteDisponible,
  unidades: UnidadMedida[]
): Ingredient {
  const unidad = unidades.find((u) => u.id === row.unidad_medida_id);
  return {
    id: row.id,
    name: row.nombre_ingrediente,
    unit: unidad?.nombre_unidad ?? "",
    unitId: row.unidad_medida_id,
    costPerUnit: Number(row.costo_unitario_actual),
    stock: 0,
    category: "",
  };
}

export function DishFormPage() {
  // --- Datos de catalogo (dropdowns) ---------------------------------------
  const [categorias, setCategorias] = useState<CategoriaPlatillo[]>([]);
  const [restaurantes, setRestaurantes] = useState<RestaurantePlatillo[]>([]);
  const [ingredientesDisponibles, setIngredientesDisponibles] = useState<IngredienteDisponible[]>([]);
  const [unidades, setUnidades] = useState<UnidadMedida[]>([]);
  const [historial, setHistorial] = useState<HistorialPlatillo[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // --- Estado del formulario ------------------------------------------------
  const [dishForm, setDishForm] = useState({ name: "", categoriaId: "", restauranteId: "", price: "" });
  const [dishIngList, setDishIngList] = useState<DishIngredient[]>([]);
  const [pickIngId, setPickIngId] = useState("");
  const [pickQty, setPickQty] = useState("");
  const [pickUnit, setPickUnit] = useState("Seleccione");

  const [dishOk, setDishOk] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // --- Costo real de la receta (backend) -------------------------------------
  const [costoBackend, setCostoBackend] = useState<number | null>(null);
  const [costLoading, setCostLoading] = useState(false);
  const [costError, setCostError] = useState<string | null>(null);

  // --- Carga inicial: catalogos + historial ----------------------------------
  useEffect(() => {
    let cancelled = false;

    async function cargarDatos() {
      setLoading(true);
      setLoadError(null);
      try {
        const [cats, rests, ings, unids, hist] = await Promise.all([
          listarCategoriasPlatillo(),
          listarRestaurantesPlatillo(),
          listarIngredientesDisponibles(),
          listarUnidadesMedida(),
          listarHistorialPlatillos(),
        ]);
        if (cancelled) return;
        setCategorias(cats);
        setRestaurantes(rests);
        setIngredientesDisponibles(ings);
        setUnidades(unids);
        setUnidadesCatalogo(unids); // alimenta el cache que usa utils.ts
        setHistorial(hist);
      } catch (err) {
        if (cancelled) return;
        setLoadError(err instanceof ApiError ? err.message : "No se pudo cargar la información del formulario.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    cargarDatos();
    return () => { cancelled = true; };
  }, []);

  const ingredientsForUi: Ingredient[] = useMemo(
    () => ingredientesDisponibles.map((row) => mapIngredienteDisponible(row, unidades)),
    [ingredientesDisponibles, unidades]
  );

  function unidadIdPorNombre(nombre: string): number | undefined {
    return unidades.find((u) => u.nombre_unidad === nombre)?.id;
  }

  function addDishIng() {
    if (!pickIngId || !pickQty || parseFloat(pickQty) <= 0 || pickUnit === "Seleccione") return;
    const id = parseInt(pickIngId);
    const unitId = unidadIdPorNombre(pickUnit);
    if (!unitId) return;

    setDishIngList((prev) => {
      const exists = prev.find((x) => x.ingredientId === id);
      const newDishIng: DishIngredient = {
        ingredientId: id,
        quantity: parseFloat(pickQty),
        selectedUnit: pickUnit,
        unitId,
      };
      if (exists) return prev.map((x) => x.ingredientId === id ? newDishIng : x);
      return [...prev, newDishIng];
    });
    setPickIngId(""); setPickQty(""); setPickUnit("Seleccione");
  }

  function removeDishIng(ingredientId: number) {
    setDishIngList((p) => p.filter((x) => x.ingredientId !== ingredientId));
  }

  // --- Costo estimado (instantáneo, en lo que responde el backend) ----------
  const dishIngCostEstimado = dishIngList.reduce((s, di) => {
    const found = ingredientsForUi.find((i) => i.id === di.ingredientId);
    if (!found) return s;
    const quantityInBaseUnit = convertirAUnidadBase(di.quantity, di.selectedUnit || found.unit, found.unit);
    return s + (found.costPerUnit * quantityInBaseUnit);
  }, 0);

  const dishIngCost = costoBackend ?? dishIngCostEstimado;

  // Recalcula el costo real de la receta en el backend cada vez que cambia
  // la lista de ingredientes (fn_calcular_costo_receta_preview via
  // POST /dishes/calculate-cost). Antes esto se quedaba solo en el estimado
  // local de utils.ts.
  useEffect(() => {
    if (dishIngList.length === 0) {
      setCostoBackend(null);
      setCostError(null);
      return;
    }
    let cancelled = false;
    setCostLoading(true);
    setCostError(null);

    const ingredientes = dishIngList.map((di) => ({
      ingrediente_id: di.ingredientId,
      cantidad: di.quantity,
      unidad_id: di.unitId!,
    }));

    calcularCostoPlatillo(ingredientes)
      .then((res) => {
        if (cancelled) return;
        setCostoBackend(Number(res.costo_total));
      })
      .catch((err) => {
        if (cancelled) return;
        setCostoBackend(null);
        setCostError(err instanceof ApiError ? err.message : "No se pudo calcular el costo de la receta.");
      })
      .finally(() => {
        if (!cancelled) setCostLoading(false);
      });

    return () => { cancelled = true; };
  }, [dishIngList]);

  const priceNum = parseFloat(dishForm.price) || 0;
  const margin = priceNum - dishIngCost;
  const marginPct = priceNum > 0 ? (margin / priceNum) * 100 : 0;
  const availableForDish = ingredientsForUi.filter((i) => !dishIngList.find((x) => x.ingredientId === i.id));

  const selectedIngredient = ingredientsForUi.find(i => i.id === parseInt(pickIngId));
  const compatibleUnits = selectedIngredient ? getCompatibleUnits(selectedIngredient.unit) : [];

  async function submitDish(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (!dishForm.name.trim() || !dishForm.price || !dishForm.restauranteId || !dishForm.categoriaId) {
      setSubmitError("Completa nombre, restaurante, categoría y precio de venta.");
      return;
    }
    if (dishIngList.length === 0) {
      setSubmitError("Agrega al menos un ingrediente a la receta.");
      return;
    }

    setSaving(true);
    try {
      await crearPlatillo({
        restaurante_id: parseInt(dishForm.restauranteId),
        nombre_platillo: dishForm.name.trim(),
        categoria_id: parseInt(dishForm.categoriaId),
        precio_venta: parseFloat(dishForm.price),
        ingredientes: dishIngList.map((di) => ({
          ingrediente_id: di.ingredientId,
          cantidad: di.quantity,
          unidad_id: di.unitId!,
        })),
      });

      setDishForm({ name: "", categoriaId: "", restauranteId: "", price: "" });
      setDishIngList([]);
      setCostoBackend(null);
      setDishOk(true);
      setTimeout(() => setDishOk(false), 2000);

      // El backend no devuelve el platillo creado: refrescamos el historial.
      const hist = await listarHistorialPlatillos();
      setHistorial(hist);
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
      } else {
        setSubmitError("No se pudo registrar el platillo. Intenta de nuevo.");
      }
    } finally {
      setSaving(false);
    }
  }

  function nombreRestaurante(id: number) {
    return restaurantes.find((r) => r.id === id)?.nombre_restaurante ?? "—";
  }

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center py-24">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 size={16} className="animate-spin" /> Cargando formulario…
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-full flex items-center justify-center py-24 px-8">
        <div className="max-w-md text-center space-y-2">
          <AlertCircle size={20} className="mx-auto text-destructive" />
          <p className="text-sm text-foreground font-medium">No se pudo cargar el formulario</p>
          <p className="text-xs text-muted-foreground">{loadError}</p>
        </div>
      </div>
    );
  }

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
              <p className="text-xs text-muted-foreground">{historial.length} registrado{historial.length !== 1 ? "s" : ""} en sistema</p>
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
                <select className={selectCls} value={dishForm.restauranteId}
                  onChange={(e) => setDishForm({ ...dishForm, restauranteId: e.target.value })}>
                  <option value="">Seleccione</option>
                  {restaurantes.map((r) => (
                    <option key={r.id} value={r.id}>{r.nombre_restaurante}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Categoría</label>
                <select className={selectCls} value={dishForm.categoriaId}
                  onChange={(e) => setDishForm({ ...dishForm, categoriaId: e.target.value })}>
                  <option value="">Seleccione</option>
                  {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre_categoria}</option>)}
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
                <select className={selectCls} value={pickIngId} onChange={(e) => { setPickIngId(e.target.value); setPickUnit("Seleccione"); }}>
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
                      <option value="Seleccione">Seleccione</option>
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
                    const found = ingredientsForUi.find((i) => i.id === di.ingredientId);
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
                            {cs(found.costPerUnit * convertirAUnidadBase(di.quantity, di.selectedUnit || found.unit, found.unit))}
                          </span>
                          <button type="button"
                            onClick={() => removeDishIng(di.ingredientId)}
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
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                      Costo ingredientes
                      {costLoading && <Loader2 size={11} className="animate-spin" />}
                    </span>
                    <span className="text-sm font-bold text-foreground" style={MONO}>{cs(dishIngCost)}</span>
                  </div>
                  {costError && (
                    <p className="text-[11px] text-destructive">{costError} (se muestra un estimado local)</p>
                  )}
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

            {submitError && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-destructive/10 text-destructive text-xs">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className={clsx(
                "w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all",
                dishOk ? "bg-green-500 text-white" : "bg-primary text-white hover:bg-primary/90 active:scale-[0.98]",
                saving && "opacity-60 cursor-not-allowed"
              )}
            >
              {saving
                ? <><Loader2 size={14} className="animate-spin" />Guardando…</>
                : dishOk
                  ? <><Check size={14} />Platillo guardado</>
                  : <><Plus size={14} />Crear platillo</>}
            </button>
          </form>
        </div>

        {/* History panel */}
        <div className="bg-card rounded-2xl border border-border shadow-sm flex flex-col min-h-0 max-h-[calc(100vh-180px)]">
          <div className="px-5 py-4 border-b border-border shrink-0">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Historial reciente</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{historial.length} platillo{historial.length !== 1 ? "s" : ""} registrado{historial.length !== 1 ? "s" : ""}</p>
          </div>
          <div
            className="flex-1 overflow-y-auto divide-y divide-border"
            style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(200,200,200,0.3) transparent" }}
          >
            {historial.length === 0 && (
              <div className="px-5 py-10 text-center text-xs text-muted-foreground italic">
                Aún no hay platillos registrados.
              </div>
            )}
            {historial.map((d) => {
              const precio = Number(d.precio_venta);
              const costo = Number(d.costo_total_ingredientes);
              const m = precio - costo;
              return (
                <div key={d.id} className="flex items-center justify-between px-5 py-3 hover:bg-secondary/20 transition-colors">
                  <div className="min-w-0 mr-2">
                    <p className="text-sm font-medium text-foreground truncate">{d.nombre}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{nombreRestaurante(d.restaurante_id)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-foreground" style={MONO}>{cs(precio)}</p>
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
