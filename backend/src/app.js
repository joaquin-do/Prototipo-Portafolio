const cors = require('cors');
const express = require('express');
const contactRoutes = require('./routes/contactRoutes');
const recoveryRoutes = require('./routes/recoveryRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

function buildAllowedOrigins() {
  const origins = new Set([
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ]);

  if (process.env.FRONTEND_URL) {
    process.env.FRONTEND_URL.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
      .forEach((origin) => origins.add(origin));
  }

  return origins;
}

const allowedOrigins = buildAllowedOrigins();

function isVercelOrigin(origin) {
  try {
    return /\.vercel\.app$/.test(new URL(origin).hostname);
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      const isAllowed =
        allowedOrigins.has(origin) || isVercelOrigin(origin);

      callback(null, isAllowed);
    },
    credentials: true,
  }),
);
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', name: 'trust-recovery-prototype' });
});

app.use('/api/users', userRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/recovery', recoveryRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada.' });
});

app.use((error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 ? 'Error interno del servidor.' : error.message;

  if (statusCode === 500) {
    console.error(error);
  }

  res.status(statusCode).json({ message });
});

module.exports = app;
