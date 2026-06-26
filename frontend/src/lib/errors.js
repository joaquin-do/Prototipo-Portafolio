export function getErrorMessage(error) {
  return error.response?.data?.message || 'Ocurrió un error inesperado.'
}
