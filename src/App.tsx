import { useState } from "react";
import type { Ingredient, Dish, Page } from "./types";
import { seedIngredients, seedDishes } from "./constants";
import { Sidebar } from "./components/Sidebar";
import { LoginPage } from "./sesion/LoginPage";
import { IngredientFormPage } from "./components/IngredientFormPage";
import { DishFormPage } from "./components/DishFormPage";
import { IngredientsPage } from "./components/IngredientsPage";
import { DishesPage } from "./components/DishesPage";
import { ChartsPage } from "./components/ChartsPage";
import { ReportsPage } from "./components/ReportsPage";
import { Menu, X } from "lucide-react";
import { AuthProvider, useAuth } from "./sesion/AuthContext";

let nextIngId = seedIngredients.length + 1;
let nextDishId = seedDishes.length + 1;

export default function App() {
  return (
    <AuthProvider>
      <AppGate />
    </AuthProvider>
  );
}

function AppGate() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <LoginPage />;
  return <AppContent />;
}

function AppContent() {
  const [page, setPage] = useState<Page>("form-ingredients");
  const [ingredients, setIngredients] = useState<Ingredient[]>(seedIngredients);
  const [dishes, setDishes] = useState<Dish[]>(seedDishes);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { usuario, logout } = useAuth();

  function addIngredient(data: Omit<Ingredient, "id">) {
    setIngredients((p) => [...p, { id: nextIngId++, ...data }]);
  }
  function addDish(data: Omit<Dish, "id">) {
    setDishes((p) => [...p, { id: nextDishId++, ...data }]);
  }
  function updateIngredient(updated: Ingredient) {
    setIngredients((p) => p.map((i) => i.id === updated.id ? updated : i));
  }
  function updateDish(updated: Dish) {
    setDishes((p) => p.map((d) => d.id === updated.id ? updated : d));
  }
  function deleteIngredient(id: number) {
    setIngredients((p) => p.filter((i) => i.id !== id));
  }
  function deleteDish(id: number) {
    setDishes((p) => p.filter((d) => d.id !== id));
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar page={page} setPage={setPage} onPageChange={setPage} usuario={usuario} onLogout={logout} />
      </div>

      {/* Mobile menu button */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border border-border hover:bg-secondary transition-colors text-foreground"
        >
          <Menu size={24} />
        </button>
      )}

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-y-0 left-0 z-40 md:hidden">
            <Sidebar
              page={page}
              setPage={() => setSidebarOpen(false)}
              onPageChange={(p) => { setPage(p); setSidebarOpen(false); }}
              usuario={usuario}
              onLogout={logout}
            />
          </div>
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden fixed top-4 right-4 z-50 p-2 rounded-lg bg-card border border-border hover:bg-secondary transition-colors text-foreground"
          >
            <X size={24} />
          </button>
        </>
      )}

      {/* Main content */}
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className={page === "reports" ? "flex-1 min-h-0 flex flex-col" : "flex-1 overflow-y-auto"}>
          {page === "form-ingredients" && (
            <IngredientFormPage onAddIngredient={addIngredient} ingredients={ingredients} />
          )}
          {page === "form-dishes" && (
            <DishFormPage onAddDish={addDish} ingredients={ingredients} dishes={dishes} />
          )}
          {page === "ingredients" && (
            <IngredientsPage ingredients={ingredients} onUpdate={updateIngredient} onDelete={deleteIngredient} />
          )}
          {page === "dishes" && (
            <DishesPage dishes={dishes} ingredients={ingredients} onDelete={deleteDish} onUpdate={updateDish} />
          )}
          {page === "charts" && (
            <ChartsPage ingredients={ingredients} dishes={dishes} />
          )}
          {page === "reports" && (
            <ReportsPage ingredients={ingredients} dishes={dishes} />
          )}
        </div>
      </main>
    </div>
  );
}
