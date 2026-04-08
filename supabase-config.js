// ─────────────────────────────────────────────────────────────────────────────
// Supabase Client — configuracao
// ─────────────────────────────────────────────────────────────────────────────
// Anon key e URL sao seguros para o client-side.
// A protecao real vem das RLS policies no banco.
// NUNCA coloque a service_role key aqui.
// ─────────────────────────────────────────────────────────────────────────────

const SUPABASE_URL  = 'https://SEU_PROJETO.supabase.co';
const SUPABASE_ANON = 'COLE_SUA_ANON_KEY_AQUI';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

window._supabaseClient = _supabase;
window.SUPABASE_URL    = SUPABASE_URL;
