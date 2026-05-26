/**
 * mediaUpload.js — Upload de photos et logos vers Supabase Storage
 *
 * Si Supabase n'est pas configuré, retourne null silencieusement
 * et l'app continue à utiliser les data URLs base64 en localStorage.
 */
import { supabase, supabaseReady } from './supabase';
import { getDeviceId } from './deviceId';

const BUCKET = 'cv-media';

/**
 * Convertit une data URL base64 en Blob.
 */
function dataURLtoBlob(dataURL) {
  const [header, base64] = dataURL.split(',');
  const mime  = header.match(/:(.*?);/)[1];
  const bytes = atob(base64);
  const arr   = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

/**
 * Upload une photo/logo (data URL ou File) vers Supabase Storage.
 *
 * @param {string|File} source  — data URL base64 ou objet File
 * @param {'photo'|'logo'} type — sous-dossier
 * @param {string|number} cvId  — id du CV (pour nommer le fichier)
 * @returns {Promise<string|null>} URL publique signée (1 an) ou null si échec
 */
export async function uploadMedia(source, type, cvId) {
  if (!supabaseReady || !source) return null;

  try {
    const deviceId = getDeviceId();
    const ext      = 'jpg';
    const path     = `${deviceId}/${type}s/${cvId}.${ext}`;

    let blob;
    if (typeof source === 'string' && source.startsWith('data:')) {
      blob = dataURLtoBlob(source);
    } else if (source instanceof File) {
      blob = source;
    } else {
      return null;
    }

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, { upsert: true, contentType: blob.type || 'image/jpeg' });

    if (upErr) {
      console.warn('[mediaUpload] upload error:', upErr.message);
      return null;
    }

    // URL signée valable 1 an (365 * 24 * 3600 s)
    const { data: signedData, error: signErr } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, 365 * 24 * 3600);

    if (signErr || !signedData?.signedUrl) {
      console.warn('[mediaUpload] sign error:', signErr?.message);
      return null;
    }

    return signedData.signedUrl;
  } catch (err) {
    console.warn('[mediaUpload] unexpected error:', err);
    return null;
  }
}

/**
 * Supprime un média Supabase Storage.
 * @param {'photo'|'logo'} type
 * @param {string|number} cvId
 */
export async function deleteMedia(type, cvId) {
  if (!supabaseReady) return;
  const path = `${getDeviceId()}/${type}s/${cvId}.jpg`;
  await supabase.storage.from(BUCKET).remove([path]);
}
