/**
 * currentUser.js — State global de l'utilisateur connecté
 *
 * Module singleton mis à jour par AuthProvider.
 * Permet à historySync et mediaUpload (modules non-React)
 * d'accéder à l'ID courant sans dépendre du contexte React.
 */
import { getDeviceId } from './deviceId';

let _userId = null;

/** Appelé par AuthProvider quand l'état auth change. */
export function setCurrentUserId(id) {
  _userId = id || null;
}

/**
 * Retourne l'identifiant courant :
 *   - user_id Supabase si connecté
 *   - device_id anonyme sinon
 */
export function getCurrentUserId() {
  return _userId || getDeviceId();
}

/** True si l'utilisateur est connecté (pas anonyme). */
export function isAuthenticated() {
  return Boolean(_userId);
}
