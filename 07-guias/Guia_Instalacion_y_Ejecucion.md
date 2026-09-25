# Guía de instalación y ejecución

Cómo correr Football Maestro en un PC. El `README.md` de la rama `main` tiene estos mismos pasos, junto con la cuenta de administrador de desarrollo.

## 1. Requisitos

- [Node.js](https://nodejs.org) 20 o superior (incluye npm)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/), para PostgreSQL 16
- Git

## 2. Primera vez

Abre Docker Desktop y espera a que esté corriendo. Luego, en PowerShell:

```powershell
git clone https://github.com/Z3rks/Football-Maestro.git
cd Football-Maestro

# Backend
cd backend
npm install
Copy-Item .env.example .env
```

En `backend/.env` pon un valor en `JWT_SECRET` (mínimo 32 caracteres). Para generarlo:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Sigue en `backend`:

```powershell
npm run db:up           # enciende PostgreSQL en Docker
npm run migration:run   # crea las 16 tablas
npm run seed            # minijuegos, preguntas, tienda, insignias y datos curiosos
npm run start:dev       # API en http://localhost:3000/v1
```

En **otra terminal**:

```powershell
cd Football-Maestro\project
npm install
Copy-Item .env.example .env
npm run dev             # app en http://localhost:5173
```

Abre **http://localhost:5173**.

## 3. Los días siguientes

Con Docker Desktop abierto: en una terminal `cd backend`, `npm run db:up` y `npm run start:dev`; en otra, `cd project` y `npm run dev`.

Si alguien subió cambios: `git pull`, luego `npm install` y `npm run migration:run` en `backend`, y `npm install` en `project`.

## 4. Cuenta de administrador

La API no permite crear administradores; se crean desde la consola, en `backend`:

```powershell
$env:ADMIN_PASSWORD="una-contraseña-segura"; npm run admin:create -- admin@footballmaestro.com admin
```

En Sign In se elige el modo **Admin**.

## 5. Servicios externos (opcionales)

Sin ellos la app funciona igual: noticias de ejemplo, botón de Google deshabilitado y enlace de recuperación en la consola. Cómo configurarlos: [Guía de servicios externos](Guia_Servicios_Externos.md).

## 6. Comprobar que todo funciona

| Qué | Cómo |
|---|---|
| API y base de datos | http://localhost:3000/v1/health responde `{"status":"ok","database":"up"}` |
| Pruebas unitarias y de arquitectura | `npm test` en `backend` (364 pruebas) |
| Pruebas E2E | `npm run test:e2e` en `backend`, con la base de datos encendida (110 pruebas) |
| Tipos del frontend | `npm run typecheck` en `project` |

## 7. Problemas comunes

| Síntoma | Solución |
|---|---|
| `ECONNREFUSED` al iniciar el backend | Docker Desktop no está abierto o falta `npm run db:up` |
| El backend dice que falta `JWT_SECRET` o `MAIL_FROM` | Complétalos en `backend/.env` (`MAIL_FROM` solo si hay `MAIL_API_KEY`) |
| La app se queda cargando o no inicia sesión | El backend no está corriendo en el puerto 3000 |
| `429 Too Many Requests` al iniciar sesión | Se superaron los 5 intentos de login en 15 minutos (protección contra fuerza bruta). Espera, o reinicia el backend en desarrollo |
| `Port 5173 is already in use` | Ya hay otro `npm run dev` abierto |
| Apagar la base de datos | `npm run db:down` en `backend` (los datos se conservan) |
