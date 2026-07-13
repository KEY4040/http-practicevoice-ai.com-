import {
  DEFAULT_CONFIRMATION_TEMPLATE,
  DEFAULT_REMINDER_TEMPLATE,
} from "./smsTemplates";

/**
 * Clinic-level settings the dashboard collects and the SMS features read from.
 *
 * Persisted to localStorage so everything the owner types on the Settings page
 * — business name, services, hours, voice, and SMS templates — sticks between
 * visits instead of snapping back to defaults. Name/phone also sync to the
 * Supabase `clinics` row (see clinic.ts) so the receptionist's texts use them.
 */
export interface ClinicSettings {
  clinicName: string;
  /** The Twilio number texts are sent FROM (display/reference in the UI). */
  twilioNumber: string;
  confirmationTemplate: string;
  reminderTemplate: string;
  /** What the AI can book / help with. */
  services: string[];
  /** Open days, e.g. ["Mon","Tue"]. */
  openDays: string[];
  openTime: string;
  closeTime: string;
  /** Receptionist voice: "Ava" | "Grace" | "Noah". */
  voice: string;
}

const STORAGE_KEY = "pv_clinic_settings";

function defaults(): ClinicSettings {
  return {
    clinicName: "My Business",
    twilioNumber: "",
    confirmationTemplate: DEFAULT_CONFIRMATION_TEMPLATE,
    reminderTemplate: DEFAULT_REMINDER_TEMPLATE,
    services: [
      "Cleaning & Exam",
      "Crown / Restorative",
      "Emergency Visit",
      "Whitening",
      "Consultation",
    ],
    openDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    openTime: "08:00",
    closeTime: "17:00",
    voice: "Ava",
  };
}

export function loadClinicSettings(): ClinicSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaults(), ...(JSON.parse(raw) as Partial<ClinicSettings>) };
  } catch {
    // Corrupt value — fall back to defaults.
  }
  return defaults();
}

export function saveClinicSettings(settings: ClinicSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
