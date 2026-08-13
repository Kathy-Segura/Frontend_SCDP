// services/dishes.services.ts
// Capa de SERVICES del módulo "Inventario de Platillos". Solo lógica de
// llamadas HTTP + mapeo de la forma que devuelve el backend (columnas en
// español, snake_case) hacia los tipos que ya usan los componentes del
// front (types.ts). No tiene JSX ni estado de React — eso vive en las
// páginas/hooks que consuman estas funciones.
//
// Cada función acá corresponde 1:1 a una ruta de
// inventarioPlatillos.routes.js (montadas bajo /api/dishes-inventory).

import { apiFetch } from "./apiClient";
import type { UnidadMedida } from "./catalogos.services";
import type { Category, Dish, DishIngredient } from "../types";

const BASE = "/dishes-inventory";

// ---------------------------------------------------------------------------
// Tipos "crudos" tal como los devuelve el backend (antes de adaptarlos)
// ---------------------------------------------------------------------------

export type ResumenPlatillos = {
  total_platillos: number;
  total_categorias_platillo: number;
};

export type CategoriaPlatilloRaw = {
  categoria_id: number;
  categoria: string;
};

export type PlatilloListadoRaw = {
  platillo_id: number;
  platillo: string;
  categoria: string;
  costo: number;
  precio_venta: number;
  margen_bruto: number;
  pct_margen_costo: number;
};

// OJO: columnas exactas de fn_detalle_platillo() no vienen en este bundle;
// se infieren de vw_margen_platillos / fn_filtrar_platillos. Verificar
// contra la función SQL real al conectar contra el backend vivo y ajustar
// los nombres de campo si no calzan (los ?. de mapDetallePlatillo ya
// contemplan que algún campo alternativo venga null/undefined).
export type EncabezadoPlatilloRaw = {
  platillo_id: number;
  platillo: string;
  categoria_id?: number;
  categoria: string;
  restaurante_id?: number;
  precio_venta: number;
  costo: number;
  margen_bruto?: number;
  margen_porcentaje_venta?: number;
  pct_margen_costo?: number;
};

export type RecetaLineaRaw = {
  ingrediente_id: number;
  ingrediente: string;
  cantidad_receta: number;
  unidad_receta: string;
  unidad_id?: number;
  costo_subtotal: number;
};

export type DetallePlatilloRaw = {
  encabezado: EncabezadoPlatilloRaw | null;
  receta: RecetaLineaRaw[];
};

export type IngredienteDisponibleRaw = {
  id: number;
  nombre: string;
  unidad_id: number;
  unidad: string;
  costo_unitario: number;
};

// Combo "unidad de medida" propio de este módulo (mismo shape que el de
// catálogos, pero servido por /dishes-inventory/units).
export type UnidadMedidaPlatillo = UnidadMedida;

export type MargenPlatilloRaw = {
  costo: number;
  precio_venta: number;
  margen_porcentaje_venta: number;
};

export type ResumenEdicionRaw = {
  receta: RecetaLineaRaw[];
  resumen: MargenPlatilloRaw | null;
};

// ---------------------------------------------------------------------------
// Adaptadores: raw (backend, español/snake_case) -> tipos del front (types.ts)
// ---------------------------------------------------------------------------

export function mapCategoriaPlatillo(row: CategoriaPlatilloRaw): Category {
  return { id: row.categoria_id, name: row.categoria };
}

export function mapPlatilloListado(row: PlatilloListadoRaw): Dish {
  return {
    id: row.platillo_id,
    name: row.platillo,
    category: row.categoria,
    price: row.precio_venta,
    cost: row.costo,
    marginBruto: row.margen_bruto,
    marginPct: row.pct_margen_costo,
    ingredients: [], // la tabla principal no trae receta; se pide con getDetallePlatillo
  };
}

function mapRecetaLinea(row: RecetaLineaRaw): DishIngredient {
  return {
    ingredientId: row.ingrediente_id,
    quantity: row.cantidad_receta,
    selectedUnit: row.unidad_receta,
    unitId: row.unidad_id,
  };
}

export function mapDetallePlatillo(raw: DetallePlatilloRaw): Dish | null {
  if (!raw.encabezado) return null;
  const e = raw.encabezado;
  return {
    id: e.platillo_id,
    name: e.platillo,
    category: e.categoria,
    categoryId: e.categoria_id,
    restaurantId: e.restaurante_id,
    price: e.precio_venta,
    cost: e.costo,
    marginBruto: e.margen_bruto,
    marginPct: e.margen_porcentaje_venta ?? e.pct_margen_costo,
    ingredients: raw.receta.map(mapRecetaLinea),
  };
}

export type IngredienteOpcion = {
  id: number;
  name: string;
  unit: string;
  unitId: number;
  costPerUnit: number;
};

export function mapIngredienteDisponible(row: IngredienteDisponibleRaw): IngredienteOpcion {
  return {
    id: row.id,
    name: row.nombre,
    unit: row.unidad,
    unitId: row.unidad_id,
    costPerUnit: row.costo_unitario,
  };
}

export type ResumenEdicion = {
  receta: DishIngredient[];
  resumen: { cost: number; price: number; marginPct: number } | null;
};

function mapResumenEdicion(raw: ResumenEdicionRaw): ResumenEdicion {
  return {
    receta: raw.receta.map(mapRecetaLinea),
    resumen: raw.resumen
      ? {
          cost: raw.resumen.costo,
          price: raw.resumen.precio_venta,
          marginPct: raw.resumen.margen_porcentaje_venta,
        }
      : null,
  };
}

// ---------------------------------------------------------------------------
// Services — un endpoint del módulo por función
// ---------------------------------------------------------------------------

// GET /dishes-inventory/summary — cards del encabezado
export async function obtenerResumenPlatillos(): Promise<ResumenPlatillos> {
  return apiFetch<ResumenPlatillos>(`${BASE}/summary`);
}

// GET /dishes-inventory/categories — combo de filtro
export async function listarCategoriasPlatillos(): Promise<Category[]> {
  const rows = await apiFetch<CategoriaPlatilloRaw[]>(`${BASE}/categories`);
  return rows.map(mapCategoriaPlatillo);
}

// GET /dishes-inventory?search=&categoria_id= — tabla principal
export async function listarPlatillos(params?: { search?: string; categoriaId?: number }): Promise<Dish[]> {
  const qs = new URLSearchParams();
  if (params?.search) qs.set("search", params.search);
  if (params?.categoriaId) qs.set("categoria_id", String(params.categoriaId));
  const query = qs.toString();
  const rows = await apiFetch<PlatilloListadoRaw[]>(`${BASE}${query ? `?${query}` : ""}`);
  return rows.map(mapPlatilloListado);
}

// GET /dishes-inventory/:id — botón "Ver" (encabezado + receta)
export async function obtenerDetallePlatillo(id: number): Promise<Dish | null> {
  const raw = await apiFetch<DetallePlatilloRaw>(`${BASE}/${id}`);
  return mapDetallePlatillo(raw);
}

// GET /dishes-inventory/ingredient-options — combo "agregar ingrediente" (solo activos)
export async function listarIngredientesDisponibles(): Promise<IngredienteOpcion[]> {
  const rows = await apiFetch<IngredienteDisponibleRaw[]>(`${BASE}/ingredient-options`);
  return rows.map(mapIngredienteDisponible);
}

// GET /dishes-inventory/units — combo "unidad de medida" del modal Editar
export function listarUnidadesMedidaPlatillos(): Promise<UnidadMedidaPlatillo[]> {
  return apiFetch<UnidadMedidaPlatillo[]>(`${BASE}/units`);
}

// POST /dishes-inventory/:id/ingredients — "Agregar ingrediente" (se guarda de inmediato)
export async function agregarIngredienteAPlatillo(
  platilloId: number,
  payload: { ingredienteId: number; cantidad: number; unidadId?: number }
): Promise<ResumenEdicion> {
  const raw = await apiFetch<ResumenEdicionRaw>(`${BASE}/${platilloId}/ingredients`, {
    method: "POST",
    body: {
      ingrediente_id: payload.ingredienteId,
      cantidad: payload.cantidad,
      unidad_id: payload.unidadId,
    },
  });
  return mapResumenEdicion(raw);
}

// DELETE /dishes-inventory/:id/ingredients/:ingredienteId — quitar línea de receta
export async function quitarIngredienteDePlatillo(
  platilloId: number,
  ingredienteId: number
): Promise<ResumenEdicion> {
  const raw = await apiFetch<ResumenEdicionRaw>(`${BASE}/${platilloId}/ingredients/${ingredienteId}`, {
    method: "DELETE",
  });
  return mapResumenEdicion(raw);
}

// PUT /dishes-inventory/:id — botón "Guardar cambios" (nombre/categoría/precio)
export function actualizarPlatillo(
  id: number,
  payload: { nombre?: string; categoriaId?: number; precioVenta?: number }
): Promise<void> {
  return apiFetch<void>(`${BASE}/${id}`, {
    method: "PUT",
    body: {
      nombre_platillo: payload.nombre,
      categoria_id: payload.categoriaId,
      precio_venta: payload.precioVenta,
    },
  });
}

// DELETE /dishes-inventory/:id — botón "Eliminar" (baja lógica)
export function eliminarPlatillo(id: number): Promise<void> {
  return apiFetch<void>(`${BASE}/${id}`, { method: "DELETE" });
}
