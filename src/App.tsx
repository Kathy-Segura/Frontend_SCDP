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
import { ReportsPage } from "./components/ReportsPage";
import { Menu, X } from "lucide-react";
import { AuthProvider, useAuth } from "./sesion/AuthContext";
import { ChartsPageContainer } from "./components/ChartsPageContainer";
import { DishesPageContainer } from "./components/DishesPageContainer";
import { RegisterPage } from "./sesion/RegisterPage";
import { ForgotPasswordPage } from "./sesion/ForgotPasswordPage";
import { ResetPasswordPage } from "./sesion/ResetPasswordPage";

let nextIngId = seedIngredients.length + 1;
let nextDishId = seedDishes.length + 1;

export default function App() {
  return (
    <AuthProvider>
      <AppGate />
    </AuthProvider>
  );
}

type AuthView = "login" | "register" | "forgot-password" | "reset-password";

function AppGate() {
  const { isAuthenticated } = useAuth();
  const [view, setView] = useState<AuthView>("login");
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  // Si el usuario llega desde el enlace del correo (?token=...), lo mandamos
  // directo a la pantalla de nueva contrasena, sin pasar por login.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("token")) {
      setView("reset-password");
    }
  }, []);

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

  if (view === "forgot-password") {
    return <ForgotPasswordPage onSwitchToLogin={() => setView("login")} />;
  }

  if (view === "reset-password") {
    return (
      <ResetPasswordPage
        onSwitchToLogin={() => {
          // Limpia el ?token= de la URL al volver al login para que no quede pegado
          window.history.replaceState({}, "", window.location.pathname);
          setView("login");
        }}
      />
    );
  }

  return (
    <LoginPage
      onSwitchToRegister={() => setView("register")}
      onSwitchToForgotPassword={() => setView("forgot-password")}
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
      <div className="hidden md:block">
        <Sidebar page={page} setPage={setPage} onPageChange={setPage} usuario={usuario} onLogout={logout} />
      </div>

      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border border-border hover:bg-secondary transition-colors text-foreground"
        >
          <Menu size={24} />
        </button>
      )}

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

      <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className={page === "reports" ? "flex-1 min-h-0 flex flex-col" : "flex-1 overflow-y-auto"}>
          {page === "form-ingredients" && <IngredientFormPage />}
          {page === "form-dishes" && <DishFormPage />}
          {page === "ingredients" && <IngredientsPageContainer />}
          {page === "dishes" && <DishesPageContainer />}
          {page === "charts" && <ChartsPageContainer />}
          {page === "reports" && <ReportsPage ingredients={ingredients} dishes={dishes} />}
        </div>
      </main>
    </div>
  );
}