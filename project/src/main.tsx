import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import "./app/i18n"; // inicializa los idiomas antes de montar la app
import App from "./app/App";
import "./styles/index.css";

// Punto de entrada fuera de Figma Make (npm run dev / npm run build).
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <Toaster position="top-center" richColors />
  </StrictMode>,
);
