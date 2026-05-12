import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, Download, Bell, Clock, CheckCircle2, XCircle, Eye, Send, FileSignature, FileText,
  User, Mail, Phone, Calendar, Globe, Shield, Loader2, Link as LinkIcon, Printer,
  ExternalLink, MessageCircle, Edit3, Save, X, Plus,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { maybeProxyStorageUrl } from "@/utils/downloadProxy";
import { SUPABASE_URL, PUBLIC_DOMAIN } from "@/config/backend";
import { PAA_FIELD_GROUPS, PAA_LAYOUT_VERSION, type TemplateChrome } from "@/templates/jbjPropertyAdvertisingAgreement";
import { renderTemplateHtml, renderHtmlToPdfBlob, useRegenerateEnvelopePdf } from "@/hooks/useEsignTemplates";
import { SmartFillDropzone } from "@/components/e-signature/SmartFillDropzone";
import { TemplateChromeStudio } from "@/components/e-signature/TemplateChromeStudio";
import { useOwnerSignatureAssets } from "@/hooks/useOwnerSignatureAssets";
import { SendForSignatureDialog } from "@/components/e-signature/SendForSignatureDialog";
import { SendViaEmailDialog } from "@/components/e-signature/SendViaEmailDialog";
import ExportEnvelopeDialog from "@/components/e-signature/ExportEnvelopeDialog";
import { isReadyDraft, computeDisplayStatus, pickClientName, pickPropertyContext, maskPhone, maskEmail } from "@/pages/e-signature/envelopeStatus";
import { openWhatsApp, openEmail } from "@/utils/contactActions";

type EnvelopeStatus = 'draft' | 'sent' | 'viewed' | 'partially_signed' | 'completed' | 'declined' | 'expired' | 'voided';
type RecipientStatus = 'pending' | 'sent' | 'delivered' | 'viewed' | 'signed' | 'declined';

const statusConfig: Record<EnvelopeStatus, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: "Draft", color: "bg-[#F7F2EA] text-[#1A1A1A]/80 border border-[#B89555]/40", icon: <FileSignature className="w-4 h-4" /> },
  sent: { label: "Sent", color: "bg-blue-50 text-blue-700 border border-blue-200", icon: <Send className="w-4 h-4" /> },
  viewed: { label: "Viewed", color: "bg-amber-50 text-amber-700 border border-amber-200", icon: <Eye className="w-4 h-4" /> },
  partially_signed: { label: "Partially Signed", color: "bg-orange-50 text-orange-700 border border-orange-200", icon: <Clock className="w-4 h-4" /> },
  completed: { label: "Completed", color: "bg-emerald-50 text-emerald-700 border border-emerald-200", icon: <CheckCircle2 className="w-4 h-4" /> },
  declined: { label: "Declined", color: "bg-red-50 text-red-700 border border-red-200", icon: <XCircle className="w-4 h-4" /> },
  expired: { label: "Expired", color: "bg-[#F7F2EA] text-[#1A1A1A]/70 border border-[#B89555]/30", icon: <Clock className="w-4 h-4" /> },
  voided: { label: "Voided", color: "bg-[#F7F2EA] text-[#1A1A1A]/70 border border-[#B89555]/30", icon: <XCircle className="w-4 h-4" /> },
};

const recipientStatusConfig: Record<RecipientStatus, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-[#F7F2EA] text-[#1A1A1A]/80 border border-[#B89555]/30" },
  sent: { label: "Sent", color: "bg-blue-50 text-blue-700 border border-blue-200" },
  delivered: { label: "Delivered", color: "bg-blue-50 text-blue-700 border border-blue-200" },
  viewed: { label: "Viewed", color: "bg-amber-50 text-amber-700 border border-amber-200" },
  signed: { label: "Signed", color: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  declined: { label: "Declined", color: "bg-red-50 text-red-700 border border-red-200" },
};

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

export default function EnvelopeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [remindingId, setRemindingId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [ccs, setCcs] = useState<string[]>([]);
  const [ccInput, setCcInput] = useState("");
  const [bulkCcs, setBulkCcs] = useState("");
  const [chrome, setChrome] = useState<TemplateChrome>({});
  const [showStudio, setShowStudio] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [hiddenFields, setHiddenFields] = useState<string[]>([]);
  // Tracks fields that were just restored (un-hidden) so we can highlight them
  // in the editor and the live preview until the user dismisses or re-saves.
  const [recentlyRestoredFields, setRecentlyRestoredFields] = useState<string[]>([]);
  const regenerate = useRegenerateEnvelopePdf();
  const { data: sigAssets } = useOwnerSignatureAssets("signature");
  const { data: stampAssets } = useOwnerSignatureAssets("stamp");
  const ownerSignatureUrl = sigAssets?.find((a) => a.is_default)?.image_url || sigAssets?.[0]?.image_url || null;
  const ownerStampUrl = stampAssets?.find((a) => a.is_default)?.image_url || stampAssets?.[0]?.image_url || null;

  const { data: envelope, isLoading, refetch } = useQuery({
    queryKey: ["esign-envelope", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("esign_envelopes")
        .select(`*, esign_recipients (*), esign_audit_log (*), esign_signed_documents (*)`)
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Hydrate edit + CC + chrome state when envelope loads
  useEffect(() => {
    if (envelope) {
      setEditValues({ ...((envelope.template_field_values as any) || {}) });
      const meta = (envelope.metadata as any) || {};
      const persisted = (meta.cc_emails || []) as string[];
      setCcs(Array.isArray(persisted) ? persisted : []);
      setChrome((meta.chrome as TemplateChrome) || {});
      setHiddenFields(Array.isArray(meta.hidden_fields) ? meta.hidden_fields : []);
    }
  }, [envelope?.id]);

  // Auto re-render PDF if stored layout_version is older than the current template version
  useEffect(() => {
    if (!envelope || !envelope.template_key || envelope.template_key !== "jbj-property-advertising-agreement") return;
    const meta = (envelope.metadata as any) || {};
    const stored = Number(meta.layout_version || 0);
    if (stored < PAA_LAYOUT_VERSION && envelope.status === "draft" && !regenerate.isPending) {
      regenerate.mutateAsync({
        envelopeId: envelope.id,
        templateKey: envelope.template_key,
        values: { ...((envelope.template_field_values as any) || {}), doc_number: meta.doc_number || "" },
        chrome: meta.chrome as TemplateChrome | undefined,
        ownerSignatureUrl,
        ownerStampUrl,
      }).then(() => refetch()).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [envelope?.id, ownerSignatureUrl, ownerStampUrl]);

  // Realtime: refresh on recipient/envelope changes
  useEffect(() => {
    if (!id) return;
    const ch = supabase
      .channel(`envelope-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "esign_recipients", filter: `envelope_id=eq.${id}` }, () => {
        refetch();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "esign_envelopes", filter: `id=eq.${id}` }, (payload: any) => {
        const newStatus = payload.new?.status;
        const oldStatus = payload.old?.status;
        if (newStatus && newStatus !== oldStatus) {
          toast.info(`Status: ${oldStatus || "?"} → ${newStatus}`);
        }
        refetch();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "esign_audit_log", filter: `envelope_id=eq.${id}` }, () => {
        refetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, refetch]);

  const docNumber: string = useMemo(() => {
    const m = (envelope?.metadata as any) || {};
    return m.doc_number || (envelope?.template_field_values as any)?.doc_number || "";
  }, [envelope]);

  const previewHtml = useMemo(() => {
    if (!envelope?.template_key) return null;
    const vals = editing ? editValues : ((envelope.template_field_values as any) || {});
    // Only render the captured signature pad image when the recipient has truly
    // signed. NEVER autofill the printed name or date — the document must show
    // exactly what the signer typed/drew, nothing more. (Test envelopes that
    // were never really signed should look unsigned.)
    const signedClient = !editing
      ? ((envelope.esign_recipients || []).find((r: any) => r.metadata?.role === "client" && r.status === "signed")
        || (envelope.esign_recipients || []).find((r: any) => r.status === "signed"))
      : null;
    return renderTemplateHtml(
      envelope.template_key,
      { ...vals, doc_number: vals.doc_number || docNumber },
      { chrome, ownerSignatureUrl, ownerStampUrl, clientSignatureUrl: signedClient?.signature_data || null, hiddenFields, renderMode: editing ? "edit" : "final" },
    );
  }, [envelope?.template_key, envelope?.template_field_values, envelope?.esign_recipients, editing, editValues, docNumber, chrome, ownerSignatureUrl, ownerStampUrl, hiddenFields]);

  const sendReminder = async (recipientId?: string) => {
    const key = recipientId || "all";
    setRemindingId(key);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const response = await fetch(`${SUPABASE_URL}/functions/v1/esign-send-reminder`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ envelope_id: id, recipient_id: recipientId }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || result.message || "Failed to send reminder");
      toast.success(recipientId ? "Reminder sent" : result.message || "Reminder sent");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to send reminder");
    } finally {
      setRemindingId(null);
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    if (!url) { toast.error("No file available"); return; }
    try {
      // Private storage objects need an Authorization header. Fetch via the
      // download-file proxy with the user's session token, then save the blob.
      const proxied = maybeProxyStorageUrl(url, { filename, disposition: "attachment" });
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;
      const res = await fetch(proxied, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      if (!res.ok) {
        // Fall back to opening directly (works for public URLs)
        if (res.status === 401 || res.status === 403) {
          toast.error("Please sign in again to download this file");
        } else {
          throw new Error(`Download failed (${res.status})`);
        }
        return;
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename || "document.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (e: any) {
      console.error("Download failed:", e);
      toast.error(e?.message || "Failed to download document");
    }
  };

  const handlePrint = () => {
    if (!previewHtml) {
      // Fall back to printing the stored PDF
      if (envelope?.document_url) window.open(envelope.document_url, "_blank");
      return;
    }
    const printTitle = docNumber ? String(docNumber) : "JBJ Document";
    // @page rules + print-color-adjust suppress browser-injected URL/date/time chrome.
    const printStyles = `
      <style>
        @page { size: A4; margin: 16mm 14mm 18mm 14mm; }
        @media print {
          html, body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
            background: #ffffff !important;
          }
          .no-print, header, nav, footer.app-footer { display: none !important; }
        }
        html, body { margin: 0; padding: 0; background: #ffffff; font-family: Inter, Arial, sans-serif; color: #1A1A1A; }
        body > .doc-shell { padding: 0; }
      </style>
    `;
    // Render via Blob URL — this gives the new tab a real URL (no "about:blank"
    // address-bar text) and a clean document title for the browser print chrome.
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${printTitle}</title><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,500&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">${printStyles}</head><body><div class="doc-shell">${previewHtml}</div><script>window.onload=function(){setTimeout(function(){window.print()},400)}<\/script></body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, "_blank");
    if (!w) { URL.revokeObjectURL(url); toast.error("Pop-ups blocked"); return; }
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const buildSigningUrl = (token: string) => `${PUBLIC_DOMAIN}/sign/${token}`;

  // Generate a clean BLANK PDF on demand — same template as the signed copy
  // but with no captured signature, no printed name and no date. Use this to
  // download a clean copy you can hand-deliver or send via DocuSign for the
  // client to actually sign.
  const handleDownloadBlank = async () => {
    if (!envelope?.template_key) { toast.error("No template attached"); return; }
    try {
      const baseVals = (envelope.template_field_values as any) || {};
      const blankVals = {
        ...baseVals,
        doc_number: baseVals.doc_number || docNumber,
        landlord_signature_name: "",
        landlord_signature_date: "",
      };
      const html = renderTemplateHtml(envelope.template_key, blankVals, {
        chrome,
        ownerSignatureUrl: null,
        ownerStampUrl: null,
        clientSignatureUrl: null,
        hiddenFields,
        renderMode: "final",
      });
      const { blob } = await renderHtmlToPdfBlob(html);
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `JBJ-PAA-${docNumber || envelope.id.slice(0, 8)}-unsigned.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      toast.success("Blank PDF downloaded — ready to send to the client");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to generate blank PDF");
    }
  };

  const handleWhatsApp = (recipient: any) => {
    if (!recipient?.signing_token) { toast.error("No signing token"); return; }
    const url = buildSigningUrl(recipient.signing_token);
    const text = `Hi ${recipient.name}, please review and sign "${docNumber || envelope?.name}":\n${url}`;
    openWhatsApp(recipient.phone, text);
  };

  const handleQuickEmail = (recipient: any) => {
    if (!recipient?.email) { toast.error("No email on file"); return; }
    if (!recipient?.signing_token) { toast.error("No signing token"); return; }
    const url = buildSigningUrl(recipient.signing_token);
    const subject = `Please sign — ${docNumber || envelope?.name}`;
    const body = `Dear ${recipient.name},\n\nKindly review and digitally sign "${docNumber || envelope?.name}" via the secure link below:\n\n${url}\n\nThank you,\nJBJ Global Real Estate`;
    openEmail({ to: recipient.email, subject, body });
  };

  const handleSend = async () => {
    if (!envelope) return;
    const recipients = envelope.esign_recipients || [];
    const clientRec = recipients.find((r: any) => r.metadata?.role === "client") || recipients[0];
    if (!clientRec) {
      toast.error("Add a client recipient first");
      return;
    }
    setSending(true);
    try {
      // Persist CC list onto envelope before sending
      const cleanCcs = Array.from(new Set(ccs.filter(isValidEmail)));
      await supabase
        .from("esign_envelopes")
        .update({ metadata: { ...(envelope.metadata as any || {}), cc_emails: cleanCcs } })
        .eq("id", envelope.id);

      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/esign-send-for-signature`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          envelope_id: envelope.id,
          channels: ["email"],
          cc_emails: cleanCcs,
        }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error || "Failed to send");
      toast.success(`Sent to ${clientRec.name} · ${cleanCcs.length ? `CC ${cleanCcs.length}` : "no CC"}`);
      refetch();
    } catch (e: any) {
      toast.error(e.message || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  const handleSaveEdits = async () => {
    if (!envelope?.template_key) return;
    try {
      // If sent/completed, void existing recipient tokens and reset to draft
      if (envelope.status !== "draft") {
        const ok = window.confirm(
          "Editing will void the current signature request and reset to Draft. Continue?",
        );
        if (!ok) return;
        await supabase
          .from("esign_recipients")
          .update({ status: "pending", sent_at: null, signing_token: crypto.randomUUID() })
          .eq("envelope_id", envelope.id);
        await supabase
          .from("esign_envelopes")
          .update({ status: "draft" })
          .eq("id", envelope.id);
      }
      // Smart-clear conditional fields before persisting
      const cleaned = { ...editValues };
      if (/vacant/i.test(cleaned.status_vacant_tenanted || "")) cleaned.vacating_date = "";
      if (!/villa/i.test(cleaned.property_type || "")) cleaned.plot_sqft = "";
      if (!/until/i.test(cleaned.listing_period || "")) cleaned.listing_period_until_date = "";

      await regenerate.mutateAsync({
        envelopeId: envelope.id,
        templateKey: envelope.template_key,
        values: { ...cleaned, doc_number: cleaned.doc_number || docNumber },
        chrome,
        ownerSignatureUrl,
        ownerStampUrl,
        hiddenFields,
      });
      toast.success("Document updated");
      setEditing(false);
      refetch();
      qc.invalidateQueries({ queryKey: ["esign_envelopes_hub"] });
    } catch (e: any) {
      toast.error(e.message || "Failed to update");
    }
  };

  // Toggle a field's visibility in the rendered PDF and persist to metadata.
  const toggleHiddenField = async (key: string, hide = true) => {
    if (!envelope?.template_key) return;
    const next = hide
      ? Array.from(new Set([...hiddenFields, key]))
      : hiddenFields.filter((k) => k !== key);
    setHiddenFields(next);
    try {
      await regenerate.mutateAsync({
        envelopeId: envelope.id,
        templateKey: envelope.template_key,
        values: { ...((envelope.template_field_values as any) || {}), doc_number: docNumber },
        chrome,
        ownerSignatureUrl,
        ownerStampUrl,
        hiddenFields: next,
      });
      if (hide) {
        toast.success("Field removed", {
          action: { label: "Undo", onClick: () => toggleHiddenField(key, false) },
        });
      } else {
        toast.success("Field restored");
      }
      refetch();
    } catch (e: any) {
      toast.error(e?.message || "Failed to update");
    }
  };

  const restoreAllHiddenFields = async () => {
    if (!envelope?.template_key || !hiddenFields.length) return;
    setHiddenFields([]);
    try {
      await regenerate.mutateAsync({
        envelopeId: envelope.id,
        templateKey: envelope.template_key,
        values: { ...((envelope.template_field_values as any) || {}), doc_number: docNumber },
        chrome,
        ownerSignatureUrl,
        ownerStampUrl,
        hiddenFields: [],
      });
      toast.success("All removed fields restored");
      refetch();
    } catch (e: any) {
      toast.error(e?.message || "Failed to restore");
    }
  };

  // Listen for click-to-edit / click-to-delete / chip-set messages from the preview iframe.
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const data: any = e.data;
      if (!data || typeof data.type !== "string") return;
      if (data.type === "jbj-hide-field" && typeof data.key === "string") {
        toggleHiddenField(data.key, true);
      } else if (data.type === "jbj-edit-field" && typeof data.key === "string") {
        setEditing(true);
        // Defer focus to the next paint so the sidebar input is mounted.
        setTimeout(() => {
          const el = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
            `[data-edit-key="${CSS.escape(data.key)}"]`,
          );
          if (el) {
            el.focus();
            try { (el as HTMLInputElement).select?.(); } catch {}
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 50);
      } else if (data.type === "jbj-set-field" && typeof data.key === "string" && typeof data.value === "string") {
        setEditing(true);
        setEditValues((prev) => ({ ...prev, [data.key]: data.value }));
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [envelope?.id, hiddenFields, chrome, ownerSignatureUrl, ownerStampUrl, docNumber]);

  const addCc = (raw?: string) => {
    const v = (raw ?? ccInput).trim();
    if (!v) return;
    if (!isValidEmail(v)) { toast.error("Invalid email"); return; }
    setCcs((prev) => Array.from(new Set([...prev, v])));
    setCcInput("");
  };

  const handleBulkCcs = () => {
    const tokens = bulkCcs
      .split(/[\s,;]+/)
      .map((t) => t.trim())
      .filter(Boolean);
    const valid = tokens.filter(isValidEmail);
    const invalid = tokens.length - valid.length;
    setCcs((prev) => Array.from(new Set([...prev, ...valid])));
    setBulkCcs("");
    if (valid.length) toast.success(`Added ${valid.length} CC${invalid ? ` (${invalid} skipped)` : ""}`);
    else toast.error("No valid emails found");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      </div>
    );
  }

  if (!envelope) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] p-6">
        <div className="max-w-5xl mx-auto text-center py-12">
          <FileSignature className="w-16 h-16 text-[#B89555]/40 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-[#1A1A1A]">Envelope Not Found</h2>
          <Link to="/e-signature"><Button variant="gold">Back</Button></Link>
        </div>
      </div>
    );
  }

  const config = statusConfig[envelope.status as EnvelopeStatus];
  const signedDoc = envelope.esign_signed_documents?.[0];
  const auditLogs = (envelope.esign_audit_log || []).slice().sort(
    (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const clientRec = (envelope.esign_recipients || []).find((r: any) => r.metadata?.role === "client") || envelope.esign_recipients?.[0];
  const isDraft = envelope.status === "draft";
  const previewSrcDoc = previewHtml
    ? `<!doctype html><html><head><meta charset="utf-8"><style>
        html,body{margin:0;padding:0;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
        [data-field-key]{position:relative;cursor:text;transition:background .15s,outline .15s;border-radius:4px;}
        [data-field-key]:hover{background:#FBF6EC;outline:1px dashed #B89555;outline-offset:2px;}
        [data-chip-key]{cursor:pointer;border-radius:999px;transition:background .15s;}
        [data-chip-key]:hover{background:#FBF6EC;}
        .jbj-x{position:absolute;top:-9px;right:-9px;width:18px;height:18px;border-radius:999px;background:#FDFBF7;border:1px solid #B89555;color:#1A1A1A;font-size:11px;line-height:16px;text-align:center;cursor:pointer;display:none;font-family:Inter,Arial,sans-serif;font-weight:600;box-shadow:0 1px 2px rgba(0,0,0,.08);user-select:none;}
        [data-field-key]:hover > .jbj-x{display:block;}
      </style></head><body>${previewHtml}<script>(function(){
        var EDITABLE=${editing ? "true" : "false"};
        // Inject hover X buttons on each editable field block.
        document.querySelectorAll('[data-field-key]').forEach(function(el){
          if (!EDITABLE) return;
          if (el.querySelector(':scope > .jbj-x')) return;
          var x=document.createElement('span');
          x.className='jbj-x';x.textContent='×';x.title='Remove field';
          x.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();parent.postMessage({type:'jbj-hide-field',key:el.dataset.fieldKey},'*');});
          el.appendChild(x);
        });
        // Chip clicks set the field value in the parent editor.
        document.addEventListener('click',function(e){
          var t=e.target;
          while(t&&t!==document.body){
            if (t.dataset && t.dataset.chipKey){
              e.preventDefault();e.stopPropagation();
              if (!EDITABLE){ parent.postMessage({type:'jbj-edit-field',key:t.dataset.chipKey},'*'); return; }
              parent.postMessage({type:'jbj-set-field',key:t.dataset.chipKey,value:t.dataset.chipValue||''},'*');
              return;
            }
            if (t.dataset && t.dataset.fieldKey){
              e.preventDefault();e.stopPropagation();
              parent.postMessage({type:'jbj-edit-field',key:t.dataset.fieldKey},'*');
              return;
            }
            t=t.parentNode;
          }
        });
      })();<\/script></body></html>`
    : null;

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3 min-w-0">
            <Button variant="ghost" onClick={() => navigate("/e-signature")} className="h-10 w-10 p-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-[#1A1A1A] truncate">
                  {docNumber || envelope.name}
                </h1>
                <Badge className={`${config.color} flex items-center gap-1`}>
                  {config.icon}
                  {envelope.status === "draft" && isReadyDraft(envelope) ? "Ready" : config.label}
                </Badge>
              </div>
              <p className="text-[#1A1A1A]/70 mt-1 text-sm">
                {envelope.template_key === "jbj-property-advertising-agreement"
                  ? "Property Advertising Agreement — Leasing"
                  : envelope.name}
                {envelope.description ? ` · ${envelope.description}` : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Signed banner */}
        {envelope.status === "completed" && signedDoc && (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50/80 p-4 flex items-center gap-3 flex-wrap">
            <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-emerald-900">
                Signed — agreement fully executed
              </div>
              <div className="text-xs text-emerald-800/80">
                {clientRec?.signed_at ? `Signed by ${clientRec.name} on ${format(new Date(clientRec.signed_at), "MMM d, yyyy 'at' h:mm a")}` : "All recipients have signed"}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => handleDownload(signedDoc.document_url, signedDoc.document_filename)}>
                <Download className="w-3.5 h-3.5 mr-1.5" /> Signed PDF
              </Button>
              {signedDoc.certificate_url && (
                <Button size="sm" variant="outline" className="border-emerald-300 text-emerald-800"
                  onClick={() => handleDownload(signedDoc.certificate_url, `audit_${envelope.id}.pdf`)}>
                  <Shield className="w-3.5 h-3.5 mr-1.5" /> Audit cert
                </Button>
              )}
            </div>
          </div>
        )}
        <Card className="bg-[#F7F2EA] border-[#B89555]/30">
          <CardContent className="p-3 flex items-center gap-2 flex-wrap">
            {isDraft && (
              <Button variant="gold" onClick={() => setSendOpen(true)} disabled={sending}>
                <Send className="w-4 h-4 mr-2" />
                Send for signature
              </Button>
            )}
            <Button variant="outline" onClick={() => envelope.document_url && window.open(envelope.document_url, "_blank")}>
              <ExternalLink className="w-4 h-4 mr-2" /> Open in new tab
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" /> Print
            </Button>
            <Button variant="gold" onClick={() => handleDownload(envelope.document_url, envelope.document_filename)}>
              <Download className="w-4 h-4 mr-2" /> Download PDF
            </Button>
            <Button variant="outline" onClick={handleDownloadBlank} title="Download a clean unsigned copy of this agreement to send to the client">
              <FileText className="w-4 h-4 mr-2" /> Download blank PDF
            </Button>
            <Button variant="outline" onClick={() => setExportOpen(true)}>
              <Download className="w-4 h-4 mr-2" /> Export…
            </Button>
            <Button
              variant="outline"
              onClick={() => setEmailDialogOpen(true)}
              disabled={!clientRec?.email}
            >
              <Mail className="w-4 h-4 mr-2" /> Send via Email
            </Button>
            <Button variant="outline" onClick={() => handleWhatsApp(clientRec)} disabled={!clientRec}>
              <MessageCircle className="w-4 h-4 mr-2" /> Share via WhatsApp
            </Button>
            <div className="ml-auto flex items-center gap-2">
              {!editing ? (
                <Button variant="outline" onClick={() => setEditing(true)}>
                  <Edit3 className="w-4 h-4 mr-2" /> Edit fields
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => { setEditing(false); setEditValues({ ...((envelope.template_field_values as any) || {}) }); }}>
                    <X className="w-4 h-4 mr-2" /> Cancel
                  </Button>
                  <Button variant="gold" onClick={handleSaveEdits} disabled={regenerate.isPending}>
                    {regenerate.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save & re-render
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Document preview */}
          <Card className="lg:col-span-2 bg-white border-[#B89555]/30 overflow-hidden">
            <CardHeader className="bg-[#F7F2EA] border-b border-[#B89555]/30 py-3">
              <CardTitle className="text-sm flex items-center gap-2 text-[#1A1A1A]">
                <FileText className="w-4 h-4" /> {editing ? "Live preview (unsaved edits)" : "Document"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {previewSrcDoc ? (
                <iframe
                  title="Document preview"
                  srcDoc={previewSrcDoc}
                  className="w-full bg-white"
                  style={{ height: "min(1180px, calc(100vh - 200px))", border: 0 }}
                  onLoad={(e) => {
                    // Shrink iframe height to actual content so we don't get a
                    // huge empty area beneath the footer.
                    try {
                      const f = e.currentTarget as HTMLIFrameElement;
                      const doc = f.contentDocument;
                      if (!doc) return;
                      const h = Math.max(
                        doc.documentElement.scrollHeight,
                        doc.body.scrollHeight,
                      );
                      if (h > 200) f.style.height = `${h + 24}px`;
                    } catch {}
                  }}
                />
              ) : envelope.document_url ? (
                <iframe
                  title="Document PDF"
                  src={`${maybeProxyStorageUrl(signedDoc?.document_url || envelope.document_url, { disposition: "inline", filename: signedDoc?.document_filename || envelope.document_filename })}${(signedDoc?.document_url || envelope.document_url).includes("?") ? "&" : "?"}v=${encodeURIComponent(envelope.updated_at || envelope.created_at || "")}`}
                  className="w-full bg-white"
                  style={{ height: "1100px", border: 0 }}
                />
              ) : (
                <div className="p-12 text-center text-[#1A1A1A]/70">No document</div>
              )}
            </CardContent>
          </Card>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recipients + CCs */}
            <Card className="bg-[#F7F2EA] border-[#B89555]/30">
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2 text-[#1A1A1A]">
                  <User className="w-4 h-4" /> Recipients & CCs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(envelope.esign_recipients || []).map((recipient: any) => {
                  const rConfig = recipientStatusConfig[recipient.status as RecipientStatus];
                  const canRemind = ["pending", "sent", "delivered", "viewed"].includes(recipient.status)
                    && ["sent", "viewed", "partially_signed"].includes(envelope.status);
                  const isReminding = remindingId === recipient.id;
                  return (
                    <div key={recipient.id} className="rounded-lg bg-white border border-[#B89555]/20 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-medium text-[#1A1A1A] text-sm truncate">{recipient.name}</div>
                          <div className="text-xs text-[#1A1A1A]/70 truncate flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {recipient.email}
                          </div>
                          {recipient.phone && (
                            <div className="text-xs text-[#1A1A1A]/70 truncate flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {recipient.phone}
                            </div>
                          )}
                          {recipient.signed_at && (
                            <div className="text-xs text-emerald-700 mt-1">✓ Signed {format(new Date(recipient.signed_at), "MMM d, h:mm a")}</div>
                          )}
                        </div>
                        <Badge className={rConfig?.color}>{rConfig?.label}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {recipient.signing_token && (
                          <>
                            <Button size="sm" variant="outline" className="h-7 text-[11px]"
                              onClick={async () => {
                                const url = buildSigningUrl(recipient.signing_token);
                                try { await navigator.clipboard.writeText(url); toast.success("Signing link copied"); }
                                catch { window.prompt("Copy:", url); }
                              }}>
                              <LinkIcon className="w-3 h-3 mr-1" /> Copy link
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => handleWhatsApp(recipient)}>
                              <MessageCircle className="w-3 h-3 mr-1" /> WhatsApp
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => handleQuickEmail(recipient)} disabled={!recipient.email}>
                              <Mail className="w-3 h-3 mr-1" /> Email
                            </Button>
                          </>
                        )}
                        {canRemind && (
                          <Button size="sm" variant="outline" className="h-7 text-[11px]" disabled={remindingId !== null} onClick={() => sendReminder(recipient.id)}>
                            {isReminding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bell className="w-3 h-3 mr-1" />}
                            Remind
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* CC manager */}
                <div className="border-t border-[#B89555]/30 pt-3">
                  <Label className="text-[10px] uppercase tracking-[0.16em] text-[#1A1A1A]/70">CC on send</Label>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {ccs.map((e) => (
                      <span key={e} className="inline-flex items-center gap-1 text-[11px] bg-white border border-[#B89555]/30 rounded px-2 py-0.5 text-[#1A1A1A]">
                        {e}
                        <button type="button" onClick={() => setCcs((prev) => prev.filter((x) => x !== e))} aria-label={`Remove ${e}`}>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {!ccs.length && <span className="text-[11px] text-[#1A1A1A]/60">None</span>}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Input value={ccInput} onChange={(e) => setCcInput(e.target.value)} placeholder="cc@example.com"
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCc(); } }} className="h-8 text-xs" />
                    <Button size="sm" variant="outline" onClick={() => addCc()}><Plus className="w-3 h-3" /></Button>
                  </div>
                  <Button size="sm" variant="ghost" className="text-[11px] mt-1 h-7 px-2"
                    onClick={async () => {
                      const { data } = await supabase.auth.getUser();
                      if (data.user?.email) addCc(data.user.email);
                    }}>
                    + Add me as CC
                  </Button>
                  <Textarea value={bulkCcs} onChange={(e) => setBulkCcs(e.target.value)} placeholder="Bulk paste: emails separated by space, comma, semicolon or newline" className="mt-2 text-xs min-h-[60px]" />
                  <Button size="sm" variant="outline" className="mt-1 h-7 text-[11px]" onClick={handleBulkCcs} disabled={!bulkCcs.trim()}>Add bulk</Button>
                </div>
              </CardContent>
            </Card>

            {/* Signed doc */}
            {signedDoc && (
              <Card className="bg-[#F7F2EA] border-emerald-300/50">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-[#1A1A1A]">
                    <Shield className="w-4 h-4 text-emerald-600" /> Signed Document
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => handleDownload(signedDoc.document_url, signedDoc.document_filename)}>
                    <Download className="w-4 h-4 mr-2" /> Download Signed PDF
                  </Button>
                  <Button size="sm" variant="outline" className="w-full" onClick={() => setExportOpen(true)}>
                    <Download className="w-4 h-4 mr-2" /> Export…
                  </Button>
                  {signedDoc.certificate_url && (
                    <Button size="sm" variant="outline" className="w-full"
                      onClick={() => handleDownload(signedDoc.certificate_url, `audit_${envelope.id}.pdf`)}>
                      <Download className="w-4 h-4 mr-2" /> Audit Certificate
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Document Info */}
            <Card className="bg-[#F7F2EA] border-[#B89555]/30">
              <CardHeader className="py-3">
                <CardTitle className="text-sm text-[#1A1A1A]">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-[#1A1A1A]/80">
                {docNumber && <div className="flex justify-between"><span>Doc No.</span><span className="font-medium text-[#1A1A1A]">{docNumber}</span></div>}
                <div className="flex justify-between"><span>File</span><span className="font-medium text-[#1A1A1A] truncate max-w-[180px]">{envelope.document_filename}</span></div>
                <div className="flex justify-between"><span>Created</span><span>{format(new Date(envelope.created_at), "MMM d, yyyy")}</span></div>
                {envelope.expires_at && <div className="flex justify-between"><span>Expires</span><span>{formatDistanceToNow(new Date(envelope.expires_at), { addSuffix: true })}</span></div>}
                {envelope.completed_at && <div className="flex justify-between"><span>Completed</span><span>{format(new Date(envelope.completed_at), "MMM d, yyyy")}</span></div>}
                <div className="flex justify-between"><span>Reminders</span><span>{envelope.reminders_sent || 0}</span></div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Header & footer studio (always available) */}
        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowStudio((s) => !s)}>
            {showStudio ? "Hide" : "Customize"} header &amp; footer
          </Button>
          {showStudio && (
            <Button variant="gold" size="sm" onClick={handleSaveEdits} disabled={regenerate.isPending}>
              {regenerate.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
              Apply chrome &amp; re-render
            </Button>
          )}
        </div>
        {showStudio && <TemplateChromeStudio value={chrome} onChange={setChrome} />}

        {/* Edit Fields panel (full width below preview) */}
        {editing && envelope.template_key && (
          <Card className="bg-[#F7F2EA] border-[#B89555]/30">
            <CardHeader className="py-3">
              <CardTitle className="text-sm text-[#1A1A1A] flex items-center gap-2">
                <Edit3 className="w-4 h-4" /> Edit fields — changes preview live above
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SmartFillDropzone
                schemaHint="jbj_paa_leasing"
                onExtracted={(fields) => setEditValues((prev) => ({ ...prev, ...fields }))}
              />
              {hiddenFields.length > 0 && (
                <div className="flex items-center gap-2 p-2 rounded border border-[#B89555]/40 bg-[#FDFBF7]">
                  <span className="text-xs text-[#1A1A1A]/80">
                    {hiddenFields.length} removed field{hiddenFields.length === 1 ? "" : "s"}
                  </span>
                  <Button size="sm" variant="gold" className="ml-auto h-7 text-[11px]" onClick={restoreAllHiddenFields}>
                    Restore all
                  </Button>
                </div>
              )}
              {PAA_FIELD_GROUPS.filter(g => g.title !== "Signatures").map((group) => {
                // Per user request: keep every Property Finder field visible in edit mode
                // (don't drop conditional ones), so nothing is missing at signing time.
                const visible = group.fields;
                if (!visible.length) return null;
                return (
                  <div key={group.title}>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/70 mb-2">{group.title}</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {visible.map((f) => {
                        const val = editValues[f.key] ?? "";
                        const onChange = (v: string) => setEditValues((prev) => ({ ...prev, [f.key]: v }));
                        const conditionalHint = f.conditional && !f.conditional(editValues)
                          ? " (only printed when applicable)" : "";
                        if (f.type === "select" && f.options) {
                          return (
                            <div key={f.key}>
                              <Label className="text-xs">{f.label}{conditionalHint && <span className="text-[10px] text-[#1A1A1A]/50 ml-1">{conditionalHint}</span>}</Label>
                              <select data-edit-key={f.key} value={val} onChange={(e) => onChange(e.target.value)} className="w-full h-9 px-2 rounded border border-[#B89555]/40 bg-white text-sm text-[#1A1A1A]">
                                <option value="">—</option>
                                {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                              </select>
                            </div>
                          );
                        }
                        if (f.type === "textarea") {
                          return (
                            <div key={f.key} className="col-span-2 md:col-span-3">
                              <Label className="text-xs">{f.label}</Label>
                              <Textarea data-edit-key={f.key} value={val} onChange={(e) => onChange(e.target.value)} rows={2} />
                            </div>
                          );
                        }
                        if (f.type === "money") {
                          return (
                            <div key={f.key}>
                              <Label className="text-xs">{f.label}</Label>
                              <div className="relative">
                                <Input
                                  data-edit-key={f.key}
                                  inputMode="numeric"
                                  value={val}
                                  onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))}
                                  onBlur={(e) => {
                                    const n = Number(e.target.value.replace(/[^\d]/g, ""));
                                    onChange(isFinite(n) && n > 0 ? new Intl.NumberFormat("en-AE").format(n) : "");
                                  }}
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] tracking-[0.16em] text-[#1A1A1A]/60">AED</span>
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div key={f.key}>
                            <Label className="text-xs">{f.label}{conditionalHint && <span className="text-[10px] text-[#1A1A1A]/50 ml-1">{conditionalHint}</span>}</Label>
                            <Input data-edit-key={f.key} type={f.type === "date" ? "date" : f.type === "number" ? "number" : "text"} value={val} onChange={(e) => onChange(e.target.value)} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Activity log */}
        <Card className="bg-[#F7F2EA] border-[#B89555]/30">
          <CardHeader className="py-3">
            <CardTitle className="text-sm text-[#1A1A1A] flex items-center gap-2">
              <Shield className="w-4 h-4" /> Activity Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {auditLogs.map((log: any) => (
                <div key={log.id} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-white border border-[#B89555]/30 flex items-center justify-center shrink-0">
                    <Clock className="w-3.5 h-3.5 text-[#1A1A1A]/70" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#1A1A1A]">{log.description}</p>
                    <div className="flex items-center gap-3 text-xs text-[#1A1A1A]/60 mt-0.5">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(log.created_at), "MMM d, yyyy 'at' h:mm a")}</span>
                      {log.ip_address && <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{log.ip_address}</span>}
                    </div>
                  </div>
                </div>
              ))}
              {!auditLogs.length && <p className="text-sm text-[#1A1A1A]/60 text-center py-4">No activity yet</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <SendForSignatureDialog
        open={sendOpen}
        onOpenChange={setSendOpen}
        envelope={envelope}
        primaryRecipient={clientRec}
        onSent={() => refetch()}
      />

      <ExportEnvelopeDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        envelope={envelope}
        signedDoc={signedDoc}
        docNumber={docNumber}
        landlordName={(editValues.landlord_name as string) || ((envelope?.metadata as any)?.fields?.landlord_name as string) || null}
        signingLink={clientRec?.signing_token ? buildSigningUrl(clientRec.signing_token) : null}
        onShareWhatsApp={() => clientRec && handleWhatsApp(clientRec)}
        onShareEmail={() => clientRec && handleQuickEmail(clientRec)}
      />

      {clientRec && (
        <SendViaEmailDialog
          open={emailDialogOpen}
          onOpenChange={setEmailDialogOpen}
          envelopeId={envelope.id}
          recipientName={clientRec.name || "Client"}
          recipientEmail={clientRec.email || ""}
          defaultSubject={envelope.email_subject || `Please sign — ${envelope.name || "Document"}${docNumber ? ` · ${docNumber}` : ""}`}
          defaultBody={envelope.email_message || `Dear {{client_name}},\n\nKindly review and digitally sign your ${envelope.name || "document"} via the secure link below.\n\n{{signing_link}}\n\n{{sender_signature}}`}
          signingUrl={clientRec.signing_token ? buildSigningUrl(clientRec.signing_token) : undefined}
          attachmentName={envelope.document_filename || undefined}
          onSent={() => refetch()}
        />
      )}
    </div>
  );
}
