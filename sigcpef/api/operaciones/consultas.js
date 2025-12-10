// ARCHIVO: api/operaciones/consultas.js
/**
 * @descripcion: Consultas de personal para modulo Operaciones.
 * @endpoint: GET /api/operaciones/consultas?q=texto
 * @autenticacion: Requiere token JWT rol 'OPERACIONES' o 'ADMIN'.
 * @respuesta_exitosa: { success: true, data: [...] }
 */
import { connectDB } from '../_lib/db.js';
import { Funcionario } from '../_lib/models.js';
import { assertRole, sendError } from '../_lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Solo GET');

  try {
    assertRole(req, ['OPERACIONES', 'ADMIN']);
  } catch (err) {
    const code = err.message;
    if (code === 'AUTH_MISSING' || code === 'AUTH_INVALID') return sendError(res, 401, code, 'Token invalido o ausente.');
    if (code === 'AUTH_FORBIDDEN') return sendError(res, 403, code, 'No tienes permisos.');
    return sendError(res, 401, 'AUTH_ERROR', 'Error de autenticacion.');
  }

  const { q = '' } = req.query;
  await connectDB();
  const filter = q
    ? {
        $or: [
          { nombre: { $regex: q, $options: 'i' } },
          { apellido: { $regex: q, $options: 'i' } },
          { ci: { $regex: q, $options: 'i' } },
          { unidad: { $regex: q, $options: 'i' } }
        ]
      }
    : {};
  const data = await Funcionario.find(filter).select('nombre apellido ci rango cargo unidad estado').limit(30).lean();
  return res.status(200).json({ success: true, data });
}
