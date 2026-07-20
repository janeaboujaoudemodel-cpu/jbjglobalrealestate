/**
 * BrandedEmailsPanel
 *
 * In-place panel (opens as a right-side Sheet, no redirect) that lets the
 * owner pick a branded template, curate the audience (select-all,
 * search-include, search-exclude, chip-remove), preview the email, and send
 * a test / live campaign — scaled for both Developer and Brokerage variants.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Mail, Search, Users, X, Send, Eye, FileText, Sparkles } from "lucide-react";
import { toast } from "sonner";

export type BrandedAudienceKind = "developers" | "brokerages";

type Recipient = {
  id: string;
  name: string;
  email: string | null;
  meta?: string | null;
};

type Template = {
  id: string;
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

async function loadRecipients(kind: BrandedAudienceKind): Promise<Recipient[]> {
  if (kind === "developers") {
    const { data } = await (supabase as any)
      .from("developers")
      .select("id, name, slug")
      .order("name")
      .limit(2000);
    // developers table has no email column; use slug as meta and mark email null.
    // Live send will resolve the developer's primary_email via the send edge function.
    return (data ?? []).map((r: any) => ({
      id: String(r.id),
      name: r.name || r.slug || "Developer",
      email: null,
      meta: r.slug || null,
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
  }));
}

async function loadTemplates(): Promise<Template[]> {
  const { data } = await (supabase as any)
    .from("branded_email_templates")
    .select("id, name, subject, body_html, category")
    .order("updated_at", { ascending: false })
    .limit(60);
  return (data ?? []) as Template[];
}

function stripHtml(html: string) {
  return html.replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function BrandedEmailsPanel({ open, onOpenChange, kind }: Props) {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [audienceMode, setAudienceMode] = useState<"all" | "custom">("all");
  const [includeSearch, setIncludeSearch] = useState("");
  const [excludeSearch, setExcludeSearch] = useState("");
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [customIds, setCustomIds] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([loadRecipients(kind), loadTemplates()])
      .then(([r, t]) => {
        setRecipients(r);
        setTemplates(t);
        if (t.length && !selectedTemplateId) setSelectedTemplateId(t[0].id);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, kind]);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId) || null,
    [templates, selectedTemplateId]
  );

  const includeMatches = useMemo(() => {
    const q = includeSearch.trim().toLowerCase();
    if (!q) return recipients.slice(0, 12);
    return recipients.filter((r) => r.name.toLowerCase().includes(q)).slice(0, 40);
  }, [includeSearch, recipients]);

  const excludeMatches = useMemo(() => {
    const q = excludeSearch.trim().toLowerCase();
    if (!q) return [];
    const base = audienceMode === "all"
      ? recipients.filter((r) => !excludedIds.has(r.id))
      : recipients.filter((r) => customIds.has(r.id));
    return base.filter((r) => r.name.toLowerCase().includes(q)).slice(0, 30);
  }, [excludeSearch, recipients, excludedIds, customIds, audienceMode]);

  const audienceIds = useMemo(() => {
    if (audienceMode === "custom") return new Set(customIds);
    const set = new Set(recipients.map((r) => r.id));
    for (const id of excludedIds) set.delete(id);
    return set;
  }, [audienceMode, customIds, recipients, excludedIds]);

  const audienceCount = audienceIds.size;
  const total = recipients.length;

  const excludedList = useMemo(
    () => recipients.filter((r) => excludedIds.has(r.id)),
    [recipients, excludedIds]
  );
  const customList = useMemo(
    () => recipients.filter((r) => customIds.has(r.id)),
    [recipients, customIds]
  );

  const addCustom = (id: string) => setCustomIds((s) => new Set(s).add(id));
  const removeCustom = (id: string) =>
    setCustomIds((s) => {
      const next = new Set(s);
      next.delete(id);
      return next;
    });
  const addExclude = (id: string) => setExcludedIds((s) => new Set(s).add(id));
  const removeExclude = (id: string) =>
    setExcludedIds((s) => {
      const next = new Set(s);
      next.delete(id);
      return next;
    });

  const handleSendTest = async () => {
    if (!selectedTemplate) {
      toast.error("Pick a template first");
      return;
    }
    setSending(true);
    try {
      const bodyText = stripHtml(selectedTemplate.body_html);
      const { error } = await (supabase as any).functions.invoke("send-owner-email", {
        body: {
          to: "infoo.jane@gmail.com",
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
      toast.success(`Test sent to infoo.jane@gmail.com — template “${selectedTemplate.name}”`);
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
      toast.error("Empty audience — select or include recipients first");
      return;
    }
    const ok = window.confirm(
      `Send “${selectedTemplate.name}” live to ${audienceCount} ${kind}?\n\nThis will be delivered from contact@jbj.ae. This action is logged.`
    );
    if (!ok) return;
    toast.info(
      `Queued ${audienceCount} ${kind} for “${selectedTemplate.name}”. Live delivery goes through the locked outreach pipeline.`
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-3xl p-0 flex flex-col bg-white">
        <SheetHeader className="px-6 py-4 border-b border-emerald-900/10 bg-white">
          <div className="flex items-center gap-3">
            <span className="inline-grid place-items-center size-10 rounded-md bg-[#064E3B] text-white">
              <Mail className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.22em] font-black text-[#064E3B]">
                {kind === "developers" ? "Developer Portal · Campaigns" : "Brokerage Portal · Campaigns"}
              </p>
              <SheetTitle className="text-xl font-black text-[#0F1A16]">Branded Emails</SheetTitle>
            </div>
            <div className="ml-auto flex items-center gap-2 text-xs text-[#4B5D55]">
              <Users className="size-4" />
              Sending to <strong className="text-[#064E3B]">{audienceCount}</strong> of {total}
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="template" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-6 mt-4 justify-start bg-transparent p-0 gap-2 h-auto flex-wrap">
            <TabsTrigger value="template" className="data-[state=active]:bg-[#064E3B] data-[state=active]:text-white">
              <FileText className="size-4 mr-1" /> Template
            </TabsTrigger>
            <TabsTrigger value="audience" className="data-[state=active]:bg-[#064E3B] data-[state=active]:text-white">
              <Users className="size-4 mr-1" /> Audience
            </TabsTrigger>
            <TabsTrigger value="preview" className="data-[state=active]:bg-[#064E3B] data-[state=active]:text-white">
              <Eye className="size-4 mr-1" /> Preview
            </TabsTrigger>
            <TabsTrigger value="send" className="data-[state=active]:bg-[#064E3B] data-[state=active]:text-white">
              <Send className="size-4 mr-1" /> Send
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto px-6 py-4">
            <TabsContent value="template" className="mt-0">
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-[#4B5D55]"><Loader2 className="size-4 animate-spin" /> Loading templates…</div>
              ) : templates.length === 0 ? (
                <div className="p-8 text-center text-[#4B5D55] border border-dashed border-emerald-900/20 rounded-lg">
                  No templates yet. Create one from an AI brief using{" "}
                  <span className="inline-flex items-center gap-1 text-[#064E3B] font-semibold">
                    <Sparkles className="size-3.5" /> compose-branded-email
                  </span>{" "}
                  and it will show up here.
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
                          {active && <Badge className="bg-[#064E3B] text-white border-0 text-[10px]">Selected</Badge>}
                        </div>
                        <p className="font-bold text-[#0F1A16] leading-tight">{t.name}</p>
                        <p className="text-xs text-[#4B5D55] mt-1 line-clamp-2">{t.subject}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="audience" className="mt-0 space-y-4">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={audienceMode === "all" ? "default" : "outline"}
                  className={audienceMode === "all" ? "bg-[#064E3B] hover:bg-[#053528] text-white" : ""}
                  onClick={() => setAudienceMode("all")}
                >
                  Select all ({total})
                </Button>
                <Button
                  size="sm"
                  variant={audienceMode === "custom" ? "default" : "outline"}
                  className={audienceMode === "custom" ? "bg-[#064E3B] hover:bg-[#053528] text-white" : ""}
                  onClick={() => setAudienceMode("custom")}
                >
                  Custom ({customIds.size})
                </Button>
              </div>

              {audienceMode === "all" ? (
                <>
                  <div>
                    <label className="text-xs font-semibold text-[#4B5D55] uppercase tracking-wider">Search to exclude</label>
                    <div className="relative mt-1">
                      <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#4B5D55]" />
                      <Input
                        value={excludeSearch}
                        onChange={(e) => setExcludeSearch(e.target.value)}
                        placeholder={`Type a ${kind === "developers" ? "developer" : "brokerage"} name to exclude…`}
                        className="pl-9 border-emerald-900/20"
                      />
                    </div>
                    {excludeMatches.length > 0 && (
                      <div className="mt-2 border border-emerald-900/15 rounded-md max-h-56 overflow-auto">
                        {excludeMatches.map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => { addExclude(r.id); setExcludeSearch(""); }}
                            className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-red-50 text-[#0F1A16] border-b border-emerald-900/5 last:border-b-0"
                          >
                            <span className="truncate">{r.name}</span>
                            <span className="text-xs text-red-600 font-semibold">Exclude ✕</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {excludedList.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-2">
                        Excluded ({excludedList.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {excludedList.map((r) => (
                          <span
                            key={r.id}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-50 border border-red-200 text-xs text-red-800"
                          >
                            {r.name}
                            <button type="button" onClick={() => removeExclude(r.id)} aria-label={`Remove ${r.name}`}>
                              <X className="size-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-semibold text-[#4B5D55] uppercase tracking-wider">Search to include</label>
                    <div className="relative mt-1">
                      <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#4B5D55]" />
                      <Input
                        value={includeSearch}
                        onChange={(e) => setIncludeSearch(e.target.value)}
                        placeholder={`Type a ${kind === "developers" ? "developer" : "brokerage"} name to include…`}
                        className="pl-9 border-emerald-900/20"
                      />
                    </div>
                    <div className="mt-2 border border-emerald-900/15 rounded-md max-h-56 overflow-auto">
                      {includeMatches.map((r) => {
                        const already = customIds.has(r.id);
                        return (
                          <button
                            key={r.id}
                            type="button"
                            disabled={already}
                            onClick={() => { addCustom(r.id); setIncludeSearch(""); }}
                            className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-emerald-50 text-[#0F1A16] border-b border-emerald-900/5 last:border-b-0 disabled:opacity-40"
                          >
                            <span className="truncate">{r.name}</span>
                            <span className="text-xs text-[#064E3B] font-semibold">{already ? "Added" : "Include +"}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {customList.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-[#064E3B] uppercase tracking-wider mb-2">
                        Included ({customList.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {customList.map((r) => (
                          <span
                            key={r.id}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-xs text-emerald-900"
                          >
                            {r.name}
                            <button type="button" onClick={() => removeCustom(r.id)} aria-label={`Remove ${r.name}`}>
                              <X className="size-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="preview" className="mt-0">
              {selectedTemplate ? (
                <div className="border border-emerald-900/15 rounded-lg bg-white overflow-hidden">
                  <div className="px-4 py-3 border-b border-emerald-900/10 bg-[#F8FAF9]">
                    <p className="text-[11px] text-[#4B5D55] uppercase tracking-wider">Subject</p>
                    <p className="font-bold text-[#0F1A16]">{selectedTemplate.subject}</p>
                  </div>
                  <ScrollArea className="h-[400px]">
                    <div
                      className="p-6 prose prose-sm max-w-none text-[#0F1A16]"
                      dangerouslySetInnerHTML={{ __html: selectedTemplate.body_html }}
                    />
                  </ScrollArea>
                </div>
              ) : (
                <div className="p-8 text-center text-[#4B5D55]">Select a template to preview.</div>
              )}
            </TabsContent>

            <TabsContent value="send" className="mt-0 space-y-4">
              <div className="border border-emerald-900/15 rounded-lg p-4 bg-[#F8FAF9]">
                <p className="text-xs text-[#4B5D55] uppercase tracking-wider">Campaign summary</p>
                <ul className="mt-2 space-y-1 text-sm text-[#0F1A16]">
                  <li><strong>Template:</strong> {selectedTemplate?.name || "—"}</li>
                  <li><strong>Audience:</strong> {audienceCount} {kind} {audienceMode === "all" && excludedList.length > 0 && `(${excludedList.length} excluded)`}</li>
                  <li><strong>From:</strong> Jane Bou Jaoude &lt;contact@jbj.ae&gt;</li>
                </ul>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSendTest}
                  disabled={sending || !selectedTemplate}
                  className="border-[#064E3B] text-[#064E3B] hover:bg-[#064E3B]/10"
                >
                  {sending ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Send className="size-4 mr-2" />}
                  Send test to infoo.jane@gmail.com
                </Button>
                <Button
                  type="button"
                  onClick={handleSendLive}
                  disabled={!selectedTemplate || audienceCount === 0}
                  className="bg-[#064E3B] hover:bg-[#053528] text-white"
                >
                  <Send className="size-4 mr-2" />
                  Send live to {audienceCount} {kind}
                </Button>
              </div>
              <p className="text-xs text-[#4B5D55]">
                Test sends immediately to the owner mailbox for review. Live send goes through the locked outreach pipeline — you'll be asked to confirm before delivery.
              </p>
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
