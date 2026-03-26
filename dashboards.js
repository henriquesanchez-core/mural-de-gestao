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

    /**
     * CONEXÃO COM GOOGLE SHEETS
     * ─────────────────────────
     * 1. Planilha → Arquivo → Compartilhar → "Qualquer pessoa com o link pode ver"
     * 2. Copie o ID da URL: docs.google.com/spreadsheets/d/[SHEET_ID]/edit
     * 3. Cole em sheetId abaixo
     * 4. Liste os nomes exatos das abas em `abas`
     *
     * Deixe sheetId vazio para usar os dados de exemplo.
     */
    config: {
      sheetId: '1NFx4lDqYh5dxejV-uZEFqjuVHGXHe7z3zfh5FV1h1n8',
      abas: ['Ana Lima', 'Bruno Martins', 'Carla Souza', 'Diego Ferreira'],
      colunas: { cliente: 0, roteiro: 1, prazo: 2, status: 3 },
    },

    mockData: [
      { estrategista: 'Ana Lima',       cliente: 'Empresa ABC',      roteiro: 'Roteiro de Marca',       prazo: '2026-03-20', status: 'Atrasado' },
      { estrategista: 'Ana Lima',       cliente: 'Empresa XYZ',      roteiro: 'Vídeo Institucional',    prazo: '2026-03-26', status: 'Pendente' },
      { estrategista: 'Ana Lima',       cliente: 'Clínica Saúde+',   roteiro: 'Apresentação',           prazo: '2026-03-29', status: 'Pendente' },
      { estrategista: 'Ana Lima',       cliente: 'Tech Start',       roteiro: 'Roteiro Explicativo',    prazo: '2026-04-10', status: 'Pendente' },
      { estrategista: 'Ana Lima',       cliente: 'Moda Fest',        roteiro: 'Roteiro de Lançamento',  prazo: '2026-03-15', status: 'Entregue' },
      { estrategista: 'Bruno Martins',  cliente: 'Restaurante Bom',  roteiro: 'Roteiro do Menu',        prazo: '2026-03-24', status: 'Atrasado' },
      { estrategista: 'Bruno Martins',  cliente: 'Escola Elite',     roteiro: 'Aula Inaugural',         prazo: '2026-03-27', status: 'Pendente' },
      { estrategista: 'Bruno Martins',  cliente: 'Hotel Sol',        roteiro: 'Tour Virtual',           prazo: '2026-04-01', status: 'Pendente' },
      { estrategista: 'Bruno Martins',  cliente: 'Academia Fit',     roteiro: 'Campanha Verão',         prazo: '2026-03-10', status: 'Entregue' },
      { estrategista: 'Bruno Martins',  cliente: 'Livraria Nova',    roteiro: 'Roteiro Promo',          prazo: '2026-03-22', status: 'Atrasado' },
      { estrategista: 'Carla Souza',    cliente: 'Banco Digital',    roteiro: 'Roteiro do App',         prazo: '2026-03-26', status: 'Pendente' },
      { estrategista: 'Carla Souza',    cliente: 'Startup Verde',    roteiro: 'Pitch Deck',             prazo: '2026-03-30', status: 'Pendente' },
      { estrategista: 'Carla Souza',    cliente: 'ONG Vida',         roteiro: 'Roteiro de Doação',      prazo: '2026-03-18', status: 'Atrasado' },
      { estrategista: 'Carla Souza',    cliente: 'Pharma Plus',      roteiro: 'Guia do Produto',        prazo: '2026-04-05', status: 'Pendente' },
      { estrategista: 'Carla Souza',    cliente: 'E-commerce Fast',  roteiro: 'Roteiro de Ads',         prazo: '2026-03-12', status: 'Entregue' },
      { estrategista: 'Diego Ferreira', cliente: 'Construtora Top',  roteiro: 'Roteiro de Lançamento',  prazo: '2026-03-25', status: 'Atrasado' },
      { estrategista: 'Diego Ferreira', cliente: 'Seguro Certo',     roteiro: 'Explainer',              prazo: '2026-03-28', status: 'Pendente' },
      { estrategista: 'Diego Ferreira', cliente: 'Telecom BR',       roteiro: 'Tutorial de Uso',        prazo: '2026-04-02', status: 'Pendente' },
      { estrategista: 'Diego Ferreira', cliente: 'Farmácia Bem',     roteiro: 'Roteiro de Produtos',    prazo: '2026-03-08', status: 'Entregue' },
      { estrategista: 'Diego Ferreira', cliente: 'Auto Shop',        roteiro: 'Promoção Especial',      prazo: '2026-04-08', status: 'Pendente' },
    ],

    async fetchSheet(sheetId, aba) {
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(aba)}`;
      const raw  = await fetch(url).then(r => r.text());
      const json = JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1));
      const cols = this.config.colunas;
      return (json.table.rows || [])
        .filter(row => row.c && row.c[cols.cliente]?.v)
        .map(row => {
          const prazoCell = row.c[cols.prazo];
          let prazo = '';
          if (prazoCell?.v) {
            const m = String(prazoCell.v).match(/Date\((\d+),(\d+),(\d+)\)/);
            prazo = m
              ? new Date(+m[1], +m[2], +m[3]).toISOString().slice(0, 10)
              : String(prazoCell.f || prazoCell.v);
          }
          return {
            estrategista: aba,
            cliente:  String(row.c[cols.cliente]?.v ?? ''),
            roteiro:  String(row.c[cols.roteiro]?.v  ?? ''),
            prazo,
            status:   String(row.c[cols.status]?.v   ?? 'Pendente'),
          };
        });
    },

    async render() {
      let entregas = [];
      let fonte = 'mock';

      if (this.config.sheetId) {
        const resultados = await Promise.all(
          this.config.abas.map(aba => this.fetchSheet(this.config.sheetId, aba))
        );
        entregas = resultados.flat();
        fonte = 'sheets';
      } else {
        entregas = this.mockData;
      }

      const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
      const em7  = new Date(hoje); em7.setDate(hoje.getDate() + 7);
      const ENTREGUE = ['entregue','concluído','concluido','done','realizado','realizada'];

      function calcStatus(item) {
        const s = (item.status || '').toLowerCase().trim();
        if (ENTREGUE.includes(s))               return 'entregue';
        if (s === 'atrasado')                   return 'atrasado';
        if (!item.prazo)                        return 'pendente';
        const p = new Date(item.prazo + 'T00:00:00');
        if (p < hoje)                           return 'atrasado';
        if (p.getTime() === hoje.getTime())     return 'hoje';
        if (p <= em7)                           return 'proximos7';
        return 'pendente';
      }

      const dados     = entregas.map(e => ({ ...e, _st: calcStatus(e) }));
      const total     = dados.length;
      const pendentes = dados.filter(e => e._st !== 'entregue').length;
      const atrasadas = dados.filter(e => e._st === 'atrasado').length;
      const paraHoje  = dados.filter(e => e._st === 'hoje').length;
      const prox7     = dados.filter(e => e._st === 'proximos7').length;
      const realizadas= dados.filter(e => e._st === 'entregue').length;

      const porEst = {};
      dados.forEach(e => {
        if (!porEst[e.estrategista]) porEst[e.estrategista] = { atrasado:0, hoje:0, proximos7:0, pendente:0, entregue:0 };
        porEst[e.estrategista][e._st]++;
      });

      const esc  = v => String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
      const fmtD = ymd => { if (!ymd) return '—'; const [y,m,d] = ymd.split('-'); return `${d}/${m}/${y}`; };
      const LABEL = { atrasado:'Atrasado', hoje:'Hoje', proximos7:'Próx. 7 dias', pendente:'Pendente', entregue:'Entregue' };

      const rows = dados
        .sort((a,b) => (a.prazo||'') > (b.prazo||'') ? 1 : -1)
        .map(e => `
          <tr class="rot-row" data-status="${e._st}">
            <td>${esc(e.estrategista)}</td>
            <td>${esc(e.cliente)}</td>
            <td>${esc(e.roteiro)}</td>
            <td style="white-space:nowrap">${fmtD(e.prazo)}</td>
            <td><span class="status-badge st-${e._st}">${LABEL[e._st]}</span></td>
          </tr>`).join('');

      const estCards = Object.entries(porEst).map(([nome, c]) => `
        <div class="est-card">
          <div class="est-card-name">${esc(nome)}</div>
          <div class="est-card-stats">
            ${c.atrasado  ? `<span class="est-stat st-atrasado">${c.atrasado} atrasada${c.atrasado>1?'s':''}</span>`   : ''}
            ${c.hoje      ? `<span class="est-stat st-hoje">${c.hoje} hoje</span>`                                       : ''}
            ${c.proximos7 ? `<span class="est-stat st-proximos7">${c.proximos7} em 7 dias</span>`                       : ''}
            ${c.pendente  ? `<span class="est-stat st-pendente">${c.pendente} pendente${c.pendente>1?'s':''}</span>`   : ''}
            ${c.entregue  ? `<span class="est-stat st-entregue">${c.entregue} entregue${c.entregue>1?'s':''}</span>`   : ''}
          </div>
        </div>`).join('');

      return `
        <div class="dash-grid">
          ${fonte === 'mock' ? `
          <div class="dash-banner-mock">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Exibindo <strong>dados de exemplo</strong>. Para conectar sua planilha, preencha <code>config.sheetId</code> em <code>dashboards.js</code>.
          </div>` : ''}

          <div class="dash-kpi-row">
            <div class="dash-kpi kpi-pendente">
              <div class="dash-kpi-label">Pendentes</div>
              <div class="dash-kpi-value">${pendentes}</div>
              <div class="dash-kpi-sub">de ${total} no total</div>
            </div>
            <div class="dash-kpi kpi-atrasado">
              <div class="dash-kpi-label">Atrasadas</div>
              <div class="dash-kpi-value">${atrasadas}</div>
              <div class="dash-kpi-sub">prazo vencido</div>
            </div>
            <div class="dash-kpi kpi-hoje">
              <div class="dash-kpi-label">Para hoje</div>
              <div class="dash-kpi-value">${paraHoje}</div>
              <div class="dash-kpi-sub">vencem hoje</div>
            </div>
            <div class="dash-kpi kpi-proximos7">
              <div class="dash-kpi-label">Próx. 7 dias</div>
              <div class="dash-kpi-value">${prox7}</div>
              <div class="dash-kpi-sub">vencem em breve</div>
            </div>
            <div class="dash-kpi kpi-entregue">
              <div class="dash-kpi-label">Realizadas</div>
              <div class="dash-kpi-value">${realizadas}</div>
              <div class="dash-kpi-sub">entregas concluídas</div>
            </div>
          </div>

          <div class="dash-card">
            <div class="dash-card-header"><h3 class="dash-card-title">Por Estrategista</h3></div>
            <div class="dash-card-body" style="padding:16px 20px">
              <div class="est-cards-grid">${estCards}</div>
            </div>
          </div>

          <div class="dash-card">
            <div class="dash-card-header">
              <h3 class="dash-card-title">Todas as Entregas</h3>
              <div class="rot-filters">
                <button class="rot-filter-btn active" data-f="all"       onclick="_filtrarRoteiros('all')">Todos (${total})</button>
                <button class="rot-filter-btn"        data-f="atrasado"  onclick="_filtrarRoteiros('atrasado')">Atrasadas (${atrasadas})</button>
                <button class="rot-filter-btn"        data-f="hoje"      onclick="_filtrarRoteiros('hoje')">Hoje (${paraHoje})</button>
                <button class="rot-filter-btn"        data-f="proximos7" onclick="_filtrarRoteiros('proximos7')">Próx. 7 dias (${prox7})</button>
                <button class="rot-filter-btn"        data-f="pendente"  onclick="_filtrarRoteiros('pendente')">Pendentes</button>
                <button class="rot-filter-btn"        data-f="entregue"  onclick="_filtrarRoteiros('entregue')">Entregues (${realizadas})</button>
              </div>
            </div>
            <div class="dash-card-body">
              <table class="dash-table">
                <thead>
                  <tr><th>Estrategista</th><th>Cliente</th><th>Roteiro</th><th>Prazo</th><th>Status</th></tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
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
          sheetId: idMatch[1],
          gid: url.searchParams.get('gid') || ''
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

    async fetchSheetTable(link) {
      const parsed = this.parseGoogleSheetsLink(link);
      if (!parsed) {
        throw new Error('O link da planilha não é um Google Sheets válido.');
      }

      const endpoint = new URL(`https://docs.google.com/spreadsheets/d/${parsed.sheetId}/gviz/tq`);
      endpoint.searchParams.set('tqx', 'out:json');
      if (parsed.gid) endpoint.searchParams.set('gid', parsed.gid);

      const response = await fetch(endpoint.toString());
      if (!response.ok) {
        throw new Error('Não foi possível acessar a planilha (verifique permissões de compartilhamento).');
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
        headers,
        rows,
        sheetId: parsed.sheetId,
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
                  Confira o link cadastrado e se a planilha está compartilhada como leitura.
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

      const registros = rows.map((row, index) => {
        const statusRaw = statusIdx >= 0 ? row[statusIdx] : '';
        const bucket = statusIdx >= 0
          ? this.getStatusBucket(statusRaw, activeTerms, inactiveTerms)
          : 'outros';
        return { index, row, statusRaw, bucket };
      });

      const totais = {
        total: registros.length,
        ativos: registros.filter((item) => item.bucket === 'ativo').length,
        inativos: registros.filter((item) => item.bucket === 'inativo').length,
        outros: registros.filter((item) => item.bucket === 'outros').length,
      };

      const porStatus = new Map();
      if (statusIdx >= 0) {
        registros.forEach((item) => {
          const label = String(item.statusRaw || 'Sem status').trim() || 'Sem status';
          porStatus.set(label, (porStatus.get(label) || 0) + 1);
        });
      } else {
        porStatus.set('Sem coluna de status identificada', registros.length);
      }

      const statusCloud = [...porStatus.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([label, count]) => `<span class="carteira-status-pill">${esc(label)} (${count})</span>`)
        .join('');

      const headHtml = headers.map((header) => `<th>${esc(header)}</th>`).join('');
      const bodyHtml = registros.map((item) => `
        <tr class="carteira-row" data-status="${item.bucket}">
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
            <div class="dash-card-header"><h3 class="dash-card-title">Visão Macro da Carteira</h3></div>
            <div class="dash-card-body" style="padding:16px 20px">
              <div class="carteira-meta">Fonte: ${esc(sheet.name)} (ID: ${esc(tableData.sheetId)})</div>
              <div class="carteira-status-cloud">${statusCloud}</div>
            </div>
          </div>

          <div class="dash-card">
            <div class="dash-card-header">
              <h3 class="dash-card-title">Base Completa da Carteira</h3>
              <div class="carteira-filter-bar">
                <button class="carteira-filter-btn active" data-f="all" onclick="_filtrarCarteiraStatus('all')">Todos (${totais.total})</button>
                <button class="carteira-filter-btn" data-f="ativo" onclick="_filtrarCarteiraStatus('ativo')">Ativos (${totais.ativos})</button>
                <button class="carteira-filter-btn" data-f="inativo" onclick="_filtrarCarteiraStatus('inativo')">Inativos (${totais.inativos})</button>
                <button class="carteira-filter-btn" data-f="outros" onclick="_filtrarCarteiraStatus('outros')">Outros (${totais.outros})</button>
              </div>
            </div>
            <div class="dash-card-body">
              ${!registros.length ? '<p class="dash-empty">A planilha está sem dados para exibir.</p>' : `
              <table class="dash-table">
                <thead><tr>${headHtml}</tr></thead>
                <tbody>${bodyHtml}</tbody>
              </table>`}
            </div>
          </div>
        </div>`;
    }
  },

  // ── Adicione novos dashboards abaixo ─────────────────────────────────────
  // { id: 'meu-dash', label: 'Meu Dashboard', icon: `<svg .../>`, render() { return `...`; } },

];

window.DASHBOARDS = DASHBOARDS;

// ── Filtro global da tabela de roteiros ───────────────────────────────────
window._filtrarRoteiros = function(filtro) {
  document.querySelectorAll('.rot-filter-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.f === filtro)
  );
  document.querySelectorAll('.rot-row').forEach(row =>
    row.style.display = (filtro === 'all' || row.dataset.status === filtro) ? '' : 'none'
  );
};

// ── Filtro global da tabela da carteira ─────────────────────────────────────
window._filtrarCarteiraStatus = function(filtro) {
  document.querySelectorAll('.carteira-filter-btn').forEach((button) => {
    button.classList.toggle('active', button.dataset.f === filtro);
  });
  document.querySelectorAll('.carteira-row').forEach((row) => {
    row.style.display = (filtro === 'all' || row.dataset.status === filtro) ? '' : 'none';
  });
};
