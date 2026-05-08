import { useState } from "react";
import { Mail, Settings2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { IconTile } from "@/components/ui/icon-tile";
import { useEmailQuota } from "@/hooks/useEmailQuota";
import { toast } from "sonner";

/**
 * Owner-facing summary of the global Resend send quota.
 * Aligned with Resend free plan: 100/day, 3,000/month, 2 req/s.
 * Limits live in `email_send_quota_config` and can be tuned without redeploy.
 */
export function EmailQuotaCard() {
  const q = useEmailQuota();
  const [open, setOpen] = useState(false);
  const [daily, setDaily] = useState(q.dailyLimit);
  const [monthly, setMonthly] = useState(q.monthlyLimit);
  const [rate, setRate] = useState(q.ratePerSec);

  const dailyPct = Math.min(100, Math.round((q.sentToday / Math.max(1, q.dailyLimit)) * 100));
  const monthlyPct = Math.min(100, Math.round((q.sentMonth / Math.max(1, q.monthlyLimit)) * 100));
  const dailyHot = dailyPct >= 90;
  const monthlyHot = monthlyPct >= 90;
  const leftToday = Math.max(0, q.dailyLimit - q.sentToday);
  const leftMonth = Math.max(0, q.monthlyLimit - q.sentMonth);

  const onSave = async () => {
    const { error } = await q.updateLimits({
      daily_limit: Math.max(1, Number(daily) || 100),
      monthly_limit: Math.max(1, Number(monthly) || 2900),
      rate_per_sec: Math.max(1, Number(rate) || 2),
    });
    if (error) toast.error("Could not update limits", { description: error.message });
    else {
      toast.success("Email limits updated");
      setOpen(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#E8DEC8] bg-[#F7F2EA] p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <IconTile icon={Mail} tone="gold" size="md" />
          <div>
            <div className="text-sm font-semibold text-[#1A1A1A]">Email send quota</div>
            <div className="text-xs text-[#1A1A1A]/70">
              Resend free plan — global cap, all senders
            </div>
          </div>
        </div>

        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (v) {
              setDaily(q.dailyLimit);
              setMonthly(q.monthlyLimit);
              setRate(q.ratePerSec);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="border-[#B89555]/40 text-[#1A1A1A]">
              <Settings2 className="h-4 w-4 mr-1.5" />
              Edit limits
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#FDFBF7] border-[#E8DEC8]">
            <DialogHeader>
              <DialogTitle className="text-[#1A1A1A]">Email quota limits</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label className="text-[#1A1A1A]">Daily limit</Label>
                <Input
                  type="number"
                  min={1}
                  value={daily}
                  onChange={(e) => setDaily(Number(e.target.value))}
                  className="mt-1 bg-white border-[#E8DEC8] text-[#1A1A1A]"
                />
                <p className="text-xs text-[#1A1A1A]/60 mt-1">
                  Resend free plan allows 100 / day.
                </p>
              </div>
              <div>
                <Label className="text-[#1A1A1A]">Monthly limit (rolling 30 days)</Label>
                <Input
                  type="number"
                  min={1}
                  value={monthly}
                  onChange={(e) => setMonthly(Number(e.target.value))}
                  className="mt-1 bg-white border-[#E8DEC8] text-[#1A1A1A]"
                />
                <p className="text-xs text-[#1A1A1A]/60 mt-1">
                  Resend free plan allows 3,000 / month — default is 2,900 (safety margin).
                </p>
              </div>
              <div>
                <Label className="text-[#1A1A1A]">Rate (requests / second)</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="mt-1 bg-white border-[#E8DEC8] text-[#1A1A1A]"
                />
                <p className="text-xs text-[#1A1A1A]/60 mt-1">
                  Resend free plan throttles at 2 req/s.
                </p>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="gold" onClick={onSave}>
                Save limits
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-5 rounded-xl border border-[#E8DEC8] bg-[#FDFBF7] px-4 py-3">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-xs uppercase tracking-wide text-[#1A1A1A]/60">Emails left today</span>
          <span className={`text-sm ${dailyHot ? "text-amber-700" : "text-[#1A1A1A]/70"}`}>
            {leftMonth.toLocaleString()} left this month
          </span>
        </div>
        <div className={`mt-1 text-3xl font-semibold tabular-nums ${dailyHot ? "text-amber-700" : "text-[#1A1A1A]"}`}>
          {leftToday.toLocaleString()}
          <span className="ml-2 text-base font-normal text-[#1A1A1A]/60">/ {q.dailyLimit.toLocaleString()}</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <QuotaBar
          label="Today (UTC)"
          used={q.sentToday}
          total={q.dailyLimit}
          pct={dailyPct}
          hot={dailyHot}
        />
        <QuotaBar
          label="Last 30 days"
          used={q.sentMonth}
          total={q.monthlyLimit}
          pct={monthlyPct}
          hot={monthlyHot}
        />
      </div>

      {(dailyHot || monthlyHot) && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <AlertTriangle className="h-4 w-4 mt-0.5" />
          <span>
            {dailyPct >= 100
              ? "Daily limit reached — new sends will be blocked until UTC midnight."
              : monthlyPct >= 100
              ? "Monthly limit reached — sends are paused."
              : "Approaching the limit — sends will start failing soon."}
          </span>
        </div>
      )}

      <p className="mt-3 text-[11px] text-[#1A1A1A]/50">
        Throttle: {q.ratePerSec} req/s. All outbound mail (CRM, outreach, e-sign,
        notifications) shares this counter.
      </p>
    </div>
  );
}

function QuotaBar({
  label, used, total, pct, hot,
}: { label: string; used: number; total: number; pct: number; hot: boolean }) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-[#1A1A1A]/70">{label}</span>
        <span className={`font-semibold ${hot ? "text-amber-700" : "text-[#1A1A1A]"}`}>
          {used.toLocaleString()} / {total.toLocaleString()}
        </span>
      </div>
      <div className="mt-1.5 h-2 rounded-full bg-[#EFE6D6] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${hot ? "bg-amber-500" : "bg-[#1A1A1A]"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default EmailQuotaCard;
