import { useEffect, useState } from "react";
import type { Ingredient, Dish, Page } from "./types";
import { seedIngredients, seedDishes } from "./constants";
import { setUnidadesCatalogo } from "./utils";
import { listarUnidadesMedida } from "./services/catalogos.services";
import { Sidebar } from "./components/Sidebar";
import { LoginPage } from "./sesion/LoginPage";
import { IngredientFormPage } from "./components/IngredientFormPage";
import { DishFormPage } from "./components/DishFormPage";
import { IngredientsPageContainer } from "./components/IngredientsPageContainer";
import { DishesPage } from "./components/DishesPage";
import { ChartsPage } from "./components/ChartsPage";
import { ReportsPage } from "./components/ReportsPage";
import { Menu, X } from "lucide-react";
import { AuthProvider, useAuth } from "./sesion/AuthContext";
import { ChartsPageContainer } from "./components/ChartsPageContainer";
import { DishesPageContainer } from "./components/DishesPageContainer";
import { RegisterPage } from "./sesion/RegisterPage";

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
  const [view, setView] = useState<"login" | "register">("login");
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  if (isAuthenticated) return <AppContent />;

  if (view === "register") {
    return (
      <RegisterPage
        onSwitchToLogin={() => setView("login")}
        onRegistered={(email) => {
          setRegisteredEmail(email);
          setView("login");
        }}
      />
    );
  }

  return (
    <LoginPage
      onSwitchToRegister={() => setView("register")}
      successMessage={
        registeredEmail
          ? `Cuenta creada correctamente. Ya puedes iniciar sesion con ${registeredEmail}.`
          : undefined
      }
    />
  );
}

function AppContent() {
  const [page, setPage] = useState<Page>("form-ingredients");
  const [ingredients, setIngredients] = useState<Ingredient[]>(seedIngredients);
  const [dishes, setDishes] = useState<Dish[]>(seedDishes);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { usuario, logout } = useAuth();

  // Catalogo de unidades de medida: se carga una sola vez por sesion y se
  // cachea en utils.ts para que Ingredientes y Platillos compartan la misma
  // logica de conversion (convertToBaseUnit / getCompatibleUnits) sin que
  // cada modulo tenga que pedirlo por su cuenta.
  useEffect(() => {
    listarUnidadesMedida()
      .then(setUnidadesCatalogo)
      .catch(() => { /* no bloquea la app: los modulos tienen su propio fallback */ });
  }, []);

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
            <IngredientFormPage/>
          )}
          {page === "form-dishes" && (
            <DishFormPage />
          )}
          {page === "ingredients" && (
            <IngredientsPageContainer/>
          )}
          {page === "dishes" && (
            <DishesPageContainer/>
          )}
          {page === "charts" && (
            <ChartsPageContainer/> //eliminar props ingredients={ingredients} dishes={dishes} 
          )}
          {page === "reports" && (
            <ReportsPage ingredients={ingredients} dishes={dishes} />
          )}
        </div>
      </main>
    </div>
  );
}
