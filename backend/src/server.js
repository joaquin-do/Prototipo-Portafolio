const app = require('./app');
const { initializeDatabase } = require('./config/database');

const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    await initializeDatabase();

    app.listen(PORT, () => {
      console.log(`Trust Recovery API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('No se pudo iniciar el servidor:', error);
    process.exit(1);
  }
}

startServer();
