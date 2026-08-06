import { useState, useRef } from "react";
import {
  Printer, LayoutDashboard, ShoppingBasket, ChefHat, TrendingUp,
  AlertTriangle, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import type { Ingredient, Dish } from "../types";
import { MONO } from "../styles/shared";
import { fmt, cs, clsx, dishCost } from "../utils";

const OR = "#E05A30";
const OR_BG = "#FFF7ED";
const OR_BORDER = "#FDBA74";
const TH_BG = "#F3F4F6";
const TH_TEXT = "#374151";
const FOOT_BG = "#FFF1EC";

type ReportType = "summary" | "ingredients" | "dish-costs" | "gains";

const TABS: { id: ReportType; label: string; shortLabel: string; icon: React.ReactNode }[] = [
  { id: "summary",     label: "Resumen General",            shortLabel: "Resumen",    icon: <LayoutDashboard size={14} /> },
  { id: "ingredients", label: "Inventario de Ingredientes", shortLabel: "Inventario", icon: <ShoppingBasket size={14} /> },
  { id: "dish-costs",  label: "Costos por Platillo",        shortLabel: "Costos",     icon: <ChefHat size={14} /> },
  { id: "gains",       label: "Análisis de Ganancias",      shortLabel: "Ganancias",  icon: <TrendingUp size={14} /> },
];

function StatCard({ label, value, sub, accent, icon }: {
  label: string; value: string; sub?: string; accent?: boolean; icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border p-5 flex flex-col gap-1"
      style={accent ? { borderColor: OR_BORDER, background: OR_BG } : { borderColor: "var(--border)", background: "#fff" }}>
      {icon && (
        <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-1"
          style={{ background: accent ? `${OR}18` : "#F3F4F6", color: accent ? OR : TH_TEXT }}>
          {icon}
        </div>
      )}
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-2xl font-extrabold leading-none" style={{ ...MONO, color: accent ? OR : "var(--foreground)" }}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3 mt-7 first:mt-0">
      <div className="w-1 h-4 rounded-full" style={{ background: OR }} />
      <p className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: OR }}>{children}</p>
    </div>
  );
}

function ReportTable({ headers, rows, footerRow }: {
  headers: string[]; rows: React.ReactNode; footerRow?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl overflow-hidden border border-border">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ background: TH_BG }}>
              {headers.map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider whitespace-nowrap border-b border-border"
                  style={{ color: TH_TEXT }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">{rows}</tbody>
          {footerRow && (
            <tfoot>
              <tr style={{ background: FOOT_BG, borderTop: `2px solid ${OR}40` }}>{footerRow}</tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

const CAT_COLORS: Record<string, string> = {
  Secos: "#7C3AED", Lácteos: "#0369A1", Carnes: "#B45309",
  Verduras: "#16A34A", Aceites: "#D97706", Bebidas: "#0891B2",
  Otros: "#6B7280", Entradas: "#7C3AED", Sopas: "#0369A1",
  Pizzas: "#DC2626", Pastas: "#D97706", Ensaladas: "#16A34A",
  Postres: "#DB2777",
};

function Cat({ v }: { v: string }) {
  const c = CAT_COLORS[v] ?? "#6B7280";
  return (
    <span className="inline-flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c }} />
      <span style={{ color: c, fontSize: 12, fontWeight: 600 }}>{v}</span>
    </span>
  );
}

function MarginBadge({ pct }: { pct: number }) {
  if (pct > 50) return <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${OR}18`, color: OR }}>Excelente</span>;
  if (pct > 25) return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Aceptable</span>;
  return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Bajo</span>;
}

function MarginBar({ pct }: { pct: number }) {
  const clamped = Math.max(0, Math.min(100, pct));
  const color = pct > 50 ? OR : pct > 25 ? "#D97706" : "#DC2626";
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 rounded-full bg-secondary/60 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${clamped}%`, background: color }} />
      </div>
      <span className="text-xs font-semibold shrink-0" style={{ ...MONO, color }}>{fmt(pct)}%</span>
    </div>
  );
}

function ReportSummary({ ingredients, dishes }: { ingredients: Ingredient[]; dishes: Dish[] }) {
  const totalInvVal = ingredients.reduce((s, i) => s + i.costPerUnit * i.stock, 0);
  const lowStock    = ingredients.filter((i) => i.stock < 10);
  const totalRev    = dishes.reduce((s, d) => s + d.price, 0);
  const totalCost   = dishes.reduce((s, d) => s + dishCost(d, ingredients), 0);
  const totalGain   = totalRev - totalCost;
  const avgMargin   = dishes.length
    ? dishes.reduce((s, d) => { const c = dishCost(d, ingredients); return s + (d.price > 0 ? ((d.price - c) / d.price) * 100 : 0); }, 0) / dishes.length
    : 0;

  const topDishes = [...dishes].sort((a, b) => {
    const ma = a.price > 0 ? (a.price - dishCost(a, ingredients)) / a.price : 0;
    const mb = b.price > 0 ? (b.price - dishCost(b, ingredients)) / b.price : 0;
    return mb - ma;
  }).slice(0, 5);

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
        <StatCard label="Ingredientes" value={String(ingredients.length)} sub={`${lowStock.length} con stock bajo`} icon={<ShoppingBasket size={14} />} />
        <StatCard label="Valor inventario" value={cs(totalInvVal)} sub="Costo total en bodega" icon={<LayoutDashboard size={14} />} />
        <StatCard label="Platillos en menú" value={String(dishes.length)} sub={`${new Set(dishes.map(d => d.category)).size} categorías`} icon={<ChefHat size={14} />} />
        <StatCard label="Ganancia potencial" value={cs(totalGain)} sub={`Margen prom. ${fmt(avgMargin)}%`} icon={<TrendingUp size={14} />} accent />
      </div>

      <SectionTitle>Resumen financiero</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
        {[
          { label: "Ingresos proyectados",   val: cs(totalRev),             icon: <ArrowUpRight size={14} />,   color: "#16A34A" },
          { label: "Costo total producción", val: cs(totalCost),            icon: <ArrowDownRight size={14} />, color: "#DC2626" },
          { label: "Margen promedio global", val: `${fmt(avgMargin)}%`,     icon: <TrendingUp size={14} />,     color: OR },
        ].map((k) => (
          <div key={k.label} className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${k.color}15`, color: k.color }}>{k.icon}</div>
            <div>
              <p className="text-[11px] text-muted-foreground">{k.label}</p>
              <p className="text-base font-bold" style={{ ...MONO, color: k.color }}>{k.val}</p>
            </div>
          </div>
        ))}
      </div>

      <SectionTitle>Top 5 platillos más rentables</SectionTitle>
      <ReportTable
        headers={["#", "Platillo", "Categoría", "Precio venta", "Costo prod.", "Ganancia", "Margen"]}
        rows={topDishes.map((d, i) => {
          const cost = dishCost(d, ingredients);
          const gain = d.price - cost;
          const mp   = d.price > 0 ? (gain / d.price) * 100 : 0;
          return (
            <tr key={d.id} className="hover:bg-secondary/20 transition-colors">
              <td className="px-4 py-2.5 text-xs text-muted-foreground" style={MONO}>{i + 1}</td>
              <td className="px-4 py-2.5 font-semibold text-foreground">{d.name}</td>
              <td className="px-4 py-2.5"><Cat v={d.category} /></td>
              <td className="px-4 py-2.5" style={MONO}>{cs(d.price)}</td>
              <td className="px-4 py-2.5 text-muted-foreground" style={MONO}>{cs(cost)}</td>
              <td className="px-4 py-2.5 font-semibold" style={{ ...MONO, color: OR }}>{cs(gain)}</td>
              <td className="px-4 py-2.5"><MarginBar pct={mp} /></td>
            </tr>
          );
        })}
      />

      {lowStock.length > 0 && (
        <>
          <SectionTitle>Alertas de stock bajo</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {lowStock.map((i) => (
              <div key={i.id} className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-amber-200 bg-amber-50">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={13} className="text-amber-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900">{i.name}</p>
                    <p className="text-[11px] text-amber-600">{i.category}</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-amber-700 shrink-0 ml-2" style={MONO}>{i.stock} {i.unit}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ReportIngredients({ ingredients }: { ingredients: Ingredient[] }) {
  const totalVal = ingredients.reduce((s, i) => s + i.costPerUnit * i.stock, 0);
  const lowStock = ingredients.filter((i) => i.stock < 10);
  const byCat: Record<string, Ingredient[]> = {};
  ingredients.forEach((i) => { (byCat[i.category] = byCat[i.category] ?? []).push(i); });

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-2">
        <StatCard label="Total insumos" value={String(ingredients.length)} sub="Registrados en sistema" icon={<ShoppingBasket size={14} />} />
        <StatCard label="Valor en inventario" value={cs(totalVal)} sub="Suma de stock × costo" icon={<TrendingUp size={14} />} accent />
        <StatCard label="Stock bajo" value={String(lowStock.length)} sub={lowStock.length > 0 ? "Requieren reposición" : "Todo en orden"} icon={<AlertTriangle size={14} />} />
      </div>

      {lowStock.length > 0 && (
        <div className="mb-4 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 flex items-start gap-3">
          <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            <span className="font-semibold">Reposición urgente:</span>{" "}
            {lowStock.map((i) => `${i.name} (${i.stock} ${i.unit})`).join(" · ")}
          </p>
        </div>
      )}

      <SectionTitle>Inventario completo</SectionTitle>
      <ReportTable
        headers={["#", "Ingrediente", "Categoría", "Unidad", "C$ / Unidad", "Stock", "Valor total"]}
        rows={ingredients.map((ing, idx) => (
          <tr key={ing.id} className="hover:bg-secondary/20 transition-colors">
            <td className="px-4 py-2.5 text-xs text-muted-foreground" style={MONO}>{String(idx + 1).padStart(2, "0")}</td>
            <td className="px-4 py-2.5 font-medium text-foreground">{ing.name}</td>
            <td className="px-4 py-2.5"><Cat v={ing.category} /></td>
            <td className="px-4 py-2.5 text-muted-foreground">{ing.unit}</td>
            <td className="px-4 py-2.5" style={MONO}>{cs(ing.costPerUnit)}</td>
            <td className="px-4 py-2.5">
              <span className={clsx("font-medium", ing.stock < 10 ? "text-amber-600" : "text-foreground")} style={MONO}>{ing.stock}</span>
              {ing.stock < 10 && <AlertTriangle size={10} className="inline ml-1 text-amber-500" />}
            </td>
            <td className="px-4 py-2.5 font-semibold text-foreground" style={MONO}>{cs(ing.costPerUnit * ing.stock)}</td>
          </tr>
        ))}
        footerRow={
          <>
            <td colSpan={6} className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide" style={{ color: TH_TEXT }}>Valor total inventario</td>
            <td className="px-4 py-3 font-extrabold" style={{ ...MONO, color: OR }}>{cs(totalVal)}</td>
          </>
        }
      />

      <SectionTitle>Valor por categoría</SectionTitle>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Object.entries(byCat).map(([cat, items]) => {
          const catVal = items.reduce((s, i) => s + i.costPerUnit * i.stock, 0);
          const c = CAT_COLORS[cat] ?? "#6B7280";
          return (
            <div key={cat} className="rounded-xl border border-border bg-white px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c }} />
                <p className="text-xs font-semibold" style={{ color: c }}>{cat}</p>
              </div>
              <p className="text-base font-extrabold text-foreground" style={MONO}>{cs(catVal)}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{items.length} insumo{items.length !== 1 ? "s" : ""}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReportDishCosts({ dishes, ingredients }: { dishes: Dish[]; ingredients: Ingredient[] }) {
  const totalCost  = dishes.reduce((s, d) => s + dishCost(d, ingredients), 0);
  const totalPrice = dishes.reduce((s, d) => s + d.price, 0);
  const totalGain  = totalPrice - totalCost;

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
        <StatCard label="Platillos en menú" value={String(dishes.length)} icon={<ChefHat size={14} />} />
        <StatCard label="Precio venta total" value={cs(totalPrice)} sub="Suma de precios" />
        <StatCard label="Costo total producción" value={cs(totalCost)} sub="Suma de insumos" />
        <StatCard label="Ganancia bruta" value={cs(totalGain)} sub={`Margen ${fmt(totalPrice > 0 ? (totalGain / totalPrice) * 100 : 0)}%`} accent />
      </div>

      <SectionTitle>Resumen de costos</SectionTitle>
      <ReportTable
        headers={["Platillo", "Categoría", "# Insumos", "Costo prod.", "Precio venta", "Ganancia", "Margen"]}
        rows={dishes.map((dish) => {
          const cost = dishCost(dish, ingredients);
          const gain = dish.price - cost;
          const mp   = dish.price > 0 ? ((dish.price - cost) / dish.price) * 100 : 0;
          return (
            <tr key={dish.id} className="hover:bg-secondary/20 transition-colors">
              <td className="px-4 py-2.5 font-semibold text-foreground">{dish.name}</td>
              <td className="px-4 py-2.5"><Cat v={dish.category} /></td>
              <td className="px-4 py-2.5 text-muted-foreground text-center">{(dish.ingredients ?? []).length}</td>
              <td className="px-4 py-2.5" style={MONO}>{cs(cost)}</td>
              <td className="px-4 py-2.5" style={MONO}>{cs(dish.price)}</td>
              <td className="px-4 py-2.5 font-semibold" style={{ ...MONO, color: OR }}>{cs(gain)}</td>
              <td className="px-4 py-2.5"><MarginBar pct={mp} /></td>
            </tr>
          );
        })}
        footerRow={
          <>
            <td className="px-4 py-3 font-bold text-sm" style={{ color: TH_TEXT }}>Totales</td>
            <td colSpan={2} />
            <td className="px-4 py-3 font-bold" style={{ ...MONO, color: TH_TEXT }}>{cs(totalCost)}</td>
            <td className="px-4 py-3 font-bold" style={{ ...MONO, color: TH_TEXT }}>{cs(totalPrice)}</td>
            <td className="px-4 py-3 font-bold" style={{ ...MONO, color: OR }}>{cs(totalGain)}</td>
            <td className="px-4 py-3 font-bold" style={{ ...MONO, color: OR }}>
              {fmt(totalPrice > 0 ? (totalGain / totalPrice) * 100 : 0)}%
            </td>
          </>
        }
      />

      <SectionTitle>Desglose por platillo</SectionTitle>
      <div className="space-y-4">
        {dishes.map((dish) => {
          const cost = dishCost(dish, ingredients);
          const mp   = dish.price > 0 ? ((dish.price - cost) / dish.price) * 100 : 0;
          return (
            <div key={dish.id} className="rounded-xl border border-border overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3" style={{ background: OR_BG, borderBottom: "1px solid var(--border)" }}>
                <div>
                  <p className="font-bold text-foreground">{dish.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5"><Cat v={dish.category} /></p>
                </div>
                <div className="flex items-center gap-4 text-right">
                  {[
                    { label: "Precio", val: cs(dish.price), color: "text-foreground" },
                    { label: "Costo",  val: cs(cost),       color: "text-muted-foreground" },
                  ].map((k) => (
                    <div key={k.label}>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{k.label}</p>
                      <p className={clsx("text-sm font-bold", k.color)} style={MONO}>{k.val}</p>
                    </div>
                  ))}
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Margen</p>
                    <p className="text-sm font-bold" style={{ ...MONO, color: OR }}>{fmt(mp)}%</p>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-secondary/30 border-b border-border">
                      {["Ingrediente", "Cantidad", "C$/Unidad", "Subtotal", "% del costo"].map((h) => (
                        <th key={h} className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(dish.ingredients ?? []).map((di) => {
                      const ing = ingredients.find((i) => i.id === di.ingredientId);
                      if (!ing) return null;
                      const sub = ing.costPerUnit * di.quantity;
                      const pct = cost > 0 ? (sub / cost) * 100 : 0;
                      return (
                        <tr key={di.ingredientId} className="hover:bg-secondary/10">
                          <td className="px-4 py-2 font-medium text-foreground">{ing.name}</td>
                          <td className="px-4 py-2 text-muted-foreground" style={MONO}>{di.quantity} {ing.unit}</td>
                          <td className="px-4 py-2" style={MONO}>{cs(ing.costPerUnit)}</td>
                          <td className="px-4 py-2 font-semibold text-foreground" style={MONO}>{cs(sub)}</td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 rounded-full bg-secondary/60 max-w-[60px]">
                                <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: OR }} />
                              </div>
                              <span className="text-xs text-muted-foreground" style={MONO}>{fmt(pct)}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReportGains({ dishes, ingredients }: { dishes: Dish[]; ingredients: Ingredient[] }) {
  const sorted = [...dishes].sort((a, b) => {
    const ma = a.price > 0 ? (a.price - dishCost(a, ingredients)) / a.price : 0;
    const mb = b.price > 0 ? (b.price - dishCost(b, ingredients)) / b.price : 0;
    return mb - ma;
  });
  const totalPrice = sorted.reduce((s, d) => s + d.price, 0);
  const totalCost  = sorted.reduce((s, d) => s + dishCost(d, ingredients), 0);
  const totalGain  = totalPrice - totalCost;
  const avgMargin  = totalPrice > 0 ? (totalGain / totalPrice) * 100 : 0;

  const excellent  = sorted.filter((d) => { const c = dishCost(d, ingredients); return d.price > 0 && ((d.price - c) / d.price) * 100 > 50; });
  const acceptable = sorted.filter((d) => { const c = dishCost(d, ingredients); const p = d.price > 0 ? ((d.price - c) / d.price) * 100 : 0; return p > 25 && p <= 50; });
  const low        = sorted.filter((d) => { const c = dishCost(d, ingredients); return d.price > 0 ? ((d.price - c) / d.price) * 100 <= 25 : true; });

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
        <StatCard label="Precio venta total" value={cs(totalPrice)} sub="Suma del menú completo" />
        <StatCard label="Costo producción" value={cs(totalCost)} sub="Total de insumos" />
        <StatCard label="Margen promedio" value={`${fmt(avgMargin)}%`} sub="Sobre precio de venta" />
        <StatCard label="Ganancia potencial" value={cs(totalGain)} sub="Si se vende todo" accent />
      </div>

      <SectionTitle>Distribución de rentabilidad</SectionTitle>
      <div className="grid grid-cols-3 gap-3 mb-2">
        {[
          { label: "Excelente", sub: "Margen > 50%",  items: excellent,  color: OR,        bg: OR_BG,     border: OR_BORDER },
          { label: "Aceptable", sub: "Margen 25–50%", items: acceptable, color: "#D97706", bg: "#FFFBEB", border: "#FCD34D" },
          { label: "Bajo",      sub: "Margen < 25%",  items: low,        color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
        ].map((g) => (
          <div key={g.label} className="rounded-xl border p-4" style={{ background: g.bg, borderColor: g.border }}>
            <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: g.color }}>{g.label}</p>
            <p className="text-3xl font-extrabold" style={{ ...MONO, color: g.color }}>{g.items.length}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{g.sub}</p>
            {g.items.length > 0 && (
              <p className="text-[11px] mt-1 truncate" style={{ color: g.color }}>
                {g.items.map((d) => d.name).join(", ")}
              </p>
            )}
          </div>
        ))}
      </div>

      <SectionTitle>Análisis por platillo</SectionTitle>
      <ReportTable
        headers={["#", "Platillo", "Categoría", "Costo prod.", "Precio venta", "Ganancia", "Margen", "Estado"]}
        rows={sorted.map((dish, idx) => {
          const cost = dishCost(dish, ingredients);
          const gain = dish.price - cost;
          const mp   = dish.price > 0 ? (gain / dish.price) * 100 : 0;
          return (
            <tr key={dish.id} className="hover:bg-secondary/20 transition-colors">
              <td className="px-4 py-2.5 text-xs text-muted-foreground" style={MONO}>{idx + 1}</td>
              <td className="px-4 py-2.5 font-semibold text-foreground">{dish.name}</td>
              <td className="px-4 py-2.5"><Cat v={dish.category} /></td>
              <td className="px-4 py-2.5 text-muted-foreground" style={MONO}>{cs(cost)}</td>
              <td className="px-4 py-2.5 text-foreground" style={MONO}>{cs(dish.price)}</td>
              <td className="px-4 py-2.5 font-semibold" style={{ ...MONO, color: OR }}>{cs(gain)}</td>
              <td className="px-4 py-2.5"><MarginBar pct={mp} /></td>
              <td className="px-4 py-2.5"><MarginBadge pct={mp} /></td>
            </tr>
          );
        })}
        footerRow={
          <>
            <td colSpan={3} className="px-4 py-3 font-bold text-sm" style={{ color: TH_TEXT }}>Totales / Promedios</td>
            <td className="px-4 py-3 font-bold" style={{ ...MONO, color: TH_TEXT }}>{cs(totalCost)}</td>
            <td className="px-4 py-3 font-bold" style={{ ...MONO, color: TH_TEXT }}>{cs(totalPrice)}</td>
            <td className="px-4 py-3 font-bold" style={{ ...MONO, color: OR }}>{cs(totalGain)}</td>
            <td className="px-4 py-3 font-bold" style={{ ...MONO, color: OR }}>{fmt(avgMargin)}%</td>
            <td />
          </>
        }
      />
    </div>
  );
}

function printStyles(): string {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; font-size: 12px; color: #1F2937; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { padding: 36px 44px 28px; min-height: 100vh; }
    .letterhead { display: flex; justify-content: space-between; align-items: stretch; margin-bottom: 28px; gap: 16px; }
    .lh-brand { display: flex; flex-direction: column; justify-content: center; }
    .lh-logo-row { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
    .lh-icon { width: 36px; height: 36px; border-radius: 10px; background: #E05A30; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 18px; font-weight: 900; flex-shrink: 0; }
    .lh-name { font-size: 18px; font-weight: 800; color: #1F2937; }
    .lh-tagline { font-size: 11px; color: #9CA3AF; }
    .lh-meta { text-align: right; display: flex; flex-direction: column; justify-content: center; padding: 12px 16px; background: #F9FAFB; border-radius: 10px; border: 1px solid #E5E7EB; }
    .lh-report-name { font-size: 13px; font-weight: 700; color: #1F2937; }
    .lh-date { font-size: 11px; color: #6B7280; margin-top: 2px; }
    .lh-version { font-size: 10px; color: #9CA3AF; margin-top: 1px; }
    .stripe { height: 3px; background: linear-gradient(90deg, #E05A30 0%, #F97316 50%, #FDBA74 100%); border-radius: 2px; margin-bottom: 24px; }
    .report-title { font-size: 20px; font-weight: 800; color: #1F2937; margin-bottom: 4px; }
    .report-subtitle { font-size: 12px; color: #6B7280; margin-bottom: 20px; }
    .kpi-row { display: flex; gap: 12px; margin-bottom: 20px; }
    .kpi { flex: 1; border: 1px solid #E5E7EB; border-radius: 10px; padding: 12px 16px; background: #FAFAFA; }
    .kpi.accent { border-color: #FDBA74; background: #FFF7ED; }
    .kpi-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #9CA3AF; }
    .kpi-value { font-size: 18px; font-weight: 800; font-family: 'DM Mono', monospace; color: #1F2937; margin-top: 2px; }
    .kpi.accent .kpi-value { color: #E05A30; }
    .kpi-sub { font-size: 10px; color: #9CA3AF; margin-top: 2px; }
    .section-heading { display: flex; align-items: center; gap: 8px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #E05A30; margin: 18px 0 8px; }
    .section-heading::after { content: ''; flex: 1; height: 1px; background: #E5E7EB; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .table-wrap { border: 1px solid #E5E7EB; border-radius: 10px; overflow: hidden; margin-bottom: 16px; }
    thead tr { background: #F3F4F6; }
    th { text-align: left; padding: 8px 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #374151; border-bottom: 1px solid #E5E7EB; white-space: nowrap; }
    td { padding: 7px 12px; border-bottom: 1px solid #F3F4F6; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tbody tr:nth-child(even) { background: #FAFAFA; }
    tfoot tr { background: #FFF1EC; border-top: 2px solid #FDBA74; }
    tfoot td { padding: 8px 12px; font-weight: 700; border-bottom: none; }
    .mono { font-family: 'DM Mono', monospace; }
    .accent { color: #E05A30; }
    .muted { color: #6B7280; }
    .bold { font-weight: 700; }
    .alert { border: 1px solid #FCD34D; background: #FFFBEB; border-radius: 8px; padding: 9px 14px; margin-bottom: 14px; font-size: 11px; color: #92400E; }
    .dish-card { border: 1px solid #E5E7EB; border-radius: 10px; overflow: hidden; margin-bottom: 14px; }
    .dish-card-head { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; background: #FFF7ED; border-bottom: 1px solid #E5E7EB; }
    .dish-card-title { font-size: 13px; font-weight: 700; color: #1F2937; }
    .dish-card-meta { font-size: 10px; color: #6B7280; margin-top: 1px; }
    .dish-stats { display: flex; gap: 20px; }
    .dish-stat { text-align: right; }
    .dish-stat-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; color: #9CA3AF; }
    .dish-stat-val { font-size: 12px; font-weight: 700; font-family: 'DM Mono', monospace; }
    .dish-stat-val.accent { color: #E05A30; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
    .grid-card { border: 1px solid #E5E7EB; border-radius: 8px; padding: 12px 14px; background: #FAFAFA; }
    .grid-card-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #9CA3AF; }
    .grid-card-val { font-size: 16px; font-weight: 800; font-family: 'DM Mono', monospace; color: #1F2937; margin-top: 2px; }
    .doc-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 32px; padding-top: 12px; border-top: 1px solid #E5E7EB; font-size: 10px; color: #9CA3AF; }
    @media print { .page { padding: 18px 24px 14px; } tbody tr:nth-child(even) { background: #F9FAFB !important; } }
  `;
}

function buildPrintDoc(type: ReportType, ingredients: Ingredient[], dishes: Dish[], label: string): string {
  const today = new Date().toLocaleDateString("es-NI", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const short  = new Date().toLocaleDateString("es-NI", { year: "numeric", month: "long", day: "numeric" });

  const totalInvVal = ingredients.reduce((s, i) => s + i.costPerUnit * i.stock, 0);
  const lowStock    = ingredients.filter((i) => i.stock < 10);
  const totalPrice  = dishes.reduce((s, d) => s + d.price, 0);
  const totalCost   = dishes.reduce((s, d) => s + dishCost(d, ingredients), 0);
  const totalGain   = totalPrice - totalCost;
  const avgMargin   = totalPrice > 0 ? (totalGain / totalPrice) * 100 : 0;

  const catColor: Record<string, string> = {
    Secos:"#7C3AED",Lácteos:"#0369A1",Carnes:"#B45309",Verduras:"#16A34A",
    Aceites:"#D97706",Bebidas:"#0891B2",Otros:"#6B7280",Entradas:"#7C3AED",
    Sopas:"#0369A1",Pizzas:"#DC2626",Pastas:"#D97706",Ensaladas:"#16A34A",Postres:"#DB2777",
  };
  const catTd    = (cat: string) => `<span style="color:${catColor[cat]??'#6B7280'};font-weight:600">${cat}</span>`;
  const classTd  = (pct: number) => pct > 50
    ? `<span style="color:#E05A30;font-weight:600">Excelente</span>`
    : pct > 25 ? `<span style="color:#D97706;font-weight:600">Aceptable</span>`
    : `<span style="color:#DC2626;font-weight:600">Bajo</span>`;
  const kpi      = (lbl: string, value: string, sub = "", accent = false) =>
    `<div class="kpi${accent ? " accent" : ""}"><div class="kpi-label">${lbl}</div><div class="kpi-value">${value}</div>${sub ? `<div class="kpi-sub">${sub}</div>` : ""}</div>`;
  const th       = (cols: string[]) => `<thead><tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr></thead>`;
  const tfoot    = (cells: string[]) => `<tfoot><tr>${cells.map((c) => `<td>${c}</td>`).join("")}</tr></tfoot>`;

  const letterhead = `
    <div class="letterhead">
      <div class="lh-brand">
        <div class="lh-logo-row">
          <div class="lh-icon">C</div>
          <div><div class="lh-name">CPD — Gestión de Cocina</div><div class="lh-tagline">Sistema de control de costos y recetas</div></div>
        </div>
      </div>
      <div class="lh-meta">
        <div class="lh-report-name">${label}</div>
        <div class="lh-date">${short}</div>
        <div class="lh-version">CPD v2.1.0</div>
      </div>
    </div>
    <div class="stripe"></div>
  `;

  const docFooter = `
    <div class="doc-footer">
      <span>CPD — Gestión de Cocina · ${label}</span>
      <span>Generado el ${today}</span>
      <span>Documento confidencial</span>
    </div>
  `;

  let body = "";

  if (type === "summary") {
    const top5 = [...dishes].sort((a, b) => {
      const ma = a.price > 0 ? (a.price - dishCost(a, ingredients)) / a.price : 0;
      const mb = b.price > 0 ? (b.price - dishCost(b, ingredients)) / b.price : 0;
      return mb - ma;
    }).slice(0, 5);
    const avgMgn = dishes.length ? dishes.reduce((s, d) => { const c = dishCost(d, ingredients); return s + (d.price > 0 ? ((d.price - c) / d.price) * 100 : 0); }, 0) / dishes.length : 0;
    body = `
      <div class="report-title">Resumen General</div>
      <div class="report-subtitle">Visión ejecutiva del estado operativo · ${short}</div>
      <div class="kpi-row">
        ${kpi("Ingredientes en inventario", String(ingredients.length), `${lowStock.length} con stock bajo`)}
        ${kpi("Valor en inventario", cs(totalInvVal), "Costo total bodega")}
        ${kpi("Platillos en menú", String(dishes.length), `${new Set(dishes.map(d=>d.category)).size} categorías`)}
        ${kpi("Ganancia potencial", cs(totalGain), `Margen ${fmt(avgMgn)}%`, true)}
      </div>
      <div class="section-heading">Resumen financiero</div>
      <div class="grid-3">
        <div class="grid-card"><div class="grid-card-label">Ingresos proyectados</div><div class="grid-card-val">${cs(totalPrice)}</div></div>
        <div class="grid-card"><div class="grid-card-label">Costo total producción</div><div class="grid-card-val">${cs(totalCost)}</div></div>
        <div class="grid-card"><div class="grid-card-label">Margen promedio global</div><div class="grid-card-val" style="color:#E05A30">${fmt(avgMgn)}%</div></div>
      </div>
      <div class="section-heading">Top 5 platillos más rentables</div>
      <div class="table-wrap"><table>
        ${th(["#","Platillo","Categoría","Precio venta","Costo prod.","Ganancia","Margen"])}
        <tbody>${top5.map((d, i) => { const c = dishCost(d, ingredients); const g = d.price - c; const mp = d.price > 0 ? (g / d.price) * 100 : 0;
          return `<tr><td class="mono muted">${i+1}</td><td class="bold">${d.name}</td><td>${catTd(d.category)}</td><td class="mono">${cs(d.price)}</td><td class="mono muted">${cs(c)}</td><td class="mono accent bold">${cs(g)}</td><td class="mono accent bold">${fmt(mp)}%</td></tr>`;
        }).join("")}</tbody>
      </table></div>
      ${lowStock.length > 0 ? `<div class="section-heading">Alertas de stock bajo</div><div class="alert"><strong>Requieren reposición urgente:</strong> ${lowStock.map(i=>`${i.name} (${i.stock} ${i.unit})`).join(" · ")}</div>` : ""}
    `;
  } else if (type === "ingredients") {
    body = `
      <div class="report-title">Inventario de Ingredientes</div>
      <div class="report-subtitle">Estado actual del inventario de insumos · ${short}</div>
      <div class="kpi-row">
        ${kpi("Total de insumos", String(ingredients.length))}
        ${kpi("Valor en inventario", cs(totalInvVal), "Suma stock × costo", true)}
        ${kpi("Items con stock bajo", String(lowStock.length), lowStock.length > 0 ? "Requieren atención" : "Inventario saludable")}
      </div>
      ${lowStock.length > 0 ? `<div class="alert"><strong>Stock bajo en:</strong> ${lowStock.map(i=>`${i.name} (${i.stock} ${i.unit})`).join(", ")}</div>` : ""}
      <div class="section-heading">Detalle completo del inventario</div>
      <div class="table-wrap"><table>
        ${th(["#","Ingrediente","Categoría","Unidad","C$ / Unidad","Stock actual","Valor total"])}
        <tbody>${ingredients.map((i, idx) => `<tr>
          <td class="mono muted">${String(idx+1).padStart(2,"0")}</td>
          <td class="bold">${i.name}</td><td>${catTd(i.category)}</td>
          <td class="muted">${i.unit}</td><td class="mono">${cs(i.costPerUnit)}</td>
          <td class="mono${i.stock < 10 ? '" style="color:#D97706;font-weight:700"' : '"'}>${i.stock}${i.stock < 10 ? " ⚠" : ""}</td>
          <td class="mono bold">${cs(i.costPerUnit * i.stock)}</td>
        </tr>`).join("")}</tbody>
        ${tfoot(["","","","","","<strong>Valor total inventario</strong>",`<strong class="mono accent">${cs(totalInvVal)}</strong>`])}
      </table></div>
    `;
  } else if (type === "dish-costs") {
    const breakdown = dishes.map((dish) => {
      const cost = dishCost(dish, ingredients);
      const mp   = dish.price > 0 ? ((dish.price - cost) / dish.price) * 100 : 0;
      const rows = (dish.ingredients ?? []).map((di) => {
        const ing = ingredients.find((i) => i.id === di.ingredientId);
        if (!ing) return "";
        const sub = ing.costPerUnit * di.quantity;
        const pct = cost > 0 ? (sub / cost) * 100 : 0;
        return `<tr><td>${ing.name}</td><td class="muted">${catTd(ing.category)}</td><td class="mono muted">${di.quantity} ${ing.unit}</td><td class="mono">${cs(ing.costPerUnit)}</td><td class="mono bold">${cs(sub)}</td><td class="mono muted">${fmt(pct)}%</td></tr>`;
      }).join("");
      return `<div class="dish-card"><div class="dish-card-head"><div><div class="dish-card-title">${dish.name}</div><div class="dish-card-meta">${dish.category} · ${(dish.ingredients??[]).length} ingredientes</div></div><div class="dish-stats"><div class="dish-stat"><div class="dish-stat-label">Precio venta</div><div class="dish-stat-val">${cs(dish.price)}</div></div><div class="dish-stat"><div class="dish-stat-label">Costo prod.</div><div class="dish-stat-val muted">${cs(cost)}</div></div><div class="dish-stat"><div class="dish-stat-label">Margen</div><div class="dish-stat-val accent">${fmt(mp)}%</div></div></div></div><table>${th(["Ingrediente","Categoría","Cantidad","C$/Unidad","Subtotal","% del costo"])}<tbody>${rows}</tbody></table></div>`;
    }).join("");
    body = `
      <div class="report-title">Costos por Platillo</div>
      <div class="report-subtitle">Desglose de ingredientes y costo de producción · ${short}</div>
      <div class="kpi-row">
        ${kpi("Platillos en menú", String(dishes.length))}
        ${kpi("Precio venta total", cs(totalPrice))}
        ${kpi("Costo total producción", cs(totalCost), `${fmt(totalPrice > 0 ? (totalCost / totalPrice) * 100 : 0)}% del precio`)}
        ${kpi("Ganancia bruta", cs(totalGain), `Margen ${fmt(avgMargin)}%`, true)}
      </div>
      <div class="section-heading">Resumen por platillo</div>
      <div class="table-wrap"><table>
        ${th(["Platillo","Categoría","# Insumos","Costo prod.","Precio venta","Ganancia","Margen"])}
        <tbody>${dishes.map((d) => { const c = dishCost(d, ingredients); const g = d.price - c; const mp = d.price > 0 ? ((d.price - c) / d.price) * 100 : 0;
          return `<tr><td class="bold">${d.name}</td><td>${catTd(d.category)}</td><td class="mono muted" style="text-align:center">${(d.ingredients??[]).length}</td><td class="mono muted">${cs(c)}</td><td class="mono">${cs(d.price)}</td><td class="mono accent bold">${cs(g)}</td><td class="mono accent bold">${fmt(mp)}%</td></tr>`;
        }).join("")}</tbody>
        ${tfoot(["Totales","","",`<strong class="mono">${cs(totalCost)}</strong>`,`<strong class="mono">${cs(totalPrice)}</strong>`,`<strong class="mono accent">${cs(totalGain)}</strong>`,`<strong class="mono accent">${fmt(avgMargin)}%</strong>`])}
      </table></div>
      <div class="section-heading">Desglose detallado por platillo</div>
      ${breakdown}
    `;
  } else {
    const sorted2 = [...dishes].sort((a, b) => {
      const ma = a.price > 0 ? (a.price - dishCost(a, ingredients)) / a.price : 0;
      const mb = b.price > 0 ? (b.price - dishCost(b, ingredients)) / b.price : 0;
      return mb - ma;
    });
    const excellent2  = sorted2.filter((d) => { const c = dishCost(d, ingredients); return d.price > 0 && ((d.price - c) / d.price) * 100 > 50; }).length;
    const acceptable2 = sorted2.filter((d) => { const c = dishCost(d, ingredients); const p = d.price > 0 ? ((d.price - c) / d.price) * 100 : 0; return p > 25 && p <= 50; }).length;
    const lowM        = sorted2.length - excellent2 - acceptable2;
    body = `
      <div class="report-title">Análisis de Ganancias</div>
      <div class="report-subtitle">Rentabilidad y márgenes de utilidad por platillo · ${short}</div>
      <div class="kpi-row">
        ${kpi("Precio venta total", cs(totalPrice), "Suma del menú completo")}
        ${kpi("Costo total producción", cs(totalCost))}
        ${kpi("Margen promedio", `${fmt(avgMargin)}%`, "Sobre precio de venta")}
        ${kpi("Ganancia potencial", cs(totalGain), "Si se vende todo el menú", true)}
      </div>
      <div class="section-heading">Distribución de rentabilidad</div>
      <div class="grid-3">
        <div class="grid-card" style="border-color:#FDBA74;background:#FFF7ED"><div class="grid-card-label" style="color:#E05A30">Excelente (>50%)</div><div class="grid-card-val" style="color:#E05A30">${excellent2} platillo${excellent2 !== 1 ? "s" : ""}</div></div>
        <div class="grid-card" style="border-color:#FCD34D;background:#FFFBEB"><div class="grid-card-label" style="color:#D97706">Aceptable (25–50%)</div><div class="grid-card-val" style="color:#D97706">${acceptable2} platillo${acceptable2 !== 1 ? "s" : ""}</div></div>
        <div class="grid-card" style="border-color:#FECACA;background:#FEF2F2"><div class="grid-card-label" style="color:#DC2626">Bajo (<25%)</div><div class="grid-card-val" style="color:#DC2626">${lowM} platillo${lowM !== 1 ? "s" : ""}</div></div>
      </div>
      <div class="section-heading">Análisis por platillo (ordenado por margen)</div>
      <div class="table-wrap"><table>
        ${th(["#","Platillo","Categoría","Costo prod.","Precio venta","Ganancia","Margen %","Clasificación"])}
        <tbody>${sorted2.map((d, i) => { const c = dishCost(d, ingredients); const g = d.price - c; const mp = d.price > 0 ? (g / d.price) * 100 : 0;
          return `<tr><td class="mono muted">${i+1}</td><td class="bold">${d.name}</td><td>${catTd(d.category)}</td><td class="mono muted">${cs(c)}</td><td class="mono">${cs(d.price)}</td><td class="mono accent bold">${cs(g)}</td><td class="mono accent bold">${fmt(mp)}%</td><td>${classTd(mp)}</td></tr>`;
        }).join("")}</tbody>
        ${tfoot(["","Totales / Promedios","",`<strong class="mono">${cs(totalCost)}</strong>`,`<strong class="mono">${cs(totalPrice)}</strong>`,`<strong class="mono accent">${cs(totalGain)}</strong>`,`<strong class="mono accent">${fmt(avgMargin)}%</strong>`,""  ])}
      </table></div>
    `;
  }

  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"/><title>${label} — CPD</title><style>${printStyles()}</style></head><body><div class="page">${letterhead}${body}${docFooter}</div></body></html>`;
}

export function ReportsPage({ ingredients, dishes }: { ingredients: Ingredient[]; dishes: Dish[] }) {
  const [active, setActive] = useState<ReportType>("gains");
  const printRef = useRef<HTMLDivElement>(null);

  const activeTab = TABS.find((t) => t.id === active)!;

  function handlePrint() {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(buildPrintDoc(active, ingredients, dishes, activeTab.label));
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 700);
  }

  return (
    <div className="flex flex-col min-h-0 h-full">
      {/* Top header */}
      <div className="shrink-0 border-b border-border bg-white px-6 pt-5 pb-0">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-extrabold text-foreground">Reportes</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Consulta e{" "}
              <span className="font-semibold" style={{ color: OR }}>imprime reportes detallados</span>{" "}
              de tu operación
            </p>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm transition-all active:scale-[0.97]"
            style={{ background: OR }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.9"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
          >
            <Printer size={14} />
            <span className="hidden sm:inline">Imprimir</span>
            <span className="sm:hidden">PDF</span>
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex overflow-x-auto gap-0.5 pb-px" style={{ scrollbarWidth: "none" }}>
          {TABS.map((tab) => {
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActive(tab.id)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all shrink-0 border-b-2 -mb-px"
                style={{ borderBottomColor: isActive ? OR : "transparent", color: isActive ? OR : "#6B7280" }}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "#374151"; }}
                onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "#6B7280"; }}
              >
                <span className={clsx("transition-colors", isActive ? "" : "opacity-60")}>{tab.icon}</span>
                <span className="hidden md:inline">{tab.label}</span>
                <span className="md:hidden">{tab.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div
        className="flex-1 overflow-y-auto bg-gray-50/40 px-4 sm:px-6 lg:px-8 py-6"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(200,200,200,0.3) transparent" }}
      >
        <div ref={printRef} className="max-w-5xl mx-auto">
          {active === "summary"     && <ReportSummary     ingredients={ingredients} dishes={dishes} />}
          {active === "ingredients" && <ReportIngredients ingredients={ingredients} />}
          {active === "dish-costs"  && <ReportDishCosts   dishes={dishes} ingredients={ingredients} />}
          {active === "gains"       && <ReportGains       dishes={dishes} ingredients={ingredients} />}
        </div>
      </div>
    </div>
  );
}
