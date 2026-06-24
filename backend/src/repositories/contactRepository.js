const { all, get, run } = require('../config/database');

async function createContact({ userId, contactName, contactEmail }) {
  const result = await run(
    'INSERT INTO trusted_contacts (user_id, contact_name, contact_email) VALUES (?, ?, ?)',
    [userId, contactName, contactEmail],
  );

  return getContactById(result.id);
}

async function getContactById(id) {
  return get(
    `SELECT id, user_id AS userId, contact_name AS contactName, contact_email AS contactEmail
     FROM trusted_contacts
     WHERE id = ?`,
    [id],
  );
}

async function getContacts() {
  return all(
    `SELECT id, user_id AS userId, contact_name AS contactName, contact_email AS contactEmail
     FROM trusted_contacts
     ORDER BY id DESC`,
  );
}

async function getContactsByUserId(userId) {
  return all(
    `SELECT id, user_id AS userId, contact_name AS contactName, contact_email AS contactEmail
     FROM trusted_contacts
     WHERE user_id = ?
     ORDER BY id DESC`,
    [userId],
  );
}

async function getContactForUser(userId, contactEmail) {
  return get(
    `SELECT id, user_id AS userId, contact_name AS contactName, contact_email AS contactEmail
     FROM trusted_contacts
     WHERE user_id = ? AND contact_email = ?`,
    [userId, contactEmail],
  );
}

module.exports = {
  createContact,
  getContactForUser,
  getContacts,
  getContactsByUserId,
};
