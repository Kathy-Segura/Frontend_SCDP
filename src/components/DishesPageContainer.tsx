import { useEffect, useState, useCallback } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  listarPlatillos,
  listarCategoriasPlatillo,
  listarIngredientesDisponibles,
  eliminarPlatillo,
  reactivarPlatillo,
  type PlatilloResumen,
  type CategoriaPlatillo,
  type IngredienteDisponible,
  type EstadoPlatillo,
} from "../services/inventarioDishes.services";
import { listarUnidadesMedida, type UnidadMedida } from "../services/catalogos.services";
import { DishesPage } from "./DishesPage";
import { DishIngredientsModal } from "./DishIngredientsModal";
import { DishEditDrawer } from "./DishEditDrawer";

// Único punto de este módulo que sabe de la API. DishesPage, DishEditDrawer
// y DishIngredientsModal siguen siendo presentacionales.
export function DishesPageContainer() {
  const [platillos, setPlatillos] = useState<PlatilloResumen[]>([]);
  const [categorias, setCategorias] = useState<CategoriaPlatillo[]>([]);
  const [ingredientesDisponibles, setIngredientesDisponibles] = useState<IngredienteDisponible[]>([]);
  const [unidades, setUnidades] = useState<UnidadMedida[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterCategoriaId, setFilterCategoriaId] = useState<number | "todas">("todas");
  const [estado, setEstado] = useState<EstadoPlatillo>("activos");

  const [viewingId, setViewingId] = useState<number | null>(null);
  const [editing, setEditing] = useState<{ id: number; nombre: string } | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<{ id: number; nombre: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const cargarPlatillos = useCallback(async () => {
    try {
      const rows = await listarPlatillos({
        search: search || undefined,
        categoriaId: filterCategoriaId === "todas" ? undefined : filterCategoriaId,
        estado,
      });
      setPlatillos(rows);
    } catch (err: any) {
      setError(err?.message || "No se pudo cargar la lista de platillos.");
    }
  }, [search, filterCategoriaId, estado]);

  // Carga inicial: lista + catálogos que necesitan los modales (una sola vez).
  useEffect(() => {
    let cancelado = false;
    setLoading(true);
    Promise.all([
      listarPlatillos(),
      listarCategoriasPlatillo(),
      listarIngredientesDisponibles(),
      listarUnidadesMedida(),
    ])
      .then(([p, c, i, u]) => {
        if (cancelado) return;
        setPlatillos(p);
        setCategorias(c);
        setIngredientesDisponibles(i);
        setUnidades(u);
      })
      .catch((err) => { if (!cancelado) setError(err?.message || "No se pudo cargar el módulo de platillos."); })
      .finally(() => { if (!cancelado) setLoading(false); });
    return () => { cancelado = true; };
  }, []);

  // Re-consulta la tabla cuando cambia el buscador o el filtro de categoría
  // (después de la carga inicial).
  useEffect(() => {
    if (loading) return;
    cargarPlatillos();
  }, [search, filterCategoriaId, estado]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleDelete(id: number) {
    const dish = platillos.find((p) => p.id === id);
    setConfirmingDelete({ id, nombre: dish?.nombre ?? "este platillo" });
  }

  async function confirmarEliminar() {
    if (!confirmingDelete) return;
    setDeleting(true);
    try {
      await eliminarPlatillo(confirmingDelete.id);
      await cargarPlatillos();
      setConfirmingDelete(null);
    } catch (err: any) {
      setError(err?.message || "No se pudo eliminar el platillo.");
      setConfirmingDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  async function handleReactivate(id: number) {
    try {
      await reactivarPlatillo(id);
      await cargarPlatillos();
    } catch (err: any) {
      setError(err?.message || "No se pudo reactivar el platillo.");
    }
  }

  if (loading) {
    return <div className="p-8 text-sm text-muted-foreground">Cargando platillos…</div>;
  }

  return (
    <div>
      {error && (
        <div className="mx-4 mt-4 sm:mx-6 lg:mx-8 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}
      <DishesPage
        platillos={platillos}
        categorias={categorias}
        search={search}
        setSearch={setSearch}
        filterCategoriaId={filterCategoriaId}
        setFilterCategoriaId={setFilterCategoriaId}
        estado={estado}
        setEstado={setEstado}
        onView={(id) => setViewingId(id)}
        onEdit={(id) => {
          const dish = platillos.find((p) => p.id === id);
          setEditing({ id, nombre: dish?.nombre ?? "" });
        }}
        onDelete={handleDelete}
        onReactivate={handleReactivate}
      />

      {viewingId != null && (
        <DishIngredientsModal
          dishId={viewingId}
          dishName={platillos.find((p) => p.id === viewingId)?.nombre ?? ""}
          onClose={() => setViewingId(null)}
        />
      )}

      {editing && (
        <DishEditDrawer
          dishId={editing.id}
          dishName={editing.nombre}
          categorias={categorias}
          ingredientesDisponibles={ingredientesDisponibles}
          unidades={unidades}
          onSaved={cargarPlatillos}
          onClose={() => setEditing(null)}
        />
      )}

      {confirmingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => !deleting && setConfirmingDelete(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[3px]" />
          <div
            className="relative bg-card rounded-2xl shadow-2xl w-full max-w-sm border border-border overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-6 pb-4 flex gap-3">
              <div className="w-9 h-9 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle size={16} className="text-destructive" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">¿Eliminar este platillo?</p>
                <p className="text-sm text-muted-foreground mt-1">
                  <span className="font-medium text-foreground">{confirmingDelete.nombre}</span> se dará de baja y
                  dejará de aparecer en la lista de platillos activos. No se borra su historial ni su receta —
                  podrás reactivarlo después desde el filtro "Dados de baja".
                </p>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setConfirmingDelete(null)} disabled={deleting}
                className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50">
                Cancelar
              </button>
              <button onClick={confirmarEliminar} disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-destructive text-white text-sm font-semibold hover:bg-destructive/90 active:scale-[0.98] transition-all disabled:opacity-60">
                {deleting ? <Loader2 size={14} className="animate-spin" /> : null}
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
