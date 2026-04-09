// ─────────────────────────────────────────────────────────────────────────────
// auth.js — Login por cargo com senha (sem banco de dados)
// Para trocar as senhas, edite as constantes abaixo.
// ─────────────────────────────────────────────────────────────────────────────
(function () {
  'use strict';

  // ── Senhas — altere aqui ──────────────────────────────────────────────────
  var SENHAS = {
    lider:    'lider123',
    guardiao: 'guardiao123'
  };

  // ── authReady ─────────────────────────────────────────────────────────────
  var resolveReady;
  var authReady = new Promise(function (r) { resolveReady = r; });
  window._authReady = authReady;

  var SESSION_KEY = 'painel_role_v1';

  // ── Helpers de role ───────────────────────────────────────────────────────
  window._isLider    = function () { return window._authProfile && window._authProfile.role === 'lider'; };
  window._isGuardiao = function () { return window._authProfile && window._authProfile.role === 'guardiao'; };

  window._logout = function () {
    sessionStorage.removeItem(SESSION_KEY);
    window._authProfile = null;
    document.getElementById('app-main').style.display = 'none';
    showLoginScreen();
  };

  // ── Filtro de dashboards por role ─────────────────────────────────────────
  window._filterDashboardsByRole = function (dashboards) {
    if (!window._authProfile || window._authProfile.role === 'lider') return dashboards;
    return dashboards.filter(function (d) { return d.id === 'roteiros'; });
  };

  // ── Mostrar / ocultar telas ───────────────────────────────────────────────
  function showLoginScreen() {
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('app-main').style.display    = 'none';
    resetLoginUI();
  }

  function showApp(role) {
    window._authProfile = { role: role };
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-main').style.display    = '';
    applyRoleRestrictions();
  }

  // ── Restricoes de UI por role ─────────────────────────────────────────────
  function applyRoleRestrictions() {
    var isLider = window._authProfile && window._authProfile.role === 'lider';

    var sheetsBtn = document.querySelector('[data-tab="sheets"]');
    if (sheetsBtn) sheetsBtn.style.display = isLider ? '' : 'none';

    var btnNew = document.getElementById('btnOpenModal');
    if (btnNew) btnNew.style.display = isLider ? '' : 'none';

    if (!isLider) {
      var dashBtn = document.querySelector('[data-tab="dashboards"]');
      if (dashBtn) dashBtn.click();
    }

    updateHeaderInfo();
  }

  function updateHeaderInfo() {
    var c = document.getElementById('auth-user-info');
    if (!c || !window._authProfile) return;
    var role  = window._authProfile.role;
    var label = role === 'lider' ? 'Lider' : 'Guardiao';
    c.innerHTML =
      '<span class="auth-role-badge badge-' + role + '">' + label + '</span>' +
      '<button class="btn-icon" onclick="_logout()" title="Sair">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
        '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>' +
        '<polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg></button>';
  }

  // ── UI da tela de login ───────────────────────────────────────────────────
  var selectedRole = null;

  function resetLoginUI() {
    selectedRole = null;
    var pwSection = document.getElementById('authPasswordSection');
    var pwInput   = document.getElementById('authPassword');
    var errEl     = document.getElementById('authError');
    var cards     = document.querySelectorAll('.auth-role-card');
    if (pwSection) pwSection.style.display = 'none';
    if (pwInput)   pwInput.value = '';
    if (errEl)     errEl.textContent = '';
    cards.forEach(function (c) { c.classList.remove('selected'); });
  }

  function selectRole(role) {
    selectedRole = role;

    document.querySelectorAll('.auth-role-card').forEach(function (c) {
      c.classList.toggle('selected', c.dataset.role === role);
    });

    var label = document.getElementById('authPasswordLabel');
    if (label) label.textContent = 'Senha para ' + (role === 'lider' ? 'Lider' : 'Guardiao');

    var errEl = document.getElementById('authError');
    if (errEl) errEl.textContent = '';

    var pw = document.getElementById('authPassword');
    if (pw) pw.value = '';

    var section = document.getElementById('authPasswordSection');
    if (section) {
      section.style.display = '';
      if (pw) pw.focus();
    }
  }

  function confirmLogin() {
    if (!selectedRole) return;
    var pw    = document.getElementById('authPassword');
    var errEl = document.getElementById('authError');
    var input = pw ? pw.value : '';

    if (!input) {
      if (errEl) errEl.textContent = 'Digite a senha.';
      return;
    }

    if (input !== SENHAS[selectedRole]) {
      if (errEl) errEl.textContent = 'Senha incorreta.';
      if (pw) { pw.value = ''; pw.focus(); }
      return;
    }

    sessionStorage.setItem(SESSION_KEY, selectedRole);
    showApp(selectedRole);
    resolveReady();
  }

  // ── Event Listeners ───────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.auth-role-card').forEach(function (card) {
      card.addEventListener('click', function () { selectRole(card.dataset.role); });
    });

    var btnConfirm = document.getElementById('btnAuthConfirm');
    if (btnConfirm) btnConfirm.addEventListener('click', confirmLogin);

    var pw = document.getElementById('authPassword');
    if (pw) {
      pw.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') confirmLogin();
      });
    }
  });

  // ── Init: verifica sessao salva ───────────────────────────────────────────
  var saved = sessionStorage.getItem(SESSION_KEY);
  if (saved && SENHAS[saved]) {
    showApp(saved);
    resolveReady();
  } else {
    showLoginScreen();
    resolveReady();
  }

})();
