const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
  ConflictError,
  UnauthorizedError,
  ValidationError,
} = require('../utils/errors');

/**
 * Register a new user.
 * @param {{ name: string, email: string, password: string }} data
 * @returns {{ user: object, token: string }}
 */
async function register({ name, email, password }) {
  // Check for existing user
  const existing = await User.findOne({ email });
  if (existing) {
    throw new ConflictError('An account with this email already exists', 'EMAIL_EXISTS');
  }

  const user = new User({
    name,
    email,
    passwordHash: password, // Pre-save hook will hash it
  });

  await user.save();

  const token = generateToken(user._id);

  return {
    user: user.toJSON(),
    token,
  };
}

/**
 * Authenticate existing user.
 * @param {{ email: string, password: string }} data
 * @returns {{ user: object, token: string }}
 */
async function login({ email, password }) {
  // Find user and explicitly select passwordHash
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const token = generateToken(user._id);

  return {
    user: user.toJSON(),
    token,
  };
}

/**
 * Generate a JWT for the given user ID.
 */
function generateToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

module.exports = { register, login };
