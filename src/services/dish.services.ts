// services/platillos.services.ts
// Capa de SERVICES para el modulo de Crear Platillo (Formulario + Historial).
// Solo logica de red, alineada 1 a 1 con platillo.controller.js /
// platillo.routes.js. Nada de JSX ni estado de React aca (mismo patron
// que ingredients.services.ts).

import { apiFetch } from "./apiClient";

// --- Dropdowns del formulario ----------------------------------------------

// GET /api/dishes/categories
export type CategoriaPlatillo = {
  id: number;
  nombre_categoria: string;
};

export function listarCategoriasPlatillo(): Promise<CategoriaPlatillo[]> {
  return apiFetch<CategoriaPlatillo[]>("/dishes/categories");
}

// GET /api/dishes/restaurants
export type RestaurantePlatillo = {
  id: number;
  nombre_restaurante: string;
};

export function listarRestaurantesPlatillo(): Promise<RestaurantePlatillo[]> {
  return apiFetch<RestaurantePlatillo[]>("/dishes/restaurants");
}

// GET /api/dishes/available-ingredients
// OJO: el backend solo trae unidad_medida_id (no el nombre de la unidad).
// El nombre/tipo de unidad hay que resolverlo cruzando con
// catalogos.services.ts -> listarUnidadesMedida() (igual que utils.ts
// ya espera via setUnidadesCatalogo).
export type IngredienteDisponible = {
  id: number;
  nombre_ingrediente: string;
  unidad_medida_id: number;
  // pg puede devolver NUMERIC como string; normalizar con Number(...) al usarlo.
  costo_unitario_actual: number | string;
};

export function listarIngredientesDisponibles(): Promise<IngredienteDisponible[]> {
  return apiFetch<IngredienteDisponible[]>("/dishes/available-ingredients");
}

// --- Paso 1: calcular costo total de la receta (preview, NO guarda nada) ---
// POST /api/dishes/calculate-cost
export type IngredienteReceta = {
  ingrediente_id: number;
  cantidad: number;
  unidad_id: number;
};

export type CostoRecetaCalculado = {
  // pg puede devolver NUMERIC como string; normalizar con Number(...) al usarlo.
  costo_total: number | string;
};

export function calcularCostoPlatillo(
  ingredientes: IngredienteReceta[]
): Promise<CostoRecetaCalculado> {
  return apiFetch<CostoRecetaCalculado>("/dishes/calculate-cost", {
    method: "POST",
    body: { ingredientes },
  });
}

// --- Paso 2: registrar el platillo ya con el costo confirmado --------------
// POST /api/dishes
// Nota: el backend NO devuelve el platillo creado, solo un mensaje.
// Por eso, despues de guardar hay que refrescar el historial (no "appendear").
export type CrearPlatilloPayload = {
  restaurante_id: number;
  nombre_platillo: string;
  categoria_id: number;
  precio_venta: number;
  ingredientes: IngredienteReceta[];
};

export function crearPlatillo(payload: CrearPlatilloPayload): Promise<void> {
  return apiFetch<void>("/dishes", {
    method: "POST",
    body: payload,
  });
}

// --- Historial (ultimos 50 platillos) ---------------------------------------
// GET /api/dishes/recent
// El backend ya trae el costo calculado (costo_total_ingredientes) via
// vw_historial_platillos_recientes: no hay que recalcularlo en el front.
export type HistorialPlatillo = {
  id: number;
  nombre: string;
  restaurante_id: number;
  precio_venta: number | string;
  costo_total_ingredientes: number | string;
  created_at: string;
};

export function listarHistorialPlatillos(): Promise<HistorialPlatillo[]> {
  return apiFetch<HistorialPlatillo[]>("/dishes/recent");
}
