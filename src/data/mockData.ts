/**
 * Realistic demo data for PracticeVoice AI.
 *
 * Everything here is mock content used to render the dashboard, call history,
 * and call-detail views before real Vapi/Retell + Supabase data is connected.
 * Times are expressed as "hours ago" offsets and resolved to ISO strings at
 * import time so the UI always looks fresh.
 */

export type CallOutcome = "booked" | "escalated" | "missed" | "info";

export interface CallTranscriptLine {
  speaker: "ai" | "caller";
  text: string;
}

export interface Call {
  id: string;
  caller: string;
  phone: string;
  /** ISO timestamp */
  time: string;
  durationSec: number;
  outcome: CallOutcome;
  reason: string;
  summary: string;
  /** Estimated revenue attributed to this call when it results in a booking. */
  revenue: number;
  appointment?: {
    type: string;
    provider: string;
    when: string;
  };
  transcript: CallTranscriptLine[];
  notes?: string;
}

const HOUR = 60 * 60 * 1000;

/** Build an ISO timestamp `hoursAgo` hours before now. */
function iso(hoursAgo: number): string {
  return new Date(Date.now() - hoursAgo * HOUR).toISOString();
}

export const calls: Call[] = [
  {
    id: "c_1042",
    caller: "Maria Gonzalez",
    phone: "(415) 555-0182",
    time: iso(0.4),
    durationSec: 132,
    outcome: "booked",
    reason: "New patient cleaning",
    summary:
      "New patient requested a routine cleaning and exam. Verified Delta Dental coverage and booked with Dr. Patel for next Tuesday at 10:00 AM. Sent confirmation text.",
    revenue: 180,
    appointment: {
      type: "Cleaning & Exam",
      provider: "Dr. Patel",
      when: "Tue, Jul 8 · 10:00 AM",
    },
    transcript: [
      { speaker: "ai", text: "Thank you for calling Bayview Dental, this is Ava. How can I help you today?" },
      { speaker: "caller", text: "Hi, I'm a new patient and I'd like to schedule a cleaning." },
      { speaker: "ai", text: "Wonderful, I'd be happy to set that up. Are you experiencing any pain or is this a routine visit?" },
      { speaker: "caller", text: "Just routine, it's been a while." },
      { speaker: "ai", text: "No problem at all. Do you have dental insurance you'd like us to bill?" },
      { speaker: "caller", text: "Yes, Delta Dental." },
      { speaker: "ai", text: "Great, we're in-network with Delta Dental. I have Tuesday, July 8th at 10 AM with Dr. Patel. Does that work?" },
      { speaker: "caller", text: "That's perfect." },
      { speaker: "ai", text: "You're all booked. I'll text a confirmation and our new-patient forms to this number. See you Tuesday!" },
    ],
    notes: "Prefers morning appointments. Mentioned mild sensitivity on upper left.",
  },
  {
    id: "c_1041",
    caller: "James Whitfield",
    phone: "(628) 555-0147",
    time: iso(1.2),
    durationSec: 98,
    outcome: "booked",
    reason: "Crown consultation",
    summary:
      "Existing patient with a chipped crown. Booked a consultation with Dr. Nguyen for Wednesday at 2:30 PM. Flagged for possible same-day repair.",
    revenue: 320,
    appointment: {
      type: "Crown Consultation",
      provider: "Dr. Nguyen",
      when: "Wed, Jul 9 · 2:30 PM",
    },
    transcript: [
      { speaker: "ai", text: "Thanks for calling Bayview Dental, this is Ava speaking." },
      { speaker: "caller", text: "Hey, one of my crowns chipped this morning." },
      { speaker: "ai", text: "I'm sorry to hear that. Are you in any pain right now?" },
      { speaker: "caller", text: "Not really, it's just rough on my tongue." },
      { speaker: "ai", text: "Understood. Let's get you seen. I can offer Wednesday at 2:30 with Dr. Nguyen for a consultation and possible same-day repair." },
      { speaker: "caller", text: "Works for me." },
      { speaker: "ai", text: "Perfect, you're booked. I'll send a text confirmation now." },
    ],
    notes: "Chipped crown, lower right molar. No acute pain.",
  },
  {
    id: "c_1040",
    caller: "Aisha Rahman",
    phone: "(415) 555-0139",
    time: iso(2.6),
    durationSec: 76,
    outcome: "info",
    reason: "Insurance question",
    summary:
      "Caller asked whether the practice accepts Cigna PPO and about the cost of Invisalign. Provided coverage info and quoted a consultation. No booking — will call back after checking with spouse.",
    revenue: 0,
    transcript: [
      { speaker: "ai", text: "Bayview Dental, this is Ava. How can I help?" },
      { speaker: "caller", text: "Do you take Cigna PPO, and how much is Invisalign?" },
      { speaker: "ai", text: "Yes, we accept Cigna PPO. Invisalign starts with a $95 consultation, and treatment typically runs $3,500 to $5,500 depending on your case." },
      { speaker: "caller", text: "Got it, I'll talk to my husband and call back." },
      { speaker: "ai", text: "Of course. Whenever you're ready, we're here 24/7. Have a great day!" },
    ],
    notes: "Interested in Invisalign. Follow-up opportunity.",
  },
  {
    id: "c_1039",
    caller: "Robert Chen",
    phone: "(650) 555-0121",
    time: iso(4.1),
    durationSec: 210,
    outcome: "escalated",
    reason: "Severe tooth pain",
    summary:
      "Caller reported severe throbbing pain and swelling. AI classified as urgent, collected symptoms, and escalated to the on-call line. Dr. Patel paged; emergency slot held for 4:00 PM.",
    revenue: 240,
    appointment: {
      type: "Emergency Visit",
      provider: "Dr. Patel",
      when: "Today · 4:00 PM",
    },
    transcript: [
      { speaker: "ai", text: "Bayview Dental, this is Ava. How can I help you?" },
      { speaker: "caller", text: "I've got really bad pain and my cheek is swollen." },
      { speaker: "ai", text: "That sounds urgent and I want to get you help quickly. On a scale of 1 to 10, how bad is the pain?" },
      { speaker: "caller", text: "Like an 8." },
      { speaker: "ai", text: "Thank you. I'm holding an emergency slot at 4 PM today and paging Dr. Patel now. Can you make it in this afternoon?" },
      { speaker: "caller", text: "Yes, I'll come in." },
      { speaker: "ai", text: "You're on the schedule and the doctor has been notified. If the swelling worsens or you have trouble breathing, please go to the ER." },
    ],
    notes: "Possible abscess — swelling on left cheek. Escalated to on-call.",
  },
  {
    id: "c_1038",
    caller: "Unknown Caller",
    phone: "(415) 555-0198",
    time: iso(6.5),
    durationSec: 0,
    outcome: "missed",
    reason: "Voicemail — no message",
    summary:
      "Caller hung up before the AI could complete intake. No voicemail left. Number flagged for a follow-up SMS.",
    revenue: 0,
    transcript: [
      { speaker: "ai", text: "Thank you for calling Bayview Dental, this is Ava. How can I help you today?" },
      { speaker: "caller", text: "(call disconnected)" },
    ],
    notes: "Follow-up SMS sent automatically.",
  },
  {
    id: "c_1037",
    caller: "Linda Okafor",
    phone: "(510) 555-0164",
    time: iso(9),
    durationSec: 145,
    outcome: "booked",
    reason: "6-month recall",
    summary:
      "Recall reminder returned call. Booked routine cleaning with hygienist for Thursday at 9 AM. Confirmed updated phone number.",
    revenue: 160,
    appointment: {
      type: "Cleaning & Exam",
      provider: "Hygienist · Dana",
      when: "Thu, Jul 10 · 9:00 AM",
    },
    transcript: [
      { speaker: "ai", text: "Bayview Dental, this is Ava. How can I help?" },
      { speaker: "caller", text: "I got a text that I'm due for a cleaning." },
      { speaker: "ai", text: "Yes! You're due for your six-month recall. I have Thursday at 9 AM with Dana. Shall I book it?" },
      { speaker: "caller", text: "Please do." },
      { speaker: "ai", text: "Done! Confirmation is on its way to your phone." },
    ],
  },
  {
    id: "c_1036",
    caller: "Daniel Brooks",
    phone: "(415) 555-0155",
    time: iso(20),
    durationSec: 118,
    outcome: "booked",
    reason: "Whitening consult",
    summary:
      "Booked a cosmetic whitening consultation for next Monday at 11 AM with Dr. Nguyen. Interested in a wedding timeline.",
    revenue: 140,
    appointment: {
      type: "Whitening Consult",
      provider: "Dr. Nguyen",
      when: "Mon, Jul 14 · 11:00 AM",
    },
    transcript: [
      { speaker: "ai", text: "Bayview Dental, this is Ava. How can I help you today?" },
      { speaker: "caller", text: "I want to whiten my teeth before my wedding." },
      { speaker: "ai", text: "How exciting! When is the big day?" },
      { speaker: "caller", text: "In about two months." },
      { speaker: "ai", text: "Plenty of time. I'll book a whitening consult Monday at 11 with Dr. Nguyen so we can plan your timeline." },
      { speaker: "caller", text: "Perfect, thank you." },
    ],
  },
  {
    id: "c_1035",
    caller: "Priya Sharma",
    phone: "(408) 555-0173",
    time: iso(26),
    durationSec: 89,
    outcome: "booked",
    reason: "Child checkup",
    summary:
      "Parent booked a pediatric checkup for two children on Friday afternoon. Confirmed insurance and sent new-patient forms.",
    revenue: 220,
    appointment: {
      type: "Pediatric Checkup (x2)",
      provider: "Dr. Patel",
      when: "Fri, Jul 11 · 3:30 PM",
    },
    transcript: [
      { speaker: "ai", text: "Bayview Dental, this is Ava. How can I help?" },
      { speaker: "caller", text: "I need checkups for my two kids." },
      { speaker: "ai", text: "Absolutely. I can see them together Friday at 3:30 with Dr. Patel. Does that work?" },
      { speaker: "caller", text: "Yes, thank you." },
    ],
  },
];

export function getCallById(id: string): Call | undefined {
  return calls.find((c) => c.id === id);
}

/* -------------------------------------------------------------------------- */
/*  Dashboard metrics                                                          */
/* -------------------------------------------------------------------------- */

export interface Metric {
  label: string;
  value: string;
  delta: number; // percent change vs. previous period
  hint: string;
}

export const metrics: Metric[] = [
  {
    label: "Calls Answered",
    value: "1,284",
    delta: 12.4,
    hint: "This month · 100% answer rate",
  },
  {
    label: "Appointments Booked",
    value: "412",
    delta: 18.9,
    hint: "32% of calls converted",
  },
  {
    label: "Revenue Generated",
    value: "$74,160",
    delta: 23.1,
    hint: "Est. value from booked calls",
  },
  {
    label: "After-Hours Calls Saved",
    value: "137",
    delta: 9.7,
    hint: "Calls handled outside office hours",
  },
];

/** Calls answered per day for the trailing 14 days (chart series). */
export const callsOverTime = [
  { day: "Jun 22", calls: 38, booked: 11 },
  { day: "Jun 23", calls: 44, booked: 14 },
  { day: "Jun 24", calls: 41, booked: 13 },
  { day: "Jun 25", calls: 52, booked: 18 },
  { day: "Jun 26", calls: 49, booked: 16 },
  { day: "Jun 27", calls: 58, booked: 21 },
  { day: "Jun 28", calls: 33, booked: 9 },
  { day: "Jun 29", calls: 29, booked: 8 },
  { day: "Jun 30", calls: 47, booked: 15 },
  { day: "Jul 1", calls: 55, booked: 19 },
  { day: "Jul 2", calls: 61, booked: 23 },
  { day: "Jul 3", calls: 57, booked: 20 },
  { day: "Jul 4", calls: 42, booked: 13 },
  { day: "Jul 5", calls: 51, booked: 17 },
];

/** Revenue attribution by appointment category (for the breakdown widget). */
export const revenueByType = [
  { type: "Cleanings & Exams", value: 24800 },
  { type: "Crowns & Restorative", value: 21600 },
  { type: "Emergency Visits", value: 12400 },
  { type: "Cosmetic / Whitening", value: 9800 },
  { type: "Consultations", value: 5560 },
];
