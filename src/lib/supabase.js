import { createClient } from '@supabase/supabase-js';

const url  = import.meta.env.VITE_SUPABASE_URL  || '';
const key  = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Si les variables ne sont pas configurées, le client existe mais toutes
// les requêtes échoueront silencieusement (fallback localStorage).
export const supabase = createClient(url, key);

export const supabaseReady = Boolean(url && key
  && !url.includes('VOTRE_PROJET')
  && key !== 'votre_anon_key_ici');
