# Estado del proyecto

Actualizado al **2 de octubre de 2026**. El código está en la rama `main`, salvo la preparación del despliegue, que está en la rama de trabajo `feature/despliegue` (falta aceptar su Pull Request). La documentación está en la rama `documentacion`.

## 1. Qué funciona

La aplicación corre completa en local: frontend, backend y base de datos, con los tres servicios externos configurados.

### Pantallas (21)

| Grupo | Pantallas |
|---|---|
| Acceso (6) | Splash, Welcome (con Continue with Google), Sign In (Player/Admin), Register, Forgot Password, Reset Password |
| Jugador (9) | Home (con el reto diario), Minigames, GamePlay, Results, News, Credits (con tienda), Profile, Edit Profile, Account Settings |
| Administrador (6) | Dashboard, Users, Analytics, Reports (con exportación CSV), Minijuegos y Economía |

Las 14 pantallas de la maqueta original se conectaron a la API. GamePlay, Forgot/Reset Password, Edit Profile y Account Settings se agregaron para completar los flujos (Requisitos v2.2, RF-112).

**Diseño web:** Football Maestro es una aplicación web. Las pantallas usan todo el ancho del navegador con una barra superior (5 secciones del jugador; las 6 del portal de administración) y se adaptan a escritorio, tableta y celular. La partida es un modo enfocado, sin barra (Requisitos v2.4, RNF-UI-100 a 107).

**Idiomas:** toda la app está en inglés (por defecto) y español, con el selector EN | ES en Welcome y en Account Settings. Se traducen las pantallas, los errores, los minijuegos y sus 203 preguntas, la tienda, las insignias, los datos curiosos, el correo de recuperación y el panel de administración (incluidos sus CSV); las noticias se traen escritas en cada idioma (Arquitectura §8.3).

### Backend

| Módulo | Qué hace |
|---|---|
| Auth | Registro, login Player/Admin, Google, refresh token rotativo, logout, recuperar contraseña por correo |
| Users | Perfil, estadísticas, XP/nivel/racha/precisión, insignias, editar perfil, cambiar contraseña, eliminar cuenta, actividad de uso |
| Games | 10 minijuegos, **cada uno con su propio estilo y mecánica** (pistas, silueta, escudo dibujado, ficha del estadio, tablero de Connections, línea de tiempo, trayectoria, deslizador de precio, cancha, VAR); 203 preguntas; reto diario; puntaje calculado en el servidor; compartir |
| Credits | Saldo, recompensas por eventos (reto diario, racha, compartir, referido), historial, tienda |
| News | Noticias reales de Currents en inglés y español, sincronizadas cada 120 min, sin repetidas y solo de fútbol; filtros por 8 categorías, texto y fecha |
| Admin | Dashboard, gestión de jugadores, analítica, reportes, exportaciones CSV y auditoría; unas 30 gráficas con período de 7, 30 o 90 días |

- **67 endpoints**, todos documentados en el Contrato de API (verificado contra el código).
- **16 tablas y 112 columnas**, todas documentadas en el Modelo de Datos (verificado contra la base de datos).
- **Arquitectura:** monolito modular con Repository, Unit of Work, Strategy, Factory, Adapter, Observer, Facade y DTO; interfaces públicas pequeñas entre módulos. Una prueba automática verifica las reglas.

### Pruebas

| Suite | Resultado |
|---|---|
| Unitarias (incluye la prueba de arquitectura y la validación de las 203 preguntas en los dos idiomas) | 807 en verde |
| E2E contra PostgreSQL | 128 en verde |
| Casos del Plan de Pruebas (70) | 49 automatizados, 16 probados a mano, 5 pendientes de herramientas (Plan de Pruebas §6) |

## 2. Qué falta

### Para terminar la versión actual
- [ ] Revisión de las 203 preguntas por alguien del equipo (sobre todo precios de traspasos y capacidades de estadios, que varían según la fuente) y de su traducción al inglés.
- [ ] Imágenes para los minijuegos: fotos con licencia libre (Wikimedia Commons, con crédito del autor) para estadios y jugadores. Los escudos se siguen dibujando con los colores del club, porque son marcas registradas.

### Para desplegar en internet
Paso a paso en la [Guía de despliegue](Guia_Despliegue.md): frontend en Vercel, backend en Render (plan gratis) y PostgreSQL en Supabase.

- [x] Código listo para producción (`render.yaml`, `project/vercel.json`, SSL hacia la base, proxies, migraciones compiladas), en la rama `feature/despliegue`.
- [x] Proyecto de Supabase "Football Maestro" reactivado y vacío (se borró un prototipo viejo de junio).
- [ ] Aceptar el Pull Request `feature/despliegue` → `main`.
- [ ] Z3rks autoriza las apps de Vercel y Render en GitHub para el repositorio.
- [ ] Render: crear el servicio desde `render.yaml` con los datos de Supabase.
- [ ] Vercel: importar el repositorio con *Root Directory* `project`.
- [ ] Crear el administrador en la base publicada, con una contraseña distinta a la de desarrollo.
- [ ] Google: dirección de Vercel en los orígenes del cliente OAuth y publicar la app ([Guía de servicios externos](Guia_Servicios_Externos.md)).
- [ ] Claves nuevas de Currents y Brevo solo en Render; Brevo con dominio propio (SPF/DKIM).
- [ ] Recorrer el checklist del Plan de Seguridad §9.

### Pruebas pendientes
- [ ] Rendimiento con k6 (TC-31, TC-32, TC-49).
- [ ] Compatibilidad entre navegadores (TC-36) y accesibilidad con teclado (TC-38).
- [ ] Pruebas automatizadas de la interfaz (Playwright o Cypress).

### Propuestas para el futuro
- Monetización con planes Free y Premium: diseñada pero no implementada ([Propuesta de monetización](../08-propuestas/Propuesta_Monetizacion_FootballMaestro.md)).

### Fuera de alcance
- Módulo "Partidos y Estadísticas" (calendario y resultados en vivo): no tiene pantalla; queda como trabajo futuro (Arquitectura §10).
