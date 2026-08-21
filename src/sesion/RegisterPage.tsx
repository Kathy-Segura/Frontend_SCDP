import { useState, type FormEvent, type ChangeEvent } from "react";
import { UtensilsCrossed, Loader2 } from "lucide-react";
import { useAuth } from "./AuthContext";
import { inputCls, labelCls } from "../styles/shared";

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
    errors.email = "Ingresa un correo con formato valido (ej: nombre@dominio.com).";
  }

  if (!password) {
    errors.password = "La contrasena es obligatoria.";
  } else if (password.length < 6) {
    errors.password = "Debe tener al menos 6 caracteres.";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Confirma la contrasena.";
  } else if (password && confirmPassword !== password) {
    errors.confirmPassword = "Las contrasenas no coinciden.";
  }

  return errors;
}

type RegisterPageProps = {
  /** Se llama cuando el usuario ya tiene cuenta y quiere volver al login */
  onSwitchToLogin: () => void;
  /** Se llama cuando el registro fue exitoso, para volver al login con el email precargado */
  onRegistered: (email: string) => void;
};

export function RegisterPage({ onSwitchToLogin, onRegistered }: RegisterPageProps) {
  const { register, isRegisterLoading, registerError, clearRegisterError } = useAuth();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState(false);

  function handleChange<K extends keyof FieldErrors>(
    key: K,
    setter: (v: string) => void
  ) {
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
            <label className={labelCls}>Nombre</label>
            <input
              type="text"
              className={inputCls}
              value={nombre}
              onChange={handleChange("nombre", setNombre)}
              placeholder="Tu nombre completo"
              autoComplete="name"
              disabled={isRegisterLoading}
              aria-invalid={!!fieldErrors.nombre}
            />
            {fieldErrors.nombre && (
              <p className="text-xs text-red-500 mt-1">{fieldErrors.nombre}</p>
            )}
          </div>

          <div>
            <label className={labelCls}>Correo</label>
            <input
              type="email"
              className={inputCls}
              value={email}
              onChange={handleChange("email", setEmail)}
              placeholder="tucorreo@ejemplo.com"
              autoComplete="username"
              disabled={isRegisterLoading}
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
              onChange={handleChange("password", setPassword)}
              placeholder="********"
              autoComplete="new-password"
              disabled={isRegisterLoading}
              aria-invalid={!!fieldErrors.password}
            />
            {fieldErrors.password && (
              <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>
            )}
          </div>

          <div>
            <label className={labelCls}>Confirmar contrasena</label>
            <input
              type="password"
              className={inputCls}
              value={confirmPassword}
              onChange={handleChange("confirmPassword", setConfirmPassword)}
              placeholder="********"
              autoComplete="new-password"
              disabled={isRegisterLoading}
              aria-invalid={!!fieldErrors.confirmPassword}
            />
            {fieldErrors.confirmPassword && (
              <p className="text-xs text-red-500 mt-1">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          {registerError && (
            <div className="rounded-lg px-3 py-2 text-sm text-red-600 bg-red-50 border border-red-200">
              {registerError}
            </div>
          )}

          <button
            type="submit"
            disabled={isRegisterLoading}
            className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: "#E05A30" }}
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
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-semibold hover:underline"
              style={{ color: "#E05A30" }}
            >
              Inicia sesion
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
