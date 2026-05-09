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
import { renderTemplateHtml, useRegenerateEnvelopePdf } from "@/hooks/useEsignTemplates";
import { SmartFillDropzone } from "@/components/e-signature/SmartFillDropzone";
import { TemplateChromeStudio } from "@/components/e-signature/TemplateChromeStudio";
import { useOwnerSignatureAssets } from "@/hooks/useOwnerSignatureAssets";

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
    return renderTemplateHtml(envelope.template_key, { ...vals, doc_number: vals.doc_number || docNumber });
  }, [envelope?.template_key, envelope?.template_field_values, editing, editValues, docNumber]);

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

  const handleDownload = (url: string, filename: string) => {
    try {
      window.open(maybeProxyStorageUrl(url, filename), "_blank");
    } catch {
      toast.error("Failed to download document");
    }
  };

  const handlePrint = () => {
    if (!previewHtml) {
      // Fall back to printing the stored PDF
      if (envelope?.document_url) window.open(envelope.document_url, "_blank");
      return;
    }
    const w = window.open("", "_blank", "width=900,height=1100");
    if (!w) { toast.error("Pop-ups blocked"); return; }
    w.document.write(`<!doctype html><html><head><title>${envelope?.name || "Document"}</title></head><body style="margin:0;background:#fff;">${previewHtml}<script>window.onload=()=>{setTimeout(()=>window.print(),300)}</script></body></html>`);
    w.document.close();
  };

  const buildSigningUrl = (token: string) => `${PUBLIC_DOMAIN}/sign/${token}`;

  const handleWhatsApp = (recipient: any) => {
    if (!recipient?.signing_token) { toast.error("No signing token"); return; }
    const url = buildSigningUrl(recipient.signing_token);
    const phoneDigits = String(recipient.phone || "").replace(/[^\d]/g, "");
    const text = encodeURIComponent(`Hi ${recipient.name}, please review and sign "${docNumber || envelope?.name}":\n${url}`);
    const wa = phoneDigits
      ? `https://wa.me/${phoneDigits}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(wa, "_blank");
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
      await regenerate.mutateAsync({
        envelopeId: envelope.id,
        templateKey: envelope.template_key,
        values: { ...editValues, doc_number: editValues.doc_number || docNumber },
      });
      toast.success("Document updated");
      setEditing(false);
      refetch();
      qc.invalidateQueries({ queryKey: ["esign_envelopes_hub"] });
    } catch (e: any) {
      toast.error(e.message || "Failed to update");
    }
  };

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
    ? `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:#fff;}</style></head><body>${previewHtml}</body></html>`
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
                {docNumber && (
                  <span className="text-[10px] tracking-[0.16em] text-[#1A1A1A]/70 uppercase border border-[#B89555]/50 rounded px-2 py-0.5 bg-[#F7F2EA]">
                    {docNumber}
                  </span>
                )}
                <h1 className="text-2xl font-bold text-[#1A1A1A] truncate">{envelope.name}</h1>
                <Badge className={`${config.color} flex items-center gap-1`}>{config.icon}{config.label}</Badge>
              </div>
              {envelope.description && <p className="text-[#1A1A1A]/70 mt-1 text-sm">{envelope.description}</p>}
            </div>
          </div>
        </div>

        {/* Action bar */}
        <Card className="bg-[#F7F2EA] border-[#B89555]/30">
          <CardContent className="p-3 flex items-center gap-2 flex-wrap">
            {isDraft && (
              <Button variant="gold" onClick={handleSend} disabled={sending}>
                {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Send for signature
              </Button>
            )}
            <Button variant="outline" onClick={() => envelope.document_url && window.open(envelope.document_url, "_blank")}>
              <ExternalLink className="w-4 h-4 mr-2" /> Open in new tab
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" /> Print
            </Button>
            <Button variant="outline" onClick={() => handleDownload(envelope.document_url, envelope.document_filename)}>
              <Download className="w-4 h-4 mr-2" /> Download PDF
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                navigate("/owner/email-client", {
                  state: {
                    prefillTo: clientRec?.email,
                    prefillSubject: `${docNumber || envelope.name}`,
                    prefillBody: `Please find attached "${docNumber || envelope.name}".\n\nSigning link: ${clientRec?.signing_token ? buildSigningUrl(clientRec.signing_token) : ""}`,
                    prefillAttachment: {
                      id: crypto.randomUUID(),
                      name: envelope.document_filename || `${docNumber || "document"}.pdf`,
                      type: "file" as const,
                      content: signedDoc?.document_url || envelope.document_url,
                      mimeType: "application/pdf",
                    },
                  },
                })
              }
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
                  style={{ height: "1100px", border: 0 }}
                />
              ) : envelope.document_url ? (
                <iframe
                  title="Document PDF"
                  src={envelope.document_url}
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
              {PAA_FIELD_GROUPS.filter(g => g.title !== "Signatures").map((group) => (
                <div key={group.title}>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/70 mb-2">{group.title}</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {group.fields.map((f) => {
                      const val = editValues[f.key] ?? "";
                      const onChange = (v: string) => setEditValues((prev) => ({ ...prev, [f.key]: v }));
                      if (f.type === "select" && f.options) {
                        return (
                          <div key={f.key}>
                            <Label className="text-xs">{f.label}</Label>
                            <select value={val} onChange={(e) => onChange(e.target.value)} className="w-full h-9 px-2 rounded border border-[#B89555]/40 bg-white text-sm text-[#1A1A1A]">
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
                            <Textarea value={val} onChange={(e) => onChange(e.target.value)} rows={2} />
                          </div>
                        );
                      }
                      return (
                        <div key={f.key}>
                          <Label className="text-xs">{f.label}</Label>
                          <Input type={f.type === "date" ? "date" : f.type === "number" ? "number" : "text"} value={val} onChange={(e) => onChange(e.target.value)} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
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
    </div>
  );
}
