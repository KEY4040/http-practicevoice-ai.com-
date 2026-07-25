-- Per-clinic booking-alert email override.
--
-- By default every customer's booking alerts go to the email they signed up with
-- (clinics.owner_id -> their Auth account email). That's great for zero-setup
-- onboarding, but a customer whose signup email is a personal address
-- (name@yahoo.com) may want alerts to land at a professional inbox instead
-- (front-desk@theirpractice.com). This adds an optional override they can set in
-- Settings; when present, the webhook + reminder sweep send there instead.
--
-- Null/empty = fall back to the account email (unchanged behavior). It only
-- affects where the OWNER's own booking alerts go — never patient messaging.
-- NOTE: an owner CAN point this at an arbitrary address, and the fixed benign
-- "new appointment" template would then be sent there from our verified domain.
-- It's entitlement-gated and low-volume (one alert per booking / per manual
-- test), but it is NOT verified to belong to the owner — a future hardening step
-- is a double-opt-in confirmation before alerts deliver to a changed address.
alter table public.clinics add column if not exists alert_email text;

-- Owner-editable settings column: grant column-level UPDATE to the authenticated
-- role (the blanket UPDATE was revoked by the column-lockdown migration, so the
-- app can't write this without an explicit grant). service_role is unaffected.
grant update (alert_email) on public.clinics to authenticated;
