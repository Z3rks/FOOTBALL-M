# Football Maestro — Backend

API REST en NestJS + PostgreSQL. Estructura, módulos y ramas: ver la guía del proyecto y los documentos de diseño en la rama [`documentacion`](https://github.com/Z3rks/Football-Maestro/tree/documentacion).

## Requisitos

- Node.js 20 o superior (incluye npm)
- Docker Desktop (para la base de datos)

## Primera vez

```bash
cd backend
npm install
cp .env.example .env        # en Windows (PowerShell): Copy-Item .env.example .env
# Edita .env y pon un JWT_SECRET (el comando para generarlo está en el archivo)
npm run db:up               # levanta PostgreSQL 16 en Docker
npm run migration:run       # crea las 16 tablas
npm run seed                # carga minijuegos, preguntas, tienda, insignias y datos curiosos
npm run start:dev           # API en http://localhost:3000/v1
```

Para comprobar que todo funciona, abre http://localhost:3000/v1/health. Debe responder:

```json
{ "status": "ok", "database": "up" }
```

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run start:dev` | Inicia la API y la reinicia al guardar cambios |
| `npm run db:up` / `npm run db:down` | Enciende / apaga la base de datos (los datos se conservan) |
| `npm run migration:run` | Aplica las migraciones pendientes |
| `npm run migration:revert` | Deshace la última migración |
| `npm run migration:generate -- src/database/migrations/NombreDelCambio` | Genera una migración a partir de los cambios en las entidades |
| `npm run seed` | Carga los catálogos (se puede repetir sin duplicar datos) |
| `npm run admin:create -- <email> <username>` | Crea un administrador; la contraseña va en la variable `ADMIN_PASSWORD` (ver abajo) |
| `npm run migration:run:prod`, `npm run seed:prod`, `npm run admin:create:prod -- <email> <username>` | Lo mismo con el código compilado de `dist/` (después de `npm run build`); los usa Render al desplegar |
| `npm test` | Pruebas unitarias |
| `npm run test:e2e` | Pruebas de integración (requieren `npm run db:up`) |

## Reglas para trabajar con la base de datos

- **Nunca** se modifica el esquema a mano ni con `synchronize`: todo cambio a una entidad va acompañado de una migración generada con `migration:generate`. Revísala antes de hacer commit.
- Cada entidad vive en la carpeta de su módulo (`src/<modulo>/entities/`). Un módulo no consulta las tablas de otro; usa su servicio público.
- Si una migración generada crea dos veces un mismo tipo `enum` (pasa cuando dos tablas comparten un enum, como `game_category`), borra la creación repetida a mano.

## Arquitectura del código

Monolito modular (Documento de Arquitectura §3-§7). Cada módulo sigue las mismas capas:

```
src/<modulo>/
├── <modulo>.controller.ts     HTTP: valida el DTO y delega; sin lógica de negocio
├── <nombre>.service.ts        reglas de negocio; solo depende de interfaces
├── repositories/
│   ├── <nombre>.repository.ts          interfaz (clase abstracta)
│   └── typeorm-<nombre>.repository.ts  implementación con TypeORM (la única que ve el ORM)
├── entities/                  tablas del módulo
└── <modulo>.module.ts         conecta cada interfaz con su implementación
```

- **Repository + inversión de dependencias:** los servicios reciben la interfaz (`GameSessionsRepository`), nunca TypeORM. Para probar un servicio sin base de datos basta una implementación en memoria (ver `credits/store.service.spec.ts`).
- **Transacciones:** con `UnitOfWork.run(() => …)` (`shared/database`). Los repositorios usados dentro participan solos en la transacción; nadie pasa un `EntityManager` de un módulo a otro.
- **Entre módulos, solo interfaces (clases abstractas) pequeñas, una por consumidor:**
  | Módulo | Exporta | Lo usa |
  |---|---|---|
  | Users | `UserAccounts` | Auth (buscar y crear cuentas, cambiar credenciales) |
  | Users | `CreditBalanceStore` | Credits (leer y mover el saldo) |
  | Users | `PlayerDirectory`, `UsersStatsReader` | Admin (gestionar jugadores y métricas de actividad) |
  | Games | `PlayerGameStatsReader` | Users (perfil, precisión, insignias) |
  | Games | `GamesStatsReader` | Admin (métricas de partidas) |

  Estas interfaces devuelven objetos de lectura propios (`UserAccount`, `PlayerSummary`), nunca la entidad de base de datos. Los enums de rol y estado están en `users/user.enums.ts`. El resto se comunica por eventos de dominio (`shared/events`).
- **Ningún módulo lee tablas de otro.** Para procesar de a una las operaciones de un jugador, cada módulo usa su propio candado (`lockPlayer`, `lockAccount`) en vez de bloquear filas ajenas.
- **Admin separa sus interfaces:** `IUserManagement` (consultar, suspender, eliminar) e `IReportExport` (exportaciones CSV).
- **Jugar, créditos y tienda son solo para jugadores** (`@PlayerOnly()`), así que las métricas nunca mezclan cuentas de administrador.
- `src/architecture.spec.ts` hace fallar `npm test` si alguien rompe estas reglas: un servicio que importe el ORM, un módulo que importe algo de otro que no sea una de esas interfaces (o una clase concreta disfrazada de interfaz), otro módulo que use la entidad `User` fuera de una llave foránea, una dependencia circular o una migración que importe código de la app (una migración es una foto fija: si necesita una función, lleva su propia copia).

## Variables de entorno

Están documentadas en [`.env.example`](.env.example). La aplicación valida las obligatorias al arrancar y no inicia si falta alguna. El archivo `.env` nunca se sube al repositorio.

## Autenticación

Endpoints (Contrato de API §4): `POST /v1/auth/register`, `/register/google`, `/login`, `/login/google`, `/refresh`, `/forgot-password`, `/reset-password` y `/logout`.

- **Access token** (JWT, 15 min): el frontend lo envía en `Authorization: Bearer <token>`.
- **Refresh token** (7 días): va en una cookie `httpOnly` que el navegador envía solo a `/v1/auth/*`. El frontend debe llamar con `credentials: 'include'`. Se rota en cada `/auth/refresh`; si alguien reutiliza uno viejo, se cierran todas las sesiones del usuario.
- **Todos los endpoints requieren token**, salvo los marcados con `@Public()`. Para restringir a administradores: `@Roles(UserRole.ADMIN)`. Para leer el usuario: `@CurrentUser() user`.
- **Límites:** 5 intentos de login cada 15 min por IP; 100 peticiones por minuto en general.

### Crear un administrador

El script pasa por `UsersService` (el dueño de la tabla USER), no escribe directamente en la base de datos.

La API no permite crear administradores. Se crean desde la consola:

```powershell
# PowerShell
$env:ADMIN_PASSWORD="una-contraseña-segura"; npm run admin:create -- admin@footballmaestro.com admin
```

```bash
# bash
ADMIN_PASSWORD="una-contraseña-segura" npm run admin:create -- admin@footballmaestro.com admin
```

### Producción (Vercel + Render + Supabase)

La configuración está en [`render.yaml`](../render.yaml) y [`project/vercel.json`](../project/vercel.json); los pasos, en el [README principal](../README.md#publicar-en-internet).

- **Base de datos:** `DB_SSL=true` (Supabase exige SSL). Con `DB_SSL_CA` (el certificado de Supabase en una línea, con `\n`) además se verifica el servidor. Desde Render se usa el *Session pooler* de Supabase (puerto 5432, usuario `postgres.<ref>`), porque la conexión directa es solo IPv6.
- **Cookie:** Vercel reenvía `/v1` al backend, así que para el navegador frontend y API comparten dominio y `COOKIE_SAMESITE=strict` funciona. `none` solo haría falta si el frontend llamara directo al dominio de Render.
- **Proxy:** `TRUST_PROXY` es el número de proxies delante de la API: `2` en producción (Vercel → Render). Debe ser exacto: con uno de menos, todos los usuarios comparten la IP del proxy en el límite de intentos; con uno de más, cualquiera puede falsificar su IP.
- **Migraciones con el código compilado:** en `dist/` se cargan solo las `.js`. Hay un `.d.ts` por cada migración que TypeORM intentaría ejecutar.

### Pendientes antes de producción

- **Correo:** con `MAIL_API_KEY` y `MAIL_FROM` se envía con Brevo (`BrevoMailSender`); sin clave, el enlace se escribe en la consola (`[DEV] Correo de recuperación…`). Pendiente para producción: autenticar un dominio propio en Brevo para que los correos no caigan en spam. Ver [README principal](../README.md#correo-de-recuperación-de-contraseña).
- **Google:** ya configurado en local (ver "Continuar con Google" en el [README principal](../README.md#continuar-con-google)). Pendiente para producción: agregar el dominio real a los orígenes del cliente OAuth y publicar la app de Google (hoy está en modo prueba: solo entran los usuarios de prueba). Sin `GOOGLE_CLIENT_ID`, el login con Google responde 503.

## Minijuegos

Endpoints (Contrato de API §7): `GET /v1/games`, `GET /v1/games/daily-challenge`, `POST /v1/games/:id/sessions`, `POST /v1/games/sessions/:id/answers`, `PATCH /v1/games/sessions/:id`, `GET /v1/games/sessions/:id` y `POST /v1/games/sessions/:id/share`.

Flujo de una partida en el frontend:

1. `POST /games/:id/sessions` (con `{ "dailyChallenge": true }` si viene de la tarjeta del reto diario). Devuelve hasta 10 preguntas **sin** la respuesta correcta.
2. Por cada pregunta, `POST /games/sessions/:id/answers` con `{ questionNumber, answer }`. Responde si acertó y la respuesta correcta.
3. `PATCH /games/sessions/:id` con `{ "status": "completed" }` (o `"abandoned"` si sale sin terminar). El servidor calcula puntaje, precisión y XP.
4. `GET /games/sessions/:id` para ResultsScreen. Si la app se cerró a mitad de partida, este mismo endpoint devuelve las preguntas para continuar.

Reglas:

- **XP:** 10 por acierto × dificultad (Easy 1, Medium 1,25, Hard 1,5, Expert 2). El reto diario suma +50 XP, una vez por día.
- **Tiempo máximo:** una partida abierta más de 30 minutos queda abandonada.
- **El día cambia a medianoche de `APP_TIMEZONE`** (por defecto Bogotá), no de UTC.
- **Preguntas:** el banco tiene unas 20 por minijuego (203 en total) y cada partida toma 10 al azar. Al agregar preguntas (en `src/database/seeds/data/games.data.ts` + `npm run seed`) las partidas crecen solas hasta 10.
- **Cada minijuego tiene su propio estilo.** La partida trae `playStyle` y cada pregunta trae `details` (datos públicos del estilo; nunca la respuesta). El frontend dibuja cada estilo con su vista en `project/src/app/components/games/`.

  | Minijuego | `playStyle` | Regla (estrategia) | Cómo se responde |
  |---|---|---|---|
  | Who is it? | `clues` | Opción múltiple | Pistas que se revelan una a una |
  | Silhouette | `silhouette` | Opción múltiple | Ficha borrosa que se aclara |
  | Guess the Badge | `crest` | Opción múltiple | Escudo dibujado con los colores del club |
  | Guess the Stadium | `stadium` | Opción múltiple | Ficha del estadio revelada por partes |
  | Connections | `connections` | `ConnectionsStrategy` | Elegir 4 de 8 que formen un grupo (`answer` = JSON con los 4) |
  | Timeline | `timeline` | `TimelineStrategy` | Ordenar 4 eventos (`answer` = JSON con el orden) |
  | The Transfer | `career` | Opción múltiple | Trayectoria de clubes con el siguiente oculto |
  | How much was he worth? | `value` | `ValueGuessStrategy` | Deslizador; acierta si queda a ±10 % (mínimo 5 M) |
  | Dream Team | `lineup` | Opción múltiple | Alineación sobre la cancha con un jugador oculto |
  | Goal or No Goal? | `var` | `VarStrategy` | Decisión del VAR; al responder se ve la regla |

  Para dar su estilo a un minijuego nuevo: su estrategia en `GameFactory`, sus preguntas con `details` en la semilla y su vista en `components/games/playStyles.ts`. No se usan fotos ni escudos reales (derechos de autor): el frontend dibuja siluetas, escudos con colores y canchas.
- Al completar una partida se emite `GameCompletedEvent` (Users actualiza el perfil; Credits da +50 si era el reto diario). Al compartir por primera vez se emite `ResultSharedEvent` (Credits da +25).

## Perfil y progreso

Endpoints (Contrato de API §5): `GET/PATCH/DELETE /v1/users/me`, `PATCH /v1/users/me/password`, `GET /v1/users/me/stats`, `GET /v1/users/me/badges` y `POST /v1/activity/heartbeat`.

- **Nivel:** 100 XP por nivel (nivel 1 con 0 XP, nivel 2 con 100…). `GET /users/me` devuelve también `xpToNextLevel`.
- **Racha:** sube si juega un día después del anterior y vuelve a 1 si deja pasar un día. Si ya está rota, se muestra en 0 aunque todavía no haya vuelto a jugar. Al llegar a 7, 14, 21… días se emite `StreakReachedEvent` (Credits da +100).
- **Precisión:** histórica, aciertos totales / preguntas totales de las partidas completadas.
- **Insignias:** se otorgan al completar partidas (primera partida, partida perfecta, racha de 7, 10 retos diarios, todas las categorías, nivel 20). "Coleccionista" se otorga con la primera compra en la tienda.
- **Cambiar la contraseña** cierra todas las sesiones, incluida la actual: el frontend debe llevar al usuario a iniciar sesión de nuevo.
- **Eliminar la cuenta** exige la contraseña (si la cuenta tiene una) y borra en cascada sus partidas, insignias, créditos, sesiones y tokens. Los administradores no pueden borrarse a sí mismos.
- **Heartbeat:** el frontend debe llamarlo al abrir la app y cada ~60 s mientras esté en primer plano. Con eso se calculan las métricas de actividad del panel administrativo. Solo guarda el inicio y la última actividad de cada sesión.

## Créditos y tienda

Endpoints (Contrato de API §8): `GET /v1/credits/balance`, `GET /v1/credits/earn-methods`, `GET /v1/credits/transactions?page=&limit=`, `GET /v1/store/items`, `POST /v1/store/items/:id/purchase` y `POST /v1/store/items/:id/equip`.

- **Recompensas automáticas** (por eventos): +50 al completar el reto diario, +25 la primera vez que se comparte una partida, +100 cada 7 días de racha y +200 a quien invita a un amigo (el amigo se registra con `referralCode` = username de quien lo invitó). Los montos solo están en `src/credits/credits.service.ts`.
- **Cada movimiento queda en el libro contable** (`credit_transactions`) y el saldo cambia en la misma transacción. La misma recompensa con la misma referencia no se paga dos veces, y la base de datos impide saldos negativos.
- **Compras:** se procesan de a una por usuario, así dos compras simultáneas no gastan el mismo saldo. El artículo comprado queda aplicado al perfil (uno por tipo); con `/equip` se vuelve a aplicar uno ya comprado. La primera compra da la insignia "Coleccionista". Máximo 10 compras por minuto.

## Noticias

Endpoints (Contrato de API §6): `GET /v1/news?category=&search=&days=&page=&limit=` y `GET /v1/news/:id`. `category` acepta `Transfers`, `Champions League`, `World Cup`, `Premier League`, `La Liga`, `Serie A`, `Bundesliga`, `Copa Libertadores` o `All`; `search` busca en el título y la descripción (máx. 100 caracteres); `days` = 1, 3 o 7 deja solo las noticias de ese período.

- **Fuente:** [Currents API](https://currentsapi.services) (plan gratuito: 250 peticiones/día, sin retraso, pensado para prototipos). La clave va en `NEWS_API_KEY`. **Es secreta**: vive solo en `.env` (y en las variables de entorno del servidor al desplegar), nunca en el repositorio. Cada integrante puede sacar la suya gratis en currentsapi.services, para no compartir el cupo diario.
- **Búsqueda:** una por categoría e idioma con el parámetro `keywords` ("transfer news", "Champions League", "La Liga"…; en español "fichajes", "Mundial", "LaLiga"…). Currents ignora `query`. Su búsqueda es aproximada, así que el adaptador además descarta (`isRelevant` en `currents.provider.ts`): noticias de otros deportes (NFL, rugby, críquet, ciclismo, atletismo, balonmano…), marcadores que no son de fútbol (ej. 29-39), en español las que no tienen ninguna palabra de fútbol ("Mundial" y "fichajes" se usan en cualquier deporte) y las que no mencionan el tema de la categoría. También se ignoran fuentes que no son de fútbol o que solo repiten enlaces (Cricinfo, Reddit). Máximo 20 resultados por consulta; las noticias se acumulan con cada sincronización.
- **Sin repetidas:** varios medios de un mismo grupo publican la misma nota. Si ya hay una noticia con el mismo título normalizado (`title_key`: minúsculas, solo letras y números) o la misma imagen en ese idioma, la nueva no se guarda.
- **Sin clave** (desarrollo): se cargan 10 noticias de ejemplo (al menos una por categoría), con fuente "Ejemplo" y enlaces a example.com. Al poner la clave, se pueden borrar con `DELETE FROM news_articles WHERE external_id LIKE 'sample:%'`.
- **Sincronización:** cada `NEWS_SYNC_MINUTES` (120 por defecto; 8 categorías × 2 idiomas × 12 veces = 192 peticiones al día). Al arrancar solo sincroniza si la última vez (`synced_at` más reciente) fue hace más de ese intervalo: en Render gratis el servidor se apaga sin visitas, y cada arranque gastaría el cupo. La app siempre lee de la base de datos, así que el feed sigue funcionando aunque Currents falle. Se borran las noticias de más de 30 días.
- **Cambiar de proveedor** (ej. a un plan pago al publicar): implementar `NewsProvider` en una clase nueva y elegirla en `news.module.ts`.
- Solo se guardan enlaces `http(s)`, porque el frontend los abre al tocar una noticia.

## Panel administrativo

Endpoints (Contrato de API §9), todos solo para `role=admin`:

| Pantalla | Endpoints |
|---|---|
| AdminDashboardScreen | `GET /v1/admin/dashboard/summary`, `/dau`, `/ranking` |
| AdminUsersScreen | `GET /v1/admin/users?search=&filter=&page=&limit=`, `GET /users/export`, `GET /users/:id`, `PATCH /users/:id/status`, `DELETE /users/:id` |
| AdminAnalyticsScreen | `GET /v1/admin/analytics/kpis`, `/growth`, `/retention`, `/categories`, `/session-duration`, `/accuracy-radar` |
| AdminReportsScreen | `GET /v1/admin/reports/summary?month=YYYY-MM`, `/top-players`, `/category-performance`, `/peak-hours`, `/export` |

- **Solo jugadores:** las métricas y la gestión de usuarios excluyen las cuentas de administrador (no se pueden suspender ni borrar desde el panel).
- **Auditoría:** suspender, activar, eliminar y exportar quedan en `admin_audit_logs` con el administrador, la IP y el usuario afectado. Se registran antes de ejecutar la acción, para que nunca quede una acción sin registro.
- **Suspender** cierra todas las sesiones del jugador al instante.
- **Variaciones de los KPIs:** usuarios totales frente a hace 7 días; activos, partidas y precisión de hoy frente a ayer (la precisión en puntos). `change` es `null` cuando no hay base de comparación (el período anterior fue 0).
- **Alertas** (calculadas con los datos): caída de 3 o más puntos en la retención día 7 frente a la semana anterior, y récord diario de partidas.
- **Retención día N:** porcentaje de jugadores registrados hace al menos N días que volvieron a tener actividad el día N o después. Se calcula con el heartbeat, así que el frontend debe enviarlo.
- **CSV:** con BOM UTF-8 (Excel muestra bien las tildes) y protegidos contra inyección de fórmulas.
- Admin no consulta las tablas de otros módulos: usa las interfaces `PlayerDirectory`, `UsersStatsReader` y `GamesStatsReader`. Dentro de Admin, la gestión de jugadores y las exportaciones están separadas en `IUserManagement` e `IReportExport`.

## Estado actual

- Base: NestJS con prefijo `/v1`, validación global de DTOs, CORS restringido al frontend, límite de 1 MB por petición, las 16 entidades, migraciones y datos iniciales (10 minijuegos, 203 preguntas en inglés y español, 6 artículos, 7 insignias, 9 datos curiosos).
- `GET /v1/health`.
- Módulo Auth completo, con registro de auditoría de los inicios de sesión de administradores.
- Módulo Games completo: catálogo, reto diario, partidas con puntaje calculado en el servidor, resultados y compartir.
- Módulo Users completo: perfil, estadísticas, progreso (XP, nivel, racha, precisión, insignias), editar perfil, cambiar contraseña, eliminar cuenta y actividad de uso.
- Módulo Credits completo: saldo, recompensas, historial y tienda.
- Módulo News completo: sincronización con Currents API (o noticias de ejemplo sin clave), feed por categoría y detalle.
- Módulo Admin completo: dashboard, gestión de usuarios, analytics, reportes y exportación CSV, con auditoría.

Los 6 módulos del backend (Auth, Users, News, Games, Credits y Admin) cubren los endpoints del Contrato de API. Lo que falta para producción está en "Pendientes antes de producción".
