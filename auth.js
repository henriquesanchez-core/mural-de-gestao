// ─────────────────────────────────────────────────────────────────────────────
// auth.js — Autenticacao e controle de acesso por role (Lider / Guardiao)
// ─────────────────────────────────────────────────────────────────────────────
(function () {
  'use strict';

  const sb = window._supabaseClient;
  if (!sb) {
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('auth-screen').innerHTML =
      '<div class="auth-card"><p style="color:var(--danger);text-align:center">Erro: Supabase nao carregou. Verifique sua conexao e recarregue.</p></div>';
    return;
  }

  // ── Estado ──────────────────────────────────────────────────────────────────
  let authUser    = null;
  let authProfile = null;
  let resolveReady;
  const authReady = new Promise(r => { resolveReady = r; });

  window._authUser    = null;
  window._authProfile = null;
  window._authReady   = authReady;

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function escAuth(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  window._isLider    = function () { return authProfile && authProfile.role === 'lider'; };
  window._isGuardiao = function () { return authProfile && authProfile.role === 'guardiao'; };

  // ── Fetch Profile ──────────────────────────────────────────────────────────
  async function fetchProfile(userId) {
    const { data, error } = await sb
      .from('profiles')
      .select('id, email, nome, role, created_at')
      .eq('id', userId)
      .single();
    if (error) { console.error('Profile fetch error:', error); return null; }
    return data;
  }

  // ── Login ──────────────────────────────────────────────────────────────────
  async function handleLogin(email, password) {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  // ── Logout ─────────────────────────────────────────────────────────────────
  window._logout = async function () {
    await sb.auth.signOut();
    authUser = null;
    authProfile = null;
    window._authUser    = null;
    window._authProfile = null;
    showLoginScreen();
  };

  // ── Tela de Login ──────────────────────────────────────────────────────────
  function showLoginScreen() {
    document.getElementById('app-main').style.display  = 'none';
    document.getElementById('auth-screen').style.display = 'flex';
  }

  function hideLoginScreen() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-main').style.display    = '';
  }

  // ── Form de Login ──────────────────────────────────────────────────────────
  function setupLoginForm() {
    const form    = document.getElementById('loginForm');
    const errorEl = document.getElementById('loginError');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorEl.textContent = '';

      const email    = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;

      if (!email || !password) {
        errorEl.textContent = 'Preencha email e senha.';
        return;
      }

      const btn = form.querySelector('button[type="submit"]');
      try {
        btn.disabled    = true;
        btn.textContent = 'Entrando...';
        await handleLogin(email, password);
      } catch (err) {
        errorEl.textContent = 'Email ou senha incorretos.';
      } finally {
        btn.disabled    = false;
        btn.textContent = 'Entrar';
      }
    });
  }

  // ── Restricoes por Role ────────────────────────────────────────────────────
  function applyRoleRestrictions() {
    if (!authProfile) return;

    const isLider = authProfile.role === 'lider';

    // Aba Planilhas — so Lider
    const sheetsTabBtn = document.querySelector('[data-tab="sheets"]');
    if (sheetsTabBtn) sheetsTabBtn.style.display = isLider ? '' : 'none';

    // Botao Nova Planilha — so Lider
    const btnOpen = document.getElementById('btnOpenModal');
    if (btnOpen) btnOpen.style.display = isLider ? '' : 'none';

    // Guardiao vai direto pro dashboard
    if (!isLider) {
      const dashBtn = document.querySelector('[data-tab="dashboards"]');
      if (dashBtn) dashBtn.click();
    }

    updateHeaderUserInfo();
  }

  // ── Header com info do usuario ─────────────────────────────────────────────
  function updateHeaderUserInfo() {
    const c = document.getElementById('auth-user-info');
    if (!c || !authProfile) return;

    const nome  = escAuth(authProfile.nome || authProfile.email);
    const role  = authProfile.role;
    const badge = role === 'lider' ? 'Lider' : 'Guardiao';

    c.innerHTML =
      '<span class="auth-user-name">' + nome + '</span>' +
      '<span class="auth-role-badge badge-' + escAuth(role) + '">' + badge + '</span>' +
      (role === 'lider'
        ? '<button class="btn-icon" onclick="_showUserManagement()" title="Gerenciar usuarios">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
            '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/>' +
            '<line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg></button>'
        : '') +
      '<button class="btn-icon" onclick="_logout()" title="Sair">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
        '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>' +
        '<polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg></button>';
  }

  // ── Filtro de dashboards por role ──────────────────────────────────────────
  window._filterDashboardsByRole = function (dashboards) {
    if (!authProfile || authProfile.role === 'lider') return dashboards;
    return dashboards.filter(d => d.id === 'roteiros');
  };

  // ── Gerenciamento de Usuarios (Lider) ──────────────────────────────────────

  window._showUserManagement = async function () {
    if (!window._isLider()) return;

    const { data: users, error } = await sb
      .from('profiles')
      .select('id, email, nome, role, created_at')
      .order('created_at', { ascending: true });

    if (error) {
      if (typeof showToast === 'function') showToast('Erro ao carregar usuarios.');
      return;
    }

    const overlay = document.getElementById('userMgmtOverlay');
    const content = document.getElementById('userMgmtContent');
    if (!overlay || !content) return;

    let html =
      '<div class="user-mgmt-header">' +
        '<h3>Gerenciar Usuarios</h3>' +
        '<button class="btn-primary" onclick="_showCreateUserForm()">+ Novo Usuario</button>' +
      '</div>' +
      '<div id="createUserFormContainer"></div>' +
      '<table class="dash-table"><thead><tr>' +
        '<th>Nome</th><th>Email</th><th>Cargo</th><th>Criado em</th><th>Acoes</th>' +
      '</tr></thead><tbody>';

    users.forEach(u => {
      const isSelf = u.id === authProfile.id;
      const dateStr = new Date(u.created_at).toLocaleDateString('pt-BR');
      html +=
        '<tr>' +
          '<td>' + escAuth(u.nome || '\u2014') + '</td>' +
          '<td>' + escAuth(u.email) + '</td>' +
          '<td><span class="auth-role-badge badge-' + escAuth(u.role) + '">' +
            (u.role === 'lider' ? 'Lider' : 'Guardiao') + '</span></td>' +
          '<td>' + dateStr + '</td>' +
          '<td>' +
            (isSelf
              ? '<span class="text-muted">Voce</span>'
              : '<button class="btn-icon" onclick="_toggleUserRole(\'' + u.id + '\',\'' + u.role + '\')" title="Alternar cargo">' +
                  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                  '<path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>' +
                  '<path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg></button>' +
                '<button class="btn-icon danger" onclick="_deleteUser(\'' + u.id + '\')" title="Excluir">' +
                  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                  '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>' +
                  '<path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg></button>'
            ) +
          '</td>' +
        '</tr>';
    });

    html += '</tbody></table>';
    content.innerHTML = html;
    overlay.classList.add('open');
  };

  // ── Fechar modal de usuarios ───────────────────────────────────────────────
  window._closeUserManagement = function () {
    const overlay = document.getElementById('userMgmtOverlay');
    if (overlay) overlay.classList.remove('open');
  };

  // ── Form de criar usuario ──────────────────────────────────────────────────
  window._showCreateUserForm = function () {
    const container = document.getElementById('createUserFormContainer');
    if (!container) return;

    container.innerHTML =
      '<form id="createUserForm" class="create-user-form" novalidate>' +
        '<div class="form-row">' +
          '<div class="form-group">' +
            '<label>Nome</label>' +
            '<input type="text" id="newUserNome" placeholder="Nome completo" maxlength="80" />' +
          '</div>' +
          '<div class="form-group">' +
            '<label>Email <span class="required">*</span></label>' +
            '<input type="email" id="newUserEmail" placeholder="usuario@email.com" />' +
          '</div>' +
        '</div>' +
        '<div class="form-row">' +
          '<div class="form-group">' +
            '<label>Senha <span class="required">*</span></label>' +
            '<input type="password" id="newUserPassword" placeholder="Min. 6 caracteres" />' +
          '</div>' +
          '<div class="form-group">' +
            '<label>Cargo</label>' +
            '<select id="newUserRole" class="form-select">' +
              '<option value="guardiao">Guardiao</option>' +
              '<option value="lider">Lider</option>' +
            '</select>' +
          '</div>' +
        '</div>' +
        '<span class="field-error" id="createUserError"></span>' +
        '<div class="modal-actions">' +
          '<button type="button" class="btn-secondary" onclick="document.getElementById(\'createUserFormContainer\').innerHTML=\'\'">Cancelar</button>' +
          '<button type="submit" class="btn-primary">Criar Usuario</button>' +
        '</div>' +
      '</form>';

    document.getElementById('createUserForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const errorEl  = document.getElementById('createUserError');
      errorEl.textContent = '';

      const email    = document.getElementById('newUserEmail').value.trim();
      const password = document.getElementById('newUserPassword').value;
      const nome     = document.getElementById('newUserNome').value.trim();
      const role     = document.getElementById('newUserRole').value;

      if (!email || !password) {
        errorEl.textContent = 'Email e senha sao obrigatorios.';
        return;
      }
      if (password.length < 6) {
        errorEl.textContent = 'Senha deve ter pelo menos 6 caracteres.';
        return;
      }

      try {
        const { data: { session } } = await sb.auth.getSession();
        const resp = await fetch(window.SUPABASE_URL + '/functions/v1/create-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + session.access_token,
          },
          body: JSON.stringify({ email, password, nome, role }),
        });

        const result = await resp.json();
        if (!resp.ok) throw new Error(result.error || 'Erro ao criar usuario.');

        if (typeof showToast === 'function') showToast('Usuario criado com sucesso!');
        window._showUserManagement();
      } catch (err) {
        errorEl.textContent = err.message;
      }
    });
  };

  // ── Alternar role ──────────────────────────────────────────────────────────
  window._toggleUserRole = async function (userId, currentRole) {
    const newRole = currentRole === 'lider' ? 'guardiao' : 'lider';
    if (!confirm('Alterar cargo para ' + (newRole === 'lider' ? 'Lider' : 'Guardiao') + '?')) return;

    const { error } = await sb
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      if (typeof showToast === 'function') showToast('Erro ao alterar cargo.');
      return;
    }
    if (typeof showToast === 'function') showToast('Cargo atualizado!');
    window._showUserManagement();
  };

  // ── Deletar usuario ────────────────────────────────────────────────────────
  window._deleteUser = async function (userId) {
    if (!confirm('Deseja excluir este usuario? Esta acao nao pode ser desfeita.')) return;

    try {
      const { data: { session } } = await sb.auth.getSession();
      const resp = await fetch(window.SUPABASE_URL + '/functions/v1/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + session.access_token,
        },
        body: JSON.stringify({ userId }),
      });

      const result = await resp.json();
      if (!resp.ok) throw new Error(result.error || 'Erro ao excluir.');

      if (typeof showToast === 'function') showToast('Usuario excluido.');
      window._showUserManagement();
    } catch (err) {
      if (typeof showToast === 'function') showToast('Erro: ' + err.message);
    }
  };

  // ── Auth State Change ──────────────────────────────────────────────────────
  sb.auth.onAuthStateChange(async (event, session) => {
    if (session && session.user) {
      authUser    = session.user;
      authProfile = await fetchProfile(session.user.id);

      // Retry se o trigger ainda nao criou o profile
      if (!authProfile) {
        await new Promise(r => setTimeout(r, 1200));
        authProfile = await fetchProfile(session.user.id);
      }

      window._authUser    = authUser;
      window._authProfile = authProfile;

      if (!authProfile) {
        if (typeof showToast === 'function') showToast('Erro ao carregar perfil. Tente novamente.');
        await sb.auth.signOut();
        showLoginScreen();
        resolveReady();
        return;
      }

      hideLoginScreen();
      applyRoleRestrictions();
    } else {
      authUser    = null;
      authProfile = null;
      window._authUser    = null;
      window._authProfile = null;
      showLoginScreen();
    }
    resolveReady();
  });

  // ── Init ───────────────────────────────────────────────────────────────────
  setupLoginForm();

  const btnCloseUserMgmt = document.getElementById('btnCloseUserMgmt');
  if (btnCloseUserMgmt) {
    btnCloseUserMgmt.addEventListener('click', function () {
      var overlay = document.getElementById('userMgmtOverlay');
      if (overlay) overlay.classList.remove('open');
    });
  }

  sb.auth.getSession().then(({ data: { session } }) => {
    if (!session) {
      showLoginScreen();
      resolveReady();
    }
  });

})();
