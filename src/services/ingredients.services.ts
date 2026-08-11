// services/ingredients.services.ts
// Capa de SERVICES para el modulo de Ingredientes (Nuevo Insumo + Historial).
// Solo logica de red, alineada 1 a 1 con ingrediente.controller.js /
// ingrediente.routes.js. Nada de JSX ni estado de React aca.

import { apiFetch } from "./apiClient";

// --- Paso 1: calcular costo unitario (preview, NO guarda nada) ------------
// POST /api/ingredients/calculate-cost
export type CalcularCostoPayload = {
  costo_total_compra: number;
  cantidad_comprada: number;
  unidad_compra_id: number;
  cantidad_uso: number;
  unidad_uso_id: number;
};

export type CostoCalculado = {
  // pg puede devolver NUMERIC como string; normalizar con Number(...) al usarlo.
  costo_unitario: number | string;
};

export function calcularCostoUnitario(payload: CalcularCostoPayload): Promise<CostoCalculado> {
  return apiFetch<CostoCalculado>("/ingredients/calculate-cost", {
    method: "POST",
    body: payload,
  });
}

// --- Paso 2: registrar el insumo ya con el costo confirmado ---------------
// POST /api/ingredients
// Nota: el backend NO devuelve el ingrediente creado, solo un mensaje.
// Por eso, despues de guardar hay que refrescar el historial (no "appendear").
export type RegistrarInsumoPayload = {
  nombre_ingrediente: string;
  categoria_id: number;
  unidad_id: number;
  costo_unitario: number;
  stock_inicial?: number;
  stock_minimo?: number;
};

export function registrarInsumo(payload: RegistrarInsumoPayload): Promise<void> {
  return apiFetch<void>("/ingredients", {
    method: "POST",
    body: payload,
  });
}

// --- Historial (ultimos 50 insumos registrados) ----------------------------
// GET /api/ingredients/recent
// No existe un GET /ingredients "listar todo": esta es la unica fuente
// de datos que trae el backend para mostrar ingredientes ya guardados.
export type HistorialInsumo = {
  id: number;
  nombre: string;
  costo_unitario: number | string;
  stock_actual: number | string;
  created_at: string;
};

export function listarHistorialInsumos(): Promise<HistorialInsumo[]> {
  return apiFetch<HistorialInsumo[]>("/ingredients/recent");
}
