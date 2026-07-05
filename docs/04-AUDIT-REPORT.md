# 4-Level Code Audit — Report & Fixes

The codebase was audited across four independent levels. Each level was reviewed
by a separate reviewer reading the code fresh. This document lists what was
found and what was fixed.

**Bottom line:** No critical or high-severity *bugs* were found. One high-severity
*security hardening* issue (a fail-open auth fallback) was found and fixed. All
meaningful findings across all four levels have been resolved; a short list of
intentional "later" items is tracked at the end.

---

## Level 1 — Correctness (bugs, logic, edge cases)

| # | Severity | Finding | Status |
| - | -------- | ------- | ------ |
| 1 | Medium | `onAuthStateChange` listener was never unsubscribed (leak / StrictMode double-register) | ✅ Fixed — cleanup now unsubscribes |
| 2 | Medium | Malformed `localStorage` demo value could hang the app on the loading spinner forever | ✅ Fixed — parse wrapped in try/catch + `finally` always clears loading |
| 3 | Medium | Footer "How it works" / section links didn't scroll to their section | ✅ Fixed — hash links now use native anchors |
| 4 | Low | "Talk to sales" button had a dead ternary routing to signup | ✅ Fixed — routes to sales email |
| 5 | Low | Empty email local-part produced a blank greeting | ✅ Fixed — `nameFromEmail` falls back to "there" |
| 6 | Low | Blank profile name wasn't backfilled from email | ✅ Fixed — `resolveName` trims + falls back |
| 7 | Low | Post-login redirect could race the async auth event | ✅ Fixed — user set synchronously from the resolved session |

## Level 2 — Security & Privacy

| # | Severity | Finding | Status |
| - | -------- | ------- | ------ |
| 1 | **High** | Missing Supabase keys **silently** enabled a login that accepts any password — a one-variable misconfig could ship an open door to production | ✅ **Fixed — auth now fails closed**; demo mode must be opted into explicitly via `VITE_DEMO_MODE=true` |
| 2 | Medium | `ProtectedRoute` is client-side only (not a real security boundary) | ✅ Addressed — RLS is the true boundary; documented. All real data must be fetched through the authenticated Supabase client |
| 3 | Medium | No security headers at the host layer | ✅ Fixed — CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy added to `netlify.toml` |
| 4 | Low | RLS policies not scoped to the authenticated role | ✅ Fixed — `to authenticated` + `force row level security` added to `schema.sql` |
| 5 | Low | Marketing HIPAA/encryption claims outrun the current implementation | ⚠️ Documented — see launch checklist; requires a signed Supabase BAA + MFA/audit logging before relying on the claims |

**Passed clean:** no hardcoded secrets (only the public anon key is exposed),
no XSS surface (`dangerouslySetInnerHTML`/`eval` absent, all content
auto-escaped), and `npm audit` reports **0 vulnerabilities**.

## Level 3 — UX, Accessibility & Responsive

| Severity | Finding | Status |
| -------- | ------- | ------ |
| High | Collapsed mobile nav menu was still keyboard-focusable | ✅ Fixed — hidden from tab order when closed |
| High | Mobile dashboard drawer lacked focus management | ✅ Fixed — Escape-to-close, `role="dialog"`, focus moved in/restored out |
| High | Skip-to-content link | ✅ Present in `index.html` (targets `#main` on every shell) |
| Medium | "Talk to sales" routed to signup | ✅ Fixed |
| Medium | Voice picker's selection was cosmetic-only and broken by keyboard | ✅ Fixed — now state-driven with a visible focus ring |
| Medium | Unlabeled search / add-service inputs | ✅ Fixed — `aria-label`s added |
| Medium | Chart & revenue bars had no text alternative | ✅ Fixed — `aria-label` summary + `role="progressbar"` |
| Medium | No `prefers-reduced-motion` support | ✅ Fixed — reduced-motion CSS block added |
| Medium | Toggle buttons / hamburger didn't expose state | ✅ Fixed — `aria-pressed` / `aria-expanded` added |
| Medium | No `<h1>` on mobile dashboard views | ✅ Fixed — page headings promoted to `<h1>` |
| Medium | Table row showed a clickable affordance but most cells weren't | ✅ Fixed — whole row navigates; duplicate link removed |
| Low | Placeholder contrast, invisible step numbers, unlinked Terms/Privacy, dead "Forgot password?" | ✅ All fixed |

## Level 4 — Production & Deploy Readiness

| Severity | Finding | Status |
| -------- | ------- | ------ |
| Medium | OG/Twitter images were SVG (don't render as social previews) | ✅ Fixed — rasterized to `og-image.png` (1200×630) |
| Medium | Static per-page SEO (every route reported the homepage title/canonical) | ✅ Fixed — per-route title/description/canonical/robots via `useDocumentMeta` |
| Medium | Supabase SDK bundled into the marketing first-load | ✅ Fixed — lazy-loaded; first-load ~55 KB gzip (was ~130 KB) |
| Low | No `apple-touch-icon` | ✅ Fixed — 180×180 PNG added |
| Low | No security/caching headers | ✅ Fixed — see Level 2 #3; immutable caching on `/assets/*` |
| Low | Manifest `start_url` pointed at an auth-gated route | ✅ Fixed — set to `/` |
| Low | Render-blocking Google Fonts | ⚠️ Later — self-host to fully remove the third-party hop |
| Low | No analytics / error monitoring | ⚠️ Later — hook points noted (`ErrorBoundary`, `index.html`) |

**Verified:** production build is clean, SPA deep-links/refresh work, env vars
are handled resiliently in every mode, and error-boundary / 404 / loading
fallbacks all function.

---

## Intentional "later" items (not blockers)

These are deliberate follow-ups, safe to defer until you have real customers:

1. **Self-host the Inter font** to remove the Google Fonts request entirely.
2. **Analytics + error monitoring** (e.g. Plausible + Sentry) — one snippet each.
3. **HIPAA hardening** before publicly leaning on the compliance claims: signed
   Supabase BAA, MFA, password policy, audit logging, session timeouts.
4. **Legal review** of the Privacy / Terms / HIPAA template pages.
5. **512px maskable PWA icon** for the best Android install experience.

---

## How the app behaves by environment (important)

Because of the security fix, auth now behaves like this:

| Environment | Supabase keys set? | `VITE_DEMO_MODE`? | Result |
| ----------- | ------------------ | ----------------- | ------ |
| Local `npm run dev` | no | (auto) | Demo mode — any login, mock data |
| Production build | **yes** | — | **Real auth** via Supabase |
| Production build | no | `true` | Demo mode (intentional showcase deploy) |
| Production build | no | no | **Login disabled (fails closed)** — the safe default |

To deploy a public demo, set `VITE_DEMO_MODE=true`. To go live for real, set the
two `VITE_SUPABASE_*` variables (see `docs/03-LAUNCH-CHECKLIST.md`).
