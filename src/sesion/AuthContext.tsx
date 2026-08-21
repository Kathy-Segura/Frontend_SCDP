import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { loginRequest, registerRequest, type Usuario, type RegisterPayload } from "../services/auth.services";
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
  /** Registro de un nuevo usuario. No inicia sesion automaticamente: el backend
   *  de /auth/register no devuelve token, solo el usuario creado. */
  register: (payload: RegisterPayload) => Promise<Usuario>;
  isRegisterLoading: boolean;
  registerError: string | null;
  clearRegisterError: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => getStoredUser<Usuario>());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

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

  async function register(payload: RegisterPayload): Promise<Usuario> {
    setIsRegisterLoading(true);
    setRegisterError(null);
    try {
      const nuevoUsuario = await registerRequest(payload);
      return nuevoUsuario;
    } catch (err) {
      let message = "No se pudo crear la cuenta. Intenta de nuevo.";
      if (err instanceof ApiError) {
        if (err.status === 409) {
          message = "Ese correo ya esta registrado.";
        } else if (err.status === 400) {
          message = err.message || "Revisa los datos ingresados.";
        } else if (err.status >= 500) {
          message = "El servidor no esta disponible en este momento. Intenta de nuevo en unos segundos.";
        } else if (err.message) {
          message = err.message;
        }
      } else if (err instanceof TypeError) {
        message = "No se pudo conectar con el servidor. Verifica tu conexion a internet.";
      }
      setRegisterError(message);
      throw err;
    } finally {
      setIsRegisterLoading(false);
    }
  }

  function clearRegisterError() {
    setRegisterError(null);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      usuario,
      isAuthenticated: !!usuario,
      isLoading,
      error,
      login,
      logout,
      register,
      isRegisterLoading,
      registerError,
      clearRegisterError,
    }),
    [usuario, isLoading, error, isRegisterLoading, registerError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
