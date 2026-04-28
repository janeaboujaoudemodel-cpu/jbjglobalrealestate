import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Send, FlaskConical, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useSendDeveloperRegistration, type RegistrationVariant } from "@/hooks/useCRMRelationships";

const VARIANT_LABELS: Record<RegistrationVariant, string> = {
  developer_registration: "New registration request",
  developer_confirm_registered: "Confirm we are already registered",
};

interface Developer { id: string; developer_name: string; developer_email?: string; last_outreach_at?: string | null; }

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
  const [progress, setProgress] = useState({ done: 0, ok: 0, fail: 0 });

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const targets = selected.filter((d) =>
    d.developer_email && (!skipRecent || !d.last_outreach_at || new Date(d.last_outreach_at).getTime() < sevenDaysAgo)
  );
  const skipped = selected.length - targets.length;

  const sendTest = async () => {
    if (!testEmail.includes("@")) { toast.error("Enter a valid test email"); return; }
    await send.mutateAsync({
      variant,
      testRecipient: testEmail,
      testDeveloperName: targets[0]?.developer_name || selected[0]?.developer_name,
    });
  };

  const sendAll = async () => {
    if (!targets.length) { toast.error("No eligible recipients"); return; }
    if (!confirm(`Send "${VARIANT_LABELS[variant]}" to ${targets.length} developer(s)?`)) return;
    setRunning(true);
    setProgress({ done: 0, ok: 0, fail: 0 });
    const t = toast.loading(`Sending 0 / ${targets.length}…`);
    let ok = 0, fail = 0;
    for (let i = 0; i < targets.length; i++) {
      try {
        await send.mutateAsync({ developerId: targets[i].id, variant, silent: true });
        ok++;
      } catch { fail++; }
      setProgress({ done: i + 1, ok, fail });
      toast.loading(`Sending ${i + 1} / ${targets.length}… (${ok} ok, ${fail} failed)`, { id: t });
      await new Promise((r) => setTimeout(r, 900));
    }
    toast.success(`Done. Sent: ${ok}, Failed: ${fail}`, { id: t });
    setRunning(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !running && onOpenChange(v)}>
      <DialogContent className="max-w-xl bg-white">
        <DialogHeader>
          <DialogTitle className="text-black">Send Registration Email</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs text-black">Email variant</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {(Object.keys(VARIANT_LABELS) as RegistrationVariant[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVariant(v)}
                  className={`text-xs px-3 py-2 rounded-lg border-2 text-left transition ${
                    variant === v ? "bg-black text-white border-black" : "bg-white text-black border-black/10 hover:border-black/30"
                  }`}
                >
                  {VARIANT_LABELS[v]}
                </button>
              ))}
            </div>
          </div>

          <div className="border border-black/10 rounded-xl p-3 bg-[#FAF5EA]">
            <div className="flex items-center gap-2 text-xs text-black mb-2">
              <FlaskConical className="w-4 h-4" /> <strong>Step 1 — Send test to yourself first</strong>
            </div>
            <div className="flex gap-2">
              <Input value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="your@email" className="flex-1" />
              <Button variant="outline" onClick={sendTest} disabled={send.isPending}>
                <FlaskConical className="w-3 h-3 mr-1" />Send TEST
              </Button>
            </div>
          </div>

          <div className="space-y-2 border border-black/10 rounded-xl p-3 bg-white">
            <div className="text-xs text-black"><strong>Step 2 — Broadcast</strong></div>
            <div className="flex items-center justify-between text-sm text-black">
              <span>Selected developers</span>
              <span className="font-bold">{selected.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-black flex items-center gap-2">
                <Switch checked={skipRecent} onCheckedChange={setSkipRecent} />
                Skip developers contacted in last 7 days
              </span>
              {skipped > 0 && <span className="text-amber-700 text-xs flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{skipped} skipped</span>}
            </div>
            <div className="flex items-center justify-between text-sm pt-2 border-t border-black/10">
              <span className="text-black font-semibold">Will send to</span>
              <span className="font-bold text-emerald-700">{targets.length}</span>
            </div>
            {running && (
              <div className="text-xs text-black">
                Progress: {progress.done} / {targets.length} · ✅ {progress.ok} · ❌ {progress.fail}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={running}>Cancel</Button>
          <Button onClick={sendAll} disabled={running || !targets.length} className="bg-black text-white hover:bg-gray-800">
            <Send className="w-3 h-3 mr-1" />{running ? `Sending…` : `Send to ${targets.length}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
