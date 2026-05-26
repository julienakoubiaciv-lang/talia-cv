/**
 * Identifiant anonyme persistant par appareil.
 * Généré une seule fois et stocké en localStorage.
 * Utilisé comme clé d'isolation dans Supabase (sans auth).
 */
const KEY = 'talia_device_id';

export function getDeviceId() {
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}
