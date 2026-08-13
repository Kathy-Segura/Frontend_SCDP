import { useEffect, useState, useCallback } from "react";
import {
  obtenerResumenDashboard,
  obtenerStockPorIngrediente,
  obtenerDistribucionPorCategoria,
  obtenerCostoUnitario,
  obtenerMargenPorPlatillo,
  type ResumenDashboard,
} from "../services/dashboard.services";
import { ChartsPage } from "./ChartsPage";

// Mismo truco de acortar etiquetas largas que tenía la versión anterior de
// ChartsPage, movido acá porque ahora es un detalle de presentación del
// gráfico, no del cálculo de datos.
function acortar(nombre: string) {
  return nombre.length > 13 ? nombre.slice(0, 12) + "…" : nombre;
}

const RESUMEN_VACIO: ResumenDashboard = {
  totalIngredientes: 0,
  valorInventarioTotal: 0,
  totalPlatillos: 0,
  stockBajo: 0,
};

export function ChartsPageContainer() {
  const [resumen, setResumen] = useState<ResumenDashboard>(RESUMEN_VACIO);
  const [stockData, setStockData] = useState<{ name: string; stock: number }[]>([]);
  const [pieData, setPieData] = useState<{ name: string; value: number }[]>([]);
  const [costData, setCostData] = useState<{ name: string; costo: number }[]>([]);
  const [dishMargins, setDishMargins] = useState<{ name: string; margen: number; precio: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, stock, categorias, costo, margenes] = await Promise.all([
        obtenerResumenDashboard(),
        obtenerStockPorIngrediente(10),      // top 10, igual que antes
        obtenerDistribucionPorCategoria(),
        obtenerCostoUnitario(8),             // top 8, igual que antes
        obtenerMargenPorPlatillo(15),
      ]);

      setResumen(res);
      setStockData(stock.map((s) => ({ name: acortar(s.nombre), stock: s.stock })));
      setPieData(categorias.map((c) => ({ name: c.categoria, value: c.valorInventario })));
      setCostData(costo.map((c) => ({ name: acortar(c.nombre), costo: c.costo })));
      setDishMargins(margenes.map((m) => ({
        name: acortar(m.platillo),
        margen: m.margenBruto,
        precio: m.precioVenta,
      })));
    } catch (err: any) {
      setError(err?.message || "No se pudo cargar el dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  if (loading) {
    return <div className="p-8 text-sm text-muted-foreground">Cargando analítica…</div>;
  }

  return (
    <div>
      {error && (
        <div className="mx-4 mt-4 sm:mx-6 lg:mx-8 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}
      <ChartsPage
        resumen={resumen}
        stockData={stockData}
        pieData={pieData}
        costData={costData}
        dishMargins={dishMargins}
      />
    </div>
  );
}
