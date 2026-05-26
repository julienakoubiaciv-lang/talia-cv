import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL  || '';
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabaseReady = Boolean(
  url && key
  && !url.includes('VOTRE_PROJET')
  && key !== 'votre_anon_key_ici'
);

// Ne crée le client que si les variables sont présentes
// pour éviter l'erreur "supabaseKey is required" au démarrage.
export const supabase = supabaseReady
  ? createClient(url, key)
  : null;
