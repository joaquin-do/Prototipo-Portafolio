const cors = require('cors');
const express = require('express');
const contactRoutes = require('./routes/contactRoutes');
const recoveryRoutes = require('./routes/recoveryRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(cors());
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
