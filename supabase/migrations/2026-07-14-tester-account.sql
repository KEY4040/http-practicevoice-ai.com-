-- ---------------------------------------------------------------------------
-- Time-boxed TESTER account (e.g. a 4-day Premium login for a trial user).
--
-- How it works: the account gets a subscription row with tester_days set and
-- access_expires_at NULL. On the tester's FIRST sign-in, the tester-clock
-- function stamps access_expires_at = now() + tester_days. After that window,
-- entitlement (isEntitled / hasActiveAccess) locks the account out
-- automatically — no manual deletion needed.
--
-- SETUP (two steps, both in the Supabase dashboard):
--
--   1. Authentication -> Users -> "Add user":
--        Email:    rubberfeetwarehousetestingpremium@gmail.com
--        Password: 0000555554329217
--        ✅ Auto Confirm User  (so they can sign in immediately)
--
--   2. SQL Editor -> run the block below (it looks the user up by email, so you
--      don't need to copy any id). Re-running is safe (upsert).
-- ---------------------------------------------------------------------------

-- Make sure the columns exist (no-op if they already do).
alter table public.subscriptions add column if not exists access_expires_at timestamptz;
alter table public.subscriptions add column if not exists tester_days integer;

-- Grant the tester a 4-day Premium window that starts on first sign-in.
insert into public.subscriptions (user_id, status, plan, tester_days, access_expires_at)
select id, 'trialing', 'Premium (4-day tester)', 4, null
from auth.users
where lower(email) = lower('rubberfeetwarehousetestingpremium@gmail.com')
on conflict (user_id) do update
  set status = 'trialing',
      plan = 'Premium (4-day tester)',
      tester_days = 4,
      access_expires_at = null,   -- reset the clock so a fresh handoff restarts it
      updated_at = now();

-- Verify (optional): should show the tester with tester_days = 4.
-- select u.email, s.status, s.plan, s.tester_days, s.access_expires_at
-- from public.subscriptions s join auth.users u on u.id = s.user_id
-- where lower(u.email) = lower('rubberfeetwarehousetestingpremium@gmail.com');
