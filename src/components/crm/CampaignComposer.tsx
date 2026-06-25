/**
 * CampaignComposer
 *
 * Build a Resend-powered email campaign targeted at a smart segment of
 * crm_leads. Live audience preview shows deliverable count, suppressed
 * count, and the company breakdown (so the single-agency rule can be
 * verified before sending). Adds quota meter, sender-domain guard, and
 * save-as-segment.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Send, Eye, AlertTriangle, Save, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useEmailQuota } from "@/hooks/useEmailQuota";

interface SegmentFilter {
  contact_type?: string[];
  pipeline_stage?: string[];
  lead_intent?: string[];
  source?: string[];
  tags_any?: string[];
  company_name?: string[];
  preferred_language?: string[];
  vip?: boolean;
  has_email?: boolean;
  exclude_suppressed?: boolean;
  search?: string;
}

interface ResolveResult {
  deliverable_count: number;
  skipped_suppressed_count: number;
  companies: { name: string; count: number }[];
  distinct_companies: number;
  recipients: any[];
}

const DEFAULT_FILTER: SegmentFilter = {
  has_email: true,
  exclude_suppressed: true,
};

const ALLOWED_DOMAIN = "jbj.ae";
const CONTACT_TYPES = ["investor", "broker", "developer", "client", "vendor", "other"];

export default function CampaignComposer({ onSent }: { onSent?: () => void }) {
  const [segments, setSegments] = useState<{ id: string; name: string; filter: any }[]>([]);
  const [segmentId, setSegmentId] = useState<string>("");
  const [filter, setFilter] = useState<SegmentFilter>(DEFAULT_FILTER);

  // Facet options pulled from the live DB so the builder reflects real data.
  const [facets, setFacets] = useState<{
    pipeline_stage: string[];
    tags: string[];
    company: string[];
    source: string[];
    language: string[];
  }>({ pipeline_stage: [], tags: [], company: [], source: [], language: [] });

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("<p>Hi {{lead.full_name}},</p>\n<p></p>");
  const [senderEmail, setSenderEmail] = useState("CitiDevelopers@jbj.ae");
  const [senderName, setSenderName] = useState("CITI Developers");
  const [replyTo, setReplyTo] = useState("");
  const [allowMultiCompany, setAllowMultiCompany] = useState(false);
  const [maxSend, setMaxSend] = useState(500);
  const [testRecipient, setTestRecipient] = useState("");

  const [preview, setPreview] = useState<ResolveResult | null>(null);
  const [resolving, setResolving] = useState(false);
  const [sending, setSending] = useState(false);
  const [savingSegment, setSavingSegment] = useState(false);

  const quota = useEmailQuota();

  useEffect(() => {
    supabase.from("crm_segments").select("id, name, filter").order("name")
      .then(({ data }) => setSegments(data ?? []));
    void loadFacets();
  }, []);

  async function loadFacets() {
    // Pull a wide-ish slice to derive distinct values cheaply.
    const { data: leads = [] } = await supabase
      .from("crm_leads")
      .select("pipeline_stage, tags, company_name, source, preferred_language")
      .is("deleted_at", null)
      .limit(2000);
    const u = (xs: (string | null | undefined)[]) =>
      Array.from(new Set(xs.filter((x): x is string => !!x && x.trim() !== ""))).sort();
    const tagAll: string[] = [];
    for (const r of leads ?? []) for (const t of (r as any).tags ?? []) if (t) tagAll.push(t);
    const { data: brks = [] } = await supabase
      .from("crm_brokerages").select("company_name").limit(500);
    const { data: devs = [] } = await supabase
      .from("crm_developer_registry").select("developer_name").limit(500);
    setFacets({
      pipeline_stage: u((leads ?? []).map((r: any) => r.pipeline_stage)),
      tags: u(tagAll),
      company: u([
        ...(leads ?? []).map((r: any) => r.company_name),
        ...(brks ?? []).map((r: any) => r.company_name),
        ...(devs ?? []).map((r: any) => r.developer_name),
      ]),
      source: u((leads ?? []).map((r: any) => r.source)),
      language: u((leads ?? []).map((r: any) => r.preferred_language)),
    });
  }

  // Re-resolve preview whenever filter / segment changes (debounced)
  useEffect(() => {
    const t = setTimeout(() => void resolvePreview(), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filter), segmentId]);

  async function resolvePreview() {
    setResolving(true);
    try {
      const { data, error } = await supabase.functions.invoke("crm-resolve-segment", {
        body: { segment_id: segmentId || undefined, filter, mode: "sample", limit: 50 },
      });
      if (error) throw error;
      setPreview(data as ResolveResult);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to resolve segment");
    } finally {
      setResolving(false);
    }
  }

  const violatesSingleAgency = useMemo(
    () => !allowMultiCompany && (preview?.distinct_companies ?? 0) > 1,
    [allowMultiCompany, preview],
  );

  const senderDomainOk = useMemo(
    () => senderEmail.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`),
    [senderEmail],
  );

  const quotaBlocked = !quota.unlimited && quota.sentToday >= quota.dailyLimit;
  const quotaPct = Math.min(100, Math.round((quota.sentToday / Math.max(1, quota.dailyLimit)) * 100));
  const quotaTone =
    quotaPct >= 100 ? "bg-red-600" : quotaPct >= 80 ? "bg-amber-500" : "jj-surface-emerald";

  async function createCampaignRow() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not signed in");
    const { data, error } = await supabase.from("crm_email_campaigns").insert({
      user_id: user.id,
      name: name || subject || "Untitled campaign",
      subject,
      html_content: html,
      sender_email: senderEmail,
      sender_name: senderName,
      reply_to: replyTo || senderEmail,
      segment_id: segmentId || null,
      segment_filter: filter as any,
      status: "draft",
    }).select().single();
    if (error) throw error;
    return data;
  }

  async function sendTest() {
    if (!testRecipient) return toast.error("Add a test recipient");
    if (!subject || !html) return toast.error("Subject and body required");
    if (!senderDomainOk) return toast.error(`Sender must be @${ALLOWED_DOMAIN}`);
    setSending(true);
    try {
      const campaign = await createCampaignRow();
      const { data, error } = await supabase.functions.invoke("crm-send-campaign", {
        body: { campaign_id: campaign.id, test_recipient: testRecipient },
      });
      if (error) throw error;
      if ((data as any).sent) toast.success(`Test sent to ${testRecipient}`);
      else toast.error(`Test failed: ${JSON.stringify((data as any).errors)}`);
      void quota.refresh();
    } catch (e: any) {
      toast.error(e.message ?? "Send failed");
    } finally {
      setSending(false);
    }
  }

  async function sendCampaign() {
    if (!subject || !html) return toast.error("Subject and body required");
    if (!senderDomainOk) return toast.error(`Sender must be @${ALLOWED_DOMAIN}`);
    if (!preview?.deliverable_count) return toast.error("Audience is empty");
    if (violatesSingleAgency) {
      return toast.error("Single-agency rule: audience spans multiple companies");
    }
    if (quotaBlocked) return toast.error("Daily Resend quota reached");
    if (!confirm(`Send to ${preview.deliverable_count} recipients?`)) return;
    setSending(true);
    try {
      const campaign = await createCampaignRow();
      const { data, error } = await supabase.functions.invoke("crm-send-campaign", {
        body: {
          campaign_id: campaign.id,
          segment_id: segmentId || undefined,
          filter,
          allow_multi_company: allowMultiCompany,
          max_send: maxSend,
        },
      });
      if (error) throw error;
      const r = data as any;
      toast.success(`Sent ${r.sent} • Failed ${r.failed}${r.quota_blocked ? " • Quota blocked" : ""}`);
      void quota.refresh();
      onSent?.();
    } catch (e: any) {
      toast.error(e.message ?? "Send failed");
    } finally {
      setSending(false);
    }
  }

  async function saveAsSegment() {
    const segName = window.prompt("Save segment as:", name || "New segment");
    if (!segName) return;
    setSavingSegment(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.from("crm_segments").insert({
        name: segName,
        filter: filter as any,
        created_by: user?.id ?? null,
      } as any).select("id, name, filter").single();
      if (error) throw error;
      setSegments((s) => [...s, data as any]);
      setSegmentId((data as any).id);
      toast.success("Segment saved");
    } catch (e: any) {
      toast.error(e.message ?? "Could not save segment");
    } finally {
      setSavingSegment(false);
    }
  }

  const updateArrayField = (k: keyof SegmentFilter, value: string) => {
    const arr = value.split(",").map((s) => s.trim()).filter(Boolean);
    setFilter((f) => ({ ...f, [k]: arr.length ? arr : undefined }));
  };

  const toggleInArray = (k: keyof SegmentFilter, v: string) => {
    setFilter((f) => {
      const cur = ((f[k] as string[] | undefined) ?? []).slice();
      const i = cur.indexOf(v);
      if (i >= 0) cur.splice(i, 1); else cur.push(v);
      return { ...f, [k]: cur.length ? cur : undefined };
    });
  };

  const ChipRow = ({
    fkey, options, label,
  }: { fkey: keyof SegmentFilter; options: string[]; label: string }) => {
    const selected = (filter[fkey] as string[] | undefined) ?? [];
    if (!options.length) return null;
    return (
      <div className="space-y-1">
        <Label className="text-xs">{label}</Label>
        <div className="flex flex-wrap gap-1">
          {options.slice(0, 30).map((o) => {
            const on = selected.includes(o);
            return (
              <button
                key={o}
                type="button"
                onClick={() => toggleInArray(fkey, o)}
                className={
                  "inline-flex items-center justify-center text-center min-h-7 max-w-full overflow-hidden text-[11px] px-2.5 py-1 rounded-full border transition " +
                  (on
                    ? "jj-surface-emerald border-transparent !text-white"
                    : "bg-transparent border-[#B89555]/40 text-[#1A1A1A]/70 hover:border-[#B89555]")
                }
                data-surface={on ? "emerald" : undefined}
                data-emerald-ok={on ? "pill" : undefined}
              >
                <span className="truncate">{o}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-5 items-start">
      {/* Composer */}
      <Card className="lg:col-span-2 p-5 space-y-4">
        <div className="space-y-2">
          <Label>Campaign name (internal)</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Q2 brokerage outreach" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>From name</Label>
            <Input value={senderName} onChange={(e) => setSenderName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>From email</Label>
            <Input value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} />
          </div>
        </div>

        {!senderDomainOk && (
          <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 p-2 rounded border border-red-200">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Sender must be on the verified <code>@{ALLOWED_DOMAIN}</code> domain
              or Resend will reject the send.
            </span>
          </div>
        )}

        <div className="space-y-2">
          <Label>Reply-to (optional)</Label>
          <Input value={replyTo} onChange={(e) => setReplyTo(e.target.value)} placeholder={senderEmail} />
        </div>

        <div className="space-y-2">
          <Label>Subject</Label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)}
            placeholder="Hello {{lead.full_name}}" />
        </div>

        <div className="space-y-2">
          <Label>HTML body</Label>
          <Textarea rows={12} value={html} onChange={(e) => setHtml(e.target.value)}
            className="font-mono text-xs" />
          <p className="text-xs text-[#1A1A1A]/60">
            Variables: <code>{"{{lead.full_name}}"}</code>, <code>{"{{lead.company_name}}"}</code>, <code>{"{{lead.email_lower}}"}</code>
          </p>
        </div>

        <div className="rounded-2xl border border-[#B89555]/35 bg-[#F7F2EA]/70 p-3 flex flex-col sm:flex-row sm:items-center gap-3 pt-3">
          <Input placeholder="test@example.com" value={testRecipient}
            onChange={(e) => setTestRecipient(e.target.value)} className="min-w-0 flex-1" />
          <Button onClick={sendTest} disabled={sending} className="sm:w-[150px] shrink-0">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4 mr-1" />}
            Send test
          </Button>
        </div>
      </Card>

      {/* Audience panel */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-[#1A1A1A]">Audience</h3>
            <p className="text-xs text-[#1A1A1A]/60">From <code>crm_leads</code></p>
          </div>
          <Button size="sm" onClick={saveAsSegment} disabled={savingSegment} className="shrink-0">
            {savingSegment ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
            Save segment
          </Button>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Saved segment</Label>
          <Select value={segmentId || "none"} onValueChange={(v) => setSegmentId(v === "none" ? "" : v)}>
            <SelectTrigger><SelectValue placeholder="None — use filter below" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None — use filter below</SelectItem>
              {segments.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <ChipRow fkey="contact_type" options={CONTACT_TYPES} label="Contact type" />
        <ChipRow fkey="pipeline_stage" options={facets.pipeline_stage} label="Pipeline stage" />
        <ChipRow fkey="tags_any" options={facets.tags} label="Tags (any of)" />
        <ChipRow fkey="source" options={facets.source} label="Source" />
        <ChipRow fkey="preferred_language" options={facets.language} label="Language" />

        <div className="space-y-1">
          <Label className="text-xs">Company / brokerage</Label>
          <Input
            list="campaign-company-options"
            value={(filter.company_name ?? []).join(", ")}
            onChange={(e) => updateArrayField("company_name", e.target.value)}
            placeholder="Pick or type, comma-separated"
          />
          <datalist id="campaign-company-options">
            {facets.company.slice(0, 200).map((c) => <option key={c} value={c} />)}
          </datalist>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Search</Label>
          <Input value={filter.search ?? ""} onChange={(e) =>
            setFilter((f) => ({ ...f, search: e.target.value || undefined }))} />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#B89555]/40">
          <Label className="text-xs">VIP only</Label>
          <Switch checked={!!filter.vip} onCheckedChange={(v) =>
            setFilter((f) => ({ ...f, vip: v || undefined }))} />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-xs">Exclude suppressed</Label>
          <Switch checked={filter.exclude_suppressed !== false} onCheckedChange={(v) =>
            setFilter((f) => ({ ...f, exclude_suppressed: v }))} />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-xs">Allow multiple companies</Label>
          <Switch checked={allowMultiCompany} onCheckedChange={setAllowMultiCompany} />
        </div>

        {/* Preview block */}
        <div className="rounded-md bg-[#EFE6D6] p-3 space-y-2 border border-[#B89555]/40">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Deliverable</span>
            <span className="text-2xl font-semibold tabular-nums">
              {resolving ? <Loader2 className="w-4 h-4 animate-spin inline" /> : (preview?.deliverable_count ?? 0)}
            </span>
          </div>
          {!!preview?.skipped_suppressed_count && (
            <Badge variant="outline" className="text-[10px]">
              {preview.skipped_suppressed_count} suppressed (skipped)
            </Badge>
          )}
          {!!preview?.companies?.length && (
            <div>
              <div className="text-xs text-[#1A1A1A]/70 mb-1">Companies in audience</div>
              <div className="flex flex-wrap gap-1">
                {preview.companies.slice(0, 6).map((c) => (
                  <Badge key={c.name} variant="outline" className="text-[10px]">
                    {c.name} · {c.count}
                  </Badge>
                ))}
                {preview.companies.length > 6 && (
                  <Badge variant="outline" className="text-[10px]">+{preview.companies.length - 6}</Badge>
                )}
              </div>
            </div>
          )}
          {violatesSingleAgency && (
            <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 p-2 rounded border border-red-200">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Single-agency rule: audience spans {preview?.distinct_companies} companies.
                Narrow the filter or enable "Allow multiple companies".
              </span>
            </div>
          )}
        </div>

        {/* Resend quota meter */}
        <div className="rounded-md bg-[#F7F2EA] p-3 space-y-2 border border-[#B89555]/40">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">Resend quota — today</span>
            <span className="tabular-nums">
              {quota.sentToday} / {quota.unlimited ? "∞" : quota.dailyLimit}
            </span>
          </div>
          <div className="h-1.5 w-full bg-[#EFE6D6] rounded">
            <div
              className={`h-full rounded transition-all ${quotaTone}`}
              style={{ width: `${quota.unlimited ? 4 : quotaPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#1A1A1A]/70">
            <span>Month: {quota.sentMonth} / {quota.unlimited ? "∞" : quota.monthlyLimit}</span>
            <span>Plan: {quota.plan}</span>
          </div>
          {quotaBlocked && (
            <div className="text-xs text-red-700">Daily quota reached — sends blocked until tomorrow.</div>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Max recipients (safety cap)</Label>
          <Input type="number" min={1} max={2000} value={maxSend}
            onChange={(e) => setMaxSend(Math.max(1, Number(e.target.value) || 1))} />
        </div>

        <Button
          onClick={sendCampaign}
          disabled={
            sending || resolving || !preview?.deliverable_count ||
            violatesSingleAgency || !senderDomainOk || quotaBlocked
          }
          className="w-full"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />}
          Send to {preview?.deliverable_count ?? 0}
        </Button>
      </Card>
    </div>
  );
}
