# Football Maestro — Modelo de monetización

Oct 9, 2026

Football Maestro se monetiza con un modelo freemium. Cualquiera juega gratis con anuncios y un límite diario. Quien quiera jugar sin límite y sin anuncios paga una suscripción Premium. El diseño técnico ya está en la Propuesta de Monetización v1.1 del repositorio; este documento resume el modelo de negocio.

## Planes

| Beneficio | Free | Premium |
|---|---|---|
| Minijuegos | Los 10 | Los 10 |
| Partidas | 1 por minijuego al día | Ilimitadas |
| Reto diario | Sí | Sí |
| Anuncios | Sí, alrededor del contenido, nunca dentro de la partida | No |
| Tienda de créditos | Precio normal | 20 % de descuento |
| Insignia Premium | No | Sí |

Premium vende comodidad, no ventaja. El XP, el puntaje y los créditos que se ganan jugando son iguales en ambos planes, así el ranking sigue siendo justo.

## Fuentes de ingreso

- **Suscripción Premium (principal):** pago mensual o anual, con 7 días de prueba gratis.
- **Anuncios en el plan Free:** banners de Google AdSense en Home, Noticias, Perfil y Resultados. Monetizan a la mayoría de usuarios, que no paga.
- **Paquetes de créditos:** venta de créditos con dinero real para comprar cosméticos en la tienda que ya existe (avatares, marcos, fondos).
- **Patrocinios:** una marca patrocina el reto diario ("Reto diario presentado por…") o un torneo temático.

Los créditos nunca se canjean por dinero ni por premios, para que la app no se considere un juego de azar.

## Precios propuestos

| Producto | Precio (COP) |
|---|---|
| Premium mensual | 9.900 |
| Premium anual | 79.900 (33 % de ahorro) |
| Paquete de 1.000 créditos | 4.900 |
| Paquete de 3.000 créditos | 11.900 |

El mensual cuesta cerca de la mitad de Spotify Premium en Colombia (COP 18.500). Los pagos se reciben con Mercado Pago, la pasarela recomendada en la Propuesta porque opera en Colombia y maneja suscripciones.

## Qué hace falta para implementarlo

- Módulo Billing en el backend: plan Free/Premium, límite diario por minijuego y descuento en la tienda.
- Componente de anuncios (AdSlot) en el frontend, visible solo para usuarios Free.
- Integración con Mercado Pago en modo de pruebas (sandbox): el flujo completo funciona con tarjetas de prueba, sin mover dinero real. Para un proyecto universitario basta con esto.
- Pantalla de planes para comparar Free y Premium y suscribirse.
