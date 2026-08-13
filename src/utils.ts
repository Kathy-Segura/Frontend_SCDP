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
// POST /api/ingredients/calculate-cost y POST /api/dishes/calculate-cost.
//
// FALLBACK FISICO: mientras el backend no traiga factor_conversion_base en
// /ingredients/units (ni en /dishes-inventory/units), usamos estas
// constantes fisicas universales para peso y volumen -- no dependen del
// ingrediente ni de la base de datos, son las mismas en cualquier sistema.
// Si el backend algun dia manda factor_conversion_base, ESE valor manda
// (este fallback solo se usa cuando falta el dato real).
// "Unidad"/"Caja"/"Bolsa" (tipo conteo) NO tienen fallback aqui a proposito:
// su equivalencia es especifica de cada ingrediente (ver
// ingrediente_conversion_personalizada) y no se puede inventar en el front.

const FACTORES_FISICOS_FALLBACK: Record<string, number> = {
  // peso -> base: gramos
  'Gramos': 1,
  'Kilogramos': 1000,
  'Onzas': 28.3495,
  'Libras': 453.592,
  // volumen -> base: mililitros
  'Mililitros': 1,
  'Litros': 1000,
  'Onzas fluidas': 29.5735,
  'Galon': 3785.41,
};

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

  // Prioridad: factor_conversion_base real del backend. Si no esta
  // disponible, cae al factor fisico fijo (solo existe para peso/volumen).
  const factorDesde = desde?.factor_conversion_base ?? FACTORES_FISICOS_FALLBACK[fromUnit];
  const factorHacia = hacia?.factor_conversion_base ?? FACTORES_FISICOS_FALLBACK[toUnit];

  // Si ninguna fuente tiene el factor (p.ej. unidades tipo conteo, o un
  // nombre de unidad que no reconocemos), no inventamos nada: devolvemos
  // la cantidad tal cual, igual que antes.
  if (!factorDesde || !factorHacia) {
    return quantity;
  }

  const cantidadEnUnidadBase = quantity * factorDesde;
  return cantidadEnUnidadBase / factorHacia;
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
