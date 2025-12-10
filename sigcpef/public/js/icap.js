// ARCHIVO: public/js/icap.js
/**
 * @descripcion: UI para listar y registrar sanciones (ICAP).
 */
import { apiFetch, requireRole } from './main.js';

const icapSection = document.getElementById('icapSection');
const icapList = document.getElementById('icapList');
const icapFuncionarioId = document.getElementById('icapFuncionarioId');
const icapRefreshBtn = document.getElementById('icapRefreshBtn');
const icapAddBtn = document.getElementById('icapAddBtn');
const icapModalEl = document.getElementById('icapModal');
const icapForm = document.getElementById('icapForm');
const icapSaveBtn = document.getElementById('icapSaveBtn');
let icapModal;

function ensureModal() {
  if (!icapModal && window.bootstrap) {
    icapModal = new window.bootstrap.Modal(icapModalEl);
  }
}

function render(list) {
  icapList.innerHTML = list
    .map(
      (s) => `
        <div class="list-group-item">
          <div class="d-flex justify-content-between">
            <strong>${s.tipo}</strong>
            <span class="text-muted">${new Date(s.createdAt).toLocaleDateString()}</span>
          </div>
          <small>${s.descripcion}</small>
          <div class="mt-1 text-muted">${s.funcionario?.nombre || ''} ${s.funcionario?.apellido || ''} — CI: ${s.funcionario?.ci || ''}</div>
          <span class="badge ${s.estado === 'ABIERTA' ? 'bg-warning text-dark' : 'bg-success'}">${s.estado}</span>
        </div>
      `
    )
    .join('');
}

async function loadSanciones() {
  try {
    requireRole('ICAP');
  } catch (err) {
    return;
  }
  const funcionarioId = icapFuncionarioId.value.trim();
  const qs = funcionarioId ? `?funcionarioId=${encodeURIComponent(funcionarioId)}` : '';
  const { data } = await apiFetch(`/api/icap/sanciones${qs}`);
  render(data);
}

function openModal() {
  ensureModal();
  icapForm.reset();
  icapModal?.show();
}

async function saveSancion() {
  const payload = Object.fromEntries(new FormData(icapForm).entries());
  const { data } = await apiFetch('/api/icap/sanciones', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  icapModal?.hide();
  await loadSanciones();
  return data;
}

icapRefreshBtn?.addEventListener('click', loadSanciones);
icapAddBtn?.addEventListener('click', openModal);
icapSaveBtn?.addEventListener('click', saveSancion);

if (icapSection) {
  loadSanciones();
}
