// ── Storage ──────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'gestao_planilhas_v1';

function loadSheets() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}

function saveSheets(sheets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sheets));
}

// ── State ─────────────────────────────────────────────────────────────────────
let sheets = loadSheets();
let searchQuery = '';

// ── Color palette (cycling) ───────────────────────────────────────────────────
const COLORS = [
  '#2563eb', '#7c3aed', '#059669', '#d97706',
  '#db2777', '#0891b2', '#65a30d', '#ea580c',
];

function colorForIndex(idx) {
  return COLORS[idx % COLORS.length];
}

// ── DOM refs ──────────────────────────────────────────────────────────────────
const cardsGrid      = document.getElementById('cardsGrid');
const emptyState     = document.getElementById('emptyState');
const countBadge     = document.getElementById('countBadge');
const searchInput    = document.getElementById('searchInput');
const modalOverlay   = document.getElementById('modalOverlay');
const sheetForm      = document.getElementById('sheetForm');
const modalTitle     = document.getElementById('modalTitle');
const editId         = document.getElementById('editId');
const inputName      = document.getElementById('inputName');
const inputLink      = document.getElementById('inputLink');
const inputCategory  = document.getElementById('inputCategory');
const inputDesc      = document.getElementById('inputDesc');
const errorName      = document.getElementById('errorName');
const errorLink      = document.getElementById('errorLink');
const categorySugg   = document.getElementById('categorySuggestions');
const toast          = document.getElementById('toast');

// ── Render ────────────────────────────────────────────────────────────────────
function render() {
  const query = searchQuery.toLowerCase().trim();
  const filtered = query
    ? sheets.filter(s =>
        s.name.toLowerCase().includes(query) ||
        (s.category || '').toLowerCase().includes(query) ||
        (s.desc || '').toLowerCase().includes(query)
      )
    : sheets;

  const label = filtered.length === 1 ? '1 planilha' : `${filtered.length} planilhas`;
  countBadge.textContent = label;

  if (filtered.length === 0) {
    emptyState.classList.add('visible');
    cardsGrid.innerHTML = '';
    return;
  }

  emptyState.classList.remove('visible');
  cardsGrid.innerHTML = filtered.map((sheet, i) => {
    const globalIdx = sheets.indexOf(sheet);
    const color = colorForIndex(globalIdx);
    const date = new Date(sheet.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
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
            <button class="btn-icon" title="Editar" onclick="openEdit('${sheet.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="btn-icon danger" title="Excluir" onclick="deleteSheet('${sheet.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/>
                <path d="M9 6V4h6v2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  updateCategorySuggestions();
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function updateCategorySuggestions() {
  const cats = [...new Set(sheets.map(s => s.category).filter(Boolean))];
  categorySugg.innerHTML = cats.map(c => `<option value="${esc(c)}">`).join('');
}

// ── Modal helpers ─────────────────────────────────────────────────────────────
function openModal() {
  modalOverlay.classList.add('open');
  inputName.focus();
}

function closeModal() {
  modalOverlay.classList.remove('open');
  sheetForm.reset();
  editId.value = '';
  clearErrors();
  modalTitle.textContent = 'Nova Planilha';
}

function clearErrors() {
  errorName.textContent = '';
  errorLink.textContent = '';
  inputName.classList.remove('invalid');
  inputLink.classList.remove('invalid');
}

// ── CRUD ──────────────────────────────────────────────────────────────────────
function openEdit(id) {
  const sheet = sheets.find(s => s.id === id);
  if (!sheet) return;
  modalTitle.textContent = 'Editar Planilha';
  editId.value = sheet.id;
  inputName.value = sheet.name;
  inputLink.value = sheet.link;
  inputCategory.value = sheet.category || '';
  inputDesc.value = sheet.desc || '';
  openModal();
}

function deleteSheet(id) {
  if (!confirm('Deseja mesmo excluir esta planilha do mural?')) return;
  sheets = sheets.filter(s => s.id !== id);
  saveSheets(sheets);
  render();
  showToast('Planilha removida.');
}

sheetForm.addEventListener('submit', (e) => {
  e.preventDefault();
  clearErrors();

  const name = inputName.value.trim();
  const link = inputLink.value.trim();
  const category = inputCategory.value.trim();
  const desc = inputDesc.value.trim();

  let valid = true;

  if (!name) {
    errorName.textContent = 'Informe um nome para a planilha.';
    inputName.classList.add('invalid');
    valid = false;
  }

  if (!link) {
    errorLink.textContent = 'Informe o link da planilha.';
    inputLink.classList.add('invalid');
    valid = false;
  } else if (!isValidUrl(link)) {
    errorLink.textContent = 'URL inválida. Inclua http:// ou https://';
    inputLink.classList.add('invalid');
    valid = false;
  }

  if (!valid) return;

  const id = editId.value;

  if (id) {
    const sheet = sheets.find(s => s.id === id);
    if (sheet) {
      sheet.name = name;
      sheet.link = link;
      sheet.category = category;
      sheet.desc = desc;
    }
    showToast('Planilha atualizada!');
  } else {
    sheets.push({ id: crypto.randomUUID(), name, link, category, desc, createdAt: Date.now() });
    showToast('Planilha adicionada!');
  }

  saveSheets(sheets);
  render();
  closeModal();
});

function isValidUrl(str) {
  try { return ['http:', 'https:'].includes(new URL(str).protocol); }
  catch { return false; }
}

// ── Toast ─────────────────────────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  clearTimeout(toastTimer);
  toast.textContent = msg;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

// ── Event listeners ───────────────────────────────────────────────────────────
document.getElementById('btnOpenModal').addEventListener('click', () => {
  editId.value = '';
  modalTitle.textContent = 'Nova Planilha';
  openModal();
});

document.getElementById('btnCloseModal').addEventListener('click', closeModal);
document.getElementById('btnCancel').addEventListener('click', closeModal);

modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalOverlay.classList.contains('open')) closeModal();
});

searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value;
  render();
});

// ── Init ──────────────────────────────────────────────────────────────────────
render();
