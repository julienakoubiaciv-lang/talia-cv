/**
 * useAuth — Contexte d'authentification Supabase
 *
 * Expose : user, loading, signIn, signUp, signOut
 * Gère la migration automatique des CVs anonymes (device_id → user_id)
 * lors de la première connexion.
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, supabaseReady } from '@/lib/supabase';
import { setCurrentUserId } from '@/lib/currentUser';
import { getDeviceId } from '@/lib/deviceId';
import { identifyUser, resetUser, track } from '@/lib/monitoring';

const AuthContext = createContext(null);

/** Migre les CVs anonymes (device_id) vers le compte connecté (user_id). */
async function migrateAnonymousCVs(userId) {
  if (!supabase) return;
  const deviceId = getDeviceId();
  // Met à jour les entrées qui n'ont pas encore de user_id
  await supabase
    .from('cv_history')
    .update({ user_id: userId })
    .eq('device_id', deviceId)
    .is('user_id', null);
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabaseReady || !supabase) {
      setLoading(false);
      return;
    }

    // Session initiale
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      setCurrentUserId(u?.id ?? null);
      if (u) identifyUser(u);
      setLoading(false);
    });

    // Écoute les changements d'état auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      setCurrentUserId(u?.id ?? null);

      // Migration au premier sign-in
      if (event === 'SIGNED_IN' && u) {
        identifyUser(u);
        track('login', { method: 'supabase' });
        migrateAnonymousCVs(u.id).catch(() => {});
      }
      if (event === 'SIGNED_OUT') {
        track('signout');
        resetUser();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email, password) => {
    if (!supabase) throw new Error('Supabase non configuré');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, []);

  const signUp = useCallback(async (email, password) => {
    if (!supabase) throw new Error('Supabase non configuré');
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, supabaseReady }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
