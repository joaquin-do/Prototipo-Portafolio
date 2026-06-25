const contactRepository = require('../repositories/contactRepository');
const userRepository = require('../repositories/userRepository');

function validateContactPayload(payload) {
  const userId = Number(payload.userId);
  const contactName = payload.contactName?.trim();
  const contactEmail = payload.contactEmail?.trim().toLowerCase();

  if (!userId || !contactName || !contactEmail) {
    const error = new Error('userId, contactName y contactEmail son obligatorios.');
    error.statusCode = 400;
    throw error;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(contactEmail)) {
    const error = new Error('contactEmail no tiene un formato valido.');
    error.statusCode = 400;
    throw error;
  }

  return { userId, contactName, contactEmail };
}

async function addContact(payload) {
  const contact = validateContactPayload(payload);
  const user = await userRepository.getUserById(contact.userId);

  if (!user) {
    const error = new Error('El usuario indicado no existe.');
    error.statusCode = 404;
    throw error;
  }

  return contactRepository.createContact(contact);
}

async function getContactsByUserId(userId) {
  return contactRepository.getContactsByUserId(Number(userId));
}

async function getContacts() {
  return contactRepository.getContacts();
}

module.exports = {
  addContact,
  getContacts,
  getContactsByUserId,
};
