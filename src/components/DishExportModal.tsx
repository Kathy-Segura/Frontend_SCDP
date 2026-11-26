import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Loader2, X } from "lucide-react";
import {
  ORDENES_REPORTE,
  LIMITE_MAXIMO_REPORTE,
  type FormatoReporte,
  type OrdenReporte,
} from "../services/inventarioDishes.services";

const OPCIONES_FILAS = ["todas", "10", "25", "50", "100", "personalizado"] as const;
type OpcionFilas = (typeof OPCIONES_FILAS)[number];
import type { RestaurantePlatillo } from "../services/dish.services";

// Modal del botón "Exportar" (presentacional). La descarga real la hace
// DishesPageContainer vía onDownload; aquí solo se arman los filtros extra.
// Búsqueda y categoría NO se eligen aquí: son los filtros que ya tiene la tabla.
export function DishExportModal({
  search, categoriaNombre, restaurantes, restaurantesError, onDownload, onClose,
}: {
  search: string;
  categoriaNombre: string | null;
  /** null mientras se cargan */
  restaurantes: RestaurantePlatillo[] | null;
  restaurantesError: string | null;
  onDownload: (
    formato: FormatoReporte,
    extra: { restauranteId?: number; margenMax?: number; orden?: OrdenReporte; limite?: number }
  ) => Promise<void>;
  onClose: () => void;
}) {
  const [restauranteId, setRestauranteId] = useState<number | "todos">("todos");
  const [margenMax, setMargenMax] = useState("");
  const [descargando, setDescargando] = useState<FormatoReporte | null>(null);
  const [error, setError] = useState<string | null>(null);

  const margenTexto = margenMax.trim();
  const margenNumero = margenTexto === "" ? undefined : Number(margenTexto);
  const margenInvalido = margenNumero !== undefined && !Number.isFinite(margenNumero);

  const [orden, setOrden] = useState<OrdenReporte | "tabla">("tabla");
  const [opcionFilas, setOpcionFilas] = useState<OpcionFilas>("todas");
  const [filasPersonalizadas, setFilasPersonalizadas] = useState("");

  const limite =
    opcionFilas === "todas" ? undefined
    : opcionFilas === "personalizado" ? (filasPersonalizadas.trim() === "" ? NaN : Number(filasPersonalizadas))
    : Number(opcionFilas);
  const limiteInvalido =
    limite !== undefined && (!Number.isInteger(limite) || limite < 1 || limite > LIMITE_MAXIMO_REPORTE);

  const invalido = margenInvalido || limiteInvalido;

  async function descargar(formato: FormatoReporte) {
    if (invalido || descargando) return;
    setError(null);
    setDescargando(formato);
    try {
      await onDownload(formato, {
        restauranteId: restauranteId === "todos" ? undefined : restauranteId,
        margenMax: margenNumero,
        orden: orden === "tabla" ? undefined : orden,
        limite,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "No se pudo generar el reporte.");
    } finally {
      setDescargando(null);
    }
  }

  const filtrosTabla = [
    search.trim() ? `Búsqueda: "${search.trim()}"` : null,
    categoriaNombre ? `Categoría: ${categoriaNombre}` : null,
  ].filter(Boolean) as string[];

  const inputClass =
    "w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => !descargando && onClose()}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[3px]" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-title"
        className="relative bg-card rounded-2xl shadow-2xl w-full max-w-md border border-border max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Download size={16} className="text-primary" />
            </div>
            <div>
              <p id="export-title" className="text-base font-semibold text-foreground">Exportar platillos</p>
              <p className="text-xs text-muted-foreground">Solo se incluyen platillos activos.</p>
            </div>
          </div>
          <button onClick={onClose} disabled={!!descargando} aria-label="Cerrar"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Filtros que ya tiene la tabla */}
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">Filtros de la tabla</p>
            {filtrosTabla.length ? (
              <div className="flex flex-wrap gap-1.5">
                {filtrosTabla.map((f) => (
                  <span key={f} className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-secondary text-secondary-foreground">{f}</span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Ninguno (todos los platillos activos)</p>
            )}
          </div>

          {/* Restaurante */}
          <div>
            <label htmlFor="export-restaurante" className="block text-sm font-medium text-foreground mb-1.5">Restaurante</label>
            <select
              id="export-restaurante"
              value={restauranteId}
              disabled={restaurantes === null || !!restaurantesError}
              onChange={(e) => setRestauranteId(e.target.value === "todos" ? "todos" : Number(e.target.value))}
              className={`${inputClass} cursor-pointer disabled:opacity-60`}
            >
              <option value="todos">{restaurantes === null && !restaurantesError ? "Cargando…" : "Todos"}</option>
              {(restaurantes ?? []).map((r) => (
                <option key={r.id} value={r.id}>{r.nombre_restaurante}</option>
              ))}
            </select>
            {restaurantesError && (
              <p className="text-xs text-destructive mt-1">{restaurantesError} Se exportarán todos los restaurantes.</p>
            )}
          </div>

          {/* Margen máximo */}
          <div>
            <label htmlFor="export-margen" className="block text-sm font-medium text-foreground mb-1.5">
              % M/costo máximo <span className="font-normal text-muted-foreground">(opcional)</span>
            </label>
            <input
              id="export-margen"
              type="number"
              inputMode="decimal"
              step="any"
              placeholder="Ej. 150"
              value={margenMax}
              onChange={(e) => setMargenMax(e.target.value)}
              className={inputClass}
            />
            <p className={`text-xs mt-1 ${margenInvalido ? "text-destructive" : "text-muted-foreground"}`}>
              {margenInvalido
                ? "Ingresa un número válido."
                : "Solo platillos con %M sobre costo menor o igual a este valor. Vacío = sin límite."}
            </p>
          </div>

          {/* Orden y cantidad de filas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="export-orden" className="block text-sm font-medium text-foreground mb-1.5">Ordenar por</label>
              <select
                id="export-orden"
                value={orden}
                onChange={(e) => setOrden(e.target.value as OrdenReporte | "tabla")}
                className={`${inputClass} cursor-pointer`}
              >
                <option value="tabla">Como en la tabla</option>
                {ORDENES_REPORTE.map((o) => (
                  <option key={o.valor} value={o.valor}>{o.etiqueta}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="export-filas" className="block text-sm font-medium text-foreground mb-1.5">Cantidad de filas</label>
              <select
                id="export-filas"
                value={opcionFilas}
                onChange={(e) => setOpcionFilas(e.target.value as OpcionFilas)}
                className={`${inputClass} cursor-pointer`}
              >
                <option value="todas">Todas</option>
                <option value="10">Primeras 10</option>
                <option value="25">Primeras 25</option>
                <option value="50">Primeras 50</option>
                <option value="100">Primeras 100</option>
                <option value="personalizado">Personalizado…</option>
              </select>
            </div>
          </div>
          {opcionFilas === "personalizado" && (
            <div>
              <label htmlFor="export-filas-num" className="block text-sm font-medium text-foreground mb-1.5">Número de filas</label>
              <input
                id="export-filas-num"
                type="number"
                inputMode="numeric"
                min={1}
                max={LIMITE_MAXIMO_REPORTE}
                step={1}
                placeholder="Ej. 30"
                value={filasPersonalizadas}
                onChange={(e) => setFilasPersonalizadas(e.target.value)}
                className={inputClass}
              />
            </div>
          )}
          <p className={`text-xs -mt-2 ${limiteInvalido ? "text-destructive" : "text-muted-foreground"}`}>
            {limiteInvalido
              ? `Ingresa un número entero entre 1 y ${LIMITE_MAXIMO_REPORTE.toLocaleString("en-US")}.`
              : "El límite se aplica después de filtrar y ordenar (ej. los 10 menos rentables)."}
          </p>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
          )}
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button onClick={() => descargar("pdf")} disabled={!!descargando || invalido}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-secondary active:scale-[0.98] transition-all disabled:opacity-60">
            {descargando === "pdf" ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} className="text-red-600" />}
            PDF
          </button>
          <button onClick={() => descargar("xlsx")} disabled={!!descargando || invalido}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60">
            {descargando === "xlsx" ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
            Excel
          </button>
        </div>
      </div>
    </div>
  );
}
