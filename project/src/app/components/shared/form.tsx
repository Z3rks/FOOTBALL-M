import { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

/**
 * Piezas de formulario compartidas por todas las pantallas: cambiar el estilo de los campos
 * se hace aquí, en un solo lugar.
 */

/** "primary" en la app del jugador; "secondary" en el modo Admin de SignInScreen. */
type Tone = "primary" | "secondary";

const TONES: Record<Tone, string> = {
  primary: "border-border focus:ring-primary/50",
  secondary: "border-secondary/40 focus:ring-secondary/40",
};

const fieldClass = (tone: Tone, extra = "") =>
  `w-full px-4 py-3 bg-input-background border rounded-xl focus:outline-none focus:ring-2 transition-all ${TONES[tone]} ${extra}`;

export function TextInput({ tone = "primary", className, ...props }: InputHTMLAttributes<HTMLInputElement> & { tone?: Tone }) {
  return <input {...props} className={fieldClass(tone, className)} />;
}

export function SelectInput({ tone = "primary", className, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { tone?: Tone }) {
  return <select {...props} className={fieldClass(tone, className)} />;
}

interface FormFieldProps {
  /** id del campo que etiqueta el label. */
  htmlFor: string;
  label: ReactNode;
  /** Texto de ayuda bajo el campo; en rojo si hintIsError. */
  hint?: ReactNode;
  hintIsError?: boolean;
  children: ReactNode;
}

/** Etiqueta + campo (+ ayuda opcional). */
export function FormField({ htmlFor, label, hint, hintIsError = false, children }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {hint && <p className={`text-xs ${hintIsError ? "text-red-600" : "text-muted-foreground"}`}>{hint}</p>}
    </div>
  );
}

/** Mensaje de error de un formulario (RNF-USA-03: claro y sin bloquear el formulario). */
export function ErrorBox({ message }: { message: string | null | undefined }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
      {message}
    </p>
  );
}
