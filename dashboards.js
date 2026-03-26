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
      sheetId: '',
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

  // ── Adicione novos dashboards abaixo ─────────────────────────────────────
  // { id: 'meu-dash', label: 'Meu Dashboard', icon: `<svg .../>`, render() { return `...`; } },

];

// ── Filtro global da tabela de roteiros ───────────────────────────────────
window._filtrarRoteiros = function(filtro) {
  document.querySelectorAll('.rot-filter-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.f === filtro)
  );
  document.querySelectorAll('.rot-row').forEach(row =>
    row.style.display = (filtro === 'all' || row.dataset.status === filtro) ? '' : 'none'
  );
};
