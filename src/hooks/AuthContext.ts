import { createContext } from 'react';
import type { Session } from '@supabase/supabase-js';

export interface AuthContextValue {
  session: Session | null;
  isLoading: boolean;
  /** Sends a magic link to the given email. Resolves to an error message, or null on success. */
  signInWithEmail: (email: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
