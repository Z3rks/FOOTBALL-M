import { useEffect, useRef, useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { toast } from "sonner";
import { authApi } from "../api/api";
import i18n from "../i18n";
import { SessionUser } from "../api/client";
import { errorMessage, rawErrorMessage } from "../api/hooks";
import { useTranslation } from "react-i18next";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GIS_SRC = "https://accounts.google.com/gsi/client";
const CONSENT_REQUIRED = "consentAccepted must be true to create an account";
/** Ancho máximo que admite el botón oficial de Google. */
const MAX_BUTTON_WIDTH = 400;

interface GoogleIdentity {
  accounts: {
    id: {
      initialize(config: { client_id: string; callback: (response: { credential: string }) => void }): void;
      renderButton(
        parent: HTMLElement,
        options: { type: "standard"; theme: "outline"; size: "large"; text: "continue_with"; shape: "pill"; logo_alignment: "center"; width: number; locale: string },
      ): void;
    };
  };
}

/** Carga el script oficial de Google Identity Services una sola vez. */
let gisLoading: Promise<GoogleIdentity> | null = null;
function loadGoogleIdentity(): Promise<GoogleIdentity> {
  gisLoading ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.onload = () => resolve((window as unknown as { google: GoogleIdentity }).google);
    script.onerror = () => {
      gisLoading = null;
      reject(new Error("Could not load Google sign-in"));
    };
    document.head.appendChild(script);
  });
  return gisLoading;
}

/**
 * "Continue with Google" (RF-020 a RF-024, RF-050 a RF-054). Usa el botón oficial de Google
 * (siempre abre la ventana de Google; la ventana emergente "One Tap" el navegador puede
 * ocultarla sin avisar). El id_token se verifica en el backend. Si la cuenta todavía no
 * existe, se pide aceptar la política de datos (Ley 1581).
 */
export default function GoogleButton({ onSignedIn }: { onSignedIn: (user: SessionUser) => void }) {
  const {
    t,
    i18n: { language },
  } = useTranslation();
  const container = useRef<HTMLDivElement>(null);
  const [unavailable, setUnavailable] = useState(!CLIENT_ID);
  const [busy, setBusy] = useState(false);

  // El callback de Google se registra una vez; así siempre usa el onSignedIn más reciente.
  const onSignedInRef = useRef(onSignedIn);
  onSignedInRef.current = onSignedIn;

  // El botón oficial de Google tiene un ancho fijo en píxeles: se vuelve a dibujar cuando cambia el
  // ancho de su espacio (ej. al achicar la ventana), para que nunca se salga de la pantalla.
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = container.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      const next = Math.round(entry.contentRect.width);
      setWidth((current) => (Math.abs(current - next) >= 8 ? next : current));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [unavailable]);

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;

    const signIn = async (idToken: string) => {
      setBusy(true);
      try {
        const session = await authApi.google(idToken);
        onSignedInRef.current(session.user);
      } catch (error) {
        if (rawErrorMessage(error) !== CONSENT_REQUIRED) {
          toast.error(errorMessage(error));
          return;
        }
        if (!window.confirm(i18n.t("google.consent"))) return;
        try {
          onSignedInRef.current((await authApi.google(idToken, true)).user);
        } catch (retryError) {
          toast.error(errorMessage(retryError));
        }
      } finally {
        if (!cancelled) setBusy(false);
      }
    };

    loadGoogleIdentity()
      .then((google) => {
        if (cancelled || !container.current) return;
        container.current.innerHTML = ""; // al cambiar de idioma o de ancho se vuelve a dibujar el botón
        google.accounts.id.initialize({ client_id: CLIENT_ID, callback: (response) => void signIn(response.credential) });
        google.accounts.id.renderButton(container.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          logo_alignment: "center",
          width: Math.min(MAX_BUTTON_WIDTH, width || container.current.offsetWidth || MAX_BUTTON_WIDTH),
          locale: language,
        });
      })
      .catch(() => {
        if (!cancelled) setUnavailable(true);
      });
    return () => {
      cancelled = true;
    };
  }, [language, width]);

  // RF-024 / RNF-DISP-02: si Google no está configurado o no carga, el usuario sigue con correo y contraseña.
  if (unavailable) {
    return (
      <button
        type="button"
        onClick={() => toast.info(t("google.unavailable"))}
        className="w-full bg-white text-foreground border border-border py-3.5 rounded-xl font-medium text-base shadow-sm hover:bg-muted transition-colors flex items-center justify-center gap-3"
      >
        <FcGoogle className="w-5 h-5" />
        {t("google.continue")}
      </button>
    );
  }

  return (
    <div className={`w-full flex justify-center min-h-[44px] overflow-hidden ${busy ? "opacity-60 pointer-events-none" : ""}`} aria-busy={busy}>
      <div ref={container} className="w-full flex justify-center" />
    </div>
  );
}
