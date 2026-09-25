**FOOTBALL MAESTRO**

*Become a Football Maestro*

**DOCUMENTO DE REQUISITOS**

**FUNCIONALES Y NO FUNCIONALES**

Elaboración del documento de requisitos funcionales y no funcionales

(Backlog del Proyecto --- Tablero Trello "Football Maestro")

Fecha de elaboración: 4 de septiembre de 2026

Fecha de actualización: 24 de septiembre de 2026

Versión: 2.2

1\. Introducción

El presente documento describe los requisitos funcionales y no
funcionales del proyecto "Football Maestro", una aplicación móvil/web
orientada a aficionados al fútbol que combina noticias deportivas,
minijuegos de trivia y conocimiento futbolístico, seguimiento de
progreso del usuario (niveles, rachas, experiencia), un sistema de
créditos canjeables y un panel administrativo de 4 pantallas (Dashboard,
Usuarios, Analytics y Reportes) para la gestión y el análisis de la
plataforma.

La información aquí consolidada se extrajo y organizó a partir del
tablero de gestión ágil del proyecto (Trello), específicamente de las
historias de usuario definidas para cada pantalla del sistema, junto con
sus criterios de aceptación funcionales, de navegación y de diseño de
interfaz.

2\. Objetivo del documento

Establecer, de manera formal y trazable, los requisitos funcionales (qué
debe hacer el sistema) y no funcionales (bajo qué condiciones de
calidad, usabilidad, rendimiento, seguridad y disponibilidad debe
operar) que servirán como base para el diseño de la arquitectura, el
desarrollo y las pruebas del sistema "Football Maestro".

3\. Alcance del proyecto

El alcance funcional cubre las siguientes catorce (14) pantallas o
módulos principales del sistema, derivados directamente del tablero del
proyecto, junto con la cantidad de historias de usuario relevadas para
cada uno (36 historias de usuario en total). El panel administrativo,
originalmente una sola pantalla, se reorganizó en 4 pantallas
independientes con su propia navegación (AdminBottomNav):
AdminDashboardScreen, AdminUsersScreen, AdminAnalyticsScreen y
AdminReportsScreen.

  --------------------------------------------------------------------------
  **\#**   **Módulo / Pantalla**                 **N.º de historias de
                                                 usuario**
  -------- ------------------------------------- ---------------------------
  1        SplashScreen                          2

  2        WelcomeScreen                         3

  3        SignInScreen                          3

  4        RegisterScreen                        3

  5        MainHomeScreen                        4

  6        NewsScreen                            3

  7        MinigamesScreen                       2

  8        ResultsScreen                         3

  9        ProfileScreen                         3

  10       CreditsScreen                         2

  11       AdminDashboardScreen                  2

  12       AdminUsersScreen                      2

  13       AdminAnalyticsScreen                  2

  14       AdminReportsScreen                    2
  --------------------------------------------------------------------------

Adicionalmente, el backlog del proyecto contempla las siguientes
actividades transversales de análisis y diseño, en las cuales se enmarca
la elaboración del presente documento:

-   Elaboración del documento de requisitos funcionales y no
    funcionales.

-   video- funcionamiento de la pagina

-   Diseño de la arquitectura lógica y física del sistema.

-   Wireframes de baja fidelidad para pantallas principales (Home,
    Noticias, Estadísticas, Juegos, Métricas).

-   Maquetación responsiva de la vista principal (Dashboard / Home).

Fuera de alcance: el módulo "Partidos y Estadísticas" (calendario de
partidos, resultados en tiempo real y estadísticas de equipos y
jugadores obtenidas de una API deportiva), mencionado como RF-07 y
RF-08 en el documento "Especificación de Requisitos, Arquitectura del
Sistema y Diagramas UML" del 19 de septiembre de 2026, no tiene ninguna
pantalla ni historia de usuario en el tablero. Queda registrado como
trabajo futuro y no forma parte de los requisitos de este documento.

4\. Requisitos Funcionales

Los requisitos funcionales describen las acciones, comportamientos y
reglas de negocio que el sistema debe ejecutar. Se agrupan por
pantalla/módulo y se derivan de los criterios de "Requisitos
funcionales" y "Navegación" definidos en cada historia de usuario del
tablero. Cada requisito se identifica con el código RF-XXX.

SplashScreen

  ------------------------------------------------------------------------
  **ID**     **Historia relacionada** **Requisito**
  ---------- ------------------------ ------------------------------------
  RF-001     \(4\) Pantalla de carga  El logo debe animarse al montar la
             animada                  pantalla: escala de 0.5 a 1 y
                                      opacidad de 0 a 1, en 0.6s con
                                      easing \"easeOut\".

  RF-002     \(4\) Pantalla de carga  Debe mostrar el ícono de trofeo
             animada                  dentro de un círculo bg-accent, con
                                      el título \"Football Maestro\" y el
                                      subtítulo \"Master the Beautiful
                                      Game\".

  RF-003     \(4\) Pantalla de carga  Esta debe ser la primera pantalla
             animada                  que ve el usuario al abrir la app,
                                      antes de cualquier verificación de
                                      sesión.

  RF-004     \(4\) Pantalla de carga  No debe tener ningún elemento
             animada                  interactivo (botones, enlaces); el
                                      usuario no navega manualmente desde
                                      aquí.

  RF-005     \(5\) Indicador de carga El indicador de carga (3 puntos +
             y redirección automática texto \"Loading\...\") debe aparecer
                                      con un fade-in retrasado 0.3s
                                      respecto al logo.

  RF-006     \(5\) Indicador de carga Cada uno de los 3 puntos debe animar
             y redirección automática escala (1→1.3→1) y opacidad
                                      (0.5→1→0.5) en bucle infinito de
                                      1.2s, con delay escalonado de 0.2s
                                      entre ellos.

  RF-007     \(5\) Indicador de carga Transcurrido el tiempo de carga, el
             y redirección automática sistema debe redirigir
                                      automáticamente a WelcomeScreen (o a
                                      MainHomeScreen si ya hay sesión
                                      activa de jugador, o a
                                      AdminDashboardScreen si la sesión
                                      es de administrador) sin acción
                                      del usuario.

  RF-008     \(5\) Indicador de carga La navegación es 100% automática: el
             y redirección automática usuario no puede saltar ni acelerar
                                      manualmente la transición.

  RF-009     \(5\) Indicador de carga La lógica de redirección debe
             y redirección automática verificar el estado de sesión antes
                                      de decidir el destino (WelcomeScreen
                                      vs MainHomeScreen).
  ------------------------------------------------------------------------

WelcomeScreen

  ------------------------------------------------------------------------
  **ID**     **Historia relacionada** **Requisito**
  ---------- ------------------------ ------------------------------------
  RF-010     \(1\) Pantalla de        La pantalla debe mostrarse
             bienvenida con logo y    automáticamente tras el SplashScreen
             propuesta                si el usuario no tiene sesión
                                      activa.

  RF-011     \(1\) Pantalla de        Debe mostrar el logo (ícono de
             bienvenida con logo y    trofeo en círculo) sobre fondo
             propuesta                bg-primary con padding y sombra.

  RF-012     \(1\) Pantalla de        Debe mostrar el título \"Football
             bienvenida con logo y    Maestro\" y el subtítulo \"Become a
             propuesta                Football Maestro\".

  RF-013     \(1\) Pantalla de        No debe tener botón de \"atrás\", ya
             bienvenida con logo y    que es la primera pantalla visible
             propuesta                tras el splash.

  RF-014     \(1\) Pantalla de        El avance se realiza solo mediante
             bienvenida con logo y    los botones descritos en la historia
             propuesta                (2) Botones Sign In / Create
                                      Account.

  RF-015     \(2\) Botones Sign In /  El botón \"Sign In\" debe navegar a
             Create Account           SignInScreen al presionarlo.

  RF-016     \(2\) Botones Sign In /  El botón \"Create Account\" debe
             Create Account           navegar a RegisterScreen al
                                      presionarlo.

  RF-017     \(2\) Botones Sign In /  Ambos botones deben estar apilados
             Create Account           verticalmente, ocupando el ancho
                                      completo del contenedor.

  RF-018     \(2\) Botones Sign In /  \"Sign In\" (onSignIn) debe llevar
             Create Account           directo a SignInScreen sin pasos
                                      intermedios.

  RF-019     \(2\) Botones Sign In /  \"Create Account\" (onCreateAccount)
             Create Account           debe llevar directo a RegisterScreen
                                      sin pasos intermedios.

  RF-020     \(3\) Continuar con      El botón \"Continue with Google\"
             Google                   debe estar disponible debajo del
                                      divisor \"or\", tras los botones
                                      Sign In/Create Account.

  RF-021     \(3\) Continuar con      Al presionarlo, el sistema debe
             Google                   iniciar el flujo de autenticación
                                      OAuth con Google.

  RF-022     \(3\) Continuar con      Si es un usuario nuevo, debe crear
             Google                   cuenta automáticamente; si ya
                                      existe, debe iniciar sesión
                                      directamente.

  RF-023     \(3\) Continuar con      Al completar la autenticación con
             Google                   Google exitosamente, debe redirigir
                                      directo a MainHomeScreen.

  RF-024     \(3\) Continuar con      Si el usuario cancela el flujo de
             Google                   Google, debe permanecer en
                                      WelcomeScreen sin errores
                                      bloqueantes.
  ------------------------------------------------------------------------

SignInScreen

  ------------------------------------------------------------------------
  **ID**     **Historia relacionada** **Requisito**
  ---------- ------------------------ ------------------------------------
  RF-025     \(6\) Iniciar sesión     El toggle \"Access type\" debe
             como Jugador             iniciar en \"Player\" por defecto.

  RF-026     \(6\) Iniciar sesión     Los campos Email (placeholder
             como Jugador             \"your@email.com\") y Password son
                                      obligatorios para enviar el
                                      formulario.

  RF-027     \(6\) Iniciar sesión     Al enviar, el botón debe decir
             como Jugador             \"Sign In\" (no \"Access Admin
                                      Panel\", reservado al rol Admin).

  RF-028     \(6\) Iniciar sesión     La flecha \"atrás\" (ArrowLeft) del
             como Jugador             header debe regresar a
                                      WelcomeScreen.

  RF-029     \(6\) Iniciar sesión     Al enviar el formulario
             como Jugador             correctamente en modo Player, debe
                                      navegar a MainHomeScreen.

  RF-030     \(7\) Iniciar sesión     Al seleccionar \"Admin\" en el
             como Administrador       toggle, el placeholder del email
                                      debe cambiar a
                                      \"admin@footballmaestro.com\" y la
                                      etiqueta a \"Admin Email\".

  RF-031     \(7\) Iniciar sesión     El botón de envío debe decir
             como Administrador       \"Access Admin Panel\" en lugar de
                                      \"Sign In\".

  RF-032     \(7\) Iniciar sesión     En modo Admin deben ocultarse: el
             como Administrador       divisor \"or\", el botón \"Continue
                                      with Google\" y el enlace \"Don\'t
                                      have an account? Create one\".

  RF-033     \(7\) Iniciar sesión     Al enviar el formulario
             como Administrador       correctamente en modo Admin, debe
                                      navegar a AdminDashboardScreen (no
                                      a MainHomeScreen).

  RF-034     \(7\) Iniciar sesión     La flecha \"atrás\" debe seguir
             como Administrador       llevando a WelcomeScreen incluso con
                                      el rol Admin seleccionado.

  RF-035     \(8\) Recuperar          El enlace \"Forgot password?\" debe
             contraseña olvidada      estar disponible tanto en modo
                                      Player como en modo Admin.

  RF-036     \(8\) Recuperar          Al presionarlo, debe iniciar el
             contraseña olvidada      flujo de recuperación de contraseña
                                      (envío de enlace o código al
                                      correo).

  RF-037     \(8\) Recuperar          No debe requerir que el usuario haya
             contraseña olvidada      llenado el campo de contraseña para
                                      poder presionarlo.

  RF-038     \(8\) Recuperar          Al presionarlo, debe abrir una
             contraseña olvidada      pantalla o modal de recuperación de
                                      contraseña (fuera del flujo de
                                      SignInScreen).

  RF-039     \(8\) Recuperar          Tras completar la recuperación, el
             contraseña olvidada      usuario debe poder regresar a
                                      SignInScreen para iniciar sesión con
                                      la nueva contraseña.
  ------------------------------------------------------------------------

RegisterScreen

  ------------------------------------------------------------------------
  **ID**     **Historia relacionada** **Requisito**
  ---------- ------------------------ ------------------------------------
  RF-040     \(9\) Crear cuenta con   Debe permitir ingresar Username
             usuario, correo y        (placeholder \"footballfan123\"),
             contraseña               Email, Password y Confirm Password.

  RF-041     \(9\) Crear cuenta con   Los 4 campos son obligatorios
             usuario, correo y        (required) para poder enviar el
             contraseña               formulario.

  RF-042     \(9\) Crear cuenta con   Al presionar \"Create Account\" con
             usuario, correo y        datos válidos, el sistema debe crear
             contraseña               la cuenta del usuario.

  RF-043     \(9\) Crear cuenta con   El botón \"atrás\" (onBack) debe
             usuario, correo y        regresar a WelcomeScreen.
             contraseña               

  RF-044     \(9\) Crear cuenta con   Al crear la cuenta exitosamente
             usuario, correo y        (onRegister), el sistema debe
             contraseña               navegar a MainHomeScreen.

  RF-045     \(10\) Validación de     Si \"Password\" y \"Confirm
             confirmación de          Password\" no coinciden al enviar,
             contraseña               el sistema debe mostrar la alerta
                                      \"Passwords don\'t match!\".

  RF-046     \(10\) Validación de     El formulario no debe completar el
             confirmación de          registro (no debe ejecutar
             contraseña               onRegister) si las contraseñas no
                                      coinciden.

  RF-047     \(10\) Validación de     Ambos campos (Password y Confirm
             confirmación de          Password) deben ser de tipo
             contraseña               password, ocultando el texto
                                      ingresado.

  RF-048     \(10\) Validación de     Tras el error de validación, el
             confirmación de          usuario debe permanecer en
             contraseña               RegisterScreen (sin navegar) para
                                      corregir los campos.

  RF-049     \(10\) Validación de     Solo cuando ambos campos coincidan,
             confirmación de          el sistema debe permitir avanzar
             contraseña               hacia la creación de la cuenta.

  RF-050     \(11\) Registro con      El botón \"Continue with Google\"
             Google                   debe estar disponible tras el
                                      divisor \"or\", debajo del botón
                                      \"Create Account\".

  RF-051     \(11\) Registro con      Al presionarlo, debe iniciar el
             Google                   flujo de registro/autenticación
                                      OAuth con Google.

  RF-052     \(11\) Registro con      La cuenta debe crearse
             Google                   automáticamente con los datos de la
                                      cuenta de Google, sin pedir
                                      Username/Password manuales.

  RF-053     \(11\) Registro con      Al completar el registro con Google
             Google                   exitosamente, debe navegar directo a
                                      MainHomeScreen.

  RF-054     \(11\) Registro con      El enlace \"Already have an account?
             Google                   Sign in\" (onGoToSignIn) debe llevar
                                      a SignInScreen.
  ------------------------------------------------------------------------

MainHomeScreen

  ------------------------------------------------------------------------
  **ID**     **Historia relacionada** **Requisito**
  ---------- ------------------------ ------------------------------------
  RF-055     \(12\) Header con nivel  Debe mostrar el avatar \"FM\", el
             y racha                  saludo \"Welcome back!\" y el nombre
                                      del usuario (ej.
                                      \"FootballFan123\").

  RF-056     \(12\) Header con nivel  Debe mostrar el nivel actual del
             y racha                  usuario (ej. \"Lvl 12\") con ícono
                                      Trophy.

  RF-057     \(12\) Header con nivel  Debe mostrar la racha de días
             y racha                  consecutivos (ej. \"7\") con ícono
                                      Flame.

  RF-058     \(12\) Header con nivel  El header es informativo; no debe
             y racha                  tener elementos que naveguen a otra
                                      pantalla directamente (la navegación
                                      se hace por BottomNav).

  RF-059     \(13\) Tarjeta de reto   Debe mostrar la etiqueta \"DAILY
             diario (Daily Challenge) CHALLENGE\", el título \"Football
                                      Trivia Blitz\" y la recompensa \"+50
                                      XP\".

  RF-060     \(13\) Tarjeta de reto   Debe mostrar la descripción \"Answer
             diario (Daily Challenge) 10 quick questions about today\'s
                                      matches!\".

  RF-061     \(13\) Tarjeta de reto   El botón \"Play Now\" debe iniciar
             diario (Daily Challenge) el minijuego correspondiente al reto
                                      diario.

  RF-062     \(13\) Tarjeta de reto   \"Play Now\" debe navegar al flujo
             diario (Daily Challenge) de juego del reto diario dentro de
                                      MinigamesScreen.

  RF-063     \(14\) Vista previa de   Debe mostrar una vista previa
             minijuegos               horizontal (scroll) con al menos 4
                                      minijuegos: ícono, nombre y
                                      dificultad.

  RF-064     \(14\) Vista previa de   El enlace \"See all\" debe estar
             minijuegos               visible junto al título
                                      \"Mini-games\".

  RF-065     \(14\) Vista previa de   \"See all\"
             minijuegos               (onNavigate(\"minigames\")) debe
                                      navegar a MinigamesScreen.

  RF-066     \(14\) Vista previa de   Tocar una tarjeta de minijuego
             minijuegos               individual debe abrir ese minijuego
                                      específico.

  RF-067     \(15\) Vista previa de   Debe mostrar una vista previa de
             noticias y \"My Stats\"  \"Latest Football News\" con 2
                                      artículos (imagen, título, fuente,
                                      tiempo transcurrido).

  RF-068     \(15\) Vista previa de   Debe mostrar la sección \"My Stats\"
             noticias y \"My Stats\"  con Accuracy (87%), Badges (23) y
                                      Total XP (1,245).

  RF-069     \(15\) Vista previa de   El enlace \"See all\" de noticias
             noticias y \"My Stats\"  debe estar visible junto al título
                                      \"Latest Football News\".

  RF-070     \(15\) Vista previa de   \"See all\" (onNavigate(\"news\"))
             noticias y \"My Stats\"  debe navegar a NewsScreen.
  ------------------------------------------------------------------------

NewsScreen

  ------------------------------------------------------------------------
  **ID**     **Historia relacionada** **Requisito**
  ---------- ------------------------ ------------------------------------
  RF-071     \(16\) Feed de noticias  Debe mostrar el feed de \"Football
             de fútbol                News\" con imagen, categoría,
                                      tiempo, título y descripción por
                                      cada artículo.

  RF-072     \(16\) Feed de noticias  Debe listar al menos 6 artículos de
             de fútbol                ejemplo, ordenados del más reciente
                                      al más antiguo.

  RF-073     \(16\) Feed de noticias  Debe mostrar la fuente de cada
             de fútbol                artículo (ej. ESPN, Sky Sports, BBC
                                      Sport).

  RF-074     \(16\) Feed de noticias  El feed debe permitir scroll
             de fútbol                vertical continuo dentro del área de
                                      contenido, con BottomNav siempre
                                      visible.

  RF-075     \(17\) Filtro de         Debe mostrar 5 categorías: All,
             categorías de noticias   Transfers, Champions League, World
                                      Cup, Premier League.

  RF-076     \(17\) Filtro de         \"All\" debe estar seleccionada por
             categorías de noticias   defecto al entrar a la pantalla.

  RF-077     \(17\) Filtro de         Al seleccionar una categoría, el
             categorías de noticias   feed debe filtrarse para mostrar
                                      solo artículos de esa categoría.

  RF-078     \(17\) Filtro de         El filtro no cambia de pantalla;
             categorías de noticias   solo actualiza el contenido visible
                                      dentro de NewsScreen.

  RF-079     \(18\) Abrir noticia en  Cada tarjeta debe mostrar un ícono
             fuente externa           de enlace externo (ExternalLink)
                                      junto a la fuente del artículo.

  RF-080     \(18\) Abrir noticia en  Al presionarlo, debe abrir la fuente
             fuente externa           original de la noticia para leer el
                                      artículo completo.

  RF-081     \(18\) Abrir noticia en  Debe abrirse fuera de la app
             fuente externa           (navegador o vista externa), sin
                                      cerrar la sesión activa del usuario.

  RF-082     \(18\) Abrir noticia en  Al cerrar la vista externa, el
             fuente externa           usuario debe regresar a NewsScreen
                                      en el mismo punto de scroll.
  ------------------------------------------------------------------------

MinigamesScreen

  ------------------------------------------------------------------------
  **ID**     **Historia relacionada** **Requisito**
  ---------- ------------------------ ------------------------------------
  RF-083     \(19\) Catálogo de       Debe mostrar una cuadrícula de 2
             minijuegos               columnas con los 10 minijuegos:
                                      nombre, descripción, categoría y
                                      dificultad.

  RF-084     \(19\) Catálogo de       Cada minijuego debe mostrar su
             minijuegos               dificultad (Easy, Medium, Hard o
                                      Expert) con color distintivo.

  RF-085     \(19\) Catálogo de       Debe mostrar la categoría de cada
             minijuegos               minijuego (Players, Clubs, Stadiums,
                                      Logic, History, Transfers, Teams,
                                      Rules) con ícono Star.

  RF-086     \(19\) Catálogo de       La cuadrícula debe permitir scroll
             minijuegos               vertical continuo, con BottomNav
                                      siempre visible en la parte
                                      inferior.

  RF-087     \(20\) Jugar un          Al hacer clic en cualquier tarjeta
             minijuego desde el       de minijuego, debe iniciar ese juego
             catálogo                 específico.

  RF-088     \(20\) Jugar un          Las 10 tarjetas deben ser
             minijuego desde el       interactivas (cursor-pointer) por
             catálogo                 igual, sin distinción de bloqueo o
                                      nivel requerido.

  RF-089     \(20\) Jugar un          Al completar el minijuego, el
             minijuego desde el       sistema debe navegar a ResultsScreen
             catálogo                 con el puntaje obtenido.

  RF-090     \(20\) Jugar un          Si el usuario sale del minijuego sin
             minijuego desde el       terminarlo, debe regresar a
             catálogo                 MinigamesScreen.
  ------------------------------------------------------------------------

ResultsScreen

  ------------------------------------------------------------------------
  **ID**     **Historia relacionada** **Requisito**
  ---------- ------------------------ ------------------------------------
  RF-091     \(21\) Puntaje final y   Debe calcular y mostrar el puntaje
             precisión                final (score/total, ej. 8/10) y el
                                      porcentaje de precisión.

  RF-092     \(21\) Puntaje final y   Debe mostrar un mensaje motivacional
             precisión                según el desempeño (ej. \"Excellent
                                      work!\").

  RF-093     \(21\) Puntaje final y   Debe mostrar el conteo de respuestas
             precisión                correctas e incorrectas por
                                      separado.

  RF-094     \(21\) Puntaje final y   El botón \"atrás\" del header debe
             precisión                regresar a MinigamesScreen.

  RF-095     \(22\) Cuadrícula de     Debe mostrar una cuadrícula de 5
             aciertos/errores         columnas con un cuadro numerado por
                                      cada pregunta respondida.

  RF-096     \(22\) Cuadrícula de     Cada cuadro debe colorearse en verde
             aciertos/errores         si la respuesta fue correcta, o rojo
                                      si fue incorrecta.

  RF-097     \(22\) Cuadrícula de     Debe mostrar un \"dato curioso\"
             aciertos/errores         (Fun Fact) de fútbol al final de la
                                      pantalla, distinto en cada partida
                                      si es posible.

  RF-098     \(22\) Cuadrícula de     La cuadrícula y el dato curioso son
             aciertos/errores         informativos; no deben tener
                                      elementos que naveguen a otra
                                      pantalla.

  RF-099     \(23\) Compartir         El botón \"Share Result\" debe
             resultado o jugar de     permitir compartir el resultado
             nuevo                    obtenido.

  RF-100     \(23\) Compartir         El botón \"Play Again\" debe
             resultado o jugar de     reiniciar el mismo minijuego desde
             nuevo                    cero.

  RF-101     \(23\) Compartir         El botón \"Back to Mini-games\" debe
             resultado o jugar de     regresar al catálogo sin reiniciar
             nuevo                    el juego actual.

  RF-102     \(23\) Compartir         \"Play Again\" (onPlayAgain) debe
             resultado o jugar de     reiniciar el mismo minijuego, sin
             nuevo                    volver al catálogo.

  RF-103     \(23\) Compartir         \"Back to Mini-games\" (onBack) debe
             resultado o jugar de     navegar a MinigamesScreen.
             nuevo                    
  ------------------------------------------------------------------------

ProfileScreen

  ------------------------------------------------------------------------
  **ID**     **Historia relacionada** **Requisito**
  ---------- ------------------------ ------------------------------------
  RF-104     \(24\) Cabecera con      Debe mostrar el avatar \"FM\", el
             avatar y estadísticas    nombre de usuario y el correo
                                      electrónico.

  RF-105     \(24\) Cabecera con      Debe mostrar 3 estadísticas: Level,
             avatar y estadísticas    Day Streak y Badges, con sus valores
                                      numéricos.

  RF-106     \(24\) Cabecera con      El header es informativo; no debe
             avatar y estadísticas    tener elementos que naveguen a otra
                                      pantalla directamente.

  RF-107     \(25\) Sección de        Debe mostrar Accuracy (%), Total XP
             rendimiento              y Games Played en filas dentro de
             (Performance)            una tarjeta \"Performance\".

  RF-108     \(25\) Sección de        Cada fila debe incluir un ícono
             rendimiento              distintivo, una etiqueta y una breve
             (Performance)            descripción (ej. \"Overall correct
                                      answers\").

  RF-109     \(25\) Sección de        La sección es informativa; no debe
             rendimiento              tener elementos que naveguen a otra
             (Performance)            pantalla.

  RF-110     \(26\) Menú de           Debe mostrar 3 opciones en el menú:
             configuración y cerrar   \"Account Settings\", \"Edit
             sesión                   Profile\" y \"Log Out\".

  RF-111     \(26\) Menú de           Al presionar \"Log Out\", debe
             configuración y cerrar   cerrar la sesión del usuario de
             sesión                   forma inmediata.

  RF-112     \(26\) Menú de           \"Account Settings\" y \"Edit
             configuración y cerrar   Profile\" deben abrir sus
             sesión                   respectivas pantallas: Edit Profile
                                      cambia el nombre de usuario y el
                                      país; Account Settings cambia la
                                      contraseña (cerrando todas las
                                      sesiones) y elimina la cuenta con
                                      confirmación (Ley 1581).

  RF-113     \(26\) Menú de           \"Log Out\" (onLogout) debe cerrar
             configuración y cerrar   sesión y redirigir a WelcomeScreen.
             sesión                   
  ------------------------------------------------------------------------

CreditsScreen

  ------------------------------------------------------------------------
  **ID**     **Historia relacionada** **Requisito**
  ---------- ------------------------ ------------------------------------
  RF-114     \(27\) Saldo y formas de Debe mostrar el saldo actual de
             ganar créditos           créditos del usuario (ej. 1,250) de
                                      forma prominente.

  RF-115     \(27\) Saldo y formas de Debe listar las 4 formas de ganar
             ganar créditos           créditos: Complete Daily Challenge
                                      (+50), Maintain 7-day streak (+100),
                                      Share your results (+25), Refer a
                                      friend (+200).

  RF-116     \(27\) Saldo y formas de Esta sección es informativa; no debe
             ganar créditos           tener elementos que naveguen a otra
                                      pantalla.

  RF-117     \(28\) Canjear créditos  Debe mostrar una cuadrícula de 2
             por artículos de la      columnas con los 6 artículos de la
             tienda                   tienda: ícono, nombre, tipo y costo.

  RF-118     \(28\) Canjear créditos  El botón debe decir \"Purchase\" si
             por artículos de la      el usuario tiene saldo suficiente, o
             tienda                   \"Not Enough\" (deshabilitado) si no
                                      le alcanza.

  RF-119     \(28\) Canjear créditos  Al presionar \"Purchase\" con saldo
             por artículos de la      suficiente, el sistema debe
             tienda                   descontar los créditos y aplicar el
                                      artículo al perfil del usuario.

  RF-120     \(28\) Canjear créditos  Al completar una compra, el usuario
             por artículos de la      debe permanecer en CreditsScreen
             tienda                   viendo su saldo actualizado.
  ------------------------------------------------------------------------

AdminDashboardScreen

  ------------------------------------------------------------------------
  **ID**     **Historia relacionada** **Requisito**
  ---------- ------------------------ ------------------------------------
  RF-121     \(29\) Alertas del       Debe mostrar la fecha y hora
             sistema y KPIs           actuales, y un indicador de estado
                                      \"En línea\".

  RF-122     \(29\) Alertas del       Debe mostrar alertas del sistema
             sistema y KPIs           tipo advertencia e informativas (ej.
                                      caída de retención, récords de
                                      partidas).

  RF-123     \(29\) Alertas del       Debe mostrar 4 KPIs (Usuarios
             sistema y KPIs           totales, Activos hoy, Partidas hoy,
                                      Precisión media) cada uno con su
                                      variación porcentual (positiva o
                                      negativa).

  RF-124     \(29\) Alertas del       El botón \"Salir\" (onLogout) debe
             sistema y KPIs           cerrar sesión y regresar a
                                      WelcomeScreen.

  RF-125     \(30\) Gráfica DAU,      Debe mostrar la gráfica de área de
             ranking y accesos        usuarios activos diarios (DAU) de
             rápidos                  los últimos 7 días, con etiqueta de
                                      variación semanal.

  RF-126     \(30\) Gráfica DAU,      Debe mostrar el ranking de los 4
             ranking y accesos        minijuegos más jugados, con número
             rápidos                  de jugadas, puntaje promedio y
                                      tendencia (arriba/abajo).

  RF-127     \(30\) Gráfica DAU,      Debe mostrar 3 botones de acceso
             ranking y accesos        rápido: Usuarios, Analytics y
             rápidos                  Reportes.

  RF-128     \(30\) Gráfica DAU,      Cada acceso rápido (onNavigate) debe
             ranking y accesos        llevar directo a AdminUsersScreen,
             rápidos                  AdminAnalyticsScreen o
                                      AdminReportsScreen según
                                      corresponda.

  RF-129     \(30\) Gráfica DAU,      El AdminBottomNav debe permanecer
             ranking y accesos        visible y resaltar \"Dashboard\"
             rápidos                  como pestaña activa.
  ------------------------------------------------------------------------

AdminUsersScreen

  ------------------------------------------------------------------------
  **ID**     **Historia relacionada** **Requisito**
  ---------- ------------------------ ------------------------------------
  RF-130     \(31\) Buscador y        El buscador debe filtrar la lista de
             filtros de usuarios      usuarios en tiempo real por nombre o
                                      email.

  RF-131     \(31\) Buscador y        Debe mostrar 4 píldoras de filtro
             filtros de usuarios      (Todos, Activos, Inactivos, Nuevos
                                      7d) con su conteo respectivo,
                                      combinables con la búsqueda.

  RF-132     \(31\) Buscador y        Debe mostrar el conteo de usuarios
             filtros de usuarios      mostrados y un botón \"Exportar\"
                                      sobre la lista.

  RF-133     \(31\) Buscador y        El botón \"×\" para limpiar la
             filtros de usuarios      búsqueda no debe navegar; solo vacía
                                      el campo y restaura la lista
                                      completa.

  RF-134     \(32\) Panel de acciones Cada tarjeta de usuario debe mostrar
             expandible por usuario   avatar con iniciales, bandera de
                                      país, nombre, indicador de estado,
                                      email, nivel, racha y XP.

  RF-135     \(32\) Panel de acciones Al hacer clic en la tarjeta (o en el
             expandible por usuario   botón de más opciones), debe
                                      expandirse un panel con 3 acciones:
                                      Ver perfil, Suspender/Activar (según
                                      estado actual), Eliminar.

  RF-136     \(32\) Panel de acciones El panel expandido debe mostrar
             expandible por usuario   también la fecha de registro y el
                                      estado (Activo/Inactivo) del
                                      usuario.

  RF-137     \(32\) Panel de acciones Hacer clic de nuevo en la misma
             expandible por usuario   tarjeta debe colapsar el panel
                                      (toggle), sin navegar a otra
                                      pantalla.
  ------------------------------------------------------------------------

AdminAnalyticsScreen

  ------------------------------------------------------------------------
  **ID**     **Historia relacionada** **Requisito**
  ---------- ------------------------ ------------------------------------
  RF-138     \(33\) KPIs, crecimiento Debe mostrar 3 KPIs rápidos: Sesión
             y retención              media, Retención D7 y DAU/MAU.

  RF-139     \(33\) KPIs, crecimiento Debe mostrar la gráfica de
             y retención              crecimiento de usuarios (nuevos vs.
                                      activos) de los últimos 6 meses, con
                                      leyenda de colores.

  RF-140     \(33\) KPIs, crecimiento Debe mostrar la curva de retención
             y retención              (Día 1, 3, 7, 14, 30) y un resumen
                                      destacado de Día 1/7/30 en 3
                                      tarjetas.

  RF-141     \(33\) KPIs, crecimiento El AdminBottomNav debe permanecer
             y retención              visible y resaltar \"Analytics\"
                                      como pestaña activa.

  RF-142     \(34\) Categorías,       Debe mostrar las partidas jugadas
             sesión y precisión       por cada categoría del catálogo de
                                      minijuegos (Players, Clubs,
                                      Stadiums, Logic, History,
                                      Transfers, Teams, Rules) en barra
                                      horizontal. La maqueta muestra 6
                                      con datos de ejemplo.

  RF-143     \(34\) Categorías,       Debe mostrar la distribución de
             sesión y precisión       duración de sesión por rangos (\<2m,
                                      2-5m, 5-10m, 10-20m, \>20m) con el
                                      rango más común destacado.

  RF-144     \(34\) Categorías,       Debe mostrar un radar de precisión
             sesión y precisión       promedio por categoría de
                                      minijuego (las mismas de RF-142),
                                      calculado sobre toda la plataforma.

  RF-145     \(34\) Categorías,       Las 3 gráficas son informativas; no
             sesión y precisión       deben tener elementos que naveguen a
                                      otra pantalla.
  ------------------------------------------------------------------------

AdminReportsScreen

  ------------------------------------------------------------------------
  **ID**     **Historia relacionada** **Requisito**
  ---------- ------------------------ ------------------------------------
  RF-146     \(35\) Métricas clave y  Debe mostrar el período del reporte
             resumen semanal          (ej. \"Reportes Agosto 2026\") con
                                      opción de \"Cambiar mes\".

  RF-147     \(35\) Métricas clave y  Debe mostrar 4 métricas clave con
             resumen semanal          ícono, valor y subtítulo: Total
                                      partidas, Duración media, Preguntas
                                      respondidas, XP diario promedio.

  RF-148     \(35\) Métricas clave y  Debe mostrar una tabla con las
             resumen semanal          últimas 4 semanas (usuarios,
                                      partidas, XP total), resaltando la
                                      semana más reciente.

  RF-149     \(35\) Métricas clave y  El botón \"Cambiar mes\" debe
             resumen semanal          permitir seleccionar un período
                                      distinto sin salir de
                                      AdminReportsScreen.

  RF-150     \(36\) Top jugadores,    Debe mostrar el top 5 de jugadores
             categorías y exportar    con medalla (1°/2°/3° o número),
             CSV                      país, nombre, precisión y XP, con
                                      barra de progreso relativa al líder.

  RF-151     \(36\) Top jugadores,    Debe mostrar el rendimiento por
             categorías y exportar    categoría en tabla (partidas,
             CSV                      precisión, tendencia arriba/abajo).

  RF-152     \(36\) Top jugadores,    Debe mostrar el pico de actividad
             categorías y exportar    por hora del día (24 barras) y el
             CSV                      botón \"Exportar Reporte Completo
                                      (CSV)\" al final de la pantalla.

  RF-153     \(36\) Top jugadores,    El botón CSV del header y el de
             categorías y exportar    \"Exportar Reporte Completo\" deben
             CSV                      generar/descargar el archivo sin
                                      salir de AdminReportsScreen.
  ------------------------------------------------------------------------

5\. Requisitos No Funcionales

Los requisitos no funcionales describen las cualidades y restricciones
bajo las cuales el sistema debe operar: usabilidad, rendimiento,
seguridad, compatibilidad, disponibilidad, mantenibilidad y
accesibilidad. Esta sección combina (a) los requisitos de interfaz
visual definidos explícitamente para cada pantalla en el tablero, y (b)
requisitos no funcionales generales derivados del análisis integral del
sistema.

5.1 Requisitos de interfaz y usabilidad visual por pantalla

Los siguientes requisitos corresponden a los criterios de "Requisitos
visuales" definidos en cada historia de usuario, que garantizan la
consistencia del sistema de diseño (colores, tipografía, iconografía,
estados de interacción) de la aplicación. Código: RNF-UI-XXX.

SplashScreen

  --------------------------------------------------------------------------
  **ID**       **Historia relacionada** **Requisito**
  ------------ ------------------------ ------------------------------------
  RNF-UI-001   \(4\) Pantalla de carga  El fondo completo debe ser
               animada                  bg-primary, con un patrón diagonal
                                        repetido (45°, franjas de 35px) al
                                        5% de opacidad en blanco.

  RNF-UI-002   \(4\) Pantalla de carga  El círculo del logo debe tener
               animada                  sombra pronunciada (shadow-2xl) y el
                                        ícono de trofeo en color primary
                                        sobre fondo accent.

  RNF-UI-003   \(4\) Pantalla de carga  El título debe ir en blanco, bold,
               animada                  tamaño 4xl con tracking ajustado; el
                                        subtítulo en blanco al 80% de
                                        opacidad.

  RNF-UI-004   \(5\) Indicador de carga Los 3 puntos deben estar en color
               y redirección automática accent, distribuidos horizontalmente
                                        con espaciado (gap-2) sobre el texto
                                        \"Loading\...\".

  RNF-UI-005   \(5\) Indicador de carga El texto \"Loading\...\" debe ir en
               y redirección automática blanco al 60% de opacidad, tamaño
                                        pequeño (text-sm).

  RNF-UI-006   \(5\) Indicador de carga El bloque completo del indicador
               y redirección automática debe posicionarse en la parte
                                        inferior de la pantalla (a 16
                                        unidades del borde inferior).
  --------------------------------------------------------------------------

WelcomeScreen

  --------------------------------------------------------------------------
  **ID**       **Historia relacionada** **Requisito**
  ------------ ------------------------ ------------------------------------
  RNF-UI-007   \(1\) Pantalla de        El fondo debe incluir un patrón
               bienvenida con logo y    sutil de campo de fútbol (líneas
               propuesta                repetidas cada 50px) con 3% de
                                        opacidad.

  RNF-UI-008   \(1\) Pantalla de        El ícono de trofeo debe ir en color
               bienvenida con logo y    accent dentro del círculo primary,
               propuesta                centrado.

  RNF-UI-009   \(1\) Pantalla de        El pie de página debe mostrar el
               bienvenida con logo y    texto \"Learn football through fun
               propuesta                challenges\" centrado, en tono
                                        muted.

  RNF-UI-010   \(2\) Botones Sign In /  \"Sign In\" debe verse como botón
               Create Account           relleno (bg-primary, texto blanco,
                                        esquinas redondeadas xl, sombra
                                        media).

  RNF-UI-011   \(2\) Botones Sign In /  \"Create Account\" debe verse como
               Create Account           botón secundario (fondo blanco,
                                        borde primary de 2px, texto
                                        primary).

  RNF-UI-012   \(2\) Botones Sign In /  El botón \"Sign In\" debe cambiar a
               Create Account           color secondary en estado hover.

  RNF-UI-013   \(3\) Continuar con      El divisor debe mostrar una línea a
               Google                   cada lado con la palabra \"or\"
                                        centrada en tono muted.

  RNF-UI-014   \(3\) Continuar con      El botón debe llevar el ícono de
               Google                   Google a color (FcGoogle) junto al
                                        texto \"Continue with Google\".

  RNF-UI-015   \(3\) Continuar con      El botón debe tener fondo blanco,
               Google                   borde gris claro y sombra sutil,
                                        distinto de los botones
                                        primary/secondary.
  --------------------------------------------------------------------------

SignInScreen

  --------------------------------------------------------------------------
  **ID**       **Historia relacionada** **Requisito**
  ------------ ------------------------ ------------------------------------
  RNF-UI-016   \(6\) Iniciar sesión     El header debe usar bg-background
               como Jugador             con el título \"Sign In\" centrado y
                                        texto en foreground.

  RNF-UI-017   \(6\) Iniciar sesión     La opción \"Player\" activa debe
               como Jugador             tener fondo blanco, sombra y el
                                        ícono User, dentro del toggle
                                        bg-muted.

  RNF-UI-018   \(6\) Iniciar sesión     El botón \"Sign In\" debe ser
               como Jugador             bg-primary con texto blanco, y
                                        cambiar a bg-secondary en hover.

  RNF-UI-019   \(7\) Iniciar sesión     El header debe cambiar a
               como Administrador       bg-secondary, con título \"Admin
                                        Portal\" en blanco y el ícono
                                        ShieldCheck en color accent a la
                                        derecha.

  RNF-UI-020   \(7\) Iniciar sesión     Debe mostrarse el texto de
               como Administrador       advertencia \"Admin credentials
                                        required. Access is monitored.\"
                                        centrado, debajo del toggle.

  RNF-UI-021   \(7\) Iniciar sesión     Los inputs y el botón de envío deben
               como Administrador       usar tonos secondary (borde, anillo
                                        de foco y fondo) en lugar de
                                        primary.

  RNF-UI-022   \(8\) Recuperar          El enlace debe estar alineado a la
               contraseña olvidada      derecha, justo debajo del campo
                                        Password.

  RNF-UI-023   \(8\) Recuperar          El texto debe ir en color primary,
               contraseña olvidada      tamaño pequeño (text-sm) y peso
                                        medio (font-medium).

  RNF-UI-024   \(8\) Recuperar          Debe cambiar a color secondary en
               contraseña olvidada      estado hover, igual que otros
                                        enlaces del formulario.
  --------------------------------------------------------------------------

RegisterScreen

  --------------------------------------------------------------------------
  **ID**       **Historia relacionada** **Requisito**
  ------------ ------------------------ ------------------------------------
  RNF-UI-025   \(9\) Crear cuenta con   El header debe mostrar el botón
               usuario, correo y        \"atrás\" (ArrowLeft) y el título
               contraseña               \"Create Account\" centrado.

  RNF-UI-026   \(9\) Crear cuenta con   Los inputs deben tener fondo
               usuario, correo y        input-background, borde, esquinas
               contraseña               redondeadas xl y anillo de foco
                                        primary/50.

  RNF-UI-027   \(9\) Crear cuenta con   El botón \"Create Account\" debe ser
               usuario, correo y        bg-primary, texto blanco, ancho
               contraseña               completo, con margen superior extra
                                        (mt-6) para separarlo del último
                                        campo.

  RNF-UI-028   \(10\) Validación de     \"Confirm Password\" debe tener
               confirmación de          exactamente el mismo estilo visual
               contraseña               que el campo \"Password\" (mismo
                                        tamaño, borde y espaciado).

  RNF-UI-029   \(10\) Validación de     La alerta de error debe interrumpir
               confirmación de          el flujo de forma clara y visible
               contraseña               para el usuario (alerta nativa del
                                        navegador).

  RNF-UI-030   \(11\) Registro con      El botón debe llevar el ícono
               Google                   FcGoogle a color junto al texto
                                        \"Continue with Google\".

  RNF-UI-031   \(11\) Registro con      Debe tener fondo blanco, borde gris
               Google                   y sombra sutil, con el mismo estilo
                                        usado en WelcomeScreen y
                                        SignInScreen.
  --------------------------------------------------------------------------

MainHomeScreen

  --------------------------------------------------------------------------
  **ID**       **Historia relacionada** **Requisito**
  ------------ ------------------------ ------------------------------------
  RNF-UI-032   \(12\) Header con nivel  El header debe tener fondo
               y racha                  bg-primary con sombra media
                                        (shadow-md).

  RNF-UI-033   \(12\) Header con nivel  El avatar debe ser un círculo
               y racha                  bg-accent con las iniciales \"FM\"
                                        en color primary, tamaño 12x12.

  RNF-UI-034   \(12\) Header con nivel  Los badges de nivel y racha deben
               y racha                  tener fondo semitransparente
                                        (white/10) en píldora redondeada,
                                        con texto blanco.

  RNF-UI-035   \(13\) Tarjeta de reto   La tarjeta debe tener un fondo
               diario (Daily Challenge) degradado de primary a secondary,
                                        esquinas redondeadas 2xl y sombra
                                        grande.

  RNF-UI-036   \(13\) Tarjeta de reto   El badge \"+50 XP\" debe ser
               diario (Daily Challenge) bg-accent con texto primary bold, en
                                        píldora redondeada.

  RNF-UI-037   \(13\) Tarjeta de reto   El botón \"Play Now\" debe ser
               diario (Daily Challenge) bg-accent, texto primary bold, ancho
                                        completo, con sombra media.

  RNF-UI-038   \(14\) Vista previa de   Cada tarjeta de minijuego debe tener
               minijuegos               ancho fijo (w-32), borde, esquinas
                                        redondeadas xl y sombra que aumenta
                                        en hover.

  RNF-UI-039   \(14\) Vista previa de   El scroll horizontal debe ocultar la
               minijuegos               barra de desplazamiento
                                        (scrollbar-hide).

  RNF-UI-040   \(15\) Vista previa de   Cada artículo debe mostrar una
               noticias y \"My Stats\"  imagen de 128px de alto y el título
                                        truncado a 2 líneas (line-clamp-2).

  RNF-UI-041   \(15\) Vista previa de   \"My Stats\" debe mostrarse en 3
               noticias y \"My Stats\"  columnas con íconos Target
                                        (Accuracy), Award (Badges) y
                                        TrendingUp (Total XP).
  --------------------------------------------------------------------------

NewsScreen

  --------------------------------------------------------------------------
  **ID**       **Historia relacionada** **Requisito**
  ------------ ------------------------ ------------------------------------
  RNF-UI-042   \(16\) Feed de noticias  El header debe tener fondo
               de fútbol                bg-primary con el título \"Football
                                        News\" y subtítulo \"Stay updated
                                        with the latest\".

  RNF-UI-043   \(16\) Feed de noticias  Cada tarjeta de noticia debe tener
               de fútbol                imagen de 160px de alto, borde y
                                        sombra que aumenta en hover.

  RNF-UI-044   \(16\) Feed de noticias  La categoría debe mostrarse como
               de fútbol                badge (fondo primary/10, texto
                                        primary); el tiempo transcurrido con
                                        ícono Clock en tono muted.

  RNF-UI-045   \(17\) Filtro de         La categoría activa debe verse con
               categorías de noticias   fondo bg-primary y texto blanco; las
                                        inactivas con fondo bg-muted y texto
                                        muted-foreground.

  RNF-UI-046   \(17\) Filtro de         Los tabs deben permitir scroll
               categorías de noticias   horizontal si no caben en el ancho
                                        de pantalla, en píldoras
                                        redondeadas.

  RNF-UI-047   \(18\) Abrir noticia en  El ícono debe ir en color primary,
               fuente externa           cambiando a secondary en hover,
                                        alineado a la derecha junto a la
                                        fuente.
  --------------------------------------------------------------------------

MinigamesScreen

  --------------------------------------------------------------------------
  **ID**       **Historia relacionada** **Requisito**
  ------------ ------------------------ ------------------------------------
  RNF-UI-048   \(19\) Catálogo de       El header debe tener fondo
               minijuegos               bg-primary con el título
                                        \"Mini-games\" y subtítulo \"Test
                                        your football knowledge\".

  RNF-UI-049   \(19\) Catálogo de       Cada tarjeta debe mostrar el ícono
               minijuegos               emoji del juego en tamaño grande
                                        (text-4xl), con borde y sombra que
                                        aumenta en hover.

  RNF-UI-050   \(19\) Catálogo de       El badge de dificultad debe usar
               minijuegos               colores: Easy=verde, Medium=naranja,
                                        Hard=rojo, Expert=morado, cada uno
                                        con borde y fondo claro.

  RNF-UI-051   \(20\) Jugar un          Las tarjetas deben tener una
               minijuego desde el       animación de reducción de escala
               catálogo                 (active:scale-95) al presionarlas,
                                        como feedback táctil.

  RNF-UI-052   \(20\) Jugar un          El cursor debe cambiar a pointer al
               minijuego desde el       pasar sobre una tarjeta jugable.
               catálogo                 
  --------------------------------------------------------------------------

ResultsScreen

  --------------------------------------------------------------------------
  **ID**       **Historia relacionada** **Requisito**
  ------------ ------------------------ ------------------------------------
  RNF-UI-053   \(21\) Puntaje final y   La tarjeta de puntaje debe tener
               precisión                fondo degradado de primary a
                                        secondary, con el ícono Trophy en
                                        círculo accent.

  RNF-UI-054   \(21\) Puntaje final y   El puntaje debe mostrarse en texto
               precisión                blanco, tamaño 5xl, bold, centrado.

  RNF-UI-055   \(21\) Puntaje final y   Los conteos de correctas/incorrectas
               precisión                deben usar íconos CheckCircle2
                                        (verde) y XCircle (rojo) sobre
                                        fondos suaves.

  RNF-UI-056   \(22\) Cuadrícula de     Los cuadros deben ser cuadrados
               aciertos/errores         (aspect-square), con el número
                                        centrado en blanco bold.

  RNF-UI-057   \(22\) Cuadrícula de     El bloque de dato curioso debe tener
               aciertos/errores         fondo accent/10, borde accent/20 e
                                        ícono Lightbulb, con el título \"Did
                                        you know?\".

  RNF-UI-058   \(23\) Compartir         \"Share Result\" debe ser bg-primary
               resultado o jugar de     con ícono Share2, texto blanco,
               nuevo                    ancho completo.

  RNF-UI-059   \(23\) Compartir         \"Play Again\" debe ser un botón
               resultado o jugar de     outline (borde primary 2px, fondo
               nuevo                    blanco) con ícono RotateCcw.

  RNF-UI-060   \(23\) Compartir         \"Back to Mini-games\" debe ser
               resultado o jugar de     texto simple sin fondo ni borde, en
               nuevo                    tono muted-foreground.
  --------------------------------------------------------------------------

ProfileScreen

  --------------------------------------------------------------------------
  **ID**       **Historia relacionada** **Requisito**
  ------------ ------------------------ ------------------------------------
  RNF-UI-061   \(24\) Cabecera con      El header debe tener fondo
               avatar y estadísticas    bg-primary, con el avatar de 96px en
                                        círculo bg-accent centrado y con
                                        sombra.

  RNF-UI-062   \(24\) Cabecera con      El nombre debe ir en blanco, 2xl,
               avatar y estadísticas    bold; el email en blanco al 80% de
                                        opacidad, ambos centrados.

  RNF-UI-063   \(24\) Cabecera con      Las 3 estadísticas deben mostrarse
               avatar y estadísticas    en tarjetas iguales (grid de 3
                                        columnas) con íconos Trophy, Flame y
                                        Award respectivamente.

  RNF-UI-064   \(25\) Sección de        Accuracy debe usar ícono Target
               rendimiento              (fondo primary/10), Total XP ícono
               (Performance)            TrendingUp (fondo accent/10), Games
                                        Played ícono Trophy (fondo
                                        chart-4/10).

  RNF-UI-065   \(25\) Sección de        Los valores numéricos deben
               rendimiento              alinearse a la derecha de cada fila,
               (Performance)            en tamaño grande y negrita.

  RNF-UI-066   \(26\) Menú de           Las opciones deben estar en una
               configuración y cerrar   tarjeta con líneas divisorias
               sesión                   (divide-y), cada una con ícono,
                                        etiqueta y ChevronRight a la
                                        derecha.

  RNF-UI-067   \(26\) Menú de           \"Log Out\" debe destacarse en color
               configuración y cerrar   rojo (ícono LogOut, texto y fondo
               sesión                   hover rojo claro), distinto de las
                                        otras opciones.
  --------------------------------------------------------------------------

CreditsScreen

  --------------------------------------------------------------------------
  **ID**       **Historia relacionada** **Requisito**
  ------------ ------------------------ ------------------------------------
  RNF-UI-068   \(27\) Saldo y formas de El bloque de saldo debe tener fondo
               ganar créditos           degradado de accent/20 a accent/5,
                                        con ícono Coins en círculo accent.

  RNF-UI-069   \(27\) Saldo y formas de Cada método de ganar créditos debe
               ganar créditos           mostrarse en una fila con ícono,
                                        nombre del método y badge de
                                        créditos \"+N\" en color accent.

  RNF-UI-070   \(28\) Canjear créditos  Cada artículo debe mostrar su ícono
               por artículos de la      emoji en un cuadro de color de fondo
               tienda                   distintivo, tamaño 64x64, centrado.

  RNF-UI-071   \(28\) Canjear créditos  Los artículos sin saldo suficiente
               por artículos de la      deben verse atenuados (opacity-60),
               tienda                   con el botón deshabilitado en gris.
  --------------------------------------------------------------------------

AdminDashboardScreen

  --------------------------------------------------------------------------
  **ID**       **Historia relacionada** **Requisito**
  ------------ ------------------------ ------------------------------------
  RNF-UI-072   \(29\) Alertas del       El estado \"En línea\" debe
               sistema y KPIs           mostrarse con fondo verde claro,
                                        borde y un punto verde animado.

  RNF-UI-073   \(29\) Alertas del       Las alertas tipo advertencia deben
               sistema y KPIs           ir en ámbar (fondo/borde/texto) y
                                        las informativas en azul, cada una
                                        con ícono AlertCircle.

  RNF-UI-074   \(29\) Alertas del       Los KPIs deben mostrarse en grid
               sistema y KPIs           2×2, cada tarjeta con ícono en
                                        círculo blanco, fondo de color
                                        distintivo, y flecha de tendencia
                                        (verde=positiva, roja=negativa).

  RNF-UI-075   \(30\) Gráfica DAU,      La gráfica DAU debe usar área con
               ranking y accesos        degradado azul (primary), tooltip
               rápidos                  personalizado y puntos resaltados en
                                        hover.

  RNF-UI-076   \(30\) Gráfica DAU,      Cada minijuego del ranking debe
               ranking y accesos        mostrar barra de progreso
               rápidos                  proporcional a sus jugadas respecto
                                        al líder.

  RNF-UI-077   \(30\) Gráfica DAU,      Los accesos rápidos deben mostrarse
               ranking y accesos        en grid de 3 columnas, con ícono,
               rápidos                  etiqueta, y efecto hover con sombra
                                        y borde primary.
  --------------------------------------------------------------------------

AdminUsersScreen

  --------------------------------------------------------------------------
  **ID**       **Historia relacionada** **Requisito**
  ------------ ------------------------ ------------------------------------
  RNF-UI-078   \(31\) Buscador y        El buscador debe estar integrado en
               filtros de usuarios      el header (fondo bg-secondary), con
                                        ícono Search y botón \"×\" para
                                        limpiar cuando hay texto.

  RNF-UI-079   \(31\) Buscador y        La píldora de filtro activa debe
               filtros de usuarios      verse en fondo primary con texto
                                        blanco; las inactivas en fondo
                                        muted.

  RNF-UI-080   \(32\) Panel de acciones El indicador de estado debe ser un
               expandible por usuario   punto verde (activo) o gris
                                        (inactivo) junto al nombre del
                                        usuario.

  RNF-UI-081   \(32\) Panel de acciones Las 3 acciones del panel deben
               expandible por usuario   mostrarse en grid de 3 columnas, con
                                        color distintivo: \"Suspender\"
                                        ámbar, \"Activar\" verde,
                                        \"Eliminar\" rojo, \"Ver perfil\"
                                        azul.

  RNF-UI-082   \(32\) Panel de acciones El panel expandido debe conectarse
               expandible por usuario   visualmente a la tarjeta del usuario
                                        (fondo muted, sin borde superior,
                                        esquinas inferiores redondeadas).
  --------------------------------------------------------------------------

AdminAnalyticsScreen

  --------------------------------------------------------------------------
  **ID**       **Historia relacionada** **Requisito**
  ------------ ------------------------ ------------------------------------
  RNF-UI-083   \(33\) KPIs, crecimiento Los 3 KPIs deben mostrarse en
               y retención              tarjetas iguales centradas, con el
                                        valor grande arriba y la etiqueta
                                        debajo.

  RNF-UI-084   \(33\) KPIs, crecimiento La gráfica de crecimiento debe usar
               y retención              dos áreas superpuestas con degradado
                                        (azul=activos, dorado=nuevos).

  RNF-UI-085   \(33\) KPIs, crecimiento La curva de retención debe usar
               y retención              línea dorada con puntos, y las 3
                                        tarjetas de resumen deben tener
                                        fondo muted.

  RNF-UI-086   \(34\) Categorías,       Cada barra de categoría debe usar un
               sesión y precisión       color propio (definido por
                                        categoría), con esquinas redondeadas
                                        en el extremo.

  RNF-UI-087   \(34\) Categorías,       El rango de sesión con mayor
               sesión y precisión       porcentaje debe resaltarse en color
                                        dorado; el resto en azul
                                        semitransparente.

  RNF-UI-088   \(34\) Categorías,       El radar debe usar relleno dorado
               sesión y precisión       semitransparente con borde definido
                                        y puntos en color primary.
  --------------------------------------------------------------------------

AdminReportsScreen

  --------------------------------------------------------------------------
  **ID**       **Historia relacionada** **Requisito**
  ------------ ------------------------ ------------------------------------
  RNF-UI-089   \(35\) Métricas clave y  Las 4 métricas clave deben mostrarse
               resumen semanal          en grid 2×2, cada una con su emoji
                                        distintivo arriba.

  RNF-UI-090   \(35\) Métricas clave y  La fila de la semana más reciente en
               resumen semanal          la tabla debe resaltarse con fondo
                                        primary/5 y esquinas redondeadas.

  RNF-UI-091   \(36\) Top jugadores,    Los primeros 3 lugares del top deben
               categorías y exportar    tener fondo accent/10 con emoji
               CSV                      grande; del 4° en adelante, número
                                        en fondo muted.

  RNF-UI-092   \(36\) Top jugadores,    La barra de pico de actividad debe
               categorías y exportar    resaltar en dorado el rango horario
               CSV                      de mayor uso (20-22h), el resto en
                                        azul semitransparente.

  RNF-UI-093   \(36\) Top jugadores,    El botón de exportar debe tener
               categorías y exportar    borde punteado, ícono Download y
               CSV                      texto centrado.
  --------------------------------------------------------------------------

5.2 Requisitos no funcionales generales

A continuación se presentan los requisitos no funcionales generales del
sistema, clasificados por categoría según el estándar de calidad de
software ISO/IEC 25010, derivados del análisis funcional del proyecto.

Rendimiento

*El sistema debe responder de forma ágil y fluida, considerando que la
interfaz utiliza numerosas animaciones y transiciones (fade-in,
escalado, degradados) que forman parte central de la experiencia.*

  -----------------------------------------------------------------------
  **ID**         **Requisito**
  -------------- --------------------------------------------------------
  RNF-PERF-01    El tiempo de carga inicial (SplashScreen) no debe
                 superar los 3 segundos en una conexión estándar antes de
                 redirigir a WelcomeScreen o MainHomeScreen.

  RNF-PERF-02    Las animaciones de interfaz (fade-in, escalado,
                 transiciones de botones) deben ejecutarse a una tasa
                 mínima de 60 fps para percibirse como fluidas.

  RNF-PERF-03    El filtrado de noticias por categoría y la búsqueda de
                 usuarios en el panel administrativo deben reflejar
                 resultados en tiempo real, en menos de 1 segundo.

  RNF-PERF-04    La carga de las vistas previas horizontales (minijuegos,
                 noticias) en MainHomeScreen no debe bloquear el
                 renderizado del resto de la pantalla.

  RNF-PERF-05    El sistema debe soportar el registro y consulta de
                 estadísticas (XP, precisión, rachas) sin degradar el
                 tiempo de respuesta percibido por el usuario.

  RNF-PERF-06    El 95% de las peticiones a la API deben responder en
                 menos de 2 segundos bajo condiciones normales de carga.
  -----------------------------------------------------------------------

Seguridad

*Dado que la aplicación maneja autenticación de usuarios
(correo/contraseña y OAuth con Google) y un rol administrativo con
acceso a datos de la plataforma, se definen los siguientes requisitos.*

  -----------------------------------------------------------------------
  **ID**         **Requisito**
  -------------- --------------------------------------------------------
  RNF-SEC-01     Las contraseñas de los usuarios deben almacenarse
                 cifradas (hash con salt) y nunca en texto plano.

  RNF-SEC-02     La autenticación con Google debe implementarse mediante
                 el protocolo OAuth 2.0 estándar, sin exponer
                 credenciales de terceros.

  RNF-SEC-03     El acceso al Admin Portal debe validar el rol del
                 usuario en el backend, no únicamente mediante el toggle
                 de la interfaz, para evitar accesos no autorizados.

  RNF-SEC-04     Las sesiones de administrador deben quedar registradas
                 (log de auditoría), conforme al aviso \"Access is
                 monitored\" mostrado en SignInScreen.

  RNF-SEC-05     El cierre de sesión (\"Log Out\") debe invalidar el
                 token/sesión activa de forma inmediata en el servidor,
                 no solo en el cliente.

  RNF-SEC-06     Los formularios de registro e inicio de sesión deben
                 validar y sanear las entradas para prevenir inyecciones
                 y ataques de tipo XSS.

  RNF-SEC-07     El tratamiento de datos personales y de comportamiento
                 debe cumplir la Ley 1581 de 2012 (Habeas Data):
                 consentimiento explícito en el registro, minimización de
                 los datos de uso recolectados y opción de eliminar la
                 cuenta y sus datos personales.
  -----------------------------------------------------------------------

Usabilidad y experiencia de usuario

*La interfaz debe mantener consistencia visual y de interacción en todas
las pantallas, siguiendo el sistema de diseño documentado en los
requisitos visuales de cada historia de usuario (colores
primary/secondary/accent, tipografía, iconografía y estados
hover/disabled).*

  -----------------------------------------------------------------------
  **ID**         **Requisito**
  -------------- --------------------------------------------------------
  RNF-USA-01     Todos los botones de acción principal deben usar el
                 color primary y los secundarios un estilo outline
                 consistente en toda la aplicación.

  RNF-USA-02     Los estados interactivos (hover, disabled, active) deben
                 tener retroalimentación visual clara e inmediata (cambio
                 de color, opacidad o escala).

  RNF-USA-03     Los mensajes de error (ej. \"Passwords don\'t match!\")
                 deben ser claros, visibles y no bloquear permanentemente
                 el flujo del usuario.

  RNF-USA-04     La navegación inferior (BottomNav) debe permanecer
                 visible y accesible en todas las pantallas principales
                 de la aplicación de jugador.

  RNF-USA-05     El sistema debe mantener el punto de scroll del usuario
                 al regresar de una vista externa o al cambiar de pestaña
                 dentro de una misma pantalla.
  -----------------------------------------------------------------------

Compatibilidad y responsividad

*La aplicación está construida con una maquetación basada en utilidades
(Tailwind) y componentes adaptables, por lo que debe garantizar una
experiencia consistente en distintos dispositivos.*

  -----------------------------------------------------------------------
  **ID**         **Requisito**
  -------------- --------------------------------------------------------
  RNF-COMP-01    La interfaz debe ser responsiva y adaptarse
                 correctamente a resoluciones móviles, tablet y
                 escritorio.

  RNF-COMP-02    Las cuadrículas de contenido (minijuegos, tienda de
                 créditos, resultados) deben reorganizarse de forma
                 legible en pantallas pequeñas.

  RNF-COMP-03    El sistema debe funcionar correctamente en los
                 navegadores modernos más utilizados (Chrome, Safari,
                 Edge, Firefox) en sus últimas dos versiones estables.

  RNF-COMP-04    Los flujos de autenticación externa (Google OAuth) y de
                 exportación (CSV) deben operar de forma consistente
                 entre dispositivos móviles y de escritorio.
  -----------------------------------------------------------------------

Disponibilidad y confiabilidad

*Dado que el aplicativo depende de sesiones activas, integración con una
API deportiva y procesos administrativos, se establecen los siguientes
requisitos de disponibilidad.*

  -----------------------------------------------------------------------
  **ID**         **Requisito**
  -------------- --------------------------------------------------------
  RNF-DISP-01    El sistema debe estar disponible al menos el 99% del
                 tiempo mensual, excluyendo ventanas de mantenimiento
                 programado.

  RNF-DISP-02    Ante una falla en la autenticación con Google, el
                 usuario debe poder continuar con el flujo de
                 correo/contraseña sin que la aplicación quede bloqueada.

  RNF-DISP-03    La pérdida de conexión durante un minijuego no debe
                 provocar la pérdida del progreso ya registrado antes de
                 la desconexión.

  RNF-DISP-04    Los procesos de exportación de reportes (CSV) deben
                 completarse o notificar un error claro al administrador,
                 sin dejar el proceso en estado indefinido.
  -----------------------------------------------------------------------

Mantenibilidad y escalabilidad

*El sistema debe permitir incorporar nuevas pantallas, minijuegos y
funcionalidades sin comprometer la estabilidad del código existente.*

  -----------------------------------------------------------------------
  **ID**         **Requisito**
  -------------- --------------------------------------------------------
  RNF-MANT-01    La arquitectura debe permitir agregar nuevos minijuegos
                 al catálogo (MinigamesScreen) sin modificar la lógica de
                 las pantallas existentes.

  RNF-MANT-02    Los componentes de interfaz (botones, tarjetas, badges)
                 deben estar desacoplados y ser reutilizables entre
                 pantallas, dado que comparten el mismo sistema de
                 diseño.

  RNF-MANT-03    El código debe estructurarse de forma modular por
                 pantalla/funcionalidad, facilitando el mantenimiento
                 independiente de cada módulo (Home, Noticias,
                 Minijuegos, Perfil, Créditos, Administración).

  RNF-MANT-04    El sistema debe permitir escalar el número de usuarios
                 concurrentes sin degradar el rendimiento de los módulos
                 de estadísticas y administración.
  -----------------------------------------------------------------------

Accesibilidad

*Se busca que la aplicación pueda ser utilizada por la mayor cantidad de
usuarios posible, considerando buenas prácticas de accesibilidad.*

  -----------------------------------------------------------------------
  **ID**         **Requisito**
  -------------- --------------------------------------------------------
  RNF-ACC-01     Los elementos interactivos (botones, enlaces, íconos)
                 deben ser identificables mediante etiquetas accesibles
                 (aria-label o equivalentes) para lectores de pantalla.

  RNF-ACC-02     El contraste de color entre texto y fondo debe cumplir,
                 como mínimo, el nivel AA de las pautas WCAG 2.1.

  RNF-ACC-03     Los formularios (registro, inicio de sesión) deben ser
                 navegables completamente mediante teclado.
  -----------------------------------------------------------------------

6\. Consideraciones finales

Este documento debe ser revisado y validado por el equipo del proyecto
al inicio de cada sprint, y actualizado conforme evolucionen las
historias de usuario en el tablero de gestión. Se recomienda mantener la
trazabilidad entre cada requisito (RF-XXX / RNF-XXX) y las pruebas
funcionales que se elaboren durante la fase de verificación del sistema,
así como con el diseño de la arquitectura lógica y física planificado en
el backlog del proyecto.

Nota de versión 2.0: esta actualización refleja la reorganización del
panel administrativo (AdminScreen) del tablero de Trello, que pasó de
ser una sola pantalla con pestañas internas a cuatro pantallas
independientes (AdminDashboardScreen, AdminUsersScreen,
AdminAnalyticsScreen, AdminReportsScreen) con navegación propia
(AdminBottomNav), cada una con su conjunto ampliado de historias de
usuario y criterios de aceptación.

Nota de versión 2.1 (23 de septiembre de 2026): revisión de consistencia
con los documentos de Arquitectura, Modelo de Datos, Contrato de API,
Plan de Pruebas, Plan de Seguridad y el documento de Requisitos,
Arquitectura y UML. Se corrige RF-033 (destino AdminDashboardScreen en
lugar de AdminScreen) y RF-007 (destino de una sesión de administrador);
RF-142 y RF-144 pasan a cubrir todas las categorías del catálogo de
minijuegos; se agregan RNF-PERF-06 (tiempo de respuesta de la API) y
RNF-SEC-07 (Ley 1581), provenientes del documento UML; y se deja
explícito que "Partidos y Estadísticas" está fuera de alcance.

Nota de versión 2.2 (24 de septiembre de 2026): actualización con el
sistema implementado. RF-112 define el contenido de Edit Profile (nombre
de usuario y país) y de Account Settings (cambiar la contraseña y
eliminar la cuenta). Para completar los flujos se agregaron pantallas
que no estaban en la maqueta original: GamePlayScreen (jugar la partida
pregunta por pregunta), ForgotPasswordScreen y ResetPasswordScreen
(recuperar la contraseña por correo). El detalle de cada endpoint está
en el Contrato de API.
