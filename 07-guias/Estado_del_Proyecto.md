# Estado del proyecto

Actualizado al **24 de septiembre de 2026**. La versión más completa del código está en la rama `feature/minijuego-timeline`; `main` todavía no la tiene (falta aceptar su Pull Request).

## 1. Qué funciona

La aplicación corre completa en local: frontend, backend y base de datos, con los tres servicios externos configurados.

### Pantallas (19)

| Grupo | Pantallas |
|---|---|
| Acceso (6) | Splash, Welcome (con Continue with Google), Sign In (Player/Admin), Register, Forgot Password, Reset Password |
| Jugador (9) | Home (con el reto diario), Minigames, GamePlay, Results, News, Credits (con tienda), Profile, Edit Profile, Account Settings |
| Administrador (4) | Dashboard, Users, Analytics, Reports (con exportación CSV) |

Las 14 pantallas de la maqueta original se conectaron a la API. GamePlay, Forgot/Reset Password, Edit Profile y Account Settings se agregaron para completar los flujos (Requisitos v2.2, RF-112).

### Backend

| Módulo | Qué hace |
|---|---|
| Auth | Registro, login Player/Admin, Google, refresh token rotativo, logout, recuperar contraseña por correo |
| Users | Perfil, estadísticas, XP/nivel/racha/precisión, insignias, editar perfil, cambiar contraseña, eliminar cuenta, actividad de uso |
| Games | 10 minijuegos, **cada uno con su propio estilo y mecánica** (pistas, silueta, escudo dibujado, ficha del estadio, tablero de Connections, línea de tiempo, trayectoria, deslizador de precio, cancha, VAR); 203 preguntas; reto diario; puntaje calculado en el servidor; compartir |
| Credits | Saldo, recompensas por eventos (reto diario, racha, compartir, referido), historial, tienda |
| News | Noticias reales de Currents, sincronizadas cada 30 min y filtradas por categoría |
| Admin | Dashboard, gestión de jugadores, analítica, reportes, exportaciones CSV y auditoría |

- **50 endpoints**, todos documentados en el Contrato de API (verificado contra el código).
- **16 tablas y 110 columnas**, todas documentadas en el Modelo de Datos (verificado contra la base de datos).
- **Arquitectura:** monolito modular con Repository, Unit of Work, Strategy, Factory, Adapter, Observer, Facade y DTO; interfaces públicas pequeñas entre módulos. Una prueba automática verifica las reglas.

### Pruebas

| Suite | Resultado |
|---|---|
| Unitarias (incluye la prueba de arquitectura y la validación de las 203 preguntas) | 364 en verde |
| E2E contra PostgreSQL | 110 en verde |
| Casos del Plan de Pruebas (57) | 39 automatizados, 13 probados a mano, 5 pendientes de herramientas (Plan de Pruebas §6) |

## 2. Qué falta

### Para terminar la versión actual
- [ ] Aceptar el Pull Request `feature/minijuego-timeline` → `main` (incluye todas las ramas anteriores).
- [ ] Instalar **Helmet** (cabeceras de seguridad HTTP) en el backend.
- [ ] Revisión de las 203 preguntas por alguien del equipo (sobre todo precios de traspasos y capacidades de estadios, que varían según la fuente).
- [ ] Imágenes para los minijuegos: fotos con licencia libre (Wikimedia Commons, con crédito del autor) para estadios y jugadores. Los escudos se siguen dibujando con los colores del club, porque son marcas registradas.

### Para desplegar en internet
- [ ] Frontend en Vercel; backend y PostgreSQL en Render o Railway (Arquitectura §9).
- [ ] Google: dominio real en los orígenes del cliente OAuth y publicar la app ([Guía de servicios externos](Guia_Servicios_Externos.md)).
- [ ] Brevo: dominio propio autenticado (SPF/DKIM).
- [ ] Claves nuevas de Currents y Brevo solo en el servidor; administrador con contraseña distinta a la de desarrollo.
- [ ] `COOKIE_SAMESITE=none` y `TRUST_PROXY=true` según el hosting.
- [ ] Recorrer el checklist del Plan de Seguridad §9.

### Pruebas pendientes
- [ ] Rendimiento con k6 (TC-31, TC-32, TC-49).
- [ ] Compatibilidad entre navegadores (TC-36) y accesibilidad con teclado (TC-38).
- [ ] Pruebas automatizadas de la interfaz (Playwright o Cypress).

### Propuestas para el futuro
- Monetización con planes Free y Premium: diseñada pero no implementada ([Propuesta de monetización](../08-propuestas/Propuesta_Monetizacion_FootballMaestro.md)).

### Fuera de alcance
- Módulo "Partidos y Estadísticas" (calendario y resultados en vivo): no tiene pantalla; queda como trabajo futuro (Arquitectura §10).
