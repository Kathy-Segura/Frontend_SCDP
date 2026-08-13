import { useEffect, useState } from "react";
import { ChefHat, X, Loader2, AlertCircle } from "lucide-react";
import { MONO } from "../styles/shared";
import { fmt, cs, clsx } from "../utils";
import { ApiError } from "../services/apiClient";
import {
  obtenerDetallePlatillo,
  type PlatilloDetalle,
} from "../services/dishesInventory.services";

export function DishIngredientsModal({
  platilloId, onClose,
}: {
  platilloId: number;
  onClose: () => void;
}) {
  const [detalle, setDetalle] = useState<PlatilloDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    obtenerDetallePlatillo(platilloId)
      .then((data) => { if (!cancelled) setDetalle(data); })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "No se pudo cargar el detalle del platillo.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [platilloId]);

  const encabezado = detalle?.encabezado ?? null;
  const receta = detalle?.receta ?? [];
  const costo = Number(encabezado?.costo ?? 0);
  const precioVenta = Number(encabezado?.precio_venta ?? 0);
  const margen = precioVenta - costo;
  const marginPct = precioVenta > 0 ? (margen / precioVenta) * 100 : 0;

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
              <p className="text-base font-semibold text-foreground">{encabezado?.platillo ?? "Cargando…"}</p>
              <p className="text-xs text-muted-foreground">
                {encabezado ? `${encabezado.categoria} · ${receta.length} ingrediente${receta.length !== 1 ? "s" : ""}` : ""}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <X size={16} />
          </button>
        </div>

        {loading && (
          <div className="flex-1 flex items-center justify-center py-16">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 size={16} className="animate-spin" /> Cargando detalle…
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="flex-1 flex items-center justify-center py-16 px-6">
            <div className="max-w-sm text-center space-y-2">
              <AlertCircle size={20} className="mx-auto text-destructive" />
              <p className="text-sm text-foreground font-medium">No se pudo cargar</p>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-3 gap-0 border-b border-border shrink-0">
              {[
                { label: "Precio de venta", val: cs(precioVenta), color: "text-foreground" },
                { label: "Costo ingredientes", val: cs(costo), color: "text-foreground" },
                { label: "Margen neto", val: `${fmt(marginPct)}%`, sub: cs(margen), color: margen >= 0 ? "text-green-600" : "text-destructive" },
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
              {receta.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-muted-foreground italic">
                  Este platillo no tiene ingredientes asignados.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0">
                    <tr className="border-b border-border bg-secondary/50">
                      {["#", "Ingrediente", "Cantidad", "Unidad", "C$ / Unidad", "Subtotal"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {receta.map((linea, idx) => {
                      const cantidad = Number(linea.cantidad_receta);
                      const subtotal = Number(linea.costo_subtotal);
                      const costoUnitario = cantidad > 0 ? subtotal / cantidad : 0;
                      const pct = costo > 0 ? (subtotal / costo) * 100 : 0;
                      return (
                        <tr key={linea.ingrediente_id} className="hover:bg-secondary/20 transition-colors">
                          <td className="px-4 py-3 text-xs text-muted-foreground" style={MONO}>{String(idx + 1).padStart(2, "0")}</td>
                          <td className="px-4 py-3 font-medium text-foreground">{linea.ingrediente}</td>
                          <td className="px-4 py-3" style={MONO}>{cantidad}</td>
                          <td className="px-4 py-3 text-muted-foreground">{linea.unidad_receta}</td>
                          <td className="px-4 py-3" style={MONO}>{cs(costoUnitario)}</td>
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
                      <td colSpan={5} className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        Total costo ingredientes
                      </td>
                      <td className="px-4 py-3 font-bold text-foreground" style={MONO}>{cs(costo)}</td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </>
        )}

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
