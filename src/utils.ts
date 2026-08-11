import type { Dish, Ingredient } from "./types";
import type { UnidadMedida } from "./services/catalogos.services";

export function fmt(n: number) { return n.toFixed(2); }
export function cs(n: number) { return `C$ ${fmt(n)}`; }
export function clsx(...c: (string | boolean | undefined)[]) { return c.filter(Boolean).join(" "); }

// ---------------------------------------------------------------------------
// Conversion de unidades
// ---------------------------------------------------------------------------
// Antes esto era una tabla fija (UNIT_CONVERSIONS) inventada en el front.
// Ahora se apoya en el catalogo real de unidades_medida que trae la API
// (incluye factor_conversion_base), cacheado aca en memoria una sola vez
// despues del login (ver App.tsx -> setUnidadesCatalogo).
//
// Las firmas de convertToBaseUnit/getCompatibleUnits/dishCost se mantienen
// IGUAL que antes a proposito, para no tener que tocar ReportsPage,
// ChartsPage, DishEditDrawer, DishIngredientsModal, etc. en esta parte.
//
// IMPORTANTE: esto sigue siendo solo un ESTIMADO para la pantalla. El
// calculo real y definitivo de costos lo hace el backend via
// POST /api/ingredients/calculate-cost y POST /api/dishes/calculate-cost
// (pendiente de conectar en las partes de Ingredientes/Platillos).

let unidadesCatalogo: UnidadMedida[] = [];

export function setUnidadesCatalogo(unidades: UnidadMedida[]) {
  unidadesCatalogo = unidades;
}

function buscarUnidad(nombre: string): UnidadMedida | undefined {
  return unidadesCatalogo.find(
    (u) => u.nombre_unidad === nombre || u.codigo_unidad === nombre
  );
}

export function convertToBaseUnit(quantity: number, fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit) return quantity;

  const desde = buscarUnidad(fromUnit);
  const hacia = buscarUnidad(toUnit);

  // Si el catalogo todavia no cargo, o alguna unidad no se encontro, no
  // inventamos un factor: devolvemos la cantidad tal cual (mismo
  // comportamiento de fallback que tenia la version anterior).
  if (!desde || !hacia || !desde.factor_conversion_base || !hacia.factor_conversion_base) {
    return quantity;
  }

  const cantidadEnUnidadBase = quantity * desde.factor_conversion_base;
  return cantidadEnUnidadBase / hacia.factor_conversion_base;
}

export function getCompatibleUnits(baseUnit: string): string[] {
  const unidadActual = buscarUnidad(baseUnit);

  // Catalogo aun no cargado: como antes, solo devolvemos la unidad misma
  // para no romper el render mientras llega la respuesta de la API.
  if (!unidadActual) return [baseUnit];

  if (unidadActual.tipo_medida === "conteo") return [unidadActual.nombre_unidad];

  return unidadesCatalogo
    .filter((u) => u.tipo_medida === unidadActual.tipo_medida)
    .map((u) => u.nombre_unidad);
}

// ---------------------------------------------------------------------------
// Costo de un platillo (sin cambios en la firma)
// ---------------------------------------------------------------------------
export function dishCost(dish: Dish, ingredients: Ingredient[]) {
  return (dish.ingredients ?? []).reduce((s, di) => {
    const ing = ingredients.find((i) => i.id === di.ingredientId);
    if (!ing) return s;
    const quantityInBaseUnit = convertToBaseUnit(di.quantity, di.selectedUnit || ing.unit, ing.unit);
    return s + (ing.costPerUnit * quantityInBaseUnit);
  }, 0);
}
