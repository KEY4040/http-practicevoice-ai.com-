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
  retell_number: string | null;
  retell_agent_id: string | null;
  calendar_connected: boolean | null;
}

const CLINIC_COLUMNS =
  "id, owner_id, name, phone, retell_number, retell_agent_id, calendar_connected";

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

/** Update the owner's clinic name/phone (used when Settings is saved). No-op if unset. */
export async function updateClinicProfile(
  supabase: SupabaseClient,
  patch: { name?: string; phone?: string }
): Promise<void> {
  const clinic = await getOrCreateClinic(supabase, { name: patch.name, phone: patch.phone });
  if (!clinic) return;
  const fields: Record<string, string> = {};
  if (patch.name?.trim()) fields.name = patch.name.trim();
  if (patch.phone != null) fields.phone = patch.phone.trim();
  if (Object.keys(fields).length === 0) return;
  await supabase.from("clinics").update(fields).eq("id", clinic.id);
}
