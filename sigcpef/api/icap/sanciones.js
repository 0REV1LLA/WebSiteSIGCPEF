// ARCHIVO: api/icap/sanciones.js
/**
 * @descripcion: Registro y consulta de sanciones para ICAP.
 * @endpoint: GET/POST /api/icap/sanciones
 * @autenticacion: Requiere token JWT rol 'ICAP' o 'ADMIN'.
 * @body POST: { funcionario, tipo, descripcion, sancionante }
 * @respuesta_exitosa: { success: true, data }
 */
import { connectDB } from '../_lib/db.js';
import { Sancion, Funcionario } from '../_lib/models.js';
import { assertRole, sendError } from '../_lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    assertRole(req, ['ICAP', 'ADMIN']);
  } catch (err) {
    const code = err.message;
    if (code === 'AUTH_MISSING' || code === 'AUTH_INVALID') return sendError(res, 401, code, 'Token invalido o ausente.');
    if (code === 'AUTH_FORBIDDEN') return sendError(res, 403, code, 'No tienes permisos.');
    return sendError(res, 401, 'AUTH_ERROR', 'Error de autenticacion.');
  }

  await connectDB();

  if (req.method === 'GET') return list(req, res);
  if (req.method === 'POST') return create(req, res);
  return sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Metodo no soportado.');
}

async function list(req, res) {
  const { funcionarioId } = req.query;
  const filter = funcionarioId ? { funcionario: funcionarioId } : {};
  const data = await Sancion.find(filter)
    .populate('funcionario', 'nombre apellido ci rango cargo')
    .sort({ createdAt: -1 })
    .lean();
  return res.status(200).json({ success: true, data });
}

async function create(req, res) {
  const { funcionario, tipo, descripcion, sancionante } = req.body || {};
  if (!funcionario || !tipo || !descripcion) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'funcionario, tipo y descripcion son obligatorios.');
  }
  const exists = await Funcionario.findById(funcionario);
  if (!exists) return sendError(res, 404, 'NOT_FOUND', 'Funcionario no encontrado.');
  try {
    const created = await Sancion.create({ funcionario, tipo, descripcion, sancionante });
    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    console.error('Create sancion error', err);
    return sendError(res, 500, 'SERVER_ERROR', 'No se pudo registrar la sancion.');
  }
}
