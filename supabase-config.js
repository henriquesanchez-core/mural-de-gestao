// ─────────────────────────────────────────────────────────────────────────────
// Supabase Client — configuracao
// ─────────────────────────────────────────────────────────────────────────────
// Anon key e URL sao seguros para o client-side.
// A protecao real vem das RLS policies no banco.
// NUNCA coloque a service_role key aqui.
// ─────────────────────────────────────────────────────────────────────────────

const SUPABASE_URL  = 'https://SEU_PROJETO.supabase.co';
const SUPABASE_ANON = 'COLE_SUA_ANON_KEY_AQUI';

// Detecta se as credenciais ainda sao placeholder
const _supabaseConfigured =
  SUPABASE_URL  !== 'https://SEU_PROJETO.supabase.co' &&
  SUPABASE_ANON !== 'COLE_SUA_ANON_KEY_AQUI';

window._supabaseConfigured = _supabaseConfigured;

try {
  if (!_supabaseConfigured) throw new Error('Credenciais nao configuradas');
  if (typeof supabase === 'undefined') throw new Error('CDN nao carregou');
  const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
  window._supabaseClient = _supabase;
  window.SUPABASE_URL    = SUPABASE_URL;
} catch (e) {
  console.warn('Supabase:', e.message);
  window._supabaseClient = null;
}
