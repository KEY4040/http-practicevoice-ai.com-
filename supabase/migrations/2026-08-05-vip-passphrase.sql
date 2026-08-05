-- VIP code word (passphrase) for mid-call transfer.
--
-- VIP Passthrough (2026-07-16) routes callers to the owner's cell by CALLER ID
-- at call start. But a rare few carriers hide the caller's number on forwarded
-- calls, and a hidden number can't be matched — so a VIP could slip through to
-- the AI. This adds a caller-ID-INDEPENDENT backup: the owner sets a private
-- code word, and any caller who says it is transferred to the owner's cell
-- immediately, no matter what number they're calling from.
--
-- The transfer destination reuses vip_transfer_to (the owner's cell). Only the
-- passphrase is new. Provisioning attaches a Retell transfer_call tool + a prompt
-- directive whenever vip_enabled, vip_transfer_to, and vip_passphrase are all set.

alter table public.clinics
  add column if not exists vip_passphrase text;

-- The column-lockdown (2026-07-24) revoked blanket UPDATE and re-granted only the
-- owner-editable columns, so the new column needs its own grant or the owner
-- couldn't save it from the dashboard. service_role (server) is unaffected.
grant update (vip_passphrase) on public.clinics to authenticated;
