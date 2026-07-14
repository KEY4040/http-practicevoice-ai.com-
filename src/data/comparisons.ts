/**
 * Honest comparison-page content. These target high-intent "vs" searches and
 * reframe the decision around PracticeVoice's real edges (24/7 AI, a revenue
 * dashboard, transparent flat pricing) — using defensible, public-range facts,
 * not disparagement.
 */

export interface CompareRow {
  label: string;
  pv: string;
  them: string;
  /** true when PracticeVoice is the clearly better cell (for the check styling). */
  pvWins?: boolean;
}

export interface Comparison {
  slug: string;
  competitor: string;
  metaTitle: string;
  metaDescription: string;
  headline: string;
  sub: string;
  /** Honest one-liner on when the competitor is actually the better pick. */
  fairness: string;
  rows: CompareRow[];
}

export const COMPARISONS: Record<string, Comparison> = {
  ruby: {
    slug: "ruby",
    competitor: "Ruby",
    metaTitle: "PracticeVoice AI vs Ruby — AI vs Human Receptionist",
    metaDescription:
      "PracticeVoice AI vs Ruby: compare price, 24/7 answering, appointment booking, and revenue reporting for an AI receptionist vs a human answering service.",
    headline: "PracticeVoice AI vs Ruby",
    sub: "Ruby pioneered the friendly human answering service. PracticeVoice is the AI built to book appointments 24/7 at a flat rate — and show you the revenue it makes.",
    fairness:
      "If you specifically want live human receptionists and are happy paying per minute for that warmth, Ruby is excellent. If you want 24/7 booking at a predictable flat price, keep reading.",
    rows: [
      { label: "Starting price", pv: "$99/mo flat", them: "~$245–705/mo (public plans)", pvWins: true },
      { label: "Answers 24/7", pv: "Always, no add-on", them: "Extended hours cost more", pvWins: true },
      { label: "Books appointments", pv: "Yes, into your rules", them: "Limited / message-taking", pvWins: true },
      { label: "Revenue dashboard", pv: "Yes — $ per call", them: "No", pvWins: true },
      { label: "Text confirmations & reminders", pv: "Included", them: "Varies", pvWins: true },
      { label: "Per-minute overage fees", pv: "None", them: "Yes, common", pvWins: true },
      { label: "Live human warmth", pv: "AI voice (natural)", them: "Real people" },
      { label: "HIPAA posture", pv: "HIPAA-conscious, BAA available", them: "BAA available" },
    ],
  },
  "answering-service": {
    slug: "answering-service",
    competitor: "a traditional answering service",
    metaTitle: "PracticeVoice AI vs a Traditional Answering Service",
    metaDescription:
      "PracticeVoice AI vs a traditional phone answering service: compare cost, 24/7 booking, reminders, and revenue reporting for any business that answers the phone.",
    headline: "PracticeVoice AI vs a traditional answering service",
    sub: "Old-school answering services take a message. PracticeVoice actually books the appointment, texts the confirmation, and shows you the revenue — usually for less.",
    fairness:
      "Traditional services still make sense if you only need after-hours message-taking with no scheduling. If you want calls turned into booked jobs and appointments, PracticeVoice is built for that.",
    rows: [
      { label: "Typical price", pv: "$99–399/mo flat", them: "~$200–2,500/mo (per-minute)", pvWins: true },
      { label: "Books appointments", pv: "Yes", them: "Rarely — usually messages only", pvWins: true },
      { label: "Answers 24/7", pv: "Always", them: "Often after-hours only" },
      { label: "Text confirmations & reminders", pv: "Included", them: "Rarely", pvWins: true },
      { label: "Revenue dashboard + transcripts", pv: "Yes", them: "No", pvWins: true },
      { label: "Per-minute billing", pv: "None — flat", them: "Yes", pvWins: true },
      { label: "Consistent script & quality", pv: "Every call, identical", them: "Varies by operator", pvWins: true },
    ],
  },
  "smith-ai": {
    slug: "smith-ai",
    competitor: "Smith.ai",
    metaTitle: "PracticeVoice AI vs Smith.ai — AI Receptionist Comparison",
    metaDescription:
      "PracticeVoice AI vs Smith.ai: compare pricing model, 24/7 booking, revenue reporting, and HIPAA posture for any business — home services to healthcare.",
    headline: "PracticeVoice AI vs Smith.ai",
    sub: "Smith.ai offers AI and human receptionists billed per call. PracticeVoice is a flat-rate AI receptionist for any business — home services to healthcare — that shows the revenue it books.",
    fairness:
      "Smith.ai is a strong, established option with human agents available. But for practices handling patient health information, check HIPAA fit carefully — and if you want flat pricing plus a revenue dashboard, that's our lane.",
    rows: [
      { label: "Pricing model", pv: "Flat monthly ($99–399)", them: "Per-call plans", pvWins: true },
      { label: "Predictable bill", pv: "Yes — flat", them: "Varies with call volume", pvWins: true },
      { label: "Books appointments 24/7", pv: "Yes", them: "Yes" },
      { label: "Revenue dashboard", pv: "Yes — $ per call", them: "No", pvWins: true },
      { label: "Built for healthcare (HIPAA)", pv: "HIPAA-conscious, BAA available", them: "AI receptionist not positioned as HIPAA — verify", pvWins: true },
      { label: "Human agents option", pv: "AI only", them: "AI + human available" },
    ],
  },
};

export const COMPARISON_LIST = Object.values(COMPARISONS);
