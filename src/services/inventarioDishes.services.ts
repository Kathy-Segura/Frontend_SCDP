// services/inventarioPlatillos.services.ts
// Capa de servicios del módulo Inventario de Platillos.
// Traduce entre el shape que devuelve el backend (snake_case, vistas/funciones
// de costeo_bc vía inventarioPlatillos.controller.js) y el shape que usan los
// componentes del front. No tiene JSX ni estado de React: solo fetch + mapeo.
//
// Columnas de fn_detalle_platillo / fn_receta_detalle_platillo confirmadas
// con el JSON real del endpoint (no son las mismas que vw_costeo_platillos
// usa en obtenerResumenEdicion — ver nota en esa sección más abajo).

import { apiFetch } from "./apiClient";

const BASE = "/dishes-inventory";

// --- Resumen (cards del encabezado) ----------------------------------------
export type ResumenPlatillos = {
  totalPlatillos: number;
  totalCategoriasPlatillo: number;
};

export function obtenerResumenPlatillos(): Promise<ResumenPlatillos> {
  return apiFetch<{ total_platillos: number; total_categorias_platillo: number }>(
    `${BASE}/summary`
  ).then((r) => ({
    totalPlatillos: r.total_platillos,
    totalCategoriasPlatillo: r.total_categorias_platillo,
  }));
}

// --- Categorías de platillo (combo de filtro) -------------------------------
// OJO: son categorías de PLATILLO (fn_categorias_por_restaurante), no las
// mismas categorías de ingrediente que expone catalogos.services.
export type CategoriaPlatillo = { id: number; nombre: string };

export function listarCategoriasPlatillo(): Promise<CategoriaPlatillo[]> {
  return apiFetch<{ categoria_id: number; categoria: string }[]>(
    `${BASE}/categories`
  ).then((rows) => rows.map((r) => ({ id: r.categoria_id, nombre: r.categoria })));
}

// --- Tabla principal ---------------------------------------------------------
// costo/margen_bruto/pct_margen_costo ya vienen calculados por el backend:
// no hay que recalcularlos en el front (a diferencia de la versión anterior
// del módulo, que usaba dishCost() como estimado local).
export type PlatilloResumen = {
  id: number;
  nombre: string;
  categoria: string;
  costo: number;
  precioVenta: number;
  margenBruto: number;
  pctMargenCosto: number;
  /** true si está activo, false si fue dado de baja. Ya no depende de un
   *  filtro de estado: la búsqueda siempre trae activos + inactivos que
   *  coincidan, y el front resuelve el render (tachado/badge/botón
   *  "Activar") con este campo. */
  activo: boolean;
};

type PlatilloApi = {
  platillo_id: number;
  platillo: string;
  categoria: string;
  costo: number;
  precio_venta: number;
  margen_bruto: number;
  pct_margen_costo: number;
  activo: boolean;
};

function mapPlatillo(row: PlatilloApi): PlatilloResumen {
  return {
    id: row.platillo_id,
    nombre: row.platillo,
    categoria: row.categoria,
    costo: Number(row.costo),
    precioVenta: Number(row.precio_venta),
    margenBruto: Number(row.margen_bruto),
    pctMargenCosto: Number(row.pct_margen_costo),
    activo: row.activo,
  };
}

export async function listarPlatillos(filtros?: {
  search?: string;
  categoriaId?: number;
}): Promise<PlatilloResumen[]> {
  const params = new URLSearchParams();
  if (filtros?.search) params.set("search", filtros.search);
  if (filtros?.categoriaId) params.set("categoria_id", String(filtros.categoriaId));
  const qs = params.toString();

  const rows = await apiFetch<PlatilloApi[]>(`${BASE}${qs ? `?${qs}` : ""}`);
  return rows.map(mapPlatillo);
}

// --- Ingredientes disponibles (combo "agregar ingrediente") -----------------
export type IngredienteDisponible = {
  id: number;
  nombre: string;
  unidadId: number;
  unidad: string;
  costoUnitario: number;
};

export async function listarIngredientesDisponibles(): Promise<IngredienteDisponible[]> {
  const rows = await apiFetch<
    { id: number; nombre: string; unidad_id: number; unidad: string; costo_unitario: number }[]
  >(`${BASE}/ingredient-options`);
  return rows.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    unidadId: r.unidad_id,
    unidad: r.unidad,
    costoUnitario: Number(r.costo_unitario),
  }));
}

// --- Unidades de medida (combo "unidad" del modal) ---------------------------
// El backend expone /dishes-inventory/units, pero es la MISMA tabla
// unidades_medida que ya trae catalogos.services.listarUnidadesMedida (usado
// en el módulo de Ingredientes) — se reutiliza esa función en vez de duplicar
// la llamada acá. Ver services/catalogos.services.ts.

// --- Receta / encabezado de un platillo (botón "Ver") -----------------------
// Confirmado con el JSON real de GET /dishes-inventory/:id y el CREATE
// FUNCTION de fn_receta_detalle_platillo (vw_costeo_platillos). OJO: esta
// función devuelve el costo YA EXPRESADO EN LA UNIDAD CAPTURADA en la receta
// (costo_por_unidad_utilizada = costo_subtotal / cantidad), no el costo por
// unidad base del ingrediente — no confundir con Ingredientes.costPerUnit.
export type RecetaLineaDetalle = {
  ingredienteId: number;
  ingrediente: string;
  categoriaIngrediente: string;
  cantidad: number;
  unidad: string;
  costoPorUnidad: number;
  costoSubtotal: number;
};

export type EncabezadoPlatillo = {
  id: number;
  nombre: string;
  categoria: string;
  categoriaId?: number;
  numIngredientes: number;
  precioVenta: number;
  costo: number;
  margenBruto: number;
  margenPct: number;
};

export type DetallePlatillo = {
  encabezado: EncabezadoPlatillo | null;
  receta: RecetaLineaDetalle[];
};

function mapRecetaLineaDetalle(row: any): RecetaLineaDetalle {
  return {
    ingredienteId: row.ingrediente_id,
    ingrediente: row.ingrediente,
    categoriaIngrediente: row.categoria_ingrediente,
    cantidad: Number(row.cantidad),
    unidad: row.unidad_medida,
    costoPorUnidad: Number(row.costo_por_unidad_utilizada),
    costoSubtotal: Number(row.costo_subtotal),
  };
}

function mapEncabezado(row: any): EncabezadoPlatillo | null {
  if (!row) return null;
  return {
    id: row.platillo_id,
    nombre: row.nombre_platillo,
    categoria: row.categoria,
    categoriaId: row.categoria_id,
    numIngredientes: Number(row.num_ingredientes),
    precioVenta: Number(row.precio_venta),
    costo: Number(row.costo_ingredientes),
    margenBruto: Number(row.margen_bruto),
    margenPct: Number(row.margen_neto_porcentaje),
  };
}

export async function obtenerDetallePlatillo(id: number): Promise<DetallePlatillo> {
  const data = await apiFetch<{ encabezado: any; receta: any[] }>(`${BASE}/${id}`);
  return {
    encabezado: mapEncabezado(data.encabezado),
    receta: (data.receta || []).map(mapRecetaLineaDetalle),
  };
}

// --- Mini tabla + 3 cards del modal Editar (se pide de nuevo tras cada
//     agregar/quitar ingrediente) --------------------------------------------
// Endpoint DISTINTO al de "Ver": obtenerResumenEdicion en el backend hace un
// SELECT explícito sobre vw_costeo_platillos (ingrediente_id, ingrediente,
// cantidad_receta, unidad_receta, costo_subtotal) y vw_margen_platillos
// (costo, precio_venta, margen_porcentaje_venta) — columnas ya confirmadas
// desde el .model.js real, no adivinadas, así que esta parte no cambia.
export type RecetaLineaEdicion = {
  ingredienteId: number;
  ingrediente: string;
  cantidad: number;
  unidad: string;
  costoSubtotal: number;
};

function mapRecetaLineaEdicion(row: any): RecetaLineaEdicion {
  return {
    ingredienteId: row.ingrediente_id,
    ingrediente: row.ingrediente,
    cantidad: Number(row.cantidad_receta),
    unidad: row.unidad_receta,
    costoSubtotal: Number(row.costo_subtotal),
  };
}

export type ResumenEdicion = {
  receta: RecetaLineaEdicion[];
  resumen: { costo: number; precioVenta: number; margenPct: number } | null;
};

function mapResumenEdicion(data: { receta: any[]; resumen: any }): ResumenEdicion {
  return {
    receta: (data.receta || []).map(mapRecetaLineaEdicion),
    resumen: data.resumen
      ? {
          costo: Number(data.resumen.costo),
          precioVenta: Number(data.resumen.precio_venta),
          margenPct: Number(data.resumen.margen_porcentaje_venta),
        }
      : null,
  };
}

// --- POST /dishes-inventory/:id/ingredients ----------------------------------
// Agrega UNA línea de receta o, si el ingrediente ya estaba, actualiza su
// cantidad/unidad (sp_actualizar_ingrediente_platillo es upsert). Se llama
// de inmediato al presionar "Agregar", no se acumula para el botón
// "Guardar cambios" — eso solo maneja nombre/categoría/precio.
export async function agregarOActualizarIngrediente(
  platilloId: number,
  datos: { ingredienteId: number; cantidad: number; unidadId?: number }
): Promise<ResumenEdicion> {
  const data = await apiFetch<{ receta: any[]; resumen: any }>(
    `${BASE}/${platilloId}/ingredients`,
    {
      method: "POST",
      body: {
        ingrediente_id: datos.ingredienteId,
        cantidad: datos.cantidad,
        unidad_id: datos.unidadId,
      },
    }
  );
  return mapResumenEdicion(data);
}

// --- DELETE /dishes-inventory/:id/ingredients/:ingredienteId -----------------
export async function quitarIngrediente(
  platilloId: number,
  ingredienteId: number
): Promise<ResumenEdicion> {
  const data = await apiFetch<{ receta: any[]; resumen: any }>(
    `${BASE}/${platilloId}/ingredients/${ingredienteId}`,
    { method: "DELETE" }
  );
  return mapResumenEdicion(data);
}

// --- PUT /dishes-inventory/:id -------------------------------------------------
// Solo nombre / categoría / precio de venta. No toca la receta.
export type ActualizarPlatilloPayload = {
  nombre?: string;
  categoriaId?: number;
  precioVenta?: number;
};

export async function actualizarPlatillo(
  id: number,
  cambios: ActualizarPlatilloPayload
): Promise<void> {
  await apiFetch<void>(`${BASE}/${id}`, {
    method: "PUT",
    body: {
      nombre_platillo: cambios.nombre,
      categoria_id: cambios.categoriaId,
      precio_venta: cambios.precioVenta,
    },
  });
}

// --- DELETE /dishes-inventory/:id ----------------------------------------------
// Baja lógica (activo=false).
export async function eliminarPlatillo(id: number): Promise<void> {
  await apiFetch<void>(`${BASE}/${id}`, { method: "DELETE" });
}

// --- PUT /dishes-inventory/:id/reactivate ---------------------------------------
// NUEVO. Requiere el endpoint + sp_reactivar_platillo agregados en el backend
// (ver inventarioPlatillos.{routes,controller,model}.js y
// sql_sugerido_reactivar_platillo.sql).
export async function reactivarPlatillo(id: number): Promise<void> {
  await apiFetch<void>(`${BASE}/${id}/reactivate`, { method: "PUT" });
}
