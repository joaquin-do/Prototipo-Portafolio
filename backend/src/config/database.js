const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, '../../trust-recovery.sqlite');
const db = new sqlite3.Database(dbPath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function handleRun(error) {
      if (error) {
        reject(error);
        return;
      }

      resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(rows);
    });
  });
}

async function createSchema() {
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS trusted_contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      contact_name TEXT NOT NULL,
      contact_email TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS recovery_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS approvals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recovery_request_id INTEGER NOT NULL,
      contact_email TEXT NOT NULL,
      decision TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE (recovery_request_id, contact_email),
      FOREIGN KEY (recovery_request_id) REFERENCES recovery_requests(id) ON DELETE CASCADE
    )
  `);
}

async function seedDatabase() {
  const existing = await get('SELECT COUNT(*) AS total FROM users');

  if (existing.total > 0) {
    return;
  }

  await run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [
    'Ana Demo',
    'ana@example.com',
    'demo123',
  ]);
  await run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [
    'Luis Pendiente',
    'luis@example.com',
    'demo123',
  ]);
  await run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [
    'Sofia Sin Contactos',
    'sofia@example.com',
    'demo123',
  ]);
  await run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [
    'Mario Expirado',
    'mario@example.com',
    'demo123',
  ]);

  const users = await all('SELECT id, email FROM users');
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
    await run(
      'INSERT INTO trusted_contacts (user_id, contact_name, contact_email) VALUES (?, ?, ?)',
      contact,
    );
  }

  const now = new Date();
  const expiredAt = new Date(now.getTime() - 60_000).toISOString();
  const createdAt = new Date(now.getTime() - 11 * 60_000).toISOString();

  await run(
    'INSERT INTO recovery_requests (user_id, status, expires_at, created_at) VALUES (?, ?, ?, ?)',
    [userByEmail['mario@example.com'], 'EXPIRED', expiredAt, createdAt],
  );
}

async function initializeDatabase() {
  await createSchema();
  await seedDatabase();
}

module.exports = {
  all,
  db,
  get,
  initializeDatabase,
  run,
};
