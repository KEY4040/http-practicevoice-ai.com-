import {
  DEFAULT_CONFIRMATION_TEMPLATE,
  DEFAULT_REMINDER_TEMPLATE,
} from "./smsTemplates";

/**
 * Clinic-level settings that the SMS features read from.
 *
 * Persisted to localStorage for now so the UI works end-to-end without a
 * backend. When Supabase is connected, swap the load/save bodies to read/write
 * the `clinics` row — the rest of the app doesn't need to change.
 */
export interface ClinicSettings {
  clinicName: string;
  /** The Twilio number texts are sent FROM (display/reference in the UI). */
  twilioNumber: string;
  confirmationTemplate: string;
  reminderTemplate: string;
}

const STORAGE_KEY = "pv_clinic_settings";

function defaults(): ClinicSettings {
  return {
    clinicName: "Bayview Dental",
    twilioNumber: "",
    confirmationTemplate: DEFAULT_CONFIRMATION_TEMPLATE,
    reminderTemplate: DEFAULT_REMINDER_TEMPLATE,
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
