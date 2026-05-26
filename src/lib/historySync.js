/**
 * historySync.js — Couche de synchronisation CV History
 *
 * Stratégie "write-through cache" :
 *   • localStorage = cache rapide + mode hors-ligne
 *   • Supabase     = stockage persistant (multi-appareil plus tard)
 *
 * Si Supabase n'est pas configuré → tout reste en localStorage (fallback silencieux).
 */
import { supabase, supabaseReady } from './supabase';
import { getDeviceId } from './deviceId';

// ── helpers locaux ──────────────────────────────────────────────────────────

const LS_KEY = 'talia_cv_hist';

function lsGet() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
  catch { return []; }
}

function lsSet(arr) {
  localStorage.setItem(LS_KEY, JSON.stringify(arr));
}

/** Convertit un enregistrement Supabase → shape locale */
function fromRow(row) {
  return {
    id:        row.id,
    name:      row.name || '',
    date:      row.date || '',
    html:      row.html || '',
    data:      row.data || null,
    formation: row.formation || '',
    bulkId:    row.bulk_id || null,
    bulkLabel: row.bulk_label || null,
    favorite:  row.favorite || false,
    photoUrl:  row.photo_url || null,
    logoUrl:   row.logo_url || null,
  };
}

/** Convertit la shape locale → colonne Supabase */
function toRow(entry) {
  return {
    id:         String(entry.id),
    device_id:  getDeviceId(),
    name:       entry.name || '',
    date:       entry.date || '',
    html:       entry.html || '',
    data:       entry.data || null,
    formation:  entry.formation || '',
    bulk_id:    entry.bulkId || null,
    bulk_label: entry.bulkLabel || null,
    favorite:   entry.favorite || false,
    photo_url:  entry.photoUrl || null,
    logo_url:   entry.logoUrl || null,
  };
}

// ── API publique ────────────────────────────────────────────────────────────

/**
 * Lit l'historique local immédiatement, puis lance une synchro
 * Supabase en arrière-plan et retourne l'historique fusionné.
 * Appel : const entries = await getHistory();
 */
export async function getHistory() {
  const local = lsGet();
  if (!supabaseReady) return local;

  try {
    const { data, error } = await supabase
      .from('cv_history')
      .select('*')
      .eq('device_id', getDeviceId())
      .order('created_at', { ascending: false })
      .limit(100);

    if (error || !data) return local;

    // Fusion : Supabase est la source de vérité.
    // Pour chaque entrée Supabase, on l'écrase en local.
    const remoteMap = Object.fromEntries(data.map(r => [r.id, fromRow(r)]));
    const localMap  = Object.fromEntries(local.map(e => [String(e.id), e]));
    const merged    = { ...localMap, ...remoteMap }; // remote wins
    const arr       = Object.values(merged).sort((a, b) => Number(b.id) - Number(a.id));
    lsSet(arr);
    return arr;
  } catch {
    return local;
  }
}

/**
 * Sauvegarde un nouveau CV dans localStorage ET Supabase.
 * Retourne l'id créé.
 */
export async function saveHistory(name, html, data, formation, opts = {}) {
  const local = lsGet();
  const now   = Date.now();

  // Dédoublonnage : même nom créé dans la dernière minute
  const sameIdx = local.findIndex(h => h.name === name && (now - Number(h.id)) < 60_000);
  if (sameIdx >= 0) local.splice(sameIdx, 1);

  const entry = {
    id:        now,
    name,
    date: new Date().toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }),
    html,
    data:      data || null,
    formation: formation || '',
    bulkId:    opts.bulkId   || null,
    bulkLabel: opts.bulkLabel || null,
    favorite:  false,
    photoUrl:  opts.photoUrl  || null,
    logoUrl:   opts.logoUrl   || null,
  };

  local.unshift(entry);
  if (local.length > 50) local.pop();
  lsSet(local);

  // Supabase (fire-and-forget)
  if (supabaseReady) {
    supabase.from('cv_history').upsert(toRow(entry)).then(({ error }) => {
      if (error) console.warn('[historySync] upsert error:', error.message);
    });
  }

  return now;
}

/**
 * Met à jour un champ d'une entrée existante (ex: favorite, html, data).
 */
export async function updateHistory(id, patch) {
  const local = lsGet();
  const idx   = local.findIndex(h => String(h.id) === String(id));
  if (idx < 0) return false;

  local[idx] = {
    ...local[idx],
    ...patch,
    date: new Date().toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }),
  };
  lsSet(local);

  if (supabaseReady) {
    const row = toRow(local[idx]);
    supabase.from('cv_history').update(row).eq('id', String(id)).then(({ error }) => {
      if (error) console.warn('[historySync] update error:', error.message);
    });
  }

  return true;
}

/**
 * Supprime un CV de localStorage ET Supabase.
 */
export async function deleteHistory(id) {
  const local = lsGet().filter(h => String(h.id) !== String(id));
  lsSet(local);

  if (supabaseReady) {
    supabase.from('cv_history').delete().eq('id', String(id)).then(({ error }) => {
      if (error) console.warn('[historySync] delete error:', error.message);
    });
  }
}

/**
 * Retourne l'historique local de façon synchrone (pour les composants
 * qui ne peuvent pas attendre une promesse).
 */
export function getHistorySync() {
  return lsGet();
}
