# Launch Checklist — From Code to Live Business

> A step-by-step, do-this-in-order checklist. You do NOT need to do all of it to
> start. Each stage stands on its own. Do them as you need them.

Legend: 🟢 = do this now (free/easy) · 🟡 = when you have interest · 🔴 = when you have a paying customer

---

## STAGE 0 — See it running on your own computer 🟢
*(Optional, but helpful for learning. Skip to Stage 1 if you just want it online.)*

You need [Node.js](https://nodejs.org) installed (the "LTS" version).

```bash
npm install      # downloads the building blocks (one time)
npm run dev      # starts it locally
```

Open the link it prints (usually http://localhost:8080). Click around. Log in
with any email/password (demo mode). Break nothing — it's just on your machine.

---

## STAGE 1 — Get the website live on the internet 🟢
*(This is the big one. After this, practicevoice-ai.com shows your product.)*

You already registered the domain and started with Netlify — good. Two options:

### Option A — Deploy THIS code to Netlify (recommended)
1. Push this project to GitHub (it already lives in your repo).
2. In Netlify → **Add new site → Import from Git** → pick this repo.
3. Netlify auto-detects the settings from `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Click **Deploy**. In ~2 minutes you have a live URL.
5. Netlify → **Domain settings** → point `practicevoice-ai.com` at this site.
   (Your DNS is already in Netlify, so this is a couple of clicks.)

### Option B — Keep using Lovable
If you'd rather keep editing in Lovable, import this repo there instead. Note:
Lovable and this repo are separate copies — pick ONE as your source of truth so
you don't get confused. **Recommendation: use Option A** and treat this GitHub
repo as the real product.

✅ **Done when:** visiting your domain shows the PracticeVoice AI homepage.

At this point you can already **demo and pre-sell.** Everything below is only
needed to serve a real paying customer.

---

## STAGE 2 — Turn on real accounts (Supabase) 🟡
*(Needed so customers can create real logins instead of the demo.)*

1. Go to [supabase.com](https://supabase.com) → create a free account → **New
   project**. Pick a name and a strong database password (save it).
2. When it's ready: **Project Settings → API.** Copy two values:
   - `Project URL`
   - `anon` / `public` key  ← (the public one — never the `service_role` key)
3. In Netlify → **Site settings → Environment variables**, add:
   - `VITE_SUPABASE_URL` = your Project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon key
4. Set up the database tables: Supabase → **SQL Editor** → paste the contents of
   `supabase/schema.sql` from this project → **Run**.
5. Redeploy the Netlify site (Deploys → Trigger deploy).

✅ **Done when:** signing up on your live site creates a real account (you'll see
the user under Supabase → Authentication).

> The app automatically switches out of demo mode the moment those two variables
> are set. No code change needed.

---

## STAGE 3 — Connect the voice AI (Vapi or Retell) 🔴
*(This is what makes the AI actually answer phones. Do it for your first real
customer.)*

This is the most involved step and where a bit of developer help pays off.

1. Create an account at [Vapi.ai](https://vapi.ai) or [Retell AI](https://retellai.com).
   Both are built exactly for this. Vapi is a common 2026 choice.
2. In their dashboard, create an **assistant/agent**:
   - Give it the receptionist personality ("warm, professional, calm").
   - Give it the practice's services, hours, and booking rules.
   - Choose a voice (matches the "Ava / Grace / Noah" idea in Settings).
3. Get a **phone number** from them (or connect the practice's number by call
   forwarding).
4. Wire their **webhooks** so that when a call ends, the transcript + outcome get
   saved into your Supabase `calls` table. (A developer can do this in a few
   hours; it's the one genuinely technical integration.)

✅ **Done when:** a test call to the number is answered by the AI and shows up in
the customer's Call History.

> **Shortcut for pre-launch:** You can run the customer's first weeks with the AI
> answering and *you* manually confirming bookings, before full automation. Many
> founders start semi-manual to land the first customers.

---

## STAGE 4 — Connect the calendar (Google Calendar) 🔴

1. In [Google Cloud Console](https://console.cloud.google.com), create a project
   and enable the **Google Calendar API**.
2. Set up OAuth so a practice can click **"Connect Google Calendar"** (the button
   already exists in Settings) and grant access.
3. The AI then reads open slots and writes the booking into their calendar.

✅ **Done when:** a booking made by the AI appears on the practice's Google
Calendar.

---

## STAGE 5 — Take payment (Stripe) 🔴
*(So customers actually pay you the monthly fee.)*

1. Create a [Stripe](https://stripe.com) account.
2. Create three **Products/Prices** matching your plans ($149 / $349 / $749 /mo).
3. Add **Stripe Checkout** to the pricing/sign-up flow, and the **Customer
   Portal** so customers can manage their own billing.
4. Turn on the 14-day trial in Stripe (matches the site's promise).

✅ **Done when:** a customer can subscribe and you get paid automatically each
month.

---

## STAGE 6 — SMS confirmations & reminders (Twilio) 🔴

1. Create a [Twilio](https://twilio.com) account and get a phone number.
2. Connect it so booked appointments trigger a confirmation text, plus reminders
   and 6-month recalls.

✅ **Done when:** booking a test appointment sends a real SMS.

---

## Pre-launch polish (quick wins) 🟡

- [ ] Replace `hello@practicevoice-ai.com` / `security@...` placeholder emails
      (in the footer, Settings, and legal pages) with real inboxes you monitor.
- [ ] Have an attorney review the **Privacy / Terms / HIPAA** pages (they're
      solid templates, but healthcare/legal wording should be lawyer-checked).
- [ ] Swap the social-share image: `public/og-image.svg` is a placeholder — a
      designer can make a PNG version for best results on Facebook/LinkedIn.
- [ ] Add website analytics (e.g. Plausible or Google Analytics) so you can see
      visitors. One script tag in `index.html`.
- [ ] Set a real support email and, optionally, a simple help/FAQ page.

---

## The honest "minimum to make your first dollar"

You do **not** need all six stages to start. The leanest real path:

1. **Stage 1** (site live) — so you look legit.
2. Book demos and get a practice to say "yes, I want this."
3. **Stage 2 + 3** (accounts + voice) — set up that one customer.
4. **Stage 5** (Stripe) — collect their money.

Calendar and SMS can follow. **Sell first, build the plumbing as customers pull
it out of you.** That's the whole game.

---

### Questions about the code itself? → `docs/04-AUDIT-REPORT.md`
