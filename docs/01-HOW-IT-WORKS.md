# How PracticeVoice AI Works (Plain English)

> Read this first. No jargon. By the end you'll understand exactly what you
> own and how the pieces fit together.

---

## 1. What is this product, really?

PracticeVoice AI is a **software service that answers the phone for a doctor's,
dentist's, or lawyer's office** — using a natural-sounding AI voice instead of a
human receptionist.

When a patient calls the practice, the AI:

1. **Picks up instantly** — day, night, weekends, holidays.
2. **Talks like a friendly receptionist** — understands what the caller wants.
3. **Books the appointment** into the practice's calendar.
4. **Texts a confirmation** to the caller.
5. **Logs everything** — a recording, a written transcript, and a summary.

Then the practice owner opens a **dashboard** (a private web page) and sees:

- How many calls were answered
- How many appointments were booked
- **How much money those bookings are worth** ← this is the killer feature

That last point is the whole pitch: most answering services cost money. This one
**shows the owner the money it makes them.**

---

## 2. Who pays for it, and why

Your customer is the **practice owner** (a dentist, doctor, or small-firm
lawyer). They pay you a **monthly subscription** ($149–$749/mo in the current
pricing).

Why they'd happily pay:

- A single missed call can be a **$300+ lost patient**. Practices miss 20–30% of
  calls (busy front desk, lunch, after hours).
- Hiring a human receptionist costs **$3,000–$4,000/month**. This is a fraction
  of that and never sleeps.
- One booked appointment usually **pays for the whole month.**

You are selling *found money*, not software.

---

## 3. The two halves of the product

Think of it as two connected things:

### Half A — The "marketing site" (public)
The pages anyone can see on the internet. Their only job is to convince a
practice owner to sign up.
- **Homepage** — the pitch + a live demo of the AI booking a call
- **Pricing page** — the three plans
- **Sign up / Log in** — create an account

### Half B — The "app" / dashboard (private, login required)
What a customer sees *after* they log in. This is the product they pay for.
- **Dashboard** — the numbers (calls, bookings, revenue)
- **Call History** — every call, searchable
- **Call Detail** — the transcript + summary of one call
- **Settings** — where they set up their clinic in ~5 minutes

Both halves are in the code you now own.

---

## 4. What's REAL right now vs. what's a realistic mock-up

This is the most important section — read it carefully.

Building the full thing requires connecting several outside services (see §5).
That takes accounts, API keys, and money. So the project was built the smart
way: **the entire product looks and works end-to-end, using realistic sample
data**, so you can show it, learn it, and sell it *before* paying for the
plumbing.

| Piece | Status today | What "finishing" it means |
| --- | --- | --- |
| The whole website & app UI | ✅ **Real & working** | Nothing — it's done |
| Sign up / log in | ✅ **Real** (works with a free Supabase account) — falls back to a demo login until you connect it | Create a Supabase project, paste 2 keys |
| Dashboard numbers & calls | 🟡 **Realistic sample data** | Flows in automatically once voice is connected |
| The AI actually answering a phone | 🔌 **Not connected yet** | Connect Vapi or Retell (a voice-AI service) |
| Booking into a real calendar | 🔌 **Not connected yet** | Connect Google Calendar |
| Taking payment | 🔌 **Not connected yet** | Connect Stripe |
| Sending the SMS text | 🔌 **Not connected yet** | Connect Twilio |

> **"Demo mode":** With no setup at all, the app runs in demo mode — any
> email/password logs you in and you see sample data. This is intentional, so
> you can explore everything. See `docs/03-LAUNCH-CHECKLIST.md` to go live.

**Why this is good news:** You can start marketing and pre-selling *this week*
with the demo. You only connect (and pay for) the paid plumbing once you have a
customer who wants it. That's how lean software businesses launch.

---

## 5. The outside services (what each one does)

You don't need to understand the code — just what each service is *for*:

- **Supabase** — the "filing cabinet + bouncer." Stores accounts, calls, and
  appointments, and handles secure login. *Has a free tier.*
- **Vapi.ai** or **Retell AI** — the "voice." This is what actually answers the
  phone and talks. You give it a script and your services; it does the
  conversation. *Pay per minute of calls.*
- **Google Calendar** — the "appointment book." The AI checks open slots and
  writes the booking here.
- **Stripe** — the "cash register." Collects the monthly subscription from your
  customers.
- **Twilio** — the "texter." Sends the SMS confirmations and reminders.
- **Netlify** — the "web host." Puts your site on the internet at
  practicevoice-ai.com (you already set this up).

You connect these **one at a time, only when you need them.** The launch
checklist walks through the order.

---

## 6. The technology (30-second version)

You don't need this to sell it, but if someone asks "what's it built with":

- **Vite + React + TypeScript** — the framework the website/app is written in.
  (This is the same kind of setup Lovable generates, so it fits what you started.)
- **Tailwind CSS** — how it's styled (the clean blue-and-green look).
- **Supabase** — accounts + database.
- **Netlify** — hosting.

It's a modern, standard, professional stack. Any web developer can pick it up.

---

## 7. How a real customer would use it (the dream flow)

1. Dr. Smith signs up, does the 5-minute **Settings** setup (clinic name, phone,
   services, hours), clicks **Connect Google Calendar**.
2. She forwards her office phone number to the AI.
3. A patient calls at 9 PM to book a cleaning. The AI answers, books Tuesday
   10 AM, texts a confirmation.
4. Next morning Dr. Smith opens her **Dashboard**: "1 call answered, 1 booked,
   $180 in booked revenue." She sees the full transcript under **Call History**.
5. She's hooked, because she can *see the money.*

That's the entire business in five steps.

---

## 8. Where to go next

- **To understand selling it →** `docs/02-MARKETING-GUIDE.md`
- **To actually put it live →** `docs/03-LAUNCH-CHECKLIST.md`
- **To see the audit of the code →** `docs/04-AUDIT-REPORT.md`
