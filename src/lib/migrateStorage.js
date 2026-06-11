/**
 * migrateStorage — Migration des clés localStorage de l'ancienne convention
 * `talia_*` vers la nouvelle (`altio_*`, et `ALTIO_CV_*` pour les données CV).
 *
 * Exécutée UNE fois au tout premier chargement (import à effet de bord placé
 * AVANT App dans main.jsx, donc avant que quoi que ce soit lise le stockage).
 * Sans perte : on copie l'ancienne valeur vers la nouvelle clé seulement si
 * celle-ci est absente, puis on retire l'ancienne clé.
 */
const SPECIAL = {
  talia_cv_hist: 'ALTIO_CV_hist',
  talia_cv_profiles: 'ALTIO_CV_profiles',
  talia_cv_active_profile: 'ALTIO_CV_active_profile',
  talia_cv_list: 'ALTIO_CV_list',
};

/** Renomme toutes les clés talia_* présentes. Idempotent. */
export function migrateLegacyStorage() {
  try {
    if (typeof localStorage === 'undefined') return 0;
    let migrated = 0;
    for (const k of Object.keys(localStorage)) {
      if (!k.startsWith('talia_')) continue;
      const nk = SPECIAL[k] || `altio_${k.slice('talia_'.length)}`;
      const val = localStorage.getItem(k);
      if (val != null && localStorage.getItem(nk) == null) { localStorage.setItem(nk, val); migrated += 1; }
      localStorage.removeItem(k);
    }
    return migrated;
  } catch { return 0; }
}

// Effet de bord à l'import : la migration tourne avant le reste de l'app.
migrateLegacyStorage();
