const { all, get, run } = require('../config/database');

async function createRecoveryRequest({ userId, expiresAt, createdAt }) {
  const result = await run(
    'INSERT INTO recovery_requests (user_id, status, expires_at, created_at) VALUES (?, ?, ?, ?)',
    [userId, 'PENDING', expiresAt, createdAt],
  );

  return getRecoveryRequestById(result.id);
}

async function getRecoveryRequestById(id) {
  return get(
    `SELECT
      rr.id,
      rr.user_id AS userId,
      rr.status,
      rr.expires_at AS expiresAt,
      rr.created_at AS createdAt,
      u.name AS userName,
      u.email AS userEmail
     FROM recovery_requests rr
     JOIN users u ON u.id = rr.user_id
     WHERE rr.id = ?`,
    [id],
  );
}

async function getRecoveryRequests() {
  return all(
    `SELECT
      rr.id,
      rr.user_id AS userId,
      rr.status,
      rr.expires_at AS expiresAt,
      rr.created_at AS createdAt,
      u.name AS userName,
      u.email AS userEmail
     FROM recovery_requests rr
     JOIN users u ON u.id = rr.user_id
     ORDER BY rr.id DESC`,
  );
}

async function updateRecoveryStatus(id, status) {
  await run('UPDATE recovery_requests SET status = ? WHERE id = ?', [status, id]);
  return getRecoveryRequestById(id);
}

async function expirePendingRequests(nowIso) {
  await run(
    `UPDATE recovery_requests
     SET status = 'EXPIRED'
     WHERE expires_at <= ? AND status IN ('PENDING', 'APPROVED')`,
    [nowIso],
  );
}

async function upsertDecision({ recoveryRequestId, contactEmail, decision, createdAt }) {
  await run(
    `INSERT INTO approvals (recovery_request_id, contact_email, decision, created_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(recovery_request_id, contact_email)
     DO UPDATE SET decision = excluded.decision, created_at = excluded.created_at`,
    [recoveryRequestId, contactEmail, decision, createdAt],
  );

  return getApproval(recoveryRequestId, contactEmail);
}

async function getApproval(recoveryRequestId, contactEmail) {
  return get(
    `SELECT
      id,
      recovery_request_id AS recoveryRequestId,
      contact_email AS contactEmail,
      decision,
      created_at AS createdAt
     FROM approvals
     WHERE recovery_request_id = ? AND contact_email = ?`,
    [recoveryRequestId, contactEmail],
  );
}

async function getApprovalsByRequestId(recoveryRequestId) {
  return all(
    `SELECT
      id,
      recovery_request_id AS recoveryRequestId,
      contact_email AS contactEmail,
      decision,
      created_at AS createdAt
     FROM approvals
     WHERE recovery_request_id = ?
     ORDER BY id DESC`,
    [recoveryRequestId],
  );
}

async function countApprovals(recoveryRequestId) {
  const row = await get(
    `SELECT COUNT(*) AS total
     FROM approvals
     WHERE recovery_request_id = ? AND decision = 'APPROVED'`,
    [recoveryRequestId],
  );

  return row.total;
}

async function getDashboardStats() {
  return get(
    `SELECT
      (SELECT COUNT(*) FROM users) AS users,
      (SELECT COUNT(*) FROM trusted_contacts) AS contacts,
      (SELECT COUNT(*) FROM recovery_requests WHERE status = 'PENDING') AS activeRequests,
      (SELECT COUNT(*) FROM recovery_requests WHERE status = 'APPROVED') AS approvedRequests,
      (SELECT COUNT(*) FROM recovery_requests WHERE status = 'EXPIRED') AS expiredRequests`,
  );
}

module.exports = {
  countApprovals,
  createRecoveryRequest,
  expirePendingRequests,
  getApprovalsByRequestId,
  getDashboardStats,
  getRecoveryRequestById,
  getRecoveryRequests,
  updateRecoveryStatus,
  upsertDecision,
};
