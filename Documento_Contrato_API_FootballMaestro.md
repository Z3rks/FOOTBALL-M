**FOOTBALL MAESTRO**

*Become a Football Maestro*

**DOCUMENTO DE CONTRATO DE API (REST)**

Especificación de endpoints del backend

(Complemento de Arquitectura de Software y Modelo de Datos)

Fecha de elaboración: 23 de septiembre de 2026

Fecha de actualización: 24 de septiembre de 2026

Versión: 1.6

---

## 1. Introducción

Este documento define el contrato de la API REST del backend de “Football Maestro”. Cada endpoint se derivó de los requisitos funcionales (RF-XXX) del Documento de Requisitos v2 y respeta los módulos, capas y entidades definidos en los documentos de Arquitectura de Software y Modelo de Datos. Cubre las 14 pantallas del sistema; el módulo futuro de Partidos y Estadísticas queda fuera de alcance.

## 2. Objetivo del documento

Especificar, de manera formal y trazable, cada endpoint expuesto por el backend: método HTTP, ruta, propósito, autenticación requerida y su relación con los requisitos funcionales que satisface, sirviendo como contrato entre el frontend ya construido y el backend a implementar.

## 3. Convenciones generales

| Convención | Detalle |
| --- | --- |
| URL base | https://api.footballmaestro.com/v1 |
| Formato | JSON en request y response (Content-Type: application/json), salvo las exportaciones CSV (text/csv). |
| Autenticación | Access token JWT de corta duración (15–30 min) en el header Authorization: Bearer {accessToken}, obtenido en POST /auth/login o /auth/login/google. El refresh token se entrega en una cookie httpOnly, Secure, SameSite=Strict y se renueva en POST /auth/refresh. Todos los endpoints requieren access token salvo los endpoints públicos del módulo Auth (sección 4.1). Los de /admin/* además validan role=admin en el backend (RNF-SEC-03), y los de /games, /credits y /store solo aceptan role=player: un administrador recibe 403 (las métricas nunca mezclan partidas de administradores). |
| Códigos de estado | 200 OK, 201 Created, 204 No Content, 400 Bad Request (validación o regla de negocio), 401 Unauthorized, 403 Forbidden (rol insuficiente o cuenta inactiva), 404 Not Found, 409 Conflict (ej. email duplicado, ítem ya comprado), 429 Too Many Requests (rate limiting). |
| Paginación | Listas largas (noticias, usuarios admin, transacciones) usan ?page= y ?limit=, respuesta con { data: [...], total, page, limit }. |
| Errores | Formato uniforme: { "statusCode": 400, "message": "Passwords don't match", "error": "Bad Request" } |

## 4. Módulo Auth

### 4.1 Endpoints

Cubre WelcomeScreen, SignInScreen y RegisterScreen, y la verificación de sesión de SplashScreen. Todos son públicos salvo /auth/logout.

| Método | Endpoint | Descripción | RF relacionados |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Crea una cuenta con username, email, password y consentAccepted (Ley 1581). La contraseña se confirma en el frontend (RF-045–049) y el backend la valida de nuevo (mínimo 8 caracteres). 409 si el email o username ya existe. | RF-040–044 |
| `POST` | `/auth/register/google` | Crea o vincula una cuenta usando el id_token de Google, verificado en el servidor. Body opcional: referralCode. | RF-050–054 |
| `POST` | `/auth/login` | Inicia sesión con email/password. El body incluye role (player/admin); el backend valida el rol real del usuario (403 si no coincide) y que la cuenta esté activa (403 si status=inactive). Los inicios de sesión de administrador se registran en ADMIN_AUDIT_LOG. | RF-025–034 |
| `POST` | `/auth/login/google` | Inicia sesión con el id_token de Google (solo rol player; el modo Admin oculta este botón, RF-032). | RF-020–024 |
| `POST` | `/auth/refresh` | Emite un nuevo access token usando la cookie de refresh token y la rota. SplashScreen lo usa para decidir si hay sesión activa. | RF-007, RF-009 |
| `POST` | `/auth/forgot-password` | Envía un correo con enlace de recuperación (token de un solo uso, 30 min). Responde 204 exista o no el email, para no revelar cuentas. | RF-035–039 |
| `POST` | `/auth/reset-password` | Establece una nueva contraseña usando el token del correo y revoca los refresh tokens del usuario. | RF-035–039 |
| `POST` | `/auth/logout` | Revoca el refresh token en el servidor y borra la cookie. Requiere access token. | RF-111, RF-113, RF-124 |

#### 4.2 Ejemplo: POST /auth/login

```
// Request
{
  "email": "player@example.com",
  "password": "••••••••",
  "role": "player"
}

// Response 200
// Set-Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Strict; Path=/v1/auth
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 900,
  "user": { "id": "uuid", "username": "FootballFan123", "role": "player" }
}
```

## 5. Módulo Users

### 5.1 Endpoints

Cubre el header y “My Stats” de MainHomeScreen y ProfileScreen. Todos requieren access token.

| Método | Endpoint | Descripción | RF relacionados |
| --- | --- | --- | --- |
| `GET` | `/users/me` | Devuelve el perfil del usuario autenticado: username, email, rol, país, nivel, XP, XP para el siguiente nivel, racha (0 si ya está rota) y cantidad de insignias. | RF-055–058, RF-104–106 |
| `PATCH` | `/users/me` | Actualiza datos editables del perfil (username, país, avatar) — opción “Edit Profile”. | RF-112 |
| `PATCH` | `/users/me/password` | Cambia la contraseña (requiere la actual) — opción “Account Settings”. Cierra todas las sesiones, incluida la actual. Máximo 5 intentos cada 15 min. | RF-112 |
| `DELETE` | `/users/me` | Elimina la cuenta y sus datos personales (derecho de supresión, Ley 1581). Body { password } obligatorio si la cuenta tiene contraseña. Los administradores no pueden borrarse a sí mismos (403). | RNF-SEC-07 |
| `GET` | `/users/me/stats` | Devuelve Accuracy, Total XP, Games Played y Badges (sección Performance y “My Stats”). | RF-068, RF-107–109 |
| `GET` | `/users/me/badges` | Lista todo el catálogo de insignias con la fecha en que el usuario ganó cada una (earnedAt, null si todavía no). | RF-105 |

### 5.2 Actividad de uso

El frontend envía una señal de actividad al abrir la app y periódicamente (ej. cada 60 s) mientras está en primer plano. El backend abre o extiende la USER_SESSION correspondiente; con estos datos se calculan las métricas del panel administrativo.

| Método | Endpoint | Descripción | RF relacionados |
| --- | --- | --- | --- |
| `POST` | `/activity/heartbeat` | Registra actividad del usuario autenticado. Responde 204. Sin cuerpo; no se envían clics ni contenido de pantalla. | Soporte de RF-123, RF-125, RF-138–140, RF-143, RF-152 |

## 6. Módulo News

### 6.1 Endpoints

Cubre NewsScreen y la vista previa de noticias en MainHomeScreen. Las noticias se sirven desde NEWS_ARTICLE, que el módulo sincroniza periódicamente con la API externa.

| Método | Endpoint | Descripción | RF relacionados |
| --- | --- | --- | --- |
| `GET` | `/news?category=&page=&limit=` | Lista noticias ordenadas de la más reciente a la más antigua, opcionalmente filtradas por categoría (Transfers, Champions League, World Cup, Premier League; All o sin parámetro = todas). Cada noticia: id, title, description, category, source, sourceUrl, imageUrl, publishedAt. | RF-067–070, RF-071–078 |
| `GET` | `/news/:id` | Detalle de una noticia, incluida la URL de la fuente original a la que redirige el ícono ExternalLink. | RF-079–082 |

## 7. Módulo Games

### 7.1 Endpoints

Cubre MinigamesScreen, ResultsScreen, el reto diario y la vista previa de minijuegos de MainHomeScreen.

| Método | Endpoint | Descripción | RF relacionados |
| --- | --- | --- | --- |
| `GET` | `/games` | Catálogo de los 10 minijuegos con nombre, descripción, categoría, dificultad e ícono. | RF-063–066, RF-083–086 |
| `GET` | `/games/daily-challenge` | Devuelve el reto del día: minijuego, título, recompensa (+50 XP) y si el usuario ya lo completó hoy. | RF-059–062 |
| `POST` | `/games/:id/sessions` | Inicia una partida (también usado por “Play Again”). Body opcional: { "dailyChallenge": true }. Devuelve el id de la sesión y las preguntas, sin la respuesta correcta. | RF-087–088, RF-100, RF-102 |
| `POST` | `/games/sessions/:sessionId/answers` | Registra la respuesta a una pregunta ({ questionNumber, answer }) y devuelve isCorrect. Cada respuesta queda guardada al instante (RNF-DISP-03). | RF-089, RF-095–096 |
| `PATCH` | `/games/sessions/:sessionId` | Cierra la partida: { "status": "completed" } o { "status": "abandoned" } (salir sin terminar). Al completar, el servidor calcula score, accuracy y XP a partir de las respuestas guardadas; cualquier puntaje enviado por el cliente se ignora. | RF-089–093 |
| `GET` | `/games/sessions/:sessionId` | Devuelve el resultado detallado (incluye respuestas para la cuadrícula tipo Wordle y un dato curioso). | RF-091–098 |
| `POST` | `/games/sessions/:sessionId/share` | Genera un enlace/imagen compartible del resultado y otorga +25 créditos la primera vez. | RF-099, RF-115 |

#### 7.2 Ejemplo: POST /games/sessions/:sessionId/answers

```
// Request
{ "questionNumber": 3, "answer": "Lionel Messi" }

// Response 201
{ "questionNumber": 3, "isCorrect": true, "answeredCount": 3, "totalQuestions": 10 }
```

#### 7.3 Ejemplo: GET /games/sessions/:sessionId

```
// Response 200
{
  "id": "uuid",
  "game": { "id": "uuid", "name": "Who is it?" },
  "status": "completed",
  "score": 8,
  "totalQuestions": 10,
  "accuracy": 80,
  "xpEarned": 80,
  "answers": [
    { "questionNumber": 1, "isCorrect": true },
    { "questionNumber": 2, "isCorrect": false }
  ],
  "funFact": "El primer Balón de Oro se entregó en 1956."
}
```

## 8. Módulo Credits

### 8.1 Endpoints

Cubre CreditsScreen.

| Método | Endpoint | Descripción | RF relacionados |
| --- | --- | --- | --- |
| `GET` | `/credits/balance` | Saldo actual de créditos del usuario. | RF-114 |
| `GET` | `/credits/earn-methods` | Las 4 formas de ganar créditos: [{ reason, method, credits }] (Daily Challenge +50, 7-day streak +100, Share +25, Refer a friend +200). Los montos viven en el backend y se otorgan automáticamente por eventos. | RF-115–116 |
| `GET` | `/credits/transactions?page=&limit=` | Historial de movimientos (ganancias y gastos) del ledger CREDIT_TRANSACTION. No tiene pantalla propia hoy; soporta auditoría y soporte al usuario. | Soporte (auditoría) |
| `GET` | `/store/items` | Catálogo de los 6 ítems de la tienda (de menor a mayor costo) con, para el usuario autenticado, owned (ya comprado), equipped (aplicado al perfil) y affordable (le alcanza el saldo). | RF-117–118 |
| `POST` | `/store/items/:id/purchase` | Compra un ítem en una transacción atómica: valida saldo suficiente, descuenta créditos, registra la transacción, lo asigna y aplica al perfil. 400 si no alcanza el saldo, 409 si ya lo tiene. Máximo 10 compras por minuto. | RF-119–120 |
| `POST` | `/store/items/:id/equip` | Vuelve a aplicar al perfil un ítem ya comprado (solo uno aplicado por tipo). 404 si no lo ha comprado. | RF-119 |

#### 8.2 Ejemplo: POST /store/items/:id/purchase

```
// Response 201
{
  "purchased": true,
  "item": { "id": "uuid", "name": "Golden Ball Avatar", "equipped": true },
  "newBalance": 750
}

// Response 400 (saldo insuficiente)
{
  "statusCode": 400,
  "message": "Not enough credits",
  "error": "Bad Request"
}
```

## 9. Módulo Admin

Todos los endpoints de Admin requieren access token con role=admin, validado en el backend (RNF-SEC-03). Las acciones que modifican datos o exportan información quedan registradas en ADMIN_AUDIT_LOG (RNF-SEC-04). Las métricas se calculan sobre todas las categorías del catálogo de minijuegos.

- Solo se gestionan y cuentan jugadores: las cuentas de administrador no aparecen en las métricas ni se pueden suspender o eliminar desde el panel (404).
- Variaciones de los KPIs (change): usuarios totales frente a hace 7 días; activos, partidas y precisión de hoy frente a ayer (la precisión en puntos). null cuando el período anterior fue 0.
- Alertas: caída de 3 o más puntos en la retención día 7 frente a la semana anterior, y récord diario de partidas.
- Retención día N: porcentaje de jugadores registrados hace al menos N días que volvieron a tener actividad (heartbeat) el día N o después; null si nadie cumple N días.
- Suspender, activar, eliminar y exportar quedan en ADMIN_AUDIT_LOG antes de ejecutarse. Suspender cierra todas las sesiones del jugador.
- Los CSV usan BOM UTF-8 y neutralizan celdas que empiezan por = + - @ (inyección de fórmulas).

### 9.1 AdminDashboardScreen

| Método | Endpoint | Descripción | RF relacionados |
| --- | --- | --- | --- |
| `GET` | `/admin/dashboard/summary` | Alertas del sistema, estado en línea y los 4 KPIs (usuarios totales, activos hoy, partidas hoy, precisión media) con su variación. | RF-121–123 |
| `GET` | `/admin/dashboard/dau` | Serie de usuarios activos diarios (últimos 7 días) con variación semanal. | RF-125 |
| `GET` | `/admin/dashboard/ranking` | Ranking de los 4 minijuegos más jugados con jugadas, puntaje promedio y tendencia. | RF-126 |

### 9.2 AdminUsersScreen

| Método | Endpoint | Descripción | RF relacionados |
| --- | --- | --- | --- |
| `GET` | `/admin/users?search=&filter=&page=` | Lista y busca usuarios por nombre o email con filtros (all, active, inactive, new7d). Incluye el conteo de cada filtro. | RF-130–133 |
| `GET` | `/admin/users/export?search=&filter=` | Descarga en CSV la lista de usuarios filtrada (botón “Exportar”). | RF-132 |
| `GET` | `/admin/users/:id` | Detalle de un usuario (panel de acciones expandible y “Ver perfil”): país, nivel, racha, XP, fecha de registro y estado. | RF-134–136 |
| `PATCH` | `/admin/users/:id/status` | Suspende o activa una cuenta: { "status": "inactive" \| "active" }. Al suspender se revocan sus refresh tokens. | RF-135 |
| `DELETE` | `/admin/users/:id` | Elimina una cuenta. | RF-135 |

### 9.3 AdminAnalyticsScreen

| Método | Endpoint | Descripción | RF relacionados |
| --- | --- | --- | --- |
| `GET` | `/admin/analytics/kpis` | Sesión media, Retención D7, DAU/MAU. | RF-138 |
| `GET` | `/admin/analytics/growth` | Usuarios nuevos vs. activos, últimos 6 meses. | RF-139 |
| `GET` | `/admin/analytics/retention` | Curva de retención (Día 1, 3, 7, 14, 30). | RF-140 |
| `GET` | `/admin/analytics/categories` | Partidas jugadas por categoría de minijuego. | RF-142 |
| `GET` | `/admin/analytics/session-duration` | Distribución de duración de sesión por rangos (<2m, 2-5m, 5-10m, 10-20m, >20m). | RF-143 |
| `GET` | `/admin/analytics/accuracy-radar` | Precisión promedio por categoría de minijuego. | RF-144 |

### 9.4 AdminReportsScreen

| Método | Endpoint | Descripción | RF relacionados |
| --- | --- | --- | --- |
| `GET` | `/admin/reports/summary?month=` | Métricas clave del mes seleccionado y resumen de las últimas 4 semanas (“Cambiar mes”). | RF-146–149 |
| `GET` | `/admin/reports/top-players?month=` | Top 5 jugadores por precisión/XP, con país. | RF-150 |
| `GET` | `/admin/reports/category-performance?month=` | Rendimiento y tendencia por categoría. | RF-151 |
| `GET` | `/admin/reports/peak-hours?month=` | Actividad por hora del día (24 valores). | RF-152 |
| `GET` | `/admin/reports/export?month=` | Descarga el reporte completo del mes en formato CSV. Si falla, responde un error claro (RNF-DISP-04). | RF-152–153 |

## 10. Consideraciones finales

Este contrato debe mantenerse sincronizado con el Documento de Requisitos: cualquier RF-XXX nuevo o modificado en el tablero de Trello debe reflejarse aquí antes de implementarse. Se recomienda generar la documentación interactiva (Swagger/OpenAPI) directamente desde los decoradores de NestJS una vez iniciada la implementación, usando esta tabla como fuente de verdad inicial.

## 11. Historial de versiones

| Versión | Fecha | Cambios |
| --- | --- | --- |
| 1.0 | 23 de septiembre de 2026 | Versión inicial. |
| 1.1 | 23 de septiembre de 2026 | Revisión de consistencia: refresh token en cookie httpOnly y nuevo POST /auth/refresh; consentimiento en el registro; nuevos endpoints PATCH /users/me/password, DELETE /users/me, POST /activity/heartbeat, POST /games/sessions/:id/answers, GET /credits/earn-methods y GET /admin/users/export; se agrega el código 429; se corrige la trazabilidad de /credits/transactions, /admin/dashboard/summary y /auth/login/google. |
| 1.2 | 24 de septiembre de 2026 | Ajustes al implementar feature/users: detalle de la respuesta de GET /users/me y /users/me/badges; cambiar la contraseña cierra todas las sesiones; eliminar la cuenta exige la contraseña. |
| 1.3 | 24 de septiembre de 2026 | Ajustes al implementar feature/credits: nuevo POST /store/items/:id/equip; detalle de las respuestas de /credits/earn-methods y /store/items; límite de 10 compras por minuto. |
| 1.4 | 24 de septiembre de 2026 | Ajustes al implementar feature/news: ?category acepta All y se detallan los campos de cada noticia. |
| 1.5 | 24 de septiembre de 2026 | Ajustes al implementar feature/admin: reglas de cálculo de KPIs, alertas y retención; el panel gestiona solo jugadores; auditoría previa a cada acción; CSV seguros. |
| 1.6 | 24 de septiembre de 2026 | Refactor de arquitectura: /games, /credits y /store son solo para jugadores (403 para administradores). |
