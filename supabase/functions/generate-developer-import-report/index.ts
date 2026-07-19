// Generate developer import before/after report.
// Produces (1) an Excel workbook with all classified rows + diffs, and
// (2) an A4 print-ready HTML report. Both uploaded to the private
// `owner-reports` bucket; signed URLs returned to the caller.
//
// Only owners/admins may call this function.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

const FIELDS: Array<[string, string]> = [
  ["name", "Name"],
  ["ceo_name", "Founder / CEO"],
  ["founded_year", "Founded"],
  ["website_url", "Website"],
  ["google_drive_url", "Google Drive"],
  ["admin_email", "Email"],
  ["office_phone", "Phone"],
  ["whatsapp", "WhatsApp"],
  ["instagram_url", "Instagram"],
  ["linkedin_url", "LinkedIn"],
  ["office_address", "Address"],
  ["headquarters", "Global presence"],
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "");
    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await userClient.auth.getUser(jwt);
    const user = userData?.user;
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: roleRows } = await admin.from("user_roles").select("role").eq("user_id", user.id);
    const roles = new Set((roleRows ?? []).map((r: any) => r.role));
    if (!roles.has("owner") && !roles.has("admin")) {
      return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Pull all review rows (latest batch)
    const { data: rows, error } = await admin
      .from("dev_excel_import_review")
      .select("row_number, developer_name, bucket, decision, matched_developer_id, before_data, after_data, changed_fields, reason")
      .order("bucket", { ascending: true })
      .order("row_number", { ascending: true })
      .limit(5000);
    if (error) throw error;
    const list = rows ?? [];

    // ---- Excel workbook ----
    const wb = XLSX.utils.book_new();
    const summary = [
      ["Developer Import — Before / After Report"],
      ["Generated", new Date().toISOString()],
      [],
      ["Bucket", "Count"],
      ...(["new", "enrich", "duplicate", "protected", "rejected"].map((b) => [b, list.filter((r: any) => r.bucket === b).length])),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), "Summary");

    const header = ["#", "Bucket", "Decision", "Developer", "Field", "Before", "After", "Changed"];
    for (const bucket of ["new", "enrich", "duplicate", "protected", "rejected"]) {
      const bucketRows = list.filter((r: any) => r.bucket === bucket);
      const aoa: any[][] = [header];
      for (const r of bucketRows) {
        const changed = new Set(r.changed_fields ?? []);
        for (const [key, label] of FIELDS) {
          const b = r.before_data?.[key] ?? "";
          const a = r.after_data?.[key] ?? "";
          if (bucket === "duplicate" || bucket === "protected" || bucket === "rejected") {
            if (label !== "Name") continue;
          }
          aoa.push([r.row_number, bucket, r.decision, r.developer_name, label, b, a, changed.has(key) ? "YES" : ""]);
        }
      }
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), bucket);
    }
    const xlsxBuf = XLSX.write(wb, { type: "array", bookType: "xlsx" });

    // ---- A4 HTML report ----
    const esc = (s: any) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    let html = `<!doctype html><html><head><meta charset="utf-8"><title>Developer Import Report</title>
<style>
@page { size: A4; margin: 15mm; }
body { font-family: Georgia, serif; color: #111; }
h1 { color: #064E3B; }
h2 { color: #064E3B; border-bottom: 1px solid #ccc; margin-top: 24px; }
table { border-collapse: collapse; width: 100%; font-size: 10px; }
th, td { border: 1px solid #ddd; padding: 4px 6px; vertical-align: top; text-align: left; }
th { background: #064E3B; color: #fff; }
.change { background: #ecfdf5; font-weight: 600; color: #064E3B; }
.badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; background:#eee; }
.card { page-break-inside: avoid; margin-bottom: 12px; border:1px solid #eee; padding: 8px; border-radius: 4px; }
.muted { color: #888; font-style: italic; }
</style></head><body>
<h1>Developer Import — Before / After</h1>
<p>Generated ${new Date().toUTCString()}</p>
<p>
${["new","enrich","duplicate","protected","rejected"].map(b => `<span class="badge">${b}: ${list.filter((r:any)=>r.bucket===b).length}</span>`).join(" ")}
</p>`;

    for (const bucket of ["new", "enrich"]) {
      const bucketRows = list.filter((r: any) => r.bucket === bucket);
      html += `<h2>${bucket === "new" ? "Newly created (drafts)" : "Enriched (existing profiles updated)"} — ${bucketRows.length}</h2>`;
      for (const r of bucketRows.slice(0, 400)) {
        const changed = new Set(r.changed_fields ?? []);
        html += `<div class="card"><strong>#${r.row_number} · ${esc(r.developer_name)}</strong> <span class="badge">${bucket}</span>
        <table><thead><tr><th>Field</th><th>Before</th><th>After</th></tr></thead><tbody>`;
        for (const [key, label] of FIELDS) {
          const b = r.before_data?.[key] ?? "";
          const a = r.after_data?.[key] ?? "";
          const cls = changed.has(key) ? "change" : "";
          html += `<tr><td>${esc(label)}</td><td>${b ? esc(b) : '<span class="muted">—</span>'}</td><td class="${cls}">${a ? esc(a) : '<span class="muted">—</span>'}</td></tr>`;
        }
        html += `</tbody></table></div>`;
      }
      if (bucketRows.length > 400) {
        html += `<p class="muted">First 400 of ${bucketRows.length} shown. Full detail is in the Excel export.</p>`;
      }
    }
    html += `</body></html>`;

    // Upload
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const xlsxPath = `import-reports/developer-import-${stamp}.xlsx`;
    const htmlPath = `import-reports/developer-import-${stamp}.html`;
    await admin.storage.from("owner-reports").upload(xlsxPath, new Uint8Array(xlsxBuf), {
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      upsert: true,
    });
    await admin.storage.from("owner-reports").upload(htmlPath, new TextEncoder().encode(html), {
      contentType: "text/html; charset=utf-8",
      upsert: true,
    });
    const { data: xlsxSigned } = await admin.storage.from("owner-reports").createSignedUrl(xlsxPath, 60 * 60);
    const { data: htmlSigned } = await admin.storage.from("owner-reports").createSignedUrl(htmlPath, 60 * 60);

    return new Response(JSON.stringify({ xlsx_url: xlsxSigned?.signedUrl, pdf_url: htmlSigned?.signedUrl, counts: {
      new: list.filter((r: any) => r.bucket === "new").length,
      enrich: list.filter((r: any) => r.bucket === "enrich").length,
      duplicate: list.filter((r: any) => r.bucket === "duplicate").length,
      protected: list.filter((r: any) => r.bucket === "protected").length,
      rejected: list.filter((r: any) => r.bucket === "rejected").length,
    } }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-developer-import-report failed", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
