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
import { DeveloperLogo } from "@/components/ui/DeveloperLogo";

export type BrandedAudienceKind = "developers" | "brokerages";

type Recipient = {
  id: string;
  name: string;
  email: string | null;
  meta?: string | null;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  registrationStatus?: string | null;
};

type Template = {
  variant: "developer_registration" | "developer_confirm_registered" | "brokerage_partnership_intro" | "brokerage_breakfast_invite";
  name: string;
  subject: string;
  html: string;
  category: string | null;
};

const SENDER_BY_KIND: Record<BrandedAudienceKind, typeof DEVELOPER_SENDER> = {
  developers: {
    name: "Amelia",
    title: "Head of Business Development",
    email: "contact@jbj.ae",
  },
  brokerages: {
    name: "JBJ Team",
    title: "Brokerage Relations",
    email: "info@jbj.ae",
  },
};

const DEVELOPER_SENDER = {
  name: "Amelia",
  title: "Head of Business Development",
  email: "contact@jbj.ae",
};

const REGISTRATION_PACKAGE_LINK = "https://drive.google.com/drive/folders/1EsWVmAPv6ljBzWbWNAvv07EQrHwi5drS?usp=sharing";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: BrandedAudienceKind;
};

const TEMPLATE_META: Record<Template["variant"], { name: string; category: string }> = {
  developer_registration: { name: "Developer · Registration", category: "Developer" },
  developer_confirm_registered: { name: "Developer · Registration Follow-up", category: "Developer" },
  brokerage_partnership_intro: { name: "Brokerage · Registration", category: "Brokerage" },
  brokerage_breakfast_invite: { name: "Brokerage · Breakfast Briefing", category: "Brokerage" },
};

const DEVELOPER_VARIANTS: Template["variant"][] = [
  "developer_registration",
  "developer_confirm_registered",
];
const BROKERAGE_VARIANTS: Template["variant"][] = [
  "brokerage_partnership_intro",
  "brokerage_breakfast_invite",
];

async function loadRecipients(kind: BrandedAudienceKind): Promise<Recipient[]> {
  if (kind === "developers") {
    const { data } = await (supabase as any)
      .from("crm_developer_registry")
      .select("id, developer_name, developer_email, logo_url, status, country, website, source")
      .order("developer_name")
      .limit(2000);
    const mapped = (data ?? []).map((r: any) => ({
      id: String(r.id),
      name: r.developer_name || "Developer",
      email: r.developer_email || null,
      meta: r.country || r.website || r.source || null,
      logoUrl: r.logo_url || null,
      websiteUrl: r.website || null,
      registrationStatus: r.status || "not_started",
    }));
    const deduped = new Map<string, Recipient>();
    for (const r of mapped) {
      const key = `${r.email || ""}::${r.name}`
        .toLowerCase()
        .replace(/\b(developers?|developments?|properties|property|realty|real\s*estate|group|llc|l\.?l\.?c)\b/g, "")
        .replace(/[^a-z0-9@.]+/g, "") || r.id;
      const prev = deduped.get(key);
      if (!prev || (!prev.logoUrl && r.logoUrl) || (!prev.email && r.email)) deduped.set(key, r);
    }
    return Array.from(deduped.values()).sort((a, b) => a.name.localeCompare(b.name));
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

function isDeveloperRegistrationCampaign(kind: BrandedAudienceKind, template: Template | null | undefined) {
  return kind === "developers" && template?.variant === "developer_registration";
}

async function loadTemplates(kind: BrandedAudienceKind): Promise<Template[]> {
  const allowed = kind === "developers" ? DEVELOPER_VARIANTS : BROKERAGE_VARIANTS;

  const { data, error } = await (supabase as any)
    .from("crm_email_templates")
    .select("variant, subject, html, updated_at")
    .in("variant", allowed)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  const byVariant = new Map<string, any>();
  for (const row of data ?? []) {
    if (!byVariant.has(row.variant)) byVariant.set(row.variant, row);
  }

  return allowed
    .map((variant) => {
      const row = byVariant.get(variant);
      if (!row) return null;
      const meta = TEMPLATE_META[variant];
      return {
        variant,
        name: meta.name,
        subject: row.subject,
        html: row.html,
        category: meta.category,
      } satisfies Template;
    })
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

function personalizeTemplate(html: string, sampleName = "Developer Team") {
  return html
    .replace(/\{\{developer_name\}\}/g, sampleName)
    .replace(/\{\{brokerage_name\}\}/g, sampleName)
      .replace(/\{\{salutation\}\}/g, sampleName)
      .replace(/\{\{contact_first_name\}\}/g, "Team")
      .replace(/\{\{contact_full_name\}\}/g, sampleName)
    .replace(/\{\{registration_package_link\}\}/g, REGISTRATION_PACKAGE_LINK)
      .replace(/\{\{drive_url\}\}/g, REGISTRATION_PACKAGE_LINK)
      .replace(/Jane Bou Jaoude/gi, SENDER_BY_KIND.developers.name)
    .replace(/Founder\s*&\s*CEO/gi, SENDER_BY_KIND.developers.title)
    .replace(/contact@jbj\.ae/gi, SENDER_BY_KIND.developers.email)
    .replace(/CONTACT@JBJ\.ae/gi, SENDER_BY_KIND.developers.email)
    .replace(/\bJBJ\.AE\b/g, "jbj.ae")
    .replace(/jbj\.ae/gi, "<a href=\"https://jbj.ae\" target=\"_blank\" rel=\"noreferrer\" style=\"color:#0a0a0a;font-weight:700;text-decoration:underline;text-decoration-color:#B89555;\">jbj.ae</a>")
    .replace(/JBJ Global Real Estate/g, "JBJ GLOBAL REAL ESTATE");
}

function personalizeSubject(subject: string, sampleName = "Developer Team") {
  return subject
    .replace(/\{\{developer_name\}\}/g, sampleName)
    .replace(/\{\{brokerage_name\}\}/g, sampleName)
      .replace(/\{\{project_name\}\}/g, "Citi Developer")
    .replace(/jbj\.ae/gi, "JBJ.AE")
    .replace(/JBJ Global Real Estate/g, "JBJ GLOBAL REAL ESTATE");
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
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [audienceSearch, setAudienceSearch] = useState("");
  const [testEmail, setTestEmail] = useState("infoo.jane@gmail.com");
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setSelectedTemplateId(null);
    setAudienceSearch("");
    Promise.all([loadRecipients(kind), loadTemplates(kind)])
      .then(([r, t]) => {
        if (cancelled) return;
        setRecipients(r);
        setTemplates(t);
        setSelectedTemplateId(t[0]?.variant ?? null);
        const firstTemplate = t[0] ?? null;
        const defaultAudience = isDeveloperRegistrationCampaign(kind, firstTemplate)
          ? r.filter((x) => x.registrationStatus !== "registered")
          : r;
        setSelectedIds(new Set(defaultAudience.map((x) => x.id)));
      })
      .catch((e) => {
        if (cancelled) return;
        const message = e?.message || "Could not load templates and audience.";
        setLoadError(message);
        toast.error(message);
        setRecipients([]);
        setTemplates([]);
        setSelectedIds(new Set());
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, kind]);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.variant === selectedTemplateId) || null,
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
  const previewRecipient = useMemo(
    () => recipients.find((r) => selectedIds.has(r.id)) || recipients[0] || null,
    [recipients, selectedIds]
  );
  const previewRecipientName = previewRecipient?.name || (kind === "developers" ? "Developer Team" : "Brokerage Team");
  const sender = SENDER_BY_KIND[kind];

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
      const sampleName = kind === "developers" ? "Test Developer" : "Test Brokerage";
      const functionName = kind === "developers" ? "crm-send-developer-registration" : "crm-send-brokerage-outreach";
      const body = kind === "developers"
        ? { variant: selectedTemplate.variant, testRecipient: testEmail.trim(), testDeveloperName: sampleName, subjectOverride: `[TEST] ${personalizeSubject(selectedTemplate.subject, sampleName)}` }
        : { variant: selectedTemplate.variant, testRecipient: testEmail.trim(), testBrokerageName: sampleName, subjectOverride: `[TEST] ${personalizeSubject(selectedTemplate.subject, sampleName)}` };
      const { error, data } = await (supabase as any).functions.invoke(functionName, { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.message || data.error);
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
      `Send "${selectedTemplate.name}" live to ${audienceCount} ${kind}?\n\nThis will be delivered from ${sender.email}. This action is logged.`
    );
    if (!ok) return;
    const selectedRecipients = recipients.filter((r) => selectedIds.has(r.id) && r.email);
    setSending(true);
    try {
      for (const r of selectedRecipients.slice(0, 50)) {
        const functionName = kind === "developers" ? "crm-send-developer-registration" : "crm-send-brokerage-outreach";
        const body = kind === "developers"
          ? { developerId: r.id, variant: selectedTemplate.variant, overrideEmail: r.email, silent: true }
          : { brokerageId: r.id, variant: selectedTemplate.variant, overrideEmail: r.email, silent: true };
        const { error, data } = await (supabase as any).functions.invoke(functionName, { body });
        if (error) throw error;
        if (data?.error) throw new Error(data.message || data.error);
      }
      toast.success(`Queued ${selectedRecipients.length} ${kind} for "${selectedTemplate.name}".`);
    } catch (e: any) {
      toast.error(`Live send failed: ${e?.message || "unknown error"}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        data-branded-email-panel="true"
        data-no-contrast-guard="true"
        data-ink-emerald-opt-out="true"
        className="w-full sm:max-w-5xl p-0 flex flex-col bg-white"
      >
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

        <div className="flex-1 overflow-auto px-6 py-5">
          <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-5 items-start">
          <div className="space-y-5">
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
                    const active = t.variant === selectedTemplateId;
                  return (
                    <button
                      key={t.variant}
                      type="button"
                      onClick={() => setSelectedTemplateId(t.variant)}
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
                  WebkitTextFillColor: allSelected ? "#FFFFFF" : "#064E3B",
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
                  WebkitTextFillColor: "#064E3B",
                  border: "1px solid rgba(6,78,59,0.4)",
                  whiteSpace: "nowrap",
                }}
              >
                Clear
              </button>
              <div className="relative flex-1 min-w-[220px]">
                    <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#064E3B]" />
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
            {loadError ? (
              <div className="p-8 text-center text-[#7A1F1F] border border-dashed border-red-900/20 rounded-lg bg-red-50">
                {loadError}
              </div>
            ) : loading ? (
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
                            {kind === "developers" ? (
                              <DeveloperLogo
                                src={r.logoUrl}
                                alt={`${r.name} logo`}
                                name={r.name}
                                websiteUrl={r.websiteUrl}
                                variant="tile"
                                className="!size-8 !rounded-md !border-emerald-900/15 !bg-white !p-1"
                              />
                            ) : (
                              <span className="inline-flex items-center justify-center size-8 rounded-md bg-white border border-emerald-900/10 overflow-hidden shrink-0">
                                <span className="text-[10px] font-black text-[#064E3B]">{initialsOf(r.name)}</span>
                              </span>
                            )}
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
          </div>

          <div className="space-y-5">
          {/* STEP 3 · PREVIEW */}
          <section>
            <StepHeader n={3} label="Preview" Icon={Eye} />
            {selectedTemplate ? (
              <div className="border rounded-lg bg-white overflow-hidden shadow-[0_20px_55px_-42px_rgba(6,78,59,0.45)]" style={{ borderColor: "rgba(184,149,85,0.5)" }}>
                <div className="px-5 py-4 border-b bg-[#F8FAF9]" style={{ borderColor: "rgba(184,149,85,0.35)" }}>
                  <p className="text-[11px] text-[#4B5D55] uppercase tracking-wider">Subject</p>
                  <p className="font-bold text-[#0F1A16]">
                    {personalizeSubject(selectedTemplate.subject, previewRecipientName)}
                  </p>
                  <p className="text-[11px] text-[#4B5D55] mt-1">
                    Template: <span className="text-[#064E3B] font-semibold">{selectedTemplate.name}</span>
                  </p>
                </div>
                <ScrollArea className="h-[min(68vh,720px)]">
                  <div
                    className="p-4 md:p-8 prose prose-sm max-w-none text-[#0F1A16] [&_*]:!max-w-full [&_a]:!text-[#0a0a0a] [&_a]:!font-bold [&_a]:underline [&_a]:decoration-[#B89555]"
                    dangerouslySetInnerHTML={{ __html: personalizeTemplate(selectedTemplate.html, previewRecipientName) }}
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
                <li><strong>From:</strong> {sender.name}, {sender.title} &lt;{sender.email}&gt;</li>
                <li><strong>Registration pack:</strong> saved link included in the template</li>
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
                    background: "#064E3B", color: "#FFFFFF",
                    WebkitTextFillColor: "#FFFFFF",
                    border: "1px solid #064E3B",
                    whiteSpace: "nowrap",
                    cursor: sending || !selectedTemplate ? "not-allowed" : "pointer",
                    opacity: sending || !selectedTemplate ? 0.5 : 1,
                  }}
                >
                  {sending ? <Loader2 className="size-4 animate-spin" style={{ color: "#FFFFFF", stroke: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }} /> : <Send className="size-4" style={{ color: "#FFFFFF", stroke: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }} />}
                  Send test
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSendLive}
              disabled={sending || !selectedTemplate || audienceCount === 0}
              data-branded-email-live-action="true"
              style={{
                width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                minHeight: 48, padding: "12px 16px", borderRadius: 6, fontSize: 14, fontWeight: 800,
                background: "#064E3B", color: "#FFFFFF",
                WebkitTextFillColor: "#FFFFFF",
                border: "1px solid #064E3B",
                cursor: sending || !selectedTemplate || audienceCount === 0 ? "not-allowed" : "pointer",
                opacity: sending || !selectedTemplate || audienceCount === 0 ? 0.5 : 1,
              }}
            >
              <Send className="size-4" style={{ color: "#FFFFFF", stroke: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }} />
              {sending ? "Sending…" : `Send live to ${audienceCount} ${kind}`}
            </button>

            <p className="text-xs text-[#4B5D55]">
              Test sends immediately to the address above. Live send goes through the locked outreach pipeline — you'll be asked to confirm before delivery.
            </p>
          </section>
          </div>
          </div>
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

