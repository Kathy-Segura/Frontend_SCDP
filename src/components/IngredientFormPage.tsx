import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { ShoppingBasket, Plus, Check, Loader2 } from "lucide-react";
import { inputCls, selectCls, labelCls, MONO } from "../styles/shared";
import { cs, clsx } from "../utils";
import { ApiError } from "../services/apiClient";
import {
  listarCategoriasIngrediente,
  listarUnidadesMedida,
  type Categoria,
  type UnidadMedida,
} from "../services/catalogos.services";
import {
  calcularCostoUnitario,
  registrarInsumo,
  listarHistorialInsumos,
  type HistorialInsumo,
} from "../services/ingredients.services";

type FormState = {
  nombre: string;
  categoriaId: string;
  costoTotalCompra: string;
  cantidadComprada: string;
  unidadCompraId: string;
  stockInicial: string;
  stockMinimo: string;
};

const EMPTY_FORM: FormState = {
  nombre: "",
  categoriaId: "",
  costoTotalCompra: "",
  cantidadComprada: "",
  unidadCompraId: "",
  stockInicial: "",
  stockMinimo: "",
};

function apiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message || fallback;
  if (err instanceof TypeError) return "No se pudo conectar con el servidor. Verifica tu conexion a internet.";
  return fallback;
}

export function IngredientFormPage() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [unidades, setUnidades] = useState<UnidadMedida[]>([]);
  const [historial, setHistorial] = useState<HistorialInsumo[]>([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(true);
  const [loadingHistorial, setLoadingHistorial] = useState(true);

  const [costoUnitario, setCostoUnitario] = useState<number | null>(null);
  const [calculando, setCalculando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [guardadoOk, setGuardadoOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    Promise.all([listarCategoriasIngrediente(), listarUnidadesMedida()])
      .then(([cats, unis]) => {
        if (!activo) return;
        setCategorias(cats);
        setUnidades(unis);
      })
      .catch((err) => activo && setError(apiErrorMessage(err, "No se pudieron cargar categorias y unidades.")))
      .finally(() => activo && setLoadingCatalogos(false));
    cargarHistorial();
    return () => { activo = false; };
  }, []);

  function cargarHistorial() {
    setLoadingHistorial(true);
    listarHistorialInsumos()
      .then(setHistorial)
      .catch(() => { /* el historial no es critico, no bloquea el formulario */ })
      .finally(() => setLoadingHistorial(false));
  }

  function updateField(field: keyof FormState) {
    return (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = e.target.value;
      setForm((f) => ({ ...f, [field]: value }));
    };
  }

  // Calculo automatico del costo unitario: en cuanto hay costo total,
  // cantidad comprada y unidad de compra validos, se pide el costo al
  // backend (con debounce) usando la misma unidad/cantidad como "uso",
  // ya que el formulario ya no pide esos datos por separado.
  useEffect(() => {
    const total = parseFloat(form.costoTotalCompra);
    const cantidad = parseFloat(form.cantidadComprada);
    const unidadId = form.unidadCompraId;

    if (!form.costoTotalCompra || !form.cantidadComprada || !unidadId || Number.isNaN(total) || Number.isNaN(cantidad)) {
      setCostoUnitario(null);
      return;
    }

    const timeout = setTimeout(() => {
      setCalculando(true);
      setError(null);
      calcularCostoUnitario({
        costo_total_compra: total,
        cantidad_comprada: cantidad,
        unidad_compra_id: Number(unidadId),
        cantidad_uso: cantidad,
        unidad_uso_id: Number(unidadId),
      })
        .then((resultado) => {
          const costo = Number(resultado.costo_unitario);
          setCostoUnitario(Number.isNaN(costo) ? null : costo);
        })
        .catch((err) => {
          setCostoUnitario(null);
          setError(apiErrorMessage(err, "No se pudo calcular el costo unitario."));
        })
        .finally(() => setCalculando(false));
    }, 500);

    return () => clearTimeout(timeout);
  }, [form.costoTotalCompra, form.cantidadComprada, form.unidadCompraId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (calculando) {
      setError("Espera a que termine de calcularse el costo.");
      return;
    }
    if (costoUnitario === null) {
      setError("Completa costo de compra, cantidad comprada y unidad de compra.");
      return;
    }
    if (!form.nombre || !form.categoriaId) {
      setError("Falta el nombre del ingrediente o la categoria.");
      return;
    }

    setGuardando(true);
    try {
      await registrarInsumo({
        nombre_ingrediente: form.nombre,
        categoria_id: Number(form.categoriaId),
        unidad_id: Number(form.unidadCompraId),
        costo_unitario: costoUnitario,
        stock_inicial: form.stockInicial ? parseFloat(form.stockInicial) : undefined,
        stock_minimo: form.stockMinimo ? parseFloat(form.stockMinimo) : undefined,
      });
      setForm(EMPTY_FORM);
      setCostoUnitario(null);
      setGuardadoOk(true);
      setTimeout(() => setGuardadoOk(false), 2000);
      cargarHistorial();
    } catch (err) {
      setError(apiErrorMessage(err, "No se pudo guardar el ingrediente."));
    } finally {
      setGuardando(false);
    }
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
              <p className="text-xs text-muted-foreground">
                {loadingHistorial ? "Cargando historial..." : `${historial.length} registrado${historial.length !== 1 ? "s" : ""} en sistema`}
              </p>
            </div>
          </div>

          {loadingCatalogos ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
              <Loader2 size={16} className="animate-spin" /> Cargando categorias y unidades...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelCls}>Nombre del ingrediente</label>
                <input
                  className={inputCls}
                  placeholder="ej. Harina de trigo"
                  value={form.nombre}
                  onChange={updateField("nombre")}
                />
              </div>

              <div>
                <label className={labelCls}>Categoria</label>
                <select className={selectCls} value={form.categoriaId} onChange={updateField("categoriaId")}>
                  <option value="">Seleccione</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre_categoria}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Costo total de compra (C$)</label>
                  <input
                    className={inputCls}
                    type="number" min="0" step="0.01" placeholder="0.00"
                    value={form.costoTotalCompra}
                    onChange={updateField("costoTotalCompra")}
                  />
                </div>
                <div>
                  <label className={labelCls}>Cantidad comprada</label>
                  <input
                    className={inputCls}
                    type="number" min="0" step="0.01" placeholder="0"
                    value={form.cantidadComprada}
                    onChange={updateField("cantidadComprada")}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Unidad de compra</label>
                <select className={selectCls} value={form.unidadCompraId} onChange={updateField("unidadCompraId")}>
                  <option value="">Seleccione</option>
                  {unidades.map((u) => (
                    <option key={u.id} value={u.id}>{u.nombre_unidad}</option>
                  ))}
                </select>
              </div>

              {calculando && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 size={12} className="animate-spin" /> Calculando...
                </div>
              )}

              {!calculando && costoUnitario !== null && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">Total calculado</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {form.cantidadComprada} × {cs(costoUnitario)}
                    </p>
                  </div>
                  <span className="text-base font-bold text-primary" style={MONO}>
                    {cs((parseFloat(form.cantidadComprada) || 0) * costoUnitario)}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Stock inicial</label>
                  <input
                    className={inputCls}
                    type="number" min="0" step="0.1" placeholder="0"
                    value={form.stockInicial}
                    onChange={updateField("stockInicial")}
                  />
                </div>
                <div>
                  <label className={labelCls}>Stock minimo</label>
                  <input
                    className={inputCls}
                    type="number" min="0" step="0.1" placeholder="0"
                    value={form.stockMinimo}
                    onChange={updateField("stockMinimo")}
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg px-3 py-2 text-sm text-red-600 bg-red-50 border border-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={guardando || calculando || costoUnitario === null}
                className={clsx(
                  "w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-60",
                  guardadoOk
                    ? "bg-green-500 text-white"
                    : "bg-primary text-white hover:bg-primary/90 active:scale-[0.98]"
                )}
              >
                {guardando && <Loader2 size={14} className="animate-spin" />}
                {!guardando && guardadoOk && <><Check size={14} />Guardado correctamente</>}
                {!guardando && !guardadoOk && <><Plus size={14} />Agregar ingrediente</>}
              </button>
            </form>
          )}
        </div>

        {/* History panel */}
        <div className="hidden lg:flex bg-card rounded-2xl border border-border shadow-sm flex-col min-h-0 max-h-[calc(100vh-180px)]">
          <div className="px-5 py-4 border-b border-border shrink-0">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Historial reciente</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {loadingHistorial ? "Cargando..." : `${historial.length} ingrediente${historial.length !== 1 ? "s" : ""} registrado${historial.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <div
            className="flex-1 overflow-y-auto divide-y divide-border"
            style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(200,200,200,0.3) transparent" }}
          >
            {!loadingHistorial && historial.length === 0 && (
              <div className="px-5 py-10 text-center text-xs text-muted-foreground italic">
                Aun no hay ingredientes registrados.
              </div>
            )}
            {historial.map((i) => (
              <div key={i.id} className="flex items-center justify-between px-5 py-3 hover:bg-secondary/20 transition-colors">
                <div className="min-w-0 mr-2">
                  <p className="text-sm font-medium text-foreground truncate">{i.nombre}</p>
                  <p className="text-[11px] text-muted-foreground">{new Date(i.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-foreground" style={MONO}>{cs(Number(i.costo_unitario))}</p>
                  <p className="text-[11px] text-muted-foreground">Stock: {Number(i.stock_actual)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
