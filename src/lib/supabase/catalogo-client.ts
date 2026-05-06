import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_CATALOGO_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_CATALOGO_ANON!;

export const catalogoClient = createClient(url, key);
