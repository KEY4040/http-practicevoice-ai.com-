-- VIP Passthrough
-- ---------------------------------------------------------------------------
-- Lets an owner list "VIP" phone numbers (their regulars, big clients, family)
-- that should ring STRAIGHT THROUGH to their cell instead of being answered by
-- the AI. Everyone else still gets the AI receptionist.
--
--   vip_enabled     master on/off switch for this account
--   vip_transfer_to the cell number VIP calls are transferred to (E.164)
--   vip_numbers     the allow-list of caller numbers that ring straight through
--
-- Stored on the clinics row (already RLS-scoped to the owner), so only the
-- account owner can read/change their own list. The server-side vip-check
-- function reads it with the service role to decide, at call time, whether to
-- transfer. Idempotent — safe to run more than once.

alter table public.clinics
  add column if not exists vip_enabled boolean not null default false,
  add column if not exists vip_transfer_to text,
  add column if not exists vip_numbers text[] not null default '{}';
