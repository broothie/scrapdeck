import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { hasSupabaseConfig, supabase } from "./supabase";

type AuthContextValue = {
  isConfigured: boolean;
  isLoading: boolean;
  session: Session | null;
  user: User | null;
  username: string | null;
  signInWithMagicLink: (email: string) => Promise<{ error?: string }>;
  saveUsername: (username: string) => Promise<{ error?: string }>;
  signOut: () => Promise<{ error?: string }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(hasSupabaseConfig);
  const username =
    typeof session?.user.user_metadata?.username === "string"
      ? session.user.user_metadata.username
      : null;

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      setSession(data.session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isConfigured: hasSupabaseConfig,
      isLoading,
      session,
      user: session?.user ?? null,
      username,
      async signInWithMagicLink(email) {
        if (!supabase) {
          return { error: "Supabase is not configured yet." };
        }

        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });

        return error ? { error: error.message } : {};
      },
      async saveUsername(nextUsername) {
        if (!supabase) {
          return { error: "Supabase is not configured yet." };
        }

        const normalizedUsername = nextUsername.trim().toLowerCase();

        const { data, error } = await supabase.auth.updateUser({
          data: {
            username: normalizedUsername,
          },
        });

        if (error) {
          return { error: error.message };
        }

        setSession((currentSession) =>
          currentSession
            ? {
                ...currentSession,
                user: data.user ?? currentSession.user,
              }
            : currentSession,
        );

        return {};
      },
      async signOut() {
        if (!supabase) {
          return { error: "Supabase is not configured yet." };
        }

        const { error } = await supabase.auth.signOut({ scope: "local" });

        return error ? { error: error.message } : {};
      },
    }),
    [isLoading, session, username],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
