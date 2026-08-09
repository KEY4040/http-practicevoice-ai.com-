/**
 * Per-vertical landing-page content. Each becomes a dedicated, SEO-targeted page
 * at /:slug so we rank for "AI receptionist for <industry>" and speak to each
 * buyer's specific worries. Covers healthcare/legal plus home services,
 * contractors, auto, salons, real estate, restaurants, and assistance lines.
 */

export interface VerticalBenefit {
  title: string;
  body: string;
}

export interface VerticalFaq {
  q: string;
  a: string;
}

export type VerticalSlug =
  | "dental"
  | "medical"
  | "legal"
  | "veterinary"
  | "home-services"
  | "contractors"
  | "auto"
  | "salons"
  | "real-estate"
  | "restaurants"
  | "assistance-line";

export interface Vertical {
  slug: VerticalSlug;
  /** e.g. "dental practices" */
  audience: string;
  eyebrow: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  headline: string;
  sub: string;
  benefits: VerticalBenefit[];
  faqs: VerticalFaq[];
  /**
   * Small trust chips shown on the page. Healthcare/legal verticals surface
   * "HIPAA-ready"; broader businesses get generic trust signals instead.
   * Optional — falls back to a sensible default in the page.
   */
  trust?: string[];
  /**
   * Where the page's primary CTA points. Self-serve verticals use the trial
   * checkout (default); contract/RFP buyers (assistance lines) use /contact.
   */
  ctaHref?: string;
  /**
   * Optional live demo phone number for this vertical. When set, the page shows
   * a "call it now and hear it" CTA — a prospect dials it and experiences their
   * own AI receptionist. Display format, e.g. "(803) 770-5067".
   */
  demoNumber?: string;
}

export const VERTICALS: Record<Vertical["slug"], Vertical> = {
  dental: {
    slug: "dental",
    audience: "dental practices",
    eyebrow: "For dental practices",
    title: "AI receptionist for dental practices",
    metaTitle: "AI Receptionist for Dental Practices — PracticeVoice AI",
    metaDescription:
      "An AI receptionist for dental offices that answers every call 24/7, books cleanings and emergencies, sends text confirmations, and shows the revenue each call books.",
    headline: "The AI receptionist built for dental practices",
    sub: "Never send another new-patient call to voicemail. PracticeVoice answers every ring, books cleanings, exams, and emergencies, and texts the confirmation — day or night.",
    benefits: [
      {
        title: "Capture every new-patient call",
        body: "New patients call around — the first office to answer usually wins. PracticeVoice answers on the first ring, 24/7, so those high-value calls never go to a competitor.",
      },
      {
        title: "Triage emergencies the right way",
        body: "A cracked tooth at 9pm gets handled: the AI screens urgency, gives your after-hours guidance, and books or escalates — instead of a missed voicemail.",
      },
      {
        title: "See the revenue each chair-hour books",
        body: "Every booked call is tied to real dollars — cleanings, crowns, whitening — so you see exactly what your AI receptionist earns the practice each month.",
      },
    ],
    faqs: [
      {
        q: "Can it book different appointment types?",
        a: "Yes — cleanings, exams, new-patient visits, emergencies, and consults. You set your services, providers, and hours, and the AI books the right slot.",
      },
      {
        q: "Is it HIPAA-ready?",
        a: "PracticeVoice is built for HIPAA-ready workflows: encrypted in transit and at rest, access restricted to your team, and a BAA available on qualifying plans.",
      },
      {
        q: "Will it replace my front desk?",
        a: "No — it backs them up. It catches the calls your team can't get to (busy, lunch, after-hours) so no patient is lost, while your staff focuses on the chair.",
      },
    ],
  },
  medical: {
    slug: "medical",
    audience: "medical practices",
    eyebrow: "For medical practices",
    title: "AI receptionist for medical practices",
    metaTitle: "AI Receptionist for Medical Practices — PracticeVoice AI",
    metaDescription:
      "An AI receptionist for clinics and medical offices that answers every call 24/7, books and reschedules appointments, sends reminders, and reports the revenue it generates.",
    headline: "The AI receptionist built for medical practices",
    sub: "Answer every patient call, book and reschedule appointments, and cut no-shows with automatic reminders — without adding front-desk headcount.",
    benefits: [
      {
        title: "Answer every call, even at peak",
        body: "When two lines ring at once or the desk is slammed, PracticeVoice picks up — so patients aren't stuck on hold or sent to voicemail.",
      },
      {
        title: "Cut no-shows with reminders",
        body: "Automatic text confirmations and 24-hour reminders keep your schedule full and reduce the gaps that cost you revenue.",
      },
      {
        title: "After-hours coverage that books",
        body: "Nights, weekends, and holidays are covered. Routine calls get booked; urgent ones get your configured guidance or an escalation.",
      },
    ],
    faqs: [
      {
        q: "Can it handle scheduling and rescheduling?",
        a: "Yes. It books new appointments and can collect the details to reschedule, following the hours, providers, and rules you configure.",
      },
      {
        q: "How does it handle sensitive information?",
        a: "It's built for HIPAA-ready workflows — encrypted in transit and at rest, access restricted to your authorized team, with a BAA available on qualifying plans.",
      },
      {
        q: "What about urgent or emergency calls?",
        a: "You set the rules. The AI recognizes urgency, delivers your after-hours instructions, and can escalate to your on-call line.",
      },
    ],
  },
  veterinary: {
    slug: "veterinary",
    audience: "veterinary clinics",
    eyebrow: "For veterinary clinics",
    title: "AI receptionist for veterinary clinics",
    metaTitle: "AI Receptionist for Veterinary Clinics — PracticeVoice AI",
    metaDescription:
      "An AI receptionist for vet clinics that answers every call 24/7, books and triages appointments, handles after-hours pet emergencies, and shows the revenue each call books.",
    headline: "The AI receptionist built for veterinary clinics",
    sub: "Your team can't love the animals and answer every ring at once. PracticeVoice answers every call, books and triages, and flags urgent cases — so no worried pet owner dials the next clinic.",
    benefits: [
      {
        title: "Never lose a worried pet owner",
        body: "When the front desk is slammed or closed, PracticeVoice answers on the first ring, 24/7 — so panicked after-hours callers reach you instead of the clinic down the street.",
      },
      {
        title: "Triage urgent cases the right way",
        body: "The AI screens urgency, delivers your after-hours guidance, and books routine visits or escalates emergencies — instead of leaving it all to voicemail.",
      },
      {
        title: "See the revenue each call books",
        body: "Every booked appointment is tied to real dollars, so you can see exactly what your AI receptionist earns the clinic each month.",
      },
    ],
    faqs: [
      {
        q: "Can it book different appointment types?",
        a: "Yes — wellness exams, vaccinations, sick visits, and consults. You set your services, doctors, and hours, and the AI books the right slot.",
      },
      {
        q: "How does it handle after-hours emergencies?",
        a: "You set the rules. The AI recognizes urgency, gives your after-hours instructions, and can escalate to your on-call or nearest emergency line.",
      },
      {
        q: "Will it replace my front desk?",
        a: "No — it backs them up. It catches the calls your team can't get to (busy, lunch, after-hours) so no client is lost, while your staff focuses on the patients in front of them.",
      },
    ],
  },
  legal: {
    slug: "legal",
    audience: "law firms",
    eyebrow: "For law firms",
    title: "AI receptionist for law firms",
    metaTitle: "AI Receptionist for Law Firms — PracticeVoice AI",
    metaDescription:
      "An AI receptionist for law firms that answers every call 24/7, captures new-client intake, books consultations, and shows the revenue each intake call is worth.",
    headline: "The AI receptionist built for law firms",
    sub: "The first firm to answer usually signs the client. PracticeVoice answers every call, captures intake, and books the consultation — so no case walks to the firm down the street.",
    benefits: [
      {
        title: "Win the new-client race",
        body: "Prospective clients call several firms. PracticeVoice answers instantly, 24/7, and books the consult before they hang up and dial the next number.",
      },
      {
        title: "Capture clean intake",
        body: "Collect the caller's name, matter type, and details up front, so your attorneys walk into every consult already informed.",
      },
      {
        title: "Know what each intake call is worth",
        body: "Every booked consultation is tied to its value, so you can see the pipeline your AI receptionist is filling each month.",
      },
    ],
    faqs: [
      {
        q: "Can it screen by practice area?",
        a: "Yes — you configure the matter types you take and the questions to ask, and the AI books qualified consults accordingly.",
      },
      {
        q: "Does it work after hours?",
        a: "Around the clock. Many high-intent client calls come evenings and weekends — exactly when a voicemail loses them.",
      },
      {
        q: "Is client information kept secure?",
        a: "Data is encrypted in transit and at rest, and access is restricted to your authorized team. Configure call-recording consent language appropriate to your state.",
      },
    ],
    trust: ["Encrypted in transit & at rest", "Confidential intake", "Answers 24/7"],
    demoNumber: "(803) 770-5067",
  },
  "home-services": {
    slug: "home-services",
    audience: "home service businesses",
    eyebrow: "For home services",
    title: "AI receptionist for home services",
    metaTitle: "AI Receptionist for Home Services — PracticeVoice AI",
    metaDescription:
      "An AI receptionist for HVAC, plumbing, electrical, and roofing businesses that answers every call 24/7, books service calls, and shows the revenue each job books.",
    headline: "The AI receptionist built for home service businesses",
    sub: "When a pipe bursts or the AC dies, the first company to answer wins the job. PracticeVoice answers every call, books the service visit, and texts the confirmation — even while your crews are on-site.",
    benefits: [
      {
        title: "Win the job while you're on a call-out",
        body: "Homeowners with an emergency call down the list until someone picks up. PracticeVoice answers on the first ring, 24/7, so you book the job instead of losing it to the next truck.",
      },
      {
        title: "Book service calls into your schedule",
        body: "The AI captures the address, the problem, and the urgency, then books the visit into your calendar and texts the customer a confirmation — no clipboard, no callback tag.",
      },
      {
        title: "See the revenue each call books",
        body: "Every booked service call is tied to real dollars — installs, repairs, maintenance plans — so you see exactly what your AI receptionist earns the business each month.",
      },
    ],
    faqs: [
      {
        q: "Can it handle emergency and after-hours calls?",
        a: "Yes. You set the rules — the AI recognizes urgency (no heat, flooding, no power), gives your after-hours guidance, books the visit, and can escalate a true emergency to your on-call tech.",
      },
      {
        q: "Can it book into my dispatch or scheduling software?",
        a: "Today it books into the hours, service areas, and job types you configure in PracticeVoice and texts the customer a confirmation. Direct sync with outside scheduling tools (starting with Google Calendar) is on the way.",
      },
      {
        q: "Will it replace my office staff?",
        a: "No — it backs them up. It catches the calls your team can't get to (on another line, in the field, after hours) so no job is lost, while your staff runs the day.",
      },
    ],
    trust: ["Answers 24/7", "Books & dispatches", "Flags emergencies"],
  },
  contractors: {
    slug: "contractors",
    audience: "contractors & trades",
    eyebrow: "For contractors & trades",
    title: "AI receptionist for contractors & trades",
    metaTitle: "AI Receptionist for Contractors & Trades — PracticeVoice",
    metaDescription:
      "An AI receptionist for contractors and trades that answers every call 24/7, captures estimate requests, books site visits, and shows the value of each lead.",
    headline: "The AI receptionist built for contractors & trades",
    sub: "You can't answer the phone from the top of a ladder — and the lead that hits voicemail hires someone else. PracticeVoice answers every call, captures the estimate request, and books the site visit.",
    benefits: [
      {
        title: "Never lose a lead to voicemail",
        body: "Prospects calling for a quote rarely leave a message — they dial the next number. PracticeVoice answers instantly, 24/7, and captures the lead before it walks.",
      },
      {
        title: "Capture clean estimate requests",
        body: "The AI collects the job scope, address, timeline, and budget signals up front, so you walk into every estimate already knowing what the job is.",
      },
      {
        title: "Know what each lead is worth",
        body: "Every booked estimate and site visit is tied to its value, so you can see the pipeline your AI receptionist is filling each month.",
      },
    ],
    faqs: [
      {
        q: "Can it screen the jobs I actually want?",
        a: "Yes — you configure the job types, service areas, and minimum-job questions, and the AI books qualified estimates and turns away the ones outside your lane.",
      },
      {
        q: "Does it work after hours and on weekends?",
        a: "Around the clock. Many high-intent homeowner and GC calls come evenings and weekends — exactly when a voicemail loses the bid.",
      },
      {
        q: "Will it replace my office manager?",
        a: "No — it backs them up. It catches the calls no one can get to while you're on a job site, so no estimate request is ever lost.",
      },
    ],
    trust: ["Answers 24/7", "Captures every lead", "Books site visits"],
  },
  auto: {
    slug: "auto",
    audience: "auto service shops",
    eyebrow: "For auto services",
    title: "AI receptionist for auto shops",
    metaTitle: "AI Receptionist for Auto Shops — PracticeVoice AI",
    metaDescription:
      "An AI receptionist for auto repair and service shops that answers every call 24/7, books appointments and tows, sends confirmations, and shows the revenue each call books.",
    headline: "The AI receptionist built for auto service shops",
    sub: "When your service advisors are under a hood, the phone keeps ringing. PracticeVoice answers every call, books the appointment, and handles after-hours tows — so no customer drives to the shop down the road.",
    benefits: [
      {
        title: "Answer every call, even when the bay is slammed",
        body: "When both advisors are with customers, PracticeVoice picks up — so callers aren't stuck on hold or sent to voicemail while your competitor answers.",
      },
      {
        title: "Book appointments and after-hours tows",
        body: "The AI books oil changes, diagnostics, and repairs into your schedule, captures tow and drop-off requests after close, and texts a confirmation to every customer.",
      },
      {
        title: "See the revenue each call books",
        body: "Every booked appointment is tied to real dollars — services, repairs, tires — so you see exactly what your AI receptionist earns the shop each month.",
      },
    ],
    faqs: [
      {
        q: "Can it book different service types?",
        a: "Yes — oil changes, diagnostics, brakes, inspections, and major repairs. You set your services, bays, and hours, and the AI books the right slot.",
      },
      {
        q: "What about after-hours breakdowns and tows?",
        a: "You set the rules. The AI captures the vehicle, location, and problem, gives your after-hours instructions, and can escalate an urgent tow to your on-call line.",
      },
      {
        q: "Will it replace my service advisors?",
        a: "No — it backs them up. It catches the calls they can't get to so no customer is lost, while your advisors focus on the cars in the bay.",
      },
    ],
    trust: ["Answers 24/7", "Books service & tows", "Texts confirmations"],
  },
  salons: {
    slug: "salons",
    audience: "salons & spas",
    eyebrow: "For salons & spas",
    title: "AI receptionist for salons & spas",
    metaTitle: "AI Receptionist for Salons & Spas — PracticeVoice AI",
    metaDescription:
      "An AI receptionist for salons and spas that answers every call 24/7, books and rebooks appointments, fills cancellations, and shows the revenue each booking brings in.",
    headline: "The AI receptionist built for salons & spas",
    sub: "You can't take a call with your hands in someone's hair. PracticeVoice answers every ring, books and rebooks appointments, and fills last-minute cancellations — so every chair stays full.",
    benefits: [
      {
        title: "Book while you're with a client",
        body: "When your team is mid-service, PracticeVoice answers on the first ring, books the appointment with the right stylist, and texts a confirmation — no interruption, no missed booking.",
      },
      {
        title: "Fill cancellations and cut no-shows",
        body: "Automatic text confirmations and reminders keep your book full, and the AI can offer freshly opened slots to callers so a cancellation doesn't become an empty chair.",
      },
      {
        title: "See the revenue each booking brings in",
        body: "Every booked appointment is tied to real dollars — color, cuts, treatments, packages — so you see exactly what your AI receptionist earns the salon each month.",
      },
    ],
    faqs: [
      {
        q: "Can it book specific stylists and services?",
        a: "Yes — you set your team, services, durations, and hours, and the AI books the right provider for the right service and texts a confirmation.",
      },
      {
        q: "Does it work after hours?",
        a: "Around the clock. Plenty of clients book evenings and weekends after they leave work — exactly when a voicemail loses them to another salon.",
      },
      {
        q: "Will it replace my front desk?",
        a: "No — it backs them up. It catches the calls your team can't get to while they're with clients, so no booking is ever lost.",
      },
    ],
    trust: ["Answers 24/7", "Books & rebooks", "Fills cancellations"],
  },
  "real-estate": {
    slug: "real-estate",
    audience: "real estate teams",
    eyebrow: "For real estate",
    title: "AI receptionist for real estate",
    metaTitle: "AI Receptionist for Real Estate — PracticeVoice AI",
    metaDescription:
      "An AI receptionist for real estate agents and teams that answers every call 24/7, captures and qualifies leads, books showings, and routes each caller to the right agent.",
    headline: "The AI receptionist built for real estate teams",
    sub: "In real estate, the lead you miss is the commission someone else earns. PracticeVoice answers every call, captures and qualifies the lead, books the showing, and routes it to the right agent — day or night.",
    benefits: [
      {
        title: "Capture every lead before it's cold",
        body: "Buyers and sellers call the number on the sign and move on if no one answers. PracticeVoice answers instantly, 24/7, and captures the lead before it goes to a competing agent.",
      },
      {
        title: "Qualify and route to the right agent",
        body: "The AI collects the property, budget, and timeline, then routes buyer, seller, and rental inquiries to the right person on your team — no lead sits in a voicemail box.",
      },
      {
        title: "Know what your pipeline is worth",
        body: "Every captured lead and booked showing is tied to its value, so you can see the pipeline your AI receptionist is filling each month.",
      },
    ],
    faqs: [
      {
        q: "Can it qualify buyer and seller leads?",
        a: "Yes — you configure the questions to ask (property, budget, timeline, financing), and the AI captures a qualified lead and routes it to the right agent.",
      },
      {
        q: "Can it route calls to individual agents?",
        a: "Yes. You set the routing rules by inquiry type or listing, and the AI hands off to the right agent or takes a detailed message when they're unavailable.",
      },
      {
        q: "Does it work nights and weekends?",
        a: "Around the clock — which is when most showing requests and sign calls come in. A missed one is a client who called the next agent.",
      },
    ],
    trust: ["Answers 24/7", "Qualifies leads", "Routes to agents"],
  },
  restaurants: {
    slug: "restaurants",
    audience: "restaurants",
    eyebrow: "For restaurants",
    title: "AI receptionist for restaurants",
    metaTitle: "AI Receptionist for Restaurants — PracticeVoice AI",
    metaDescription:
      "An AI receptionist for restaurants that answers every call during the rush, takes reservations and catering requests, answers hours and menu questions, and never drops a call.",
    headline: "The AI receptionist built for restaurants",
    sub: "During the rush, nobody has a hand free for the phone. PracticeVoice answers every call, takes reservations and catering requests, and handles the hours-and-directions questions — so your team stays on the floor.",
    benefits: [
      {
        title: "Answer every call through the dinner rush",
        body: "When the floor is packed, PracticeVoice picks up — booking reservations and answering questions so a ringing phone never pulls a server off the floor or goes unanswered.",
      },
      {
        title: "Take reservations and catering requests",
        body: "The AI books reservations into your system, captures catering and large-party inquiries with the details you need, and texts a confirmation to the guest.",
      },
      {
        title: "Handle the routine questions automatically",
        body: "Hours, location, parking, dietary options, private events — the AI answers the calls that interrupt service, so your staff focuses on the guests in the room.",
      },
    ],
    faqs: [
      {
        q: "Can it take reservations and catering orders?",
        a: "Yes — it books reservations into the hours and seating rules you set, and captures catering and large-party requests with all the details, then texts a confirmation.",
      },
      {
        q: "Can it answer questions about my menu and hours?",
        a: "Yes. You give it your hours, location, menu highlights, and policies, and it answers callers accurately — freeing your team from the phone during service.",
      },
      {
        q: "Will it replace my host stand?",
        a: "No — it backs it up. It catches the calls your host can't get to during the rush, so no reservation or catering lead is ever lost to voicemail.",
      },
    ],
    trust: ["Answers 24/7", "Takes reservations", "Handles catering"],
  },
  "assistance-line": {
    slug: "assistance-line",
    audience: "assistance & help lines",
    eyebrow: "For nonprofits & community assistance lines",
    title: "AI receptionist for community assistance lines",
    metaTitle: "AI Intake Line for Nonprofits & 211 — PracticeVoice AI",
    metaDescription:
      "An AI voice agent for nonprofit help lines and 211-style intake: answer every caller 24/7, triage need, route to services, and refer resources with multilingual coverage.",
    headline: "The AI help line that answers every person reaching out",
    sub: "When someone calls for help — housing, food, benefits, a crisis referral — a busy signal or voicemail can be the moment they give up. PracticeVoice answers every call 24/7, understands the need, and routes them to the right resource or program.",
    benefits: [
      {
        title: "Never leave a caller in need on hold",
        body: "Assistance lines spike unpredictably. PracticeVoice answers every call on the first ring, 24/7, so a person seeking housing, food, or benefits help always reaches a calm, capable voice instead of voicemail.",
      },
      {
        title: "Intake, triage, and warm routing",
        body: "The AI gathers what the caller needs, triages urgency, and routes them to the right program, department, or partner agency — or takes structured intake for a caseworker to follow up.",
      },
      {
        title: "Multilingual, after-hours resource referral",
        body: "Nights, weekends, and overflow are covered in multiple languages. Callers get accurate referrals from your resource directory when your staff and 211 partners are offline.",
      },
    ],
    faqs: [
      {
        q: "Can it triage and route to the right program or agency?",
        a: "Yes. You configure your programs, eligibility questions, and partner directory, and the AI triages each caller's need, routes to the right line, and can warm-transfer or take structured intake for follow-up.",
      },
      {
        q: "Does it support callers in multiple languages?",
        a: "Yes — it can greet and assist callers in multiple languages, so after-hours and overflow coverage reaches the whole community, not just English speakers.",
      },
      {
        q: "Can it cover multiple lines and departments under one contract?",
        a: "Yes. This is a core fit for larger organizations: intake, benefits navigation, resource referral, and program-specific lines can all run under a single bundled contract, each with its own script, hours, and routing.",
      },
    ],
    trust: ["Answers 24/7", "Multilingual", "Triage & referral"],
    ctaHref: "/contact",
  },
};

export const VERTICAL_LIST = Object.values(VERTICALS);
