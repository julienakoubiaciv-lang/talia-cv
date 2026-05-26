/**
 * Utilitaires partagés entre tous les templates CV.
 * Importés depuis les composants React — pas de dépendances externes.
 */

/** Échappe les caractères HTML pour éviter l'injection */
export function escH(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Calcule l'âge à partir d'une date au format DD/MM/YYYY.
 * Retourne null si la date est invalide ou l'âge incohérent.
 */
export function calcAge(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length < 3) return null;
  const birth = new Date(+parts[2], +parts[1] - 1, +parts[0]);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 0 && age < 120 ? age : null;
}

/** Retourne " (X ans)" ou "" selon la date */
export function ageLabel(dateStr) {
  const age = calcAge(dateStr);
  return age !== null ? ` (${age} ans)` : '';
}
