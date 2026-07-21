-- Calendar booking (Cal.com) per clinic.
-- Each customer connects their OWN Cal.com so their AI books into THEIR calendar.
-- The provisioning engine reads these to attach Retell's check_availability /
-- book_appointment tools to that customer's agent. cal_api_key is a secret and
-- is only ever read server-side (service_role); it is never exposed via RLS to
-- other users. Timezone defaults to the clinic's, matched to Cal.com to avoid
-- the off-by-hours bug.
alter table public.clinics
  add column if not exists cal_api_key text,
  add column if not exists cal_event_type_id bigint,
  add column if not exists cal_timezone text,
  add column if not exists calendar_provider text; -- e.g. 'cal.com' once connected
