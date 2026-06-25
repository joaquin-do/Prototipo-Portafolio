const { after, before, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');

const ADMIN_ORIGIN = 'https://admin-proto.vercel.app';
const CLIENT_ORIGIN = 'https://client-proto.vercel.app';
const PREVIEW_ORIGIN = 'https://preview-branch.vercel.app';

let server;
let baseUrl;
let dbPath;

function clearBackendModules() {
  for (const key of Object.keys(require.cache)) {
    if (key.includes(`${path.sep}src${path.sep}`)) {
      delete require.cache[key];
    }
  }
}

async function apiRequest(method, route, { body, origin } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (origin) {
    headers.Origin = origin;
  }

  const response = await fetch(`${baseUrl}${route}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data = null;
  if (text) {
    data = JSON.parse(text);
  }

  return { status: response.status, data, headers: response.headers };
}

before(async () => {
  dbPath = path.join(os.tmpdir(), `trust-recovery-test-${Date.now()}.sqlite`);
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_PATH = dbPath;
  process.env.FRONTEND_URL = ADMIN_ORIGIN;
  process.env.CLIENT_URL = CLIENT_ORIGIN;

  clearBackendModules();

  const { initializeDatabase } = require('../src/config/database');
  await initializeDatabase();

  const app = require('../src/app');
  server = http.createServer(app);

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(() => {
  return new Promise((resolve) => {
    server?.close(() => {
      try {
        const { closeDatabase } = require('../src/config/database');
        closeDatabase();
      } catch {
        // ignore if modules already unloaded
      }

      if (dbPath && fs.existsSync(dbPath)) {
        try {
          fs.unlinkSync(dbPath);
        } catch {
          // temp file cleanup is best-effort on Windows
        }
      }
      resolve();
    });
  });
});

describe('API integration flow', () => {
  const runId = Date.now();
  const userEmail = `integration-${runId}@test.com`;
  const contactEmails = [
    `contact1-${runId}@test.com`,
    `contact2-${runId}@test.com`,
    `contact3-${runId}@test.com`,
  ];

  let userId;
  let recoveryRequestId;

  it('POST /api/users/register returns 201 and user JSON', async () => {
    const { status, data } = await apiRequest('POST', '/api/users/register', {
      body: {
        name: 'Integration User',
        email: userEmail,
        password: 'testpass123',
      },
      origin: CLIENT_ORIGIN,
    });

    assert.equal(status, 201);
    assert.equal(typeof data.id, 'number');
    assert.equal(data.email, userEmail);
    assert.equal(data.name, 'Integration User');
    assert.equal('password' in data, false);

    userId = data.id;
  });

  it('POST /api/recovery/request returns 201 after contacts setup', async () => {
    for (let index = 0; index < contactEmails.length; index += 1) {
      const { status } = await apiRequest('POST', '/api/contacts', {
        body: {
          userId,
          contactName: `Contact ${index + 1}`,
          contactEmail: contactEmails[index],
        },
      });
      assert.equal(status, 201);
    }

    const { status, data } = await apiRequest('POST', '/api/recovery/request', {
      body: { email: userEmail },
      origin: CLIENT_ORIGIN,
    });

    assert.equal(status, 201);
    assert.equal(typeof data.id, 'number');
    assert.equal(data.status, 'PENDING');
    assert.equal(typeof data.expiresAt, 'string');
    assert.equal(data.message.includes('Solicitud creada'), true);

    recoveryRequestId = data.id;
  });

  it('POST /api/recovery/approve returns 200 and reaches APPROVED', async () => {
    const first = await apiRequest('POST', '/api/recovery/approve', {
      body: {
        recoveryRequestId,
        contactEmail: contactEmails[0],
      },
      origin: ADMIN_ORIGIN,
    });

    assert.equal(first.status, 200);
    assert.equal(first.data.status, 'PENDING');
    assert.equal(first.data.approvalCount, 1);

    const second = await apiRequest('POST', '/api/recovery/approve', {
      body: {
        recoveryRequestId,
        contactEmail: contactEmails[1],
      },
      origin: ADMIN_ORIGIN,
    });

    assert.equal(second.status, 200);
    assert.equal(second.data.status, 'APPROVED');
    assert.equal(second.data.approvalCount, 2);
  });

  it('POST /api/recovery/reset-password returns 200 and success message', async () => {
    const { status, data } = await apiRequest('POST', '/api/recovery/reset-password', {
      body: {
        recoveryRequestId,
        newPassword: 'newpass456',
      },
      origin: CLIENT_ORIGIN,
    });

    assert.equal(status, 200);
    assert.equal(data.message, 'Contrasena actualizada correctamente.');
    assert.equal(data.userId, userId);
    assert.equal(data.recoveryRequestId, recoveryRequestId);
  });
});

describe('CORS for Vercel frontends', () => {
  async function assertCorsAllowed(origin) {
    const response = await fetch(`${baseUrl}/api/users/register`, {
      method: 'OPTIONS',
      headers: {
        Origin: origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });

    assert.notEqual(response.status, 404);
    assert.equal(response.headers.get('access-control-allow-origin'), origin);
  }

  it('allows admin Vercel origin (FRONTEND_URL)', () => assertCorsAllowed(ADMIN_ORIGIN));
  it('allows client Vercel origin (CLIENT_URL)', () => assertCorsAllowed(CLIENT_ORIGIN));
  it('allows preview Vercel origin (*.vercel.app)', () => assertCorsAllowed(PREVIEW_ORIGIN));
});

describe('Route registration', () => {
  it('GET /api/health is not 404', async () => {
    const { status, data } = await apiRequest('GET', '/api/health');
    assert.equal(status, 200);
    assert.deepEqual(data, { status: 'ok' });
  });

  it('unknown path returns 404 JSON', async () => {
    const { status, data } = await apiRequest('GET', '/api/unknown-route');
    assert.equal(status, 404);
    assert.equal(data.message, 'Ruta no encontrada.');
  });
});
