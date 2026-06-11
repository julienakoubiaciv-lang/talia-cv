/**
 * useEncadrant — L'utilisateur a-t-il accès à l'espace encadrant ?
 *
 * Réel : il est manager ou admin d'au moins une organisation (org_members).
 * Démo : selon un flag explicite (par défaut NON → expérience élève propre ;
 * un toggle dans « Compte » permet de basculer pour tester).
 *
 * → Un élève ne voit jamais l'espace encadrant.
 */
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth.jsx';
import { isDemoMode } from '@/lib/demoMode';
import { isDemoEncadrant } from '@/lib/demoCohort';
import { supabase, supabaseReady } from '@/lib/supabase';

export function useEncadrant() {
  const { user } = useAuth();
  const [isEncadrant, setIsEncadrant] = useState(() => (isDemoMode() ? isDemoEncadrant() : false));

  useEffect(() => {
    if (isDemoMode()) { setIsEncadrant(isDemoEncadrant()); return; }
    if (!supabaseReady || !supabase || !user) { setIsEncadrant(false); return; }
    let alive = true;
    supabase.from('org_members').select('role').eq('user_id', user.id).in('role', ['manager', 'admin']).limit(1)
      .then(({ data }) => { if (alive) setIsEncadrant(!!(data && data.length)); })
      .catch(() => { if (alive) setIsEncadrant(false); });
    return () => { alive = false; };
  }, [user]);

  return isEncadrant;
}
