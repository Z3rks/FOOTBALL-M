# Estado del proyecto

Actualizado al **24 de septiembre de 2026**. La versión más completa del código está en la rama `refactor/puertos-publicos`; `main` todavía no la tiene (falta aceptar su Pull Request).

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
| Games | 10 minijuegos, reto diario, partidas con puntaje calculado en el servidor, resultados, compartir |
| Credits | Saldo, recompensas por eventos (reto diario, racha, compartir, referido), historial, tienda |
| News | Noticias reales de Currents, sincronizadas cada 30 min y filtradas por categoría |
| Admin | Dashboard, gestión de jugadores, analítica, reportes, exportaciones CSV y auditoría |

- **50 endpoints**, todos documentados en el Contrato de API (verificado contra el código).
- **16 tablas y 110 columnas**, todas documentadas en el Modelo de Datos (verificado contra la base de datos).
- **Arquitectura:** monolito modular con Repository, Unit of Work, Strategy, Factory, Adapter, Observer, Facade y DTO; interfaces públicas pequeñas entre módulos. Una prueba automática verifica las reglas.

### Pruebas

| Suite | Resultado |
|---|---|
| Unitarias (incluida la prueba de arquitectura con 7 reglas) | 117 en verde |
| E2E contra PostgreSQL | 108 en verde |
| Casos del Plan de Pruebas (56) | 39 automatizados, 12 probados a mano, 5 pendientes de herramientas (Plan de Pruebas §6) |

## 2. Qué falta

### Para terminar la versión actual
- [ ] Aceptar el Pull Request `refactor/puertos-publicos` → `main`.
- [ ] Instalar **Helmet** (cabeceras de seguridad HTTP) en el backend.
- [ ] Ampliar el banco de preguntas: hoy hay 50 (unas 5 por minijuego) y se repiten pronto.

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

### Fuera de alcance
- Módulo "Partidos y Estadísticas" (calendario y resultados en vivo): no tiene pantalla; queda como trabajo futuro (Arquitectura §10).
