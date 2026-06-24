const contactService = require('../services/contactService');

async function addContact(req, res, next) {
  try {
    const contact = await contactService.addContact(req.body);
    res.status(201).json(contact);
  } catch (error) {
    next(error);
  }
}

async function getContactsByUserId(req, res, next) {
  try {
    const contacts = await contactService.getContactsByUserId(req.params.userId);
    res.json(contacts);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  addContact,
  getContactsByUserId,
};
