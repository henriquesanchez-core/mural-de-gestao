// ─────────────────────────────────────────────────────────────────────────────
// Storage
// ─────────────────────────────────────────────────────────────────────────────
const SHEETS_KEY = 'gestao_planilhas_v1';

function loadSheets() {
  try { return JSON.parse(localStorage.getItem(SHEETS_KEY)) || []; } catch { return []; }
}
function saveSheets(data) { localStorage.setItem(SHEETS_KEY, JSON.stringify(data)); }

// ─────────────────────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────────────────────
let sheets = loadSheets();
let searchQuery = '';

const SHEET_COLORS = ['#2563eb','#7c3aed','#059669','#d97706','#db2777','#0891b2','#65a30d','#ea580c'];

// ─────────────────────────────────────────────────────────────────────────────
// Utility
// ─────────────────────────────────────────────────────────────────────────────
function esc(str) {
  return String(str ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function isValidUrl(str) {
  try { return ['http:','https:'].includes(new URL(str).protocol); } catch { return false; }
}

// ─────────────────────────────────────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────────────────────────────────────
const toast = document.getElementById('toast');
let toastTimer;
function showToast(msg) {
  clearTimeout(toastTimer);
  toast.textContent = msg;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

// ─────────────────────────────────────────────────────────────────────────────
// Tabs
// ─────────────────────────────────────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Sheets — render
// ─────────────────────────────────────────────────────────────────────────────
const cardsGrid   = document.getElementById('cardsGrid');
const emptyState  = document.getElementById('emptyState');
const countBadge  = document.getElementById('countBadge');
const searchInput = document.getElementById('searchInput');

function renderSheets() {
  const q = searchQuery.toLowerCase().trim();
  const filtered = q ? sheets.filter(s =>
    s.name.toLowerCase().includes(q) ||
    (s.category||'').toLowerCase().includes(q) ||
    (s.desc||'').toLowerCase().includes(q)
  ) : sheets;

  countBadge.textContent = filtered.length === 1 ? '1 planilha' : `${filtered.length} planilhas`;

  if (!filtered.length) {
    emptyState.classList.add('visible');
    cardsGrid.innerHTML = '';
    return;
  }
  emptyState.classList.remove('visible');
  cardsGrid.innerHTML = filtered.map(sheet => {
    const idx = sheets.indexOf(sheet);
    const color = SHEET_COLORS[idx % SHEET_COLORS.length];
    const date = new Date(sheet.createdAt).toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric' });
    return `
      <div class="card" data-id="${sheet.id}">
        <div class="card-color-bar" style="background:${color}"></div>
        <div class="card-body">
          ${sheet.category ? `<span class="card-category">${esc(sheet.category)}</span>` : ''}
          <div class="card-name">${esc(sheet.name)}</div>
          ${sheet.desc ? `<div class="card-desc">${esc(sheet.desc)}</div>` : ''}
          <div class="card-date">Adicionada em ${date}</div>
        </div>
        <div class="card-footer">
          <a class="card-link" href="${esc(sheet.link)}" target="_blank" rel="noopener noreferrer">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            Abrir planilha
          </a>
          <div class="card-actions">
            <button class="btn-icon" title="Editar" onclick="openSheetEdit('${sheet.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="btn-icon danger" title="Excluir" onclick="deleteSheet('${sheet.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>`;
  }).join('');

  const cats = [...new Set(sheets.map(s => s.category).filter(Boolean))];
  document.getElementById('categorySuggestions').innerHTML = cats.map(c => `<option value="${esc(c)}">`).join('');
}

// ─────────────────────────────────────────────────────────────────────────────
// Sheets — modal
// ─────────────────────────────────────────────────────────────────────────────
const sheetOverlay = document.getElementById('modalOverlay');
const sheetForm    = document.getElementById('sheetForm');
const modalTitle   = document.getElementById('modalTitle');
const editId       = document.getElementById('editId');
const inputName    = document.getElementById('inputName');
const inputLink    = document.getElementById('inputLink');
const inputCat     = document.getElementById('inputCategory');
const inputDesc    = document.getElementById('inputDesc');
const errorName    = document.getElementById('errorName');
const errorLink    = document.getElementById('errorLink');

function openSheetModal() { sheetOverlay.classList.add('open'); inputName.focus(); }

function closeSheetModal() {
  sheetOverlay.classList.remove('open');
  sheetForm.reset();
  editId.value = '';
  errorName.textContent = '';
  errorLink.textContent = '';
  inputName.classList.remove('invalid');
  inputLink.classList.remove('invalid');
  modalTitle.textContent = 'Nova Planilha';
}

function openSheetEdit(id) {
  const s = sheets.find(x => x.id === id);
  if (!s) return;
  modalTitle.textContent = 'Editar Planilha';
  editId.value    = s.id;
  inputName.value = s.name;
  inputLink.value = s.link;
  inputCat.value  = s.category || '';
  inputDesc.value = s.desc || '';
  openSheetModal();
}

function deleteSheet(id) {
  if (!confirm('Deseja mesmo excluir esta planilha do mural?')) return;
  sheets = sheets.filter(s => s.id !== id);
  saveSheets(sheets);
  renderSheets();
  showToast('Planilha removida.');
}

document.getElementById('btnOpenModal').addEventListener('click', () => {
  editId.value = '';
  modalTitle.textContent = 'Nova Planilha';
  openSheetModal();
});
document.getElementById('btnCloseModal').addEventListener('click', closeSheetModal);
document.getElementById('btnCancel').addEventListener('click', closeSheetModal);
sheetOverlay.addEventListener('click', e => { if (e.target === sheetOverlay) closeSheetModal(); });

sheetForm.addEventListener('submit', e => {
  e.preventDefault();
  errorName.textContent = '';
  errorLink.textContent = '';
  inputName.classList.remove('invalid');
  inputLink.classList.remove('invalid');

  const name     = inputName.value.trim();
  const link     = inputLink.value.trim();
  const category = inputCat.value.trim();
  const desc     = inputDesc.value.trim();
  let ok = true;

  if (!name) { errorName.textContent = 'Informe um nome.'; inputName.classList.add('invalid'); ok = false; }
  if (!link) { errorLink.textContent = 'Informe o link.'; inputLink.classList.add('invalid'); ok = false; }
  else if (!isValidUrl(link)) { errorLink.textContent = 'URL inválida.'; inputLink.classList.add('invalid'); ok = false; }
  if (!ok) return;

  const id = editId.value;
  if (id) {
    const s = sheets.find(x => x.id === id);
    if (s) Object.assign(s, { name, link, category, desc });
    showToast('Planilha atualizada!');
  } else {
    sheets.push({ id: crypto.randomUUID(), name, link, category, desc, createdAt: Date.now() });
    showToast('Planilha adicionada!');
  }
  saveSheets(sheets);
  renderSheets();
  closeSheetModal();
});

searchInput.addEventListener('input', e => { searchQuery = e.target.value; renderSheets(); });

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && sheetOverlay.classList.contains('open')) closeSheetModal();
});

// ─────────────────────────────────────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────────────────────────────────────
renderSheets();
