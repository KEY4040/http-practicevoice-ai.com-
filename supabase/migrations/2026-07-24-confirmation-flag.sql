-- Give the patient's confirmation SMS its own delivery flag, independent of the
-- owner-alert channel. Without it the patient text is gated on owner_notified, so
-- if the owner email isn't delivering yet, every webhook redelivery re-texts the
-- patient (and there's no durable retry once SMS is live). This flag makes the
-- two channels independent and each retriable-until-sent.
alter table public.appointments
  add column if not exists confirmation_sent boolean not null default false;
