/* rrhhPage.js
   Page-specific JavaScript for `rrhh.html`.
   - Injects modal markup expected by `scriptHome.js` (shared logic)
   - Wires page buttons and search input
   - Renders the RR-HH table using the shared `window.SIG` API
   Storage keys used by shared code: 'rrhh'
*/

(function(){
  // inject modals used by the shared script
  const tpl = `
  <div class="modal fade" id="rrhhModal" tabindex="-1">
    <div class="modal-dialog modal-lg modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Agregar / Editar funcionario</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <form id="rrhhForm">
            <input type="hidden" id="rrhhId">
            <div class="row g-2">
              <div class="col-md-6"><label class="form-label">Nombre</label><input id="rrhhNombre" class="form-control" required></div>
              <div class="col-md-6"><label class="form-label">Apellido</label><input id="rrhhApellido" class="form-control" required></div>
              <div class="col-md-4"><label class="form-label">C.I.</label><input id="rrhhCI" class="form-control" required></div>
              <div class="col-md-4"><label class="form-label">Fecha de nacimiento</label><input id="rrhhFN" type="date" class="form-control"></div>
              <div class="col-md-4"><label class="form-label">Fecha de ingreso</label><input id="rrhhFI" type="date" class="form-control"></div>
              <div class="col-md-4"><label class="form-label">Rango</label><input id="rrhhRango" class="form-control"></div>
              <div class="col-md-4"><label class="form-label">Cargo / División</label><input id="rrhhCargo" class="form-control"></div>
              <div class="col-md-4"><label class="form-label">Foto (identificación)</label><input id="rrhhFoto" type="file" accept="image/*" class="form-control"></div>
            </div>
            <hr>
            <div>
              <label class="form-label">Descripciones (opcional)</label>
              <div id="descriptionsContainer"></div>
              <button id="addDescBtn" type="button" class="btn btn-sm btn-outline-secondary mt-2">Agregar campo de descripción</button>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
          <button id="saveRrhhBtn" type="button" class="btn btn-primary">Guardar</button>
        </div>
      </div>
    </div>
  </div>`;

  const viewTpl = `
  <div class="modal fade" id="viewModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Detalles del funcionario</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body" id="viewBody"></div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
        </div>
      </div>
    </div>
  </div>`;

  const placeholder = document.getElementById('modalsPlaceholder');
  if(placeholder) placeholder.innerHTML = tpl + viewTpl;

  // helper to render the table using window.SIG if available
  function renderPage(){
    const arr = window.SIG && typeof window.SIG.getRRHH === 'function' ? window.SIG.getRRHH() : JSON.parse(localStorage.getItem('rrhh')||'[]');
    const tbody=document.getElementById('rrhhTablePage');
    if(!tbody) return;
    if(arr.length===0){
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay funcionarios registrados.</td></tr>';
      return;
    }
    tbody.innerHTML = arr.map(r=>`<tr><td style="width:72px"><img src="${r.photo||'/img/logotipo.png'}" alt="foto" style="width:64px;height:64px;object-fit:cover;border-radius:6px"></td><td>${r.ci}</td><td>${r.nombre} ${r.apellido}</td><td>${r.rango||''} / ${r.cargo||''}</td><td class="text-end"><div class="btn-group"><button class="btn btn-sm btn-outline-primary viewBtn" data-id="${r.id}">Ver</button><button class="btn btn-sm btn-outline-secondary editBtn" data-id="${r.id}">Editar</button><button class="btn btn-sm btn-outline-danger delBtn" data-id="${r.id}">Eliminar</button></div></td></tr>`).join('');

    Array.from(document.getElementsByClassName('viewBtn')).forEach(b=>b.addEventListener('click',()=>{
      if(window.SIG && typeof window.SIG.openView === 'function') window.SIG.openView(b.dataset.id);
    }));

    Array.from(document.getElementsByClassName('editBtn')).forEach(b=>b.addEventListener('click',()=>{
      if(window.SIG && typeof window.SIG.openEdit === 'function') window.SIG.openEdit(b.dataset.id);
    }));

    Array.from(document.getElementsByClassName('delBtn')).forEach(b=>b.addEventListener('click',()=>{
      if(!confirm('¿Eliminar funcionario?')) return;
      if(window.SIG && typeof window.SIG.getRRHH === 'function'){
        let arr = window.SIG.getRRHH();
        arr = arr.filter(x=>x.id!==b.dataset.id);
        localStorage.setItem('rrhh',JSON.stringify(arr));
        renderPage();
      }
    }));
  }

  // Add button opens modal (modal form is handled by shared script)
  const addBtn = document.getElementById('rrhhAddPageBtn');
  if(addBtn){
    addBtn.addEventListener('click',()=>{
      const form = document.getElementById('rrhhForm');
      if(form) form.reset();
      const idField = document.getElementById('rrhhId'); if(idField) idField.value='';
      const desc = document.getElementById('descriptionsContainer'); if(desc) desc.innerHTML='';
      const modalEl = document.getElementById('rrhhModal'); if(modalEl) new bootstrap.Modal(modalEl).show();
    });
  }

  // search
  const searchInput = document.getElementById('rrhhSearchPage');
  if(searchInput){
    searchInput.addEventListener('input',()=>{
      const q = searchInput.value.trim().toLowerCase();
      const arr = window.SIG && typeof window.SIG.getRRHH === 'function' ? window.SIG.getRRHH() : JSON.parse(localStorage.getItem('rrhh')||'[]');
      const filtered = arr.filter(r=> (r.nombre+' '+r.apellido+' '+r.ci).toLowerCase().includes(q));
      const tbody = document.getElementById('rrhhTablePage');
      if(!tbody) return;
      if(filtered.length===0){
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay resultados.</td></tr>';
        return;
      }
      tbody.innerHTML = filtered.map(r=>`<tr><td style="width:72px"><img src="${r.photo||'/img/logotipo.png'}" alt="foto" style="width:64px;height:64px;object-fit:cover;border-radius:6px"></td><td>${r.ci}</td><td>${r.nombre} ${r.apellido}</td><td>${r.rango||''} / ${r.cargo||''}</td><td class="text-end"><div class="btn-group"><button class="btn btn-sm btn-outline-primary viewBtn" data-id="${r.id}">Ver</button><button class="btn btn-sm btn-outline-secondary editBtn" data-id="${r.id}">Editar</button><button class="btn btn-sm btn-outline-danger delBtn" data-id="${r.id}">Eliminar</button></div></td></tr>`).join('');
      Array.from(document.getElementsByClassName('viewBtn')).forEach(b=>b.addEventListener('click',()=>{ if(window.SIG && typeof window.SIG.openView === 'function') window.SIG.openView(b.dataset.id); }));
    });
  }

  // initial render (delay to allow scriptHome to expose API)
  setTimeout(renderPage,200);
})();
