const userRepository = require('../repositories/userRepository');

function assertRequired(value, fieldName) {
  if (!value || String(value).trim() === '') {
    const error = new Error(`${fieldName} es obligatorio.`);
    error.statusCode = 400;
    throw error;
  }
}

async function registerUser(payload) {
  const name = payload.name?.trim();
  const email = payload.email?.trim().toLowerCase();
  const password = payload.password;

  assertRequired(name, 'El nombre');
  assertRequired(email, 'El correo');
  assertRequired(password, 'La contraseña');

  const existingUser = await userRepository.getUserByEmail(email);
  if (existingUser) {
    const error = new Error('Ya existe un usuario con ese correo.');
    error.statusCode = 409;
    throw error;
  }

  return userRepository.createUser({ name, email, password });
}

async function getUsers() {
  return userRepository.getUsers();
}

module.exports = {
  getUsers,
  registerUser,
};
