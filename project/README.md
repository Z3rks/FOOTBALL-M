# Football Maestro — Frontend

React 18 + TypeScript + Vite + Tailwind CSS (exportado de Figma Make) conectado a la API del backend.

## Correr la app completa en local

Necesitas el backend corriendo (ver [`backend/README.md`](../backend/README.md)).

```bash
# Terminal 1: base de datos y API
cd backend
npm run db:up
npm run start:dev          # http://localhost:3000/v1

# Terminal 2: frontend
cd project
npm install
cp .env.example .env       # en Windows (PowerShell): Copy-Item .env.example .env
npm run dev                # http://localhost:5173
```

Para entrar como administrador, primero crea una cuenta con `npm run admin:create` en el backend.

La cuenta de administrador de desarrollo está anotada en el [README principal](../README.md#cuenta-de-administrador).

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo en http://localhost:5173 |
| `npm run build` | Compila para producción en `dist/` |
| `npm run preview` | Sirve la versión compilada |
| `npm run typecheck` | Revisa los tipos de TypeScript |

## Variables de entorno

| Variable | Para qué sirve |
|---|---|
| `VITE_API_URL` | URL base de la API (por defecto `http://localhost:3000/v1`) |
| `VITE_GOOGLE_CLIENT_ID` | Client ID de Google (el mismo del backend). Vacío = el botón de Google avisa que no está configurado |

## Cómo está conectado

- `src/app/api/client.ts`: cliente HTTP. El access token vive **solo en memoria** (nunca en `localStorage`); la sesión se mantiene con la cookie `httpOnly` del backend. Si una petición responde 401, renueva la sesión una vez y reintenta.
- `src/app/api/api.ts`: una función por endpoint del Contrato de API.
- `src/app/api/hooks.ts`: `useApi()` carga datos al abrir una pantalla, con estado de carga, error y `reload()`.
- **SplashScreen** recupera la sesión con la cookie y lleva al Home o al panel admin (RF-007/RF-009).
- Mientras la app está abierta envía un **heartbeat** cada 60 s (métricas del panel administrativo).
- `src/app/components/layout/`: estructura de la app web. `PlayerLayout` (barra superior del jugador: Inicio, Juegos, Noticias, Créditos, Perfil), `AdminLayout` (barra superior del portal con sus 6 secciones), `AuthLayout` (presentación a la izquierda y formulario a la derecha en las pantallas de acceso), `TopNav` y `PageHeader` (título de la página, acciones y enlace "atrás" de las subpáginas). El contenido va centrado con un ancho máximo (`max-w-6xl`) y las rejillas se acomodan de 1 columna en celular a 2-5 en escritorio. La partida (`GamePlayScreen`) es un modo enfocado sin barra.
- `src/app/components/shared/`: piezas comunes de las pantallas. En `form.tsx`: `FormField` (etiqueta + campo + ayuda), `TextInput`, `SelectInput` y `ErrorBox`. Úsalas en pantallas nuevas en lugar de copiar clases: cambiar el estilo de los formularios se hace en un solo lugar. (`components/ui/` son componentes genéricos que trajo Figma Make y la app no usa).

Pantallas nuevas que el flujo necesitaba y no estaban en la maqueta:

- `GamePlayScreen`: juega la partida pregunta por pregunta; el puntaje lo calcula el servidor.
- `ForgotPasswordScreen` y `ResetPasswordScreen`: recuperar la contraseña (el correo enlaza a `/reset-password?token=…`).
- `EditProfileScreen` (Perfil → Edit Profile): cambiar el nombre de usuario y el país. RF-112 no detalla estas pantallas; siguen el estilo de las demás.
- `AccountSettingsScreen` (Perfil → Account Settings): cambiar la contraseña (cierra todas las sesiones y pide entrar de nuevo) y eliminar la cuenta con todos sus datos (Ley 1581). Si la cuenta es solo de Google, no tiene contraseña: se explica cómo crear una con "Forgot password?", y para eliminarla se escribe `DELETE`.

## Pendientes

- Vite está fijado en 6.3.5 por Figma Make; `npm audit` reporta 2 alertas que afectan solo al servidor de desarrollo local, no a la app compilada.
