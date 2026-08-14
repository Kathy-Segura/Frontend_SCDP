import { useEffect, useState } from "react";
import { ChefHat, X } from "lucide-react";
import { MONO } from "../styles/shared";
import { fmt, cs, clsx } from "../utils";
import { obtenerDetallePlatillo, type DetallePlatillo } from "../services/inventarioDishes.services";

// A diferencia de la versión anterior, este modal ya no recibe `ingredients`
// ni recalcula el costo en el front con dishCost()/convertToBaseUnit(): pide
// el detalle real al backend (GET /dishes-inventory/:id), que ya trae el
// costo, precio y margen calculados por las vistas de costeo.
export function DishIngredientsModal({
  dishId, dishName, onClose,
}: {
  dishId: number;
  dishName: string;
  onClose: () => void;
}) {
  const [detalle, setDetalle] = useState<DetallePlatillo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setLoading(true);
    obtenerDetallePlatillo(dishId)
      .then((d) => { if (!cancelado) setDetalle(d); })
      .catch((err) => { if (!cancelado) setError(err?.message || "No se pudo cargar el detalle."); })
      .finally(() => { if (!cancelado) setLoading(false); });
    return () => { cancelado = true; };
  }, [dishId]);

  const cost = detalle?.encabezado?.costo ?? 0;
  const price = detalle?.encabezado?.precioVenta ?? 0;
  // margenBruto/margenPct ya vienen calculados por fn_detalle_platillo — no
  // se recalculan aquí (a diferencia de la versión anterior con datos mal
  // mapeados, donde salían null y por eso se estimaban con price - cost).
  const margin = detalle?.encabezado?.margenBruto ?? 0;
  const marginPct = detalle?.encabezado?.margenPct ?? 0;
  const receta = detalle?.receta ?? [];

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
              <p className="text-base font-semibold text-foreground">{detalle?.encabezado?.nombre ?? dishName}</p>
              <p className="text-xs text-muted-foreground">
                {detalle?.encabezado?.categoria ?? "…"} · {receta.length} ingredientes
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <X size={16} />
          </button>
        </div>

        {loading && (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">Cargando…</div>
        )}
        {error && !loading && (
          <div className="px-6 py-12 text-center text-sm text-destructive">{error}</div>
        )}

        {!loading && !error && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-3 gap-0 border-b border-border shrink-0">
              {[
                { label: "Precio de venta", val: cs(price), color: "text-foreground" },
                { label: "Costo ingredientes", val: cs(cost), color: "text-foreground" },
                { label: "Margen neto", val: `${fmt(marginPct)}%`, sub: cs(margin), color: margin >= 0 ? "text-green-600" : "text-destructive" },
              ].map((k, i) => (
                <div key={k.label} className={clsx("px-5 py-3 text-center", i < 2 && "border-r border-border")}>
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">{k.label}</p>
                  <p className={clsx("text-lg font-bold", k.color)} style={MONO}>{k.val}</p>
                  {k.sub && <p className={clsx("text-xs mt-0.5", k.color)} style={MONO}>{k.sub}</p>}
                </div>
              ))}
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(200,200,200,0.3) transparent" }}>
              {receta.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-muted-foreground italic">
                  Este platillo no tiene ingredientes asignados.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0">
                    <tr className="border-b border-border bg-secondary/50">
                      {["#", "Ingrediente", "Categoría", "Cantidad", "Unidad", "Costo/unidad", "Subtotal"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {receta.map((r, idx) => {
                      const pct = cost > 0 ? (r.costoSubtotal / cost) * 100 : 0;
                      return (
                        <tr key={r.ingredienteId} className="hover:bg-secondary/20 transition-colors">
                          <td className="px-4 py-3 text-xs text-muted-foreground" style={MONO}>{String(idx + 1).padStart(2, "0")}</td>
                          <td className="px-4 py-3 font-medium text-foreground">{r.ingrediente}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-secondary text-secondary-foreground">{r.categoriaIngrediente}</span>
                          </td>
                          <td className="px-4 py-3" style={MONO}>{r.cantidad}</td>
                          <td className="px-4 py-3 text-muted-foreground">{r.unidad}</td>
                          <td className="px-4 py-3 text-muted-foreground" style={MONO}>{cs(r.costoPorUnidad)}</td>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-foreground" style={MONO}>{cs(r.costoSubtotal)}</span>
                            <span className="ml-2 text-[11px] text-muted-foreground">({fmt(pct)}%)</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-border bg-secondary/20">
                      <td colSpan={6} className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        Total costo ingredientes
                      </td>
                      <td className="px-4 py-3 font-bold text-foreground" style={MONO}>{cs(cost)}</td>
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
