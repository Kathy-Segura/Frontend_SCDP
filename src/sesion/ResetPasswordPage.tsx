import { useState, useEffect, type FormEvent } from "react";
import { UtensilsCrossed, Lock, Eye, EyeOff, AlertTriangle, Loader2, Check } from "lucide-react";
import { useAuth } from "./AuthContext";

type ResetPasswordPageProps = {
  onSwitchToLogin: () => void;
};

export function ResetPasswordPage({ onSwitchToLogin }: ResetPasswordPageProps) {
  const { resetPassword, isResetLoading, resetError, clearResetError } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [exito, setExito] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token"));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (resetError) clearResetError();

    if (!password || password.length < 6) {
      setFieldError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setFieldError("Las contraseñas no coinciden.");
      return;
    }
    setFieldError(undefined);

    if (!token) return;

    try {
      await resetPassword(token, password);
      setExito(true);
    } catch {
      // el mensaje ya queda expuesto via `resetError` del contexto (AuthContext)
    }
  }

  if (!token) {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center bg-background px-4"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm text-center">
          <AlertTriangle size={28} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-foreground mb-2">Enlace inválido</h2>
          <p className="text-sm text-muted-foreground mb-6">
            El enlace de recuperación no es válido. Solicita uno nuevo desde la pantalla de inicio de sesión.
          </p>
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="w-full py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all"
          >
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    );
  }

  if (exito) {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center bg-background px-4"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Check size={26} className="text-green-600" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">Contraseña actualizada</h2>
          <p className="text-sm text-muted-foreground mb-6">Ya puedes iniciar sesión con tu nueva contraseña.</p>
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="w-full py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all"
          >
            Ir al inicio de sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-background px-4"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="flex flex-col items-center mb-6">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
            style={{
              background: "linear-gradient(135deg, #E05A30 0%, #C04020 100%)",
              boxShadow: "0 4px 12px rgba(224,90,48,0.35)",
            }}
          >
            <UtensilsCrossed size={20} color="#fff" />
          </div>
          <h1 className="text-lg font-bold text-foreground">NUEVA CONTRASEÑA</h1>
          <p className="text-sm text-muted-foreground mt-1">Ingresa tu nueva contraseña</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Nueva contraseña
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
                disabled={isResetLoading}
                className="w-full rounded-lg pl-9 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
              />
              <button
                type="button"
                onClick={() => setShowPw((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Confirmar contraseña
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showPw ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu contraseña"
                autoComplete="new-password"
                disabled={isResetLoading}
                className="w-full rounded-lg pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
              />
            </div>
          </div>

          {(fieldError || resetError) && (
            <div className="flex items-center gap-2 rounded-lg px-3 py-2.5 bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertTriangle size={14} className="shrink-0" />
              {fieldError || resetError}
            </div>
          )}

          <button
            type="submit"
            disabled={isResetLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {isResetLoading && <Loader2 size={16} className="animate-spin" />}
            {isResetLoading ? "Guardando..." : "Guardar nueva contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}