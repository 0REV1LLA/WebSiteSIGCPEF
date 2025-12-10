// ARCHIVO: api/auth/login.js
/**
 * @descripcion: Endpoint de inicio de sesion con JWT.
 * @endpoint: POST /api/auth/login
 * @autenticacion: No requiere, devuelve token JWT.
 * @body: { email, password }
 * @respuesta_exitosa: { success: true, token, user: { id, role, email } }
 * @errores_comunes: AUTH_INVALID_CREDENTIALS, AUTH_INACTIVE
 */
import { connectDB } from '../_lib/db.js';
import { Usuario } from '../_lib/models.js';
import { signToken, comparePassword, sendError } from '../_lib/auth.js';

// Memoria simple para rate limiting basico por IP
const attempts = new Map();
const WINDOW_MS = 60 * 1000;
const MAX_ATTEMPTS = 10;

function rateLimit(req, res) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = attempts.get(ip) || { count: 0, ts: now };
  if (now - entry.ts > WINDOW_MS) {
    attempts.set(ip, { count: 1, ts: now });
    return true;
  }
  entry.count += 1;
  entry.ts = now;
  attempts.set(ip, entry);
  if (entry.count > MAX_ATTEMPTS) {
    sendError(res, 429, 'RATE_LIMIT', 'Demasiadas solicitudes, intenta en un minuto.');
    return false;
  }
  return true;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Solo POST.');

  if (!rateLimit(req, res)) return;

  const { email, password } = req.body || {};
  if (!email || !password) return sendError(res, 400, 'VALIDATION_ERROR', 'Email y password son requeridos.');

  try {
    await connectDB();
    const user = await Usuario.findOne({ email: email.toLowerCase().trim() });
    if (!user) return sendError(res, 401, 'AUTH_INVALID_CREDENTIALS', 'Credenciales invalidas.');
    const ok = await comparePassword(password, user.password);
    if (!ok) return sendError(res, 401, 'AUTH_INVALID_CREDENTIALS', 'Credenciales invalidas.');
    if (!user.activo) return sendError(res, 403, 'AUTH_INACTIVE', 'Usuario inactivo.');

    const token = signToken({ id: user._id.toString(), role: user.role, email: user.email });
    return res.status(200).json({ success: true, token, user: { id: user._id, role: user.role, email: user.email, nombre: user.nombre } });
  } catch (err) {
    console.error('Login error', err);
    return sendError(res, 500, 'SERVER_ERROR', 'Error interno.');
  }
}
