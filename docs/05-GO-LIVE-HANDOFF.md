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
| Voice AI (Retell) | 🟢 Webhook built — verifies signature, saves the call + appointment to the dashboard, texts the confirmation | 🔑 Create agent, paste webhook URL, add 2 env vars |
| Calls → dashboard | 🟢 Real calls, metrics, revenue, and transcripts flow from the database automatically | 🔑 Nothing (comes with Supabase + Retell above) |
| SMS (Twilio) | 🟢 Send function + settings UI + templates built | 🔑 Twilio account + 3 keys |
| SMS reminders (24h) | 🟢 Scheduled function fully implemented (queries appointments, sends, marks sent) | 🔑 Needs Supabase + Twilio (above) |

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

**Code is complete:** the webhook verifies the request is really from Retell,
writes the call (caller, duration, transcript, outcome, revenue) and any booked
appointment into the database so it appears in your dashboard, and texts the
patient a confirmation. You just connect it.

1. Create your agent at [retellai.com](https://retellai.com) and attach a phone
   number to it (you've done this — `PracticeVoice Receptionist` on your number).
2. On the agent, check **"Add an inbound webhook"** and paste:
   ```
   https://practicevoice-ai.com/.netlify/functions/retell-webhook
   ```
3. In Netlify → **Environment variables**, add two:
   - `RETELL_API_KEY` = your Retell API key (Retell → Settings → API Keys). This
     lets the webhook verify each call is genuinely from Retell.
   - `DEFAULT_CLINIC_ID` = your clinic's id. Get it after logging into the
     dashboard once (that creates your clinic): Supabase → **Table editor →
     clinics** → copy the `id`. *(Alternative: set that row's `retell_number` to
     your Retell number instead, and skip this var.)*
   - *(optional)* `DEFAULT_BOOKING_VALUE` = e.g. `200` — the dollar value each
     booking adds to your revenue dashboard when the agent doesn't quote one.
4. **Sharper data (recommended):** in the Retell agent's **Post-Call Analysis**,
   add fields so the dashboard fills in exactly. The webhook reads these names:
   `appointment_booked` (yes/no), `appointment_type`, `provider`,
   `appointment_time` (text) or `appointment_datetime` (ISO), `patient_name`,
   `revenue`, `escalated`, `reason`. Without them it still logs every call using
   smart keyword detection — this just makes it precise.
5. Redeploy (Netlify → Deploys → **Trigger deploy**).

✅ Done when a test call is answered by the AI and, within a few seconds of
hanging up, the call appears in your dashboard (and, with Twilio on, the caller
gets a confirmation text). Signature verification is already built in.

---

## 4. 🔑 Google Calendar — real booking slots

The **"Connect Google Calendar"** button exists in Settings. Making it real:
1. In [Google Cloud Console](https://console.cloud.google.com), create a project
   and enable the **Google Calendar API**.
2. Set up OAuth credentials so a clinic can grant calendar access.
3. Wire the AI (via Retell + a small function) to read open slots and write
   bookings. *This is the most involved integration — a developer's help pays off.*

---

## 5. 🔑 Stripe — checkout + subscription gating

Payment Links are wired to every plan button. Two modes:

**Open beta (default, no setup):** anyone can sign up and use the dashboard;
plan buttons open Stripe checkout. Good for early users/feedback.

**Reverse trial (recommended once you're ready to charge):** sign-up stays free
with no card, but a silent **14-day clock** starts at sign-up. During the 14
days users have full access (a "days left" banner shows); when it ends with no
plan, they hit a soft paywall at `/billing` ("your trial ended — pick a plan").
Paying (Stripe) lifts the paywall automatically via the webhook. This is all
built and controlled by the same switch below — turn it on to activate it. To
turn it on:
1. Re-run `supabase/schema.sql` (adds the `subscriptions` table — it's idempotent).
2. Stripe → **Developers → Webhooks** → add endpoint
   `https://practicevoice-ai.com/.netlify/functions/stripe-webhook`, subscribe to
   `checkout.session.completed` and `customer.subscription.*`.
3. Copy the webhook **Signing secret** into Netlify env `STRIPE_WEBHOOK_SECRET`.
4. On each Payment Link, add a **14-day free trial** (Stripe → Payment Links).
5. Set Netlify env `VITE_BILLING_ENABLED=true` and **Clear cache and deploy**.

- **Test vs live:** confirm each link's mode and that Basic=$99 / Professional=$199
  / Premium=$399 in the Stripe dashboard before taking real cards.

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
