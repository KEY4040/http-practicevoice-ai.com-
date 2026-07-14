-- ---------------------------------------------------------------------------
-- Usage metering + minute caps (so a heavy customer can't run up more Retell
-- cost than their plan pays for). Adds three columns to clinics:
--   usage_minutes       - call-minutes used in the current month
--   usage_period_start  - when the current usage month began (auto-resets)
--   usage_suspended     - true when the line is paused for hitting its cap
--
-- Enforced by netlify/functions/retell-webhook.mjs (pause on over-limit) and
-- re-enabled by the hourly send-reminders sweep (month reset / plan upgrade).
-- Idempotent — safe to run once in the Supabase SQL editor.
-- ---------------------------------------------------------------------------
alter table public.clinics add column if not exists usage_minutes numeric(10, 2) not null default 0;
alter table public.clinics add column if not exists usage_period_start timestamptz;
alter table public.clinics add column if not exists usage_suspended boolean not null default false;
