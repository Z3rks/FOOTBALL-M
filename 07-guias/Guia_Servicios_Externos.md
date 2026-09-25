# Guía de servicios externos

Football Maestro usa tres servicios externos, siempre a través de un *adapter* (Arquitectura §6): cambiar de proveedor solo afecta a esa clase. Los tres son opcionales en desarrollo.

| Servicio | Para qué | Plan | Adapter | Sin configurar |
|---|---|---|---|---|
| Google OAuth 2.0 | "Continue with Google" | Gratis | `GoogleAuthLibraryVerifier` | El botón avisa que no está disponible |
| Currents API | Noticias reales | Gratis, 250 peticiones/día | `CurrentsNewsProvider` | 6 noticias de ejemplo |
| Brevo | Correo de recuperación de contraseña | Gratis, 300 correos/día | `BrevoMailSender` | El enlace se escribe en la consola del backend |

**Las claves de Currents y de Brevo son secretas:** solo van en `backend/.env` (que git ignora) y, al desplegar, en las variables de entorno del servidor. El Client ID de Google no es secreto, pero igual vive en los `.env`. El "secreto del cliente" de Google no se usa.

## 1. Google (Continue with Google)

**Estado:** funciona en local, con la app de Google **en modo prueba**.

- Proyecto de Google Cloud: **Football Maestro** (`football-maestro-509620`), cliente OAuth "Football Maestro local" (tipo *Aplicación web*).
- Orígenes autorizados: `http://localhost:5173` y `http://localhost`.
- Variables: `GOOGLE_CLIENT_ID` en `backend/.env` y `VITE_GOOGLE_CLIENT_ID` en `project/.env` (el mismo valor).
- El frontend usa el botón oficial de Google; el backend verifica el `id_token` (firma y audiencia) con `google-auth-library`.

**Modo prueba:** solo entran con Google los correos agregados como **usuarios de prueba** (máximo 100) en *Google Auth Platform → Público*. Los demás ven "Acceso bloqueado" y pueden registrarse con correo y contraseña.

**Pendiente para producción:**
1. Agregar el dominio real a los orígenes autorizados del cliente OAuth.
2. Poner el Client ID en las variables de entorno del servidor y del frontend.
3. Pulsar **Publicar app** en *Público*. Esto no publica la aplicación: solo permite que entre cualquier cuenta de Google. Como se piden solo nombre, correo y foto, Google no exige revisión; hasta verificar la marca puede aparecer un aviso de "app no verificada".

## 2. Currents API (noticias)

**Estado:** funciona, con noticias reales de las 4 categorías.

- Variable: `NEWS_API_KEY` en `backend/.env`. Cada integrante puede sacar su propia clave gratis en currentsapi.services, para no compartir el cupo diario.
- Sincroniza al arrancar y cada 30 minutos (`NEWS_SYNC_MINUTES`): 4 categorías × 48 veces = 192 peticiones al día. La app siempre lee de la base de datos, así que el feed sigue funcionando aunque Currents falle. Las noticias de más de 30 días se borran.
- Búsqueda: una por categoría con el parámetro `keywords` ("transfer news", "Champions League", "World Cup", "Premier League"). **Currents ignora el parámetro `query`**. Como su búsqueda es aproximada, el adapter además descarta noticias de otros deportes (NFL, rugby, críquet, dardos…) y las que no mencionan el tema de la categoría.
- Máximo 20 resultados por consulta; el feed crece con cada sincronización.
- Al activar la clave, las 6 noticias de ejemplo se borran con `DELETE FROM news_articles WHERE external_id LIKE 'sample:%'`.

## 3. Brevo (correo)

**Estado:** funciona; la prueba real llegó y se abrió.

- Variables en `backend/.env`:

  ```
  MAIL_API_KEY=xkeysib-...          # Brevo → ⚙️ → SMTP y API → Claves API
  MAIL_FROM=correo@gmail.com        # verificado en Brevo → ⚙️ → Remitentes
  MAIL_FROM_NAME=Football Maestro
  ```

- Brevo exige **verificar un número de teléfono** en la cuenta antes de permitir crear la clave API.
- Sin dominio propio, los correos salen desde un Gmail verificado como remitente. Al principio pueden llegar a **spam**.
- Si el envío falla, la API responde igual que siempre (para no revelar qué correos están registrados) y el error queda en el log.
- En *Brevo → Transaccional → Registros* se ve si cada correo se entregó, se abrió o rebotó.

**Pendiente para producción:** autenticar un dominio propio en Brevo (SPF/DKIM) para que los correos no caigan en spam, y usar una clave nueva guardada solo en el servidor.

## 4. Antes de desplegar

Resumen de lo que falta en estos servicios (el checklist completo está en el Plan de Seguridad §9):

- [ ] Google: dominio real en los orígenes y app publicada.
- [ ] Brevo: dominio propio autenticado.
- [ ] Claves nuevas de Currents y Brevo solo en el servidor (las de desarrollo se compartieron por chat).
