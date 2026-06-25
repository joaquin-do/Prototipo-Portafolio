const express = require('express');
const recoveryController = require('../controllers/recoveryController');

const router = express.Router();

router.post('/request', recoveryController.requestRecovery);
router.get('/dashboard', recoveryController.getDashboardStats);
router.get('/', recoveryController.getRecoveryRequests);
router.post('/approve', recoveryController.approveRecovery);
router.post('/reject', recoveryController.rejectRecovery);
router.post('/reset-password', recoveryController.resetPassword);

module.exports = router;
