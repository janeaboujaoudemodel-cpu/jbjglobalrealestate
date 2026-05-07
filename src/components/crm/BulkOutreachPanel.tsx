/**
 * BulkOutreachPanel
 *
 * Enterprise bulk brokerage outreach launcher + live progress.
 * Mounts on /owner/crm/relationships above the analytics strip.
 *
 * - Locked sender (jane@citideveloper.com) and CC (infoo.jane@gmail.com).
 * - Editable subject + HTML template — only {{brokerage_name}} is allowed.
 * - One click ships the campaign to N brokerages via Resend (worker queue).
 * - Live progress card subscribes to outreach_bulk_jobs realtime.
 */
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Lock, Send, Loader2, Activity, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  PRIMARY_SENDER, PRIMARY_SENDER_NAME, DEFAULT_REPLY_TO, DEFAULT_CC,
} from "@/config/outreachIdentity";

interface BrokerageRow {
  id?: string;
  name: string;
  email?: string | null;
}

interface Props {
  brokerages: BrokerageRow[];
}

const DEFAULT_SUBJECT = "Partnership opportunity — {{brokerage_name}} & Citi Developers";
const DEFAULT_HTML = `<p>Dear {{brokerage_name}} team,</p>
<p>I'm reaching out from Citi Developers regarding our latest project portfolio in Dubai.</p>
<p>I'd love to set up a brief call to share our broker incentives and project pipeline.</p>
<p>Best regards,<br/>${PRIMARY_SENDER_NAME}</p>`;

export function BulkOutreachPanel({ brokerages }: Props) {
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [html, setHtml] = useState(DEFAULT_HTML);
  const [launching, setLaunching] = useState(false);
  const [activeJob, setActiveJob] = useState<any | null>(null);

  const eligible = useMemo(
    () => brokerages.filter((b) => b.email && /@/.test(b.email) && b.name?.trim()),
    [brokerages],
  );

  // Load most recent job + subscribe
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("outreach_bulk_jobs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled) setActiveJob(data);
    })();
    const ch = supabase
      .channel("outreach_bulk_jobs_panel")
      .on("postgres_changes", { event: "*", schema: "public", table: "outreach_bulk_jobs" }, (p: any) => {
        const row = p.new || p.old;
        setActiveJob((cur: any) => {
          if (!cur) return row;
          if (row.created_at >= cur.created_at) return row;
          return cur;
        });
      })
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, []);

  const validateTemplate = (): string | null => {
    if (!subject.trim()) return "Subject is required";
    if (!html.includes("{{brokerage_name}}")) return "Template must include {{brokerage_name}}";
    const bad = [...html.matchAll(/\{\{\s*([a-zA-Z_][\w]*)\s*\}\}/g)]
      .map((m) => m[1])
      .filter((v) => v !== "brokerage_name");
    if (bad.length) return `Only {{brokerage_name}} is allowed (found: ${[...new Set(bad)].join(", ")})`;
    return null;
  };

  const launch = async () => {
    const err = validateTemplate();
    if (err) { toast.error(err); return; }
    if (eligible.length === 0) { toast.error("No brokerages with valid emails selected"); return; }
    if (!confirm(`Send to ${eligible.length} brokerages from ${PRIMARY_SENDER}?\nCC: ${DEFAULT_CC}\n\nAfter approval the template is locked.`)) return;

    setLaunching(true);
    try {
      const { data, error } = await supabase.functions.invoke("outreach-bulk-create", {
        body: {
          subject,
          html_template: html,
          recipients: eligible.map((b) => ({
            brokerage_id: b.id || null,
            brokerage_name: b.name.trim(),
            email: b.email!.trim(),
          })),
        },
      });
      if (error) throw new Error(error.message);
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success(`Campaign launched — ${(data as any).total} recipients queued`);
    } catch (e) {
      toast.error("Launch failed", { description: String((e as Error).message) });
    } finally {
      setLaunching(false);
    }
  };

  const progress = activeJob && activeJob.total > 0
    ? Math.round(((activeJob.sent + activeJob.failed) / activeJob.total) * 100)
    : 0;

  return (
    <Card className="border-[#B89555]/30 bg-[#FDFBF7]">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#B89555]" />
            <h3 className="text-sm font-semibold text-[#1A1A1A] tracking-tight">Bulk brokerage outreach</h3>
            <Badge variant="outline" className="border-[#B89555]/40 text-[10px]">
              <Lock className="w-3 h-3 mr-1" /> Locked sender
            </Badge>
          </div>
          <div className="text-[11px] text-[#1A1A1A]/70">
            <span className="font-mono">{eligible.length}</span> eligible
            {brokerages.length > eligible.length && (
              <span className="text-[#1A1A1A]/50"> · {brokerages.length - eligible.length} skipped (no email)</span>
            )}
          </div>
        </div>

        {/* Locked identity row */}
        <div className="grid grid-cols-3 gap-2 text-[12px] bg-white border border-[#B89555]/20 rounded p-2">
          <Field label="From" value={`${PRIMARY_SENDER_NAME} <${PRIMARY_SENDER}>`} />
          <Field label="Reply-To" value={DEFAULT_REPLY_TO} />
          <Field label="CC (every send)" value={DEFAULT_CC} />
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-[#1A1A1A]">Subject</Label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={250}
            className="bg-white border-[#B89555]/30"
            placeholder="Subject — supports {{brokerage_name}}"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs uppercase tracking-wider text-[#1A1A1A]">HTML body</Label>
            <span className="text-[10px] text-[#1A1A1A]/60">Only <code className="font-mono">{`{{brokerage_name}}`}</code> is allowed</span>
          </div>
          <Textarea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            rows={6}
            className="bg-white border-[#B89555]/30 font-mono text-[12px]"
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={launch} disabled={launching || eligible.length === 0} className="gap-2">
            {launching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Lock & launch to {eligible.length}
          </Button>
        </div>

        {activeJob && (
          <div className="border-t border-[#B89555]/20 pt-3 space-y-1.5">
            <div className="flex items-center justify-between text-[12px]">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-[#B89555]/40">{activeJob.status}</Badge>
                <span className="text-[#1A1A1A]/70 font-mono text-[10px]">#{activeJob.id.slice(0, 8)}</span>
              </div>
              <div className="text-[#1A1A1A] font-medium">
                {activeJob.sent}/{activeJob.total} sent
                {activeJob.failed > 0 && (
                  <span className="ml-2 text-red-700">
                    <AlertTriangle className="inline w-3 h-3 mr-0.5" />
                    {activeJob.failed} failed
                  </span>
                )}
              </div>
            </div>
            <div className="h-1.5 bg-[#EFE6D6] rounded overflow-hidden">
              <div
                className="h-full bg-[#1A1A1A] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/60">{label}</div>
      <div className="text-[#1A1A1A] truncate" title={value}>{value}</div>
    </div>
  );
}
