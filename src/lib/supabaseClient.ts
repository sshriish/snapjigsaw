import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Sync/sharing features are optional — the app still works fully offline
// (localStorage-only) if these env vars aren't configured. Callers should
// check `isSupabaseConfigured` before relying on `supabase`.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase env vars are not set. Cross-device sync and link sharing are disabled; ' +
      'the app will fall back to local-only storage. See .env.example for setup.'
  );
}

// When not configured, we still need a non-null export so imports don't
// crash — point it at a placeholder that will simply fail any real request.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);
