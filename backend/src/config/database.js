const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

function resolveDatabasePath() {
  if (process.env.DATABASE_PATH) {
    return process.env.DATABASE_PATH;
  }

  // En Render el filesystem es efimero; /tmp siempre es escribible en Linux.
  if (process.env.NODE_ENV === 'production') {
    return '/tmp/trust-recovery.sqlite';
  }

  return path.join(__dirname, '../../trust-recovery.sqlite');
}

const dbPath = resolveDatabasePath();
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Singleton: SQLite integrado en Node.js (sin modulos nativos npm).
const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

function run(sql, params = []) {
  try {
    const result = db.prepare(sql).run(...params);
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
    const row = db.prepare(sql).get(...params);
    return Promise.resolve(row);
  } catch (error) {
    return Promise.reject(error);
  }
}

function all(sql, params = []) {
  try {
    const rows = db.prepare(sql).all(...params);
    return Promise.resolve(rows);
  } catch (error) {
    return Promise.reject(error);
  }
}

function createSchema() {
  db.exec(`
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
}

function seedDatabase() {
  const existing = db.prepare('SELECT COUNT(*) AS total FROM users').get();

  if (existing.total > 0) {
    return;
  }

  const insertUser = db.prepare(
    'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
  );
  const insertContact = db.prepare(
    'INSERT INTO trusted_contacts (user_id, contact_name, contact_email) VALUES (?, ?, ?)',
  );
  const insertRequest = db.prepare(
    'INSERT INTO recovery_requests (user_id, status, expires_at, created_at) VALUES (?, ?, ?, ?)',
  );

  const seed = db.transaction(() => {
    insertUser.run('Ana Demo', 'ana@example.com', 'demo123');
    insertUser.run('Luis Pendiente', 'luis@example.com', 'demo123');
    insertUser.run('Sofia Sin Contactos', 'sofia@example.com', 'demo123');
    insertUser.run('Mario Expirado', 'mario@example.com', 'demo123');

    const users = db.prepare('SELECT id, email FROM users').all();
    const userByEmail = Object.fromEntries(users.map((user) => [user.email, user.id]));

    const contacts = [
      [userByEmail['ana@example.com'], 'Carlos Contacto', 'carlos@example.com'],
      [userByEmail['ana@example.com'], 'Diana Contacto', 'diana@example.com'],
      [userByEmail['ana@example.com'], 'Elena Contacto', 'elena@example.com'],
      [userByEmail['luis@example.com'], 'Fernanda Contacto', 'fernanda@example.com'],
      [userByEmail['luis@example.com'], 'Gabriel Contacto', 'gabriel@example.com'],
      [userByEmail['luis@example.com'], 'Helena Contacto', 'helena@example.com'],
      [userByEmail['mario@example.com'], 'Ivan Contacto', 'ivan@example.com'],
      [userByEmail['mario@example.com'], 'Julia Contacto', 'julia@example.com'],
      [userByEmail['mario@example.com'], 'Karla Contacto', 'karla@example.com'],
    ];

    for (const contact of contacts) {
      insertContact.run(...contact);
    }

    const now = new Date();
    const expiredAt = new Date(now.getTime() - 60_000).toISOString();
    const createdAt = new Date(now.getTime() - 11 * 60_000).toISOString();

    insertRequest.run(userByEmail['mario@example.com'], 'EXPIRED', expiredAt, createdAt);
  });

  seed();
}

async function initializeDatabase() {
  console.log(`SQLite database: ${dbPath}`);
  createSchema();
  seedDatabase();
}

module.exports = {
  all,
  db,
  get,
  initializeDatabase,
  run,
};
