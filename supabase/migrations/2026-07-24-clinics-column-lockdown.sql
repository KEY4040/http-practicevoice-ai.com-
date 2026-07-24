-- Lock down server-managed columns on public.clinics.
--
-- The "Owners manage their clinics" policy is ROW-scoped (owner_id = auth.uid())
-- but not COLUMN-scoped, so an authenticated owner could PATCH billing/usage and
-- Retell-binding columns straight from the browser with the anon key + their JWT:
--   * zero usage_minutes / clear usage_suspended to bypass the plan minute cap
--     (uncapped Retell voice spend), or
--   * collide retell_agent_id / retell_number with another tenant so that tenant's
--     inbound call resolves to the attacker's clinic, diverting caller PHI.
--
-- Fix: revoke blanket UPDATE from the `authenticated` role, then grant UPDATE only
-- on the owner-editable settings columns. The `service_role` used by the server
-- functions has BYPASSRLS + full privileges and is unaffected, so provisioning,
-- the usage meter, and number binding keep working.

revoke update on public.clinics from authenticated;

grant update (
  name,
  phone,
  about,
  services,
  open_days,
  open_time,
  close_time,
  voice,
  vip_enabled,
  vip_transfer_to,
  vip_numbers,
  cal_api_key,
  cal_event_type_id,
  cal_timezone,
  calendar_provider
) on public.clinics to authenticated;
