/**
 * Industry-specific demo datasets for the public /demo dashboard.
 *
 * The problem this solves: a legal buyer previewing the demo should see legal
 * call history AND legal revenue — not law-firm intake sitting next to
 * "$24,800 in cleanings & exams". Each vertical links to /demo?industry=<slug>,
 * and the dashboard renders the matching business name, greeting persona, call
 * history, metrics, and revenue breakdown so the whole screen tells one story.
 *
 * The dental set reuses the original mock content (the product's first vertical);
 * legal and home-services are full parallel sets. Verticals without a dedicated
 * set fall back to dental. All figures are illustrative.
 */
import {
  calls as dentalCalls,
  metrics as dentalMetrics,
  callsOverTime as sharedCallsOverTime,
  revenueByType as dentalRevenueByType,
  type Call,
  type Metric,
} from "@/data/mockData";

export interface RevenueSlice {
  type: string;
  value: number;
}

export interface DemoDataset {
  /** Slug used in ?industry= and to pick this set. */
  industry: string;
  /** Business name shown in the demo (illustrative). */
  businessName: string;
  /** Name used in the dashboard greeting ("Good to see you, …"). */
  personaName: string;
  /** The demo's illustrative AI phone number. */
  aiNumber: string;
  calls: Call[];
  metrics: Metric[];
  callsOverTime: typeof sharedCallsOverTime;
  revenueByType: RevenueSlice[];
}

const HOUR = 60 * 60 * 1000;
/** ISO timestamp `hoursAgo` hours before now (kept fresh on each load). */
function iso(hoursAgo: number): string {
  return new Date(Date.now() - hoursAgo * HOUR).toISOString();
}

/* ------------------------------- Dental --------------------------------- */

const dental: DemoDataset = {
  industry: "dental",
  businessName: "Bayview Dental",
  personaName: "Dr. Patel",
  aiNumber: "+1 (555) 012-3456",
  calls: dentalCalls,
  metrics: dentalMetrics,
  callsOverTime: sharedCallsOverTime,
  revenueByType: dentalRevenueByType,
};

/* -------------------------------- Legal --------------------------------- */

const legalCalls: Call[] = [
  {
    id: "l_2051",
    caller: "Robert Ellis",
    phone: "(415) 555-0142",
    time: iso(0.5),
    durationSec: 168,
    outcome: "booked",
    reason: "Car accident injury",
    summary:
      "New caller rear-ended two days ago, treated at urgent care. Ava captured the incident details and insurer, screened for a viable personal-injury claim, and booked a free consultation with Ms. Hale for Thursday at 2 PM.",
    revenue: 4500,
    appointment: { type: "Personal Injury Consult", provider: "Ms. Hale", when: "Thu, 2:00 PM" },
    transcript: [
      { speaker: "ai", text: "Thank you for calling Morgan & Hale Law, this is Ava. How can I help you today?" },
      { speaker: "caller", text: "I was rear-ended a couple days ago and I'm pretty sore. Do I have a case?" },
      { speaker: "ai", text: "I'm sorry that happened. It may well be worth a look — were you seen by a doctor?" },
      { speaker: "caller", text: "Yeah, urgent care that night." },
      { speaker: "ai", text: "Good. I can set you up with a free consultation with Ms. Hale this Thursday at 2. Shall I book it?" },
      { speaker: "caller", text: "Please do." },
      { speaker: "ai", text: "You're booked. I'll text a confirmation and what to bring. We'll take care of you." },
    ],
    notes: "Rear-end collision, urgent-care records exist. Strong PI intake.",
  },
  {
    id: "l_2050",
    caller: "Denise Park",
    phone: "(628) 555-0119",
    time: iso(1.4),
    durationSec: 142,
    outcome: "booked",
    reason: "Estate planning / will",
    summary:
      "Caller wants a will and healthcare directive drawn up before travel. Booked an estate-planning consult with Mr. Morgan for Monday at 10 AM. Flagged as a flat-fee matter.",
    revenue: 1800,
    appointment: { type: "Estate Planning Consult", provider: "Mr. Morgan", when: "Mon, 10:00 AM" },
    transcript: [
      { speaker: "ai", text: "Morgan & Hale Law, this is Ava. How can I help?" },
      { speaker: "caller", text: "I need to get a will done before a trip next month." },
      { speaker: "ai", text: "We can absolutely help with that. Do you also want a healthcare directive and power of attorney?" },
      { speaker: "caller", text: "Yes, the whole package." },
      { speaker: "ai", text: "I'll book you with Mr. Morgan Monday at 10. He'll walk you through a flat-fee estate plan." },
    ],
    notes: "Flat-fee estate package. Travel deadline next month.",
  },
  {
    id: "l_2049",
    caller: "Anonymous",
    phone: "(650) 555-0188",
    time: iso(3.1),
    durationSec: 205,
    outcome: "escalated",
    reason: "DUI arrest — time-sensitive",
    summary:
      "Caller's son was arrested for DUI last night with an arraignment in 48 hours. Ava recognized the deadline, collected the county and booking info, and escalated to the on-call criminal attorney immediately.",
    revenue: 3500,
    appointment: { type: "Criminal Defense (urgent)", provider: "On-call attorney", when: "Today · callback" },
    transcript: [
      { speaker: "ai", text: "Morgan & Hale Law, this is Ava." },
      { speaker: "caller", text: "My son was arrested for a DUI last night, we don't know what to do." },
      { speaker: "ai", text: "I understand — this is time-sensitive and I'll get an attorney on it right away. Which county is he being held in?" },
      { speaker: "caller", text: "Alameda." },
      { speaker: "ai", text: "Thank you. I'm paging our on-call defense attorney now; expect a callback within the hour. Please keep this line open." },
    ],
    notes: "Arraignment ~48h. Escalated to criminal on-call.",
  },
  {
    id: "l_2048",
    caller: "Marcus Bell",
    phone: "(415) 555-0164",
    time: iso(5.5),
    durationSec: 96,
    outcome: "info",
    reason: "Business contract review",
    summary:
      "Small-business owner asked whether the firm reviews vendor contracts and typical turnaround. Ava explained the hourly and flat-fee options and offered a paid consult; caller will send the contract first.",
    revenue: 0,
    transcript: [
      { speaker: "ai", text: "Morgan & Hale Law, this is Ava. How can I help you today?" },
      { speaker: "caller", text: "Do you all review business contracts? I've got a vendor agreement." },
      { speaker: "ai", text: "Yes, our business team handles contract review — usually a flat fee for a standard agreement. Would you like to book a review?" },
      { speaker: "caller", text: "Let me send it over first, then I'll call back." },
      { speaker: "ai", text: "Of course. I'll text you our secure upload link so an attorney can take a look." },
    ],
    notes: "Vendor contract review. Follow-up opportunity.",
  },
  {
    id: "l_2047",
    caller: "Sandra Whitfield",
    phone: "(510) 555-0173",
    time: iso(9),
    durationSec: 158,
    outcome: "booked",
    reason: "Divorce consultation",
    summary:
      "Caller seeking a family-law consult regarding an uncontested divorce with one child. Booked with Ms. Hale for Wednesday at 1 PM and sent an intake questionnaire.",
    revenue: 3200,
    appointment: { type: "Family Law Consult", provider: "Ms. Hale", when: "Wed, 1:00 PM" },
    transcript: [
      { speaker: "ai", text: "Morgan & Hale Law, this is Ava. How can I help?" },
      { speaker: "caller", text: "I think I need to start a divorce. It's mostly amicable." },
      { speaker: "ai", text: "I'm sorry you're going through this. We can help make it as smooth as possible. Is there a child involved?" },
      { speaker: "caller", text: "One, he's seven." },
      { speaker: "ai", text: "Understood. I'll book you with Ms. Hale Wednesday at 1 and send a short intake form to get started." },
    ],
    notes: "Uncontested, one minor child. Intake sent.",
  },
  {
    id: "l_2046",
    caller: "Unknown Caller",
    phone: "(415) 555-0150",
    time: iso(13),
    durationSec: 0,
    outcome: "missed",
    reason: "Voicemail — no message",
    summary:
      "Caller disconnected before intake completed. No message left. Number flagged for a follow-up text.",
    revenue: 0,
    transcript: [
      { speaker: "ai", text: "Thank you for calling Morgan & Hale Law, this is Ava. How can I help you today?" },
      { speaker: "caller", text: "(call disconnected)" },
    ],
    notes: "Follow-up SMS sent automatically.",
  },
  {
    id: "l_2045",
    caller: "Hector Ramos",
    phone: "(408) 555-0137",
    time: iso(22),
    durationSec: 121,
    outcome: "booked",
    reason: "Workers' comp injury",
    summary:
      "Caller injured on a job site and being pressured to return early. Ava screened the claim and booked a workers'-comp consult with Mr. Morgan for Friday at 11 AM.",
    revenue: 2800,
    appointment: { type: "Workers' Comp Consult", provider: "Mr. Morgan", when: "Fri, 11:00 AM" },
    transcript: [
      { speaker: "ai", text: "Morgan & Hale Law, this is Ava. How can I help you today?" },
      { speaker: "caller", text: "I hurt my back at work and they want me back already." },
      { speaker: "ai", text: "That's exactly what we help with. Have you filed a workers' comp claim yet?" },
      { speaker: "caller", text: "Not yet." },
      { speaker: "ai", text: "Let's protect your rights. I'll book you with Mr. Morgan Friday at 11 and text you what to bring." },
    ],
    notes: "Job-site back injury. Claim not yet filed.",
  },
];

const legal: DemoDataset = {
  industry: "legal",
  businessName: "Morgan & Hale Law",
  personaName: "Ms. Hale",
  aiNumber: "+1 (555) 018-2200",
  calls: legalCalls,
  metrics: [
    { label: "Calls Answered", value: "1,046", delta: 11.2, hint: "This month · 100% answer rate" },
    { label: "Consults Booked", value: "284", delta: 21.4, hint: "27% of calls converted" },
    { label: "Est. Matter Value", value: "$96,300", delta: 24.8, hint: "Est. value from signed matters" },
    { label: "After-Hours Calls Saved", value: "148", delta: 13.1, hint: "Calls handled outside office hours" },
  ],
  callsOverTime: sharedCallsOverTime,
  revenueByType: [
    { type: "Personal Injury", value: 38400 },
    { type: "Family Law", value: 22600 },
    { type: "Estate Planning", value: 14200 },
    { type: "Criminal Defense", value: 11800 },
    { type: "Business & Contracts", value: 9300 },
  ],
};

/* ---------------------------- Home services ----------------------------- */

const homeCalls: Call[] = [
  {
    id: "h_3061",
    caller: "Karen Delgado",
    phone: "(415) 555-0129",
    time: iso(0.4),
    durationSec: 121,
    outcome: "booked",
    reason: "AC not cooling",
    summary:
      "AC blowing warm during a heat wave. Ava triaged, confirmed the unit is under 12 years old, and booked a same-day service window (2–4 PM) with a $89 diagnostic. Texted the arrival window.",
    revenue: 320,
    appointment: { type: "AC Repair", provider: "Tech · Danny", when: "Today · 2:00–4:00 PM" },
    transcript: [
      { speaker: "ai", text: "Thanks for calling Summit Home Services, this is Ava. How can I help?" },
      { speaker: "caller", text: "My AC is blowing warm air and it's 98 degrees out." },
      { speaker: "ai", text: "Let's get someone out today. Is the unit making any noise or just not cooling?" },
      { speaker: "caller", text: "Just not cooling." },
      { speaker: "ai", text: "I have a 2 to 4 window this afternoon with a $89 diagnostic that applies to the repair. Want me to lock it in?" },
      { speaker: "caller", text: "Yes please." },
      { speaker: "ai", text: "Booked — I'll text your arrival window and the tech's name. Stay cool out there." },
    ],
    notes: "Heat-wave AC call. Same-day window held.",
  },
  {
    id: "h_3060",
    caller: "Tom Bradley",
    phone: "(628) 555-0155",
    time: iso(1.1),
    durationSec: 174,
    outcome: "escalated",
    reason: "Water heater burst",
    summary:
      "Caller's water heater is leaking heavily into the garage. Ava walked them through shutting off the water supply, flagged it urgent, and escalated to the on-call plumber for an emergency replacement quote.",
    revenue: 1200,
    appointment: { type: "Water Heater Replacement", provider: "On-call plumber", when: "Today · ASAP" },
    transcript: [
      { speaker: "ai", text: "Summit Home Services, this is Ava." },
      { speaker: "caller", text: "My water heater is pouring water all over the garage!" },
      { speaker: "ai", text: "Okay, let's stop the damage first — can you turn the water shutoff valve on top clockwise?" },
      { speaker: "caller", text: "Okay… got it, it's slowing down." },
      { speaker: "ai", text: "Great work. This is an emergency, so I'm paging our on-call plumber now for a same-day replacement. Expect a call in minutes." },
    ],
    notes: "Tank failure. Supply shut off. Escalated to on-call.",
  },
  {
    id: "h_3059",
    caller: "Priya Anand",
    phone: "(650) 555-0102",
    time: iso(3.3),
    durationSec: 88,
    outcome: "booked",
    reason: "Kitchen drain clog",
    summary:
      "Slow, fully-backed kitchen drain. Booked a drain-clearing visit for tomorrow morning at a flat $149 and offered a camera inspection if it recurs.",
    revenue: 240,
    appointment: { type: "Drain Clearing", provider: "Tech · Luis", when: "Tomorrow · 8:00–10:00 AM" },
    transcript: [
      { speaker: "ai", text: "Thanks for calling Summit Home Services, this is Ava. How can I help?" },
      { speaker: "caller", text: "My kitchen sink is completely backed up." },
      { speaker: "ai", text: "I can get a tech out tomorrow morning to clear it — flat $149 for a standard clog. Does 8 to 10 work?" },
      { speaker: "caller", text: "That works." },
      { speaker: "ai", text: "You're booked. If it comes back, we'll run a camera to check the line. Confirmation is on the way." },
    ],
    notes: "Kitchen line. Offered camera on recurrence.",
  },
  {
    id: "h_3058",
    caller: "Greg Nolan",
    phone: "(415) 555-0161",
    time: iso(6),
    durationSec: 132,
    outcome: "info",
    reason: "New AC system estimate",
    summary:
      "Homeowner replacing an aging system asked about a full AC install and financing. Ava explained the free in-home estimate and scheduled a comfort advisor visit for Saturday.",
    revenue: 0,
    appointment: { type: "Install Estimate", provider: "Comfort advisor", when: "Sat, 11:00 AM" },
    transcript: [
      { speaker: "ai", text: "Summit Home Services, this is Ava. How can I help you today?" },
      { speaker: "caller", text: "My AC is 18 years old. What's a new system run these days?" },
      { speaker: "ai", text: "It depends on the size and efficiency, so we do a free in-home estimate. We also offer financing. Want me to schedule one?" },
      { speaker: "caller", text: "Sure, this weekend if you can." },
      { speaker: "ai", text: "I have Saturday at 11 with a comfort advisor — booked. I'll text the details and financing info." },
    ],
    notes: "Replacement lead. Financing interest. Estimate set.",
  },
  {
    id: "h_3057",
    caller: "Unknown Caller",
    phone: "(510) 555-0144",
    time: iso(10),
    durationSec: 0,
    outcome: "missed",
    reason: "Voicemail — no message",
    summary:
      "Caller hung up before booking. No message. Number flagged for a follow-up text.",
    revenue: 0,
    transcript: [
      { speaker: "ai", text: "Thanks for calling Summit Home Services, this is Ava. How can I help?" },
      { speaker: "caller", text: "(call disconnected)" },
    ],
    notes: "Follow-up SMS sent automatically.",
  },
  {
    id: "h_3056",
    caller: "Alicia Moore",
    phone: "(408) 555-0176",
    time: iso(21),
    durationSec: 109,
    outcome: "booked",
    reason: "Furnace tune-up",
    summary:
      "Seasonal furnace maintenance ahead of winter. Booked a tune-up for Thursday afternoon and enrolled the caller in the annual maintenance plan.",
    revenue: 180,
    appointment: { type: "Furnace Tune-Up", provider: "Tech · Danny", when: "Thu, 1:00–3:00 PM" },
    transcript: [
      { speaker: "ai", text: "Summit Home Services, this is Ava. How can I help?" },
      { speaker: "caller", text: "I'd like to get my furnace checked before it gets cold." },
      { speaker: "ai", text: "Smart timing. I can book a tune-up Thursday afternoon. Would you like our annual plan? It covers two visits a year." },
      { speaker: "caller", text: "Yeah, sign me up." },
      { speaker: "ai", text: "Done — you're on the plan and booked for Thursday. Confirmation is on its way." },
    ],
    notes: "Enrolled in annual maintenance plan.",
  },
  {
    id: "h_3055",
    caller: "Dev Shah",
    phone: "(415) 555-0190",
    time: iso(27),
    durationSec: 97,
    outcome: "booked",
    reason: "Smart thermostat install",
    summary:
      "Caller bought a smart thermostat and wants professional installation. Booked a Friday morning install and confirmed compatibility with their existing HVAC.",
    revenue: 260,
    appointment: { type: "Thermostat Install", provider: "Tech · Luis", when: "Fri, 9:00–11:00 AM" },
    transcript: [
      { speaker: "ai", text: "Thanks for calling Summit Home Services, this is Ava. How can I help?" },
      { speaker: "caller", text: "I got a smart thermostat but don't want to wire it myself." },
      { speaker: "ai", text: "No problem — we install those all the time. What HVAC brand do you have, so I can confirm it's compatible?" },
      { speaker: "caller", text: "It's a Carrier system." },
      { speaker: "ai", text: "Perfect, that works. I'll book a Friday morning install and text you the window." },
    ],
    notes: "Customer-supplied thermostat, Carrier system.",
  },
];

const homeServices: DemoDataset = {
  industry: "home-services",
  businessName: "Summit Home Services",
  personaName: "Mike",
  aiNumber: "+1 (555) 016-4400",
  calls: homeCalls,
  metrics: [
    { label: "Calls Answered", value: "1,412", delta: 14.6, hint: "This month · 100% answer rate" },
    { label: "Jobs Booked", value: "437", delta: 19.8, hint: "31% of calls converted" },
    { label: "Revenue Generated", value: "$71,900", delta: 22.3, hint: "Est. value from booked jobs" },
    { label: "After-Hours Calls Saved", value: "168", delta: 12.9, hint: "Calls handled outside office hours" },
  ],
  callsOverTime: sharedCallsOverTime,
  revenueByType: [
    { type: "HVAC Repair & Install", value: 31200 },
    { type: "Plumbing", value: 18700 },
    { type: "Water Heaters", value: 11400 },
    { type: "Drain & Sewer", value: 7600 },
    { type: "Maintenance Plans", value: 5100 },
  ],
};

/* ------------------------------ Selection ------------------------------- */

const BY_INDUSTRY: Record<string, DemoDataset> = {
  dental,
  medical: dental,
  veterinary: dental,
  legal,
  "home-services": homeServices,
  contractors: homeServices,
  auto: homeServices,
};

/** The default demo set when no (or an unknown) industry is requested. */
export const DEFAULT_DEMO = dental;

/** Pick the demo dataset for a vertical slug / ?industry value. */
export function getDemoDataset(industry?: string | null): DemoDataset {
  if (!industry) return DEFAULT_DEMO;
  return BY_INDUSTRY[industry] ?? DEFAULT_DEMO;
}

/** Find a single demo call by id within the selected industry's set. */
export function getDemoCallById(
  industry: string | null | undefined,
  id: string
): Call | undefined {
  return getDemoDataset(industry).calls.find((c) => c.id === id);
}
