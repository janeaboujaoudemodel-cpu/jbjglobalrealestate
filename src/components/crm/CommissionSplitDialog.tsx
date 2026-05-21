// Owner-side dialog to define commission splits and send a binding agreement.
import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Split {
  party: string;
  role?: string;
  percent: number;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  brokerId: string;            // crm_brokers.id
  brokerUserId: string;        // auth.users.id
  brokerEmail: string;
  brokerName?: string;
  onCreated?: (agreementId: string) => void;
}

const PRESETS: Record<string, Split[]> = {
  "50/50": [
    { party: "JBJ", percent: 50, role: "Listing" },
    { party: "Broker", percent: 50, role: "Selling" },
  ],
  "70/30": [
    { party: "JBJ", percent: 70, role: "Listing" },
    { party: "Broker", percent: 30, role: "Selling" },
  ],
  "20/20/60": [
    { party: "JBJ", percent: 20, role: "Listing" },
    { party: "Broker A", percent: 20, role: "Co-broker" },
    { party: "Broker B", percent: 60, role: "Selling" },
  ],
};

export default function CommissionSplitDialog({
  open,
  onOpenChange,
  brokerId,
  brokerUserId,
  brokerEmail,
  brokerName,
  onCreated,
}: Props) {
  const [title, setTitle] = useState("Commission Split Agreement");
  const [dealRef, setDealRef] = useState("");
  const [splits, setSplits] = useState<Split[]>([
    { party: "JBJ", percent: 50, role: "Listing" },
    { party: brokerName || "Broker", percent: 50, role: "Selling" },
  ]);
  const [busy, setBusy] = useState(false);

  const total = useMemo(() => splits.reduce((s, x) => s + Number(x.percent || 0), 0), [splits]);
  const totalsOk = Math.abs(total - 100) < 0.01;

  function applyPreset(key: keyof typeof PRESETS) {
    const preset = PRESETS[key].map((s) =>
      s.party === "Broker" ? { ...s, party: brokerName || "Broker" } : s
    );
    setSplits(preset);
  }

  function updateSplit(i: number, patch: Partial<Split>) {
    setSplits((cur) => cur.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  async function submit(sendEmail: boolean) {
    if (!totalsOk) {
      toast.error(`Splits must total 100% (currently ${total}%)`);
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("crm-broker-commission-create", {
        body: {
          broker_id: brokerId,
          broker_user_id: brokerUserId,
          broker_email: brokerEmail,
          broker_name: brokerName,
          deal_ref: dealRef || undefined,
          title,
          splits,
          send_email: sendEmail,
        },
      });
      if (error || (data as { error?: string })?.error) {
        toast.error((data as { error?: string })?.error || error?.message || "Failed");
        return;
      }
      toast.success(sendEmail ? "Agreement sent to broker" : "Draft saved");
      onCreated?.((data as { agreement_id: string }).agreement_id);
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#FDFBF7] border-[#B89555]/30">
        <DialogHeader>
          <DialogTitle className="text-[#1A1A1A]">Commission split agreement</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-[0.12em] text-[#1A1A1A]/70">Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-white border-[#B89555]/30 mt-1"
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-[0.12em] text-[#1A1A1A]/70">
                Deal reference (optional)
              </Label>
              <Input
                value={dealRef}
                onChange={(e) => setDealRef(e.target.value)}
                placeholder="DEAL-2026-001"
                className="bg-white border-[#B89555]/30 mt-1"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs uppercase tracking-[0.12em] text-[#1A1A1A]/70">Splits</Label>
              <div className="flex gap-2">
                {(Object.keys(PRESETS) as Array<keyof typeof PRESETS>).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => applyPreset(k)}
                    className="text-[11px] px-2 py-1 border border-[#B89555]/30 bg-[#F7F2EA] hover:bg-[#EFE6D6] text-[#1A1A1A]"
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {splits.map((s, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_90px_36px] gap-2">
                  <Input
                    value={s.party}
                    onChange={(e) => updateSplit(i, { party: e.target.value })}
                    placeholder="Party"
                    className="bg-white border-[#B89555]/30"
                  />
                  <Input
                    value={s.role ?? ""}
                    onChange={(e) => updateSplit(i, { role: e.target.value })}
                    placeholder="Role"
                    className="bg-white border-[#B89555]/30"
                  />
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={s.percent}
                      onChange={(e) => updateSplit(i, { percent: Number(e.target.value) })}
                      className="bg-white border-[#B89555]/30 pr-7 text-right"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#1A1A1A]/60">
                      %
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSplits((c) => c.filter((_, idx) => idx !== i))}
                    className="border border-[#B89555]/30 bg-[#F7F2EA] hover:bg-[#EFE6D6] text-[#1A1A1A] flex items-center justify-center"
                    aria-label="Remove split"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-[#B89555]/30"
                onClick={() =>
                  setSplits((c) => [...c, { party: "", percent: 0 }])
                }
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add split
              </Button>
            </div>

            <div
              className={`mt-3 text-xs ${
                totalsOk ? "text-[#1A1A1A]/70" : "text-red-600 font-medium"
              }`}
            >
              Total: {total}% {totalsOk ? "" : "(must equal 100%)"}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#B89555]/20">
            <Button
              variant="outline"
              disabled={busy || !totalsOk}
              onClick={() => submit(false)}
              className="border-[#B89555]/30"
            >
              Save draft
            </Button>
            <Button disabled={busy || !totalsOk} onClick={() => submit(true)}>
              {busy ? "Sending…" : "Send to broker"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
