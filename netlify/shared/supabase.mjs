/**
 * Tiny Supabase REST helper for server-side Netlify Functions.
 *
 * Uses the SERVICE ROLE key (server-only, bypasses row-level security) via the
 * PostgREST endpoint, so there's no SDK dependency to bundle. Returns null/[]
 * gracefully when Supabase isn't configured yet, so functions can no-op cleanly.
 *
 * Env:
 *   SUPABASE_URL                (e.g. https://xxxx.supabase.co)
 *   SUPABASE_SERVICE_ROLE_KEY   (secret — NEVER expose to the browser)
 */

export function hasSupabase() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function baseHeaders() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

function restUrl(path) {
  const base = process.env.SUPABASE_URL.replace(/\/$/, "");
  return `${base}/rest/v1/${path}`;
}

/** GET rows. `query` is a raw PostgREST query string (already URL-encoded). */
export async function sbSelect(table, query = "") {
  if (!hasSupabase()) return [];
  const res = await fetch(restUrl(`${table}${query ? `?${query}` : ""}`), {
    headers: baseHeaders(),
  });
  if (!res.ok) {
    throw new Error(`supabase select ${table} failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

/**
 * Insert (or upsert) one row. Pass `onConflict` to upsert on that column so a
 * duplicate webhook delivery updates instead of erroring. Returns the row.
 */
export async function sbInsert(table, row, { onConflict } = {}) {
  if (!hasSupabase()) return null;
  const prefer = onConflict
    ? "resolution=merge-duplicates,return=representation"
    : "return=representation";
  const q = onConflict ? `?on_conflict=${encodeURIComponent(onConflict)}` : "";
  const res = await fetch(restUrl(`${table}${q}`), {
    method: "POST",
    headers: { ...baseHeaders(), Prefer: prefer },
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    throw new Error(`supabase insert ${table} failed: ${res.status} ${await res.text()}`);
  }
  const rows = await res.json();
  return Array.isArray(rows) ? rows[0] ?? null : rows;
}

/** PATCH rows matching `query` (raw PostgREST filter). Returns updated rows. */
export async function sbUpdate(table, query, patch) {
  if (!hasSupabase()) return [];
  const res = await fetch(restUrl(`${table}?${query}`), {
    method: "PATCH",
    headers: { ...baseHeaders(), Prefer: "return=representation" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    throw new Error(`supabase update ${table} failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}
