// services/ingredientes.ts
import { apiFetch } from "./apiClient";

export type Ingrediente = {
  id: number;
  nombre: string;
  // ...COMPLETAR TODOS LOS METODOS FALTANTES Y ATRIBUTOS DE LA CLASE INGREDIENTES:
};

export function listarIngredientes(): Promise<Ingrediente[]> {
  return apiFetch<Ingrediente[]>("/ingredients");
}

export function crearIngrediente(payload: Omit<Ingrediente, "id">): Promise<Ingrediente> {
  return apiFetch<Ingrediente>("/ingredients", {
    method: "POST",
    body: payload,
  });
}