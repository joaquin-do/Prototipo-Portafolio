export function getErrorMessage(error) {
  return error.response?.data?.message || 'Ocurrió un error inesperado.'
}

export function formatTimeRemaining(expiresAt) {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Expirada'

  const minutes = Math.floor(diff / 60_000)
  const seconds = Math.floor((diff % 60_000) / 1000)
  return `${minutes}m ${seconds}s`
}

export function approvalCount(request) {
  return request?.approvals?.filter((a) => a.decision === 'APPROVED').length ?? 0
}

export function contactDecision(request, contactEmail) {
  return request?.approvals?.find((a) => a.contactEmail === contactEmail)?.decision
}

export function activeRequestForUser(requests, email) {
  const normalized = email?.toLowerCase()
  return requests.find(
    (request) =>
      request.userEmail?.toLowerCase() === normalized &&
      ['PENDING', 'APPROVED'].includes(request.status),
  )
}
