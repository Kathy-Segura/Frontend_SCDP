import { useEffect, useState, useCallback } from "react";
import type { Ingredient } from "../types";
import type { Categoria, UnidadMedida } from "../services/catalogos.services";
import { listarCategoriasIngrediente, listarUnidadesMedida } from "../services/catalogos.services";
import {
  listarInventario,
  actualizarIngrediente,
  eliminarIngrediente,
  reactivarIngrediente,
} from "../services/inventarioIngredients.services";
import { IngredientsPage } from "./IngredientsPage";

// Wrapper "contenedor": es el único punto de este módulo que sabe de la API.
// IngredientsPage / IngredientEditModal siguen siendo puramente
// presentacionales (reciben datos y callbacks por props).
export function IngredientsPageContainer() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [unidades, setUnidades] = useState<UnidadMedida[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [inv, cats, units] = await Promise.all([
        listarInventario(),
        listarCategoriasIngrediente(),
        listarUnidadesMedida(),
      ]);
      setIngredients(inv);
      setCategorias(cats);
      setUnidades(units);
    } catch (err: any) {
      setError(err?.message || "No se pudo cargar el inventario de ingredientes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  async function handleUpdate(updated: Ingredient) {
    try {
      await actualizarIngrediente(updated.id, {
        nombre: updated.name,
        categoriaId: updated.categoryId,
        unidadId: updated.unitId,
        costoUnitario: updated.costPerUnit,
        stock: updated.stock,
      });
      await cargar(); // se re-lee del backend: stock/valor_total son fuente de verdad allá
    } catch (err: any) {
      setError(err?.message || "No se pudo actualizar el ingrediente.");
    }
  }

  async function handleDelete(id: number) {
    try {
      await eliminarIngrediente(id);
      await cargar();
    } catch (err: any) {
      setError(err?.message || "No se pudo eliminar el ingrediente.");
    }
  }

  async function handleReactivate(id: number) {
    try {
      await reactivarIngrediente(id);
      await cargar();
    } catch (err: any) {
      setError(err?.message || "No se pudo reactivar el ingrediente.");
    }
  }

  if (loading) {
    return <div className="p-8 text-sm text-muted-foreground">Cargando inventario…</div>;
  }

  return (
    <div>
      {error && (
        <div className="mx-4 mt-4 sm:mx-6 lg:mx-8 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}
      <IngredientsPage
        ingredients={ingredients}
        categorias={categorias}
        unidades={unidades}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onReactivate={handleReactivate}
      />
    </div>
  );
}
