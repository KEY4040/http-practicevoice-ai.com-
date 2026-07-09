/**
 * Per-vertical landing-page content (dental / medical / legal). Each becomes a
 * dedicated, SEO-targeted page at /:slug so we rank for "AI receptionist for
 * dentists", etc., and speak to each buyer's specific worries.
 */

export interface VerticalBenefit {
  title: string;
  body: string;
}

export interface VerticalFaq {
  q: string;
  a: string;
}

export interface Vertical {
  slug: "dental" | "medical" | "legal";
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
        q: "Is it HIPAA-conscious?",
        a: "PracticeVoice is built for HIPAA-conscious workflows: encrypted in transit and at rest, access restricted to your team, and a BAA available on qualifying plans.",
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
        a: "It's built for HIPAA-conscious workflows — encrypted in transit and at rest, access restricted to your authorized team, with a BAA available on qualifying plans.",
      },
      {
        q: "What about urgent or emergency calls?",
        a: "You set the rules. The AI recognizes urgency, delivers your after-hours instructions, and can escalate to your on-call line.",
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
  },
};

export const VERTICAL_LIST = Object.values(VERTICALS);
