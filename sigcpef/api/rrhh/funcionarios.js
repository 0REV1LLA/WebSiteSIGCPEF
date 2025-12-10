// ARCHIVO: api/rrhh/funcionarios.js
/**
 * @descripcion: CRUD de funcionarios para modulo RRHH.
 * @endpoint: GET/POST/PUT/DELETE /api/rrhh/funcionarios
 * @autenticacion: Requiere token JWT con rol 'RRHH' o 'ADMIN'.
 * @body POST: { nombre, apellido, ci, rango, cargo, ... }
 * @body PUT: { id, ...campos }
 * @respuesta_exitosa: { success: true, data }
 * @errores_comunes: AUTH_MISSING, AUTH_FORBIDDEN, VALIDATION_ERROR, NOT_FOUND
 */
import { connectDB } from '../_lib/db.js';
import { Funcionario } from '../_lib/models.js';
import { assertRole, sendError } from '../_lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    assertRole(req, ['RRHH', 'ADMIN']);
  } catch (err) {
    const code = err.message;
    if (code === 'AUTH_MISSING' || code === 'AUTH_INVALID') return sendError(res, 401, code, 'Token invalido o ausente.');
    if (code === 'AUTH_FORBIDDEN') return sendError(res, 403, code, 'No tienes permisos.');
    return sendError(res, 401, 'AUTH_ERROR', 'Error de autenticacion.');
  }

  await connectDB();

  switch (req.method) {
    case 'GET':
      return list(req, res);
    case 'POST':
      return create(req, res);
    case 'PUT':
      return update(req, res);
    case 'DELETE':
      return remove(req, res);
    default:
      return sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Metodo no soportado.');
  }
}

async function list(req, res) {
  const { q = '' } = req.query;
  const filter = q
    ? {
        $or: [
          { nombre: { $regex: q, $options: 'i' } },
          { apellido: { $regex: q, $options: 'i' } },
          { ci: { $regex: q, $options: 'i' } }
        ]
      }
    : {};
  const data = await Funcionario.find(filter).sort({ createdAt: -1 }).lean();
  return res.status(200).json({ success: true, data });
}

async function create(req, res) {
  const body = req.body || {};
  if (!body.nombre || !body.apellido || !body.ci) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'nombre, apellido y ci son obligatorios.');
  }
  try {
    const exists = await Funcionario.findOne({ ci: body.ci });
    if (exists) return sendError(res, 409, 'DUPLICATE', 'Ya existe un funcionario con esa CI.');
    const created = await Funcionario.create(body);
    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    console.error('Create funcionario error', err);
    return sendError(res, 500, 'SERVER_ERROR', 'No se pudo crear.');
  }
}

async function update(req, res) {
  const { id } = req.body || {};
  if (!id) return sendError(res, 400, 'VALIDATION_ERROR', 'id requerido para actualizar.');
  try {
    const updated = await Funcionario.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return sendError(res, 404, 'NOT_FOUND', 'Funcionario no encontrado.');
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error('Update funcionario error', err);
    return sendError(res, 500, 'SERVER_ERROR', 'No se pudo actualizar.');
  }
}

async function remove(req, res) {
  const { id } = req.body || {};
  if (!id) return sendError(res, 400, 'VALIDATION_ERROR', 'id requerido para eliminar.');
  try {
    const deleted = await Funcionario.findByIdAndDelete(id);
    if (!deleted) return sendError(res, 404, 'NOT_FOUND', 'Funcionario no encontrado.');
    return res.status(200).json({ success: true, data: deleted });
  } catch (err) {
    console.error('Delete funcionario error', err);
    return sendError(res, 500, 'SERVER_ERROR', 'No se pudo eliminar.');
  }
}
