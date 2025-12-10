// ARCHIVO: api/_lib/models.js
/**
 * @descripcion: Define esquemas y modelos Mongoose para Usuarios, Funcionarios y Sanciones.
 */
import mongoose from 'mongoose';

const { Schema, models } = mongoose;

const userSchema = new Schema(
  {
    nombre: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['RRHH', 'OPERACIONES', 'ICAP', 'ADMIN'],
      default: 'RRHH'
    },
    activo: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const funcionarioSchema = new Schema(
  {
    nombre: { type: String, required: true, trim: true },
    apellido: { type: String, required: true, trim: true },
    ci: { type: String, required: true, unique: true, trim: true },
    fechaNacimiento: { type: Date },
    rango: { type: String },
    cargo: { type: String },
    unidad: { type: String },
    telefono: { type: String },
    emailInstitucional: { type: String },
    direccion: { type: String },
    fotoUrl: { type: String },
    estado: { type: String, enum: ['ACTIVO', 'INACTIVO'], default: 'ACTIVO' }
  },
  { timestamps: true }
);

const sancionSchema = new Schema(
  {
    funcionario: { type: Schema.Types.ObjectId, ref: 'Funcionario', required: true },
    tipo: { type: String, required: true },
    descripcion: { type: String, required: true },
    fecha: { type: Date, default: Date.now },
    sancionante: { type: String },
    estado: { type: String, enum: ['ABIERTA', 'CERRADA'], default: 'ABIERTA' }
  },
  { timestamps: true }
);

export const Usuario = models.Usuario || mongoose.model('Usuario', userSchema);
export const Funcionario = models.Funcionario || mongoose.model('Funcionario', funcionarioSchema);
export const Sancion = models.Sancion || mongoose.model('Sancion', sancionSchema);
