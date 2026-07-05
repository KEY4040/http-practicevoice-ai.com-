import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getSupabase,
  isSupabaseConfigured,
  isDemoMode,
} from "@/lib/supabase";

interface AuthUser {
  email: string;
  name: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  /** True when running in demo/mock auth (no real backend). */
  demoMode: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const DEMO_KEY = "pv_demo_user";

/** Error thrown when auth is neither configured nor in demo mode. */
const MISCONFIGURED_MESSAGE =
  "Sign-in is temporarily unavailable. Please contact support.";

function nameFromEmail(email: string): string {
  const handle = email.split("@")[0] ?? "";
  const derived = handle
    .split(/[._-]/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
  return derived || "there";
}

/** Prefer an explicit metadata name, falling back to an email-derived one. */
function resolveName(metaName: unknown, email: string): string {
  const trimmed = typeof metaName === "string" ? metaName.trim() : "";
  return trimmed || nameFromEmail(email);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on load — from Supabase if configured, else from
  // localStorage for the self-contained demo experience.
  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    async function init() {
      try {
        if (isSupabaseConfigured) {
          const supabase = await getSupabase();
          if (!supabase) return;
          const { data } = await supabase.auth.getSession();
          if (active && data.session?.user) {
            const u = data.session.user;
            setUser({
              email: u.email ?? "",
              name: resolveName(u.user_metadata?.name, u.email ?? ""),
            });
          }
          const { data: sub } = supabase.auth.onAuthStateChange(
            (_event, session) => {
              if (!active) return;
              if (session?.user) {
                setUser({
                  email: session.user.email ?? "",
                  name: resolveName(
                    session.user.user_metadata?.name,
                    session.user.email ?? ""
                  ),
                });
              } else {
                setUser(null);
              }
            }
          );
          unsubscribe = () => sub.subscription.unsubscribe();
        } else if (isDemoMode) {
          // Guard against malformed/tampered localStorage so a bad value can't
          // wedge the app on the loading spinner forever.
          const raw = localStorage.getItem(DEMO_KEY);
          if (raw) {
            try {
              if (active) setUser(JSON.parse(raw) as AuthUser);
            } catch {
              localStorage.removeItem(DEMO_KEY);
            }
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    init();
    return () => {
      active = false;
      unsubscribe?.();
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
      demoMode: isDemoMode,
      async signIn(email, password) {
        if (isSupabaseConfigured) {
          const supabase = await getSupabase();
          if (!supabase) throw new Error(MISCONFIGURED_MESSAGE);
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) throw error;
          // Set the user synchronously off the resolved session so the redirect
          // to /dashboard doesn't race the async onAuthStateChange event.
          if (data.user) {
            setUser({
              email: data.user.email ?? email,
              name: resolveName(data.user.user_metadata?.name, email),
            });
          }
        } else if (isDemoMode) {
          setDemoUser({ email, name: nameFromEmail(email) });
        } else {
          throw new Error(MISCONFIGURED_MESSAGE);
        }
      },
      async signUp(email, password, name) {
        if (isSupabaseConfigured) {
          const supabase = await getSupabase();
          if (!supabase) throw new Error(MISCONFIGURED_MESSAGE);
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { name } },
          });
          if (error) throw error;
          if (data.user) {
            setUser({
              email: data.user.email ?? email,
              name: resolveName(name, email),
            });
          }
        } else if (isDemoMode) {
          setDemoUser({ email, name: resolveName(name, email) });
        } else {
          throw new Error(MISCONFIGURED_MESSAGE);
        }
      },
      async signOut() {
        if (isSupabaseConfigured) {
          const supabase = await getSupabase();
          await supabase?.auth.signOut();
        } else {
          localStorage.removeItem(DEMO_KEY);
        }
        setUser(null);
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
