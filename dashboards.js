/**
 * DASHBOARDS — Registro de dashboards do painel
 * ─────────────────────────────────────────────
 * Para adicionar um novo dashboard:
 *   1. Copie o bloco de exemplo abaixo
 *   2. Altere id, label, icon e implemente render()
 *   3. render() deve retornar uma string HTML
 */

const DASHBOARDS = [

  // ── Exemplo ──────────────────────────────────────────────────────────────
  {
    id: 'exemplo',
    label: 'Visão Geral',
    icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <rect x="3" y="3" width="7" height="7" rx="1"/>
             <rect x="14" y="3" width="7" height="7" rx="1"/>
             <rect x="3" y="14" width="7" height="7" rx="1"/>
             <rect x="14" y="14" width="7" height="7" rx="1"/>
           </svg>`,

    render() {
      return `
        <div class="dash-grid">

          <!-- KPIs -->
          <div class="dash-kpi-row">
            <div class="dash-kpi">
              <div class="dash-kpi-label">Total de Planilhas</div>
              <div class="dash-kpi-value">${window._sheets ? window._sheets.length : '—'}</div>
              <div class="dash-kpi-sub">cadastradas no mural</div>
            </div>
            <div class="dash-kpi">
              <div class="dash-kpi-label">Atualizações Semanais</div>
              <div class="dash-kpi-value">${window._sheets ? window._sheets.filter(s => (s.cadence||'').toLowerCase().includes('semanal')).length : '—'}</div>
              <div class="dash-kpi-sub">planilhas com cadência semanal</div>
            </div>
            <div class="dash-kpi">
              <div class="dash-kpi-label">Responsáveis</div>
              <div class="dash-kpi-value">${window._sheets ? new Set(window._sheets.map(s => s.owner).filter(Boolean)).size : '—'}</div>
              <div class="dash-kpi-sub">pessoas distintas</div>
            </div>
            <div class="dash-kpi">
              <div class="dash-kpi-label">Categorias</div>
              <div class="dash-kpi-value">${window._sheets ? new Set(window._sheets.map(s => s.category).filter(Boolean)).size : '—'}</div>
              <div class="dash-kpi-sub">categorias ativas</div>
            </div>
          </div>

          <!-- Tabela de planilhas -->
          <div class="dash-card">
            <div class="dash-card-header">
              <h3 class="dash-card-title">Planilhas cadastradas</h3>
            </div>
            <div class="dash-card-body">
              ${(() => {
                const sheets = window._sheets || [];
                if (!sheets.length) return '<p class="dash-empty">Nenhuma planilha cadastrada ainda.</p>';
                return `
                  <table class="dash-table">
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>Categoria</th>
                        <th>Responsável</th>
                        <th>Cadência</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${sheets.map(s => `
                        <tr>
                          <td><a href="${s.link}" target="_blank" rel="noopener">${s.name}</a></td>
                          <td>${s.category || '—'}</td>
                          <td>${s.owner || '—'}</td>
                          <td>${s.cadence || '—'}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>`;
              })()}
            </div>
          </div>

        </div>
      `;
    }
  },

  // ── Adicione novos dashboards abaixo ─────────────────────────────────────
  // {
  //   id: 'meu-dashboard',
  //   label: 'Meu Dashboard',
  //   icon: `<svg .../>`,
  //   render() {
  //     return `<div class="dash-grid">...</div>`;
  //   }
  // },

];
