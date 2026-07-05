-- PracticeVoice AI — starter Supabase schema
-- Run in the Supabase SQL editor. Sets up clinics, calls, and appointments
-- with row-level security so each authenticated owner sees only their data.

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Clinics (one per practice owner)
-- ---------------------------------------------------------------------------
create table if not exists public.clinics (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users (id) on delete cascade,
  name          text not null,
  phone         text,
  services      text[] default '{}',
  open_days     text[] default '{Mon,Tue,Wed,Thu,Fri}',
  open_time     time default '08:00',
  close_time    time default '17:00',
  voice         text default 'Ava',
  calendar_connected boolean default false,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Calls
-- ---------------------------------------------------------------------------
create type call_outcome as enum ('booked', 'escalated', 'missed', 'info');

create table if not exists public.calls (
  id            uuid primary key default gen_random_uuid(),
  clinic_id     uuid not null references public.clinics (id) on delete cascade,
  caller_name   text,
  caller_phone  text,
  started_at    timestamptz not null default now(),
  duration_sec  integer default 0,
  outcome       call_outcome not null default 'info',
  reason        text,
  summary       text,
  transcript    jsonb default '[]',
  revenue       numeric(10, 2) default 0,
  notes         text
);

create index if not exists calls_clinic_started_idx
  on public.calls (clinic_id, started_at desc);

-- ---------------------------------------------------------------------------
-- Appointments (created when a call books)
-- ---------------------------------------------------------------------------
create table if not exists public.appointments (
  id            uuid primary key default gen_random_uuid(),
  clinic_id     uuid not null references public.clinics (id) on delete cascade,
  call_id       uuid references public.calls (id) on delete set null,
  patient_name  text,
  type          text,
  provider      text,
  scheduled_for timestamptz,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row-level security
--
-- `force row level security` ensures even a table owner / privileged connection
-- is still filtered. Policies are scoped `to authenticated` so the anon role is
-- never evaluated against them at all (defense-in-depth; auth.uid() is null for
-- anon anyway, so no row would match).
-- ---------------------------------------------------------------------------
alter table public.clinics enable row level security;
alter table public.calls enable row level security;
alter table public.appointments enable row level security;

alter table public.clinics force row level security;
alter table public.calls force row level security;
alter table public.appointments force row level security;

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
