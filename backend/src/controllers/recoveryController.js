const recoveryService = require('../services/recoveryService');

async function requestRecovery(req, res, next) {
  try {
    const recoveryRequest = await recoveryService.requestRecovery(req.body);
    res.status(201).json(recoveryRequest);
  } catch (error) {
    next(error);
  }
}

async function getRecoveryRequests(req, res, next) {
  try {
    const requests = await recoveryService.getRecoveryRequests();
    res.json(requests);
  } catch (error) {
    next(error);
  }
}

async function approveRecovery(req, res, next) {
  try {
    const request = await recoveryService.approveRecovery(req.body);
    res.json(request);
  } catch (error) {
    next(error);
  }
}

async function rejectRecovery(req, res, next) {
  try {
    const request = await recoveryService.rejectRecovery(req.body);
    res.json(request);
  } catch (error) {
    next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    const result = await recoveryService.resetPassword(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function getDashboardStats(req, res, next) {
  try {
    const stats = await recoveryService.getDashboardStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  approveRecovery,
  getDashboardStats,
  getRecoveryRequests,
  rejectRecovery,
  requestRecovery,
  resetPassword,
};
