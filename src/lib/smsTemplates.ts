/**
 * SMS message templates and rendering.
 *
 * Templates use {{variable}} placeholders that get filled in with real
 * appointment details before sending. The same tokens are documented for the
 * clinic owner in Settings so they can customize the wording safely.
 */

export interface SmsVariable {
  token: string;
  label: string;
  example: string;
}

// Tokens are unchanged (existing saved templates depend on them); only the
// owner-facing labels and example values are industry-neutral now, so a salon /
// contractor / real-estate customer doesn't see medical-only wording.
export const SMS_VARIABLES: SmsVariable[] = [
  { token: "{{patient_name}}", label: "Customer name", example: "Maria Gonzalez" },
  { token: "{{clinic_name}}", label: "Business name", example: "Riverside Studio" },
  { token: "{{service}}", label: "Service", example: "consultation" },
  { token: "{{appointment_time}}", label: "Appointment time", example: "Tue, Jul 8 · 10:00 AM" },
  { token: "{{provider}}", label: "Staff member", example: "Alex" },
];

export const DEFAULT_CONFIRMATION_TEMPLATE =
  "Hi {{patient_name}}, this is {{clinic_name}}. Your {{service}} appointment is confirmed for {{appointment_time}} with {{provider}}. Reply STOP to opt out.";

export const DEFAULT_REMINDER_TEMPLATE =
  "Hi {{patient_name}}, a friendly reminder from {{clinic_name}}: your {{service}} appointment is tomorrow at {{appointment_time}} with {{provider}}. See you then!";

/** Replace {{tokens}} in a template with values; unknown tokens are left as-is. */
export function renderTemplate(
  template: string,
  vars: Record<string, string>
): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, key: string) =>
    key in vars ? vars[key] : `{{${key}}}`
  );
}

/** Sample values used for the live preview in Settings. */
export function sampleVars(clinicName: string): Record<string, string> {
  return {
    patient_name: "Maria Gonzalez",
    clinic_name: clinicName || "Riverside Studio",
    service: "consultation",
    appointment_time: "Tue, Jul 8 · 10:00 AM",
    provider: "Alex",
  };
}
