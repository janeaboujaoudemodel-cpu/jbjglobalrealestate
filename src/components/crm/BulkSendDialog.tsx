import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, FlaskConical, AlertTriangle, Lock, Unlock, CheckCircle2, XCircle, Clock, Eye, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { useSendDeveloperRegistration, useEmailTemplate, type RegistrationVariant } from "@/hooks/useCRMRelationships";

const VARIANT_LABELS: Record<RegistrationVariant, string> = {
  developer_registration: "New registration request",
  developer_confirm_registered: "Confirm we are already registered",
};

const STATUS_LABEL: Record<string, string> = {
  not_started: "Not Started",
  pending_application: "Pending Application",
  documents_required: "Documents Required",
  under_review: "Under Review",
  registered: "Registered",
  rejected: "Rejected",
  expired: "Expired",
};

const STATUS_PILL: Record<string, string> = {
  not_started: "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/30",
  pending_application: "bg-amber-100 text-amber-900 border-amber-300",
  documents_required: "bg-orange-100 text-orange-900 border-orange-300",
  under_review: "bg-blue-100 text-blue-900 border-blue-300",
  registered: "bg-emerald-100 text-emerald-900 border-emerald-300",
  rejected: "bg-red-100 text-red-900 border-red-300",
  expired: "bg-zinc-200 text-[#1A1A1A] border-zinc-300",
};

interface Developer {
  id: string;
  developer_name: string;
  developer_email?: string;
  last_outreach_at?: string | null;
  status?: string;
}

type RowStatus = "queued" | "sending" | "ok" | "fail";

export const BulkSendDialog = ({
  open, onOpenChange, selected, defaultTestEmail,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  selected: Developer[];
  defaultTestEmail: string;
}) => {
  const send = useSendDeveloperRegistration();
  const [variant, setVariant] = useState<RegistrationVariant>("developer_registration");
  const [skipRecent, setSkipRecent] = useState(true);
  const [testEmail, setTestEmail] = useState(defaultTestEmail);
  const [running, setRunning] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, { status: RowStatus; error?: string }>>({});
  const [previewDevId, setPreviewDevId] = useState<string>("");
  const [showPreview, setShowPreview] = useState(true);
  const [reviewing, setReviewing] = useState(false);

  const { data: template } = useEmailTemplate(variant);

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const targets = useMemo(() => selected.filter((d) =>
    d.developer_email && (!skipRecent || !d.last_outreach_at || new Date(d.last_outreach_at).getTime() < sevenDaysAgo)
  ), [selected, skipRecent]);
  const skipped = selected.length - targets.length;

  // Skip reason breakdown
  const skipBreakdown = useMemo(() => {
    let noEmail = 0, recent = 0;
    for (const d of selected) {
      if (!d.developer_email) { noEmail++; continue; }
      if (skipRecent && d.last_outreach_at && new Date(d.last_outreach_at).getTime() >= sevenDaysAgo) {
        recent++;
      }
    }
    return { noEmail, recent };
  }, [selected, skipRecent]);

  // Status breakdown for the eligible recipients
  const statusBreakdown = useMemo(() => {
    const c: Record<string, number> = {};
    targets.forEach((t) => {
      const k = t.status || "not_started";
      c[k] = (c[k] || 0) + 1;
    });
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  }, [targets]);

  // Reset review state if selection or filter changes
  useEffect(() => { setReviewing(false); }, [variant, skipRecent, selected.length]);

  useEffect(() => {
    if (!previewDevId && (targets[0] || selected[0])) {
      setPreviewDevId((targets[0] || selected[0]).id);
    }
  }, [targets, selected, previewDevId]);

  const previewDev = selected.find((d) => d.id === previewDevId) || selected[0];
  const previewHtml = useMemo(() => {
    if (!template?.html) return "<div style='padding:24px;font-family:Inter,sans-serif;color:#666'>Loading template…</div>";
    const name = previewDev?.developer_name || "{{developer_name}}";
    return String(template.html).replace(/\{\{developer_name\}\}/g, name);
  }, [template, previewDev]);

  const previewSubject = useMemo(() => {
    if (!template?.subject) return "";
    const name = previewDev?.developer_name || "{{developer_name}}";
    return String(template.subject).replace(/\{\{developer_name\}\}/g, name);
  }, [template, previewDev]);

  const sendTest = async () => {
    if (!testEmail.includes("@")) { toast.error("Enter a valid test email"); return; }
    await send.mutateAsync({
      variant,
      testRecipient: testEmail,
      testDeveloperName: previewDev?.developer_name || targets[0]?.developer_name || selected[0]?.developer_name,
    });
  };

  const sendAll = async () => {
    if (!targets.length) { toast.error("No eligible recipients"); return; }
    if (!reviewing) { setReviewing(true); return; }
    setReviewing(false);
    setRunning(true);
    const init: Record<string, { status: RowStatus }> = {};
    targets.forEach((t) => { init[t.id] = { status: "queued" }; });
    setStatuses(init);

    let ok = 0, fail = 0;
    for (let i = 0; i < targets.length; i++) {
      const t = targets[i];
      setStatuses((p) => ({ ...p, [t.id]: { status: "sending" } }));
      try {
        await send.mutateAsync({ developerId: t.id, variant, silent: true });
        ok++;
        setStatuses((p) => ({ ...p, [t.id]: { status: "ok" } }));
      } catch (e: any) {
        fail++;
        setStatuses((p) => ({ ...p, [t.id]: { status: "fail", error: e?.message || "Failed" } }));
      }
      await new Promise((r) => setTimeout(r, 900));
    }
    toast.success(`Done. Sent: ${ok}, Failed: ${fail}`);
    setRunning(false);
  };

  const closeAndReset = () => {
    if (running) return;
    setStatuses({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !running && onOpenChange(v)}>
      <DialogContent className="max-w-[1500px] w-[97vw] bg-[#FDFBF7] max-h-[94vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#1A1A1A] flex items-center gap-2">
            Send Registration Email
            {template?.locked_at ? (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                <Lock className="w-3 h-3" />Locked
              </span>
            ) : (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-800 border border-zinc-300 flex items-center gap-1">
                <Unlock className="w-3 h-3" />Draft
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="space-y-4 min-w-0">
          {/* Variant */}
          <div>
            <Label className="text-xs text-[#1A1A1A]">Email variant</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {(Object.keys(VARIANT_LABELS) as RegistrationVariant[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVariant(v)}
                  disabled={running}
                  className={`text-xs px-3 py-2 rounded-lg border-2 text-left transition ${
                    variant === v ? "bg-[#1A1A1A] text-white border-[#1A1A1A]" : "bg-[#FDFBF7] text-[#1A1A1A] border-[#1A1A1A]/10 hover:border-[#1A1A1A]/30"
                  }`}
                >
                  {VARIANT_LABELS[v]}
                </button>
              ))}
            </div>
          </div>

          {/* Test send (left col) — always sends to your registered email by default */}
          <div className="border border-[#1A1A1A]/10 rounded-xl p-3 bg-[#FAF5EA]">
            <div className="flex items-center gap-2 text-xs text-[#1A1A1A] mb-2">
              <FlaskConical className="w-4 h-4" /> <strong>Step 1 — Send test to yourself first</strong>
            </div>
            <div className="text-[11px] text-[#5A4A2E] mb-2">
              Test will be sent to your registered email:&nbsp;
              <strong className="text-[#1A1A1A]">{defaultTestEmail || "—"}</strong>
            </div>
            {useCustomTestEmail ? (
              <div className="flex gap-2">
                <Input value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="your@email" className="flex-1" />
                <Button variant="outline" onClick={sendTest} disabled={send.isPending || running}>
                  <FlaskConical className="w-3 h-3 mr-1" />Send TEST
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={sendTest} disabled={send.isPending || running || !defaultTestEmail} className="w-full">
                <FlaskConical className="w-3 h-3 mr-1" />Send TEST to {defaultTestEmail || "your inbox"}
              </Button>
            )}
            <button
              type="button"
              onClick={() => setUseCustomTestEmail((v) => !v)}
              className="text-[10px] underline text-[#5A4A2E] mt-2 hover:text-[#1A1A1A]"
            >
              {useCustomTestEmail ? "Use my registered email" : "Use a different address"}
            </button>
          </div>

          {/* Broadcast config (left col) */}
          <div className="space-y-2 border border-[#1A1A1A]/10 rounded-xl p-3 bg-[#FDFBF7]">
            <div className="text-xs text-[#1A1A1A]"><strong>Step 2 — Broadcast</strong></div>
            <div className="flex items-center justify-between text-sm text-[#1A1A1A]">
              <span>Selected developers</span>
              <span className="font-bold">{selected.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#1A1A1A] flex items-center gap-2">
                <Switch checked={skipRecent} onCheckedChange={setSkipRecent} disabled={running} />
                Skip developers contacted in last 7 days
              </span>
              {skipped > 0 && <span className="text-amber-700 text-xs flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{skipped} skipped</span>}
            </div>
            <div className="flex items-center justify-between text-sm pt-2 border-t border-[#1A1A1A]/10">
              <span className="text-[#1A1A1A] font-semibold">Will send to</span>
              <span className="font-bold text-emerald-700">{targets.length}</span>
            </div>
          </div>

          {/* Status breakdown of eligible recipients */}
          <div className="space-y-2 border border-[#1A1A1A]/10 rounded-xl p-3 bg-[#FDFBF7]">
            <div className="flex items-center gap-2 text-xs text-[#1A1A1A]">
              <ListChecks className="w-4 h-4" /><strong>Recipient breakdown</strong>
            </div>
            {statusBreakdown.length === 0 ? (
              <div className="text-xs text-[#8A7556] py-1">No eligible recipients to send to.</div>
            ) : (
              <div className="space-y-1.5">
                {statusBreakdown.map(([s, n]) => (
                  <div key={s} className="flex items-center justify-between text-xs">
                    <span className={`px-2 py-0.5 rounded-full border font-semibold ${STATUS_PILL[s] || "bg-[#F7F2EA] text-[#1A1A1A] border-[#B89555]/30"}`}>
                      {STATUS_LABEL[s] || s}
                    </span>
                    <span className="font-bold text-[#1A1A1A]">{n}</span>
                  </div>
                ))}
              </div>
            )}
            {(skipBreakdown.noEmail > 0 || skipBreakdown.recent > 0) && (
              <div className="pt-2 mt-2 border-t border-[#1A1A1A]/10 space-y-1 text-xs text-[#5A4A2E]">
                <div className="font-semibold text-[#1A1A1A] mb-0.5">Skipped:</div>
                {skipBreakdown.noEmail > 0 && (
                  <div className="flex justify-between"><span>Missing email</span><span className="font-bold">{skipBreakdown.noEmail}</span></div>
                )}
                {skipBreakdown.recent > 0 && (
                  <div className="flex justify-between"><span>Contacted in last 7 days</span><span className="font-bold">{skipBreakdown.recent}</span></div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-4 min-w-0">
          {/* Email Preview */}
          <div className="border border-[#1A1A1A]/10 rounded-xl bg-[#FDFBF7] overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#1A1A1A]/10 bg-[#FAF5EA]">
              <div className="flex items-center gap-2 text-xs text-[#1A1A1A]">
                <Eye className="w-4 h-4" /><strong>Email preview</strong>
              </div>
              <div className="flex items-center gap-2">
                {selected.length > 0 && (
                  <Select value={previewDevId} onValueChange={setPreviewDevId}>
                    <SelectTrigger className="h-7 text-xs w-[200px]"><SelectValue placeholder="Preview as…" /></SelectTrigger>
                    <SelectContent>
                      {selected.map((d) => (
                        <SelectItem key={d.id} value={d.id} className="text-xs">{d.developer_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowPreview((s) => !s)}>
                  {showPreview ? "Hide" : "Show"}
                </Button>
              </div>
            </div>
            {showPreview && (
              <>
                <div className="px-3 py-2 text-xs border-b border-[#1A1A1A]/10 bg-[#FDFBF7]">
                  <div className="text-[#1A1A1A]"><strong>Subject:</strong> {previewSubject}</div>
                  <div className="text-[#5A4A2E] mt-0.5">
                    <strong className="text-[#1A1A1A]">To:</strong> {previewDev?.developer_email || "—"} · <strong className="text-[#1A1A1A]">Variant:</strong> {VARIANT_LABELS[variant]}
                  </div>
                </div>
                <iframe
                  title="email-preview"
                  srcDoc={previewHtml}
                  sandbox=""
                  className="block w-full h-[78vh] min-h-[640px] bg-[#FDFBF7] rounded-b-xl border-0"
                />
              </>
            )}
          </div>

          {/* Per-recipient progress */}
          {(running || Object.keys(statuses).length > 0) && (
            <div className="border border-[#1A1A1A]/10 rounded-xl bg-[#FDFBF7]">
              <div className="px-3 py-2 border-b border-[#1A1A1A]/10 text-xs text-[#1A1A1A] bg-[#FAF5EA]">
                <strong>Live send progress</strong>
              </div>
              <div className="max-h-[260px] overflow-y-auto divide-y divide-black/5">
                {targets.map((t) => {
                  const s = statuses[t.id]?.status || "queued";
                  const err = statuses[t.id]?.error;
                  const icon =
                    s === "ok" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> :
                    s === "fail" ? <XCircle className="w-4 h-4 text-red-600" /> :
                    s === "sending" ? <Clock className="w-4 h-4 text-amber-600 animate-pulse" /> :
                    <Clock className="w-4 h-4 text-[#8A7556]" />;
                  return (
                    <div key={t.id} className="flex items-center justify-between px-3 py-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        {icon}
                        <span className="font-semibold text-[#1A1A1A] truncate">{t.developer_name}</span>
                        <span className="text-[#8A7556] truncate">{t.developer_email}</span>
                      </div>
                      <span className={`uppercase tracking-wider font-bold ${
                        s === "ok" ? "text-emerald-700" :
                        s === "fail" ? "text-red-700" :
                        s === "sending" ? "text-amber-700" : "text-[#8A7556]"
                      }`}>
                        {s === "ok" ? "sent" : s === "fail" ? (err || "failed") : s}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        </div>

        {reviewing && !running && (
          <div className="mt-3 border-2 border-amber-400 bg-amber-50 rounded-xl p-3 text-sm text-[#1A1A1A]">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-bold mb-1">Confirm bulk send</div>
                <div className="text-xs leading-relaxed">
                  About to send <strong>"{VARIANT_LABELS[variant]}"</strong> to <strong className="text-emerald-700">{targets.length}</strong> developer{targets.length === 1 ? "" : "s"}.
                  {statusBreakdown.length > 0 && (
                    <span> Includes:{" "}
                      {statusBreakdown.map(([s, n], i) => (
                        <span key={s}>
                          <strong>{n} {STATUS_LABEL[s] || s}</strong>{i < statusBreakdown.length - 1 ? ", " : ""}
                        </span>
                      ))}.
                    </span>
                  )}
                  {skipped > 0 && <span> {skipped} will be skipped ({skipBreakdown.noEmail > 0 && `${skipBreakdown.noEmail} no email`}{skipBreakdown.noEmail > 0 && skipBreakdown.recent > 0 && ", "}{skipBreakdown.recent > 0 && `${skipBreakdown.recent} contacted recently`}).</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={closeAndReset} disabled={running}>
            {Object.keys(statuses).length > 0 && !running ? "Close" : "Cancel"}
          </Button>
          {reviewing && !running && (
            <Button variant="outline" onClick={() => setReviewing(false)}>
              Back
            </Button>
          )}
          <Button onClick={sendAll} disabled={running || !targets.length} className="bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]">
            <Send className="w-3 h-3 mr-1" />
            {running ? "Sending…" : reviewing ? `Confirm & send to ${targets.length}` : `Review & send (${targets.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
