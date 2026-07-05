import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Whether real Supabase credentials are configured. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Demo mode runs the app with mock auth + mock data (no backend). It is enabled
 * ONLY when explicitly opted into:
 *   - automatically during local development (`npm run dev`), or
 *   - by setting `VITE_DEMO_MODE=true` for an intentional demo deploy.
 *
 * It is NEVER silently enabled in a production build. This prevents the
 * dangerous case where a real deploy is missing its Supabase keys and would
 * otherwise fall back to a login that accepts any email/password.
 */
export const isDemoMode =
  import.meta.env.VITE_DEMO_MODE === "true" ||
  (!isSupabaseConfigured && import.meta.env.DEV);

/**
 * Fail closed: a production build with neither real credentials nor an explicit
 * demo opt-in is a misconfiguration. Surface it loudly so it can't quietly ship
 * an open door. `AuthContext` also refuses to sign anyone in in this state.
 */
export const isAuthMisconfigured =
  import.meta.env.PROD && !isSupabaseConfigured && !isDemoMode;

if (isAuthMisconfigured) {
  // eslint-disable-next-line no-console
  console.error(
    "[PracticeVoice AI] Authentication is not configured. Set VITE_SUPABASE_URL " +
      "and VITE_SUPABASE_ANON_KEY, or set VITE_DEMO_MODE=true for an intentional " +
      "demo deploy. Logins are disabled until this is resolved."
  );
}

/**
 * Lazily create (and cache) the Supabase client. The SDK is imported
 * dynamically so it stays out of the main marketing bundle and only downloads
 * once real auth is actually used. Returns null when creds aren't configured.
 */
let clientPromise: Promise<SupabaseClient> | null = null;
export function getSupabase(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured) return Promise.resolve(null);
  if (!clientPromise) {
    clientPromise = import("@supabase/supabase-js").then(({ createClient }) =>
      createClient(supabaseUrl as string, supabaseAnonKey as string)
    );
  }
  return clientPromise;
}
