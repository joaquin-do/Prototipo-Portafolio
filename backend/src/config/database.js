const fs = require('fs');
const os = require('os');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

let db = null;
let dbPath = null;
let seedStatements = null;
const statementCache = new Map();

function resolveDatabasePath() {
  if (process.env.DATABASE_PATH) {
    return process.env.DATABASE_PATH;
  }

  if (process.env.NODE_ENV === 'production') {
    return path.join(os.tmpdir(), 'trust-recovery.sqlite');
  }

  return path.join(process.cwd(), 'trust-recovery.sqlite');
}

function ensureDatabaseDirectory(directory) {
  if (directory === '.' || directory === os.tmpdir()) {
    return;
  }

  try {
    fs.mkdirSync(directory, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

function prepareCached(sql) {
  if (!statementCache.has(sql)) {
    statementCache.set(sql, getDb().prepare(sql));
  }

  return statementCache.get(sql);
}

function getDb() {
  if (!db) {
    throw new Error('Base de datos no inicializada. Ejecuta initializeDatabase() primero.');
  }

  return db;
}

function run(sql, params = []) {
  try {
    const result = prepareCached(sql).run(...params);
    return Promise.resolve({
      id: Number(result.lastInsertRowid),
      changes: result.changes,
    });
  } catch (error) {
    return Promise.reject(error);
  }
}

function get(sql, params = []) {
  try {
    const row = prepareCached(sql).get(...params);
    return Promise.resolve(row);
  } catch (error) {
    return Promise.reject(error);
  }
}

function all(sql, params = []) {
  try {
    const rows = prepareCached(sql).all(...params);
    return Promise.resolve(rows);
  } catch (error) {
    return Promise.reject(error);
  }
}

function connectDatabase() {
  dbPath = resolveDatabasePath();
  ensureDatabaseDirectory(path.dirname(dbPath));

  db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  console.log(`[DB] Conexion abierta: ${dbPath}`);
}

function createSchema() {
  getDb().exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS trusted_contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      contact_name TEXT NOT NULL,
      contact_email TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS recovery_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS approvals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recovery_request_id INTEGER NOT NULL,
      contact_email TEXT NOT NULL,
      decision TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE (recovery_request_id, contact_email),
      FOREIGN KEY (recovery_request_id) REFERENCES recovery_requests(id) ON DELETE CASCADE
    );
  `);

  console.log('[DB] Esquema verificado.');
}

const SEED_USERS = [
  { name: 'Ana Demo', email: 'ana@example.com', password: 'demo123' },
  { name: 'Luis Pendiente', email: 'luis@example.com', password: 'demo123' },
  { name: 'Sofia Sin Contactos', email: 'sofia@example.com', password: 'demo123' },
  { name: 'Mario Expirado', email: 'mario@example.com', password: 'demo123' },
];

const SEED_CONTACTS = [
  { userEmail: 'ana@example.com', contactName: 'Carlos Contacto', contactEmail: 'carlos@example.com' },
  { userEmail: 'ana@example.com', contactName: 'Diana Contacto', contactEmail: 'diana@example.com' },
  { userEmail: 'ana@example.com', contactName: 'Elena Contacto', contactEmail: 'elena@example.com' },
  { userEmail: 'luis@example.com', contactName: 'Fernanda Contacto', contactEmail: 'fernanda@example.com' },
  { userEmail: 'luis@example.com', contactName: 'Gabriel Contacto', contactEmail: 'gabriel@example.com' },
  { userEmail: 'luis@example.com', contactName: 'Helena Contacto', contactEmail: 'helena@example.com' },
  { userEmail: 'mario@example.com', contactName: 'Ivan Contacto', contactEmail: 'ivan@example.com' },
  { userEmail: 'mario@example.com', contactName: 'Julia Contacto', contactEmail: 'julia@example.com' },
  { userEmail: 'mario@example.com', contactName: 'Karla Contacto', contactEmail: 'karla@example.com' },
];

function getSeedStatements() {
  if (!seedStatements) {
    const database = getDb();
    seedStatements = {
      findUserByEmail: database.prepare('SELECT id FROM users WHERE email = ?'),
      insertUser: database.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)'),
      findContact: database.prepare(
        'SELECT id FROM trusted_contacts WHERE user_id = ? AND contact_email = ?',
      ),
      insertContact: database.prepare(
        'INSERT INTO trusted_contacts (user_id, contact_name, contact_email) VALUES (?, ?, ?)',
      ),
      findExpiredRequest: database.prepare(
        `SELECT id FROM recovery_requests
         WHERE user_id = ? AND status = 'EXPIRED'
         LIMIT 1`,
      ),
      insertRequest: database.prepare(
        'INSERT INTO recovery_requests (user_id, status, expires_at, created_at) VALUES (?, ?, ?, ?)',
      ),
    };
  }

  return seedStatements;
}

function getUserIdByEmail(email) {
  const user = getSeedStatements().findUserByEmail.get(email);
  return user ? user.id : null;
}

function ensureSeedUser({ name, email, password }) {
  const { insertUser } = getSeedStatements();
  const existingId = getUserIdByEmail(email);
  if (existingId) {
    return existingId;
  }

  const result = insertUser.run(name, email, password);
  return Number(result.lastInsertRowid);
}

function ensureSeedContact(userId, { contactName, contactEmail }) {
  const { findContact, insertContact } = getSeedStatements();
  const existing = findContact.get(userId, contactEmail);
  if (existing) {
    return;
  }

  insertContact.run(userId, contactName, contactEmail);
}

function ensureExpiredDemoRequest(userId) {
  const { findExpiredRequest, insertRequest } = getSeedStatements();
  const existing = findExpiredRequest.get(userId);
  if (existing) {
    return;
  }

  const now = new Date();
  const expiredAt = new Date(now.getTime() - 60_000).toISOString();
  const createdAt = new Date(now.getTime() - 11 * 60_000).toISOString();

  insertRequest.run(userId, 'EXPIRED', expiredAt, createdAt);
}

function seedDatabase() {
  let usersCreated = 0;
  let contactsCreated = 0;
  let requestsCreated = 0;
  const userIdsByEmail = {};

  try {
  for (const user of SEED_USERS) {
    const before = getUserIdByEmail(user.email);
    userIdsByEmail[user.email] = ensureSeedUser(user);
    if (!before) {
      usersCreated += 1;
    }
  }

  for (const contact of SEED_CONTACTS) {
    const userId = userIdsByEmail[contact.userEmail];
    if (!userId) {
      continue;
    }

    const { findContact } = getSeedStatements();
    const before = findContact.get(userId, contact.contactEmail);
    ensureSeedContact(userId, contact);
    if (!before) {
      contactsCreated += 1;
    }
  }

  const marioId = userIdsByEmail['mario@example.com'];
  if (marioId) {
    const { findExpiredRequest } = getSeedStatements();
    const before = findExpiredRequest.get(marioId);
    ensureExpiredDemoRequest(marioId);
    if (!before) {
      requestsCreated += 1;
    }
  }

  console.log(
    `[SEED] Ejecutado: ${usersCreated} usuarios, ${contactsCreated} contactos, ${requestsCreated} solicitudes nuevas.`,
  );
  } catch (error) {
    console.error('[SEED] Error al poblar datos demo:', error.message);
    throw error;
  }
}

async function initializeDatabase() {
  if (db) {
    console.log('[DB] Ya inicializada, omitiendo reinicio.');
    return;
  }

  assertNodeVersion();
  console.log('[DB] Inicializando base de datos...');
  connectDatabase();
  createSchema();
  seedDatabase();
  console.log('[DB] Inicializada correctamente.');
}

function closeDatabase() {
  if (!db) {
    return;
  }

  db.close();
  db = null;
  dbPath = null;
  seedStatements = null;
  statementCache.clear();
}

function assertNodeVersion() {
  const [major] = process.versions.node.split('.').map(Number);
  if (major < 22) {
    throw new Error(`Node.js 22+ es obligatorio para node:sqlite. Version actual: ${process.versions.node}`);
  }
}

module.exports = {
  all,
  closeDatabase,
  get db() {
    return db;
  },
  get,
  getDbPath: () => dbPath,
  initializeDatabase,
  run,
};
