// ARCHIVO: public/js/operaciones.js
/**
 * @descripcion: Buscador de personal para Operaciones.
 */
import { apiFetch, requireRole } from './main.js';

const operSection = document.getElementById('operSection');
const operSearch = document.getElementById('operSearch');
const operSearchBtn = document.getElementById('operSearchBtn');
const operResults = document.getElementById('operResults');

function render(list) {
  operResults.innerHTML = list
    .map(
      (f) => `
        <div class="list-group-item">
          <div class="d-flex justify-content-between">
            <strong>${f.nombre} ${f.apellido}</strong>
            <span class="text-muted">${f.ci}</span>
          </div>
          <small>${f.rango || '-'} · ${f.cargo || '-'} · ${f.unidad || '-'}</small>
        </div>
      `
    )
    .join('');
}

async function search() {
  try {
    requireRole('OPERACIONES');
  } catch (err) {
    return;
  }
  const q = operSearch.value;
  const { data } = await apiFetch(`/api/operaciones/consultas${q ? `?q=${encodeURIComponent(q)}` : ''}`);
  render(data);
}

operSearchBtn?.addEventListener('click', search);

if (operSection) search();
