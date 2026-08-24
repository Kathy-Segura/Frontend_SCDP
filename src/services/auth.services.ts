// Capa de SERVICES para auth: funciones puras que hablan con el backend.
// No debe tener JSX ni React Context — eso vive en /sesion/AuthContext.tsx.

import { apiFetch } from "./apiClient";

export type Usuario = {
  id: number;
  nombre: string;
  email: string;
  rol: string;
};

export type LoginResult = {
  token: string;
  usuario: Usuario;
};

export function loginRequest(email: string, password: string): Promise<LoginResult> {
  return apiFetch<LoginResult>("/auth/login", {
    method: "POST",
    body: { email, password },
    skipAuth: true,
  });
}

export type RegisterPayload = {
  nombre: string;
  email: string;
  password: string;
  rol?: string;
};

export function registerRequest(payload: RegisterPayload): Promise<Usuario> {
  return apiFetch<Usuario>("/auth/register", {
    method: "POST",
    body: payload,
    skipAuth: true,
  });
}

export type ForgotPasswordPayload = {
  email: string;
};

export function forgotPasswordRequest(email: string): Promise<void> {
  return apiFetch<void>("/auth/forgot-password", {
    method: "POST",
    body: { email },
    skipAuth: true,
  });
}

export type ResetPasswordPayload = {
  token: string;
  password: string;
};

export function resetPasswordRequest(token: string, password: string): Promise<void> {
  return apiFetch<void>("/auth/reset-password", {
    method: "POST",
    body: { token, password },
    skipAuth: true,
  });
}