// Entidades ya alineadas a los campos que devuelve el backend,
// y se añaden los campos *Id que el backend necesita para escribir).
export type Login = {
 id: number;
 nombre: string;
 email: string;
 password_hash: string;
};

export type Ingredient = {
  id: number;
  name: string;              // nombre
  unit: string;               // unidad
  unitId?: number;            // unidad_id
  costPerUnit: number;        // costo_unitario
  stock: number;              // stock_actual
  stockMinimo?: number;       // stock_minimo
  category: string;           // categoria
  categoryId?: number;        // categoria_id
  valorTotal?: number;        // valor_total
  bajoStockMinimo?: boolean;  // bajo_stock_minimo
  active?: boolean;           // activo
  estado?: string;            // "Activo" | "Descontinuado"
};

export type DishIngredient = {
  ingredientId: number;
  quantity: number;
  selectedUnit?: string;       // nombre de unidad, solo para mostrar
  unitId?: number;              // unidad_id -> lo que de verdad exige el backend
};

export type Dish = {
  id: number;
  name: string;                 // nombre / platillo
  category: string;             // categoria
  categoryId?: number;          // categoria_id
  restaurantId?: number;        // restaurante_id
  price: number;                 // precio_venta
  cost?: number;                 // costo (ya calculado por el backend)
  marginBruto?: number;          // margen_bruto
  marginPct?: number;            // pct_margen_costo / margen_porcentaje_venta
  ingredients: DishIngredient[]; // receta (se llena al ver/editar detalle)
};

export type Category = { id: number; name: string };
export type Unit = { id: number; code: string; name: string; type: string; baseFactor?: number };
export type Restaurant = { id: number; name: string };

export type AuthUser = { id: number; nombre: string; email: string; rol: string };

export type Page = "form-ingredients" | "form-dishes" | "ingredients" | "dishes" | "charts" | "reports";
