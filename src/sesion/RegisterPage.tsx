import { useState, type FormEvent, type ChangeEvent } from "react";
import { UtensilsCrossed, User, Mail, Lock, Eye, EyeOff, AlertTriangle, Loader2 } from "lucide-react";
import { useAuth } from "./AuthContext";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = {
  nombre?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

function validate(nombre: string, email: string, password: string, confirmPassword: string): FieldErrors {
  const errors: FieldErrors = {};
  const trimmedNombre = nombre.trim();
  const trimmedEmail = email.trim();

  if (!trimmedNombre) {
    errors.nombre = "El nombre es obligatorio.";
  }
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
  if (!confirmPassword) {
    errors.confirmPassword = "Confirma la contraseña.";
  } else if (password && confirmPassword !== password) {
    errors.confirmPassword = "Las contraseñas no coinciden.";
  }

  return errors;
}

type RegisterPageProps = {
  onSwitchToLogin: () => void;
  onRegistered: (email: string) => void;
};

export function RegisterPage({ onSwitchToLogin, onRegistered }: RegisterPageProps) {
  const { register, isRegisterLoading, registerError, clearRegisterError } = useAuth();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState(false);

  function handleChange<K extends keyof FieldErrors>(key: K, setter: (v: string) => void) {
    return (e: ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value);
      if (touched) setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
      if (registerError) clearRegisterError();
    };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);

    const errors = validate(nombre, email, password, confirmPassword);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      await register({ nombre: nombre.trim(), email: email.trim(), password });
      onRegistered(email.trim());
    } catch {
      // el mensaje ya queda expuesto via `registerError` del contexto (AuthContext)
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
          <h1 className="text-lg font-bold text-foreground">REGISTRARSE</h1>
          <p className="text-sm text-muted-foreground mt-1">Crea tu cuenta para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Nombre completo
            </label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={nombre}
                onChange={handleChange("nombre", setNombre)}
                placeholder="Tu nombre completo"
                autoComplete="name"
                disabled={isRegisterLoading}
                aria-invalid={!!fieldErrors.nombre}
                className="w-full rounded-lg pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
              />
            </div>
            {fieldErrors.nombre && <p className="text-xs text-red-500 mt-1">{fieldErrors.nombre}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Correo electrónico
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={handleChange("email", setEmail)}
                placeholder="tucorreo@ejemplo.com"
                autoComplete="username"
                disabled={isRegisterLoading}
                aria-invalid={!!fieldErrors.email}
                className="w-full rounded-lg pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
              />
            </div>
            {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={handleChange("password", setPassword)}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
                disabled={isRegisterLoading}
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

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Confirmar contraseña
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showPw ? "text" : "password"}
                value={confirmPassword}
                onChange={handleChange("confirmPassword", setConfirmPassword)}
                placeholder="Repite tu contraseña"
                autoComplete="new-password"
                disabled={isRegisterLoading}
                aria-invalid={!!fieldErrors.confirmPassword}
                className="w-full rounded-lg pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
              />
            </div>
            {fieldErrors.confirmPassword && <p className="text-xs text-red-500 mt-1">{fieldErrors.confirmPassword}</p>}
          </div>

          {registerError && (
            <div className="flex items-center gap-2 rounded-lg px-3 py-2.5 bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertTriangle size={14} className="shrink-0" />
              {registerError}
            </div>
          )}

          <button
            type="submit"
            disabled={isRegisterLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {isRegisterLoading && <Loader2 size={16} className="animate-spin" />}
            {isRegisterLoading ? "Creando cuenta..." : "Crear cuenta"}
          </button>

          {isRegisterLoading && (
            <p className="text-xs text-muted-foreground text-center">
              Si el backend estuvo inactivo puede tardar unos segundos en responder.
            </p>
          )}

          <p className="text-sm text-center text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <button type="button" onClick={onSwitchToLogin} className="text-primary font-semibold hover:underline">
              Inicia sesión
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}