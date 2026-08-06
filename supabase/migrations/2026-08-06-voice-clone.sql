-- Optional one-time voice cloning ($59).
--
-- Two SERVER-managed columns on clinics:
--   voice_clone_paid  set true by the Stripe webhook after the one-time purchase
--   cloned_voice_id   the Retell voice_id produced by /clone-voice; when set, the
--                     owner's provisioned agent speaks in their cloned voice.
--
-- Both are written ONLY by server functions (service role): the webhook flips
-- voice_clone_paid on payment, and clone-voice sets cloned_voice_id after a
-- successful clone. They are deliberately NOT added to the `authenticated`
-- column-UPDATE grant (see the clinics column-lockdown migration) — otherwise an
-- owner could flip voice_clone_paid from the browser and clone for free, or point
-- their agent at any voice_id. The browser only READS them (to show paid/cloned
-- state), which RLS already allows on their own row.

alter table public.clinics
  add column if not exists voice_clone_paid boolean not null default false;

alter table public.clinics
  add column if not exists cloned_voice_id text;
