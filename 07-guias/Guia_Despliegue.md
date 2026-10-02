# Guía de despliegue

Cómo publicar Football Maestro en internet para que cualquiera la use y los usuarios queden guardados de forma definitiva. Todo usa planes gratuitos.

| Parte | Servicio | Configuración en el código (rama `main`) |
|---|---|---|
| Frontend (React + Vite) | Vercel | `project/vercel.json` |
| Backend (NestJS) | Render, plan gratis | `render.yaml` |
| PostgreSQL | Supabase, proyecto **Football Maestro** (región `us-east-2`) | variables `DB_*` en Render |

```
Navegador ──HTTPS──► Vercel ──reenvía /v1──► Render ──SSL──► Supabase (PostgreSQL)
                     (la app)                (la API)         └─► Google, Currents, Brevo
```

El navegador solo habla con Vercel: la app y la API (`/v1`) salen del mismo dominio, y Vercel reenvía `/v1` al backend de Render (`rewrites` de `project/vercel.json`). Por eso la cookie de sesión es del mismo sitio: funciona en Safari y en iPhone, y no hace falta configurar CORS entre dominios.

## 0. Antes de empezar

- El código a publicar es el de `main`. Render y Vercel lo descargan de GitHub.
- **Permiso en GitHub:** el repositorio es privado y su dueño es Z3rks. Z3rks debe autorizar las apps de **Vercel** y **Render** en su GitHub (Settings → Applications → la app → *Repository access* → Football-Maestro). Sin eso, ni Vercel ni Render ven el repositorio.
- **Vercel gratis y repositorios privados:** solo despliega automáticamente los cambios cuyo autor es el dueño de la cuenta de Vercel. Si la cuenta es de santymaya9, los Pull Requests que él une a `main` se publican solos; si los une otra persona, ese despliegue queda bloqueado y se publica a mano con **Redeploy**.
- **Secretos:** la contraseña de la base, `JWT_SECRET` y las claves de Currents y Brevo se escriben solo en el panel de Render. Nunca en el repositorio, en un `.env` compartido ni por chat.

## 1. Supabase (PostgreSQL)

El proyecto **Football Maestro** ya existe. Se dejó vacío el 2 de octubre de 2026 (se borró un prototipo viejo de junio que tenía otras tablas).

1. Si aparece **Paused**, pulsar **Restore project** y esperar a que diga *Healthy* (unos minutos). Supabase gratis pausa el proyecto tras 7 días sin actividad.
2. **Contraseña de la base:** Project Settings → Database → *Reset database password*. Guardarla en un lugar seguro: se usa en Render (paso 2) y para crear el administrador (paso 4).
3. **Datos de conexión:** botón **Connect** → pestaña *Connection string* → **Session pooler**. De ahí salen:

| Variable | Valor |
|---|---|
| `DB_HOST` | el host del *Session pooler*, de la forma `aws-0-us-east-2.pooler.supabase.com` (copiarlo de Supabase) |
| `DB_PORT` | `5432` |
| `DB_NAME` | `postgres` |
| `DB_USER` | `postgres.iinmsmpajahnmfewqtml` (con el punto y la referencia del proyecto) |
| `DB_PASSWORD` | la del paso 2 |

> Se usa el **Session pooler** y no la conexión directa (`db.iinmsmpajahnmfewqtml.supabase.co`) porque la directa es solo IPv6 y Render no la alcanza. El modo *Transaction* (puerto 6543) no sirve: el backend usa transacciones y bloqueos que necesitan una sesión.

Las tablas no se crean a mano: las crea Render al desplegar (paso 2), con las mismas migraciones de siempre.

## 2. Render (backend)

1. En [render.com](https://render.com), **New → Blueprint** y elegir el repositorio `Z3rks/Football-Maestro`, rama `main`. Render lee `render.yaml` y propone el servicio **football-maestro-api** (plan gratis, región Ohio, la misma zona que Supabase).
2. Render pide los valores marcados como secretos en `render.yaml`:

| Variable | Qué poner |
|---|---|
| `FRONTEND_URL` | la dirección de Vercel, ej. `https://football-maestro.vercel.app` (si aún no existe, poner esa y corregirla en el paso 3) |
| `DB_HOST`, `DB_USER`, `DB_PASSWORD` | los del paso 1 |
| `GOOGLE_CLIENT_ID` | el Client ID de Google (opcional; vacío = sin "Continuar con Google") |
| `NEWS_API_KEY` | una clave **nueva** de Currents (opcional; vacío = 10 noticias de ejemplo) |
| `MAIL_API_KEY`, `MAIL_FROM` | una clave **nueva** de Brevo y su remitente verificado (opcionales; vacíos = el enlace de recuperación queda en los *Logs* de Render) |

   Las demás ya vienen en `render.yaml`: `NODE_ENV=production`, `TRUST_PROXY=2`, `DB_SSL=true`, `COOKIE_SAMESITE=strict`, `NEWS_SYNC_MINUTES=120`, y Render genera un `JWT_SECRET` aleatorio.
3. **Apply.** El primer despliegue tarda unos minutos. El build instala, compila, **aplica las migraciones** y **carga los catálogos** (10 minijuegos, 203 preguntas, tienda e insignias). Cada despliegue siguiente hace lo mismo con lo nuevo; todo es idempotente.
4. Comprobar: `https://football-maestro-api.onrender.com/v1/health` responde `{"status":"ok","database":"up"}`. Si Render le dio otro nombre al servicio (porque ese ya existía), anotar la dirección real: va en `project/vercel.json` (paso 3).

> **Plan gratis:** el servicio se apaga tras 15 minutos sin visitas y la siguiente visita tarda cerca de un minuto en despertarlo. Al despertar no vuelve a pedir noticias si las sincronizó hace menos de 120 minutos, para no gastar el cupo diario de Currents.

## 3. Vercel (frontend)

1. En [vercel.com](https://vercel.com), **Add New → Project** e importar `Z3rks/Football-Maestro`.
2. **Root Directory:** `project`. El resto lo toma de `project/vercel.json` (Vite, `npm ci`, `npm run build`, carpeta `dist`).
3. **Environment Variables:** solo `VITE_GOOGLE_CLIENT_ID` (el mismo Client ID de Google; opcional). `VITE_API_URL` **no** se pone: en producción la app llama a `/v1` de su mismo dominio.
4. **Deploy.** La dirección queda como `https://<nombre-del-proyecto>.vercel.app`.
5. Si esa dirección no es la que se puso en `FRONTEND_URL`, corregirla en Render (Environment) y guardar: Render se vuelve a desplegar solo.
6. Si el backend no quedó en `https://football-maestro-api.onrender.com`, cambiar esa dirección en `project/vercel.json` (regla `/v1/:path*`), por Pull Request a `main`.

## 4. Crear el administrador

La API no permite crear administradores. Se crea una vez, desde un PC con el proyecto clonado, apuntando a Supabase. En PowerShell, dentro de `backend`:

```powershell
$env:DB_HOST="aws-0-us-east-2.pooler.supabase.com"   # el host del paso 1
$env:DB_PORT="5432"; $env:DB_NAME="postgres"; $env:DB_SSL="true"
$env:DB_USER="postgres.iinmsmpajahnmfewqtml"
$env:DB_PASSWORD="la-contraseña-de-supabase"
$env:ADMIN_PASSWORD="una-contraseña-nueva-y-segura"
npm run admin:create -- admin@footballmaestro.com admin
```

- Las variables de la terminal tienen prioridad sobre el `backend/.env`, así que el comando escribe en Supabase y no en la base local.
- La contraseña del administrador publicado debe ser **distinta** a la de desarrollo.
- Al terminar, cerrar esa terminal: las variables (con la contraseña de la base) desaparecen con ella.

## 5. Google, correo y noticias

- **Google:** en Google Cloud Console (proyecto `football-maestro-509620`) → Google Auth Platform → Clientes → el cliente OAuth → **Orígenes autorizados de JavaScript**: agregar la dirección de Vercel. Mientras la app de Google siga en modo prueba, solo entran los correos agregados como *usuarios de prueba*; para abrirla a todos, en **Público** pulsar **Publicar app** (ver [Guía de servicios externos](Guia_Servicios_Externos.md)).
- **Correo (Brevo):** funciona con el remitente Gmail verificado, pero puede llegar a spam hasta autenticar un dominio propio (SPF/DKIM).
- **Noticias (Currents):** con `NEWS_API_KEY` en Render se ven noticias reales; usar una clave distinta a la de desarrollo, porque las dos comparten el cupo de 250 peticiones al día.

## 6. Comprobar que todo funciona

| Qué | Cómo |
|---|---|
| Backend y base de datos | `https://<backend>.onrender.com/v1/health` → `{"status":"ok","database":"up"}` |
| La API a través de Vercel | `https://<app>.vercel.app/v1/health` → la misma respuesta (prueba el reenvío) |
| Registro y sesión | crear una cuenta, cerrar la pestaña, volver a abrir: debe seguir con la sesión iniciada |
| Recargar en una ruta | abrir `https://<app>.vercel.app/reset-password` directamente: carga la app, no un 404 |
| Administrador | entrar en modo **Admin** con la cuenta del paso 4 |

## 7. Actualizar la app publicada

- Cada Pull Request unido a `main` vuelve a desplegar el backend (Render) y el frontend (Vercel). Si el cambio trae migraciones, Render las aplica en el build.
- Si un despliegue de Vercel queda bloqueado (paso 0), entrar al proyecto en Vercel → Deployments → **Redeploy**.
- Los datos de la app publicada viven en Supabase, aparte de la base de Docker de cada PC: lo que se crea en local no aparece en la app publicada, ni al revés.

## 8. Problemas comunes

| Síntoma | Causa y solución |
|---|---|
| El build de Render falla en `migration:run:prod` con *password authentication failed* | `DB_USER` o `DB_PASSWORD` mal copiados. `DB_USER` lleva la referencia: `postgres.iinmsmpajahnmfewqtml` |
| El build de Render falla con *ENETUNREACH* o *timeout* hacia la base | Se usó el host de la conexión directa (IPv6). Usar el del **Session pooler** |
| La app dice "No se pudo conectar con el servidor" | El backend está despertando (esperar un minuto) o la dirección de Render en `project/vercel.json` no es la correcta |
| No se mantiene la sesión al recargar | `FRONTEND_URL` en Render no coincide exactamente con la dirección de Vercel (con `https://` y sin `/` al final) |
| "Continuar con Google" da error de origen | Falta la dirección de Vercel en los orígenes autorizados del cliente OAuth |
| `429 Too Many Requests` al iniciar sesión | Límite de 5 intentos en 15 minutos por persona. En producción no se reinicia el backend para saltárselo: hay que esperar |
| Supabase dice *Paused* | Pasaron 7 días sin uso: **Restore project** en el panel de Supabase |
