// ARCHIVO: api/auth/register.js
/**
 * @descripcion: Crea usuarios con rol asignado. Solo ADMIN.
 * @endpoint: POST /api/auth/register
 * @autenticacion: Requiere token JWT con rol 'ADMIN'.
 * @body: { nombre, email, password, role }
 * @respuesta_exitosa: { success: true, data: { id, email, role } }
 * @errores_comunes: AUTH_FORBIDDEN, DUPLICATE, VALIDATION_ERROR
 */
import { connectDB } from '../_lib/db.js';
import { Usuario } from '../_lib/models.js';
import { assertRole, hashPassword, sendError } from '../_lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Solo POST');

  try {
    assertRole(req, ['ADMIN']);
  } catch (err) {
    const code = err.message;
    if (code === 'AUTH_MISSING' || code === 'AUTH_INVALID') return sendError(res, 401, code, 'Token invalido o ausente.');
    if (code === 'AUTH_FORBIDDEN') return sendError(res, 403, code, 'No tienes permisos.');
    return sendError(res, 401, 'AUTH_ERROR', 'Error de autenticacion.');
  }

  const { nombre, email, password, role = 'RRHH' } = req.body || {};
  if (!nombre || !email || !password) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'nombre, email y password son obligatorios.');
  }

  await connectDB();
  const exists = await Usuario.findOne({ email: email.toLowerCase().trim() });
  if (exists) return sendError(res, 409, 'DUPLICATE', 'Ya existe un usuario con ese email.');

  const hashed = await hashPassword(password);
  const created = await Usuario.create({ nombre, email: email.toLowerCase().trim(), password: hashed, role });
  return res.status(201).json({ success: true, data: { id: created._id, email: created.email, role: created.role } });
}
