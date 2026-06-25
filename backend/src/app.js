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
    const { hostname, protocol } = new URL(origin);
    return protocol === 'https:' && /\.vercel\.app$/i.test(hostname);
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

      if (!isAllowed && process.env.NODE_ENV !== 'production') {
        console.warn(`[CORS] Origen rechazado: ${origin}`);
      }

      callback(null, isAllowed);
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  }),
);
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
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
