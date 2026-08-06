import { UtensilsCrossed, ShoppingBasket, Plus, Package, ChefHat, BarChart2, FileText, LogOut } from "lucide-react";
import type { Page } from "../types";
import { SB } from "../styles/shared";
import type { Usuario } from "../sesion/AuthContext";

const nav: { id: Page; label: string; desc: string; icon: React.ReactNode; group: string }[] = [
  { id: "form-ingredients", label: "Nuevo Insumo",    desc: "Registrar ingrediente", icon: <ShoppingBasket size={15} />, group: "Formularios" },
  { id: "form-dishes",      label: "Crear Platillo",  desc: "Registrar platillo",    icon: <Plus size={15} />,           group: "Formularios" },
  { id: "ingredients",      label: "Ingredientes",    desc: "Inventario completo",   icon: <Package size={15} />,        group: "Inventario" },
  { id: "dishes",           label: "Platillos",       desc: "Menú y costos",         icon: <ChefHat size={15} />,        group: "Inventario" },
  { id: "charts",           label: "Analítica",       desc: "Gráficos y KPIs",       icon: <BarChart2 size={15} />,      group: "Reportes" },
 ];

export function Sidebar({
  page,
  setPage,
  onPageChange,
  usuario,
  onLogout,
}: {
  page: Page;
  setPage: (p: Page) => void;
  onPageChange: (p: Page) => void;
  usuario?: Usuario | null;
  onLogout?: () => void;
}) {
  const handleNavClick = (pageId: Page) => {
    onPageChange(pageId);
    setPage(pageId);
  };

  return (
    <aside
      className="w-[240px] shrink-0 flex flex-col h-full"
      style={{ background: SB.bg, fontFamily: "'Inter', sans-serif", borderRight: `1px solid ${SB.border}` }}
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-5" style={{ borderBottom: `1px solid ${SB.border}` }}>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `linear-gradient(135deg, ${SB.logo} 0%, #C04020 100%)`, boxShadow: "0 4px 12px rgba(224,90,48,0.35)" }}
          >
            <UtensilsCrossed size={18} color="#fff" />
          </div>
          <div>
            <p className="text-[15px] font-bold leading-tight" style={{ color: "#F9FAFB" }}>CPD</p>
            <p className="text-[11px] leading-tight mt-0.5" style={{ color: SB.muted }}>Gestión de cocina</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {["Formularios", "Inventario", "Reportes"].map((group) => {
          const items = nav.filter((n) => n.group === group);
          return (
            <div key={group} className="mb-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] px-3 mb-1.5" style={{ color: SB.muted }}>
                {group}
              </p>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const active = page === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all duration-150"
                      style={{
                        background: active ? SB.accentBg : "transparent",
                        border:     `1px solid ${active ? "rgba(224,90,48,0.25)" : "transparent"}`,
                        color:      active ? SB.textActive : SB.text,
                      }}
                      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = SB.bgActive; }}
                      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                      <span
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: active ? SB.accent : "rgba(255,255,255,0.06)", color: active ? "#fff" : SB.text }}
                      >
                        {item.icon}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold leading-tight">{item.label}</p>
                        <p className="text-[10px] leading-tight mt-0.5" style={{ color: active ? "rgba(249,250,251,0.5)" : SB.muted }}>
                          {item.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="px-4 pb-4" style={{ borderTop: `1px solid ${SB.border}`, paddingTop: "12px" }}>
        {usuario && (
          <div className="flex items-center justify-between gap-2 mb-2 px-1">
            <div className="min-w-0">
              <p className="text-[12px] font-semibold truncate" style={{ color: SB.textActive }}>{usuario.nombre}</p>
              <p className="text-[10px] truncate" style={{ color: SB.muted }}>{usuario.email}</p>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                title="Cerrar sesión"
                className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                style={{ color: SB.text, background: "rgba(255,255,255,0.06)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = SB.bgActive; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
              >
                <LogOut size={14} />
              </button>
            )}
          </div>
        )}
        <p className="text-[11px] px-1" style={{ color: SB.muted }}>v2.1.0 · 2026</p>
      </div>
    </aside>
  );
}