import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { AuthContext, type AuthContextValue } from './AuthContext';
import type { Session } from '@supabase/supabase-js';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load Supabase session:', err);
        setIsLoading(false);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = async (email: string): Promise<string | null> => {
    if (!isSupabaseConfigured) {
      return 'Sync is not configured for this deployment yet.';
    }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    return error ? error.message : null;
  };

  const signOut = async () => {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
  };

  const value: AuthContextValue = { session, isLoading, signInWithEmail, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
