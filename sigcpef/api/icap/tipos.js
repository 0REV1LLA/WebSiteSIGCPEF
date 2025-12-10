// ARCHIVO: api/icap/tipos.js
/**
 * @descripcion: Devuelve tipos de sanciones disponibles (estatico).
 * @endpoint: GET /api/icap/tipos
 * @autenticacion: Requiere token JWT rol 'ICAP' o 'ADMIN'.
 * @respuesta_exitosa: { success: true, data: [ ... ] }
 */
import { assertRole, sendError } from '../_lib/auth.js';

const TIPOS = [
  'Amonestacion verbal',
  'Amonestacion escrita',
  'Suspension',
  'Destitucion',
  'Investigacion interna'
];

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Solo GET');

  try {
    assertRole(req, ['ICAP', 'ADMIN']);
  } catch (err) {
    const code = err.message;
    if (code === 'AUTH_MISSING' || code === 'AUTH_INVALID') return sendError(res, 401, code, 'Token invalido o ausente.');
    if (code === 'AUTH_FORBIDDEN') return sendError(res, 403, code, 'No tienes permisos.');
    return sendError(res, 401, 'AUTH_ERROR', 'Error de autenticacion.');
  }

  return res.status(200).json({ success: true, data: TIPOS });
}
