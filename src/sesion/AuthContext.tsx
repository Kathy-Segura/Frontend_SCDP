import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  loginRequest,
  registerRequest,
  forgotPasswordRequest,
  resetPasswordRequest,
  type Usuario,
  type RegisterPayload,
} from "../services/auth.services";
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
  register: (payload: RegisterPayload) => Promise<Usuario>;
  isRegisterLoading: boolean;
  registerError: string | null;
  clearRegisterError: () => void;
  /** Solicita el envío del correo de recuperación de contraseña. */
  forgotPassword: (email: string) => Promise<void>;
  isForgotLoading: boolean;
  forgotError: string | null;
  clearForgotError: () => void;
  /** Restablece la contraseña usando el token recibido por correo. */
  resetPassword: (token: string, password: string) => Promise<void>;
  isResetLoading: boolean;
  resetError: string | null;
  clearResetError: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => getStoredUser<Usuario>());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const [isResetLoading, setIsResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      setUsuario(null);
    }
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

  async function forgotPassword(email: string) {
    setIsForgotLoading(true);
    setForgotError(null);
    try {
      await forgotPasswordRequest(email);
    } catch (err) {
      let message = "No se pudo procesar la solicitud. Intenta de nuevo.";
      if (err instanceof ApiError) {
        if (err.status === 400) {
          message = err.message || "Revisa el correo ingresado.";
        } else if (err.status === 429) {
          message = "Demasiados intentos. Espera un momento antes de volver a intentar.";
        } else if (err.status >= 500) {
          message = "El servidor no esta disponible en este momento. Intenta de nuevo en unos segundos.";
        } else if (err.message) {
          message = err.message;
        }
      } else if (err instanceof TypeError) {
        message = "No se pudo conectar con el servidor. Verifica tu conexion a internet.";
      }
      setForgotError(message);
      throw err;
    } finally {
      setIsForgotLoading(false);
    }
  }

  function clearForgotError() {
    setForgotError(null);
  }

  async function resetPassword(token: string, password: string) {
    setIsResetLoading(true);
    setResetError(null);
    try {
      await resetPasswordRequest(token, password);
    } catch (err) {
      let message = "No se pudo actualizar la contrasena. Intenta de nuevo.";
      if (err instanceof ApiError) {
        if (err.status === 400) {
          message = err.message || "El enlace es invalido o ya expiro. Solicita uno nuevo.";
        } else if (err.status >= 500) {
          message = "El servidor no esta disponible en este momento. Intenta de nuevo en unos segundos.";
        } else if (err.message) {
          message = err.message;
        }
      } else if (err instanceof TypeError) {
        message = "No se pudo conectar con el servidor. Verifica tu conexion a internet.";
      }
      setResetError(message);
      throw err;
    } finally {
      setIsResetLoading(false);
    }
  }

  function clearResetError() {
    setResetError(null);
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
      forgotPassword,
      isForgotLoading,
      forgotError,
      clearForgotError,
      resetPassword,
      isResetLoading,
      resetError,
      clearResetError,
    }),
    [usuario, isLoading, error, isRegisterLoading, registerError, isForgotLoading, forgotError, isResetLoading, resetError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}