const SUPABASE_URL = 'https://benrpugnnnrlopflishl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_j5kC-b1_3pTClKnN0Bou8Q_-GX-reDA';

const supabaseNamespace = (typeof supabase !== 'undefined' && supabase && typeof supabase.createClient === 'function')
  ? supabase
  : (typeof Supabase !== 'undefined' && Supabase && typeof Supabase.createClient === 'function')
    ? Supabase
    : null;

try {
  Object.keys(localStorage).filter(k => k.startsWith('sb-')).forEach(k => localStorage.removeItem(k));
} catch {}

const supabaseClient = supabaseNamespace
  ? supabaseNamespace.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: typeof sessionStorage !== 'undefined' ? sessionStorage : localStorage,
        persistSession: true,
        autoRefreshToken: true
      }
    })
  : null;

globalThis.supabase = supabaseClient;
globalThis.SUPABASE_URL = SUPABASE_URL;
globalThis.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;

if (!globalThis.supabase) {
  console.error('Supabase no está inicializado. Verifica la importación del SDK.');
}
