import { useState, type FormEvent, type ChangeEvent } from "react";
import { UtensilsCrossed, Loader2 } from "lucide-react";
import { useAuth } from "./AuthContext";
import { inputCls, labelCls } from "../styles/shared";

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
    errors.email = "Ingresa un correo con formato valido (ej: nombre@dominio.com).";
  }

  if (!password) {
    errors.password = "La contrasena es obligatoria.";
  } else if (password.length < 6) {
    errors.password = "Debe tener al menos 6 caracteres.";
  }

  return errors;
}

export function LoginPage() {
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
          <h1 className="text-lg font-bold text-foreground">CDP - Centro de producción</h1>
          <p className="text-sm text-muted-foreground mt-1">Inicia sesion para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className={labelCls}>Correo</label>
            <input
              type="email"
              className={inputCls}
              value={email}
              onChange={handleEmailChange}
              placeholder="tucorreo@ejemplo.com"
              autoComplete="username"
              disabled={isLoading}
              aria-invalid={!!fieldErrors.email}
            />
            {fieldErrors.email && (
              <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label className={labelCls}>Contrasena</label>
            <input
              type="password"
              className={inputCls}
              value={password}
              onChange={handlePasswordChange}
              placeholder="********"
              autoComplete="current-password"
              disabled={isLoading}
              aria-invalid={!!fieldErrors.password}
            />
            {fieldErrors.password && (
              <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>
            )}
          </div>

          {error && (
            <div className="rounded-lg px-3 py-2 text-sm text-red-600 bg-red-50 border border-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: "#E05A30" }}
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            {isLoading ? "Conectando con el servidor..." : "Iniciar sesion"}
          </button>

          {isLoading && (
            <p className="text-xs text-muted-foreground text-center">
              Si el backend estuvo inactivo puede tardar unos segundos en responder.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
