import type { Ingredient, Dish } from "./types";

export const ING_CATEGORIES = [
  "Aceites",
  "Carnes",
  "Condimentos",
  "Embutidos",
  "Frutas",
  "Harinas",
  "Liquidos",
  "Lacteos",
  "Mantequillas",
  "Salsas",
  "Semillas",
  "Vegetales",
  "Panes",
  "Otros",
];

export const DISH_CATEGORIES = [
  "Seleccione",
  "Aderezos",
  "Almuerzo ejecutivo",
  "Bebidas",
  "Bebidas alcohólicas",
  "Bowls",
  "Carnes",
  "Ceviche",
  "Consome",
  "Desayunos",
  "Enchiladas",
  "Ensaladas",
  "Entradas",
  "Especiales de la casa",
  "Guarniciones",
  "Huevos Rancheros",
  "Mantequillas",
  "Marinados",
  "Para compartir",
  "Platos de frutas",
  "Platos fuertes",
  "Postres",
  "Salsas",
  "Sopas",
  "Tacos",
  "Tostones",
  "Otros",
];

export const CHART_COLORS = ["#C0392B", "#2980B9", "#27AE60", "#E67E22", "#8E44AD", "#D35400", "#16A085"];
export const PAGE_SIZE = 6;

export const seedIngredients: Ingredient[] = [
  { id: 1,  name: "Harina de trigo",  unit: "Kilogramos",  costPerUnit: 35,  stock: 50, category: "Harinas"    },
  { id: 2,  name: "Aceite de oliva",  unit: "Litros",      costPerUnit: 250, stock: 12, category: "Aceites"  },
  { id: 3,  name: "Tomate fresco",    unit: "Kilogramos",  costPerUnit: 25,  stock: 30, category: "Vegetales" },
  { id: 4,  name: "Queso mozzarella", unit: "Kilogramos",  costPerUnit: 380, stock: 8,  category: "Lacteos"  },
  { id: 5,  name: "Pechuga de pollo", unit: "Kilogramos",  costPerUnit: 200, stock: 25, category: "Carnes"   },
  { id: 6,  name: "Sal fina",         unit: "Kilogramos",  costPerUnit: 15,  stock: 20, category: "Condimentos"    },
  { id: 7,  name: "Azúcar blanca",    unit: "Kilogramos",  costPerUnit: 28,  stock: 15, category: "Otros"    },
  { id: 8,  name: "Leche entera",     unit: "Litros",      costPerUnit: 30,  stock: 18, category: "Lacteos"  },
  { id: 9,  name: "Pasta spaghetti",  unit: "Kilogramos",  costPerUnit: 55,  stock: 22, category: "Harinas"    },
  { id: 10, name: "Carne molida",     unit: "Kilogramos",  costPerUnit: 280, stock: 10, category: "Carnes"   },
  { id: 11, name: "Cebolla",          unit: "Kilogramos",  costPerUnit: 20,  stock: 35, category: "Vegetales" },
  { id: 12, name: "Ajo",              unit: "Kilogramos",  costPerUnit: 120, stock: 6,  category: "Vegetales" },
];

export const seedDishes: Dish[] = [
  {
    id: 1, name: "Pizza Margherita", category: "Pizzas", price: 380,
    ingredients: [
      { ingredientId: 1, quantity: 0.3 }, { ingredientId: 2, quantity: 0.05 },
      { ingredientId: 3, quantity: 0.2 }, { ingredientId: 4, quantity: 0.15 },
      { ingredientId: 6, quantity: 0.01 },
    ],
  },
  {
    id: 2, name: "Pollo al horno", category: "Carnes", price: 450,
    ingredients: [
      { ingredientId: 5, quantity: 0.35 }, { ingredientId: 2, quantity: 0.03 },
      { ingredientId: 6, quantity: 0.01 }, { ingredientId: 12, quantity: 0.02 },
    ],
  },
  {
    id: 3, name: "Pasta Bolognesa", category: "Pastas", price: 320,
    ingredients: [
      { ingredientId: 9, quantity: 0.2 }, { ingredientId: 10, quantity: 0.15 },
      { ingredientId: 3, quantity: 0.1 }, { ingredientId: 11, quantity: 0.08 },
      { ingredientId: 12, quantity: 0.01 },
    ],
  },
];
