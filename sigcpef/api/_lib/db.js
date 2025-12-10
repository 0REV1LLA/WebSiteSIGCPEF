// ARCHIVO: api/_lib/db.js
/**
 * @descripcion: Gestiona la conexion unica a MongoDB Atlas usando mongoose.
 * @notas: Usa cache en entorno serverless para evitar abrir conexiones por invocacion.
 */
import mongoose from 'mongoose';

const { MONGODB_URI } = process.env;

if (!MONGODB_URI) {
  console.warn('⚠️ Falta la variable de entorno MONGODB_URI.');
}

// Cache para reusar conexion entre invocaciones
let cached = global._mongoose;
if (!cached) {
  cached = global._mongoose = { conn: null, promise: null };
}

/**
 * Abre o reutiliza la conexion a MongoDB.
 * @returns {Promise<mongoose.Connection>} conexion activa.
 */
export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        maxPoolSize: 5,
      })
      .then((mongooseInstance) => mongooseInstance.connection);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
