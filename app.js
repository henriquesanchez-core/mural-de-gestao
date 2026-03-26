// ─────────────────────────────────────────────────────────────────────────────
// Storage
// ─────────────────────────────────────────────────────────────────────────────
const SHEETS_KEY = 'gestao_planilhas_v1';
const EVENTS_KEY = 'gestao_eventos_v1';

function loadSheets() {
  try { return JSON.parse(localStorage.getItem(SHEETS_KEY)) || []; } catch { return []; }
}
function saveSheets(data) { localStorage.setItem(SHEETS_KEY, JSON.stringify(data)); }

function loadEvents() {
  try { return JSON.parse(localStorage.getItem(EVENTS_KEY)) || []; } catch { return []; }
}
function saveEvents(data) { localStorage.setItem(EVENTS_KEY, JSON.stringify(data)); }

// ─────────────────────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────────────────────
let sheets = loadSheets();
let events = loadEvents();
let searchQuery = '';

const today = new Date();
let calView  = 'month';          // 'month' | 'week'
let calCursor = new Date(today.getFullYear(), today.getMonth(), 1);

const EVENT_COLORS = {
  blue:   '#2563eb',
  violet: '#7c3aed',
  green:  '#059669',
  amber:  '#d97706',
  pink:   '#db2777',
  red:    '#dc2626',
};

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

function toYMD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2,'0');
  const d = String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}

function isSameDay(a, b) {
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
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
    if (btn.dataset.tab === 'calendar') renderCalendar();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ── SHEETS ───────────────────────────────────────────────────────────────────
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

  // update datalist
  const cats = [...new Set(sheets.map(s => s.category).filter(Boolean))];
  document.getElementById('categorySuggestions').innerHTML = cats.map(c => `<option value="${esc(c)}">`).join('');
}

// Sheet modal
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
  editId.value  = s.id;
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

  const name = inputName.value.trim();
  const link = inputLink.value.trim();
  const category = inputCat.value.trim();
  const desc = inputDesc.value.trim();
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

// ─────────────────────────────────────────────────────────────────────────────
// ── CALENDAR ─────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
const calendarWrap = document.getElementById('calendarWrap');
const calTitle     = document.getElementById('calTitle');

const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DAY_SHORT   = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

function eventsOnDate(ymd) {
  return events.filter(e => e.date === ymd).sort((a,b) => (a.startTime||'') > (b.startTime||'') ? 1 : -1);
}

function eventColor(ev) { return EVENT_COLORS[ev.color] || EVENT_COLORS.blue; }

// ── Month view ────────────────────────────────────────────────────────────────
function renderMonth() {
  const year  = calCursor.getFullYear();
  const month = calCursor.getMonth();
  calTitle.textContent = `${MONTH_NAMES[month]} ${year}`;

  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const daysInPrev  = new Date(year, month, 0).getDate();

  let cells = [];

  // leading days from prev month
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month-1, daysInPrev-i), otherMonth: true });
  }
  // current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), otherMonth: false });
  }
  // trailing days to complete last row (always show 6 rows = 42 cells)
  let trailing = 1;
  while (cells.length < 42) {
    cells.push({ date: new Date(year, month+1, trailing++), otherMonth: true });
  }

  const headHtml = DAY_SHORT.map(d => `<div class="cal-month-head-cell">${d}</div>`).join('');

  const bodyHtml = cells.map(cell => {
    const ymd = toYMD(cell.date);
    const isToday = isSameDay(cell.date, today);
    const dayEvents = eventsOnDate(ymd);
    const maxShow = 3;
    const chips = dayEvents.slice(0, maxShow).map(ev => {
      const label = ev.startTime ? `${ev.startTime} ${esc(ev.title)}` : esc(ev.title);
      return `<div class="cal-event-chip" style="background:${eventColor(ev)}" onclick="event.stopPropagation();openEventEdit('${ev.id}')" title="${esc(ev.title)}">${label}</div>`;
    }).join('');
    const more = dayEvents.length > maxShow ? `<div class="cal-more">+${dayEvents.length - maxShow} mais</div>` : '';

    return `
      <div class="cal-day${cell.otherMonth?' other-month':''}${isToday?' today':''}" onclick="openNewEventOnDate('${ymd}')">
        <div class="cal-day-num">${cell.date.getDate()}</div>
        ${chips}${more}
      </div>`;
  }).join('');

  calendarWrap.innerHTML = `
    <div class="cal-month">
      <div class="cal-month-head">${headHtml}</div>
      <div class="cal-month-body">${bodyHtml}</div>
    </div>`;
}

// ── Week view ─────────────────────────────────────────────────────────────────
function getWeekDays(cursor) {
  // Week starting on Sunday
  const d = new Date(cursor);
  const dow = d.getDay();
  const start = new Date(d);
  start.setDate(d.getDate() - dow);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    return day;
  });
}

function renderWeek() {
  const days = getWeekDays(calCursor);
  const startFmt = days[0].toLocaleDateString('pt-BR', { day:'2-digit', month:'short' });
  const endFmt   = days[6].toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric' });
  calTitle.textContent = `${startFmt} – ${endFmt}`;

  const headHtml = days.map(day => {
    const isToday = isSameDay(day, today);
    return `
      <div class="cal-week-head-cell${isToday?' today':''}">
        <div class="cal-week-head-day">${DAY_SHORT[day.getDay()]}</div>
        <div class="cal-week-head-num">${day.getDate()}</div>
      </div>`;
  }).join('');

  const bodyHtml = days.map(day => {
    const ymd = toYMD(day);
    const dayEvents = eventsOnDate(ymd);
    const evHtml = dayEvents.map(ev => `
      <div class="cal-week-event" style="background:${eventColor(ev)}" onclick="event.stopPropagation();openEventEdit('${ev.id}')">
        <div class="cal-week-event-title">${esc(ev.title)}</div>
        ${ev.startTime ? `<div class="cal-week-event-time">${ev.startTime}${ev.endTime ? ' – '+ev.endTime : ''}</div>` : ''}
      </div>`).join('');
    return `
      <div class="cal-week-col" onclick="openNewEventOnDate('${ymd}')">
        ${evHtml}
        <div class="cal-week-col-add">+ Adicionar</div>
      </div>`;
  }).join('');

  calendarWrap.innerHTML = `
    <div class="cal-week">
      <div class="cal-week-head">${headHtml}</div>
      <div class="cal-week-body">${bodyHtml}</div>
    </div>`;
}

function renderCalendar() {
  if (calView === 'month') renderMonth();
  else renderWeek();
}

// ── Navigation ────────────────────────────────────────────────────────────────
document.getElementById('btnPrev').addEventListener('click', () => {
  if (calView === 'month') {
    calCursor.setMonth(calCursor.getMonth() - 1);
  } else {
    calCursor.setDate(calCursor.getDate() - 7);
  }
  renderCalendar();
});

document.getElementById('btnNext').addEventListener('click', () => {
  if (calView === 'month') {
    calCursor.setMonth(calCursor.getMonth() + 1);
  } else {
    calCursor.setDate(calCursor.getDate() + 7);
  }
  renderCalendar();
});

document.getElementById('btnToday').addEventListener('click', () => {
  calCursor = new Date(today.getFullYear(), today.getMonth(), 1);
  renderCalendar();
});

document.querySelectorAll('.view-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    calView = btn.dataset.view;
    // keep cursor anchored to current month start for month view
    if (calView === 'week') {
      calCursor = new Date(today); // jump to today's week
    } else {
      calCursor = new Date(today.getFullYear(), today.getMonth(), 1);
    }
    renderCalendar();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ── EVENT MODAL ───────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
const eventOverlay    = document.getElementById('eventModalOverlay');
const eventForm       = document.getElementById('eventForm');
const eventModalTitle = document.getElementById('eventModalTitle');
const eventEditId     = document.getElementById('eventEditId');
const eventTitleInput = document.getElementById('eventTitle');
const eventDateInput  = document.getElementById('eventDate');
const eventStartInput = document.getElementById('eventStart');
const eventEndInput   = document.getElementById('eventEnd');
const eventDescInput  = document.getElementById('eventDesc');
const errorEvTitle    = document.getElementById('errorEventTitle');
const errorEvDate     = document.getElementById('errorEventDate');

let selectedColor = 'blue';

// Color swatches
document.querySelectorAll('.color-swatch').forEach(swatch => {
  swatch.addEventListener('click', () => {
    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
    swatch.classList.add('active');
    selectedColor = swatch.dataset.color;
  });
});

function openEventModal() { eventOverlay.classList.add('open'); eventTitleInput.focus(); }

function closeEventModal() {
  eventOverlay.classList.remove('open');
  eventForm.reset();
  eventEditId.value = '';
  errorEvTitle.textContent = '';
  errorEvDate.textContent = '';
  eventTitleInput.classList.remove('invalid');
  eventDateInput.classList.remove('invalid');
  // reset color
  selectedColor = 'blue';
  document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
  document.querySelector('.color-swatch[data-color="blue"]').classList.add('active');
  eventModalTitle.textContent = 'Novo Evento';
}

function openNewEventOnDate(ymd) {
  eventEditId.value = '';
  eventDateInput.value = ymd;
  eventModalTitle.textContent = 'Novo Evento';
  openEventModal();
}

function openEventEdit(id) {
  const ev = events.find(e => e.id === id);
  if (!ev) return;
  eventModalTitle.textContent = 'Editar Evento';
  eventEditId.value    = ev.id;
  eventTitleInput.value = ev.title;
  eventDateInput.value  = ev.date;
  eventStartInput.value = ev.startTime || '';
  eventEndInput.value   = ev.endTime || '';
  eventDescInput.value  = ev.desc || '';
  selectedColor = ev.color || 'blue';
  document.querySelectorAll('.color-swatch').forEach(s => {
    s.classList.toggle('active', s.dataset.color === selectedColor);
  });
  openEventModal();
}

document.getElementById('btnNewEvent').addEventListener('click', () => {
  eventEditId.value = '';
  eventModalTitle.textContent = 'Novo Evento';
  openEventModal();
});
document.getElementById('btnCloseEventModal').addEventListener('click', closeEventModal);
document.getElementById('btnCancelEvent').addEventListener('click', closeEventModal);
eventOverlay.addEventListener('click', e => { if (e.target === eventOverlay) closeEventModal(); });

eventForm.addEventListener('submit', e => {
  e.preventDefault();
  errorEvTitle.textContent = '';
  errorEvDate.textContent  = '';
  eventTitleInput.classList.remove('invalid');
  eventDateInput.classList.remove('invalid');

  const title     = eventTitleInput.value.trim();
  const date      = eventDateInput.value;
  const startTime = eventStartInput.value || '';
  const endTime   = eventEndInput.value   || '';
  const desc      = eventDescInput.value.trim();
  let ok = true;

  if (!title) { errorEvTitle.textContent = 'Informe um título.'; eventTitleInput.classList.add('invalid'); ok = false; }
  if (!date)  { errorEvDate.textContent  = 'Informe a data.';   eventDateInput.classList.add('invalid');  ok = false; }
  if (!ok) return;

  const id = eventEditId.value;
  if (id) {
    const ev = events.find(x => x.id === id);
    if (ev) Object.assign(ev, { title, date, startTime, endTime, desc, color: selectedColor });
    showToast('Evento atualizado!');
  } else {
    events.push({ id: crypto.randomUUID(), title, date, startTime, endTime, desc, color: selectedColor, createdAt: Date.now() });
    showToast('Evento adicionado!');
  }
  saveEvents(events);
  renderCalendar();
  closeEventModal();
});

// Delete event (called from edit modal — add button dynamically)
function deleteEvent(id) {
  if (!confirm('Deseja mesmo excluir este evento?')) return;
  events = events.filter(e => e.id !== id);
  saveEvents(events);
  renderCalendar();
  closeEventModal();
  showToast('Evento removido.');
}

// Add delete button to event modal when editing
const origOpenEventEdit = openEventEdit;
window.openEventEdit = function(id) {
  origOpenEventEdit(id);
  // Append delete button if not already there
  let delBtn = document.getElementById('btnDeleteEvent');
  if (!delBtn) {
    delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.id = 'btnDeleteEvent';
    delBtn.className = 'btn-secondary';
    delBtn.style.cssText = 'color:#dc2626;border-color:#fca5a5;margin-right:auto';
    delBtn.textContent = 'Excluir';
    document.querySelector('.modal-actions').prepend(delBtn);
  }
  delBtn.onclick = () => deleteEvent(id);
};

// ─────────────────────────────────────────────────────────────────────────────
// Keyboard
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (sheetOverlay.classList.contains('open')) closeSheetModal();
  if (eventOverlay.classList.contains('open')) closeEventModal();
});

// ─────────────────────────────────────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────────────────────────────────────
renderSheets();
