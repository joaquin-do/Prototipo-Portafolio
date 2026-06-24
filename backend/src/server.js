const app = require('./app');
const { initializeDatabase } = require('./config/database');

const PORT = Number(process.env.PORT) || 4000;
const HOST = process.env.HOST || '0.0.0.0';

async function startServer() {
  try {
    await initializeDatabase();

    app.listen(PORT, HOST, () => {
      console.log(`Trust Recovery API running on ${HOST}:${PORT}`);
      console.log(`Healthcheck: /api/health`);
    });
  } catch (error) {
    console.error('No se pudo iniciar el servidor:', error);
    process.exit(1);
  }
}

startServer();
