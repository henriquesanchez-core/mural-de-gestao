/**
 * DASHBOARDS — Registro de dashboards do painel
 * ─────────────────────────────────────────────
 * Cada entrada do array DASHBOARDS tem:
 *   id      — identificador único
 *   label   — nome exibido na sub-nav
 *   icon    — SVG opcional
 *   render  — função (sync ou async) que retorna HTML string
 */

const DASHBOARDS = [

  // ── Visão Geral ───────────────────────────────────────────────────────────
  {
    id: 'visao-geral',
    label: 'Visão Geral',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
             <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
           </svg>`,
    render() {
      const sheets = window._sheets || [];
      const e = v => String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
      return `
        <div class="dash-grid">
          <div class="dash-kpi-row">
            <div class="dash-kpi"><div class="dash-kpi-label">Total de Planilhas</div><div class="dash-kpi-value">${sheets.length}</div><div class="dash-kpi-sub">cadastradas no mural</div></div>
            <div class="dash-kpi"><div class="dash-kpi-label">Atualizações Semanais</div><div class="dash-kpi-value">${sheets.filter(s=>(s.cadence||'').toLowerCase().includes('semanal')).length}</div><div class="dash-kpi-sub">cadência semanal</div></div>
            <div class="dash-kpi"><div class="dash-kpi-label">Responsáveis</div><div class="dash-kpi-value">${new Set(sheets.map(s=>s.owner).filter(Boolean)).size}</div><div class="dash-kpi-sub">pessoas distintas</div></div>
            <div class="dash-kpi"><div class="dash-kpi-label">Categorias</div><div class="dash-kpi-value">${new Set(sheets.map(s=>s.category).filter(Boolean)).size}</div><div class="dash-kpi-sub">categorias ativas</div></div>
          </div>
          <div class="dash-card">
            <div class="dash-card-header"><h3 class="dash-card-title">Planilhas cadastradas</h3></div>
            <div class="dash-card-body">
              ${!sheets.length ? '<p class="dash-empty">Nenhuma planilha cadastrada ainda.</p>' : `
              <table class="dash-table"><thead><tr><th>Nome</th><th>Categoria</th><th>Responsável</th><th>Cadência</th></tr></thead>
              <tbody>${sheets.map(s=>`<tr><td><a href="${e(s.link)}" target="_blank" rel="noopener">${e(s.name)}</a></td><td>${e(s.category||'—')}</td><td>${e(s.owner||'—')}</td><td>${e(s.cadence||'—')}</td></tr>`).join('')}</tbody></table>`}
            </div>
          </div>
        </div>`;
    }
  },

  // ── Prazos de Roteiros ────────────────────────────────────────────────────
  {
    id: 'roteiros',
    label: 'Prazos de Roteiros',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
             <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
             <line x1="16" y1="17" x2="8" y2="17"/>
           </svg>`,

    config: {
      sheetId: '1NFx4lDqYh5dxejV-uZEFqjuVHGXHe7z3zfh5FV1h1n8',
      abas: [
        'Mariah ', 'Mª Carolina', 'Rafa Faria ', 'Rafael Nunes ', 'Pedro sz',
        'Yuri', 'Jhay', 'Sergio', 'Joyce', 'Junior ', 'Lucas Grigorio',
        'Joao', 'Juliano', 'Deivid', 'Davi', 'Madara teste', 'Amanda ',
        'Felipe ', 'Leandro', 'Eduarda Barboza', 'Rodrigo de Paula',
        'Pedro Barros', 'Lucas Nunes', 'Carol Nascimento', 'Rubens Sampaio',
        'Elaine Emideo', 'Leonardo Bonassi',
      ],
    },

    async fetchSheet(sheetId, aba) {
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&headers=1&sheet=${encodeURIComponent(aba)}`;
      const raw  = await fetch(url).then(r => r.text());
      const json = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1));
      const hdrs = json.table.cols || [];

      // Detecta colunas pelo nome do cabeçalho (cada aba pode ter ordem diferente)
      function n(s) {
        return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
      }
      function col(...patterns) {
        const i = hdrs.findIndex(c => {
          const label = n(c.label || c.id || '');
          return patterns.some(p => label.includes(p));
        });
        return i >= 0 ? i : -1;
      }

      const iCliente = col('cliente', 'mentorado', 'aluno');
      const iPlano   = col('plano', 'plan');
      const iPrazo   = col('prazo');
      const iStatus  = col('status');
      const iLeva    = col('leva atual', 'leva entregue', 'leva');
      const iTotal   = col('levas no total', 'total de levas');

      function parseDate(cell) {
        if (!cell?.v) return '';
        const m = String(cell.v).match(/Date\((\d+),(\d+),(\d+)\)/);
        if (m) {
          const year = +m[1];
          // Ano com menos de 4 dígitos é erro de digitação — ignora prazo
          if (year < 1000) return '';
          return new Date(year, +m[2], +m[3]).toISOString().slice(0, 10);
        }
        // Fallback: string formatada
        return cell.f ? String(cell.f) : '';
      }

      function cellVal(row, idx) {
        if (idx < 0 || !row.c?.[idx]) return '';
        const c = row.c[idx];
        return c.v != null ? String(c.v) : (c.f ? String(c.f) : '');
      }

      return (json.table.rows || [])
        .filter(row => row.c && iCliente >= 0 && row.c[iCliente]?.v)
        .map(row => ({
          estrategista: aba.trim(),
          cliente:      cellVal(row, iCliente),
          plano:        cellVal(row, iPlano),
          levaAtual:    cellVal(row, iLeva),
          totalLevas:   iTotal >= 0 ? cellVal(row, iTotal) : '',
          prazo:        parseDate(row.c?.[iPrazo]),
          status:       cellVal(row, iStatus) || 'ATIVO',
        }));
    },

    async render() {
      let clientes = [];
      if (this.config.sheetId) {
        const resultados = await Promise.all(
          this.config.abas.map(aba => this.fetchSheet(this.config.sheetId, aba))
        );
        clientes = resultados.flat();
      }

      const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
      const em7  = new Date(hoje); em7.setDate(hoje.getDate() + 7);

      function calcStatus(item) {
        const s = (item.status || '').toUpperCase().trim();
        if (s.includes('FINALIZADO'))               return 'finalizado';
        if (s.includes('PAUSADO'))                  return 'pausado';
        if (!item.prazo)                            return 'ativo';
        const p = new Date(item.prazo + 'T00:00:00');
        if (p < hoje)                               return 'vencido';
        if (p.getTime() === hoje.getTime())         return 'hoje';
        if (p <= em7)                               return 'proximos7';
        return 'ativo';
      }

      const dados      = clientes.map(e => ({ ...e, _st: calcStatus(e) }));
      const total      = dados.length;
      const vencidos   = dados.filter(e => e._st === 'vencido').length;
      const paraHoje   = dados.filter(e => e._st === 'hoje').length;
      const prox7      = dados.filter(e => e._st === 'proximos7').length;
      const ativos     = dados.filter(e => !['finalizado','pausado'].includes(e._st)).length;
      const pausados   = dados.filter(e => e._st === 'pausado').length;
      const finalizados= dados.filter(e => e._st === 'finalizado').length;

      const copies = [...new Set(dados.map(e => e.estrategista))].sort();

      const esc  = v => String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
      const fmtD = ymd => { if (!ymd) return '—'; const [y,m,d] = ymd.split('-'); return `${d}/${m}/${y}`; };
      const LABEL = { vencido:'Vencido', hoje:'Hoje', proximos7:'Próx. 7 dias', ativo:'Ativo', pausado:'Pausado', finalizado:'Finalizado' };
      const CSS   = { vencido:'st-atrasado', hoje:'st-hoje', proximos7:'st-proximos7', ativo:'st-pendente', pausado:'st-pendente', finalizado:'st-entregue' };

      const rows = dados
        .sort((a,b) => {
          const cmp = a.estrategista.localeCompare(b.estrategista, 'pt-BR');
          if (cmp !== 0) return cmp;
          if (!a.prazo && !b.prazo) return 0;
          if (!a.prazo) return 1;
          if (!b.prazo) return -1;
          return a.prazo > b.prazo ? 1 : -1;
        })
        .map(e => `
          <tr class="rot-row" data-status="${e._st}" data-copy="${esc(e.estrategista)}">
            <td>${esc(e.estrategista)}</td>
            <td>${esc(e.cliente)}</td>
            <td>${esc(e.plano)}</td>
            <td style="white-space:nowrap">${e.levaAtual !== '' ? (String(e.levaAtual).includes('/') || !e.totalLevas ? esc(String(e.levaAtual)) : `${esc(String(e.levaAtual))}/${esc(String(e.totalLevas))}`) : '—'}</td>
            <td style="white-space:nowrap">${fmtD(e.prazo)}</td>
            <td><span class="status-badge ${CSS[e._st]}">${LABEL[e._st]}</span></td>
          </tr>`).join('');

      const copyOptions = copies.map(n => `
        <label class="rot-copy-option">
          <input type="checkbox" value="${esc(n)}" checked onchange="window._applyCopyFilter()">
          ${esc(n)}
        </label>`).join('');

      return `
        <div class="dash-grid">
          <div class="dash-kpi-row">
            <div class="dash-kpi kpi-atrasado">
              <div class="dash-kpi-label">Vencidos</div>
              <div class="dash-kpi-value">${vencidos}</div>
              <div class="dash-kpi-sub">prazo ultrapassado</div>
            </div>
            <div class="dash-kpi kpi-hoje">
              <div class="dash-kpi-label">Para Hoje</div>
              <div class="dash-kpi-value">${paraHoje}</div>
              <div class="dash-kpi-sub">vencem hoje</div>
            </div>
            <div class="dash-kpi kpi-proximos7">
              <div class="dash-kpi-label">Próx. 7 dias</div>
              <div class="dash-kpi-value">${prox7}</div>
              <div class="dash-kpi-sub">vencem em breve</div>
            </div>
            <div class="dash-kpi">
              <div class="dash-kpi-label">Ativos</div>
              <div class="dash-kpi-value">${ativos}</div>
              <div class="dash-kpi-sub">de ${total} clientes</div>
            </div>
            <div class="dash-kpi kpi-entregue">
              <div class="dash-kpi-label">Finalizados</div>
              <div class="dash-kpi-value">${finalizados}</div>
              <div class="dash-kpi-sub">${pausados} pausados</div>
            </div>
          </div>

          <div class="dash-card">
            <div class="dash-card-header">
              <h3 class="dash-card-title">Todos os Clientes</h3>
              <div class="rot-toolbar">
                <div class="rot-view-switch">
                  <button class="rot-view-btn active" data-view="full" onclick="_toggleRotView('full')">Completa</button>
                  <button class="rot-view-btn" data-view="compact" onclick="_toggleRotView('compact')">Enxuta</button>
                </div>
                <button class="rot-export-btn" onclick="_exportarRoteiros()">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Exportar
                </button>
                <div class="rot-copy-select" id="rot-copy-select">
                  <button class="rot-copy-trigger" onclick="window._toggleCopyDropdown(event)">
                    <span id="rot-copy-summary">Todos os copies</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                  <div class="rot-copy-dropdown" id="rot-copy-dropdown">
                    <div class="rot-copy-actions">
                      <button onclick="window._selectAllCopies(true)">Selecionar todos</button>
                      <button onclick="window._selectAllCopies(false)">Limpar</button>
                    </div>
                    <div class="rot-copy-options">${copyOptions}</div>
                  </div>
                </div>
                <div class="rot-filters">
                  <button class="rot-filter-btn active" data-f="all"        onclick="_filtrarRoteiros('all')">Todos (${total})</button>
                  <button class="rot-filter-btn"        data-f="vencido"    onclick="_filtrarRoteiros('vencido')">Vencidos (${vencidos})</button>
                  <button class="rot-filter-btn"        data-f="hoje"       onclick="_filtrarRoteiros('hoje')">Hoje (${paraHoje})</button>
                  <button class="rot-filter-btn"        data-f="proximos7"  onclick="_filtrarRoteiros('proximos7')">Próx. 7 dias (${prox7})</button>
                  <button class="rot-filter-btn"        data-f="ativo"      onclick="_filtrarRoteiros('ativo')">Ativos (${ativos})</button>
                  <button class="rot-filter-btn"        data-f="pausado"    onclick="_filtrarRoteiros('pausado')">Pausados (${pausados})</button>
                  <button class="rot-filter-btn"        data-f="finalizado" onclick="_filtrarRoteiros('finalizado')">Finalizados (${finalizados})</button>
                </div>
              </div>
            </div>
            <div class="dash-card-body">
              ${!dados.length ? '<p class="dash-empty">Nenhum dado carregado.</p>' : `
              <table class="dash-table" id="rot-table">
                <thead>
                  <tr><th>Copy</th><th>Cliente</th><th>Plano</th><th>Leva</th><th>Prazo</th><th>Status</th></tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>`}
            </div>
          </div>
        </div>`;
    }
  },

  // ── Carteira dos Estrategistas ────────────────────────────────────────────
  {
    id: 'carteira-estrategistas',
    label: 'Carteira Estrategistas',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
             <line x1="3" y1="10" x2="21" y2="10"/>
             <path d="M7 15h4"/>
           </svg>`,

    config: {
      targetSheetName: 'Carteira dos Estrategistas',
      targetTabs: ['Carteira Mentores', 'Carteira Copys'],
      statusHeaderHints: ['status', 'situação', 'situacao', 'estado', 'ativo', 'atividade'],
      activeTerms: ['ativo', 'active', 'em carteira', 'vigente', 'em atendimento'],
      inactiveTerms: ['inativo', 'inactive', 'pausado', 'encerrado', 'cancelado', 'desligado', 'arquivado'],
    },

    norm(value) {
      return String(value ?? '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
    },

    esc(value) {
      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    },

    looksLikeUrl(value) {
      const text = String(value ?? '').trim();
      if (!text) return false;
      try {
        const url = new URL(text);
        return ['http:', 'https:'].includes(url.protocol);
      } catch {
        return false;
      }
    },

    renderCell(value) {
      const text = String(value ?? '').trim();
      if (!text) return '—';
      const safe = this.esc(text);
      if (this.looksLikeUrl(text)) {
        return `<a href="${safe}" target="_blank" rel="noopener noreferrer">${safe}</a>`;
      }
      return safe;
    },

    findSheetRecord() {
      const sheets = window._sheets || [];
      const target = this.norm(this.config.targetSheetName);

      return (
        sheets.find((sheet) => this.norm(sheet.name) === target) ||
        sheets.find((sheet) => this.norm(sheet.name).includes(target)) ||
        null
      );
    },

    parseGoogleSheetsLink(link) {
      try {
        const url = new URL(link);
        const idMatch = url.pathname.match(/\/spreadsheets\/d\/([A-Za-z0-9_-]+)/);
        if (!idMatch) return null;

        return {
          sheetId: idMatch[1]
        };
      } catch {
        return null;
      }
    },

    parseGvizJson(raw) {
      const start = raw.indexOf('{');
      const end = raw.lastIndexOf('}');
      if (start === -1 || end === -1 || end <= start) {
        throw new Error('Resposta inválida da planilha.');
      }
      return JSON.parse(raw.slice(start, end + 1));
    },

    extractCellValue(cell) {
      if (!cell) return '';
      if (cell.f !== undefined && cell.f !== null && String(cell.f).trim() !== '') {
        return String(cell.f);
      }
      if (cell.v === undefined || cell.v === null) return '';

      if (typeof cell.v === 'string') {
        const dateMatch = cell.v.match(/^Date\((\d+),(\d+),(\d+)\)$/);
        if (dateMatch) {
          const d = new Date(Number(dateMatch[1]), Number(dateMatch[2]), Number(dateMatch[3]));
          return d.toLocaleDateString('pt-BR');
        }
      }

      return String(cell.v);
    },

    async fetchSheetTab(sheetId, tabName) {
      const endpoint = new URL(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq`);
      endpoint.searchParams.set('tqx', 'out:json');
      endpoint.searchParams.set('sheet', tabName);

      const response = await fetch(endpoint.toString());
      if (!response.ok) {
        throw new Error(`Não foi possível acessar a aba "${tabName}".`);
      }

      const raw = await response.text();
      const json = this.parseGvizJson(raw);
      const table = json.table || {};
      const cols = table.cols || [];
      const rawRows = table.rows || [];

      const headers = cols.map((col, idx) => {
        const label = String(col?.label || col?.id || '').trim();
        return label || `Coluna ${idx + 1}`;
      });

      const rows = rawRows
        .map((row) => headers.map((_, idx) => this.extractCellValue(row.c?.[idx])))
        .filter((row) => row.some((cell) => String(cell).trim() !== ''));

      return {
        tabName,
        headers,
        rows,
      };
    },

    resolveTabKey(tabName) {
      const normalized = this.norm(tabName);
      if (normalized.includes('mentor')) return 'mentors';
      if (normalized.includes('copy')) return 'copies';
      return 'others';
    },

    mergeTabTables(tabTables) {
      const headerSet = new Set();
      tabTables.forEach((table) => {
        table.headers.forEach((header) => headerSet.add(header));
      });

      const unifiedHeaders = ['Aba', ...Array.from(headerSet)];
      const rows = tabTables.flatMap((table) => {
        return table.rows.map((row) => {
          const rowByHeader = new Map();
          table.headers.forEach((header, index) => {
            rowByHeader.set(header, row[index] ?? '');
          });

          return unifiedHeaders.map((header) => {
            if (header === 'Aba') return table.tabName;
            return rowByHeader.get(header) ?? '';
          });
        });
      });

      return {
        headers: unifiedHeaders,
        rows,
        tabsLoaded: tabTables.map((table) => table.tabName),
      };
    },

    async fetchSheetTable(link) {
      const parsed = this.parseGoogleSheetsLink(link);
      if (!parsed) {
        throw new Error('O link da planilha não é um Google Sheets válido.');
      }

      const targetTabs = (this.config.targetTabs || []).filter(Boolean);
      if (!targetTabs.length) {
        throw new Error('Nenhuma aba configurada para leitura da carteira.');
      }

      const tabTables = [];
      for (const tabName of targetTabs) {
        tabTables.push(await this.fetchSheetTab(parsed.sheetId, tabName));
      }

      const merged = this.mergeTabTables(tabTables);
      return {
        sheetId: parsed.sheetId,
        ...merged,
      };
    },

    getStatusBucket(statusValue, activeTerms, inactiveTerms) {
      const normalized = this.norm(statusValue);
      if (!normalized) return 'outros';

      for (const term of inactiveTerms) {
        if (normalized.includes(term)) return 'inativo';
      }
      for (const term of activeTerms) {
        if (normalized.includes(term)) return 'ativo';
      }
      return 'outros';
    },

    detectStatusColumn(headers, rows, activeTerms, inactiveTerms) {
      const hints = this.config.statusHeaderHints.map((term) => this.norm(term));

      const directIdx = headers.findIndex((header) => {
        const normalized = this.norm(header);
        return hints.some((hint) => normalized.includes(hint));
      });
      if (directIdx >= 0) return directIdx;

      let bestIdx = -1;
      let bestScore = 0;

      headers.forEach((_, colIdx) => {
        let score = 0;
        rows.forEach((row) => {
          const bucket = this.getStatusBucket(row[colIdx], activeTerms, inactiveTerms);
          if (bucket !== 'outros') score += 1;
        });
        if (score > bestScore) {
          bestScore = score;
          bestIdx = colIdx;
        }
      });

      return bestScore > 0 ? bestIdx : -1;
    },

    isInvalidMergedRow(row, statusIdx) {
      const contentCells = row.slice(1).map((cell) => String(cell ?? '').trim());
      const filled = contentCells.filter((cell) => cell && cell !== '—' && cell !== '-');

      if (filled.length < 2) return true;
      if (!filled.some((cell) => /[A-Za-zÀ-ÿ0-9]/.test(cell))) return true;

      if (statusIdx >= 0) {
        const statusValue = this.norm(row[statusIdx]);
        if (['invalido', 'invalida', 'invalid', 'desconsiderar', 'desconsiderado'].includes(statusValue)) {
          return true;
        }
      }

      return false;
    },

    async render() {
      const esc = (value) => this.esc(value);
      const sheet = this.findSheetRecord();

      if (!sheet) {
        return `
          <div class="dash-grid">
            <div class="dash-card">
              <div class="dash-card-header"><h3 class="dash-card-title">Carteira dos Estrategistas</h3></div>
              <div class="dash-card-body">
                <p class="dash-empty">
                  Não encontrei uma planilha chamada <strong>Carteira dos Estrategistas</strong> no mural.
                  Cadastre a planilha na aba <strong>Planilhas de Gestão</strong> para habilitar este dashboard.
                </p>
              </div>
            </div>
          </div>`;
      }

      let tableData;
      try {
        tableData = await this.fetchSheetTable(sheet.link);
      } catch (error) {
        const message = error && error.message ? error.message : 'Falha ao carregar dados da planilha.';
        return `
          <div class="dash-grid">
            <div class="dash-card">
              <div class="dash-card-header"><h3 class="dash-card-title">Carteira dos Estrategistas</h3></div>
              <div class="dash-card-body">
                <p class="dash-empty">
                  ${esc(message)}<br/>
                  Confira o link cadastrado, o compartilhamento de leitura e os nomes das abas configuradas.
                </p>
              </div>
            </div>
          </div>`;
      }

      const activeTerms = this.config.activeTerms.map((term) => this.norm(term));
      const inactiveTerms = this.config.inactiveTerms.map((term) => this.norm(term));
      const headers = tableData.headers;
      const rows = tableData.rows;
      const statusIdx = this.detectStatusColumn(headers, rows, activeTerms, inactiveTerms);
      const validRows = rows.filter((row) => !this.isInvalidMergedRow(row, statusIdx));

      const registros = validRows.map((row, index) => {
        const statusRaw = statusIdx >= 0 ? row[statusIdx] : '';
        const tabLabel = String(row[0] || '').trim();
        const tabKey = this.resolveTabKey(tabLabel);
        const bucket = statusIdx >= 0
          ? this.getStatusBucket(statusRaw, activeTerms, inactiveTerms)
          : 'outros';
        return { index, row, statusRaw, bucket, tabKey, tabLabel };
      });

      const totais = {
        total: registros.length,
        ativos: registros.filter((item) => item.bucket === 'ativo').length,
        inativos: registros.filter((item) => item.bucket === 'inativo').length,
        outros: registros.filter((item) => item.bucket === 'outros').length,
      };

      const tabTotals = {
        mentors: registros.filter((item) => item.tabKey === 'mentors').length,
        copies: registros.filter((item) => item.tabKey === 'copies').length,
      };

      const headHtml = headers.map((header) => `<th>${esc(header)}</th>`).join('');
      const bodyHtml = registros.map((item) => `
        <tr class="carteira-row" data-status="${item.bucket}" data-tab="${item.tabKey}" ${item.tabKey === 'mentors' ? '' : 'style="display:none"'}>
          ${item.row.map((cell) => `<td>${this.renderCell(cell)}</td>`).join('')}
        </tr>
      `).join('');

      return `
        <div class="dash-grid">
          <div class="dash-kpi-row">
            <div class="dash-kpi">
              <div class="dash-kpi-label">Total de Registros</div>
              <div class="dash-kpi-value">${totais.total}</div>
              <div class="dash-kpi-sub">linhas válidas da planilha</div>
            </div>
            <div class="dash-kpi kpi-ativos">
              <div class="dash-kpi-label">Ativos</div>
              <div class="dash-kpi-value">${totais.ativos}</div>
              <div class="dash-kpi-sub">carteira ativa</div>
            </div>
            <div class="dash-kpi kpi-inativos">
              <div class="dash-kpi-label">Inativos</div>
              <div class="dash-kpi-value">${totais.inativos}</div>
              <div class="dash-kpi-sub">carteira inativa</div>
            </div>
            <div class="dash-kpi kpi-outros">
              <div class="dash-kpi-label">Outros Status</div>
              <div class="dash-kpi-value">${totais.outros}</div>
              <div class="dash-kpi-sub">${statusIdx >= 0 ? `coluna: ${esc(headers[statusIdx])}` : 'status não identificado'}</div>
            </div>
          </div>

          <div class="dash-card">
            <div class="dash-card-header">
              <h3 class="dash-card-title">Base Completa da Carteira</h3>
              <div class="carteira-controls">
                <div class="carteira-view-switch">
                  <button class="carteira-view-btn active" data-tab="mentors" onclick="_filtrarCarteiraTab('mentors')">
                    Mentors (${tabTotals.mentors})
                  </button>
                  <button class="carteira-view-btn" data-tab="copies" onclick="_filtrarCarteiraTab('copies')">
                    Copies (${tabTotals.copies})
                  </button>
                </div>
                <div class="carteira-filter-bar">
                  <button class="carteira-filter-btn active" data-f="all" onclick="_filtrarCarteiraStatus('all')">Todos (${totais.total})</button>
                  <button class="carteira-filter-btn" data-f="ativo" onclick="_filtrarCarteiraStatus('ativo')">Ativos (${totais.ativos})</button>
                  <button class="carteira-filter-btn" data-f="inativo" onclick="_filtrarCarteiraStatus('inativo')">Inativos (${totais.inativos})</button>
                  <button class="carteira-filter-btn" data-f="outros" onclick="_filtrarCarteiraStatus('outros')">Outros (${totais.outros})</button>
                </div>
              </div>
            </div>
            <div class="dash-card-body">
              ${!registros.length ? '<p class="dash-empty">A planilha está sem dados para exibir.</p>' : `
              <table class="dash-table">
                <thead><tr>${headHtml}</tr></thead>
                <tbody>${bodyHtml}</tbody>
              </table>
              <p class="dash-empty" id="carteiraFilterEmpty" style="display:none">Nenhuma linha encontrada com os filtros atuais.</p>`}
            </div>
          </div>
        </div>`;
    }
  },

  // ── Adicione novos dashboards abaixo ─────────────────────────────────────
  // { id: 'meu-dash', label: 'Meu Dashboard', icon: `<svg .../>`, render() { return `...`; } },

];

window.DASHBOARDS = DASHBOARDS;

// ── Filtros da tabela de roteiros ─────────────────────────────────────────
window._rotCopyFilter = null; // null = todos os copies

window._applyRotFilters = function() {
  const statusBtn = document.querySelector('.rot-filter-btn.active');
  const statusF   = statusBtn ? statusBtn.dataset.f : 'all';
  const copyF     = window._rotCopyFilter;
  document.querySelectorAll('.rot-row').forEach(row => {
    const statusOk = statusF === 'all' || row.dataset.status === statusF;
    const copyOk   = !copyF  || copyF.includes(row.dataset.copy);
    row.style.display = (statusOk && copyOk) ? '' : 'none';
  });
};

window._filtrarRoteiros = function(filtro) {
  document.querySelectorAll('.rot-filter-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.f === filtro)
  );
  window._applyRotFilters();
};

window._toggleCopyDropdown = function(e) {
  e.stopPropagation();
  const dd = document.getElementById('rot-copy-dropdown');
  if (!dd) return;
  const opening = !dd.classList.contains('open');
  dd.classList.toggle('open', opening);
  if (opening) {
    setTimeout(() => {
      document.addEventListener('click', function handler(ev) {
        if (!document.getElementById('rot-copy-select')?.contains(ev.target)) {
          dd.classList.remove('open');
          document.removeEventListener('click', handler);
        }
      });
    }, 0);
  }
};

window._selectAllCopies = function(checked) {
  document.querySelectorAll('.rot-copy-option input').forEach(cb => cb.checked = checked);
  window._applyCopyFilter();
};

window._applyCopyFilter = function() {
  const all     = [...document.querySelectorAll('.rot-copy-option input')];
  const checked = all.filter(cb => cb.checked).map(cb => cb.value);
  const summary = document.getElementById('rot-copy-summary');
  if (summary) {
    summary.textContent = checked.length === 0     ? 'Nenhum copy' :
                          checked.length === all.length ? 'Todos os copies' :
                          `${checked.length} de ${all.length} copies`;
  }
  window._rotCopyFilter = checked.length === all.length ? null : checked;
  window._applyRotFilters();
};

// ── Filtro global da tabela da carteira ─────────────────────────────────────
window._aplicarFiltrosCarteira = function(tab, status) {
  let visibleCount = 0;

  document.querySelectorAll('.carteira-row').forEach((row) => {
    const tabMatch = row.dataset.tab === tab;
    const statusMatch = status === 'all' || row.dataset.status === status;
    const visible = tabMatch && statusMatch;
    row.style.display = visible ? '' : 'none';
    if (visible) visibleCount += 1;
  });

  const emptyState = document.getElementById('carteiraFilterEmpty');
  if (emptyState) emptyState.style.display = visibleCount ? 'none' : 'block';
};

window._filtrarCarteiraTab = function(tab) {
  document.querySelectorAll('.carteira-view-btn').forEach((button) => {
    button.classList.toggle('active', button.dataset.tab === tab);
  });

  const status = (document.querySelector('.carteira-filter-btn.active') || {}).dataset?.f || 'all';
  window._aplicarFiltrosCarteira(tab, status);
};

window._filtrarCarteiraStatus = function(filtro) {
  document.querySelectorAll('.carteira-filter-btn').forEach((button) => {
    button.classList.toggle('active', button.dataset.f === filtro);
  });

  const activeTab = (document.querySelector('.carteira-view-btn.active') || {}).dataset?.tab || 'mentors';
  window._aplicarFiltrosCarteira(activeTab, filtro);
};

// ── Toggle de visualização Completa/Enxuta (roteiros) ─────────────────────
window._toggleRotView = function(mode) {
  const table = document.getElementById('rot-table');
  if (table) table.classList.toggle('rot-compact', mode === 'compact');
  document.querySelectorAll('.rot-view-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.view === mode)
  );
};

// ── Exportar roteiros visíveis para CSV ───────────────────────────────────
window._exportarRoteiros = function() {
  const table = document.getElementById('rot-table');
  if (!table) return;

  const isCompact = table.classList.contains('rot-compact');
  // Colunas: 0=Copy, 1=Cliente, 2=Plano, 3=Leva, 4=Prazo, 5=Status
  const visibleCols = isCompact ? [0, 1, 4] : [0, 1, 2, 3, 4, 5];

  const headerCells = table.querySelectorAll('thead th');
  const headers = visibleCols.map(i => headerCells[i]?.textContent?.trim() || '');

  const rows = [];
  table.querySelectorAll('.rot-row').forEach(row => {
    if (row.style.display === 'none') return;
    const cells = row.querySelectorAll('td');
    rows.push(visibleCols.map(i => (cells[i]?.textContent?.trim() || '').replace(/"/g, '""')));
  });

  const csvLines = [headers.join(',')];
  rows.forEach(r => csvLines.push(r.map(c => `"${c}"`).join(',')));
  const csv = '\uFEFF' + csvLines.join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'roteiros_export.csv';
  a.click();
  URL.revokeObjectURL(url);
};
