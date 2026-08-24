import { useState, type FormEvent, type ChangeEvent } from "react";
import { UtensilsCrossed, Mail, Lock, Eye, EyeOff, AlertTriangle, Loader2 } from "lucide-react";
import { useAuth } from "./AuthContext";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = {
  email?: string;
  password?: string;
};

function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    errors.email = "El correo es obligatorio.";
  } else if (!EMAIL_REGEX.test(trimmedEmail)) {
    errors.email = "Ingresa un correo con formato válido (ej: nombre@dominio.com).";
  }

  if (!password) {
    errors.password = "La contraseña es obligatoria.";
  } else if (password.length < 6) {
    errors.password = "Debe tener al menos 6 caracteres.";
  }

  return errors;
}

type LoginPageProps = {
  onSwitchToRegister: () => void;
  onSwitchToForgotPassword: () => void;
  successMessage?: string | null;
};

export function LoginPage({ onSwitchToRegister, onSwitchToForgotPassword, successMessage }: LoginPageProps) {
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState(false);

  function handleEmailChange(e: ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value);
    if (touched) setFieldErrors((prev) => ({ ...prev, email: undefined }));
  }

  function handlePasswordChange(e: ChangeEvent<HTMLInputElement>) {
    setPassword(e.target.value);
    if (touched) setFieldErrors((prev) => ({ ...prev, password: undefined }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);

    const errors = validate(email, password);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      await login(email.trim(), password);
    } catch {
      // el mensaje ya queda expuesto via `error` del contexto (AuthContext)
    }
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
          <h1 className="text-lg font-bold text-foreground">INICIAR SESIÓN</h1>
          <p className="text-sm text-muted-foreground mt-1">Ingresa tus credenciales para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {successMessage && (
            <div className="rounded-lg px-3 py-2 text-sm text-green-700 bg-green-50 border border-green-200">
              {successMessage}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Correo electrónico
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="tucorreo@ejemplo.com"
                autoComplete="username"
                disabled={isLoading}
                aria-invalid={!!fieldErrors.email}
                className="w-full rounded-lg pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
              />
            </div>
            {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contraseña</label>
              <button
                type="button"
                onClick={onSwitchToForgotPassword}
                className="text-xs text-primary hover:underline font-medium"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={handlePasswordChange}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={isLoading}
                aria-invalid={!!fieldErrors.password}
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
            {fieldErrors.password && <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg px-3 py-2.5 bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertTriangle size={14} className="shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            {isLoading ? "Conectando con el servidor..." : "Iniciar sesión"}
          </button>

          {isLoading && (
            <p className="text-xs text-muted-foreground text-center">
              Si el backend estuvo inactivo puede tardar unos segundos en responder.
            </p>
          )}

          <p className="text-sm text-center text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <button type="button" onClick={onSwitchToRegister} className="text-primary font-semibold hover:underline">
              Regístrate
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}