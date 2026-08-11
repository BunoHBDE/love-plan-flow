/**
 * CONTEXTO DE AUTENTICAÇÃO
 *
 * Provê o estado de autenticação para toda a aplicação a partir de uma única
 * instância. Cada chamada de useAuth criava antes a sua própria subscription em
 * onAuthStateChange e o seu próprio loading inicial, o que fazia toda rota
 * protegida remontar com spinner e duplicava as buscas de profile e roles.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { AuthError, User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  company_name: string | null;
  company_logo_url: string | null;
}

interface UserRole {
  role: 'admin' | 'user';
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: string[];
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  /** Recarrega profile e roles do usuário atual (ex.: após salvar configurações). */
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // De qual usuário profile e roles já foram pedidos. onAuthStateChange dispara
  // também em TOKEN_REFRESHED (a cada renovação de token) e em paralelo ao
  // getSession inicial, e nenhum desses casos precisa refazer as buscas.
  const requestedUserIdRef = useRef<string | null>(null);

  const fetchUserData = useCallback(async (userId: string, force = false) => {
    // Busca já concluída ou em andamento: quem a iniciou encerra o loading
    if (!force && requestedUserIdRef.current === userId) {
      return;
    }

    requestedUserIdRef.current = userId;

    try {
      const [{ data: profileData }, { data: rolesData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('user_roles').select('role').eq('user_id', userId),
      ]);

      if (profileData) {
        setProfile(profileData);
      }

      if (rolesData) {
        setRoles(rolesData.map((r: UserRole) => r.role));
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Libera uma nova tentativa no próximo evento de auth
      requestedUserIdRef.current = null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Listener primeiro, para não perder eventos disparados durante o getSession
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        // Chamadas ao Supabase dentro do callback travam o cliente; adia para o próximo tick
        const userId = nextSession.user.id;
        setTimeout(() => {
          fetchUserData(userId);
        }, 0);
      } else {
        requestedUserIdRef.current = null;
        setProfile(null);
        setRoles([]);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        fetchUserData(currentSession.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;
    await fetchUserData(user.id, true);
  }, [user?.id, fetchUserData]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      profile,
      roles,
      loading,
      isAdmin: roles.includes('admin'),
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }),
    [user, session, profile, roles, loading, signIn, signUp, signOut, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
