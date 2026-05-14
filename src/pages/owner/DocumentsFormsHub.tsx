import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEsignTemplates, useCreateEnvelopeFromTemplate, type EsignTemplate } from "@/hooks/useEsignTemplates";
import { PAA_FIELD_GROUPS } from "@/templates/jbjPropertyAdvertisingAgreement";
import { useOwnerSignatureAssets } from "@/hooks/useOwnerSignatureAssets";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FileText, Send, CheckCircle2, Clock, PenTool, Stamp, FileSignature, Plus, Loader2, ExternalLink, Upload, Scale, Trash2, RotateCcw, FileEdit, Sparkles, Crown } from "lucide-react";
import { toast } from "sonner";
import { SmartFillDropzone } from "@/components/e-signature/SmartFillDropzone";

type Cat = "all" | "leasing" | "selling";
type Bucket = "templates" | "documents" | "esign" | "drafts" | "generated" | "sent" | "submitted" | "signed" | "deleted" | "assets";
interface DocumentsFormsHubProps { initialTabOverride?: Bucket; }

/** Single query for the entire hub — much faster than four parallel queries. */
function useAllEnvelopes() {
  return useQuery({
    queryKey: ["esign_envelopes_hub_all"],
    staleTime: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("esign_envelopes")
        .select("id,name,status,category,created_at,deleted_at,signed_document_url,document_url,document_filename,template_key,template_field_values,metadata,esign_recipients(name,email,phone,metadata,status)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function clientNameOf(e: any): string {
  const v = (e?.template_field_values as any) || {};
  if (v.landlord_name) return String(v.landlord_name);
  const recs: any[] = e?.esign_recipients || [];
  const client = recs.find((r) => r?.metadata?.role === "client") || recs[0];
  return client?.name || "Unnamed client";
}
function clientInitials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() || "").join("") || "—";
}
function clientContactOf(e: any): { phone: string; email: string } {
  const v = (e?.template_field_values as any) || {};
  const recs: any[] = e?.esign_recipients || [];
  const client = recs.find((r) => r?.metadata?.role === "client") || recs[0] || {};
  return {
    phone: v.mobile_number || client?.phone || "",
    email: v.email_address || client?.email || "",
  };
}
function propertyOf(e: any): string {
  const v = (e?.template_field_values as any) || {};
  const parts = [v.property_type, v.building_name || v.community || v.street_name, v.unit_number ? `Unit ${v.unit_number}` : ""].filter(Boolean);
  return parts.join(" · ");
}
function sizeOf(e: any): string {
  const v = (e?.template_field_values as any) || {};
  const beds = v.bedrooms ? (/^stu/i.test(String(v.bedrooms)) || String(v.bedrooms) === "0" ? "Studio" : `${v.bedrooms} bed`) : "";
  const bua = v.bua_sqft ? `${v.bua_sqft} sqft` : "";
  return [beds, bua].filter(Boolean).join(" · ");
}
function docNumberOf(e: any): string {
  return (e?.metadata as any)?.doc_number || (e?.template_field_values as any)?.doc_number || "";
}
function kindLabelOf(e: any): string {
  if (e?.template_key === "jbj-property-advertising-agreement" || e?.template_key === "jbj-paa-leasing") return "Leasing";
  if (e?.template_key === "jbj-listing-authorisation-selling") return "Selling";
  return e?.category ? String(e.category) : "";
}

/**
 * Classification rule:
 *  - status=draft AND template has at least a client name = "Forms Generated"
 *  - status=draft with no client name (truly empty) = "Draft Applications"
 *  - status=sent / partially_signed / viewed = "Pending Signature"
 *  - status=completed = "Signed"
 */
function isCompleteEnoughToBeGenerated(e: any): boolean {
  const v = (e?.template_field_values as any) || {};
  const recs: any[] = e?.esign_recipients || [];
  const client = recs.find((r) => r?.metadata?.role === "client") || recs[0];
  const hasClientName = !!(v.landlord_name || client?.name);
  const hasContact = !!(v.mobile_number || v.email_address || client?.email || client?.phone);
  return hasClientName && hasContact;
}

const VALID_TABS: Bucket[] = ["templates","documents","esign","drafts","generated","sent","submitted","signed","deleted","assets"];

export default function DocumentsFormsHub({ initialTabOverride }: DocumentsFormsHubProps = {}) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (() => {
    const t = searchParams.get("tab") as Bucket | null;
    if (initialTabOverride && VALID_TABS.includes(initialTabOverride)) return initialTabOverride;
    return t && VALID_TABS.includes(t) ? t : "templates";
  })();
  const [tab, setTab] = useState<Bucket>(initialTab);
  const [cat, setCat] = useState<Cat>("all");
  // Keep ?tab= in sync with the active tab so legacy /e-signature?tab=... links land correctly.
  useEffect(() => {
    const current = searchParams.get("tab");
    if (current !== tab) {
      const next = new URLSearchParams(searchParams);
      if (tab === "templates") next.delete("tab"); else next.set("tab", tab);
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);
  const { data: templates = [], isLoading: tplLoading } = useEsignTemplates(cat);
  const { data: allEnvelopes = [], isLoading: envLoading, refetch } = useAllEnvelopes();
  const { data: signatures = [] } = useOwnerSignatureAssets("signature");
  const { data: stamps = [] } = useOwnerSignatureAssets("stamp");
  const createFromTpl = useCreateEnvelopeFromTemplate();

  const [picker, setPicker] = useState<EsignTemplate | null>(null);
  const [client, setClient] = useState({ name: "", email: "", phone: "" });
  const [extraValues, setExtraValues] = useState<Record<string, string>>({});
  const [showDetails, setShowDetails] = useState(false);
  const [includeJbjBlock, setIncludeJbjBlock] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Bucket envelopes.
  // RULE: an envelope that has a client filled in is ALWAYS a "Forms Generated"
  // entry, regardless of whether it is later sent / signed. Pending and Signed
  // tabs additionally surface the same envelope based on lifecycle status.
  const buckets = useMemo(() => {
    const drafts: any[] = [];
    const generated: any[] = [];
    const sent: any[] = [];
    const submitted: any[] = [];
    const signed: any[] = [];
    const deleted: any[] = [];
    for (const e of allEnvelopes) {
      if ((e as any).deleted_at) { deleted.push(e); continue; }
      const s = (e as any).status;
      const generatedReady = isCompleteEnoughToBeGenerated(e);
      const recs: any[] = (e as any).esign_recipients || [];
      const anyAwaitingReturn = recs.some((r) => r?.status === "awaiting_signed_return");

      if (s === "completed") signed.push(e);
      else if (s === "awaiting_signed_return" || s === "pending_owner_review" || anyAwaitingReturn) submitted.push(e);
      else if (s === "sent" || s === "viewed" || s === "partially_signed") sent.push(e);
      else if (s === "draft" && !generatedReady) drafts.push(e);

      if (generatedReady) generated.push(e);
    }
    return { drafts, generated, sent, submitted, signed, deleted };
  }, [allEnvelopes]);

  const handleUseTemplate = async () => {
    if (!picker) return;
    if (!client.name.trim()) {
      toast.error("Enter at least a client name");
      return;
    }
    // Email is optional now — required only at send-time
    try {
      const hiddenFields = includeJbjBlock ? [] : ["jbj_signature_name", "jbj_signature_date"];
      const env = await createFromTpl.mutateAsync({ template: picker, client, values: extraValues, hiddenFields });
      toast.success("Draft created — review fields and send");
      qc.invalidateQueries({ queryKey: ["esign_envelopes_hub_all"] });
      navigate(`/owner/documents/forms/${env.id}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to create envelope");
    }
  };

  const filteredTemplates = templates.filter(t => cat === "all" ? true : t.category === cat);

  // Bulk actions on the visible bucket
  const visibleIds = (() => {
    if (tab === "drafts") return buckets.drafts.map((e: any) => e.id);
    if (tab === "generated") return buckets.generated.map((e: any) => e.id);
    if (tab === "deleted") return buckets.deleted.map((e: any) => e.id);
    return [];
  })();

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (selected.size === visibleIds.length) setSelected(new Set());
    else setSelected(new Set(visibleIds));
  };

  const bulkSoftDelete = async () => {
    if (!selected.size) return;
    const ids = Array.from(selected);
    const { error } = await supabase
      .from("esign_envelopes")
      .update({ deleted_at: new Date().toISOString() })
      .in("id", ids);
    if (error) { toast.error(error.message); return; }
    toast.success(`${ids.length} moved to Recently Deleted`);
    setSelected(new Set());
    refetch();
  };
  const bulkRestore = async () => {
    if (!selected.size) return;
    const ids = Array.from(selected);
    const { error } = await supabase
      .from("esign_envelopes")
      .update({ deleted_at: null })
      .in("id", ids);
    if (error) { toast.error(error.message); return; }
    toast.success(`${ids.length} restored`);
    setSelected(new Set());
    refetch();
  };

  const renderBucketCards = (rows: any[], emptyText: string, mode: "drafts" | "generated" | "sent" | "submitted" | "signed" | "deleted") => {
    if (envLoading) return <div className="text-sm text-[#1A1A1A]/60 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>;
    if (!rows.length) return <div className="text-sm text-[#1A1A1A]/60">{emptyText}</div>;
    return (
      <>
        {(mode === "drafts" || mode === "generated" || mode === "deleted") && rows.length > 0 && (
          <div className="flex items-center gap-3 mb-3 p-2 rounded-md bg-white/60 border border-[#B89555]/20">
            <Checkbox
              checked={selected.size > 0 && selected.size === visibleIds.length}
              onCheckedChange={toggleSelectAll}
              aria-label="Select all"
            />
            <span className="text-xs text-[#1A1A1A]/70">
              {selected.size ? `${selected.size} selected` : `Select all (${rows.length})`}
            </span>
            <div className="ml-auto flex gap-2">
              {mode === "deleted" ? (
                <Button size="sm" variant="outline" disabled={!selected.size} onClick={bulkRestore}>
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Restore
                </Button>
              ) : (
                <Button size="sm" variant="outline" disabled={!selected.size} onClick={bulkSoftDelete}>
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Move to Recently Deleted
                </Button>
              )}
            </div>
          </div>
        )}
        <div className="grid md:grid-cols-2 gap-3">
          {rows.map((e: any) => {
            const cName = clientNameOf(e);
            const initials = clientInitials(cName);
            const property = propertyOf(e);
            const size = sizeOf(e);
            const dn = docNumberOf(e);
            const kind = kindLabelOf(e);
            const { phone, email } = clientContactOf(e);
            const selectable = mode === "drafts" || mode === "generated" || mode === "deleted";
            const sLabel =
              mode === "signed" ? "Signed"
              : mode === "submitted" ? "Submitted — Pending Review"
              : mode === "sent" ? "Pending Signature"
              : mode === "deleted" ? "Recently Deleted"
              : mode === "generated" ? "Forms Generated"
              : "Draft Application";
            const sCls =
              mode === "signed" ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : mode === "submitted" ? "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]"
              : mode === "sent" ? "bg-blue-50 text-blue-800 border-blue-200"
              : mode === "deleted" ? "bg-red-50 text-red-800 border-red-200"
              : mode === "generated" ? "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/60"
              : "bg-[#F7F2EA] text-[#1A1A1A]/80 border-[#B89555]/30";
            return (
              <Card key={e.id} className="p-4 bg-[#F7F2EA] border-[#B89555]/30">
                <div className="flex items-start gap-3">
                  {selectable && (
                    <Checkbox
                      className="mt-1"
                      checked={selected.has(e.id)}
                      onCheckedChange={() => toggleSelect(e.id)}
                      aria-label={`Select ${cName}`}
                    />
                  )}
                  <div className="shrink-0 w-10 h-10 rounded-full bg-[#EFE6D6] border border-[#B89555]/40 flex items-center justify-center text-sm font-semibold text-[#1A1A1A]">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      {dn && <span className="text-[10px] tracking-[0.16em] uppercase text-[#1A1A1A]/80 border border-[#B89555]/40 rounded px-2 py-0.5 bg-white/70">{dn}</span>}
                      {kind && <span className="text-[10px] tracking-[0.14em] uppercase text-[#1A1A1A] border border-[#B89555]/40 rounded px-2 py-0.5 bg-[#EFE6D6]">{kind}</span>}
                      <span className={`text-[10px] tracking-[0.14em] uppercase rounded px-2 py-0.5 border ${sCls}`}>{sLabel}</span>
                    </div>
                    <div className="font-semibold text-[#1A1A1A] truncate">{cName}</div>
                    {property && <div className="text-xs text-[#1A1A1A]/80 truncate">{property}</div>}
                    {size && <div className="text-[11px] text-[#1A1A1A]/70 truncate">{size}</div>}
                    {(phone || email) && (
                      <div className="text-[11px] text-[#1A1A1A]/70 mt-1 truncate">
                        {[phone, email].filter(Boolean).join(" · ")}
                      </div>
                    )}
                    <div className="text-[11px] text-[#1A1A1A]/55 mt-0.5">{new Date(e.created_at).toLocaleString()}</div>
                  </div>
                  <div className="flex flex-col gap-2 items-end shrink-0">
                    <Button size="sm" variant="gold" onClick={() => navigate(`/owner/documents/forms/${e.id}`)}>Open</Button>
                    {e.signed_document_url && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={e.signed_document_url} target="_blank" rel="noreferrer">
                          <ExternalLink className="w-3 h-3 mr-1" /> Download
                        </a>
                      </Button>
                    )}
                    {mode === "signed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          if (!confirm("Mark this envelope as NOT signed and return it to drafts?\n\nUse this only for test signatures. The signed copy reference will be cleared.")) return;
                          const { error } = await supabase
                            .from("esign_envelopes")
                            .update({ status: "draft", signed_document_url: null })
                            .eq("id", e.id);
                          if (error) { toast.error(error.message); return; }
                          toast.success("Reverted to draft");
                          refetch();
                        }}
                      >
                        <RotateCcw className="w-3 h-3 mr-1" /> Mark not signed
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-6 lg:p-10">
      <div className="max-w-[1400px] mx-auto">
        <header className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-[#1A1A1A]/60">Owner</div>
            <h1 className="text-2xl font-semibold text-[#1A1A1A]">Documents & Forms</h1>
            <p className="text-sm text-[#1A1A1A]/70 mt-1">Unified hub — templates, document editor, e-signature, agreements, signatures & stamps. All in one place.</p>
          </div>
          <Button variant="gold" onClick={() => navigate("/owner/documents/forms/create")}>
            <Plus className="w-4 h-4 mr-2" /> New Envelope
          </Button>
        </header>

        {/* Quick actions */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Card className="p-4 bg-[#F7F2EA] border-[#B89555]/30 cursor-pointer hover:border-[#B89555]" onClick={() => { setCat("leasing"); setTab("templates"); }}>
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-[#B89555]" />
              <div>
                <div className="font-medium text-[#1A1A1A] text-sm">Leasing Template</div>
                <div className="text-xs text-[#1A1A1A]/70 mt-0.5">JBJ Property Advertising Agreement</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-[#F7F2EA] border-[#B89555]/30 cursor-pointer hover:border-[#B89555]" onClick={() => { setCat("selling"); setTab("templates"); }}>
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-[#B89555]" />
              <div>
                <div className="font-medium text-[#1A1A1A] text-sm">Selling Template</div>
                <div className="text-xs text-[#1A1A1A]/70 mt-0.5">JBJ Listing Authorisation</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-[#F7F2EA] border-[#B89555]/30 cursor-pointer hover:border-[#B89555]" onClick={() => navigate("/owner/documents/forms/create")}>
            <div className="flex items-start gap-3">
              <Upload className="w-5 h-5 text-[#B89555]" />
              <div>
                <div className="font-medium text-[#1A1A1A] text-sm">Upload Contract</div>
                <div className="text-xs text-[#1A1A1A]/70 mt-0.5">PDF, photos, text — auto-converted</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-[#F7F2EA] border-[#B89555]/30 cursor-pointer hover:border-[#B89555]" onClick={() => navigate("/owner/documents/forms/contract-review")}>
            <div className="flex items-start gap-3">
              <Scale className="w-5 h-5 text-[#B89555]" />
              <div>
                <div className="font-medium text-[#1A1A1A] text-sm">AI Contract Review</div>
                <div className="text-xs text-[#1A1A1A]/70 mt-0.5">Lawyer-grade risk analysis</div>
              </div>
            </div>
          </Card>
        </div>

        <Tabs value={tab} onValueChange={(v) => { setTab(v as Bucket); setSelected(new Set()); }}>
          <TabsList className="bg-[#F7F2EA] border border-[#B89555]/30 flex-wrap h-auto">
            <TabsTrigger value="templates"><FileText className="w-4 h-4 mr-2" />Templates</TabsTrigger>
            <TabsTrigger value="documents"><FileEdit className="w-4 h-4 mr-2" />Document Editor</TabsTrigger>
            <TabsTrigger value="esign"><FileSignature className="w-4 h-4 mr-2" />E-signature</TabsTrigger>
            <TabsTrigger value="drafts"><FileEdit className="w-4 h-4 mr-2" />Drafts ({buckets.drafts.length})</TabsTrigger>
            <TabsTrigger value="generated"><Clock className="w-4 h-4 mr-2" />Generated ({buckets.generated.length})</TabsTrigger>
            <TabsTrigger value="sent"><Send className="w-4 h-4 mr-2" />Pending ({buckets.sent.length})</TabsTrigger>
            <TabsTrigger value="submitted"><Clock className="w-4 h-4 mr-2" />Review ({buckets.submitted.length})</TabsTrigger>
            <TabsTrigger value="signed"><CheckCircle2 className="w-4 h-4 mr-2" />Signed ({buckets.signed.length})</TabsTrigger>
            <TabsTrigger value="deleted"><Trash2 className="w-4 h-4 mr-2" />Deleted ({buckets.deleted.length})</TabsTrigger>
            <TabsTrigger value="assets"><PenTool className="w-4 h-4 mr-2" />Stamps & Signatures</TabsTrigger>
          </TabsList>

          {/* TEMPLATES */}
          <TabsContent value="templates" className="mt-4">
            <div className="flex gap-2 mb-4">
              {(["all","leasing","selling"] as Cat[]).map(c => (
                <Button key={c} size="sm" variant={cat === c ? "gold" : "outline"} onClick={() => setCat(c)} className="capitalize">
                  {c}
                </Button>
              ))}
            </div>
            {tplLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Standard JBJ Letterhead — always first, opens the branded letter studio */}
                <Card className="p-5 bg-[#F7F2EA] border-[#B89555]/30">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/60">JBJ Standard</div>
                      <div className="font-semibold text-[#1A1A1A] mt-1">Standard JBJ Letterhead</div>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 border border-[#B89555]/40 rounded text-[#1A1A1A]/70">SYSTEM</span>
                  </div>
                  <p className="text-xs text-[#1A1A1A]/70 mt-2">
                    A4 branded letterhead — type your letter, drag your signature & stamp, edit the date, download PDF.
                  </p>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="gold" onClick={() => navigate("/owner/documents/forms/blank-letter")}>
                      Open template
                    </Button>
                  </div>
                </Card>

                {filteredTemplates.map(t => (
                  <Card key={t.id} className="p-5 bg-[#F7F2EA] border-[#B89555]/30">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/60">{t.category}</div>
                        <div className="font-semibold text-[#1A1A1A] mt-1">{t.name}</div>
                      </div>
                      {t.is_system && <span className="text-[9px] px-2 py-0.5 border border-[#B89555]/40 rounded text-[#1A1A1A]/70">SYSTEM</span>}
                    </div>
                    <p className="text-xs text-[#1A1A1A]/70 mt-2">
                      {Array.isArray(t.field_schema) ? t.field_schema.length : 0} pre-placed fields · client signs first, you countersign
                    </p>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="gold" onClick={() => { setPicker(t); setClient({ name: "", email: "", phone: "" }); }}>
                        Use template
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* DOCUMENT EDITOR */}
          <TabsContent value="documents" className="mt-4">
            <Card className="p-6 bg-[#F7F2EA] border-[#B89555]/30">
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-12 h-12 rounded-lg bg-[#EFE6D6] border border-[#B89555]/40 flex items-center justify-center">
                  <FileEdit className="w-6 h-6 text-[#1A1A1A]" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-[#1A1A1A]">Premium Document Editor</div>
                  <p className="text-sm text-[#1A1A1A]/70 mt-1">
                    Full-page rich editor with templates (Offer Letter, MOU, NOC, Tenancy, Invoice, Handover…),
                    OCR scanner, find & replace, AI prompt edit, QR codes, gradients, stamp/signature insertion.
                  </p>
                  <div className="flex gap-2 mt-4 flex-wrap">
                    <Button variant="gold" onClick={() => navigate("/owner/documents/editor")}>Open Document Editor</Button>
                    <Button variant="outline" onClick={() => setTab("templates")}>Browse Standard Templates</Button>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* E-SIGNATURE */}
          <TabsContent value="esign" className="mt-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="p-5 bg-[#F7F2EA] border-[#B89555]/30">
                <div className="flex items-start gap-3">
                  <Upload className="w-5 h-5 text-[#1A1A1A]" />
                  <div>
                    <div className="font-semibold text-[#1A1A1A] text-sm">Upload & Send for Signature</div>
                    <div className="text-xs text-[#1A1A1A]/70 mt-1">Upload PDF/Word/photos — auto-converted to a signable envelope.</div>
                    <Button size="sm" variant="gold" className="mt-3" onClick={() => navigate("/owner/documents/forms/create")}>Create Envelope</Button>
                  </div>
                </div>
              </Card>
              <Card className="p-5 bg-[#F7F2EA] border-[#B89555]/30">
                <div className="flex items-start gap-3">
                  <PenTool className="w-5 h-5 text-[#1A1A1A]" />
                  <div>
                    <div className="font-semibold text-[#1A1A1A] text-sm">Signature Studio</div>
                    <div className="text-xs text-[#1A1A1A]/70 mt-1">Draw, upload or generate your owner signature, initials and stamp.</div>
                    <Button size="sm" variant="gold" className="mt-3" onClick={() => navigate("/owner/documents/forms/signature-studio")}>Open Studio</Button>
                  </div>
                </div>
              </Card>
              <Card className="p-5 bg-[#F7F2EA] border-[#B89555]/30">
                <div className="flex items-start gap-3">
                  <Scale className="w-5 h-5 text-[#1A1A1A]" />
                  <div>
                    <div className="font-semibold text-[#1A1A1A] text-sm">AI Contract Review</div>
                    <div className="text-xs text-[#1A1A1A]/70 mt-1">Lawyer-grade clause-by-clause analysis of any contract.</div>
                    <Button size="sm" variant="gold" className="mt-3" onClick={() => navigate("/owner/documents/forms/contract-review")}>Open Review</Button>
                  </div>
                </div>
              </Card>
            </div>
            <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Button variant="outline" onClick={() => setTab("sent")}>Pending Signature ({buckets.sent.length})</Button>
              <Button variant="outline" onClick={() => setTab("submitted")}>Submitted — Review ({buckets.submitted.length})</Button>
              <Button variant="outline" onClick={() => setTab("signed")}>Signed ({buckets.signed.length})</Button>
              <Button variant="outline" onClick={() => setTab("assets")}>Stamps & Signatures</Button>
            </div>
          </TabsContent>

          <TabsContent value="drafts" className="mt-4">
            {renderBucketCards(buckets.drafts, "No draft applications. Empty templates with no client info land here.", "drafts")}
          </TabsContent>
          <TabsContent value="generated" className="mt-4">
            {renderBucketCards(buckets.generated, "No completed forms yet. Once a draft has client name + contact, it lands here.", "generated")}
          </TabsContent>
          <TabsContent value="sent" className="mt-4">
            {renderBucketCards(buckets.sent, "Nothing awaiting signature.", "sent")}
          </TabsContent>
          <TabsContent value="submitted" className="mt-4">
            {renderBucketCards(buckets.submitted, "Nothing pending your review. When a client emails the signed copy back, it lands here.", "submitted")}
          </TabsContent>
          <TabsContent value="signed" className="mt-4">
            {renderBucketCards(buckets.signed, "No signed contracts yet.", "signed")}
          </TabsContent>
          <TabsContent value="deleted" className="mt-4">
            <div className="mb-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              Items here are permanently removed after 30 days. You can restore them anytime.
            </div>
            {renderBucketCards(buckets.deleted, "Nothing in Recently Deleted.", "deleted")}
          </TabsContent>

          {/* ASSETS */}
          <TabsContent value="assets" className="mt-4">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-5 bg-[#F7F2EA] border-[#B89555]/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold text-[#1A1A1A] flex items-center gap-2"><FileSignature className="w-4 h-4" /> Saved Signatures</div>
                  <Button size="sm" variant="outline" onClick={() => navigate("/owner/documents/forms/signature-studio")}>Manage</Button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {signatures.map(s => (
                    <div key={s.id} className="border border-[#B89555]/30 rounded p-2 bg-white">
                      <img src={s.image_url} alt={s.label || "Signature"} className="h-16 w-full object-contain" />
                      {s.is_default && <div className="text-[9px] text-center mt-1 text-[#1A1A1A]/70">DEFAULT</div>}
                    </div>
                  ))}
                  {!signatures.length && <div className="text-xs text-[#1A1A1A]/60 col-span-3">No saved signatures.</div>}
                </div>
              </Card>
              <Card className="p-5 bg-[#F7F2EA] border-[#B89555]/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold text-[#1A1A1A] flex items-center gap-2"><Stamp className="w-4 h-4" /> Saved Stamps</div>
                  <Button size="sm" variant="outline" onClick={() => navigate("/owner/documents/forms/signature-studio")}>Manage</Button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {stamps.map(s => (
                    <div key={s.id} className="border border-[#B89555]/30 rounded p-2 bg-white">
                      <img src={s.image_url} alt={s.label || "Stamp"} className="h-16 w-full object-contain" />
                      {s.is_default && <div className="text-[9px] text-center mt-1 text-[#1A1A1A]/70">DEFAULT</div>}
                    </div>
                  ))}
                  {!stamps.length && <div className="text-xs text-[#1A1A1A]/60 col-span-3">No saved stamps.</div>}
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Use template dialog — email is now optional */}
      <Dialog open={!!picker} onOpenChange={(o) => { if (!o) { setPicker(null); setExtraValues({}); setShowDetails(false); setIncludeJbjBlock(false); } }}>
        <DialogContent className="bg-[#FDFBF7] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#1A1A1A]">{picker?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Client Name <span className="text-red-600">*</span></Label>
              <Input value={client.name} onChange={(e) => setClient({ ...client, name: e.target.value })} placeholder="Required" />
            </div>
            <div>
              <Label>Client Email <span className="text-[#1A1A1A]/50 text-xs">(optional — required only when sending by email)</span></Label>
              <Input type="email" value={client.email} onChange={(e) => setClient({ ...client, email: e.target.value })} placeholder="Leave empty to share via WhatsApp / link" />
            </div>
            <div>
              <Label>Client Phone (optional)</Label>
              <Input value={client.phone} onChange={(e) => setClient({ ...client, phone: e.target.value })} />
            </div>

            {picker?.category === "leasing" && (
              <SmartFillDropzone
                schemaHint="jbj_paa_leasing"
                onExtracted={(fields) => {
                  setClient((prev) => ({
                    name: prev.name || fields.landlord_name || "",
                    email: prev.email || fields.email_address || "",
                    phone: prev.phone || fields.mobile_number || "",
                  }));
                  setExtraValues((prev) => ({ ...prev, ...fields }));
                  setShowDetails(true);
                }}
              />
            )}

            <button
              type="button"
              onClick={() => setShowDetails(s => !s)}
              className="text-xs uppercase tracking-[0.16em] text-[#1A1A1A]/70 underline underline-offset-4"
            >
              {showDetails ? "Hide property & contract details" : "Add property & contract details (optional)"}
            </button>

            {showDetails && (
              <div className="border-t border-[#B89555]/30 pt-3 space-y-4">
                {PAA_FIELD_GROUPS.filter(g => g.title !== "Signatures").map(group => (
                  <div key={group.title}>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/60 mb-2">{group.title}</div>
                    <div className="grid grid-cols-2 gap-3">
                      {group.fields.map(f => {
                        if (f.key === "landlord_name" || f.key === "email_address" || f.key === "mobile_number") return null;
                        const val = extraValues[f.key] ?? "";
                        const onChange = (v: string) => setExtraValues(prev => ({ ...prev, [f.key]: v }));
                        if (f.type === "select" && f.options) {
                          return (
                            <div key={f.key}>
                              <Label className="text-xs">{f.label}</Label>
                              <select
                                value={val}
                                onChange={(e) => onChange(e.target.value)}
                                className="w-full h-9 px-2 rounded border border-[#B89555]/40 bg-white text-sm text-[#1A1A1A]"
                              >
                                <option value="">—</option>
                                {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                              </select>
                            </div>
                          );
                        }
                        if (f.type === "textarea") {
                          return (
                            <div key={f.key} className="col-span-2">
                              <Label className="text-xs">{f.label}</Label>
                              <textarea
                                value={val}
                                onChange={(e) => onChange(e.target.value)}
                                rows={2}
                                className="w-full px-2 py-1 rounded border border-[#B89555]/40 bg-white text-sm text-[#1A1A1A]"
                              />
                            </div>
                          );
                        }
                        return (
                          <div key={f.key}>
                            <Label className="text-xs">{f.label}</Label>
                            <Input
                              type={f.type === "date" ? "date" : f.type === "number" ? "number" : "text"}
                              value={val}
                              onChange={(e) => onChange(e.target.value)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-start gap-3 rounded-md border border-[#B89555]/30 bg-[#F7F2EA]/60 px-3 py-2.5">
              <Checkbox
                id="include-jbj-block"
                checked={includeJbjBlock}
                onCheckedChange={(v) => setIncludeJbjBlock(v === true)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <Label htmlFor="include-jbj-block" className="text-sm font-semibold text-[#1A1A1A] cursor-pointer">
                  Add JBJ company signature & stamp
                </Label>
                <p className="text-[11px] text-[#1A1A1A]/70 mt-0.5">
                  Off by default — only the landlord signs. Turn on if your client requires our company signature & stamp on the agreement.
                </p>
              </div>
            </div>

            <p className="text-xs text-[#1A1A1A]/70">
              We'll generate the agreement, place name and date fields for the landlord, and open the envelope so you can review before sending. The client signs directly when they open the link.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPicker(null); setExtraValues({}); setShowDetails(false); setIncludeJbjBlock(false); }}>Cancel</Button>
            <Button variant="gold" onClick={handleUseTemplate} disabled={createFromTpl.isPending}>
              {createFromTpl.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Create Envelope
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
