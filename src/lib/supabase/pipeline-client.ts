import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Inicialización lazy — el error se lanza al primer uso, no al importar el módulo.
// Esto permite que Next.js compile el bundle aunque las env vars no estén en build time.
let _client: SupabaseClient | null = null;

export function getPipelineClient(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_CATALOGO_URL;
  const key = process.env.SUPABASE_CATALOGO_SERVICE_KEY;

  if (!url || !key) {
    throw new Error(
      'Faltan NEXT_PUBLIC_SUPABASE_CATALOGO_URL o SUPABASE_CATALOGO_SERVICE_KEY en .env.local'
    );
  }

  // Service key bypassa RLS. Solo usar en API routes de servidor.
  _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}
