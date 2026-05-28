// Owner-only: links a generated job-offer document to a candidate and creates
// a signable esign_envelopes row carrying metadata.candidate_id so the post-sign
// trigger (trg_candidate_on_envelope_signed) can auto-enroll the employee.
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), {
    status: s,
    headers: { ...cors, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: { user }, error: authErr } = await supabase.auth.getUser(
      auth.replace("Bearer ", ""),
    );
    if (authErr || !user) return json({ error: "Unauthorized" }, 401);

    const { data: isOwner } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "owner",
    });
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    const { data: isHr } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "hr_admin",
    });
    if (!isOwner && !isAdmin && !isHr) return json({ error: "Forbidden" }, 403);

    const {
      candidate_id,
      document_url,
      document_filename,
      page_count,
      email_subject,
      email_message,
      template_key,
    } = await req.json();

    if (!candidate_id) return json({ error: "candidate_id is required" }, 400);
    if (!document_url) return json({ error: "document_url is required" }, 400);

    const { data: candidate, error: cErr } = await supabase
      .from("hr_candidates")
      .select("*")
      .eq("id", candidate_id)
      .maybeSingle();
    if (cErr || !candidate) return json({ error: "Candidate not found" }, 404);

    // Create the envelope (draft → UI / esign-send-for-signature actually delivers).
    const { data: envelope, error: envErr } = await supabase
      .from("esign_envelopes")
      .insert({
        name: `Job Offer — ${candidate.candidate_name}`,
        category: "job_offer",
        template_key: template_key || "job_offer",
        document_url,
        document_filename: document_filename || "Job-Offer.pdf",
        page_count: page_count || 1,
        sender_id: user.id,
        sender_email: user.email,
        sender_name: (user.user_metadata as any)?.full_name || user.email,
        email_subject:
          email_subject ||
          `Your Job Offer from JBJ Global Real Estate — ${candidate.candidate_name}`,
        email_message:
          email_message ||
          "Please review and sign your formal job offer at your earliest convenience.",
        status: "draft",
        metadata: {
          candidate_id: candidate.id,
          candidate_email: candidate.email,
          candidate_phone: candidate.phone,
          department: candidate.department_category,
          source: "hr-send-offer-for-signature",
        },
      })
      .select("*")
      .single();
    if (envErr || !envelope) return json({ error: envErr?.message || "envelope create failed" }, 500);

    // Add the candidate as the single signing recipient
    const { error: recErr } = await supabase
      .from("esign_recipients")
      .insert({
        envelope_id: envelope.id,
        email: candidate.email,
        name: candidate.candidate_name,
        phone: candidate.phone,
        signing_order: 1,
        status: "pending",
      });
    if (recErr) console.warn("recipient insert warning", recErr);

    // Link envelope to the candidate + mark offer_sent
    await supabase
      .from("hr_candidates")
      .update({
        current_envelope_id: envelope.id,
        status: "offer_sent",
        updated_at: new Date().toISOString(),
      })
      .eq("id", candidate.id);

    await supabase
      .from("hr_job_applicants")
      .update({ status: "offer_sent", job_offer_sent_at: new Date().toISOString() })
      .eq("candidate_id", candidate.id);

    return json({
      ok: true,
      envelope_id: envelope.id,
      candidate_id: candidate.id,
      next: `/owner/esign/envelope/${envelope.id}`,
    });
  } catch (e) {
    console.error("hr-send-offer-for-signature error", e);
    return json({ error: (e as Error).message }, 500);
  }
});
