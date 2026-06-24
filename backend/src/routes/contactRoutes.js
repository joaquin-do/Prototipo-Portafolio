const express = require('express');
const contactController = require('../controllers/contactController');

const router = express.Router();

router.post('/', contactController.addContact);
router.get('/:userId', contactController.getContactsByUserId);

module.exports = router;
