**FOOTBALL MAESTRO**

*Become a Football Maestro*

**PLAN DE SEGURIDAD**

Modelo de amenazas y medidas de mitigación

(Complemento de Requisitos, Arquitectura, Modelo de Datos, Contrato de API y Plan de Pruebas)

Fecha de elaboración: 23 de septiembre de 2026

Fecha de actualización: 2 de octubre de 2026

Versión: 1.5

---

## 1. Introducción

Este documento amplía los requisitos de seguridad ya definidos en la sección “Seguridad” (RNF-SEC-01 a 07) del Documento de Requisitos, incorporando un modelo de amenazas específico para “Football Maestro” y las medidas técnicas concretas para mitigarlas. Se enfoca en tres superficies de riesgo propias de este sistema: la autenticación con dos roles (Player/Admin), la economía interna de créditos canjeables, y el panel administrativo con acceso a datos agregados de toda la plataforma.

## 2. Objetivo del documento

Identificar las amenazas de seguridad relevantes para el sistema, mapearlas contra el estándar OWASP Top 10, y establecer medidas de mitigación concretas y verificables, de modo que la seguridad se diseñe desde el inicio de la implementación (“security by design”) y no se añada como parche al final.

## 3. Modelo de amenazas

### 3.1 Activos a proteger

- Credenciales de usuario (contraseñas, access tokens, refresh tokens y tokens de recuperación).
- Datos personales: email, nombre de usuario, país, estadísticas de juego y actividad de uso.
- Saldo y transacciones de créditos (CREDIT_TRANSACTION) — es una economía interna, atractiva para manipulación.
- Acceso al Admin Portal y los datos agregados de toda la plataforma (usuarios, analítica, reportes).
- Integridad de los resultados de los minijuegos (preguntas y respuestas correctas, puntajes, rankings, top jugadores).

### 3.2 Amenazas específicas identificadas

| Amenaza | Descripción | Impacto |
| --- | --- | --- |
| Suplantación de rol (privilege escalation) | Un usuario Player modifica el request o el token para acceder a endpoints /admin/*. | Acceso no autorizado a datos de todos los usuarios. |
| Manipulación de puntaje/créditos | Un usuario envía directamente a la API un score falso o un monto de créditos, sin jugar realmente el minijuego, o intenta obtener las respuestas correctas antes de responder. | Rankings falseados, créditos infinitos, pérdida de confianza en la economía del juego. |
| Fuerza bruta sobre login | Intentos automatizados de adivinar contraseñas. | Cuentas comprometidas. |
| Robo de sesión (token) | Un token robado (XSS, red insegura) se usa para suplantar al usuario. | Acceso no autorizado a la cuenta. |
| Abuso de recuperación de contraseña | Reutilizar un enlace de recuperación o usarlo para descubrir qué correos están registrados. | Toma de cuentas o enumeración de usuarios. |
| Inyección (SQL/NoSQL) | Entradas maliciosas en formularios (login, registro, búsqueda de usuarios en Admin). | Fuga o corrupción de la base de datos completa. |
| Scraping/abuso de la API de noticias o minijuegos | Bots que consumen la API sin límite para extraer contenido o automatizar partidas. | Sobrecarga del servidor, ventaja injusta en minijuegos. |
| Exposición de datos en la API | Un endpoint devuelve más campos de los necesarios (ej. password_hash, correct_answer, emails de otros usuarios). | Fuga de datos personales o de respuestas. |

## 4. Mapeo contra OWASP Top 10 (2021)

Cada categoría del estándar OWASP Top 10 se evalúa contra el diseño actual del sistema, con su medida de mitigación concreta.

| Categoría OWASP | Mitigación en Football Maestro |
| --- | --- |
| A01 – Broken Access Control | RolesGuard de NestJS valida role=admin en el backend para todo endpoint /admin/*, nunca confiando en el valor enviado por el frontend (refuerza RNF-SEC-03). Cada endpoint valida además que el recurso solicitado (ej. /users/me, /games/sessions/:id) pertenezca al usuario autenticado, y que la cuenta esté activa (status = active). |
| A02 – Cryptographic Failures | Contraseñas con bcrypt (factor de costo ≥ 10), nunca MD5/SHA plano. Refresh tokens y tokens de recuperación se guardan solo como hash en AUTH_TOKEN. Toda comunicación bajo HTTPS/TLS 1.2+. El JWT nunca incluye password_hash ni datos sensibles en su payload. |
| A03 – Injection | Uso del ORM TypeORM con consultas parametrizadas, nunca SQL concatenado. Todo DTO de entrada se valida con class-validator antes de llegar al Service. |
| A04 – Insecure Design | El puntaje y la precisión de cada minijuego se calculan en el backend a partir de las respuestas enviadas, nunca se acepta un score final directamente del cliente (ver sección 6). Rate limiting en endpoints sensibles. |
| A05 – Security Misconfiguration | Cabeceras de seguridad con Helmet (CSP, X-Frame-Options, etc.), CORS restringido a los dominios del frontend, sin credenciales ni configuración por defecto en producción. |
| A06 – Vulnerable and Outdated Components | npm audit y Dependabot/Snyk en el pipeline de CI/CD para detectar dependencias con vulnerabilidades conocidas antes de cada despliegue. |
| A07 – Identification and Authentication Failures | Rate limiting en /auth/login (ej. máx. 5 intentos/15 min por IP), JWT de acceso de corta duración con refresh token rotativo, invalidación real de sesión en /auth/logout (RNF-SEC-05) y al suspender una cuenta. |
| A08 – Software and Data Integrity Failures | package-lock.json versionado, pipeline de CI/CD que solo despliega desde la rama principal tras pasar el Plan de Pruebas. |
| A09 – Security Logging and Monitoring Failures | ADMIN_AUDIT_LOG registra todo inicio de sesión y acción administrativa (RNF-SEC-04); logs de intentos de login fallidos y accesos denegados por rol, con alertas ante patrones anómalos. |
| A10 – Server-Side Request Forgery (SSRF) | El adapter de la API de noticias externa valida y limita los dominios permitidos; nunca se hace un fetch a una URL provista libremente por el usuario. |

## 5. Autenticación y gestión de sesiones

- Contraseñas: mínimo 8 caracteres, hash con bcrypt (factor de costo ≥ 10).
- Access token JWT de corta duración (15-30 min), enviado en el header Authorization. Refresh token de mayor duración (ej. 7 días) en una cookie httpOnly, Secure y SameSite=Strict (no localStorage, para mitigar robo por XSS), rotado en cada uso de POST /auth/refresh y almacenado como hash en AUTH_TOKEN.
- Rate limiting en /auth/login, /auth/register y /auth/forgot-password para frenar fuerza bruta (respuesta 429).
- OAuth 2.0 con Google validado del lado del servidor (nunca confiar en un “Google ID” enviado directamente por el cliente sin verificar el id_token con Google).
- /auth/logout revoca el refresh token en el servidor (campo revoked_at de AUTH_TOKEN), no solo lo borra del cliente.
- Recuperación de contraseña: token aleatorio de un solo uso, válido 30 minutos, guardado como hash. /auth/forgot-password responde igual exista o no el correo, para no revelar qué cuentas están registradas. Al restablecer la contraseña se revocan todos los refresh tokens del usuario.
- Cuentas suspendidas (status = inactive): no pueden iniciar sesión (403) y sus refresh tokens se revocan en el momento de la suspensión.

## 6. Integridad de resultados y economía de créditos

Esta es la superficie de riesgo más particular de Football Maestro frente a un CRUD tradicional: existe un incentivo real para hacer trampa (subir en el ranking, conseguir créditos gratis). Medidas específicas:

- El backend nunca acepta un score final desde el cliente: recibe cada respuesta individual (POST /games/sessions/:id/answers), la compara con la respuesta correcta almacenada en QUESTION y, al cerrar la partida (PATCH /games/sessions/:id), calcula score, accuracy y XP del lado del servidor.
- La respuesta correcta (QUESTION.correct_answer) nunca se incluye en las respuestas de la API antes de que el usuario responda esa pregunta.
- Cada GAME_SESSION tiene un tiempo máximo razonable de vida; sesiones que exceden ese tiempo o que se completan de forma sospechosamente rápida se marcan para revisión. Una sesión solo otorga XP y créditos una vez (al pasar a completed).
- Las transacciones de créditos (CREDIT_TRANSACTION) se procesan en una transacción de base de datos atómica junto con la actualización de credits_balance, evitando condiciones de carrera (ej. comprar el mismo ítem dos veces con el mismo saldo mediante peticiones simultáneas). La PK compuesta de USER_STORE_ITEM impide duplicar una compra.
- Los montos y motivos de créditos (+50 Daily Challenge, +100 racha, +25 compartir, +200 referido) están fijos en el backend, nunca se reciben como parámetro editable desde el cliente. Compartir un resultado otorga créditos una sola vez por partida y el reto diario una sola vez por día.

## 7. Seguridad de la API

| Medida | Detalle |
| --- | --- |
| HTTPS obligatorio | Todo el tráfico entre frontend, backend y servicios externos usa TLS; se rechaza HTTP plano en producción. |
| CORS restringido | Solo se permiten los orígenes del frontend oficial, no “*”. |
| Rate limiting global | Límite de peticiones por IP/usuario en toda la API (ej. 100 req/min), más estricto en /auth/*, /store/*/purchase y /games/sessions/*. |
| Validación de entrada | Todo DTO usa class-validator; se rechazan campos no esperados (whitelist: true y forbidNonWhitelisted en NestJS ValidationPipe), por ejemplo un campo score en el cierre de partida. |
| Tamaño máximo de payload | Límite de tamaño de body (ej. 1MB) para evitar ataques de denegación de servicio por payloads grandes. |
| Versionado de API | /v1 en la URL base, permitiendo introducir cambios de seguridad sin romper clientes existentes. |

## 8. Protección de datos personales

El sistema almacena datos personales (nombre de usuario, email, país) y datos de comportamiento (actividad de uso, partidas) sujetos a normativa de protección de datos (en Colombia, Ley 1581 de 2012 y su decreto reglamentario). Medidas (RNF-SEC-07):

- Consentimiento explícito: el registro exige aceptar la política de tratamiento de datos; la fecha queda en USER.consent_accepted_at.
- Minimización: solo se solicitan los campos estrictamente necesarios para el registro, y la actividad de uso se limita a inicio y última actividad de cada sesión (USER_SESSION), sin registrar clics ni contenido de pantalla.
- Cifrado en tránsito (TLS) y en reposo según las capacidades del proveedor de PostgreSQL gestionado.
- Los usuarios pueden eliminar su cuenta y sus datos personales asociados (derecho de supresión, DELETE /users/me). Los registros agregados de métricas que permanezcan quedan anonimizados.
- Las respuestas de la API nunca exponen el email de otros usuarios en endpoints de jugador (ej. rankings muestran username y país, no email). Solo el panel administrativo ve emails.

## 9. Checklist de seguridad previo a cada despliegue

| # | Verificación |
| --- | --- |
| 1 | npm audit / Snyk sin vulnerabilidades críticas o altas pendientes. |
| 2 | Todas las variables sensibles (JWT secret, credenciales de BD, claves de OAuth y del servicio de correo) están en variables de entorno, nunca en el repositorio. |
| 3 | Los endpoints /admin/* fueron probados con un token de rol player y responden 403 (caso TC-34 del Plan de Pruebas). |
| 4 | HTTPS forzado y cabeceras de seguridad (Helmet) activas en producción. Helmet ya está instalado en backend/src/app.setup.ts; falta verificar las cabeceras en el dominio real. |
| 5 | Rate limiting activo en /auth/login, /auth/register, /auth/forgot-password y /store/*/purchase (caso TC-44). |
| 6 | Los casos de prueba de seguridad del Plan de Pruebas (TC-33 a TC-35 y TC-42 a TC-48) pasan exitosamente. |
| 7 | El cálculo de score/créditos se verificó del lado del servidor, no se confía en ningún valor final enviado por el cliente (casos TC-42 y TC-43). |
| 8 | Google: el dominio real está en los orígenes autorizados del cliente OAuth y la app de Google está publicada (hoy en modo prueba). |
| 9 | Correo: dominio propio autenticado en Brevo (SPF/DKIM) para que los correos no lleguen a spam. |
| 10 | Cookies y proxy: con el reenvío de /v1 en Vercel, frontend y API comparten dominio y se mantiene COOKIE_SAMESITE=strict. TRUST_PROXY=2 (Vercel → Render): con menos, todos los usuarios comparten la IP del proxy en el límite de intentos; con más, cualquiera podría falsificar su IP. |
| 11 | Claves nuevas para producción: las claves de Currents y Brevo usadas en desarrollo se compartieron por chat; generar otras y ponerlas solo en las variables de entorno del servidor. Administrador creado con una contraseña distinta a la de desarrollo. |
| 12 | Base de datos: conexión con SSL (DB_SSL=true); para verificar además el certificado de Supabase, poner DB_SSL_CA. La contraseña de Supabase solo en las variables de Render. |

## 10. Estado de implementación

Controles de este plan verificados en el código el 24 de septiembre de 2026:

| Control | Estado | Dónde / cómo |
| --- | --- | --- |
| Contraseñas con bcrypt (costo 12) | Implementado | BCRYPT_COST; mínimo 8 caracteres en todos los DTO. |
| Access token 15 min + refresh token rotativo | Implementado | Cookie httpOnly en /v1/auth, guardado como hash SHA-256 en AUTH_TOKEN; reutilizar uno revocado cierra todas las sesiones. |
| Rate limiting | Implementado | Global 100/min; login, registro y recuperación 5 cada 15 min; cambio de contraseña y borrado de cuenta 5 cada 15 min; compras 10/min. |
| Roles validados en el backend | Implementado | RolesGuard global; /admin/* solo admin; /games, /credits y /store solo jugadores. |
| Google verificado en el servidor | Implementado | google-auth-library comprueba firma y audiencia del id_token (GoogleVerifier). |
| Recuperación de contraseña | Implementado | Token de un solo uso, 30 min, guardado como hash; correo con Brevo; la respuesta no revela si el email existe, ni siquiera si el envío falla. |
| Puntaje y créditos del lado del servidor | Implementado | Score, XP y créditos se calculan en el backend; transacciones atómicas; índice único para cobrar cada recompensa una vez; CHECK que impide saldo negativo. |
| Validación de entrada y CORS | Implementado | ValidationPipe con whitelist y forbidNonWhitelisted; CORS solo para FRONTEND_URL; body máximo 1 MB. |
| Auditoría de administradores | Implementado | ADMIN_AUDIT_LOG antes de cada acción; si no se puede auditar, la acción falla. |
| CSV seguros | Implementado | Protección contra inyección de fórmulas en las exportaciones. |
| Ley 1581 | Implementado | Consentimiento en el registro (también con Google), supresión de la cuenta con DELETE /users/me, actividad mínima en USER_SESSION. |
| Secretos fuera del repositorio | Implementado | Todas las claves en .env (ignorado por git); .env.example sin valores reales. |
| Dependencias | Implementado | npm audit del backend: 0 vulnerabilidades. Frontend: 2 alertas que solo afectan al servidor de desarrollo de Vite. |
| Cabeceras de seguridad (Helmet) | Implementado | helmet en backend/src/app.setup.ts: Content-Security-Policy, X-Frame-Options, Strict-Transport-Security, X-Content-Type-Options y sin X-Powered-By. Lo verifica una prueba E2E (health). |
| HTTPS | Configurado (despliegue) | Lo dan Vercel y Render; el reenvío de /v1 entre ellos también va por HTTPS. En local se usa HTTP. |
| SSL hacia la base de datos | Configurado (despliegue) | DB_SSL=true en Render (Supabase lo exige). Cifra la conexión; verificar el certificado requiere DB_SSL_CA (pendiente). |
| API propia de Supabase cerrada | Implementado | Migración CloseSupabaseDataApi: los roles anon y authenticated de Supabase no tienen permisos sobre las tablas (tampoco las futuras) y todas tienen RLS; solo el backend, dueño de las tablas, las usa. Detectado por el asesor de seguridad de Supabase el 2 de octubre de 2026, antes de abrir el registro. |
| IP real detrás de proxies | Configurado (despliegue) | TRUST_PROXY=2 en render.yaml, para que el rate limiting sea por usuario y no por proxy. |

## 11. Consideraciones finales

Este plan debe revisarse cada vez que se agregue una nueva funcionalidad al tablero de Trello, especialmente si involucra dinero, créditos, datos personales o el rol de administrador. La seguridad no es un documento que se firma una vez: el checklist de la sección 9 debe ejecutarse antes de cada despliegue a producción, y el modelo de amenazas de la sección 3 debe revisarse cuando el sistema crezca (por ejemplo, si se agregan pagos reales, multijugador en tiempo real o el módulo futuro de Partidos y Estadísticas).

## 12. Historial de versiones

| Versión | Fecha | Cambios |
| --- | --- | --- |
| 1.0 | 23 de septiembre de 2026 | Versión inicial. |
| 1.1 | 23 de septiembre de 2026 | Revisión de consistencia: la verificación de respuestas usa QUESTION (antes decía GAME); refresh token alineado con el Contrato de API (cookie httpOnly + POST /auth/refresh, guardado como hash en AUTH_TOKEN); se agregan reglas de recuperación de contraseña y cuentas suspendidas; consentimiento y supresión de datos (RNF-SEC-07); ORM fijado en TypeORM; se corrige el rango de casos de seguridad del checklist (TC-33 a TC-35 y TC-42 a TC-48). |
| 1.2 | 24 de septiembre de 2026 | Actualización con el sistema implementado: nueva sección 10 con el estado real de cada control (Helmet queda pendiente); el checklist previo al despliegue suma Google, dominio de correo, cookies/proxy y claves nuevas de producción. |
| 1.3 | 25 de septiembre de 2026 | Helmet instalado (A05): cabeceras de seguridad HTTP en todas las respuestas, verificadas por una prueba E2E. |
| 1.4 | 2 de octubre de 2026 | Despliegue en Vercel + Render + Supabase: cookie del mismo sitio gracias al reenvío de /v1, TRUST_PROXY con número de proxies, SSL hacia la base de datos (checklist 10 y 12; estado de HTTPS). |
| 1.5 | 2 de octubre de 2026 | Se cierra la API propia de Supabase sobre las tablas (permisos de anon y authenticated y RLS en todas las tablas). |
