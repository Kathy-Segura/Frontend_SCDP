import { useState, type FormEvent, type ChangeEvent } from "react";
import { UtensilsCrossed, Mail, ArrowLeft, AlertTriangle, Loader2, Check } from "lucide-react";
import { useAuth } from "./AuthContext";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ForgotPasswordPageProps = {
  onSwitchToLogin: () => void;
};

export function ForgotPasswordPage({ onSwitchToLogin }: ForgotPasswordPageProps) {
  const { forgotPassword, isForgotLoading, forgotError, clearForgotError } = useAuth();
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [enviado, setEnviado] = useState(false);

  function handleEmailChange(e: ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value);
    setFieldError(undefined);
    if (forgotError) clearForgotError();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();

    if (!trimmed) {
      setFieldError("Ingresa tu correo electrónico.");
      return;
    }
    if (!EMAIL_REGEX.test(trimmed)) {
      setFieldError("Ingresa un correo con formato válido (ej: nombre@dominio.com).");
      return;
    }

    try {
      await forgotPassword(trimmed);
      setEnviado(true);
    } catch {
      // el mensaje ya queda expuesto via `forgotError` del contexto (AuthContext)
    }
  }

  if (enviado) {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center bg-background px-4"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Check size={26} className="text-green-600" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">Correo enviado</h2>
          <p className="text-sm text-muted-foreground mb-1">Si el correo está registrado, enviamos un enlace a</p>
          <p className="text-sm font-semibold text-foreground mb-6">{email.trim()}</p>
          <p className="text-xs text-muted-foreground mb-6">
            Revisa tu bandeja de entrada y sigue las instrucciones. El enlace expira en 30 minutos. Si no lo ves,
            revisa tu carpeta de spam.
          </p>
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all"
          >
            <ArrowLeft size={14} /> Volver al inicio de sesión
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
          <h1 className="text-lg font-bold text-foreground">RECUPERAR CONTRASEÑA</h1>
          <p className="text-sm text-muted-foreground mt-1 text-center">
            Ingresa tu correo y te enviaremos un enlace para restablecerla
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
                disabled={isForgotLoading}
                aria-invalid={!!fieldError}
                className="w-full rounded-lg pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
              />
            </div>
            {fieldError && <p className="text-xs text-red-500 mt-1">{fieldError}</p>}
          </div>

          {forgotError && (
            <div className="flex items-center gap-2 rounded-lg px-3 py-2.5 bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertTriangle size={14} className="shrink-0" />
              {forgotError}
            </div>
          )}

          <button
            type="submit"
            disabled={isForgotLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {isForgotLoading && <Loader2 size={16} className="animate-spin" />}
            {isForgotLoading ? "Enviando..." : "Enviar enlace de recuperación"}
          </button>

          <button
            type="button"
            onClick={onSwitchToLogin}
            className="w-full flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} /> Volver al inicio de sesión
          </button>
        </form>
      </div>
    </div>
  );
}