-- 5-expert re-grade follow-ups: close the INSERT/DELETE half of the clinics
-- lockdown, add binding-collision guards, and make booking alerts durable.

-- Blocker 1: the prior column lockdown only revoked UPDATE. INSERT and DELETE
-- were still open to the authenticated role, so a signed-in owner could DELETE
-- their clinic row and re-INSERT it with usage_minutes=0 / usage_suspended=false
-- and their own retell bindings — resetting the meter and defeating the plan cap.
-- Restrict both verbs to the settings-only insert the app actually performs
-- (getOrCreateClinic inserts owner_id/name/phone). service_role is unaffected.
revoke insert, delete on public.clinics from authenticated;
grant insert (owner_id, name, phone) on public.clinics to authenticated;

-- Defense in depth: two clinics can never share a Retell binding, so a colliding
-- retell_number / retell_agent_id can never divert another tenant's inbound call.
create unique index if not exists clinics_retell_number_key
  on public.clinics (retell_number) where retell_number is not null;
create unique index if not exists clinics_retell_agent_id_key
  on public.clinics (retell_agent_id) where retell_agent_id is not null;

-- Blocker 3: make booking notifications durable + retriable. The owner alert now
-- fires until this flag flips true; the hourly send-reminders sweep re-drives any
-- that didn't reach the owner, so a Resend/Twilio hiccup or a function timeout
-- can't drop a booking alert permanently.
alter table public.appointments
  add column if not exists owner_notified boolean not null default false;
