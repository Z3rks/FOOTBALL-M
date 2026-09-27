**FOOTBALL MAESTRO**

*Become a Football Maestro*

**PROPUESTA DE MONETIZACIÓN**

Planes Free y Premium, anuncios no intrusivos y pagos

(Diseño para una fase futura — no implementado)

Fecha de elaboración: 24 de septiembre de 2026

Fecha de actualización: 27 de septiembre de 2026

Versión: 1.1

---

## 1. Estado y alcance

Este documento describe cómo se monetizaría Football Maestro si el equipo decide hacerlo. Es una propuesta de diseño: nada de lo aquí descrito está implementado. Cuando se apruebe, sus requisitos, tablas, endpoints y controles se incorporan a los documentos oficiales (Requisitos, Arquitectura, Modelo de Datos, Contrato de API, Plan de Pruebas y Plan de Seguridad).

El modelo se basa en dos planes: Free (gratuito, con anuncios y un límite diario por minijuego) y Premium (de pago, sin anuncios, sin límite y con descuento en la tienda de créditos).

## 2. Planes

| Beneficio | Free | Premium |
| --- | --- | --- |
| Minijuegos disponibles | Los 10 | Los 10 |
| Partidas por minijuego | 1 por minijuego al día | Ilimitadas |
| Reto diario | Sí (1 al día, como hoy) | Sí (1 al día, como hoy) |
| Anuncios | Sí, solo alrededor del contenido; nunca lo interrumpen | No |
| Tienda de créditos | Precio normal | Descuento (propuesto: 20 %) |
| Ganar créditos y XP | Igual en ambos planes | Igual en ambos planes |
| Insignia de perfil | — | Insignia "Premium" |

Principio de diseño: el plan gratuito debe seguir siendo una buena experiencia. Premium da comodidad (jugar más, sin anuncios) y ventajas estéticas o de ahorro, no ventajas competitivas: el puntaje, el XP y los créditos que se ganan jugando son iguales en ambos planes, para que los rankings sigan siendo justos.

## 3. Reglas del plan Free

### 3.1 Una partida por minijuego al día

- Cada jugador Free puede iniciar una partida de cada minijuego por día (10 partidas al día si juega los 10).
- El día cambia a medianoche de APP_TIMEZONE (Bogotá), igual que el reto diario y la racha.
- Cuenta al iniciar la partida, no al terminarla: así no se puede abandonar y volver a empezar para ver otras preguntas.
- El límite se calcula con las partidas ya registradas en GAME_SESSION (usuario, minijuego y fecha); no hace falta una tabla nueva.
- La regla se aplica en el backend: si se alcanzó el límite, POST /games/:id/sessions responde 403 con el momento en que vuelve a estar disponible. El frontend solo lo muestra (candado y cuenta regresiva en la tarjeta del minijuego).
- Los administradores no juegan (ya es así), así que no les aplica.

### 3.2 Anuncios no intrusivos

Los anuncios se muestran alrededor de lo que el jugador está haciendo, nunca encima ni en medio:

| Pantalla | Ubicación propuesta |
| --- | --- |
| Home, Minigames, News, Profile | En escritorio, un banner horizontal (728×90) al final del contenido o una columna lateral (300×250) donde la página deja espacio; en celular, un banner (320×50) al final del contenido. Además, una tarjeta "Patrocinado" entre secciones. Nunca dentro de la barra superior. |
| GamePlay (partida) | Solo un banner delgado debajo de la zona de juego, separado de los botones de respuesta. Nunca entre la pregunta y las opciones. |
| Results | Una tarjeta "Patrocinado" debajo del resultado y del dato curioso. |
| Acceso y Admin | Sin anuncios (Splash, Welcome, Sign In, Register, recuperar contraseña y panel administrativo). |

Formatos prohibidos: ventanas emergentes, anuncios a pantalla completa (interstitial), videos con sonido automático y anuncios que muevan los botones al cargar. Esto además cumple las políticas de las redes de anuncios, que prohíben ubicar anuncios donde provoquen clics accidentales.

```
┌────────────────────────────────────────────┐
│  Encabezado del juego (progreso y salir)   │
├────────────────────────────────────────────┤
│                                            │
│          Pregunta y opciones               │   ← zona sin anuncios
│                                            │
├────────────────────────────────────────────┤
│   [ banner 728×90 · 320×50 en celular ]    │   ← solo plan Free
└────────────────────────────────────────────┘
```

## 4. Reglas del plan Premium

- Partidas ilimitadas de cada minijuego (el reto diario sigue siendo uno al día, porque da recompensa).
- Sin anuncios en ninguna pantalla.
- Descuento en la tienda de créditos (propuesto: 20 %). El precio con descuento lo calcula el backend al comprar; el costo guardado en STORE_ITEM no cambia y el movimiento en CREDIT_TRANSACTION registra lo que realmente se descontó.
- Periodos propuestos: mensual y anual (el anual con descuento). Al cancelar, Premium sigue activo hasta el final del periodo pagado.
- Si un pago de renovación falla, se da un periodo de gracia (propuesto: 3 días) antes de volver a Free.

## 5. Arquitectura propuesta

### 5.1 Módulo nuevo: Billing (Suscripciones)

Siguiendo el monolito modular (Arquitectura §3), la monetización sería un séptimo módulo con sus propias tablas, dueño de los planes y los pagos. Los demás módulos no leen sus tablas: consultan el plan de un usuario a través de una interfaz pública pequeña.

| Pieza | Responsabilidad |
| --- | --- |
| PlanReader (interfaz pública) | getPlan(userId) → free \| premium. La usan Games (límite diario), Credits (descuento), Users (insignia y perfil) y Admin (métricas). |
| SubscriptionsService | Crear el checkout, cancelar, calcular el plan vigente (incluido el periodo de gracia). |
| PaymentProvider (Adapter) | Interfaz para la pasarela. Implementación MercadoPagoProvider y una FakePaymentProvider para desarrollo y pruebas; cambiar de pasarela solo afecta esta clase. |
| Webhook | Endpoint público que recibe los avisos de la pasarela (pago aprobado, renovación, cancelación, fallo) y actualiza la suscripción. |
| Eventos de dominio | SubscriptionActivatedEvent y SubscriptionEndedEvent: Users otorga o retira la insignia Premium; Admin los registra en sus métricas. |

### 5.2 Dependencias sin ciclos

Billing no depende de ningún otro módulo de dominio: guarda el user_id y el correo del pagador lo recibe del frontend en el checkout (la pasarela lo valida). Así las dependencias quedan Games → Billing, Credits → Billing, Users → Billing y Admin → Billing, sin ciclos, y la prueba de arquitectura (src/architecture.spec.ts) las puede verificar agregando PlanReader a la lista de interfaces públicas.

### 5.3 Anuncios en el frontend

Un componente AdSlot con posiciones fijas (banner al final del contenido, columna lateral en escritorio y tarjeta entre secciones); el tamaño del banner cambia con el ancho de la ventana. Solo se dibuja si el plan del usuario es Free. Para la web, la red propuesta es Google AdSense; en desarrollo el componente muestra un recuadro de ejemplo para no cargar anuncios reales. El plan llega en GET /users/me, pero la decisión de mostrar u ocultar anuncios no es un control de seguridad: lo que se protege en el backend son el límite de partidas y el descuento.

## 6. Modelo de datos propuesto

### 6.1 SUBSCRIPTION

| Campo | Tipo | Restricción | Descripción |
| --- | --- | --- | --- |
| id | uuid | PK |  |
| user_id | uuid | FK → USER, único | Una suscripción vigente por usuario. |
| plan | enum | premium | Free no se guarda: es la ausencia de una suscripción vigente. |
| period | enum | monthly \| yearly |  |
| status | enum | active \| past_due \| canceled \| expired | past_due = renovación fallida, dentro del periodo de gracia. |
| current_period_end | timestamptz |  | Hasta cuándo es Premium. |
| cancel_at_period_end | boolean | default false | El usuario canceló; sigue Premium hasta current_period_end. |
| provider | varchar |  | Pasarela (ej. mercadopago). |
| provider_subscription_id | varchar | único | Id de la suscripción en la pasarela. |
| created_at / updated_at | timestamptz |  |  |

### 6.2 PAYMENT

| Campo | Tipo | Restricción | Descripción |
| --- | --- | --- | --- |
| id | uuid | PK |  |
| subscription_id | uuid | FK → SUBSCRIPTION |  |
| amount_cop | int | > 0 | Monto en pesos colombianos. |
| status | enum | approved \| rejected \| refunded |  |
| provider_payment_id | varchar | único | Evita registrar dos veces el mismo pago si la pasarela reenvía el aviso. |
| paid_at | timestamptz |  |  |

No cambian las tablas existentes: el límite diario se calcula con GAME_SESSION y el descuento se refleja en CREDIT_TRANSACTION. Nunca se guardan datos de tarjetas: los maneja la pasarela.

## 7. Endpoints propuestos

| Método | Endpoint | Descripción |
| --- | --- | --- |
| GET | /plans | Planes, beneficios y precios vigentes (público). |
| GET | /subscriptions/me | Plan actual, estado, fecha de renovación o vencimiento. |
| POST | /subscriptions/checkout | Body { period, payerEmail }. Crea la suscripción en la pasarela y devuelve la URL de pago. |
| POST | /subscriptions/me/cancel | Cancela al final del periodo pagado. |
| POST | /webhooks/payments | Avisos de la pasarela (público, con firma verificada). |
| Cambio | POST /games/:id/sessions | Plan Free: 403 "Daily limit reached" con nextAvailableAt si ya jugó ese minijuego hoy. |
| Cambio | GET /games | Cada minijuego incluye playsLeftToday (null para Premium). |
| Cambio | GET /store/items | Cada artículo incluye finalCost (con el descuento Premium aplicado). |
| Cambio | GET /users/me | Incluye plan (free \| premium). |

## 8. Pasarela de pagos

| Pasarela | Suscripciones | Observaciones |
| --- | --- | --- |
| Mercado Pago (recomendada) | Sí | Opera en Colombia, tiene suscripciones (preapproval) y un entorno de pruebas con usuarios y tarjetas de prueba. |
| Wompi (Bancolombia) | Con tokenización | Muy usada en Colombia; la renovación hay que programarla cobrando periódicamente. |
| PayU Latam | Sí | Tradicional en Colombia, integración más compleja. |
| Paddle / Lemon Squeezy | Sí | Venden internacionalmente y gestionan impuestos; verificar si pagan a Colombia. |
| Stripe | — | No disponible para cuentas colombianas. |

Para el proyecto académico se recomienda implementarlo en modo de pruebas (sandbox): el flujo completo funciona con tarjetas de prueba, sin mover dinero real ni requerir trámites. Pasar a producción es cambiar las claves de prueba por las reales.

## 9. Consideraciones legales (Colombia)

- Recibir pagos reales requiere RUT ante la DIAN (persona natural o empresa) y emitir factura electrónica.
- Estatuto del Consumidor (Ley 1480 de 2011): en ventas a distancia aplica el derecho de retracto (5 días hábiles). Se deben publicar términos y condiciones, precio total con impuestos y política de reembolsos, y la cancelación debe ser tan fácil como la suscripción.
- Ley 1581 de 2012: los anuncios personalizados usan cookies y datos de navegación; hay que pedir consentimiento y ofrecer anuncios no personalizados a quien no lo dé. Actualizar la política de tratamiento de datos.
- Menores de edad: si la app los admite, usar solo anuncios no personalizados y adecuados para su edad, y exigir que un adulto haga el pago.

## 10. Seguridad

- El plan de un usuario se decide siempre en el backend (PlanReader); nunca se confía en lo que envíe el frontend. El límite diario y el descuento se validan en el servidor.
- El webhook verifica la firma de la pasarela y es idempotente (provider_payment_id único): un aviso repetido no activa ni cobra dos veces.
- Los precios y el porcentaje de descuento están fijos en el backend; el cliente no puede enviarlos.
- Toda activación, cancelación o reembolso queda registrado; los cambios manuales de plan desde el panel admin se auditan en ADMIN_AUDIT_LOG.
- Nunca se guardan números de tarjeta: el pago ocurre en la página de la pasarela.

## 11. Casos de prueba propuestos

| ID | Caso | Resultado esperado |
| --- | --- | --- |
| TC-M01 | Jugador Free inicia una segunda partida del mismo minijuego el mismo día. | 403 "Daily limit reached" con nextAvailableAt; la tarjeta muestra el candado. |
| TC-M02 | Jugador Free inicia un minijuego distinto el mismo día. | Se permite (el límite es por minijuego). |
| TC-M03 | Jugador Free abandona una partida e intenta volver a empezarla. | 403: la partida cuenta al iniciarse. |
| TC-M04 | Jugador Premium juega 3 veces el mismo minijuego. | Se permiten las 3 partidas. |
| TC-M05 | Jugador Premium compra un artículo de 500 créditos. | Se descuentan 400 (20 %); CREDIT_TRANSACTION registra -400. |
| TC-M06 | La pasarela reenvía el mismo aviso de pago dos veces. | Se registra un solo pago y una sola activación. |
| TC-M07 | Webhook con firma inválida. | 401; no cambia ninguna suscripción. |
| TC-M08 | Premium cancela. | Sigue Premium hasta current_period_end y luego pasa a Free. |
| TC-M09 | Falla el pago de renovación. | Estado past_due durante el periodo de gracia; luego Free. |
| TC-M10 | Jugador Free en GamePlay. | Solo el banner inferior; ningún anuncio entre la pregunta y las opciones. |
| TC-M11 | Jugador Premium navega por todas las pantallas. | No aparece ningún anuncio. |

## 12. Plan de implementación por fases

| Fase | Contenido |
| --- | --- |
| 1 | Módulo Billing con PlanReader y límite diario por minijuego; Premium se asigna manualmente desde el panel admin (sin pagos). Permite probar las reglas. |
| 2 | Anuncios no intrusivos (AdSlot) con un recuadro de ejemplo en desarrollo. |
| 3 | Pagos en modo de pruebas con Mercado Pago: checkout, webhook, cancelación y periodo de gracia. Pantalla de planes en el frontend. |
| 4 | Producción: RUT y facturación electrónica, términos y condiciones, política de reembolsos, cuenta real de AdSense y claves reales de la pasarela. |

## 13. Decisiones pendientes

- Precios del plan Premium (mensual y anual) en pesos colombianos.
- Porcentaje de descuento en la tienda (propuesto: 20 %).
- ¿El reto diario consume la partida del día de ese minijuego para usuarios Free? (propuesto: no; el reto diario es aparte).
- ¿Habrá prueba gratuita de Premium (ej. 7 días)?
- Red de anuncios definitiva (propuesta: Google AdSense) y si se mostrarán anuncios personalizados.
- Edad mínima para usar la app y para pagar.

## 14. Historial de versiones

| Versión | Fecha | Cambios |
| --- | --- | --- |
| 1.0 | 24 de septiembre de 2026 | Propuesta inicial: planes Free (anuncios alrededor del contenido y una partida por minijuego al día) y Premium (partidas ilimitadas, sin anuncios y descuento en la tienda); arquitectura, datos, endpoints, pasarela, aspectos legales, seguridad, pruebas y fases. |
| 1.1 | 27 de septiembre de 2026 | La app es web: los anuncios se ubican según el ancho de la ventana (banner 728×90 o columna lateral en escritorio, 320×50 en celular); ya no hay barra de navegación inferior. |
