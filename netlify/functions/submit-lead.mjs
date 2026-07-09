/**
 * Netlify Function: submit-lead
 * ---------------------------------------------------------------------------
 * Captures "book a demo" / contact form submissions into the Supabase `leads`
 * table so you have a real lead pipeline (viewable in Supabase) instead of a
 * mailto. Degrades gracefully: if Supabase or the table isn't set up yet, it
 * logs the lead and still returns success so the visitor isn't blocked.
 *
 * Request: POST { name, email, practice?, phone?, message?, vertical? }
 */
import { hasSupabase, sbInsert } from "../shared/supabase.mjs";

export default async (req) => {
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  const allowed = process.env.ALLOWED_ORIGIN;
  const origin = req.headers.get("origin") || "";
  if (allowed && origin && origin !== allowed) {
    return json({ ok: false, error: "forbidden_origin" }, 403);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  const name = (body?.name ?? "").toString().trim().slice(0, 200);
  const email = (body?.email ?? "").toString().trim().slice(0, 200);
  const practice = (body?.practice ?? "").toString().trim().slice(0, 200);
  const phone = (body?.phone ?? "").toString().trim().slice(0, 40);
  const message = (body?.message ?? "").toString().trim().slice(0, 2000);
  const vertical = (body?.vertical ?? "").toString().trim().slice(0, 40);

  if (!email && !phone) {
    return json({ ok: false, error: "email_or_phone_required" }, 400);
  }

  const lead = { name, email, practice, phone, message, vertical };

  if (hasSupabase()) {
    try {
      await sbInsert("leads", lead);
      return json({ ok: true, saved: true });
    } catch (err) {
      // Table may not exist yet — don't lose the lead or block the visitor.
      console.error("[submit-lead] insert failed (is the leads table created?):", err);
      console.log("[submit-lead] LEAD:", JSON.stringify(lead));
      return json({ ok: true, saved: false });
    }
  }

  console.log("[submit-lead] LEAD (no Supabase configured):", JSON.stringify(lead));
  return json({ ok: true, saved: false });
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
