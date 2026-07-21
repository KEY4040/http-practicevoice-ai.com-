import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * A row from the `clinics` table (the fields the app reads). One clinic belongs
 * to one signed-in owner; RLS guarantees a user only ever sees their own.
 */
export interface ClinicRow {
  id: string;
  owner_id: string;
  name: string;
  phone: string | null;
  services: string[] | null;
  open_days: string[] | null;
  open_time: string | null;
  close_time: string | null;
  voice: string | null;
  retell_number: string | null;
  retell_agent_id: string | null;
  retell_llm_id: string | null;
  about: string | null;
  calendar_connected: boolean | null;
  usage_minutes: number | null;
  usage_suspended: boolean | null;
  vip_enabled: boolean | null;
  vip_transfer_to: string | null;
  vip_numbers: string[] | null;
  cal_api_key: string | null;
  cal_event_type_id: number | null;
  cal_timezone: string | null;
  calendar_provider: string | null;
}

// Select all columns rather than naming the newer ones — this keeps the app
// working even if the database predates the retell_number/retell_agent_id
// columns (PostgREST errors on a named column that doesn't exist, but "*" is
// safe). Re-running supabase/schema.sql adds those columns when convenient.
const CLINIC_COLUMNS = "*";

/**
 * Fetch the signed-in owner's clinic, creating one on first use so the rest of
 * the app always has a clinic id to hang calls and appointments off of.
 *
 * Safe under RLS: every query is implicitly scoped to `owner_id = auth.uid()`,
 * so a user can only ever read or create their own clinic.
 */
export async function getOrCreateClinic(
  supabase: SupabaseClient,
  defaults?: { name?: string; phone?: string }
): Promise<ClinicRow | null> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) return null;

  const existing = await supabase
    .from("clinics")
    .select(CLINIC_COLUMNS)
    .eq("owner_id", uid)
    .limit(1)
    .maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return existing.data as ClinicRow;

  const created = await supabase
    .from("clinics")
    .insert({
      owner_id: uid,
      name: defaults?.name?.trim() || "My Practice",
      phone: defaults?.phone?.trim() || null,
    })
    .select(CLINIC_COLUMNS)
    .single();

  if (created.error) {
    // A second tab may have created it in the meantime — re-read before failing.
    const retry = await supabase
      .from("clinics")
      .select(CLINIC_COLUMNS)
      .eq("owner_id", uid)
      .limit(1)
      .maybeSingle();
    if (retry.data) return retry.data as ClinicRow;
    throw created.error;
  }
  return created.data as ClinicRow;
}

/**
 * Update the owner's clinic profile (used when Settings is saved). Persists the
 * fields the AI receptionist reads — name, phone, services, hours, voice, and
 * the free-text "about" — so provisioning and the webhook use real values.
 */
export async function updateClinicProfile(
  supabase: SupabaseClient,
  patch: {
    name?: string;
    phone?: string;
    about?: string;
    services?: string[];
    openDays?: string[];
    openTime?: string;
    closeTime?: string;
    voice?: string;
  }
): Promise<void> {
  const clinic = await getOrCreateClinic(supabase, { name: patch.name, phone: patch.phone });
  if (!clinic) return;
  const fields: Record<string, unknown> = {};
  if (patch.name?.trim()) fields.name = patch.name.trim();
  if (patch.phone != null) fields.phone = patch.phone.trim();
  if (patch.about != null) fields.about = patch.about.trim();
  if (patch.services) fields.services = patch.services;
  if (patch.openDays) fields.open_days = patch.openDays;
  if (patch.openTime) fields.open_time = patch.openTime;
  if (patch.closeTime) fields.close_time = patch.closeTime;
  if (patch.voice) fields.voice = patch.voice;
  if (Object.keys(fields).length === 0) return;
  await supabase.from("clinics").update(fields).eq("id", clinic.id);
}

/**
 * Save the owner's VIP Passthrough settings: the on/off switch, the cell number
 * VIP calls transfer to, and the allow-list of numbers that ring straight
 * through. Numbers are stored as the owner typed them (nice for display);
 * matching at call time normalizes both sides to the last 10 digits.
 */
export async function updateVipSettings(
  supabase: SupabaseClient,
  patch: { enabled?: boolean; transferTo?: string; numbers?: string[] }
): Promise<void> {
  const clinic = await getOrCreateClinic(supabase);
  if (!clinic) return;
  const fields: Record<string, unknown> = {};
  if (patch.enabled != null) fields.vip_enabled = patch.enabled;
  if (patch.transferTo != null) fields.vip_transfer_to = patch.transferTo.trim() || null;
  if (patch.numbers) fields.vip_numbers = patch.numbers.map((n) => n.trim()).filter(Boolean);
  if (Object.keys(fields).length === 0) return;
  await supabase.from("clinics").update(fields).eq("id", clinic.id);
}

/**
 * Save the owner's Cal.com calendar connection: their API key, the event-type
 * ID the AI books, and the timezone (matched to their Cal.com to avoid the
 * off-by-hours bug). This is what makes the AI book into THEIR real calendar.
 * Provisioning reads these to attach the booking tools to their agent.
 */
export async function updateCalendarSettings(
  supabase: SupabaseClient,
  patch: { apiKey?: string; eventTypeId?: number | null; timezone?: string }
): Promise<void> {
  const clinic = await getOrCreateClinic(supabase);
  if (!clinic) return;
  const fields: Record<string, unknown> = {};
  if (patch.apiKey != null) {
    const key = patch.apiKey.trim();
    fields.cal_api_key = key || null;
    // Mark connected only when a key is present; clearing it disconnects.
    fields.calendar_provider = key ? "cal.com" : null;
  }
  if (patch.eventTypeId !== undefined) {
    fields.cal_event_type_id = Number.isFinite(patch.eventTypeId) ? patch.eventTypeId : null;
  }
  if (patch.timezone != null) fields.cal_timezone = patch.timezone.trim() || null;
  if (Object.keys(fields).length === 0) return;
  await supabase.from("clinics").update(fields).eq("id", clinic.id);
}
