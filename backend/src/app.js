const cors = require('cors');
const express = require('express');
const contactRoutes = require('./routes/contactRoutes');
const recoveryRoutes = require('./routes/recoveryRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const apiRouter = express.Router();

function addOriginsFromEnv(envKey, origins) {
  const value = process.env[envKey];
  if (!value) {
    return;
  }

  value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .forEach((origin) => origins.add(origin));
}

function buildAllowedOrigins() {
  const origins = new Set();

  if (process.env.NODE_ENV !== 'production') {
    origins.add('http://localhost:5173');
    origins.add('http://127.0.0.1:5173');
    origins.add('http://localhost:5174');
    origins.add('http://127.0.0.1:5174');
  }

  addOriginsFromEnv('FRONTEND_URL', origins);
  addOriginsFromEnv('CLIENT_URL', origins);

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

apiRouter.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

apiRouter.use('/users', userRoutes);
apiRouter.use('/contacts', contactRoutes);
apiRouter.use('/recovery', recoveryRoutes);

app.use('/api', apiRouter);

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
