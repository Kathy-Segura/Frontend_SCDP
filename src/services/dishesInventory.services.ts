// services/dishInventory.services.ts
// Capa de SERVICES para el modulo de Inventario de Platillos (tabla +
// modal "Ver" + drawer "Editar"). Solo logica de red, alineada 1 a 1 con
// inventarioPlatillos.controller.js / inventarioPlatillos.model.js.
// Nada de JSX ni estado de React aca (mismo patron que dish.services.ts /
// ingredients.services.ts).

import { apiFetch } from "./apiClient";

// --- Cards del encabezado ---------------------------------------------------
// GET /api/dishes-inventory/summary
export type ResumenPlatillos = {
  total_platillos: number;
  total_categorias_platillo: number;
};

export function obtenerResumenPlatillos(): Promise<ResumenPlatillos> {
  return apiFetch<ResumenPlatillos>("/dishes-inventory/summary");
}

// --- Combo de categorías (filtro de la tabla) -------------------------------
// GET /api/dishes-inventory/categories
export type CategoriaInventario = {
  categoria_id: number;
  categoria: string;
};

export function listarCategoriasInventario(): Promise<CategoriaInventario[]> {
  return apiFetch<CategoriaInventario[]>("/dishes-inventory/categories");
}

// --- Tabla principal (search + categoria_id ya filtrados en el backend) ----
// GET /api/dishes-inventory?search=&categoria_id=
// costo/precio_venta/margen_bruto/pct_margen_costo ya vienen calculados por
// fn_filtrar_platillos: no hay que recalcular nada en el front.
export type PlatilloInventario = {
  platillo_id: number;
  platillo: string;
  categoria: string;
  costo: number | string;
  precio_venta: number | string;
  margen_bruto: number | string;
  pct_margen_costo: number | string;
};

export function listarPlatillosInventario(params: {
  search?: string;
  categoriaId?: number | null;
} = {}): Promise<PlatilloInventario[]> {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.categoriaId) qs.set("categoria_id", String(params.categoriaId));
  const query = qs.toString();
  return apiFetch<PlatilloInventario[]>(`/dishes-inventory${query ? `?${query}` : ""}`);
}

// --- Botón "Ver": encabezado + receta completa ------------------------------
// GET /api/dishes-inventory/:id
//
// OJO / ASUMIDO: fn_detalle_platillo y fn_receta_detalle_platillo no traían
// su SQL en el paquete que me pasaste, así que asumí que sus columnas
// siguen el mismo patrón que ya usás en el resto del módulo (mismos
// nombres que fn_filtrar_platillos para el encabezado, y mismos nombres que
// vw_costeo_platillos para la receta). Si el backend responde con otros
// nombres de columna, es un cambio de una sola línea aquí abajo.
export type PlatilloDetalleEncabezado = {
  platillo_id: number;
  platillo: string;
  categoria: string;
  categoria_id: number;
  precio_venta: number | string;
  costo: number | string;
  margen_bruto: number | string;
  pct_margen_costo: number | string;
};

export type RecetaLinea = {
  ingrediente_id: number;
  ingrediente: string;
  cantidad_receta: number | string;
  unidad_receta: string;
  costo_subtotal: number | string;
};

export type PlatilloDetalle = {
  encabezado: PlatilloDetalleEncabezado | null;
  receta: RecetaLinea[];
};

export function obtenerDetallePlatillo(id: number): Promise<PlatilloDetalle> {
  return apiFetch<PlatilloDetalle>(`/dishes-inventory/${id}`);
}

// --- Combo "agregar ingrediente" del drawer Editar --------------------------
// GET /api/dishes-inventory/ingredient-options
export type IngredienteParaReceta = {
  id: number;
  nombre: string;
  unidad_id: number;
  unidad: string;
  costo_unitario: number | string;
};

export function listarIngredientesParaReceta(): Promise<IngredienteParaReceta[]> {
  return apiFetch<IngredienteParaReceta[]>("/dishes-inventory/ingredient-options");
}

// --- Combo "unidad" del drawer Editar ---------------------------------------
// GET /api/dishes-inventory/units
export type UnidadMedidaInventario = {
  id: number;
  codigo_unidad: string;
  nombre_unidad: string;
  tipo_medida: string;
};

export function listarUnidadesInventario(): Promise<UnidadMedidaInventario[]> {
  return apiFetch<UnidadMedidaInventario[]>("/dishes-inventory/units");
}

// --- Mini tabla + 3 cards que devuelven agregar/quitar ingrediente ---------
export type ResumenEdicion = {
  receta: RecetaLinea[];
  resumen: {
    costo: number | string;
    precio_venta: number | string;
    margen_porcentaje_venta: number | string;
  } | null;
};

// Botón "Agregar ingrediente" del drawer: se guarda al vuelo (no espera al
// botón "Guardar cambios") y regresa ya la receta + cards actualizadas.
// POST /api/dishes-inventory/:id/ingredients
export type AgregarIngredientePayload = {
  ingrediente_id: number;
  cantidad: number;
  unidad_id?: number;
};

export function agregarIngredienteAPlatillo(
  platilloId: number,
  payload: AgregarIngredientePayload
): Promise<ResumenEdicion> {
  return apiFetch<ResumenEdicion>(`/dishes-inventory/${platilloId}/ingredients`, {
    method: "POST",
    body: payload,
  });
}

// Quitar una línea de la receta (X en la tabla del drawer).
// DELETE /api/dishes-inventory/:id/ingredients/:ingredienteId
export function quitarIngredienteDePlatillo(
  platilloId: number,
  ingredienteId: number
): Promise<ResumenEdicion> {
  return apiFetch<ResumenEdicion>(`/dishes-inventory/${platilloId}/ingredients/${ingredienteId}`, {
    method: "DELETE",
  });
}

// --- Botón "Guardar cambios" (nombre / categoría / precio de venta) -------
// No toca la receta, eso ya se guardó con agregar/quitar ingrediente.
// PUT /api/dishes-inventory/:id
export type ActualizarPlatilloPayload = {
  nombre_platillo?: string;
  categoria_id?: number;
  precio_venta?: number;
};

export function actualizarPlatillo(
  id: number,
  payload: ActualizarPlatilloPayload
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/dishes-inventory/${id}`, {
    method: "PUT",
    body: payload,
  });
}

// --- Botón "Eliminar" (baja lógica, siempre activo=false) -----------------
// DELETE /api/dishes-inventory/:id
export function eliminarPlatillo(id: number): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/dishes-inventory/${id}`, {
    method: "DELETE",
  });
}
