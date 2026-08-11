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

// Neutral, industry-agnostic tokens. The old {{patient_name}} token still resolves
// at send time (the server supplies both keys), so a customer who saved a template
// before this rename keeps working — but new templates and the chips use the
// clearer {{customer_name}}.
export const SMS_VARIABLES: SmsVariable[] = [
  { token: "{{customer_name}}", label: "Customer's name", example: "the customer's first name" },
  { token: "{{clinic_name}}", label: "Your business name", example: "your business name" },
  { token: "{{service}}", label: "Service booked", example: "the service they booked" },
  { token: "{{appointment_time}}", label: "Date & time", example: "the appointment date & time" },
  { token: "{{provider}}", label: "Staff member", example: "the staff member" },
];

export const DEFAULT_CONFIRMATION_TEMPLATE =
  "Hi {{customer_name}}, this is {{clinic_name}}. Your {{service}} appointment is confirmed for {{appointment_time}} with {{provider}}. Reply STOP to opt out.";

export const DEFAULT_REMINDER_TEMPLATE =
  "Hi {{customer_name}}, a friendly reminder from {{clinic_name}}: your {{service}} appointment is tomorrow at {{appointment_time}} with {{provider}}. See you then!";

/** Replace {{tokens}} in a template with values; unknown tokens are left as-is. */
export function renderTemplate(
  template: string,
  vars: Record<string, string>
): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, key: string) =>
    key in vars ? vars[key] : `{{${key}}}`
  );
}

/**
 * Sample values for the live preview in Settings. Uses clear bracket
 * placeholders (not fake people) for the parts that fill in per customer, and
 * the owner's real business name where we have it. Supplies both customer_name
 * and patient_name so a preview of an old {{patient_name}} template still renders.
 */
export function sampleVars(clinicName: string): Record<string, string> {
  const name = "[customer's name]";
  return {
    customer_name: name,
    patient_name: name,
    clinic_name: clinicName || "[your business]",
    service: "[service]",
    appointment_time: "Fri, 2:00 PM",
    provider: "[staff]",
  };
}
