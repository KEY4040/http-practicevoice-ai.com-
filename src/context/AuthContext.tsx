import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface AuthUser {
  email: string;
  name: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  /** True when running without Supabase creds (demo/mock auth). */
  demoMode: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const DEMO_KEY = "pv_demo_user";

function nameFromEmail(email: string): string {
  const handle = email.split("@")[0] ?? "there";
  return handle
    .split(/[._-]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on load — from Supabase if configured, else from
  // localStorage for the self-contained demo experience.
  useEffect(() => {
    let active = true;

    async function init() {
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.auth.getSession();
        if (active && data.session?.user) {
          const u = data.session.user;
          setUser({
            email: u.email ?? "",
            name: (u.user_metadata?.name as string) ?? nameFromEmail(u.email ?? ""),
          });
        }
        supabase.auth.onAuthStateChange((_event, session) => {
          if (!active) return;
          if (session?.user) {
            setUser({
              email: session.user.email ?? "",
              name:
                (session.user.user_metadata?.name as string) ??
                nameFromEmail(session.user.email ?? ""),
            });
          } else {
            setUser(null);
          }
        });
      } else {
        const raw = localStorage.getItem(DEMO_KEY);
        if (active && raw) setUser(JSON.parse(raw) as AuthUser);
      }
      if (active) setLoading(false);
    }

    init();
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const setDemoUser = (u: AuthUser) => {
      localStorage.setItem(DEMO_KEY, JSON.stringify(u));
      setUser(u);
    };

    return {
      user,
      loading,
      demoMode: !isSupabaseConfigured,
      async signIn(email, password) {
        if (isSupabaseConfigured && supabase) {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
        } else {
          setDemoUser({ email, name: nameFromEmail(email) });
        }
      },
      async signUp(email, password, name) {
        if (isSupabaseConfigured && supabase) {
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { name } },
          });
          if (error) throw error;
        } else {
          setDemoUser({ email, name: name || nameFromEmail(email) });
        }
      },
      async signOut() {
        if (isSupabaseConfigured && supabase) {
          await supabase.auth.signOut();
        } else {
          localStorage.removeItem(DEMO_KEY);
          setUser(null);
        }
      },
    };
  }, [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
