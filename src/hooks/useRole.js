/**
 * useRole — Lecture du rôle (owner | admin | user) depuis profiles.
 *
 * Utilisé pour :
 *   - bypass quotas (owner/admin n'ont pas de limites)
 *   - accès au dashboard /admin
 *   - features réservées (override plan, vue toutes orgs, etc.)
 *
 * Retourne { role, isOwner, isAdmin, isStaff, loading }
 *   - isStaff = isOwner || isAdmin (pratique pour les guards UI)
 */
import { useState, useEffect } from 'react';
import { supabase, supabaseReady } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth.jsx';

export function useRole() {
  const { user } = useAuth();
  const [role, setRole]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (!user || !supabaseReady || !supabase) {
      setRole(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          setRole('user');
        } else {
          setRole(data.role || 'user');
        }
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [user]);

  const isOwner = role === 'owner';
  const isAdmin = role === 'admin';
  const isStaff = isOwner || isAdmin;

  return { role, isOwner, isAdmin, isStaff, loading };
}
