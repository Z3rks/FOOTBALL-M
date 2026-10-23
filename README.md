# Football Maestro

Aplicación web de trivia y minijuegos de fútbol: 10 minijuegos, reto diario, noticias, créditos con tienda y panel administrativo.

| Carpeta | Qué es |
|---|---|
| [`backend/`](backend/README.md) | API REST en NestJS + PostgreSQL (monolito modular: auth, users, games, credits, news, admin) |
| [`project/`](project/README.md) | Frontend en React + Vite + Tailwind (21 pantallas, diseño web responsivo) |
| [`render.yaml`](render.yaml), [`project/vercel.json`](project/vercel.json) | Configuración del despliegue (ver "Publicar en internet") |

Los documentos de diseño (requisitos, arquitectura, modelo de datos, contrato de API, seguridad y pruebas) están en la rama [`documentacion`](https://github.com/Z3rks/Football-Maestro/tree/documentacion). El repositorio tiene solo dos ramas permanentes, `main` (el código) y `documentacion`; cómo se construyó el proyecto, etapa por etapa, queda en el historial de commits de `main`.

## Requisitos

- [Node.js](https://nodejs.org) 20 o superior (incluye npm)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (para la base de datos PostgreSQL)
- Git

## Correr el proyecto por primera vez

Abre Docker Desktop y espera a que diga que está corriendo. Después, en PowerShell:

```powershell
git clone https://github.com/Z3rks/Football-Maestro.git
cd Football-Maestro

# 1. Backend
cd backend
npm install
Copy-Item .env.example .env
```

Abre `backend/.env` y ponle un valor a `JWT_SECRET`. Para generar uno:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Sigue en la carpeta `backend`:

```powershell
npm run db:up           # enciende PostgreSQL en Docker
npm run migration:run   # crea las tablas
npm run seed            # carga minijuegos, preguntas, tienda e insignias
npm run start:dev       # API en http://localhost:3000/v1
```

Deja esa terminal abierta. En **otra terminal**:

```powershell
# 2. Frontend
cd Football-Maestro\project
npm install
Copy-Item .env.example .env
npm run dev             # app en http://localhost:5173
```

Abre **http://localhost:5173** en el navegador.

> En bash (Mac/Linux/Git Bash) cambia `Copy-Item` por `cp`.

## Correrlo los días siguientes

Con Docker Desktop abierto, dos terminales:

```powershell
# Terminal 1
cd Football-Maestro\backend
npm run db:up
npm run start:dev

# Terminal 2
cd Football-Maestro\project
npm run dev
```

Si alguien subió cambios nuevos, antes de arrancar ejecuta `git pull`, y luego `npm install` y `npm run migration:run` en `backend` (y `npm install` en `project`).

## Cuenta de administrador

La API no permite crear administradores; se crean desde la consola, en la carpeta `backend`:

```powershell
$env:ADMIN_PASSWORD="una-contraseña-segura"; npm run admin:create -- admin@footballmaestro.com admin
```

Cuenta ya creada en la base de datos local de desarrollo (solo existe en ese PC):

| Correo | Contraseña |
|---|---|
| `admin@footballmaestro.com` | `Maestro-699210e4` |

En SignInScreen elige el modo **Admin**. **No usar esta contraseña en producción.**

## Comprobar que todo funciona

| Qué | Cómo |
|---|---|
| API y base de datos | http://localhost:3000/v1/health debe responder `{"status":"ok","database":"up"}` |
| Pruebas unitarias del backend | `cd backend` y `npm test` |
| Pruebas de integración del backend | `cd backend` y `npm run test:e2e` (con la base de datos encendida) |
| Tipos del frontend | `cd project` y `npm run typecheck` |

## Problemas comunes

| Síntoma | Solución |
|---|---|
| `ECONNREFUSED` al iniciar el backend | Docker Desktop no está abierto o falta `npm run db:up` |
| El backend dice que falta `JWT_SECRET` | Ponlo en `backend/.env` (mínimo 32 caracteres) |
| La app se queda en la pantalla de carga o no inicia sesión | El backend no está corriendo en el puerto 3000 |
| `Port 5173 is already in use` | Ya hay otro `npm run dev` abierto; ciérralo o usa esa ventana |
| Apagar la base de datos | `npm run db:down` en `backend` (los datos se conservan) |

## Opcional: servicios externos

Se configuran en `backend/.env`. Sin ellos la app funciona igual:

| Variable | Sin configurar |
|---|---|
| `NEWS_API_KEY` ([Currents API](https://currentsapi.services), clave gratuita y **secreta**: cada quien saca la suya) | Muestra 10 noticias de ejemplo en lugar de noticias reales |
| `GOOGLE_CLIENT_ID` (también `VITE_GOOGLE_CLIENT_ID` en `project/.env`) | El botón de Google avisa que no está configurado |
| `MAIL_API_KEY` + `MAIL_FROM` ([Brevo](https://www.brevo.com), clave **secreta**) | El enlace para recuperar la contraseña se imprime en la consola del backend en lugar de enviarse por correo |

## Correo de recuperación de contraseña

Funciona con [Brevo](https://www.brevo.com) (plan gratuito: 300 correos al día). Sin dominio propio, los correos salen desde un Gmail verificado como remitente en Brevo.

Para activarlo en tu PC, en `backend/.env`:

```
MAIL_API_KEY=xkeysib-...          # Brevo → ⚙️ → SMTP y API → Claves API
MAIL_FROM=tu-correo@gmail.com     # debe estar verificado en Brevo → ⚙️ → Remitentes
MAIL_FROM_NAME=Football Maestro
```

- La clave es secreta y nunca se sube. Si alguien del equipo la necesita, lo mejor es que cree su propia cuenta de Brevo, o que se le comparta por un canal privado.
- Para crear la clave, Brevo exige primero verificar un número de teléfono en la cuenta.
- Al principio los correos pueden llegar a **spam**: se envían "en nombre de" un Gmail a través de Brevo. Se soluciona al desplegar, con un dominio propio autenticado en Brevo (SPF/DKIM).
- En Brevo → Transaccional → Registros se ve si cada correo se entregó, se abrió o rebotó.

## Continuar con Google

Ya funciona en local. El cliente OAuth está en el proyecto de Google Cloud **Football Maestro** (`football-maestro-509620`), cliente "Football Maestro local", con los orígenes `http://localhost:5173` y `http://localhost`.

Para usarlo en tu PC, pon el mismo Client ID en `GOOGLE_CLIENT_ID` (`backend/.env`) y en `VITE_GOOGLE_CLIENT_ID` (`project/.env`), y reinicia el backend y el frontend. El Client ID no es secreto, pero los `.env` nunca se suben; pídeselo a quien administra el proyecto de Google Cloud. El "secreto del cliente" no se usa.

> **⚠️ Pendiente: la app de Google sigue en modo prueba.** Por ahora solo pueden entrar con Google los correos agregados como **usuarios de prueba** (máximo 100) en [Google Auth Platform → Público](https://console.cloud.google.com/auth/audience?project=football-maestro-509620). Cualquier otra cuenta ve "Acceso bloqueado". Quien no esté en la lista puede registrarse con correo y contraseña.

Para terminar esta parte **cuando la app se despliegue en internet**:

1. Agregar el dominio real (ej. `https://football-maestro.vercel.app`) en los orígenes autorizados de JavaScript del cliente OAuth. Si el dominio no está, Google rechaza el inicio de sesión.
2. Poner el Client ID en `GOOGLE_CLIENT_ID` (Render) y en `VITE_GOOGLE_CLIENT_ID` (Vercel), y volver a desplegar el frontend: Vite lo incluye al compilar.
3. En **Público**, pulsar **Publicar app** para que entre cualquier cuenta de Google. Esto no publica la aplicación, solo cambia quién puede usar el botón. Como solo se piden nombre, correo y foto, Google no exige revisión; hasta verificar la marca, los usuarios pueden ver un aviso de "app no verificada".

## Publicar en internet

La app publicada usa tres servicios gratuitos, cada uno con una parte:

| Parte | Servicio | Configuración |
|---|---|---|
| Frontend | [Vercel](https://vercel.com) (proyecto con *Root Directory* `project`) | [`project/vercel.json`](project/vercel.json) |
| Backend | [Render](https://render.com), plan gratis (Blueprint) | [`render.yaml`](render.yaml) |
| PostgreSQL | [Supabase](https://supabase.com), proyecto "Football Maestro" | Variables `DB_*` y `DB_SSL=true` en Render |

- **Mismo dominio para el navegador:** el frontend llama a la API en `/v1` de su propio dominio y Vercel reenvía esas peticiones al backend de Render. Así la cookie de sesión es del mismo sitio (funciona en Safari y en iPhone) y no hace falta CORS.
- **Cada despliegue** del backend compila, aplica las migraciones pendientes y vuelve a cargar los catálogos (minijuegos, preguntas, tienda e insignias); todo eso es idempotente.
- **Render gratis se apaga** tras 15 minutos sin visitas: la primera visita después tarda cerca de un minuto en despertarlo. Al despertar no vuelve a sincronizar noticias si lo hizo hace menos de `NEWS_SYNC_MINUTES`, para no gastar el cupo de Currents.
- **Los usuarios de la app publicada viven en Supabase**, aparte de la base de Docker de cada PC: lo que se crea en local no aparece en la app publicada, ni al revés.
- **Secretos** (contraseña de la base, `JWT_SECRET`, claves de Currents y Brevo) solo en el panel de Render. Nunca en el repositorio ni por chat.

Paso a paso, con qué poner en cada variable: [Guía de despliegue](https://github.com/Z3rks/Football-Maestro/blob/documentacion/07-guias/Guia_Despliegue.md) (rama `documentacion`).
