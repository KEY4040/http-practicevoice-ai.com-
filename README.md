# PracticeVoice AI

The AI voice receptionist built for medical, dental, and legal practices.
Never miss a call, book appointments 24/7, send smart SMS reminders — and see
exactly how much revenue the AI generates.

> Built with Vite + React + TypeScript + Tailwind CSS. Backend-ready for
> Supabase, and structured to plug in Vapi/Retell (voice), Google Calendar,
> Stripe, and Twilio when you're ready.

## Tech stack

| Layer        | Choice                                            |
| ------------ | ------------------------------------------------- |
| Framework    | Vite + React 18 + TypeScript                      |
| Styling      | Tailwind CSS (design tokens in `src/index.css`)   |
| Routing      | React Router v6                                    |
| Charts       | Recharts                                           |
| Icons        | lucide-react                                       |
| Auth/Backend | Supabase (optional — runs in demo mode without it)|
| Hosting      | Netlify (`netlify.toml` + SPA redirects included) |

## Getting started

```bash
npm install
cp .env.example .env   # optional — add Supabase creds to leave demo mode
npm run dev            # http://localhost:8080
```

The app runs fully in **demo mode** with no environment variables: mock auth
plus realistic mock call data so you can explore every screen. Add Supabase
credentials to `.env` to switch on real authentication.

```bash
npm run build          # production build → dist/
npm run preview        # preview the production build
```

## Project structure

```
src/
├── components/
│   ├── ui/              # Design-system primitives (Button, Card, Input, Badge…)
│   ├── marketing/       # Navbar, Footer, Hero phone demo, Logo
│   ├── dashboard/       # Sidebar layout, MetricCard, CallsChart
│   ├── OutcomeBadge.tsx
│   ├── ProtectedRoute.tsx
│   └── ScrollToTop.tsx
├── context/
│   └── AuthContext.tsx  # Supabase auth with demo fallback
├── data/
│   └── mockData.ts      # Realistic calls, metrics, revenue attribution
├── lib/
│   ├── supabase.ts      # Client (null in demo mode)
│   └── utils.ts         # cn(), currency/date formatters
├── pages/
│   ├── Home.tsx         # Marketing site
│   ├── Pricing.tsx      # 3 tiers, Professional highlighted
│   ├── auth/            # Login, Signup, shared AuthLayout
│   └── dashboard/       # Dashboard, CallHistory, CallDetail, Settings
├── App.tsx              # Routes
└── main.tsx
```

## Pages

- `/` — Marketing homepage (hero + live call demo, benefits, ROI highlight, how-it-works)
- `/pricing` — Basic / Professional / Premium tiers
- `/login`, `/signup` — Supabase auth (demo fallback)
- `/dashboard` — Metrics (calls, bookings, **revenue generated**), calls chart, recent activity
- `/dashboard/calls` — Searchable/filterable call history
- `/dashboard/calls/:id` — Call detail: transcript, AI summary, appointment, notes
- `/dashboard/settings` — Clinic setup: details, services, hours, voice, one-click Google Calendar

## Connecting Supabase (optional)

1. Create a project at [supabase.com](https://supabase.com).
2. Copy the Project URL and anon key into `.env`
   (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
3. Run the schema in [`supabase/schema.sql`](./supabase/schema.sql) to create
   the `clinics`, `calls`, and `appointments` tables with row-level security.

## Deploying to Netlify

The included `netlify.toml` sets the build command (`npm run build`), publish
directory (`dist`), and SPA redirects. Connect the repo in Netlify (or use the
domain you already registered), add the `VITE_SUPABASE_*` env vars, and deploy.

## Roadmap (integration points)

- **Voice** — wire Vapi.ai / Retell AI to originate/answer calls and stream transcripts into `calls`.
- **Calendar** — replace the mock Google Calendar toggle in Settings with OAuth + availability lookups.
- **Payments** — Stripe Checkout for the pricing tiers + a customer billing portal.
- **SMS** — Twilio (or a Supabase Edge Function) for confirmations, reminders, and recalls.
