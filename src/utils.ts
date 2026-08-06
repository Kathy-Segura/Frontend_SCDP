import type { Dish, Ingredient } from "./types";

export function fmt(n: number) { return n.toFixed(2); }
export function cs(n: number) { return `C$ ${fmt(n)}`; }
export function clsx(...c: (string | boolean | undefined)[]) { return c.filter(Boolean).join(" "); }

export function dishCost(dish: Dish, ingredients: Ingredient[]) {
  return (dish.ingredients ?? []).reduce((s, di) => {
    const ing = ingredients.find((i) => i.id === di.ingredientId);
    if (!ing) return s;
    const quantityInBaseUnit = convertToBaseUnit(di.quantity, di.selectedUnit || ing.unit, ing.unit);
    return s + (ing.costPerUnit * quantityInBaseUnit);
  }, 0);
}

const UNIT_CONVERSIONS: Record<string, Record<string, number>> = {
  'Gramos':        { 'Gramos': 1, 'Kilogramos': 0.001, 'Onzas': 0.03527, 'Libras': 0.00220462 },
  'Kilogramos':    { 'Kilogramos': 1, 'Gramos': 1000, 'Onzas': 35.274, 'Libras': 2.20462 },
  'Onzas':         { 'Onzas': 1, 'Gramos': 28.3495, 'Kilogramos': 0.0283495, 'Libras': 0.0625 },
  'Libras':        { 'Libras': 1, 'Gramos': 453.592, 'Kilogramos': 0.453592, 'Onzas': 16 },
  'Mililitros':    { 'Mililitros': 1, 'Litros': 0.001, 'Onzas fluidas': 0.033814, 'Galon': 0.000264172 },
  'Litros':        { 'Litros': 1, 'Mililitros': 1000, 'Onzas fluidas': 33.814, 'Galon': 0.264172 },
  'Onzas fluidas': { 'Onzas fluidas': 1, 'Mililitros': 29.5735, 'Litros': 0.0295735, 'Galon': 0.0078125 },
  'Galon':         { 'Galon': 1, 'Mililitros': 3785.41, 'Litros': 3.78541, 'Onzas fluidas': 128 },
  'Unidad':        { 'Unidad': 1 },
  'Caja':          { 'Caja': 1 },
  'Bolsa':         { 'Bolsa': 1 },
};

export function convertToBaseUnit(quantity: number, fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit) return quantity;
  const conversions = UNIT_CONVERSIONS[fromUnit];
  if (!conversions || !conversions[toUnit]) return quantity;
  return quantity * conversions[toUnit];
}

export function getCompatibleUnits(baseUnit: string): string[] {
  if (['Gramos', 'Kilogramos', 'Onzas', 'Libras'].includes(baseUnit)) {
    return ['Gramos', 'Kilogramos', 'Onzas', 'Libras'];
  }
  if (['Mililitros', 'Litros', 'Onzas fluidas', 'Galon'].includes(baseUnit)) {
    return ['Mililitros', 'Litros', 'Onzas fluidas', 'Galon'];
  }
  return [baseUnit];
}
