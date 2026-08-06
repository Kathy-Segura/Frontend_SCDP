import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { loginRequest, type Usuario } from "../services/auth.services";
import {
  ApiError,
  getToken,
  setToken,
  clearToken,
  getStoredUser,
  setStoredUser,
  setUnauthorizedHandler,
} from "../services/apiClient";

export type { Usuario };

type AuthContextValue = {
  usuario: Usuario | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => getStoredUser<Usuario>());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Si no hay token guardado, no puede haber sesión aunque quede un usuario cacheado
    if (!getToken()) {
      setUsuario(null);
    }
    // Cuando apiClient detecta un 401, cerramos sesión localmente
    setUnauthorizedHandler(() => setUsuario(null));
    return () => setUnauthorizedHandler(null);
  }, []);

  async function login(email: string, password: string) {
    setIsLoading(true);
    setError(null);
    try {
      const data = await loginRequest(email, password);
      setToken(data.token);
      setStoredUser(data.usuario);
      setUsuario(data.usuario);
    } catch (err) {
      let message = "No se pudo iniciar sesion. Intenta de nuevo.";
      if (err instanceof ApiError) {
        if (err.status === 401) {
          message = "Correo o contrasena incorrectos.";
        } else if (err.status === 429) {
          message = "Demasiados intentos. Espera un momento antes de volver a intentar.";
        } else if (err.status >= 500) {
          message = "El servidor no esta disponible en este momento. Intenta de nuevo en unos segundos.";
        } else if (err.message) {
          message = err.message;
        }
      } else if (err instanceof TypeError) {
        // fetch lanza TypeError cuando no hay conexion o el servidor no responde
        message = "No se pudo conectar con el servidor. Verifica tu conexion a internet.";
      }
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  function logout() {
    clearToken();
    setUsuario(null);
  }

  const value = useMemo<AuthContextValue>(
    () => ({ usuario, isAuthenticated: !!usuario, isLoading, error, login, logout }),
    [usuario, isLoading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
