// services/catalogos.services.ts
// Catalogos compartidos (categorias de ingrediente, unidades de medida).
// Se consumen desde varios modulos (Ingredientes, Platillos), por eso viven
// aparte de ingredients.services.ts. No tiene JSX ni estado de React.

import { apiFetch } from "./apiClient";

export type Categoria = {
  id: number;
  nombre_categoria: string;
};

export type UnidadMedida = {
  id: number;
  codigo_unidad: string;
  nombre_unidad: string;
  tipo_medida: string;
  // OJO: el backend actual (ingrediente.model.js -> listarUnidadesMedida)
  // no incluye esta columna en el SELECT todavia. utils.ts (convertToBaseUnit)
  // la necesita para convertir entre unidades; hasta que el back la agregue,
  // esas conversiones caeran en su fallback (no convierten).
  factor_conversion_base?: number;
};

export function listarCategoriasIngrediente(): Promise<Categoria[]> {
  return apiFetch<Categoria[]>("/ingredients/categories");
}

export function listarUnidadesMedida(): Promise<UnidadMedida[]> {
  return apiFetch<UnidadMedida[]>("/ingredients/units");
}
