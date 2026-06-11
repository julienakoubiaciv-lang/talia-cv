/**
 * ProgressSync — Monte la synchronisation de progression (offline-first).
 *
 * Au login : tire la progression distante, la fusionne avec le local, réhydrate.
 * Ensuite : repousse vers Supabase quand l'onglet passe en arrière-plan, à la
 * fermeture, et périodiquement — uniquement si la progression a changé.
 *
 * Ne rend rien. No-op si Supabase non configuré ou utilisateur non connecté.
 */
import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth.jsx';
import { pullProgress, pushProgress, snapshotJson } from '@/lib/progressSync';

export default function ProgressSync() {
  const { user } = useAuth();
  const lastJson = useRef('');

  useEffect(() => {
    if (!user) return;
    let alive = true;

    pullProgress().then(() => { if (alive) lastJson.current = snapshotJson(); });

    const flush = () => {
      const j = snapshotJson();
      if (j !== lastJson.current) { lastJson.current = j; pushProgress(); }
    };
    const onVisibility = () => { if (document.visibilityState === 'hidden') flush(); };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('beforeunload', flush);
    const iv = setInterval(flush, 90_000);

    return () => {
      alive = false;
      flush();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('beforeunload', flush);
      clearInterval(iv);
    };
  }, [user]);

  return null;
}
