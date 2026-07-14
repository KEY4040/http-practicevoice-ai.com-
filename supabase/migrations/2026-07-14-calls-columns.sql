-- ---------------------------------------------------------------------------
-- FIX: production `calls` table is missing the columns the retell-webhook
-- writes, so every inbound call failed to save (Postgres 42703:
-- "column calls.retell_call_id does not exist"). Retell was delivering all
-- along; the insert was rejected and the function 500'd on every call.
--
-- This migration is IDEMPOTENT and SAFE to run on a live database: it only
-- ADDs columns that are missing and never drops or rewrites existing data.
-- Run it once in the Supabase SQL editor (Dashboard -> SQL Editor -> New query).
-- ---------------------------------------------------------------------------

-- The outcome enum (no-op if it already exists).
do $$
begin
  create type public.call_outcome as enum ('booked', 'escalated', 'missed', 'info');
exception
  when duplicate_object then null;
end
$$;

-- Every column the webhook writes. `if not exists` makes each line a no-op when
-- the column is already there.
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

-- Unique index on retell_call_id so a redelivered webhook upserts in place
-- instead of creating a duplicate row (matches the webhook's on_conflict).
create unique index if not exists calls_retell_call_id_key
  on public.calls (retell_call_id);

-- Appointments table columns the webhook writes on a booking (same safety).
alter table public.appointments add column if not exists call_id       uuid references public.calls (id) on delete set null;
alter table public.appointments add column if not exists patient_name  text;
alter table public.appointments add column if not exists patient_phone text;
alter table public.appointments add column if not exists type          text;
alter table public.appointments add column if not exists provider      text;
alter table public.appointments add column if not exists scheduled_for timestamptz;
alter table public.appointments add column if not exists reminder_sent boolean not null default false;
