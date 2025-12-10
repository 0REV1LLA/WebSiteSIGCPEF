// ARCHIVO: public/js/rrhh.js
/**
 * @descripcion: UI para CRUD de funcionarios (RRHH).
 */
import { apiFetch, requireRole } from './main.js';

const rrhhSection = document.getElementById('rrhhSection');
const rrhhTable = document.getElementById('rrhhTable');
const rrhhSearch = document.getElementById('rrhhSearch');
const rrhhSearchBtn = document.getElementById('rrhhSearchBtn');
const rrhhAddBtn = document.getElementById('rrhhAddBtn');
const rrhhModalEl = document.getElementById('rrhhModal');
const rrhhForm = document.getElementById('rrhhForm');
const rrhhSaveBtn = document.getElementById('rrhhSaveBtn');
let rrhhModal;

function ensureModal() {
  if (!rrhhModal && window.bootstrap) {
    rrhhModal = new window.bootstrap.Modal(rrhhModalEl);
  }
}

/**
 * Rellena la tabla con resultados.
 * @param {Array} data - lista de funcionarios
 */
function renderTable(data) {
  rrhhTable.innerHTML = data
    .map((f) => `
      <tr>
        <td>${f.ci}</td>
        <td>${f.nombre} ${f.apellido}</td>
        <td>${f.rango || '-'}</td>
        <td>${f.cargo || '-'}</td>
        <td>${f.unidad || '-'}</td>
        <td><span class="badge ${f.estado === 'ACTIVO' ? 'bg-success' : 'bg-secondary'}">${f.estado}</span></td>
        <td class="d-flex gap-1">
          <button class="btn btn-sm btn-outline-primary" data-edit="${f._id}">Editar</button>
          <button class="btn btn-sm btn-outline-danger" data-del="${f._id}">Eliminar</button>
        </td>
      </tr>
    `)
    .join('');
}

async function loadRRHH() {
  try {
    requireRole('RRHH');
  } catch (err) {
    return;
  }
  const q = rrhhSearch.value;
  const { data } = await apiFetch(`/api/rrhh/funcionarios${q ? `?q=${encodeURIComponent(q)}` : ''}`);
  renderTable(data);
}

function openModal(funcionario = null) {
  ensureModal();
  rrhhForm.reset();
  rrhhForm.id.value = funcionario?._id || '';
  rrhhForm.nombre.value = funcionario?.nombre || '';
  rrhhForm.apellido.value = funcionario?.apellido || '';
  rrhhForm.ci.value = funcionario?.ci || '';
  rrhhForm.rango.value = funcionario?.rango || '';
  rrhhForm.cargo.value = funcionario?.cargo || '';
  rrhhForm.unidad.value = funcionario?.unidad || '';
  rrhhForm.estado.value = funcionario?.estado || 'ACTIVO';
  rrhhForm.emailInstitucional.value = funcionario?.emailInstitucional || '';
  rrhhForm.direccion.value = funcionario?.direccion || '';
  document.getElementById('rrhhModalTitle').textContent = funcionario ? 'Editar funcionario' : 'Nuevo funcionario';
  rrhhModal?.show();
}

async function saveFuncionario() {
  const body = Object.fromEntries(new FormData(rrhhForm).entries());
  const isEdit = Boolean(body.id);
  const method = isEdit ? 'PUT' : 'POST';
  const payload = { ...body };
  if (!isEdit) delete payload.id;
  const { data } = await apiFetch('/api/rrhh/funcionarios', {
    method,
    body: JSON.stringify(payload),
  });
  rrhhModal?.hide();
  await loadRRHH();
  return data;
}

async function deleteFuncionario(id) {
  if (!confirm('¿Eliminar funcionario?')) return;
  await apiFetch('/api/rrhh/funcionarios', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  });
  await loadRRHH();
}

rrhhSearchBtn?.addEventListener('click', () => loadRRHH());
rrhhAddBtn?.addEventListener('click', () => openModal());
rrhhSaveBtn?.addEventListener('click', () => saveFuncionario());
rrhhTable?.addEventListener('click', (e) => {
  const editId = e.target.getAttribute('data-edit');
  const delId = e.target.getAttribute('data-del');
  if (editId) {
    const row = e.target.closest('tr');
    const data = {
      _id: editId,
      ci: row.children[0].textContent,
      nombre: row.children[1].textContent.split(' ')[0],
      apellido: row.children[1].textContent.split(' ')[1],
      rango: row.children[2].textContent,
      cargo: row.children[3].textContent,
      unidad: row.children[4].textContent,
      estado: row.querySelector('.badge').textContent,
    };
    openModal(data);
  }
  if (delId) deleteFuncionario(delId);
});

// Inicial carga cuando la seccion existe
if (rrhhSection) {
  loadRRHH();
}
