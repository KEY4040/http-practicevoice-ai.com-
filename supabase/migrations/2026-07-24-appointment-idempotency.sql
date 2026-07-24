-- Make appointment writes idempotent per call.
--
-- Retell delivers a call as two events (call_ended, then call_analyzed) and may
-- redeliver either. The webhook records the appointment the first time booking
-- data appears; this unique constraint guarantees exactly one appointment row
-- per call even under a race between the two events, and lets a retry no-op
-- instead of creating duplicate appointments / reminders / owner alerts.
--
-- Dedupe any pre-existing duplicates first (keep the earliest row per call), so
-- the constraint can be added cleanly. NULL call_id rows are unaffected (Postgres
-- allows multiple NULLs under a UNIQUE constraint).

delete from public.appointments a
using public.appointments b
where a.call_id = b.call_id
  and a.call_id is not null
  and a.id > b.id;

alter table public.appointments
  add constraint appointments_call_id_key unique (call_id);
