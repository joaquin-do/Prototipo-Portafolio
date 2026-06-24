const { all, get, run } = require('../config/database');

async function createUser({ name, email, password }) {
  const result = await run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [
    name,
    email,
    password,
  ]);

  return getUserById(result.id);
}

async function getUsers() {
  return all('SELECT id, name, email FROM users ORDER BY id DESC');
}

async function getUserByEmail(email) {
  return get('SELECT id, name, email, password FROM users WHERE email = ?', [email]);
}

async function getUserById(id) {
  return get('SELECT id, name, email FROM users WHERE id = ?', [id]);
}

async function updatePassword(userId, password) {
  return run('UPDATE users SET password = ? WHERE id = ?', [password, userId]);
}

module.exports = {
  createUser,
  getUserByEmail,
  getUserById,
  getUsers,
  updatePassword,
};
