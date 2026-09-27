**FOOTBALL MAESTRO**

*Become a Football Maestro*

**PLAN DE PRUEBAS**

Casos de prueba y trazabilidad de requisitos

(Complemento de Requisitos, Arquitectura, Modelo de Datos y Contrato de API)

Fecha de elaboración: 23 de septiembre de 2026

Fecha de actualización: 27 de septiembre de 2026

Versión: 1.5

---

## 1. Introducción

Este documento define el plan de pruebas del sistema “Football Maestro”, cerrando el ciclo de trazabilidad mencionado en los documentos de Requisitos y Arquitectura: cada requisito funcional (RF-XXX) y no funcional (RNF-XXX) debe tener al menos un caso de prueba asociado que verifique su cumplimiento. Los casos cubren las 14 pantallas del sistema.

## 2. Objetivo del documento

Establecer la estrategia, herramientas y casos de prueba necesarios para verificar que la implementación del backend y su integración con el frontend cumplen los requisitos funcionales y no funcionales definidos, antes de considerar una funcionalidad como terminada (Definition of Done).

## 3. Estrategia de pruebas

Siguiendo las capas definidas en el Documento de Arquitectura de Software, las pruebas se organizan en 4 niveles:

| Nivel | Qué verifica | Capa / alcance |
| --- | --- | --- |
| Pruebas unitarias | Lógica de negocio aislada: cada Service, cada Strategy de minijuego, cálculo de puntaje, XP, racha y créditos. | Service, Strategy (con repositorios en memoria que implementan la interfaz del repositorio, gracias a la inversión de dependencias) |
| Pruebas de integración | Que un módulo completo funcione junto: Controller → Service → Repository → base de datos PostgreSQL de pruebas. | Un módulo a la vez (ej. Games, Credits) |
| Pruebas de aceptación (E2E) | Que un flujo completo de usuario funcione de principio a fin, igual que lo describe la historia de usuario en Trello. | Varios módulos combinados, vía llamadas HTTP reales |
| Pruebas no funcionales | Rendimiento, seguridad, compatibilidad, disponibilidad y accesibilidad, según la sección 5.2 del Documento de Requisitos. | Sistema completo |

### 3.1 Herramientas

| Herramienta | Estado | Uso |
| --- | --- | --- |
| Jest | En uso | Pruebas unitarias y pruebas de arquitectura del backend (npm test). |
| Supertest | En uso | Pruebas E2E sobre los endpoints HTTP del Contrato de API contra PostgreSQL real (npm run test:e2e). |
| Playwright o Cypress | Pendiente | Pruebas de aceptación E2E simulando al usuario en el frontend real. |
| k6 o Artillery | Pendiente | Pruebas de carga/rendimiento (RNF-PERF). |
| OWASP ZAP | Pendiente | Pruebas de seguridad básicas (RNF-SEC), como escaneo de XSS e inyección. |
| axe-core | Pendiente | Pruebas automatizadas de accesibilidad (RNF-ACC). |

## 4. Casos de prueba funcionales por pantalla

Se listan los casos de prueba más representativos de cada pantalla (camino exitoso y al menos un caso de error/borde). No sustituyen una cobertura exhaustiva de los 153 RF, sino que priorizan lo crítico para validar cada historia de usuario.

### 4.1 SplashScreen

| ID | RF relacionado | Caso de prueba | Resultado esperado |
| --- | --- | --- | --- |
| TC-01 | RF-003, RF-009 | Abrir la app sin sesión activa. | Redirige automáticamente a WelcomeScreen tras el splash. |
| TC-02 | RF-007, RF-009 | Abrir la app con sesión activa (refresh token válido). | POST /auth/refresh responde 200 y la app redirige a MainHomeScreen (o a AdminDashboardScreen si el rol es admin), saltando WelcomeScreen. |

### 4.2 WelcomeScreen

| ID | RF relacionado | Caso de prueba | Resultado esperado |
| --- | --- | --- | --- |
| TC-03 | RF-015, RF-018 | Presionar “Sign In”. | Navega a SignInScreen sin pasos intermedios. |
| TC-04 | RF-016, RF-019 | Presionar “Create Account”. | Navega a RegisterScreen sin pasos intermedios. |

### 4.3 SignInScreen

| ID | RF relacionado | Caso de prueba | Resultado esperado |
| --- | --- | --- | --- |
| TC-05 | RF-025–029 | Iniciar sesión con credenciales válidas y rol Player. | Navega a MainHomeScreen; se recibe un accessToken válido y la cookie de refresh token. |
| TC-06 | RF-030–034 | Iniciar sesión con credenciales válidas y rol Admin. | Navega a AdminDashboardScreen, no a MainHomeScreen; el login queda en ADMIN_AUDIT_LOG. |
| TC-07 | RF-026 | Iniciar sesión con contraseña incorrecta. | La API responde 401; el frontend muestra un mensaje de error claro y no navega (RNF-USA-03). |
| TC-39 | RF-035–039 | Solicitar recuperación de contraseña, usar el enlace del correo y volver a iniciar sesión. | Se establece la nueva contraseña y el usuario inicia sesión con ella; reutilizar el mismo enlace o usarlo después de 30 min responde 400. |

### 4.4 RegisterScreen

| ID | RF relacionado | Caso de prueba | Resultado esperado |
| --- | --- | --- | --- |
| TC-08 | RF-040–044 | Registrarse con username, email y password válidos y coincidentes. | Se crea la cuenta y navega a MainHomeScreen. |
| TC-09 | RF-045–049 | Registrarse con “Password” y “Confirm Password” distintos. | Se muestra “Passwords don't match!”; no se crea la cuenta ni se navega. |
| TC-10 | RF-041 | Registrarse con el campo Email vacío. | El formulario no permite enviarse (validación de campos obligatorios). |

### 4.5 MainHomeScreen

| ID | RF relacionado | Caso de prueba | Resultado esperado |
| --- | --- | --- | --- |
| TC-11 | RF-055–058 | Cargar el home con un usuario de nivel 12 y racha de 7 días. | El header muestra “Lvl 12” y “7” correctamente, junto al avatar y nombre. |
| TC-12 | RF-061–062 | Presionar “Play Now” en el reto diario. | Inicia el minijuego correspondiente al reto diario del día (GAME_SESSION con is_daily_challenge = true). |

### 4.6 NewsScreen

| ID | RF relacionado | Caso de prueba | Resultado esperado |
| --- | --- | --- | --- |
| TC-13 | RF-075–077 | Seleccionar la categoría “Transfers”. | El feed muestra solo artículos con categoría Transfers. |
| TC-14 | RF-080–081 | Presionar el ícono de enlace externo de una noticia. | Abre la fuente original sin cerrar la sesión activa del usuario. |

### 4.7 MinigamesScreen

| ID | RF relacionado | Caso de prueba | Resultado esperado |
| --- | --- | --- | --- |
| TC-15 | RF-083–085 | Cargar el catálogo de minijuegos. | Se listan los 10 minijuegos con su categoría y dificultad correctas. |
| TC-16 | RF-087 | Seleccionar el minijuego “Silhouette”. | Inicia una nueva GAME_SESSION asociada a ese juego; las preguntas recibidas no incluyen la respuesta correcta. |
| TC-40 | RF-090 | Salir de un minijuego sin terminarlo. | La sesión queda en estado “abandoned”, no otorga XP y la app regresa a MinigamesScreen. |

### 4.8 ResultsScreen

| ID | RF relacionado | Caso de prueba | Resultado esperado |
| --- | --- | --- | --- |
| TC-17 | RF-091–093 | Completar un minijuego respondiendo 8 de 10 correctamente. | Se muestra puntaje 8/10, 80% de precisión y el mensaje motivacional correspondiente. |
| TC-18 | RF-095–096 | Revisar la cuadrícula de resultados tras la partida. | Cada cuadro refleja correctamente si esa pregunta fue acertada (verde) o fallada (roja). |
| TC-19 | RF-100, RF-102 | Presionar “Play Again”. | Reinicia el mismo minijuego desde cero, sin volver al catálogo. |

### 4.9 ProfileScreen

| ID | RF relacionado | Caso de prueba | Resultado esperado |
| --- | --- | --- | --- |
| TC-20 | RF-104–109 | Abrir el perfil de un usuario con datos de progreso conocidos. | Level, Day Streak, Badges, Accuracy, Total XP y Games Played coinciden con los datos reales del usuario. |
| TC-21 | RF-111, RF-113 | Presionar “Log Out”. | Cierra la sesión (revoca el refresh token en el servidor) y redirige a WelcomeScreen. |

### 4.10 CreditsScreen

| ID | RF relacionado | Caso de prueba | Resultado esperado |
| --- | --- | --- | --- |
| TC-22 | RF-119–120 | Comprar un ítem con saldo suficiente. | Se descuentan los créditos, el ítem se asigna y aplica al perfil y el saldo mostrado se actualiza. |
| TC-23 | RF-118 | Intentar comprar un ítem sin saldo suficiente. | El botón muestra “Not Enough” y está deshabilitado; si se llama a la API directamente, responde 400 y la compra no se procesa. |

### 4.11 AdminDashboardScreen

| ID | RF relacionado | Caso de prueba | Resultado esperado |
| --- | --- | --- | --- |
| TC-24 | RF-121–123 | Cargar el dashboard con datos de la plataforma. | Los 4 KPIs y sus variaciones porcentuales coinciden con los datos reales del período. |
| TC-25 | RF-128 | Presionar el acceso rápido “Usuarios”. | Navega a AdminUsersScreen. |

### 4.12 AdminUsersScreen

| ID | RF relacionado | Caso de prueba | Resultado esperado |
| --- | --- | --- | --- |
| TC-26 | RF-130–131 | Buscar un usuario por nombre parcial. | La lista se filtra en tiempo real mostrando solo coincidencias. |
| TC-27 | RF-135 | Suspender un usuario activo desde el panel de acciones. | El estado del usuario cambia a Inactivo; el botón pasa a decir “Activar”. |
| TC-41 | RF-132 | Presionar “Exportar” con el filtro “Activos”. | Se descarga un CSV válido que contiene solo los usuarios activos; la acción queda en ADMIN_AUDIT_LOG. |

### 4.13 AdminAnalyticsScreen

| ID | RF relacionado | Caso de prueba | Resultado esperado |
| --- | --- | --- | --- |
| TC-28 | RF-140 | Consultar la curva de retención de un período con datos conocidos. | Los valores de Día 1, 7 y 30 coinciden con el cálculo esperado sobre los datos de prueba de USER_SESSION. |

### 4.14 AdminReportsScreen

| ID | RF relacionado | Caso de prueba | Resultado esperado |
| --- | --- | --- | --- |
| TC-29 | RF-150 | Consultar el top de jugadores del mes. | Los 5 jugadores se listan ordenados correctamente por precisión/XP, con su país y medalla. |
| TC-30 | RF-153 | Presionar “Exportar Reporte Completo (CSV)”. | Se genera y descarga un archivo CSV válido con los datos del reporte actual. |

## 5. Casos de prueba no funcionales

| ID | RNF relacionado | Caso de prueba | Resultado esperado |
| --- | --- | --- | --- |
| TC-31 | RNF-PERF-01 | Medir el tiempo desde que se abre la app hasta que SplashScreen redirige. | No debe superar 3 segundos en una conexión estándar. |
| TC-32 | RNF-PERF-03 | Medir el tiempo de respuesta al buscar usuarios en AdminUsersScreen. | Los resultados se reflejan en menos de 1 segundo. |
| TC-33 | RNF-SEC-01 | Inspeccionar cualquier respuesta de la API que incluya datos de USER. | El campo password_hash nunca se incluye en la respuesta. |
| TC-34 | RNF-SEC-03 | Llamar a un endpoint /admin/* con un token válido de rol player. | La API responde 403 Forbidden; el backend valida el rol, no solo el frontend. |
| TC-35 | RNF-SEC-06 | Ingresar un payload de script (XSS) en el campo Username de registro. | El valor se sanea/escapa antes de guardarse; no se ejecuta código en el cliente. |
| TC-36 | RNF-COMP-01, RNF-COMP-03 | Cargar las pantallas principales en Chrome, Safari, Edge y Firefox, en móvil y escritorio. | La interfaz se ve y funciona correctamente en todos los casos. |
| TC-37 | RNF-DISP-03 | Perder la conexión a mitad de un minijuego, después de responder 2 preguntas. | Al recuperar la conexión, las 2 respuestas ya registradas (GAME_ANSWER) no se pierden y la partida puede continuar. |
| TC-38 | RNF-ACC-03 | Navegar SignInScreen y RegisterScreen usando solo el teclado (Tab, Enter). | Todos los campos y botones son alcanzables y accionables sin usar el mouse. |
| TC-42 | Plan de Seguridad §6 (OWASP A04) | Enviar en PATCH /games/sessions/:id un campo score = 10 tras responder 3 de 10 bien. | El campo se rechaza o ignora; el puntaje guardado es 3, calculado en el servidor. |
| TC-43 | Plan de Seguridad §6 | Enviar 2 compras simultáneas del mismo ítem con saldo para solo una. | Solo una compra se procesa; el saldo nunca queda negativo y hay un único registro en CREDIT_TRANSACTION. |
| TC-44 | Plan de Seguridad §5 | Realizar 6 intentos de login fallidos desde la misma IP en 15 minutos. | A partir del 6.º intento la API responde 429 Too Many Requests. |
| TC-45 | RNF-SEC-05 | Cerrar sesión y luego llamar a POST /auth/refresh con la cookie anterior. | La API responde 401; el refresh token quedó revocado en el servidor. |
| TC-46 | RNF-SEC-04 | Suspender y luego eliminar un usuario desde el panel. | Ambas acciones quedan en ADMIN_AUDIT_LOG con administrador, usuario afectado, IP y fecha. |
| TC-47 | RNF-SEC-03, RF-135 | Intentar iniciar sesión con una cuenta suspendida (status = inactive). | La API responde 403 con un mensaje claro; no se emiten tokens. |
| TC-48 | RNF-SEC-07 | Solicitar la eliminación de la propia cuenta (DELETE /users/me). | Se eliminan los datos personales del usuario; ya no puede iniciar sesión y no aparece en rankings ni listados. |
| TC-49 | RNF-PERF-06 | Prueba de carga con k6 a volumen normal esperado sobre los endpoints principales. | El 95% de las peticiones responde en menos de 2 segundos. |

### 5.1 Casos agregados en la versión 1.2

Cubren funcionalidades implementadas después de la versión 1.1: Edit Profile, Account Settings, inicio de sesión con Google, correo real de recuperación, noticias reales y las reglas de arquitectura.

| ID | RF relacionado | Caso de prueba | Resultado esperado |
| --- | --- | --- | --- |
| TC-50 | RF-112 | Cambiar el nombre de usuario y el país en Edit Profile; intentar un nombre ya usado por otra cuenta (con otras mayúsculas). | El perfil se actualiza; con el nombre ocupado la API responde 409 y la pantalla muestra el aviso. |
| TC-51 | RF-112, RNF-SEC-05 | Cambiar la contraseña en Account Settings, primero con la contraseña actual incorrecta y luego correcta. | Con la incorrecta: 400 con mensaje. Con la correcta: se cierran todas las sesiones, la contraseña vieja deja de servir y la nueva funciona. |
| TC-52 | RF-020–024 | Pulsar “Continue with Google” con una cuenta agregada como usuario de prueba en Google Cloud. | Se crea la cuenta (tras aceptar la política de datos) o se inicia sesión, y se llega al Home. |
| TC-53 | RF-035–039 | Pedir “Forgot password?” con un correo registrado y abrir el enlace del correo recibido. | El correo llega (Brevo lo registra como entregado); el enlace abre New Password y la nueva contraseña funciona una sola vez. |
| TC-54 | RF-067–078 | Revisar el feed de noticias de cada categoría tras una sincronización con Currents API. | Solo aparecen noticias de fútbol de la categoría elegida (sin NFL, rugby, críquet, dardos…). |
| TC-55 | RNF-SEC-03 | Llamar a /games, /credits y /store con un token de administrador. | La API responde 403: solo los jugadores juegan y usan créditos, así las métricas no mezclan cuentas de administrador. |
| TC-57 | RF-087–090 | Jugar una partida de cada minijuego. | Cada uno se muestra con su propio estilo (pistas, silueta, escudo, estadio, tablero, línea de tiempo, trayectoria, deslizador, cancha, VAR) y el puntaje se calcula en el servidor. |
| TC-58 | Arquitectura §8.3 | Cambiar el idioma con el selector EN \| ES (Welcome y Account Settings) y recorrer las pantallas de jugador y de administración. | Toda la interfaz cambia al instante, incluidos los errores de la API, números y fechas; el idioma se recuerda al recargar. Por defecto la app abre en inglés. |
| TC-59 | Arquitectura §8.3 | Pedir el catálogo y jugar una partida con Accept-Language en inglés y en español; retomar la partida pidiendo el otro idioma. | Nombres, preguntas y opciones salen en el idioma pedido; la partida se corrige en el idioma en que empezó y no cambia al retomarla. |
| TC-60 | RF-067–078 | Consultar /news en inglés y en español tras una sincronización. | Cada idioma muestra solo sus noticias (no se mezclan). |
| TC-61 | RF-035–039 | Pedir “Forgot password?” con la app en español. | El correo de recuperación llega en español. |
| TC-62 | RF-154–160 | Como administrador, abrir Minijuegos después de que un jugador complete una partida del reto diario y abandone otra. | La partida completada y la abandonada aparecen en su minijuego, el % de abandono sube, el puntaje obtenido suma en la distribución, el reto diario de hoy suma un jugador y el idioma de las partidas suma dos. Las preguntas más difíciles traen su tasa de aciertos (mínimo 3 respuestas), de menor a mayor. |
| TC-63 | RF-161–165 | Abrir Economía antes y después de que un jugador complete el reto diario. | Los créditos ganados del día, el motivo “reto diario” y los créditos en circulación suben en 50; con 90 días el flujo se agrupa por semana. Artículos e insignias salen en el idioma pedido. |
| TC-64 | RF-166–172 | Revisar Analytics con cada período (7, 30 y 90 días). | Registros por día, embudo (cada etapa ≤ la anterior), países, métodos de registro, niveles y mapa de calor responden con su forma; un período distinto de 7, 30 o 90 responde 400. |
| TC-65 | RF-173, RF-174 | Abrir el Dashboard y el “Ver perfil” de un jugador que jugó hoy. | Cada KPI trae la tendencia de 7 días; el perfil muestra la XP de 30 días (con la de hoy) y la precisión por categoría. Un id inexistente responde 404. |
| TC-66 | RNF-SEC-03 | Llamar a los endpoints nuevos de gráficas con un token de jugador. | La API responde 403 en todos. |
| TC-67 | RF-175, RNF-UI-094–099 | En el navegador: entrar a Minijuegos y Economía desde el Dashboard, cambiar el período, usar “Ver tabla” y volver con “atrás”, en inglés y en español. | Cada gráfica muestra su pregunta, su leyenda (si tiene 2 o más series), su tabla y un mensaje claro cuando no hay datos; al cambiar el período la gráfica anterior se atenúa sin parpadear. |
| TC-56 | Arquitectura §3–§7 | Ejecutar la prueba de arquitectura (src/architecture.spec.ts). | Pasan sus 7 reglas: ningún servicio importa el ORM, otro módulo solo importa interfaces abstractas, la entidad USER no sale de Users y no hay dependencias circulares. |

## 6. Estado de la automatización

Resultado de la última ejecución (27 de septiembre de 2026), todas en verde:

| Suite | Pruebas | Qué cubre y cómo se ejecuta |
| --- | --- | --- |
| Unitarias (Jest) | 792 | Servicios, estrategias de cada minijuego, adaptadores (Currents en inglés y español, Brevo), validación de variables de entorno, reglas de progreso, idioma de la petición (shared/i18n), la prueba de arquitectura y la validación de las 203 preguntas en cada idioma (formato, respuesta válida para su estrategia, que details no revele la respuesta y que la traducción coincida con el original). En backend/: npm test. |
| E2E (Jest + Supertest) | 124 | Los endpoints del Contrato de API contra PostgreSQL real, en 8 archivos (auth, users, games, credits, news, admin, admin-charts, health). En backend/: npm run test:e2e (con la base de datos encendida). |
| Arquitectura | 7 reglas | Parte de las unitarias (src/architecture.spec.ts). Falla si el código rompe el desacople entre módulos o la inversión de dependencias. |
| Frontend | — | Revisión de tipos (npm run typecheck) y build de producción (npx vite build). Sin pruebas automatizadas de interfaz todavía. |

Casos de este documento por tipo de verificación:

| Verificación | Casos |
| --- | --- |
| Automatizados (E2E) | TC-02, 05–08, 10–13, 15–20, 22–24, 26–30, 33–35, 37, 39–48 (37 casos), más TC-55, TC-59 a TC-66. Cada prueba lleva su TC en el nombre, dentro de backend/test/*.e2e-spec.ts. TC-56 es la prueba de arquitectura. |
| Manuales en el navegador | TC-01, 03, 04, 09, 14, 21 y 25 (navegación y validaciones de pantalla), TC-50 a TC-54, TC-57, TC-58 y TC-67 (probados por el equipo entre el 24 y el 27 de septiembre de 2026). Su lógica en la API sí está cubierta por pruebas E2E. |
| Pendientes (requieren herramientas) | TC-31, 32 y 49 (rendimiento: k6), TC-36 (compatibilidad entre navegadores), TC-38 (accesibilidad con teclado: axe-core o prueba manual). |

## 7. Criterios de aceptación (Definition of Done)

Una historia de usuario del tablero de Trello se considera terminada solo cuando:

- Todos sus RF-XXX y RNF-UI-XXX relacionados están implementados.
- Los casos de prueba de este documento que la referencian pasan exitosamente.
- No introduce regresiones en pruebas ya existentes (suite completa en verde).
- El endpoint correspondiente en el Documento de Contrato de API responde según lo especificado.
- La prueba de arquitectura sigue en verde (el cambio respeta las interfaces públicas entre módulos).

## 8. Consideraciones finales

Esta tabla de casos de prueba debe crecer junto con el tablero de Trello: cada historia de usuario nueva o modificada debe sumar o actualizar al menos un caso de prueba aquí antes de darse por implementada. Se recomienda automatizar los casos funcionales (TC-01 a TC-30 y TC-39 a TC-41) como pruebas E2E con Playwright/Cypress, y los no funcionales (TC-31 a TC-38 y TC-42 a TC-49) integrarlos al pipeline de CI/CD como verificaciones previas a cada despliegue. Los casos de seguridad son TC-33 a TC-35 y TC-42 a TC-48.

Los identificadores de los casos agregados en la versión 1.1 continúan la numeración (TC-39 en adelante) para no alterar las referencias existentes a TC-01 a TC-38.

## 9. Historial de versiones

| Versión | Fecha | Cambios |
| --- | --- | --- |
| 1.0 | 23 de septiembre de 2026 | Versión inicial (TC-01 a TC-38). |
| 1.1 | 23 de septiembre de 2026 | Revisión de consistencia: se agregan TC-39 (recuperar contraseña), TC-40 (abandonar minijuego), TC-41 (exportar usuarios) y TC-42 a TC-49 (integridad de puntaje, compras concurrentes, rate limiting, revocación de sesión, auditoría, cuenta suspendida, supresión de datos y tiempo de respuesta de la API); TC-02, TC-05, TC-06, TC-21, TC-23 y TC-37 se ajustan al Contrato de API v1.1. |
| 1.2 | 24 de septiembre de 2026 | Actualización con el sistema implementado: estado de cada herramienta; nuevos casos TC-50 a TC-56 (Edit Profile, Account Settings, Google, correo real, noticias reales, roles y arquitectura); nueva sección 6 con los resultados de las suites automatizadas y qué casos son automáticos, manuales o pendientes; la Definition of Done incluye la prueba de arquitectura. |
| 1.3 | 24 de septiembre de 2026 | Estilos propios por minijuego: TC-57; 364 pruebas unitarias (incluye la validación de las 203 preguntas) y 110 E2E. |
| 1.4 | 25 de septiembre de 2026 | Inglés y español: TC-58 a TC-61; 789 pruebas unitarias (el banco de preguntas se valida en los dos idiomas) y 115 E2E (incluye las cabeceras de seguridad de Helmet). |
| 1.5 | 27 de septiembre de 2026 | Gráficas del panel de administración: TC-62 a TC-67 (pantallas Minijuegos y Economía, Analytics por período, tendencias y actividad del jugador); 792 pruebas unitarias y 124 E2E. |
