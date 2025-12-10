// ARCHIVO: api/_lib/auth.js
/**
 * @descripcion: Utilidades de autenticacion y autorizacion JWT para Vercel Functions.
 * @notas: Incluye helpers para hashing de contrasenas y verificacion de roles.
 */
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const { JWT_SECRET = 'changeme', JWT_EXPIRES_IN = '2h' } = process.env;

if (!process.env.JWT_SECRET) {
  console.warn('⚠️ Falta JWT_SECRET. Define una clave fuerte en Vercel o .env.local.');
}

/**
 * Firma un token JWT con el payload provisto.
 * @param {object} payload - Datos minimos del usuario { id, role }.
 * @returns {string} token JWT.
 */
export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verifica y decodifica un token JWT.
 * @param {string} token - Token Bearer sin el prefijo.
 * @returns {object} payload decodificado.
 */
export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Obtiene y valida el token desde Authorization header.
 * @param {import('@vercel/node').VercelRequest} req
 * @returns {{id: string, role: string}} payload del token.
 */
export function getUserFromRequest(req) {
  const authHeader = req.headers['authorization'] || '';
  const [, token] = authHeader.split(' ');
  if (!token) throw new Error('AUTH_MISSING');
  try {
    return verifyToken(token);
  } catch (err) {
    throw new Error('AUTH_INVALID');
  }
}

/**
 * Middleware basico de rol: lanza error si el rol del usuario no esta permitido.
 * @param {import('@vercel/node').VercelRequest} req
 * @param {string[]} roles
 */
export function assertRole(req, roles = []) {
  const user = getUserFromRequest(req);
  if (roles.length && !roles.includes(user.role)) {
    throw new Error('AUTH_FORBIDDEN');
  }
  return user;
}

/**
 * Hash de contrasena con bcrypt.
 * @param {string} plain
 * @returns {Promise<string>} hash
 */
export async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

/**
 * Compara una contrasena con su hash.
 * @param {string} plain
 * @param {string} hashed
 * @returns {Promise<boolean>}
 */
export async function comparePassword(plain, hashed) {
  return bcrypt.compare(plain, hashed);
}

/**
 * Respuestas de error estandarizadas.
 * @param {import('@vercel/node').VercelResponse} res
 * @param {number} status
 * @param {string} code
 * @param {string} message
 */
export function sendError(res, status, code, message) {
  res.status(status).json({ success: false, code, message });
}
