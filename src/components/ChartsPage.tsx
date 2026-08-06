import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Package, ChefHat, TrendingUp, AlertTriangle } from "lucide-react";
import type { Ingredient, Dish } from "../types";
import { CHART_COLORS } from "../constants";
import { MONO } from "../styles/shared";
import { fmt, cs, dishCost } from "../utils";

const ChartTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-muted-foreground" style={MONO}>
          {p.name}: <span className="text-foreground font-bold">{typeof p.value === "number" && p.name?.includes("C$") ? cs(p.value) : p.value}</span>
        </p>
      ))}
    </div>
  );
};

export function ChartsPage({ ingredients, dishes }: { ingredients: Ingredient[]; dishes: Dish[] }) {
  const stockData = [...ingredients].sort((a, b) => b.stock - a.stock).slice(0, 10)
    .map((i) => ({ name: i.name.length > 13 ? i.name.slice(0, 12) + "…" : i.name, stock: i.stock }));

  const costData = [...ingredients].sort((a, b) => b.costPerUnit - a.costPerUnit).slice(0, 8)
    .map((i) => ({ name: i.name.length > 13 ? i.name.slice(0, 12) + "…" : i.name, costo: i.costPerUnit }));

  const categoryMap: Record<string, number> = {};
  ingredients.forEach((i) => { categoryMap[i.category] = (categoryMap[i.category] || 0) + i.stock; });
  const pieData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

  const dishMargins = dishes.map((d) => {
    const cost = dishCost(d, ingredients);
    return { name: d.name.length > 13 ? d.name.slice(0, 12) + "…" : d.name, margen: parseFloat(fmt(d.price - cost)), precio: d.price };
  });

  const kpis = [
    { label: "Ingredientes",     val: ingredients.length,                                                          icon: <Package size={15} className="text-primary" /> },
    { label: "Valor inventario", val: cs(ingredients.reduce((s, i) => s + i.costPerUnit * i.stock, 0)),            icon: <TrendingUp size={15} className="text-primary" /> },
    { label: "Platillos",        val: dishes.length,                                                               icon: <ChefHat size={15} className="text-primary" /> },
    { label: "Stock bajo",       val: ingredients.filter((i) => i.stock < 10).length,                             icon: <AlertTriangle size={15} className="text-amber-500" /> },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 sm:space-y-8 overflow-y-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Analítica</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">Stock, costos en C$, distribución y márgenes de platillos.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-card border border-border rounded-lg sm:rounded-xl p-2.5 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-2">
              {k.icon}
              <span className="text-[8px] sm:text-[10px] font-semibold uppercase tracking-widest text-muted-foreground text-right leading-tight">{k.label}</span>
            </div>
            <p className="text-base sm:text-xl font-bold text-foreground" style={MONO}>{k.val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-card border border-border rounded-lg sm:rounded-xl p-3 sm:p-5 shadow-sm">
          <p className="text-xs sm:text-sm font-semibold text-foreground mb-0.5">Stock por ingrediente</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground mb-3 sm:mb-4">Top 10 por unidades disponibles</p>
          <ResponsiveContainer width="100%" height={180} minHeight={180}>
            <BarChart data={stockData} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: "'DM Mono', monospace" }} />
              <YAxis tick={{ fontSize: 10, fontFamily: "'DM Mono', monospace" }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="stock" name="Stock" fill="#E05A30" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <p className="text-sm font-semibold text-foreground mb-0.5">Distribución por categoría</p>
          <p className="text-xs text-muted-foreground mb-4">Unidades totales en stock</p>
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={85} paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend formatter={(v) => <span style={{ fontSize: 11, fontFamily: "'Inter', sans-serif" }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <p className="text-sm font-semibold text-foreground mb-0.5">Costo unitario (C$)</p>
          <p className="text-xs text-muted-foreground mb-4">Top ingredientes por precio</p>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={costData} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fontFamily: "'DM Mono', monospace" }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fontFamily: "'DM Mono', monospace" }} width={88} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="costo" name="C$/unidad" fill="#2980B9" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <p className="text-sm font-semibold text-foreground mb-0.5">Margen por platillo (C$)</p>
          <p className="text-xs text-muted-foreground mb-4">Precio venta vs margen neto</p>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={dishMargins} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: "'DM Mono', monospace" }} />
              <YAxis tick={{ fontSize: 10, fontFamily: "'DM Mono', monospace" }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="precio" name="Precio" fill="#EDEBE6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="margen" name="Margen" fill="#27AE60" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
