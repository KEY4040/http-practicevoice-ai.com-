-- PracticeVoice AI — Supabase schema
-- Run in the Supabase SQL editor. Sets up clinics, calls, and appointments
-- with row-level security so each authenticated owner sees only their data.
--
-- This script is IDEMPOTENT: it drops anything it previously created before
-- rebuilding, so it's always safe to re-run (e.g. after a partial run).
-- The database is empty until real data flows in, so the drops are harmless.
--
-- Note on the server side: the Netlify functions (retell-webhook,
-- send-reminders) connect with the Supabase SERVICE ROLE key, which bypasses
-- row-level security by design — that's how a call from Retell gets written
-- into the right clinic. The browser only ever uses the anon key and is fully
-- constrained by the policies below.

-- Clean slate (drop in dependency order) ------------------------------------
drop table if exists public.appointments cascade;
drop table if exists public.calls cascade;
drop table if exists public.subscriptions cascade;
drop table if exists public.leads cascade;
drop table if exists public.clinics cascade;
drop type if exists public.call_outcome cascade;

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Clinics (one per practice owner) ------------------------------------------
create table public.clinics (
  id            uuid primary key default gen_random_uuid(),
  -- One clinic per owner. The unique constraint also makes the app's
  -- get-or-create race-safe: a second tab's insert conflicts and falls back to
  -- reading the existing row instead of creating a duplicate.
  owner_id      uuid not null unique references auth.users (id) on delete cascade,
  name          text not null,
  phone         text,
  services      text[] default '{}',
  open_days     text[] default '{Mon,Tue,Wed,Thu,Fri}',
  open_time     time default '08:00',
  close_time    time default '17:00',
  voice         text default 'Ava',
  calendar_connected boolean default false,
  -- Maps an incoming Retell call to this clinic. Either is enough:
  --   retell_number   = the phone number callers dial (Retell "to_number")
  --   retell_agent_id = the Retell agent id that answered the call
  -- For a single practice you can skip both and set DEFAULT_CLINIC_ID instead.
  retell_number text,
  retell_agent_id text,
  -- The Retell "LLM" (the agent's brain/script) id, so we can update the prompt
  -- when the owner changes their settings.
  retell_llm_id text,
  -- Free-text description the owner writes so the AI knows their business
  -- (what they do, prices, FAQs). Feeds the agent's prompt.
  about         text,
  created_at    timestamptz not null default now()
);

-- Migration for databases created before the self-serve provisioning columns
-- existed. Safe to run repeatedly.
alter table public.clinics add column if not exists retell_llm_id text;
alter table public.clinics add column if not exists about text;

-- Calls ---------------------------------------------------------------------
create type public.call_outcome as enum ('booked', 'escalated', 'missed', 'info');

create table public.calls (
  id            uuid primary key default gen_random_uuid(),
  clinic_id     uuid not null references public.clinics (id) on delete cascade,
  -- Retell's own call id, so a repeated webhook can't create a duplicate row.
  retell_call_id text unique,
  caller_name   text,
  caller_phone  text,
  started_at    timestamptz not null default now(),
  duration_sec  integer default 0,
  outcome       public.call_outcome not null default 'info',
  reason        text,
  summary       text,
  transcript    jsonb default '[]',
  revenue       numeric(10, 2) default 0,
  notes         text
);

create index calls_clinic_started_idx
  on public.calls (clinic_id, started_at desc);

-- Migration for databases whose `calls` table predates these columns. Without
-- them the retell-webhook insert fails with 42703 ("column ... does not exist")
-- and NO call is ever saved. Safe to run repeatedly. See
-- supabase/migrations/2026-07-14-calls-columns.sql for the standalone version.
alter table public.calls add column if not exists retell_call_id text;
alter table public.calls add column if not exists caller_name   text;
alter table public.calls add column if not exists caller_phone  text;
alter table public.calls add column if not exists started_at    timestamptz not null default now();
alter table public.calls add column if not exists duration_sec  integer default 0;
alter table public.calls add column if not exists outcome       public.call_outcome not null default 'info';
alter table public.calls add column if not exists reason        text;
alter table public.calls add column if not exists summary       text;
alter table public.calls add column if not exists transcript    jsonb default '[]';
alter table public.calls add column if not exists revenue       numeric(10, 2) default 0;
alter table public.calls add column if not exists notes         text;
create unique index if not exists calls_retell_call_id_key
  on public.calls (retell_call_id);

-- Appointments (created when a call books) ----------------------------------
create table public.appointments (
  id            uuid primary key default gen_random_uuid(),
  clinic_id     uuid not null references public.clinics (id) on delete cascade,
  call_id       uuid references public.calls (id) on delete set null,
  patient_name  text,
  -- The patient's number, copied onto the appointment so the reminder job can
  -- text them without having to join back through the call.
  patient_phone text,
  type          text,
  provider      text,
  scheduled_for timestamptz,
  -- Set true once the 24h reminder text has gone out, so it only sends once.
  reminder_sent boolean not null default false,
  created_at    timestamptz not null default now()
);

-- The reminder job scans for appointments coming up in ~24h that haven't been
-- reminded yet; this index keeps that scan fast.
create index appointments_reminder_idx
  on public.appointments (scheduled_for)
  where reminder_sent = false;

-- Subscriptions (billing entitlement, one per user) -------------------------
-- Written by the stripe-webhook function (service role). The app reads this to
-- decide whether a signed-in user may access the dashboard. `status` mirrors
-- Stripe: trialing / active / past_due / canceled / unpaid / incomplete.
create table public.subscriptions (
  user_id            uuid primary key references auth.users (id) on delete cascade,
  status             text not null default 'incomplete',
  plan               text,
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  -- Hard access cutoff for time-boxed accounts (e.g. a 4-day tester login).
  -- When set and in the past, entitlement is denied regardless of status.
  access_expires_at  timestamptz,
  -- When set, this is a tester account: its countdown is this many days and
  -- starts (stamps access_expires_at) on first sign-in via tester-clock.
  tester_days        integer,
  updated_at         timestamptz not null default now()
);

-- Migration for databases created before the tester columns existed. Safe to
-- re-run. See supabase/migrations/2026-07-14-tester-account.sql.
alter table public.subscriptions add column if not exists access_expires_at timestamptz;
alter table public.subscriptions add column if not exists tester_days integer;

-- Leads (marketing "book a demo" form submissions) --------------------------
-- Written by the submit-lead function (service role). Not readable by the anon
-- role; view them in the Supabase table editor.
create table public.leads (
  id         uuid primary key default gen_random_uuid(),
  name       text,
  email      text,
  practice   text,
  phone      text,
  message    text,
  vertical   text,
  created_at timestamptz not null default now()
);

-- Row-level security --------------------------------------------------------
-- `force row level security` filters even privileged connections. Policies are
-- scoped `to authenticated` so the anon role is never evaluated against them.
-- (The service role key used by the server functions has BYPASSRLS, so it is
-- intentionally not constrained by these policies.)
alter table public.clinics enable row level security;
alter table public.calls enable row level security;
alter table public.appointments enable row level security;
alter table public.subscriptions enable row level security;
alter table public.leads enable row level security;

alter table public.clinics force row level security;
alter table public.calls force row level security;
alter table public.appointments force row level security;
alter table public.subscriptions force row level security;
alter table public.leads force row level security;

create policy "Owners manage their clinics"
  on public.clinics for all
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Owners access their clinic calls"
  on public.calls for all
  to authenticated
  using (clinic_id in (select id from public.clinics where owner_id = auth.uid()))
  with check (clinic_id in (select id from public.clinics where owner_id = auth.uid()));

create policy "Owners access their clinic appointments"
  on public.appointments for all
  to authenticated
  using (clinic_id in (select id from public.clinics where owner_id = auth.uid()))
  with check (clinic_id in (select id from public.clinics where owner_id = auth.uid()));

-- Users may READ their own subscription (to unlock the dashboard); only the
-- server (service role, which bypasses RLS) ever writes it.
create policy "Users read their own subscription"
  on public.subscriptions for select
  to authenticated
  using (user_id = auth.uid());
