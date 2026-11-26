// services/dashboard.services.ts
// Capa de servicios del módulo Dashboard. Es de solo lectura: no hay POST/
// PUT/DELETE, solo 5 GET que ya vienen agregados/ordenados/limitados desde
// el backend (vistas vw_dashboard_resumen, vw_inventario_valorizado,
// vw_dashboard_distribucion_categoria, vw_margen_platillos). El front no
// debe recalcular ni reordenar nada de esto: eso es justo lo que antes hacía
// ChartsPage.tsx localmente con `ingredients`/`dishes` de seed, y por eso se
// desincronizaba de los datos reales.

import { apiFetch } from "./apiClient";

const BASE = "/dashboard";

// --- GET /dashboard/summary --------------------------------------------------
// Las 4 cards del encabezado.
export type ResumenDashboard = {
  totalIngredientes: number;
  valorInventarioTotal: number;
  totalPlatillos: number;
  stockBajo: number;
};

export function obtenerResumenDashboard(): Promise<ResumenDashboard> {
  return apiFetch<{
    total_ingredientes: number;
    valor_inventario_total: number;
    total_platillos: number;
    stock_bajo: number;
  }>(`${BASE}/summary`).then((r) => ({
    // pg devuelve COUNT(*) como texto ("957"): se fuerza a número
    totalIngredientes: Number(r.total_ingredientes),
    valorInventarioTotal: Number(r.valor_inventario_total),
    totalPlatillos: Number(r.total_platillos),
    stockBajo: Number(r.stock_bajo),
  }));
}

// --- GET /dashboard/charts/stock-by-ingredient (?limit=) --------------------
// Gráfico de barra: stock actual por ingrediente, ya ordenado desc por
// stock_actual y limitado en el backend (LIMIT $1, default 15).
export type StockPorIngrediente = { nombre: string; stock: number; unidad: string };

export async function obtenerStockPorIngrediente(limit?: number): Promise<StockPorIngrediente[]> {
  const qs = limit ? `?limit=${limit}` : "";
  const rows = await apiFetch<{ nombre: string; stock_actual: number; unidad_medida: string }[]>(
    `${BASE}/charts/stock-by-ingredient${qs}`
  );
  return rows.map((r) => ({ nombre: r.nombre, stock: Number(r.stock_actual), unidad: r.unidad_medida }));
}

// --- GET /dashboard/charts/category-distribution -----------------------------
// Gráfico de anillo: valor de inventario por categoría de ingrediente.
export type DistribucionCategoria = {
  categoria: string;
  cantidadIngredientes: number;
  valorInventario: number;
  porcentajeDelValor: number;
};

export async function obtenerDistribucionPorCategoria(): Promise<DistribucionCategoria[]> {
  const rows = await apiFetch<
    { categoria: string; cantidad_ingredientes: number; valor_inventario: number; porcentaje_del_valor: number }[]
  >(`${BASE}/charts/category-distribution`);
  return rows.map((r) => ({
    categoria: r.categoria,
    cantidadIngredientes: r.cantidad_ingredientes,
    valorInventario: Number(r.valor_inventario),
    porcentajeDelValor: Number(r.porcentaje_del_valor),
  }));
}

// --- GET /dashboard/charts/unit-cost (?limit=) --------------------------------
// Gráfico de barra horizontal: costo unitario por ingrediente, desc, limitado.
export type CostoUnitario = { nombre: string; costo: number; unidad: string };

export async function obtenerCostoUnitario(limit?: number): Promise<CostoUnitario[]> {
  const qs = limit ? `?limit=${limit}` : "";
  const rows = await apiFetch<{ nombre: string; costo_unitario: number; unidad_medida: string }[]>(
    `${BASE}/charts/unit-cost${qs}`
  );
  return rows.map((r) => ({ nombre: r.nombre, costo: Number(r.costo_unitario), unidad: r.unidad_medida }));
}

// --- GET /dashboard/charts/margin-by-dish (?limit=) ---------------------------
// Gráfico de barras dobles: costo vs precio de venta por platillo, desc por
// margen_bruto, limitado.
export type MargenPorPlatillo = {
  platillo: string;
  costo: number;
  precioVenta: number;
  margenBruto: number;
  margenPct: number;
};

export async function obtenerMargenPorPlatillo(limit?: number): Promise<MargenPorPlatillo[]> {
  const qs = limit ? `?limit=${limit}` : "";
  const rows = await apiFetch<
    { platillo: string; costo: number; precio_venta: number; margen_bruto: number; margen_porcentaje_venta: number }[]
  >(`${BASE}/charts/margin-by-dish${qs}`);
  return rows.map((r) => ({
    platillo: r.platillo,
    costo: Number(r.costo),
    precioVenta: Number(r.precio_venta),
    margenBruto: Number(r.margen_bruto),
    margenPct: Number(r.margen_porcentaje_venta),
  }));
}
