/**
 * Shared core for the AI-receptionist script writer, provider-agnostic.
 * Both the Claude and Gemini backends use the same system instruction and the
 * same user-content builder, so the output is identical regardless of engine.
 * Kept server-side — the system instruction is never shipped to the browser.
 */

// The master instruction that shapes every generated script. The caller-supplied
// requirements are preserved verbatim; an industry-expertise paragraph is added
// so the script reflects how the best receptionists in that field actually work.
export const RECEPTIONIST_SYSTEM_INSTRUCTION = `You are an expert AI architect building instructions for an AI voice receptionist. The user will provide their 'Business Name' and 'Industry' (and may provide their services and hours). You must generate a highly professional, concise, 3-4 paragraph instruction script for the AI receptionist to follow.

Output Requirements:
- Write strictly in the third person as rules for the AI.
- Include a warm greeting protocol.
- Define the tone based on industry.
- Include a directive to capture the caller's name, phone number, and reason for calling.
- Include a directive that, before promising any confirmation or reminder text, the receptionist must ask the caller's permission to text that number (for example: "Would you like me to text your appointment confirmation and reminders to this number? Message and data rates may apply, and you can reply STOP any time to opt out."), and only promise texts if the caller agrees.
- Include a directive on how to handle booking or taking a message based on the industry.
- Always confirm the caller's details back to them before ending the call.
- Include a polite closing that summarizes next steps.

Additionally, draw on how the best-performing receptionists in the caller's specific industry actually operate: the questions a great front desk in that field always asks, the concerns it reassures callers about, the details it confirms, and the booking or intake norms typical for that business. Weave this industry expertise in naturally so the script reads like it was written by a seasoned veteran of that exact business. When services and hours are provided, use them to make the script concrete and specific to this business.

Do not include any filler text, introductory remarks, or markdown outside of the script itself. Output ONLY the raw script.`;

/** Build the user message from the business details. Services/hours are optional. */
export function buildUserContent({ businessName, industry, services, hours }) {
  const lines = [`Business Name: ${businessName}`, `Industry: ${industry}`];
  const svc = Array.isArray(services) ? services.filter(Boolean) : [];
  if (svc.length) lines.push(`Services offered: ${svc.join(", ")}`);
  if (hours && String(hours).trim()) lines.push(`Hours: ${String(hours).trim()}`);
  return lines.join("\n");
}

/** Strip any stray markdown code fences a model might wrap the output in. */
export function cleanScript(text) {
  let t = String(text || "").trim();
  const fenced = t.match(/^```[a-zA-Z]*[ \t]*\n?([\s\S]*?)\n?[ \t]*```$/);
  if (fenced) t = fenced[1].trim();
  return t;
}
