// services/inventarioIngredientes.services.ts
// Capa de servicios del módulo Inventario de Ingredientes.
// Traduce entre el shape que devuelve el backend (snake_case, columnas de
// vw_tabla_ingredientes / vw_cards_ingredientes vía inventarioIngredientes.
// controller.js) y el shape que usan los componentes del front (types.ts ->
// Ingredient, camelCase). No tiene JSX ni estado de React: solo fetch + mapeo.

import { apiFetch } from "./apiClient";
import type { Ingredient } from "../types";

const BASE = "/ingredients-inventory";

// --- Shape crudo que devuelve el backend ---------------------------------
type IngredienteApi = {
  id: number;
  nombre: string;
  unidad: string;
  unidad_id: number;
  categoria: string;
  categoria_id: number;
  costo_unitario: number;
  stock_actual: number;
  stock_minimo: number;
  valor_total: number;
  bajo_stock_minimo: boolean;
  activo: boolean;
  updated_at: string;
  estado: "Activo" | "Descontinuado";
};

export type ResumenInventario = {
  total_ingredientes: number;
  valor_inventario_total: number;
  stock_bajo: number;
};

// --- Mapper: fila del backend -> Ingredient (types.ts) --------------------
// Los números llegan como string desde pg en algunos drivers/columnas
// numeric; se fuerza a Number() para no arrastrar bugs de concatenación
// en la UI (ej. "10" + "5" = "105" en vez de 15).
function mapIngrediente(row: IngredienteApi): Ingredient {
  return {
    id: row.id,
    name: row.nombre,
    unit: row.unidad,
    unitId: row.unidad_id,
    costPerUnit: Number(row.costo_unitario),
    stock: Number(row.stock_actual),
    stockMinimo: row.stock_minimo != null ? Number(row.stock_minimo) : undefined,
    category: row.categoria,
    categoryId: row.categoria_id,
    valorTotal: row.valor_total != null ? Number(row.valor_total) : undefined,
    bajoStockMinimo: row.bajo_stock_minimo,
    active: row.activo,
    estado: row.estado,
  };
}

// --- GET /ingredients-inventory/summary -----------------------------------
// Cards del dashboard (total activos, valor de inventario, stock bajo).
export function obtenerResumenInventario(): Promise<ResumenInventario> {
  return apiFetch<ResumenInventario>(`${BASE}/summary`);
}

// --- GET /ingredients-inventory (?search=&categoria_id=) ------------------
// Tabla principal. Los filtros son opcionales.
export async function listarInventario(filtros?: {
  search?: string;
  categoriaId?: number;
}): Promise<Ingredient[]> {
  const params = new URLSearchParams();
  if (filtros?.search) params.set("search", filtros.search);
  if (filtros?.categoriaId) params.set("categoria_id", String(filtros.categoriaId));
  const qs = params.toString();

  const rows = await apiFetch<IngredienteApi[]>(`${BASE}${qs ? `?${qs}` : ""}`);
  return rows.map(mapIngrediente);
}

// --- PUT /ingredients-inventory/:id ----------------------------------------
// Único endpoint para editar nombre, categoría, unidad, costo y/o stock.
// Todos los campos son opcionales: lo que no se manda, el backend no lo toca
// (sp_actualizar_ingrediente). OJO: van categoriaId/unidadId (los IDs reales
// del catálogo), no los nombres que se muestran en la tabla.
export type ActualizarIngredientePayload = {
  nombre?: string;
  categoriaId?: number;
  unidadId?: number;
  costoUnitario?: number;
  stock?: number;
  /** Motivo del ajuste de stock, va al kardex (sp_ajustar_stock). Si se omite,
   *  el backend usa 'Ajuste manual desde módulo Ingredientes'. */
  motivoAjusteStock?: string;
};

export async function actualizarIngrediente(
  id: number,
  cambios: ActualizarIngredientePayload
): Promise<void> {
  await apiFetch<void>(`${BASE}/${id}`, {
    method: "PUT",
    body: {
      nombre: cambios.nombre,
      categoria_id: cambios.categoriaId,
      unidad_id: cambios.unidadId,
      costo_unitario: cambios.costoUnitario,
      stock: cambios.stock,
      motivo_ajuste_stock: cambios.motivoAjusteStock,
    },
  });
}

// --- DELETE /ingredients-inventory/:id -------------------------------------
// Botón "Eliminar": baja lógica automática si está en uso en algún platillo,
// baja física si nunca se usó.
export async function eliminarIngrediente(id: number): Promise<void> {
  await apiFetch<void>(`${BASE}/${id}`, { method: "DELETE" });
}

// --- PUT /ingredients-inventory/:id/reactivate ------------------------------
// Botón "Reactivar": solo válido si el ingrediente está Descontinuado.
export async function reactivarIngrediente(id: number): Promise<void> {
  await apiFetch<void>(`${BASE}/${id}/reactivate`, { method: "PUT" });
}
