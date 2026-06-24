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