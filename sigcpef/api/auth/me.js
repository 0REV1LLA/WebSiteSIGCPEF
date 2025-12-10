// ARCHIVO: api/auth/me.js
/**
 * @descripcion: Devuelve los datos basicos del usuario autenticado.
 * @endpoint: GET /api/auth/me
 * @autenticacion: Requiere token JWT.
 * @respuesta_exitosa: { success: true, user: { id, email, role, nombre } }
 */
import { Usuario } from '../_lib/models.js';
import { connectDB } from '../_lib/db.js';
import { getUserFromRequest, sendError } from '../_lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Solo GET');

  let userPayload;
  try {
    userPayload = getUserFromRequest(req);
  } catch (err) {
    const code = err.message;
    if (code === 'AUTH_MISSING' || code === 'AUTH_INVALID') return sendError(res, 401, code, 'Token invalido o ausente.');
    return sendError(res, 401, 'AUTH_ERROR', 'Error de autenticacion.');
  }

  await connectDB();
  const user = await Usuario.findById(userPayload.id).lean();
  if (!user) return sendError(res, 404, 'NOT_FOUND', 'Usuario no encontrado.');

  return res.status(200).json({ success: true, user: { id: user._id, email: user.email, role: user.role, nombre: user.nombre } });
}
