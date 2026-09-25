# Football Maestro — Documentación

App de trivia y minijuegos de fútbol: 10 minijuegos, reto diario, noticias, créditos con tienda y panel administrativo. Proyecto académico (UPB).

Esta rama (`documentacion`) contiene **solo documentación**. El código está en las ramas `main`, `feature/*` y `refactor/*` (ver la [Guía del repositorio](07-guias/Guia_Repositorio_Ramas_y_Flujo.md)).

> **¿Por dónde empiezo?** Si vas a correr la app: [Guía de instalación](07-guias/Guia_Instalacion_y_Ejecucion.md). Si quieres saber cómo va el proyecto: [Estado del proyecto](07-guias/Estado_del_Proyecto.md). Si vas a programar: Arquitectura y Contrato de API.

## Carpetas

```
documentacion/
├── README.md                  ← este índice
├── 01-requisitos/             Qué debe hacer la app
├── 02-arquitectura/           Cómo está construido el backend
├── 03-modelo-de-datos/        Las tablas de la base de datos
├── 04-contrato-api/           Los endpoints de la API
├── 05-pruebas/                Qué se prueba y cómo
├── 06-seguridad/              Riesgos y controles de seguridad
├── 07-guias/                  Guías prácticas y estado del proyecto
└── 08-propuestas/             Diseños de funcionalidades futuras (no implementadas)
```

Los documentos de diseño vienen en dos formatos con el mismo contenido: **`.docx`** para entregar o imprimir, y **`.md`** para leer directamente en GitHub. Las carpetas `*_images/` guardan los diagramas que usan los `.md`.

## Qué contiene cada carpeta

### 01-requisitos — Qué debe hacer la app
| Documento | Versión | Contenido |
|---|---|---|
| `Documento_Requisitos_Funcionales_NoFuncionales_FootballMaestro_v2.md` | 2.2 | Requisitos funcionales de cada pantalla (RF-001 a RF-153) y no funcionales (rendimiento, seguridad, usabilidad, accesibilidad…). Es la base de todos los demás documentos |
| `Football_Maestro_Requisitos_Arquitectura_UML.docx` | Original (19 sep.) | Documento académico inicial: resumen, casos de uso, diagrama de clases y de despliegue. Se conserva como referencia histórica; donde difiera, mandan los documentos de las carpetas 02 a 06 (p. ej. "Partidos y Estadísticas", Redis y WebSockets quedaron fuera de alcance) |

### 02-arquitectura — Cómo está construido el backend
| Documento | Versión | Contenido |
|---|---|---|
| `Documento_Arquitectura_Software_FootballMaestro` | 1.7 | Monolito modular con 6 módulos; interfaces públicas entre módulos; capas; eventos de dominio; patrones (Repository, Unit of Work, Strategy, Factory, Adapter, Observer, Facade, DTO); SOLID; stack; estructura de carpetas; idiomas inglés y español (§8.3) y despliegue |

### 03-modelo-de-datos — Las tablas
| Documento | Versión | Contenido |
|---|---|---|
| `Documento_Modelo_Datos_FootballMaestro` | 1.9 | Diagrama entidad-relación, decisiones de diseño y diccionario de las 16 tablas (verificado contra la base de datos real), incluido el contenido en inglés y español |

### 04-contrato-api — Los endpoints
| Documento | Versión | Contenido |
|---|---|---|
| `Documento_Contrato_API_FootballMaestro` | 1.9 | Convenciones (autenticación, idioma, errores, paginación), los 50 endpoints por módulo con el RF que cubre cada uno (verificado contra el código) y el formato de cada estilo de minijuego (§7.4) |

### 05-pruebas — Qué se prueba
| Documento | Versión | Contenido |
|---|---|---|
| `Plan_Pruebas_FootballMaestro` | 1.4 | Estrategia, casos TC-01 a TC-61, estado de la automatización (789 unitarias, 115 E2E) y Definition of Done |

### 06-seguridad — Riesgos y controles
| Documento | Versión | Contenido |
|---|---|---|
| `Plan_Seguridad_FootballMaestro` | 1.3 | Modelo de amenazas, OWASP Top 10, sesiones, integridad de puntaje y créditos, datos personales (Ley 1581), checklist antes de desplegar y estado real de cada control |

### 07-guias — Guías prácticas
| Documento | Para qué sirve |
|---|---|
| [`Estado_del_Proyecto.md`](07-guias/Estado_del_Proyecto.md) | Qué funciona hoy y qué falta (terminar, desplegar, probar) |
| [`Guia_Instalacion_y_Ejecucion.md`](07-guias/Guia_Instalacion_y_Ejecucion.md) | Cómo correr la app en un PC, crear un administrador y solucionar problemas comunes |
| [`Guia_Repositorio_Ramas_y_Flujo.md`](07-guias/Guia_Repositorio_Ramas_y_Flujo.md) | Estructura del código, las 16 ramas del proyecto, flujo de trabajo, convenciones y checklist de Pull Request |
| [`Guia_Servicios_Externos.md`](07-guias/Guia_Servicios_Externos.md) | Google, Currents (noticias) y Brevo (correo): configuración actual y lo que falta para producción |

### 08-propuestas — Funcionalidades futuras (no implementadas)
| Documento | Versión | Contenido |
|---|---|---|
| `Propuesta_Monetizacion_FootballMaestro` | 1.0 | Planes Free (anuncios alrededor del contenido, una partida por minijuego al día) y Premium (partidas ilimitadas, sin anuncios, descuento en la tienda): arquitectura, datos, endpoints, pasarela de pagos, aspectos legales, seguridad, pruebas y fases. Si se aprueba, su contenido pasa a los documentos oficiales |

## Orden de lectura sugerido

| Si vas a… | Lee |
|---|---|
| Entender el proyecto | Estado del proyecto → Requisitos → Arquitectura §1–§3 |
| Programar el backend | Arquitectura → Modelo de Datos → Contrato de API → Guía del repositorio |
| Programar el frontend | Requisitos (pantallas) → Contrato de API |
| Probar | Plan de Pruebas → Guía de instalación |
| Desplegar | Plan de Seguridad §9 → Guía de servicios externos → Estado del proyecto §2 |

## Cómo actualizar esta documentación

1. `git checkout documentacion` y `git pull`.
2. Edita el documento en su carpeta. Si cambias un `.md` de las carpetas 02 a 06, actualiza también su `.docx`, para que ambos formatos digan lo mismo.
3. Sube la versión en la portada y agrega una fila al **historial de versiones** al final del documento.
4. Si cambia una versión, actualízala también en las tablas de este README.
5. `git commit -m "docs: ..."` y `git push` (esta rama no usa Pull Requests hacia `main`).
