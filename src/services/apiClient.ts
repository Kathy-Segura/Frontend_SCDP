// Cliente API centralizado para CDP (Costeo BC).
// Toda llamada al backend debería pasar por acá para que el token JWT.
// IMPORTANTE: este archivo es parte de la capa de SERVICES: solo lógica
// se adjunte automáticamente y los errores lleguen en un formato consistente,
// nunca JSX ni React Context (eso vive en /sesion).

const RAW_BASE_URL = import.meta.env.VITE_API_URL;  
export const API_BASE_URL = (RAW_BASE_URL || "https://backend-scdp.onrender.com/api").replace(/\/+$/, "");

const TOKEN_KEY = "cdp_token";
const USER_KEY = "cdp_usuario";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getStoredUser<T = unknown>(): T | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setStoredUser(user: unknown) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// Se ejecuta cuando el backend responde 401 en una llamada que sí requería
// sesión. AuthContext (en /sesion) se suscribe a esto para cerrar la sesión
// localmente sin que cada componente tenga que manejarlo.
type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  onUnauthorized = handler;
}

type ApiOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  /** true para endpoints públicos como /auth/login y /auth/register */
  skipAuth?: boolean;
};

/**
 * Wrapper de fetch para el backend de CDP.
 * - Adjunta `Authorization: Bearer <token>` salvo que skipAuth sea true.
 * - Serializa/parsea JSON automáticamente.
 * - El backend responde siempre { status: 'ok' | 'error', data?, message? };
 *   esta función devuelve directamente `data` y lanza ApiError si status !== ok.
 */
export async function apiFetch<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const { body, skipAuth, headers, ...rest } = options;

  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string> | undefined),
  };

  if (!skipAuth) {
    const token = getToken();
    if (token) finalHeaders["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let payload: any = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const message = payload?.message || `Error ${response.status}`;
    if (response.status === 401 && !skipAuth) {
      clearToken();
      onUnauthorized?.();
    }
    throw new ApiError(response.status, message);
  }

  return (payload?.data ?? payload) as T;
}
