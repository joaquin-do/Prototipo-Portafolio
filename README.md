# Sistema de Recuperacion de Cuenta mediante Contactos de Confianza

Prototipo funcional para validar una estrategia de recuperacion de cuenta distribuida usando contactos de confianza.

Este MVP no implementa MFA real, envio de correos, integraciones externas ni autenticacion avanzada. Su objetivo es demostrar la mitigacion de riesgo tecnico: una cuenta solo puede recuperarse cuando al menos 2 contactos de confianza aprueban una solicitud vigente.

## Problema

Los sistemas tradicionales de recuperacion dependen de un unico elemento: correo, MFA, dispositivo o pregunta de seguridad. Si el usuario pierde acceso a ese elemento, puede quedar bloqueado permanentemente fuera de su cuenta.

## Riesgo tecnico identificado

El punto unico de fallo en el mecanismo de recuperacion genera riesgo de perdida total de acceso. Tambien concentra la confianza en un unico canal que puede fallar, ser comprometido o quedar inaccesible.

## Estrategia de mitigacion

La recuperacion se distribuye entre contactos previamente registrados por el usuario. El sistema crea una solicitud temporal y solo cambia su estado a `APPROVED` cuando existen al menos 2 aprobaciones validas de contactos asociados a ese usuario.

Reglas del prototipo:

- 3 contactos de confianza minimos para poder solicitar recuperacion.
- 2 aprobaciones cambian la solicitud a `APPROVED`.
- Menos de 2 aprobaciones mantiene la solicitud en `PENDING`.
- Una solicitud vencida cambia a `EXPIRED`.
- Solo una solicitud `APPROVED` permite restablecer la contrasena.

## Arquitectura utilizada

```text
trust-recovery-prototype/
  frontend/              React + Vite + React Router + Axios
  backend/               Node.js + Express + SQLite
    src/
      config/            Conexion SQLite, esquema y datos semilla
      controllers/       Entrada HTTP y respuestas JSON
      services/          Reglas de negocio
      repositories/      Acceso a datos SQL
      routes/            Definicion de endpoints REST
  README.md
```

## Diagrama ASCII

```text
+-------------------+        HTTP/JSON        +----------------------+
| React + Vite      |  -------------------->  | Express API          |
| Pantallas MVP     |                         | Routes/Controllers   |
+-------------------+                         +----------+-----------+
                                                        |
                                                        v
                                             +----------+-----------+
                                             | Services             |
                                             | Regla 2 aprobaciones |
                                             +----------+-----------+
                                                        |
                                                        v
                                             +----------+-----------+
                                             | Repositories         |
                                             | SQL parametrizado    |
                                             +----------+-----------+
                                                        |
                                                        v
                                             +----------+-----------+
                                             | SQLite               |
                                             | trust-recovery.sqlite|
                                             +----------------------+
```

## Base de datos

Tablas creadas automaticamente al iniciar el backend:

- `users`: `id`, `name`, `email`, `password`
- `trusted_contacts`: `id`, `user_id`, `contact_name`, `contact_email`
- `recovery_requests`: `id`, `user_id`, `status`, `expires_at`, `created_at`
- `approvals`: `id`, `recovery_request_id`, `contact_email`, `decision`, `created_at`

## API REST

La API se expone bajo el prefijo `/api`:

- `POST /api/users/register`
- `GET /api/users`
- `POST /api/contacts`
- `GET /api/contacts/:userId`
- `POST /api/recovery/request`
- `GET /api/recovery`
- `POST /api/recovery/approve`
- `POST /api/recovery/reject`
- `POST /api/recovery/reset-password`
- `GET /api/recovery/dashboard`

## Instalacion

Requisitos:

- Node.js
- npm

Instalar dependencias desde la raiz:

```bash
npm install
```

## Ejecucion

Levantar frontend y backend desde la raiz:

```bash
npm run dev
```

Servicios:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`
- Healthcheck: `http://localhost:4000/api/health`

La base SQLite se crea automaticamente en `backend/trust-recovery.sqlite`.

## Datos semilla

El backend crea datos iniciales si la base esta vacia:

- `ana@example.com`: usuario con 3 contactos para demostrar 2 aprobaciones.
- `luis@example.com`: usuario con 3 contactos para demostrar 1 aprobacion.
- `sofia@example.com`: usuario sin contactos para demostrar error.
- `mario@example.com`: usuario con una solicitud ya expirada.

Contrasena inicial de usuarios semilla: `demo123`.

## Casos de prueba

### Caso 1: 2 aprobaciones

1. Ir a `Solicitar recuperacion`.
2. Ingresar `ana@example.com`.
3. Ir a `Aprobaciones`.
4. Aprobar con 2 contactos distintos.

Resultado esperado: la solicitud cambia a `APPROVED`.

### Caso 2: 1 aprobacion

1. Ir a `Solicitar recuperacion`.
2. Ingresar `luis@example.com`.
3. Ir a `Aprobaciones`.
4. Aprobar con 1 contacto.

Resultado esperado: la solicitud permanece en `PENDING`.

### Caso 3: Sin contactos

1. Ir a `Solicitar recuperacion`.
2. Ingresar `sofia@example.com`.

Resultado esperado: la API responde error porque el usuario no tiene al menos 3 contactos de confianza.

### Caso 4: Solicitud expirada

1. Ir al `Dashboard`.
2. Revisar solicitudes expiradas creadas por los datos semilla.
3. Opcionalmente esperar 10 minutos despues de crear una nueva solicitud y consultar `Aprobaciones`.

Resultado esperado: la solicitud aparece con estado `EXPIRED`.

## Flujo de restablecimiento

1. Crear una solicitud.
2. Aprobarla con 2 contactos.
3. Ir a `Restablecer`.
4. Seleccionar la solicitud aprobada.
5. Ingresar una nueva contrasena.

Resultado esperado: la contrasena del usuario se actualiza en SQLite.

## Alcance academico

Este prototipo guarda contrasenas en texto plano solo para simplificar la demostracion academica. En un producto real se requeriria hashing seguro, autenticacion robusta, MFA, auditoria, rate limiting, proteccion contra abuso, envio real de notificaciones y verificacion de identidad de contactos.

## Despliegue en produccion (Render + Vercel)

### Arquitectura en produccion

```text
Usuario
  |
  v
Vercel (React)  ----VITE_API_URL---->  Render (Express API)
                                              |
                                              v
                                        SQLite (/tmp)
```

### 1. Backend en Render

1. Crear un **Web Service** en [Render](https://render.com).
2. Conectar el repositorio de GitHub.
3. Configurar:
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`
4. Variables de entorno en Render:

| Variable | Valor ejemplo | Descripcion |
|----------|---------------|-------------|
| `NODE_ENV` | `production` | Activa modo produccion |
| `HOST` | `0.0.0.0` | Requerido por Render |
| `FRONTEND_URL` | `https://tu-app.vercel.app` | Origen permitido en CORS |

5. Desplegar y copiar la URL publica, por ejemplo: `https://trust-recovery-api.onrender.com`

Alternativa: usar el archivo `render.yaml` en la raiz del repo para crear el servicio automaticamente.

**Nota sobre SQLite en Render:** la base se guarda en `/tmp/trust-recovery.sqlite`. Es efimera: los datos se reinician en cada redeploy o reinicio del servicio. Para este MVP academico es aceptable.

### 2. Frontend en Vercel

1. Crear proyecto en [Vercel](https://vercel.com) importando el mismo repositorio.
2. Configurar:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Variable de entorno en Vercel:

| Variable | Valor ejemplo |
|----------|---------------|
| `VITE_API_URL` | `https://trust-recovery-api.onrender.com/api` |

Importante: `VITE_API_URL` debe incluir `/api` al final y **no** llevar barra final despues de `api`.

4. Redesplegar el frontend despues de agregar la variable (Vite inyecta env vars en build time).

El archivo `frontend/vercel.json` ya configura rewrites para React Router.

### 3. Conectar frontend y backend

1. Desplegar primero el **backend** en Render.
2. Verificar healthcheck: `GET https://tu-api.onrender.com/api/health`
3. Configurar `VITE_API_URL` en Vercel apuntando a esa URL.
4. Configurar `FRONTEND_URL` en Render con la URL final de Vercel.
5. Redesplegar ambos si cambias variables de entorno.

### Variables de entorno locales

Copiar los archivos de ejemplo:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### Checklist de verificacion

- [ ] `GET /api/health` responde `{ "status": "ok" }` en Render
- [ ] Render muestra logs: `Trust Recovery API running on 0.0.0.0:XXXX`
- [ ] Render muestra logs: `SQLite database: /tmp/trust-recovery.sqlite`
- [ ] Dashboard en Vercel carga metricas sin error de red
- [ ] Consola del navegador no muestra errores CORS
- [ ] Crear solicitud de recuperacion con `ana@example.com` funciona
- [ ] Aprobaciones desde `/approvals` actualizan estado
- [ ] Cambio de contrasena funciona con solicitud `APPROVED`

### Solucion de problemas comunes

| Problema | Causa probable | Solucion |
|----------|----------------|----------|
| Render Exit status 1 | Root Directory incorrecto | Usar `backend` como raiz |
| Render Exit status 1 | Start command incorrecto | Usar `npm start` |
| CORS bloqueado | `FRONTEND_URL` no configurada | Agregar URL exacta de Vercel en Render |
| Frontend no conecta | `VITE_API_URL` ausente | Configurar en Vercel y redesplegar |
| API 404 en Vercel | URL mal formada | Usar dominio de Render, no de Vercel |
| Datos perdidos tras redeploy | SQLite efimero en `/tmp` | Esperado en MVP; volver a sembrar datos |