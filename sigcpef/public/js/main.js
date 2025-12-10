// ARCHIVO: public/js/main.js
/**
 * @descripcion: Gestiona autenticacion en frontend y expone fetch con token.
 * @notas: Guarda el token en localStorage; muestra secciones segun rol.
 */
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const userRoleBadge = document.getElementById('userRoleBadge');
const logoutBtn = document.getElementById('logoutBtn');

const sections = {
  RRHH: document.getElementById('rrhhSection'),
  OPERACIONES: document.getElementById('operSection'),
  ICAP: document.getElementById('icapSection'),
};

/**
 * Ejecuta peticiones con el token almacenado.
 * @param {string} url - ruta relativa /api/...
 * @param {RequestInit} options - configuracion fetch
 * @returns {Promise<any>} respuesta JSON
 */
export async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Error en la solicitud');
  }
  return res.json();
}

function setRole(role) {
  userRoleBadge.textContent = role || 'Invitado';
  userRoleBadge.className = 'badge bg-light text-dark';
  logoutBtn.hidden = !role;
  Object.values(sections).forEach((s) => s.classList.add('d-none'));
  if (role === 'ADMIN') {
    Object.values(sections).forEach((s) => s.classList.remove('d-none'));
  } else if (sections[role]) {
    sections[role].classList.remove('d-none');
  }
}

function persistSession(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  setRole(user.role);
}

function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  setRole(null);
}

// Restaurar sesion si existe
(() => {
  const userRaw = localStorage.getItem('user');
  if (userRaw) {
    try {
      const user = JSON.parse(userRaw);
      setRole(user.role);
    } catch (err) {
      clearSession();
    }
  }
})();

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.classList.add('d-none');
    const formData = new FormData(loginForm);
    const email = formData.get('email');
    const password = formData.get('password');
    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      persistSession(data.token, data.user);
    } catch (err) {
      loginError.textContent = err.message;
      loginError.classList.remove('d-none');
    }
  });
}

logoutBtn?.addEventListener('click', () => {
  clearSession();
});

// Exponer helpers globalmente para otros modulos
export function getToken() {
  return localStorage.getItem('token');
}

export function requireRole(role) {
  const userRaw = localStorage.getItem('user');
  if (!userRaw) throw new Error('No autenticado');
  const user = JSON.parse(userRaw);
  if (user.role !== role && user.role !== 'ADMIN') throw new Error('Rol insuficiente');
  return user;
}
