/*
  scriptHome.js
  Funciones para: RR-HH CRUD, búsquedas, ICAP (sanciones) y vista de operaciones.
  Persistencia en localStorage bajo keys: 'rrhh' y 'sanctions'.
*/

// small reveal effect for sections
const scrollRevealOption = {origin:'bottom', distance:'30px', duration:700, opacity:0};
try{ScrollReveal().reveal('main section', {...scrollRevealOption, interval:120});}catch(e){}

// Utilities
function getRRHH(){return JSON.parse(localStorage.getItem('rrhh')||'[]');}
function saveRRHH(arr){localStorage.setItem('rrhh',JSON.stringify(arr));}
function getSanctions(){return JSON.parse(localStorage.getItem('sanctions')||'[]');}
function saveSanctions(arr){localStorage.setItem('sanctions',JSON.stringify(arr));}

// Helper to safely get element
const $ = id => document.getElementById(id);

// Modal instances (created only if element exists)
const rrhhModalEl = $('rrhhModal');
const rrhhModal = rrhhModalEl ? new bootstrap.Modal(rrhhModalEl) : null;
const viewModal = $('viewModal') ? new bootstrap.Modal($('viewModal')) : null;
const icapModal = $('icapModal') ? new bootstrap.Modal($('icapModal')) : null;

const descriptionsContainer = $('descriptionsContainer');
function clearDescriptions(){ if(descriptionsContainer) descriptionsContainer.innerHTML=''; }
function addDescriptionField(value=''){ if(!descriptionsContainer) return; const div=document.createElement('div');div.className='mb-2';div.innerHTML=`<textarea class="form-control desc-field" rows="2">${value||''}</textarea><button type="button" class="btn btn-sm btn-link text-danger remove-desc">Eliminar</button>`;descriptionsContainer.appendChild(div);div.querySelector('.remove-desc').addEventListener('click',()=>div.remove());}

if($('addDescBtn')) $('addDescBtn').addEventListener('click',()=>addDescriptionField());

// Add RRHH button (if present)
if($('rrhhAddBtn')){
  $('rrhhAddBtn').addEventListener('click',()=>{
    if($('rrhhForm')) $('rrhhForm').reset();
    if($('rrhhId')) $('rrhhId').value='';
    clearDescriptions();
    if(rrhhModal) rrhhModal.show();
  });
}

// Save RRHH (if button exists)
if($('saveRrhhBtn')){
  $('saveRrhhBtn').addEventListener('click',function(){
    const id = $('rrhhId') ? $('rrhhId').value || null : null;
    const nombre = $('rrhhNombre') ? $('rrhhNombre').value.trim() : '';
    const apellido = $('rrhhApellido') ? $('rrhhApellido').value.trim() : '';
    const ci = $('rrhhCI') ? $('rrhhCI').value.trim() : '';
    const fn = $('rrhhFN') ? $('rrhhFN').value : '';
    const fi = $('rrhhFI') ? $('rrhhFI').value : '';
    const rango = $('rrhhRango') ? $('rrhhRango').value.trim() : '';
    const cargo = $('rrhhCargo') ? $('rrhhCargo').value.trim() : '';
    const fotoInput = $('rrhhFoto');
    if(!nombre||!apellido||!ci){alert('Nombre, apellido y C.I. son obligatorios');return}
    let rrhh = getRRHH();
    if(!id && rrhh.find(r=>r.ci===ci)){alert('Ya existe un funcionario con esa C.I.');return}

    function applySave(photoData){
      const descriptions = Array.from(document.querySelectorAll('.desc-field')).map(t=>t.value.trim()).filter(Boolean);
      if(id){
        const i = rrhh.findIndex(r=>r.id===id);
        if(i>=0){ rrhh[i] = Object.assign(rrhh[i], {nombre,apellido,ci,fn,fi,rango,cargo,descriptions,photo:photoData}); }
      } else {
        rrhh.push({id:Date.now().toString(),nombre,apellido,ci,fn,fi,rango,cargo,descriptions,photo:photoData});
      }
      saveRRHH(rrhh);
      if(rrhhModal) rrhhModal.hide();
      if(typeof window.SIG !== 'undefined' && window.SIG.renderRRHH) window.SIG.renderRRHH();
    }

    if(fotoInput && fotoInput.files && fotoInput.files[0]){
      const reader=new FileReader();
      reader.onload=function(e){applySave(e.target.result)};
      reader.readAsDataURL(fotoInput.files[0]);
    } else {
      const existing = id ? rrhh.find(r=>r.id===id) : null;
      applySave(existing?existing.photo:null);
    }
  });
}

// Render RRHH list
function renderRRHH(filter=''){
  const table = $('rrhhTable');
  if(!table) return; // nothing to render on this page
  const arr = getRRHH();
  const q = filter.trim().toLowerCase();
  const filtered = q ? arr.filter(r => (r.nombre + ' ' + r.apellido + ' ' + r.ci).toLowerCase().includes(q)) : arr;
  table.innerHTML = '';
  if(filtered.length === 0){ table.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay funcionarios registrados.</td></tr>'; return; }
  filtered.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td style="width:72px"><img src="${r.photo||'/img/logotipo.png'}" alt="foto" style="width:64px;height:64px;object-fit:cover;border-radius:6px"></td>
      <td>${escapeHtml(r.ci)}</td>
      <td>${escapeHtml(r.nombre)} ${escapeHtml(r.apellido)}</td>
      <td>${escapeHtml(r.rango||'')} / ${escapeHtml(r.cargo||'')}</td>
      <td class="text-end">
        <div class="btn-group">
          <button class="btn btn-sm btn-outline-primary me-1 viewBtn" data-id="${r.id}">Ver</button>
          <button class="btn btn-sm btn-outline-secondary me-1 editBtn" data-id="${r.id}">Editar</button>
          <button class="btn btn-sm btn-outline-danger delBtn" data-id="${r.id}">Eliminar</button>
        </div>
      </td>`;
    table.appendChild(tr);
  });
  // attach handlers
  Array.from(document.getElementsByClassName('viewBtn')).forEach(b=>b.addEventListener('click',()=>openView(b.dataset.id)));
  Array.from(document.getElementsByClassName('editBtn')).forEach(b=>b.addEventListener('click',()=>openEdit(b.dataset.id)));
  Array.from(document.getElementsByClassName('delBtn')).forEach(b=>b.addEventListener('click',()=>delRrhh(b.dataset.id)));
}

function escapeHtml(s){return (s||'').toString().replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]));}

function openView(id){
  const rrhh=getRRHH().find(r=>r.id===id);if(!rrhh)return;
  const html=[];
  html.push(`<div class="d-flex gap-3"><div style="width:140px"><img src="${rrhh.photo||'/img/logotipo.png'}" style="width:140px;height:140px;object-fit:cover;border-radius:6px"></div><div><h5>${escapeHtml(rrhh.nombre)} ${escapeHtml(rrhh.apellido)}</h5><p><strong>C.I.:</strong> ${escapeHtml(rrhh.ci)}</p><p><strong>Rango:</strong> ${escapeHtml(rrhh.rango||'')}</p><p><strong>Cargo:</strong> ${escapeHtml(rrhh.cargo||'')}</p></div></div>`);
  if(rrhh.fn) html.push(`<p><strong>Fecha de nacimiento:</strong> ${escapeHtml(rrhh.fn)}</p>`);
  if(rrhh.fi) html.push(`<p><strong>Fecha de ingreso:</strong> ${escapeHtml(rrhh.fi)}</p>`);
  if(rrhh.descriptions && rrhh.descriptions.length){html.push('<hr><h6>Descripciones</h6>'); rrhh.descriptions.forEach((d,i)=>html.push(`<p><strong>${i+1}.</strong> ${escapeHtml(d)}</p>`));}
  document.getElementById('viewBody').innerHTML=html.join('');
  if(viewModal) viewModal.show();
}

function openEdit(id){
  const r=getRRHH().find(x=>x.id===id); if(!r) return;
  if($('rrhhId')) $('rrhhId').value = r.id;
  if($('rrhhNombre')) $('rrhhNombre').value = r.nombre;
  if($('rrhhApellido')) $('rrhhApellido').value = r.apellido;
  if($('rrhhCI')) $('rrhhCI').value = r.ci;
  if($('rrhhFN')) $('rrhhFN').value = r.fn||'';
  if($('rrhhFI')) $('rrhhFI').value = r.fi||'';
  if($('rrhhRango')) $('rrhhRango').value = r.rango||'';
  if($('rrhhCargo')) $('rrhhCargo').value = r.cargo||'';
  clearDescriptions();
  (r.descriptions||[]).forEach(d=>addDescriptionField(d));
  if(rrhhModal) rrhhModal.show();
}

function delRrhh(id){if(!confirm('¿Eliminar funcionario?')) return; let arr=getRRHH(); arr=arr.filter(r=>r.id!==id); saveRRHH(arr); renderRRHH();}

// Search handlers
if($('rrhhSearch')) $('rrhhSearch').addEventListener('input', (e) => renderRRHH(e.target.value));

// OPERACIONES search - reuse rrhh list
if($('operSearchBtn') && $('operSearch') && $('operResults')){
  $('operSearchBtn').addEventListener('click',()=>{
    const q=$('operSearch').value.trim();
    const arr=getRRHH().filter(r=> (r.nombre+' '+r.apellido+' '+r.ci).toLowerCase().includes(q.toLowerCase()) );
    const container=$('operResults');
    if(arr.length===0){container.innerHTML='<p class="text-muted">No se encontraron resultados.</p>';return}
    container.innerHTML = arr.map(r=>`<div class="card mb-2"><div class="card-body d-flex align-items-center"><img src="${r.photo||'/img/logotipo.png'}" style="width:64px;height:64px;object-fit:cover;border-radius:6px;margin-right:12px"><div><div><strong>${escapeHtml(r.nombre)} ${escapeHtml(r.apellido)}</strong> — ${escapeHtml(r.ci)}</div><div class="text-muted">${escapeHtml(r.rango||'')} / ${escapeHtml(r.cargo||'')}</div></div></div></div>`).join('');
  });
}

// ICAP: register sanction
if($('icapNewBtn') && $('icapForm') && icapModal){
  $('icapNewBtn').addEventListener('click',()=>{$('icapForm').reset(); icapModal.show();});
}
if($('saveIcapBtn')){
  $('saveIcapBtn').addEventListener('click',()=>{
    const ci = $('icapCI') ? $('icapCI').value.trim() : '';
    if(!ci){alert('Ingrese C.I.');return}
    const tipo = $('icapTipo') ? $('icapTipo').value : '';
    const desc = $('icapDesc') ? $('icapDesc').value.trim() : '';
    const rrhh = getRRHH(); const person = rrhh.find(r=>r.ci===ci);
    const sanctions = getSanctions();
    const entry = {id:Date.now().toString(),ci, tipo, desc, datetime:(new Date()).toISOString(), name: person? `${person.nombre} ${person.apellido}` : null};
    sanctions.unshift(entry); saveSanctions(sanctions); if(icapModal) icapModal.hide(); if(typeof window.SIG !== 'undefined' && window.SIG.renderIcap) window.SIG.renderIcap();
  });
}

function renderIcap(filter=''){
  const q=filter.trim().toLowerCase(); const sanctions=getSanctions();
  const filtered = q? sanctions.filter(s=> (s.ci+' '+(s.name||'')+' '+s.tipo).toLowerCase().includes(q) ) : sanctions;
  const container = $('icapResults');
  if(!container) return;
  if(filtered.length===0){container.innerHTML='<p class="text-muted">No hay sanciones registradas.</p>';return}
  container.innerHTML = `<div class="list-group">`+filtered.map(s=>`<div class="list-group-item"><div class="d-flex w-100 justify-content-between"><div><strong>${escapeHtml(s.name||'Sin registro')}</strong> <small class="text-muted">(${escapeHtml(s.ci)})</small></div><small>${new Date(s.datetime).toLocaleString()}</small></div><p class="mb-1">Tipo: ${escapeHtml(s.tipo)}</p><small class="text-muted">${escapeHtml(s.desc||'')}</small></div>`).join('')+`</div>`;
}

if($('icapSearch')) $('icapSearch').addEventListener('input',(e)=>renderIcap(e.target.value));

// Initial render (only when relevant elements exist)
if($('rrhhTable')) renderRRHH();
if($('icapResults')) renderIcap();

// expose some useful functions to window for debugging and page code
window.SIG = Object.assign(window.SIG||{}, {getRRHH, getSanctions, renderRRHH, renderIcap, openView, openEdit, delRrhh});
