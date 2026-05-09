/**
 * CampaignComposer
 *
 * Build a Resend-powered email campaign targeted at a smart segment of
 * crm_leads. Live audience preview shows deliverable count, suppressed
 * count, and the company breakdown (so the single-agency rule can be
 * verified before sending).
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
import { Loader2, Send, Eye, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

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

export default function CampaignComposer({ onSent }: { onSent?: () => void }) {
  const [segments, setSegments] = useState<{ id: string; name: string; filter: any }[]>([]);
  const [segmentId, setSegmentId] = useState<string>("");
  const [filter, setFilter] = useState<SegmentFilter>(DEFAULT_FILTER);

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("<p>Hi {{lead.full_name}},</p>\n<p></p>");
  const [senderEmail, setSenderEmail] = useState("noreply@jbj.ae");
  const [senderName, setSenderName] = useState("JBJ GLOBAL REAL ESTATE");
  const [replyTo, setReplyTo] = useState("");
  const [allowMultiCompany, setAllowMultiCompany] = useState(false);
  const [maxSend, setMaxSend] = useState(500);
  const [testRecipient, setTestRecipient] = useState("");

  const [preview, setPreview] = useState<ResolveResult | null>(null);
  const [resolving, setResolving] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    supabase.from("crm_segments").select("id, name, filter").order("name")
      .then(({ data }) => setSegments(data ?? []));
  }, []);

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
    setSending(true);
    try {
      const campaign = await createCampaignRow();
      const { data, error } = await supabase.functions.invoke("crm-send-campaign", {
        body: { campaign_id: campaign.id, test_recipient: testRecipient },
      });
      if (error) throw error;
      if ((data as any).sent) toast.success(`Test sent to ${testRecipient}`);
      else toast.error(`Test failed: ${JSON.stringify((data as any).errors)}`);
    } catch (e: any) {
      toast.error(e.message ?? "Send failed");
    } finally {
      setSending(false);
    }
  }

  async function sendCampaign() {
    if (!subject || !html) return toast.error("Subject and body required");
    if (!preview?.deliverable_count) return toast.error("Audience is empty");
    if (violatesSingleAgency) {
      return toast.error("Single-agency rule: audience spans multiple companies");
    }
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
      onSent?.();
    } catch (e: any) {
      toast.error(e.message ?? "Send failed");
    } finally {
      setSending(false);
    }
  }

  const updateArrayField = (k: keyof SegmentFilter, value: string) => {
    const arr = value.split(",").map((s) => s.trim()).filter(Boolean);
    setFilter((f) => ({ ...f, [k]: arr.length ? arr : undefined }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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

        <div className="flex items-center gap-3 pt-2 border-t border-[#B89555]/40">
          <Input placeholder="test@example.com" value={testRecipient}
            onChange={(e) => setTestRecipient(e.target.value)} className="max-w-xs" />
          <Button variant="outline" onClick={sendTest} disabled={sending}>
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4 mr-1" />}
            Send test
          </Button>
        </div>
      </Card>

      {/* Audience panel */}
      <Card className="p-5 space-y-4">
        <div>
          <h3 className="font-semibold text-[#1A1A1A]">Audience</h3>
          <p className="text-xs text-[#1A1A1A]/60">From <code>crm_leads</code></p>
        </div>

        <div className="space-y-2">
          <Label>Saved segment</Label>
          <Select value={segmentId || "none"} onValueChange={(v) => setSegmentId(v === "none" ? "" : v)}>
            <SelectTrigger><SelectValue placeholder="None — use filter below" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None — use filter below</SelectItem>
              {segments.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Contact type (csv)</Label>
          <Input value={(filter.contact_type ?? []).join(", ")}
            onChange={(e) => updateArrayField("contact_type", e.target.value)}
            placeholder="client, broker, developer" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Pipeline stage (csv)</Label>
          <Input value={(filter.pipeline_stage ?? []).join(", ")}
            onChange={(e) => updateArrayField("pipeline_stage", e.target.value)}
            placeholder="new, qualified" />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Tags — any of (csv)</Label>
          <Input value={(filter.tags_any ?? []).join(", ")}
            onChange={(e) => updateArrayField("tags_any", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Company / brokerage (csv)</Label>
          <Input value={(filter.company_name ?? []).join(", ")}
            onChange={(e) => updateArrayField("company_name", e.target.value)} />
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
            <div className="text-xs text-[#1A1A1A]/70">
              {preview.skipped_suppressed_count} suppressed (skipped)
            </div>
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

        <div className="space-y-2">
          <Label className="text-xs">Max recipients (safety cap)</Label>
          <Input type="number" min={1} max={2000} value={maxSend}
            onChange={(e) => setMaxSend(Math.max(1, Number(e.target.value) || 1))} />
        </div>

        <Button
          onClick={sendCampaign}
          disabled={sending || resolving || !preview?.deliverable_count || violatesSingleAgency}
          className="w-full"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />}
          Send to {preview?.deliverable_count ?? 0}
        </Button>
      </Card>
    </div>
  );
}
