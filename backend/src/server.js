const app = require('./app');
const { initializeDatabase } = require('./config/database');

const PORT = process.env.PORT || 4000;

process.on('unhandledRejection', (reason) => {
  console.error('[SERVER] Promesa rechazada sin capturar:', reason);
});

async function startServer() {
  try {
    console.log('[SERVER] Iniciando backend...');
    console.log(`[SERVER] NODE_ENV=${process.env.NODE_ENV || 'development'}`);

    await initializeDatabase();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[SERVER] Server running on 0.0.0.0:${PORT}`);
      console.log('[SERVER] Healthcheck: GET /api/health');
    });
  } catch (error) {
    console.error('[SERVER] Error fatal al iniciar:', error);
    process.exit(1);
  }
}

startServer();
