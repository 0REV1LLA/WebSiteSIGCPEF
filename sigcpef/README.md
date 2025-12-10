# SIGCPEF (Vercel + MongoDB)

## Descripcion
Sistema de Integracion para la Gestion del Cuerpo Policial del Estado Falcon. Frontend statico servido desde `/public` y funciones serverless en `/api` (Vercel). Autenticacion JWT con roles (RRHH, OPERACIONES, ICAP, ADMIN).

## Estructura
- `public/`: HTML/CSS/JS (ESM) + Bootstrap 5 CDN.
- `api/`: Funciones serverless Node (ESM).
  - `_lib/`: utilidades DB, auth, modelos.
  - `auth/`: login, register (solo ADMIN), me.
  - `rrhh/`: CRUD funcionarios.
  - `operaciones/`: consultas de personal.
  - `icap/`: sanciones y tipos estaticos.

## Variables de entorno (Vercel o .env.local)
- `MONGODB_URI`: cadena de conexion MongoDB Atlas.
- `JWT_SECRET`: clave secreta para firmar tokens.
- `JWT_EXPIRES_IN`: duracion (ej: `2h`).
- `CORS_ORIGIN`: origen permitido (ej: `https://tu-dominio.vercel.app` o `*` para pruebas).

## Seguridad y buenas practicas
- Usa `JWT_SECRET` robusto (32+ chars) y rota periodicamente.
- Limita `CORS_ORIGIN` a tu dominio en produccion.
- `login` incluye rate limiting en memoria (mejor usar Redis en prod).
- Hashea passwords con bcrypt (ver `auth/register`).
- Roles validados en cada endpoint (`assertRole`).
- No se incluye subida a Cloudinary por peticion expresa.

## Flujo de uso
1. Desplegar en Vercel con las variables anteriores.
2. Crear un usuario ADMIN via `/api/auth/register` (o directamente en BD) para gestionar otros usuarios.
3. Iniciar sesion en `public/index.html`, obtener token y navegar por los modulos segun rol.
4. RRHH: CRUD de funcionarios (`/api/rrhh/funcionarios`).
5. Operaciones: consultas rapidas (`/api/operaciones/consultas`).
6. ICAP: registrar/listar sanciones (`/api/icap/sanciones`, `/api/icap/tipos`).

## Endpoints
- `POST /api/auth/login` — devuelve JWT.
- `POST /api/auth/register` — crear usuario (ADMIN).
- `GET /api/auth/me` — perfil autenticado.
- `GET/POST/PUT/DELETE /api/rrhh/funcionarios`
- `GET /api/rrhh/buscar?q=`
- `GET /api/operaciones/consultas?q=`
- `GET/POST /api/icap/sanciones`
- `GET /api/icap/tipos`

## Frontend
- Bootstrap 5 (CDN), JS modular (ESM) en `/public/js`.
- `main.js` maneja login, token y gating por rol.
- `rrhh.js`, `operaciones.js`, `icap.js` consumen APIs con fetch y token.

## Ejecutar en local
```bash
npm install
vercel dev
# o configurar .env.local con las variables mencionadas
```

## Notas
- No se tocaron los CSS existentes del proyecto original; se suma `public/css/styles.css` para el prototipo nuevo.
- Revisa consola del navegador para ver errores de red CORS/jwt si el origen no coincide.
