# Guía del repositorio, ramas y flujo de trabajo

Cómo está organizado el repositorio, cómo avanzó el proyecto y cómo trabajar en equipo. El diseño detallado está en los documentos de las carpetas `01` a `06`.

## 1. Las dos ramas del repositorio

| Rama | Contiene | Cómo se actualiza |
|---|---|---|
| `main` | Todo el código: frontend (`project/`) y backend (`backend/`) | Por Pull Request desde una rama de trabajo temporal (sección 4) |
| `documentacion` | **Solo** documentación (esta rama) | Directamente. Es independiente, sin historia compartida con `main` |

Son las únicas ramas permanentes. Las ramas de trabajo (`feature/*`, `fix/*`, `refactor/*`) salen de `main`, se unen por Pull Request y se borran después.

Regla del equipo: **nunca** se pone código en `documentacion`, ni documentos de diseño en las ramas de código. Los `README.md` técnicos (cómo correr cada parte) sí viven junto al código.

## 2. Estructura del código

```
Football-Maestro/                 (ramas de código)
├── README.md                     Cómo correr el proyecto (empieza por aquí)
├── project/                      Frontend: React 18 + TypeScript + Vite + Tailwind
│   └── src/app/
│       ├── App.tsx               Navegación entre pantallas
│       ├── api/                  Cliente HTTP, una función por endpoint, hook useApi
│       └── components/           Las pantallas
│           ├── layout/           Barra superior y estructura web (PlayerLayout, AdminLayout, AuthLayout, PageHeader)
│           ├── shared/           FormField, TextInput, SelectInput, ErrorBox, LanguageSwitcher
│           └── games/            Una vista por estilo de minijuego (playStyles.ts las registra)
└── backend/                      Backend: NestJS + PostgreSQL (monolito modular)
    ├── docker-compose.yml        PostgreSQL 16 para desarrollo
    ├── .env.example              Variables necesarias (sin valores reales)
    ├── src/
    │   ├── auth/  users/  games/  credits/  news/  admin/     Los 6 módulos
    │   ├── shared/               UnitOfWork (database/), eventos de dominio, fechas, CSV
    │   ├── database/             Migraciones, datos iniciales (seeds) y script admin:create
    │   ├── config/               Validación de variables de entorno
    │   └── architecture.spec.ts  Prueba que verifica las reglas de arquitectura
    └── test/                     Pruebas E2E contra PostgreSQL real
```

Cada módulo del backend tiene las mismas capas (Arquitectura §4):

| Capa | Archivo típico | Responsabilidad |
|---|---|---|
| Controller | `games.controller.ts` | Recibe la petición HTTP y valida el DTO. Sin lógica de negocio |
| Service | `game-sessions.service.ts` | Reglas de negocio. Solo depende de interfaces |
| Repository (interfaz) | `repositories/game-sessions.repository.ts` | Qué datos necesita el dominio (clase abstracta) |
| Repository (implementación) | `repositories/typeorm-game-sessions.repository.ts` | Cómo se obtienen con TypeORM. La única capa que ve el ORM |
| Entity | `entities/game-session.entity.ts` | La tabla de la base de datos |
| DTO | `dto/*.dto.ts` | Forma exacta de lo que entra por la API |

Entre módulos solo se usan **interfaces públicas pequeñas** (`UserAccounts`, `CreditBalanceStore`, `PlayerDirectory`, `UsersStatsReader`, `PlayerGameStatsReader`, `GamesStatsReader`) o eventos de dominio. El detalle está en Arquitectura §3.

## 3. Cómo avanzó el proyecto

El proyecto se construyó en 22 etapas, cada una en su propia rama y en cadena (cada rama salía de la anterior). El 25 de septiembre de 2026 la última se unió a `main` (Pull Request #2) y todas las ramas de trabajo se borraron: **`main` tiene todo el código**, y el trabajo de cada etapa se conserva en su historial de commits (`git log --oneline` o la pestaña *Commits* de GitHub). Desde entonces, cada cambio nuevo es una rama de trabajo que sale de `main`. Las etapas 23 a 25 se unieron a `main` el 27 de septiembre de 2026 (Pull Request #3) y sus ramas también se borraron.

| # | Etapa (rama original) | Qué agregó | Documentos que implementa |
|---|---|---|---|
| 1 | `feature/backend-base` | Proyecto NestJS, PostgreSQL en Docker, las 16 tablas, datos iniciales, `/health` | Modelo de Datos, Arquitectura §8 |
| 2 | `feature/auth` | Registro, login Player/Admin, Google, refresh token, logout, recuperar contraseña | API §4, Seguridad §5 |
| 3 | `feature/games` | Catálogo, reto diario, partidas, puntaje en el servidor, compartir | API §7, Seguridad §6 |
| 4 | `feature/users` | Perfil, estadísticas, progreso (XP, nivel, racha), insignias, actividad | API §5 |
| 5 | `feature/credits` | Saldo, recompensas por eventos, historial, tienda | API §8 |
| 6 | `feature/news` | Adaptador de noticias (Currents), sincronización, feed | API §6 |
| 7 | `feature/admin` | Dashboard, gestión de usuarios, analítica, reportes CSV, auditoría | API §9 |
| 8 | `feature/frontend-api` | Frontend conectado a la API (14 pantallas + GamePlay, Forgot/Reset Password) | Contrato de API |
| 9 | `refactor/arquitectura` | Repositorios con interfaz, Unit of Work, desacople entre módulos, prueba de arquitectura | Arquitectura §3–§7 |
| 10 | `feature/google-login` | Botón oficial de Google, configuración del cliente OAuth | Seguridad §5 |
| 11 | `feature/noticias-reales` | Búsqueda correcta en Currents y filtro de otros deportes | API §6 |
| 12 | `feature/correo-brevo` | Correo real de recuperación de contraseña con Brevo | API §4, Seguridad §5 |
| 13 | `feature/perfil-ajustes` | Pantallas Edit Profile y Account Settings | Requisitos RF-112 |
| 14 | `refactor/frontend-componentes` | Componentes compartidos del frontend (sin cambios visibles) | — |
| 15 | `refactor/puertos-publicos` | Interfaces por consumidor entre módulos del backend | Arquitectura §3, §7 |
| 16 | `feature/minijuego-timeline` | Estilo y mecánica propios para los 10 minijuegos (`components/games/`), `QUESTION.details` y banco de 203 preguntas | API §7.4, Modelo de Datos §5.5 |
| 17 | `feature/iconos-minijuegos` | Ícono propio por minijuego en lugar de emojis (`GAME.icon`) | Modelo de Datos §5.4 |
| 18 | `feature/idiomas` | Interfaz en inglés (por defecto) y español con i18next; selector EN \| ES; errores de la API traducidos en el frontend | Arquitectura §8.3 |
| 19 | `feature/idiomas-contenido` | Minijuegos, 203 preguntas, tienda y datos curiosos en los dos idiomas (`translations`, `GAME_SESSION.locale`) | Modelo de Datos §4, API §3 |
| 20 | `feature/idiomas-extra` | Noticias por idioma, correo de recuperación y panel de admin traducidos; arreglo del botón “atrás” | API §6, §9; Arquitectura §8.3 |
| 21 | `feature/helmet` | Cabeceras de seguridad HTTP con Helmet | Seguridad A05, §10 |
| 22 | `feature/idiomas-csv-insignias` | CSV del panel de admin e insignias en inglés y español | API §5, §9; Modelo de Datos §5.14 |
| 23 | `feature/admin-graficas` | Pantallas Minijuegos y Economía y unas 25 gráficas nuevas en el panel de administración (sale de `main`) | Requisitos RF-154–175, API §9.5–§9.6, Arquitectura §3 |
| 24 | `feature/diseno-web` | App web: barra superior y todas las pantallas a ancho completo (sale de `feature/admin-graficas`) | Requisitos RNF-UI-100–107, Arquitectura §8 |
| 25 | `feature/noticias-filtros` | Noticias sin repetidas y solo de fútbol; filtros por 4 ligas más, texto y fecha (sale de `feature/diseno-web`) | Requisitos RF-176–179, API §6, Modelo de Datos §5.10 |
| 26 | `feature/iconos-admin` | Íconos en lugar de emojis en el portal; la barra superior cabe en todos los anchos | Requisitos RNF-UI-089, 091, 101, 102 |
| 27 | `feature/despliegue` | Configuración para publicar en Vercel, Render y Supabase | Arquitectura §9, Guía de despliegue |

## 4. Flujo de trabajo

```bash
# 1. Partir de la versión más reciente
git checkout main
git pull

# 2. Crear la rama
git checkout -b feature/nombre-corto

# 3. Commits pequeños
git add .
git commit -m "feat(games): calcular puntaje en el servidor"

# 4. Subir la rama y abrir un Pull Request hacia main en GitHub
git push -u origin feature/nombre-corto

# 5. Después de aceptar el Pull Request: borrar la rama y actualizar main
git checkout main
git pull
git branch -d feature/nombre-corto
```

En GitHub, al aceptar el Pull Request aparece el botón **Delete branch**; si no, se borra con `git push origin --delete feature/nombre-corto`.

Para cambiar documentación: `git checkout documentacion`, editar, commit y push a esa misma rama.

### Convenciones

**Nombres de rama:** `feature/<tema>` (funcionalidad nueva), `fix/<tema>` (corrección), `refactor/<tema>` (reorganizar sin cambiar comportamiento).

**Mensajes de commit:** `tipo(módulo): descripción en minúscula`.

| Tipo | Uso |
|---|---|
| `feat` | Funcionalidad nueva |
| `fix` | Corrección de un error |
| `refactor` | Reorganizar código sin cambiar su comportamiento |
| `test` | Agregar o corregir pruebas |
| `docs` | Documentación |
| `chore` | Configuración, dependencias |

**Nunca subir al repositorio:** los archivos `.env`, contraseñas, claves (Google, Currents, Brevo, JWT, base de datos) ni `node_modules/`.

### Checklist de cada Pull Request

Tomado de la *Definition of Done* del Plan de Pruebas (§7):

- [ ] Los RF del cambio están implementados según el Contrato de API.
- [ ] `npm test` y `npm run test:e2e` pasan en `backend/` (incluida la prueba de arquitectura).
- [ ] `npm run typecheck` pasa en `project/`.
- [ ] No se exponen campos sensibles (`password_hash`, `correct_answer`, tokens).
- [ ] Si cambió el diseño (endpoints, tablas, módulos), se actualizó el documento correspondiente en la rama `documentacion`.
- [ ] Al menos una persona del equipo revisó el Pull Request.
