# Go-Live Handoff — Only YOU Can Do These

Everything that can be built in code **is built.** What's left are the steps
that need *you* to go get an account, copy a key, or flip a switch — because
they involve your money, your credentials, or your accounts.

This is your master checklist. Each item says **exactly** what to do and where
the code is already waiting for it.

Legend: 🟢 done in code · 🔑 needs you

---

## Snapshot: what's done vs. what needs you

| Piece | In code | Needs you |
| ----- | ------- | --------- |
| Marketing site + app UI | 🟢 Complete & live | — |
| Netlify hosting + domain | 🟢 Deployed | 🔑 Domain finishing DNS/SSL (may be done by now) |
| Stripe checkout | 🟢 Payment Links wired to buttons | 🔑 Decide test vs live; (optional) subscription webhook |
| Demo login | 🟢 Works (`VITE_DEMO_MODE=true`) | 🔑 Real accounts = connect Supabase |
| Database | 🟢 Schema written (`supabase/schema.sql`) | 🔑 Create Supabase project + run schema |
| Voice AI (Retell) | 🟢 Webhook endpoint built | 🔑 Create Retell agent + paste webhook URL |
| SMS (Twilio) | 🟢 Send function + settings UI + templates built | 🔑 Twilio account + 3 keys |
| SMS reminders (24h) | 🟢 Scheduled function built | 🔑 Needs Supabase + Twilio (above) |

You do **not** have to do all of this to keep selling with the demo. Do each
piece when you're ready to serve a real paying customer.

---

## 1. 🔑 Supabase — real accounts + database (the foundation)

Everything "real" (real logins, saved settings, real call/appointment data,
reminders) sits on this. **Do this first** when you're ready to leave demo mode.

1. Create a project at [supabase.com](https://supabase.com).
2. **Project Settings → API** — copy the **Project URL** and the **anon** key.
3. In Netlify → **Environment variables**, add:
   - `VITE_SUPABASE_URL` = your Project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon key
   - `SUPABASE_URL` = same Project URL (for server functions)
   - `SUPABASE_SERVICE_ROLE_KEY` = the **service_role** key (⚠️ server-only, never share)
4. **Remove** `VITE_DEMO_MODE` (or set it to blank) so the app uses real auth.
5. Supabase → **SQL Editor** → paste all of `supabase/schema.sql` → **Run**.
6. Netlify → **Deploys → Trigger deploy**.

✅ Done when a new signup shows up under Supabase → Authentication.

---

## 2. 🔑 Twilio — text messages (SMS)

**Code is complete:** the send function, the dashboard Settings section (Twilio
number + editable templates with live preview), and the confirmation/reminder
sending. It just needs your keys.

1. Create an account at [twilio.com](https://twilio.com) and get a **phone number**.
2. From the Twilio Console copy your **Account SID** and **Auth Token**.
3. In Netlify → **Environment variables**, add:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER` (like `+14155550199`)
   - `ALLOWED_ORIGIN` = `https://practicevoice-ai.com` (blocks other sites from using your SMS)
4. Redeploy. In the dashboard → **Settings → Text messages**, enter your Twilio
   number and adjust the templates if you like, then **Save**.

✅ Done when the **Send reminder** button on a call says "Text sent ✓" instead of
"Demo — would send."

> ⚠️ **Before enabling Twilio, read this:** the send endpoint should also verify
> the signed-in user once Supabase auth is connected (see the SECURITY TODO in
> `netlify/functions/send-sms.mjs`). The `ALLOWED_ORIGIN` guard is a first layer,
> not the whole answer.

---

## 3. 🔑 Retell AI — the actual voice (answers calls, books appointments)

**Code is complete:** a webhook endpoint that, when a call books an appointment,
saves it (once Supabase is on) and texts the confirmation.

1. Create an agent at [retellai.com](https://retellai.com) — give it the
   receptionist persona, your services, and booking rules.
2. Get a phone number from Retell (or forward your practice line to it).
3. In Retell's dashboard, set the **webhook URL** to:
   ```
   https://practicevoice-ai.com/.netlify/functions/retell-webhook
   ```
4. Map Retell's booking output fields to what the webhook expects (patient name,
   phone, appointment type/time/provider) — see the field notes in
   `netlify/functions/retell-webhook.mjs`.

✅ Done when a test call is answered by the AI and (with Twilio on) the caller
gets a confirmation text.

> ⚠️ Add Retell **signature verification** to the webhook before going live (see
> the SECURITY TODO in that file) so fake events can't trigger texts.

---

## 4. 🔑 Google Calendar — real booking slots

The **"Connect Google Calendar"** button exists in Settings. Making it real:
1. In [Google Cloud Console](https://console.cloud.google.com), create a project
   and enable the **Google Calendar API**.
2. Set up OAuth credentials so a clinic can grant calendar access.
3. Wire the AI (via Retell + a small function) to read open slots and write
   bookings. *This is the most involved integration — a developer's help pays off.*

---

## 5. 🔑 Stripe — you've already connected checkout

Payment Links are live and wired to every plan button. Remaining decisions:
- **Test vs live:** if your links are in **live** mode, real cards are charged
  after the 14-day trial. Since the voice service isn't answering calls yet,
  consider **test mode** (or early-adopter pre-sales only) until it is.
- **Optional later:** a `stripe-webhook` function to tie subscriptions to
  accounts (upgrade/downgrade, cancellations). Not needed for basic checkout.

---

## 6. 🔑 Domain (probably already done)

You pointed `practicevoice-ai.com` at Netlify. If the SSL/"propagating" note has
cleared, you're done — share `https://practicevoice-ai.com`. If not, give it a
little longer (see `docs/03-LAUNCH-CHECKLIST.md`).

---

## The recommended order

1. **Supabase** (real accounts + data) — unlocks everything else.
2. **Twilio** (SMS) — paste 3 keys, you're sending texts.
3. **Retell** (voice) — the core service; wire its webhook.
4. **Stripe** — confirm test vs live.
5. **Google Calendar** — real availability.

Once #1–#3 are in, you have a genuinely working product: the AI answers, books,
saves the record, and texts the patient — all visible in the dashboard.

---

### Where the code lives (for you or a developer)
- SMS send: `netlify/functions/send-sms.mjs`
- Voice webhook: `netlify/functions/retell-webhook.mjs`
- 24h reminders: `netlify/functions/send-reminders.mjs`
- SMS templates + settings: `src/lib/smsTemplates.ts`, `src/lib/clinicSettings.ts`, dashboard **Settings**
- Pricing/Stripe: `src/data/plans.ts`, `src/lib/checkout.ts`
- All env vars documented in `.env.example`
