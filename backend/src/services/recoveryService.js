const contactRepository = require('../repositories/contactRepository');
const recoveryRepository = require('../repositories/recoveryRepository');
const userRepository = require('../repositories/userRepository');

const REQUIRED_CONTACTS = 3;
const REQUIRED_APPROVALS = 2;
const EXPIRATION_MINUTES = 10;

function createHttpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function refreshExpiredRequests() {
  await recoveryRepository.expirePendingRequests(new Date().toISOString());
}

async function requestRecovery({ email }) {
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail) {
    throw createHttpError('El correo del usuario es obligatorio.', 400);
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(normalizedEmail)) {
    throw createHttpError('El correo no tiene un formato valido.', 400);
  }

  const user = await userRepository.getUserByEmail(normalizedEmail);
  if (!user) {
    throw createHttpError('No existe un usuario con ese correo.', 404);
  }

  const contacts = await contactRepository.getContactsByUserId(user.id);
  if (contacts.length < REQUIRED_CONTACTS) {
    throw createHttpError('El usuario necesita al menos 3 contactos de confianza.', 400);
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + EXPIRATION_MINUTES * 60_000);
  const request = await recoveryRepository.createRecoveryRequest({
    userId: user.id,
    expiresAt: expiresAt.toISOString(),
    createdAt: now.toISOString(),
  });

  return {
    ...request,
    contacts,
    message: 'Solicitud creada. En este prototipo no se envian correos reales.',
  };
}

async function getRecoveryRequests() {
  await refreshExpiredRequests();

  const requests = await recoveryRepository.getRecoveryRequests();
  return Promise.all(
    requests.map(async (request) => ({
      ...request,
      contacts: await contactRepository.getContactsByUserId(request.userId),
      approvals: await recoveryRepository.getApprovalsByRequestId(request.id),
    })),
  );
}

async function applyDecision({ recoveryRequestId, contactEmail, decision }) {
  await refreshExpiredRequests();

  const requestId = Number(recoveryRequestId);
  const normalizedEmail = contactEmail?.trim().toLowerCase();

  if (!requestId || !normalizedEmail) {
    throw createHttpError('recoveryRequestId y contactEmail son obligatorios.', 400);
  }

  if (!['APPROVED', 'REJECTED'].includes(decision)) {
    throw createHttpError('La decision debe ser APPROVED o REJECTED.', 400);
  }

  const request = await recoveryRepository.getRecoveryRequestById(requestId);
  if (!request) {
    throw createHttpError('La solicitud de recuperacion no existe.', 404);
  }

  if (request.status === 'EXPIRED') {
    throw createHttpError('La solicitud ya expiro y no acepta decisiones.', 400);
  }

  const trustedContact = await contactRepository.getContactForUser(request.userId, normalizedEmail);
  if (!trustedContact) {
    throw createHttpError('El correo no pertenece a un contacto de confianza del usuario.', 403);
  }

  await recoveryRepository.upsertDecision({
    recoveryRequestId: requestId,
    contactEmail: normalizedEmail,
    decision,
    createdAt: new Date().toISOString(),
  });

  const approvalCount = await recoveryRepository.countApprovals(requestId);
  const nextStatus = approvalCount >= REQUIRED_APPROVALS ? 'APPROVED' : 'PENDING';
  const updatedRequest = await recoveryRepository.updateRecoveryStatus(requestId, nextStatus);

  return {
    ...updatedRequest,
    approvalCount,
    requiredApprovals: REQUIRED_APPROVALS,
  };
}

async function approveRecovery(payload) {
  return applyDecision({ ...payload, decision: 'APPROVED' });
}

async function rejectRecovery(payload) {
  return applyDecision({ ...payload, decision: 'REJECTED' });
}

async function resetPassword({ recoveryRequestId, newPassword }) {
  await refreshExpiredRequests();

  if (!recoveryRequestId || !newPassword) {
    throw createHttpError('recoveryRequestId y newPassword son obligatorios.', 400);
  }

  const request = await recoveryRepository.getRecoveryRequestById(Number(recoveryRequestId));
  if (!request) {
    throw createHttpError('La solicitud de recuperacion no existe.', 404);
  }

  if (request.status !== 'APPROVED') {
    throw createHttpError('Solo una solicitud APPROVED permite cambiar la contrasena.', 400);
  }

  await userRepository.updatePassword(request.userId, newPassword);

  return {
    message: 'Contrasena actualizada correctamente.',
    userId: request.userId,
    recoveryRequestId: request.id,
  };
}

async function getDashboardStats() {
  await refreshExpiredRequests();
  return recoveryRepository.getDashboardStats();
}

module.exports = {
  approveRecovery,
  getDashboardStats,
  getRecoveryRequests,
  rejectRecovery,
  requestRecovery,
  resetPassword,
};
