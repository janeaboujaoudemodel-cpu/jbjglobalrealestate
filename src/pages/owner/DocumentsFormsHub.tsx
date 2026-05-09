import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEsignTemplates, useCreateEnvelopeFromTemplate, type EsignTemplate } from "@/hooks/useEsignTemplates";
import { PAA_FIELD_GROUPS } from "@/templates/jbjPropertyAdvertisingAgreement";
import { useOwnerSignatureAssets } from "@/hooks/useOwnerSignatureAssets";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FileText, Send, CheckCircle2, Clock, PenTool, Stamp, FileSignature, Plus, Loader2, ExternalLink, Upload, Scale, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { SmartFillDropzone } from "@/components/e-signature/SmartFillDropzone";

type Cat = "all" | "leasing" | "selling";

function useEnvelopes(status?: string) {
  return useQuery({
    queryKey: ["esign_envelopes_hub", status ?? "all"],
    queryFn: async () => {
      // Pull the fields needed for the rich card summary (client + property + doc number).
      let q = supabase
        .from("esign_envelopes")
        .select("id,name,status,category,created_at,signed_document_url,template_key,template_field_values,metadata,esign_recipients(name,email,phone,metadata)")
        .order("created_at", { ascending: false });
      if (status) q = q.eq("status", status as any);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

// Card summary helpers (kept local so this page does not depend on dashboard internals).
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
  if (e?.template_key === "jbj-property-advertising-agreement") return "Leasing";
  if (e?.template_key === "jbj-listing-authorisation-selling") return "Selling";
  return e?.category ? String(e.category) : "";
}
// "Draft" with client + property data is really "Ready for review" — not unfinished.
function statusLabelOf(e: any): string {
  if (e?.status !== "draft") return String(e?.status || "draft");
  const v = (e?.template_field_values as any) || {};
  const hasClient = !!(v.landlord_name && (v.mobile_number || v.email_address));
  const hasProperty = !!(v.building_name || v.community || v.property_reference_no);
  return hasClient && hasProperty ? "ready" : "draft";
}

export default function DocumentsFormsHub() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("templates");
  const [cat, setCat] = useState<Cat>("all");
  const { data: templates = [], isLoading: tplLoading } = useEsignTemplates(cat);
  const { data: drafts = [] } = useEnvelopes("draft");
  const { data: sent = [] } = useEnvelopes("sent");
  const { data: signed = [] } = useEnvelopes("completed");
  const { data: signatures = [] } = useOwnerSignatureAssets("signature");
  const { data: stamps = [] } = useOwnerSignatureAssets("stamp");
  const createFromTpl = useCreateEnvelopeFromTemplate();

  const [picker, setPicker] = useState<EsignTemplate | null>(null);
  const [client, setClient] = useState({ name: "", email: "", phone: "" });
  const [extraValues, setExtraValues] = useState<Record<string, string>>({});
  const [showDetails, setShowDetails] = useState(false);

  const handleUseTemplate = async () => {
    if (!picker) return;
    if (!client.name.trim() || !client.email.trim()) {
      toast.error("Enter the client's name and email");
      return;
    }
    try {
      const env = await createFromTpl.mutateAsync({ template: picker, client, values: extraValues });
      toast.success("Draft created — review fields and send");
      navigate(`/e-signature/${env.id}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to create envelope");
    }
  };

  const filteredTemplates = templates.filter(t => cat === "all" ? true : t.category === cat);

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-6 lg:p-10">
      <div className="max-w-[1400px] mx-auto">
        <header className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-[#1A1A1A]/60">Documents</div>
            <h1 className="text-2xl font-semibold text-[#1A1A1A]">Forms & Agreements</h1>
            <p className="text-sm text-[#1A1A1A]/70 mt-1">JBJ leasing & selling templates · drafts · sent for signature · completed contracts</p>
          </div>
          <Button variant="gold" onClick={() => navigate("/e-signature/create")}>
            <Plus className="w-4 h-4 mr-2" /> New Envelope
          </Button>
        </header>

        {/* Quick actions — clear entry points so the workflow is never hidden */}
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
          <Card className="p-4 bg-[#F7F2EA] border-[#B89555]/30 cursor-pointer hover:border-[#B89555]" onClick={() => navigate("/e-signature/create")}>
            <div className="flex items-start gap-3">
              <Upload className="w-5 h-5 text-[#B89555]" />
              <div>
                <div className="font-medium text-[#1A1A1A] text-sm">Upload Contract</div>
                <div className="text-xs text-[#1A1A1A]/70 mt-0.5">PDF, photos, text — auto-converted</div>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-[#F7F2EA] border-[#B89555]/30 cursor-pointer hover:border-[#B89555]" onClick={() => navigate("/e-signature/contract-review")}>
            <div className="flex items-start gap-3">
              <Scale className="w-5 h-5 text-[#B89555]" />
              <div>
                <div className="font-medium text-[#1A1A1A] text-sm">AI Contract Review</div>
                <div className="text-xs text-[#1A1A1A]/70 mt-0.5">Lawyer-grade risk analysis</div>
              </div>
            </div>
          </Card>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-[#F7F2EA] border border-[#B89555]/30">
            <TabsTrigger value="templates"><FileText className="w-4 h-4 mr-2" />Templates</TabsTrigger>
            <TabsTrigger value="drafts"><Clock className="w-4 h-4 mr-2" />Forms Generated ({drafts.length})</TabsTrigger>
            <TabsTrigger value="sent"><Send className="w-4 h-4 mr-2" />Pending Signature ({sent.length})</TabsTrigger>
            <TabsTrigger value="signed"><CheckCircle2 className="w-4 h-4 mr-2" />Signed ({signed.length})</TabsTrigger>
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
                {!filteredTemplates.length && (
                  <div className="text-sm text-[#1A1A1A]/60">No templates in this category yet.</div>
                )}
              </div>
            )}
          </TabsContent>

          {/* DRAFTS / SENT / SIGNED */}
          {[
            { value: "drafts", rows: drafts, empty: "No drafts yet." },
            { value: "sent", rows: sent, empty: "Nothing awaiting signature." },
            { value: "signed", rows: signed, empty: "No signed contracts yet." },
          ].map(({ value, rows, empty }) => (
            <TabsContent key={value} value={value} className="mt-4">
              {!rows.length ? <div className="text-sm text-[#1A1A1A]/60">{empty}</div> : (
                <div className="grid md:grid-cols-2 gap-3">
                  {rows.map((e: any) => {
                    const client = clientNameOf(e);
                    const initials = clientInitials(client);
                    const property = propertyOf(e);
                    const size = sizeOf(e);
                    const dn = docNumberOf(e);
                    const kind = kindLabelOf(e);
                    const sLabel = statusLabelOf(e);
                    const sCls =
                      sLabel === "completed" ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : sLabel === "sent" ? "bg-blue-50 text-blue-800 border-blue-200"
                      : sLabel === "ready" ? "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/60"
                      : "bg-[#F7F2EA] text-[#1A1A1A]/80 border-[#B89555]/30";
                    return (
                      <Card key={e.id} className="p-4 bg-[#F7F2EA] border-[#B89555]/30">
                        <div className="flex items-start gap-3">
                          {/* Initials chip — gives a quick visual handle per client */}
                          <div className="shrink-0 w-10 h-10 rounded-full bg-[#EFE6D6] border border-[#B89555]/40 flex items-center justify-center text-sm font-semibold text-[#1A1A1A]">
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap mb-1">
                              {dn && (
                                <span className="text-[10px] tracking-[0.16em] uppercase text-[#1A1A1A]/80 border border-[#B89555]/40 rounded px-2 py-0.5 bg-white/70">{dn}</span>
                              )}
                              {kind && (
                                <span className="text-[10px] tracking-[0.14em] uppercase text-[#1A1A1A] border border-[#B89555]/40 rounded px-2 py-0.5 bg-[#EFE6D6]">{kind}</span>
                              )}
                              <span className={`text-[10px] tracking-[0.14em] uppercase rounded px-2 py-0.5 border ${sCls}`}>
                                {sLabel === "ready" ? "Forms Generated" : sLabel === "draft" ? "Forms Generated" : sLabel === "sent" ? "Pending Signature" : sLabel === "completed" ? "Signed" : sLabel.replace(/_/g, " ")}
                              </span>
                            </div>
                            <div className="font-semibold text-[#1A1A1A] truncate">{client}</div>
                            {property && <div className="text-xs text-[#1A1A1A]/80 truncate">{property}</div>}
                            {size && <div className="text-[11px] text-[#1A1A1A]/70 truncate">{size}</div>}
                            <div className="text-[11px] text-[#1A1A1A]/60 mt-1 truncate">
                              {e.name}
                            </div>
                            <div className="text-[11px] text-[#1A1A1A]/55 mt-0.5">
                              {new Date(e.created_at).toLocaleString()}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 items-end shrink-0">
                            <Button size="sm" variant="gold" onClick={() => navigate(`/e-signature/${e.id}`)}>Open</Button>
                            {e.signed_document_url && (
                              <Button size="sm" variant="outline" asChild>
                                <a href={e.signed_document_url} target="_blank" rel="noreferrer">
                                  <ExternalLink className="w-3 h-3 mr-1" /> Download
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          ))}

          {/* ASSETS */}
          <TabsContent value="assets" className="mt-4">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-5 bg-[#F7F2EA] border-[#B89555]/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold text-[#1A1A1A] flex items-center gap-2"><FileSignature className="w-4 h-4" /> Saved Signatures</div>
                  <Button size="sm" variant="outline" onClick={() => navigate("/e-signature/signature-studio")}>Manage</Button>
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
                  <Button size="sm" variant="outline" onClick={() => navigate("/e-signature/signature-studio")}>Manage</Button>
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

      {/* Use template dialog */}
      <Dialog open={!!picker} onOpenChange={(o) => { if (!o) { setPicker(null); setExtraValues({}); setShowDetails(false); } }}>
        <DialogContent className="bg-[#FDFBF7] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#1A1A1A]">{picker?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Client Name</Label>
              <Input value={client.name} onChange={(e) => setClient({ ...client, name: e.target.value })} />
            </div>
            <div>
              <Label>Client Email</Label>
              <Input type="email" value={client.email} onChange={(e) => setClient({ ...client, email: e.target.value })} />
            </div>
            <div>
              <Label>Client Phone (optional)</Label>
              <Input value={client.phone} onChange={(e) => setClient({ ...client, phone: e.target.value })} />
            </div>

            {picker?.category === "leasing" && (
              <SmartFillDropzone
                schemaHint="jbj_paa_leasing"
                onExtracted={(fields) => {
                  // Push name/email/phone to client inputs if present
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
                        // skip the 3 fields that are already covered by the client inputs
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

            <p className="text-xs text-[#1A1A1A]/70">
              We'll generate the PDF, pre-place client + JBJ signature, stamp and date fields, then open the envelope so you can adjust before sending.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPicker(null); setExtraValues({}); setShowDetails(false); }}>Cancel</Button>
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
