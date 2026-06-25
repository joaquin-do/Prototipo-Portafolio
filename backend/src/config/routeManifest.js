const API_ROUTES = [
  { method: 'GET', path: '/api/health' },
  { method: 'POST', path: '/api/users/register' },
  { method: 'GET', path: '/api/users' },
  { method: 'POST', path: '/api/contacts' },
  { method: 'GET', path: '/api/contacts/:userId' },
  { method: 'POST', path: '/api/recovery/request' },
  { method: 'GET', path: '/api/recovery/dashboard' },
  { method: 'GET', path: '/api/recovery' },
  { method: 'POST', path: '/api/recovery/approve' },
  { method: 'POST', path: '/api/recovery/reject' },
  { method: 'POST', path: '/api/recovery/reset-password' },
];

function logApiRoutes() {
  console.log('[ROUTES] Endpoints registrados bajo /api:');
  API_ROUTES.forEach(({ method, path }) => {
    console.log(`[ROUTES]   ${method.padEnd(6)} ${path}`);
  });
}

module.exports = {
  API_ROUTES,
  logApiRoutes,
};
