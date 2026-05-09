import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { buildPAAHtml, type BuildPAAOptions, PAA_LAYOUT_VERSION } from "@/templates/jbjPropertyAdvertisingAgreement";
import { buildSellingHtml } from "@/templates/jbjListingAuthorisation";

export interface EsignTemplate {
  id: string;
  key: string;
  name: string;
  category: "leasing" | "selling" | "other";
  html_body: string;
  field_schema: TemplateFieldSpec[];
  is_system: boolean;
  owner_user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TemplateFieldSpec {
  role: "owner" | "client";
  type: "signature" | "initials" | "date" | "text" | "stamp" | "checkbox";
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
}

export { PAA_LAYOUT_VERSION };

export function useEsignTemplates(category?: "leasing" | "selling" | "all") {
  return useQuery({
    queryKey: ["esign_templates", category ?? "all"],
    queryFn: async () => {
      let q = supabase.from("esign_templates" as any).select("*").order("name");
      if (category && category !== "all") q = q.eq("category", category);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as EsignTemplate[];
    },
  });
}

/** Renders template HTML for a given key + values, with optional chrome/signature assets (PAA only). */
export function renderTemplateHtml(
  templateKey: string,
  values: Record<string, string>,
  opts: BuildPAAOptions = {},
): string {
  if (templateKey === "jbj-listing-authorisation-selling") {
    return buildSellingHtml(values as any);
  }
  return buildPAAHtml(values as any, opts);
}

/** Renders an HTML string into a single-page A4 PDF blob (client-side). */
export async function renderHtmlToPdfBlob(html: string): Promise<{ blob: Blob; pdfWidth: number; pdfHeight: number }> {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "-10000px";
  container.style.left = "0";
  container.style.width = "794px";
  container.style.background = "#ffffff";
  container.innerHTML = html;
  document.body.appendChild(container);
  try {
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");
    const canvas = await html2canvas(container, { scale: 2, backgroundColor: "#ffffff" });
    const img = canvas.toDataURL("image/jpeg", 0.92);
    const pdfWidth = 595;
    const pdfHeight = (canvas.height / canvas.width) * pdfWidth;
    const pdf = new jsPDF({ unit: "pt", format: [pdfWidth, pdfHeight], orientation: "portrait" });
    pdf.addImage(img, "JPEG", 0, 0, pdfWidth, pdfHeight);
    return { blob: pdf.output("blob"), pdfWidth, pdfHeight };
  } finally {
    document.body.removeChild(container);
  }
}

/** Allocate the next branded document number for a template (e.g. JBJ-PAA-LEASING-0001). */
export async function allocateDocNumber(templateKey: string): Promise<string> {
  const { data, error } = await supabase.rpc("next_doc_number" as any, { _template_key: templateKey });
  if (error) {
    console.warn("next_doc_number RPC failed; falling back", error);
    return `JBJ-DOC-${Date.now().toString().slice(-6)}`;
  }
  return String(data || "");
}

export function useCreateEnvelopeFromTemplate() {
  return useMutation({
    mutationFn: async (input: {
      template: EsignTemplate;
      values?: Record<string, string>;
      client?: { name: string; email: string; phone?: string };
      clientLeadId?: string;
    }) => {
      const { template, values = {}, client, clientLeadId } = input;
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) throw new Error("Not signed in");

      // 1. Allocate document number first so it appears on the rendered PDF
      const docNumber = await allocateDocNumber(template.key);

      // 2. Merge client info into template values so the rendered PDF is pre-filled
      const mergedValues: Record<string, string> = {
        doc_number: docNumber,
        ...(client?.name ? { landlord_name: client.name } : {}),
        ...(client?.email ? { email_address: client.email } : {}),
        ...(client?.phone ? { mobile_number: client.phone } : {}),
        ...values,
      };

      // 3. Render HTML + PDF
      const html = renderTemplateHtml(template.key, mergedValues);
      const { blob, pdfWidth, pdfHeight } = await renderHtmlToPdfBlob(html);

      // 4. Upload PDF
      const filename = `${user.id}/${crypto.randomUUID()}.pdf`;
      const { error: upErr } = await supabase.storage
        .from("esign-documents")
        .upload(filename, blob, { contentType: "application/pdf", upsert: false });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("esign-documents").getPublicUrl(filename);

      // 5. Create envelope
      const { data: envelope, error: envErr } = await supabase
        .from("esign_envelopes")
        .insert({
          name: `${docNumber} — ${template.name}`,
          description: `Generated from template: ${template.name}`,
          document_url: urlData.publicUrl,
          document_filename: `${docNumber}.pdf`,
          document_size_bytes: blob.size,
          page_count: 1,
          sender_id: user.id,
          sender_email: user.email!,
          sender_name: (user.user_metadata as any)?.full_name || user.email,
          status: "draft",
          email_subject: `Please sign: ${docNumber} — ${template.name}`,
          category: template.category,
          template_key: template.key,
          template_html: html,
          template_field_values: mergedValues,
          client_lead_id: clientLeadId ?? null,
          metadata: { doc_number: docNumber, cc_emails: [] },
          expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();
      if (envErr) throw envErr;

      // 6. Recipients
      const recipientsToInsert: any[] = [
        {
          envelope_id: envelope.id,
          name: (user.user_metadata as any)?.full_name || user.email,
          email: user.email,
          signing_order: 2,
          metadata: { role: "owner" },
          token_expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
      if (client?.email) {
        recipientsToInsert.unshift({
          envelope_id: envelope.id,
          name: client.name,
          email: client.email,
          phone: client.phone || null,
          signing_order: 1,
          metadata: { role: "client" },
          token_expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
      const { data: createdRecipients, error: recErr } = await supabase
        .from("esign_recipients")
        .insert(recipientsToInsert)
        .select();
      if (recErr) {
        await supabase.from("esign_envelopes").delete().eq("id", envelope.id);
        throw recErr;
      }

      const ownerRec = createdRecipients.find((r: any) => r.metadata?.role === "owner") ?? createdRecipients[createdRecipients.length - 1];
      const clientRec = createdRecipients.find((r: any) => r.metadata?.role === "client");

      // 7. Fields
      const schema = Array.isArray(template.field_schema) ? template.field_schema : [];
      const fieldInserts = schema
        .map((f) => {
          const recipient = f.role === "client" ? clientRec : ownerRec;
          if (!recipient) return null;
          return {
            envelope_id: envelope.id,
            recipient_id: recipient.id,
            field_type: f.type as any,
            page_number: f.page,
            x_position: Math.round(f.x * pdfWidth),
            y_position: Math.round(f.y * pdfHeight),
            width: Math.round(f.w * pdfWidth),
            height: Math.round(f.h * pdfHeight),
          };
        })
        .filter(Boolean) as any[];

      if (fieldInserts.length) {
        const { error: fErr } = await supabase.from("esign_fields").insert(fieldInserts);
        if (fErr) {
          await supabase.from("esign_envelopes").delete().eq("id", envelope.id);
          throw fErr;
        }
      }

      return envelope;
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/** Re-render the envelope's PDF from current template_field_values and overwrite the storage object. */
export function useRegenerateEnvelopePdf() {
  return useMutation({
    mutationFn: async (input: {
      envelopeId: string;
      templateKey: string;
      values: Record<string, string>;
    }) => {
      const { envelopeId, templateKey, values } = input;
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) throw new Error("Not signed in");

      const html = renderTemplateHtml(templateKey, values);
      const { blob } = await renderHtmlToPdfBlob(html);

      const docNumber = values.doc_number || "JBJ-DOC";
      const filename = `${user.id}/${crypto.randomUUID()}.pdf`;
      const { error: upErr } = await supabase.storage
        .from("esign-documents")
        .upload(filename, blob, { contentType: "application/pdf", upsert: false });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("esign-documents").getPublicUrl(filename);

      const { data, error } = await supabase
        .from("esign_envelopes")
        .update({
          document_url: urlData.publicUrl,
          document_filename: `${docNumber}.pdf`,
          document_size_bytes: blob.size,
          template_html: html,
          template_field_values: values,
        })
        .eq("id", envelopeId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  });
}
