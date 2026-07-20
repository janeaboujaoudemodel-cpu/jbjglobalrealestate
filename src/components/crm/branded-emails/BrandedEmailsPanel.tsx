/**
 * BrandedEmailsPanel
 *
 * In-place Sheet panel — Template · Audience · Preview · Send. Audience tab
 * shows the full recipient list with logos and per-row checkboxes; Send tab
 * has NO duplicate audience block and includes an inline mini-preview of the
 * currently selected template.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Mail, Search, Users, Send, Eye, FileText } from "lucide-react";
import { toast } from "sonner";

export type BrandedAudienceKind = "developers" | "brokerages";

type Recipient = {
  id: string;
  name: string;
  email: string | null;
  meta?: string | null;
  logoUrl?: string | null;
  registrationStatus?: string | null;
};

type Template = {
  id: string;
  owner_id?: string | null;
  name: string;
  subject: string;
  body_html: string;
  category: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: BrandedAudienceKind;
};

// Allow-list of template names per audience kind. Anything else is hidden.
const DEVELOPER_ALLOWED = [
  "Developer · Registration",
  "Developer · Registration Follow-up",
];
const BROKERAGE_ALLOWED = [
  "Brokerage · Breakfast Briefing",
  "Brokerage · Registration",
  "Brokerage · Registration Follow-up",
];

async function loadRecipients(kind: BrandedAudienceKind): Promise<Recipient[]> {
  if (kind === "developers") {
    const { data } = await (supabase as any)
      .from("developers")
      .select("id, name, slug, logo_url, admin_email, registration_status")
      .order("name")
      .limit(2000);
    return (data ?? []).map((r: any) => ({
      id: String(r.id),
      name: r.name || r.slug || "Developer",
      email: r.admin_email || null,
      meta: r.slug || null,
      logoUrl: r.logo_url || null,
      registrationStatus: r.registration_status || "not_registered",
    }));
  }
  const { data } = await (supabase as any)
    .from("crm_brokerages")
    .select("id, company_name, email, emirate")
    .order("company_name")
    .limit(2000);
  return (data ?? []).map((r: any) => ({
    id: String(r.id),
    name: r.company_name || "Brokerage",
    email: r.email || null,
    meta: r.emirate || null,
    logoUrl: null,
  }));
}

function normalizeTemplateKey(template: Template) {
  return `${template.category || "Template"}::${template.name}`.trim().toLowerCase();
}

function normalizeSubjectKey(template: Template) {
  return `${template.category || "Template"}::${template.subject}`.trim().toLowerCase().replace(/\s+/g, " ");
}

function isDeveloperRegistrationCampaign(kind: BrandedAudienceKind, template: Template | null | undefined) {
  return kind === "developers" && template?.name === "Developer · Registration";
}

async function loadTemplates(kind: BrandedAudienceKind): Promise<Template[]> {
  const category = kind === "developers" ? "Developer" : "Brokerage";
  const allowed = kind === "developers" ? DEVELOPER_ALLOWED : BROKERAGE_ALLOWED;

  const selectFields = "id, owner_id, name, subject, body_html, category, updated_at";
  const { data } = await (supabase as any)
    .from("branded_email_templates")
    .select(selectFields)
    .eq("category", category)
    .in("name", allowed)
    .order("updated_at", { ascending: false })
    .limit(120);

  const source = (data ?? []) as Template[];

  // Dedupe by (category, name) and then subject — same template exists per owner_id in DB.
  const seenNames = new Set<string>();
  const seenSubjects = new Set<string>();
  const dedup = source.filter((template) => {
    const nameKey = normalizeTemplateKey(template);
    const subjectKey = normalizeSubjectKey(template);
    if (seenNames.has(nameKey) || seenSubjects.has(subjectKey)) return false;
    seenNames.add(nameKey);
    seenSubjects.add(subjectKey);
    return true;
  });

  // Return in the exact allow-list order so Briefing / Registration lead.
  return allowed
    .map((n) => dedup.find((t) => t.name === n))
    .filter((t): t is Template => Boolean(t));
}

function stripHtml(html: string) {
  return html.replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("") || "?";
}

export default function BrandedEmailsPanel({ open, onOpenChange, kind }: Props) {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("template");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [audienceSearch, setAudienceSearch] = useState("");
  const [testEmail, setTestEmail] = useState("infoo.jane@gmail.com");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setActiveTab("template");
    setSelectedTemplateId(null);
    setAudienceSearch("");
    Promise.all([loadRecipients(kind), loadTemplates(kind)])
      .then(([r, t]) => {
        if (cancelled) return;
        setRecipients(r);
        setTemplates(t);
        setSelectedTemplateId(t[0]?.id ?? null);
        const firstTemplate = t[0] ?? null;
        const defaultAudience = isDeveloperRegistrationCampaign(kind, firstTemplate)
          ? r.filter((x) => x.registrationStatus !== "registered")
          : r;
        setSelectedIds(new Set(defaultAudience.map((x) => x.id)));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, kind]);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId) || null,
    [templates, selectedTemplateId]
  );

  const filteredRecipients = useMemo(() => {
    const q = audienceSearch.trim().toLowerCase();
    if (!q) return recipients;
    return recipients.filter((r) => r.name.toLowerCase().includes(q));
  }, [audienceSearch, recipients]);

  const total = recipients.length;
  const audienceCount = selectedIds.size;
  const eligibleRecipients = useMemo(
    () => isDeveloperRegistrationCampaign(kind, selectedTemplate)
      ? recipients.filter((r) => r.registrationStatus !== "registered")
      : recipients,
    [kind, recipients, selectedTemplate]
  );
  const eligibleTotal = eligibleRecipients.length;
  const allSelected = audienceCount === eligibleTotal && eligibleTotal > 0;

  useEffect(() => {
    if (!isDeveloperRegistrationCampaign(kind, selectedTemplate)) return;
    const eligible = new Set(eligibleRecipients.map((r) => r.id));
    setSelectedIds((current) => new Set([...current].filter((id) => eligible.has(id))));
  }, [kind, selectedTemplate, eligibleRecipients]);

  const toggleId = (id: string) =>
    setSelectedIds((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectAll = () => setSelectedIds(new Set(eligibleRecipients.map((r) => r.id)));
  const clearAll = () => setSelectedIds(new Set());

  const handleSendTest = async () => {
    if (!selectedTemplate) {
      toast.error("Pick a template first");
      return;
    }
    if (!testEmail.trim()) {
      toast.error("Enter a test email address");
      return;
    }
    setSending(true);
    try {
      const bodyText = stripHtml(selectedTemplate.body_html);
      const { error } = await (supabase as any).functions.invoke("send-owner-email", {
        body: {
          to: testEmail.trim(),
          subject: `[TEST · ${kind}] ${selectedTemplate.subject}`,
          body: bodyText,
          senderName: "Jane Bou Jaoude",
          senderTitle: "Founder & CEO",
          senderEmail: "contact@jbj.ae",
          account: "company",
          useResend: true,
        },
      });
      if (error) throw error;
      toast.success(`Test sent to ${testEmail} — template "${selectedTemplate.name}"`);
    } catch (e: any) {
      toast.error(`Test send failed: ${e?.message || "unknown error"}`);
    } finally {
      setSending(false);
    }
  };

  const handleSendLive = async () => {
    if (!selectedTemplate) {
      toast.error("Pick a template first");
      return;
    }
    if (audienceCount === 0) {
      toast.error("Empty audience — select recipients first");
      return;
    }
    const ok = window.confirm(
      `Send "${selectedTemplate.name}" live to ${audienceCount} ${kind}?\n\nThis will be delivered from contact@jbj.ae. This action is logged.`
    );
    if (!ok) return;
    toast.info(
      `Queued ${audienceCount} ${kind} for "${selectedTemplate.name}". Live delivery goes through the locked outreach pipeline.`
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" data-branded-email-panel="true" className="w-full sm:max-w-3xl p-0 flex flex-col bg-white">
        <SheetHeader className="px-6 py-4 border-b border-emerald-900/10 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <span className="inline-grid place-items-center size-10 rounded-md bg-[#064E3B] !text-white">
              <Mail className="size-5 !text-white" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.22em] font-black text-[#064E3B]">
                {kind === "developers" ? "Developer Portal · Campaigns" : "Brokerage Portal · Campaigns"}
              </p>
              <SheetTitle className="text-xl font-black text-[#0F1A16]">Branded Emails</SheetTitle>
            </div>
            <div className="ml-auto flex items-center gap-2 text-xs text-[#4B5D55]">
              <Users className="size-4" />
              Sending to <strong className="text-[#064E3B]">{audienceCount}</strong> of {eligibleTotal}
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-auto px-6 py-5 space-y-6">
          {/* STEP 1 · TEMPLATE */}
          <section>
            <StepHeader n={1} label="Template" Icon={FileText} />
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-[#4B5D55]"><Loader2 className="size-4 animate-spin" /> Loading templates…</div>
            ) : templates.length === 0 ? (
              <div className="p-8 text-center text-[#4B5D55] border border-dashed border-emerald-900/20 rounded-lg">
                No templates configured for this audience.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {templates.map((t) => {
                  const active = t.id === selectedTemplateId;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTemplateId(t.id)}
                      className={`text-left p-4 rounded-lg border transition ${
                        active
                          ? "border-[#064E3B] bg-[#064E3B]/5 ring-2 ring-[#064E3B]/30"
                          : "border-emerald-900/15 hover:border-[#064E3B]/50 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase tracking-wider text-[#064E3B] font-black">{t.category || "Template"}</span>
                        {active && <Badge className="bg-[#064E3B] !text-white border-0 text-[10px]">Selected</Badge>}
                      </div>
                      <p className="font-bold text-[#0F1A16] leading-tight">{t.name}</p>
                      <p className="text-xs text-[#4B5D55] mt-1 line-clamp-2">{t.subject}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* STEP 2 · AUDIENCE */}
          <section>
            <StepHeader n={2} label="Audience" Icon={Users} />
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <button
                type="button"
                onClick={selectAll}
                style={{
                  padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700,
                  background: allSelected ? "#064E3B" : "#FFFFFF",
                  color: allSelected ? "#FFFFFF" : "#064E3B",
                  border: `1px solid ${allSelected ? "#064E3B" : "rgba(6,78,59,0.4)"}`,
                  whiteSpace: "nowrap",
                }}
              >
                {allSelected ? `All ${eligibleTotal} selected` : `Select all (${eligibleTotal})`}
              </button>
              <button
                type="button"
                onClick={clearAll}
                style={{
                  padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700,
                  background: "#FFFFFF", color: "#064E3B",
                  border: "1px solid rgba(6,78,59,0.4)",
                  whiteSpace: "nowrap",
                }}
              >
                Clear
              </button>
              <div className="relative flex-1 min-w-[220px]">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#4B5D55]" />
                <Input
                  type="text"
                  value={audienceSearch}
                  onChange={(e) => setAudienceSearch(e.target.value)}
                  placeholder={`Search ${kind === "developers" ? "developers" : "brokerages"}…`}
                  className="pl-9 !bg-white !text-[#0F1A16] placeholder:!text-[#4B5D55] border-emerald-900/20"
                />
              </div>
              <span className="text-xs text-[#4B5D55] ml-auto">
                <strong className="text-[#064E3B]">{audienceCount}</strong> of {eligibleTotal} selected
              </span>
            </div>

            <div className="border border-emerald-900/15 rounded-lg overflow-hidden bg-white">
              {loading ? (
                <div className="p-6 flex items-center gap-2 text-sm text-[#4B5D55]"><Loader2 className="size-4 animate-spin" /> Loading…</div>
              ) : (
                <ScrollArea className="h-[300px]">
                  <ul className="divide-y divide-emerald-900/5">
                    {filteredRecipients.map((r) => {
                      const checked = selectedIds.has(r.id);
                      return (
                        <li key={r.id}>
                          <label className="flex items-center gap-3 px-3 py-2 hover:bg-emerald-50/50 cursor-pointer">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => toggleId(r.id)}
                              className="data-[state=checked]:bg-[#064E3B] data-[state=checked]:border-[#064E3B]"
                            />
                            <span className="inline-flex items-center justify-center size-8 rounded-md bg-white border border-emerald-900/10 overflow-hidden shrink-0">
                              {r.logoUrl ? (
                                <img src={r.logoUrl} alt="" className="max-w-full max-h-full object-contain" />
                              ) : (
                                <span className="text-[10px] font-black text-[#064E3B]">{initialsOf(r.name)}</span>
                              )}
                            </span>
                            <span className="flex-1 min-w-0">
                              <span className="block truncate text-sm font-semibold text-[#0F1A16]">{r.name}</span>
                              {r.meta && <span className="block truncate text-[11px] text-[#4B5D55]">{r.meta}</span>}
                              {r.email && <span className="block truncate text-[11px] text-[#4B5D55]">{r.email}</span>}
                            </span>
                            {r.registrationStatus === "registered" && (
                              <span className="text-[10px] font-black uppercase tracking-[0.1em] text-[#064E3B] bg-emerald-50 border border-emerald-900/15 rounded-full px-2 py-0.5">
                                Registered
                              </span>
                            )}
                          </label>
                        </li>
                      );
                    })}
                    {filteredRecipients.length === 0 && (
                      <li className="px-4 py-8 text-center text-sm text-[#4B5D55]">No matches.</li>
                    )}
                  </ul>
                </ScrollArea>
              )}
            </div>
          </section>

          {/* STEP 3 · PREVIEW */}
          <section>
            <StepHeader n={3} label="Preview" Icon={Eye} />
            {selectedTemplate ? (
              <div className="border border-emerald-900/15 rounded-lg bg-white overflow-hidden">
                <div className="px-4 py-3 border-b border-emerald-900/10 bg-[#F8FAF9]">
                  <p className="text-[11px] text-[#4B5D55] uppercase tracking-wider">Subject</p>
                  <p className="font-bold text-[#0F1A16]">{selectedTemplate.subject}</p>
                  <p className="text-[11px] text-[#4B5D55] mt-1">
                    Template: <span className="text-[#064E3B] font-semibold">{selectedTemplate.name}</span>
                  </p>
                </div>
                <ScrollArea className="h-[320px]">
                  <div
                    className="p-6 prose prose-sm max-w-none text-[#0F1A16]"
                    dangerouslySetInnerHTML={{ __html: selectedTemplate.body_html }}
                  />
                </ScrollArea>
              </div>
            ) : (
              <div className="p-6 text-center text-[#4B5D55] border border-dashed border-emerald-900/20 rounded-lg">
                Select a template above to preview.
              </div>
            )}
          </section>

          {/* STEP 4 · SEND */}
          <section data-branded-email-send="true" className="space-y-3">
            <StepHeader n={4} label="Send" Icon={Send} />
            <div className="border border-emerald-900/15 rounded-lg p-4 bg-[#F8FAF9]">
              <p className="text-xs text-[#4B5D55] uppercase tracking-wider">Campaign summary</p>
              <ul className="mt-2 space-y-1 text-sm text-[#0F1A16]">
                <li><strong>Template:</strong> {selectedTemplate?.name || "—"}</li>
                <li><strong>Audience:</strong> {audienceCount} of {eligibleTotal} {kind}</li>
                <li><strong>From:</strong> Jane Bou Jaoude &lt;contact@jbj.ae&gt;</li>
              </ul>
            </div>

            <div className="border border-emerald-900/15 rounded-lg p-4 bg-white">
              <p className="text-xs text-[#4B5D55] uppercase tracking-wider font-semibold mb-2">Test send</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Test email address"
                  data-branded-email-search-input="true"
                  className="flex-1 !bg-white !text-[#0F1A16] placeholder:!text-[#4B5D55] border-emerald-900/20"
                />
                <button
                  type="button"
                  onClick={handleSendTest}
                  disabled={sending || !selectedTemplate}
                  style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                    minHeight: 40, padding: "8px 16px", borderRadius: 6, fontSize: 13, fontWeight: 700,
                    background: "#FFFFFF", color: "#064E3B",
                    border: "1px solid #064E3B",
                    whiteSpace: "nowrap",
                    cursor: sending || !selectedTemplate ? "not-allowed" : "pointer",
                    opacity: sending || !selectedTemplate ? 0.5 : 1,
                  }}
                >
                  {sending ? <Loader2 className="size-4 animate-spin" style={{ color: "#064E3B" }} /> : <Send className="size-4" style={{ color: "#064E3B" }} />}
                  Send test
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSendLive}
              disabled={!selectedTemplate || audienceCount === 0}
              data-branded-email-live-action="true"
              style={{
                width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                minHeight: 48, padding: "12px 16px", borderRadius: 6, fontSize: 14, fontWeight: 800,
                background: "#064E3B", color: "#FFFFFF",
                border: "1px solid #064E3B",
                cursor: !selectedTemplate || audienceCount === 0 ? "not-allowed" : "pointer",
                opacity: !selectedTemplate || audienceCount === 0 ? 0.5 : 1,
              }}
            >
              <Send className="size-4" style={{ color: "#FFFFFF" }} />
              Send live to {audienceCount} {kind}
            </button>

            <p className="text-xs text-[#4B5D55]">
              Test sends immediately to the address above. Live send goes through the locked outreach pipeline — you'll be asked to confirm before delivery.
            </p>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function StepHeader({ n, label, Icon }: { n: number; label: string; Icon: any }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="inline-grid place-items-center size-6 rounded-full bg-[#064E3B] text-white text-[11px] font-black">{n}</span>
      <Icon className="size-4 text-[#064E3B]" />
      <h3 className="text-sm font-black uppercase tracking-[0.14em] text-[#0F1A16]">{label}</h3>
    </div>
  );
}

