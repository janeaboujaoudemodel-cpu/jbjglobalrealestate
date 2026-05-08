import { useState } from "react";
import { Mail, Settings2, AlertTriangle, Infinity as InfinityIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { IconTile } from "@/components/ui/icon-tile";
import { useEmailQuota, type EmailPlan } from "@/hooks/useEmailQuota";
import { toast } from "sonner";

/**
 * Owner-facing summary of the global Resend send quota.
 * Plan-aware: Free enforces the Resend free-plan ceiling (100/day, 2.9k/30d,
 * 2 req/s). Pro/Business/Enterprise bypass daily + monthly caps (only the
 * rate throttle stays active) — daily counters become informational only.
 */

const PLAN_LABEL: Record<EmailPlan, string> = {
  free: "Free",
  pro: "Pro",
  business: "Business",
  enterprise: "Enterprise",
};

export function EmailQuotaCard() {
  const q = useEmailQuota();
  const [open, setOpen] = useState(false);
  const [plan, setLocalPlan] = useState<EmailPlan>(q.plan);
  const [daily, setDaily] = useState(q.dailyLimit);
  const [monthly, setMonthly] = useState(q.monthlyLimit);
  const [rate, setRate] = useState(q.ratePerSec);

  const isPaid = q.unlimited;
  const dailyPct = Math.min(100, Math.round((q.sentToday / Math.max(1, q.dailyLimit)) * 100));
  const monthlyPct = Math.min(100, Math.round((q.sentMonth / Math.max(1, q.monthlyLimit)) * 100));
  const dailyHot = !isPaid && dailyPct >= 90;
  const monthlyHot = !isPaid && monthlyPct >= 90;
  const leftToday = Math.max(0, q.dailyLimit - q.sentToday);
  const leftMonth = Math.max(0, q.monthlyLimit - q.sentMonth);

  const onSave = async () => {
    let res;
    if (plan !== q.plan) {
      // Plan changed → use preset (also updates limits/rate sensibly).
      res = await q.setPlan(plan);
    } else {
      res = await q.updateLimits({
        daily_limit: Math.max(1, Number(daily) || 100),
        monthly_limit: Math.max(1, Number(monthly) || 2900),
        rate_per_sec: Math.max(1, Number(rate) || 2),
      });
    }
    if (res.error) toast.error("Could not update settings", { description: res.error.message });
    else {
      toast.success(plan !== q.plan ? `Plan set to ${PLAN_LABEL[plan]}` : "Email limits updated");
      setOpen(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#E8DEC8] bg-[#F7F2EA] p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <IconTile icon={Mail} tone="gold" size="md" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#1A1A1A]">Email send quota</span>
              <Badge
                variant="outline"
                className={`text-[10px] uppercase tracking-wide border ${
                  isPaid
                    ? "border-emerald-400/60 bg-emerald-50 text-emerald-800"
                    : "border-[#B89555]/50 bg-[#EFE6D6] text-[#1A1A1A]"
                }`}
              >
                {PLAN_LABEL[q.plan]} plan
              </Badge>
            </div>
            <div className="text-xs text-[#1A1A1A]/70">
              {isPaid
                ? "Pro plan — daily & monthly caps removed"
                : "Resend Free plan — global cap, all senders"}
            </div>
          </div>
        </div>

        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (v) {
              setLocalPlan(q.plan);
              setDaily(q.dailyLimit);
              setMonthly(q.monthlyLimit);
              setRate(q.ratePerSec);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="border-[#B89555]/40 text-[#1A1A1A]">
              <Settings2 className="h-4 w-4 mr-1.5" />
              Plan & limits
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#FDFBF7] border-[#E8DEC8]">
            <DialogHeader>
              <DialogTitle className="text-[#1A1A1A]">Email plan & limits</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label className="text-[#1A1A1A]">Resend plan</Label>
                <Select value={plan} onValueChange={(v) => setLocalPlan(v as EmailPlan)}>
                  <SelectTrigger className="mt-1 bg-white border-[#E8DEC8] text-[#1A1A1A]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free — 100/day, 3,000/month</SelectItem>
                    <SelectItem value="pro">Pro — uncapped daily, 50,000/month</SelectItem>
                    <SelectItem value="business">Business — uncapped</SelectItem>
                    <SelectItem value="enterprise">Enterprise — uncapped</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-[#1A1A1A]/60 mt-1">
                  Switching plans auto-applies sensible limits. Pro and above bypass daily/monthly caps entirely — only the rate throttle stays active.
                </p>
              </div>

              <div className={plan !== "free" ? "opacity-50 pointer-events-none" : ""}>
                <Label className="text-[#1A1A1A]">Daily limit</Label>
                <Input
                  type="number"
                  min={1}
                  value={daily}
                  onChange={(e) => setDaily(Number(e.target.value))}
                  className="mt-1 bg-white border-[#E8DEC8] text-[#1A1A1A]"
                />
                <p className="text-xs text-[#1A1A1A]/60 mt-1">
                  Resend Free plan allows 100 / day.
                </p>
              </div>
              <div className={plan !== "free" ? "opacity-50 pointer-events-none" : ""}>
                <Label className="text-[#1A1A1A]">Monthly limit (rolling 30 days)</Label>
                <Input
                  type="number"
                  min={1}
                  value={monthly}
                  onChange={(e) => setMonthly(Number(e.target.value))}
                  className="mt-1 bg-white border-[#E8DEC8] text-[#1A1A1A]"
                />
                <p className="text-xs text-[#1A1A1A]/60 mt-1">
                  Resend Free plan allows 3,000 / month — default 2,900 (safety margin).
                </p>
              </div>
              <div>
                <Label className="text-[#1A1A1A]">Rate (requests / second)</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="mt-1 bg-white border-[#E8DEC8] text-[#1A1A1A]"
                />
                <p className="text-xs text-[#1A1A1A]/60 mt-1">
                  Resend Free throttles at 2 req/s. Pro raises this to 10.
                </p>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="gold" onClick={onSave}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isPaid ? (
        <div className="mt-5 rounded-xl border border-emerald-300/60 bg-emerald-50 px-4 py-3 flex items-center gap-3">
          <InfinityIcon className="h-6 w-6 text-emerald-700" />
          <div>
            <div className="text-sm font-semibold text-emerald-900">Unlimited daily sends</div>
            <div className="text-xs text-emerald-800/80">
              {q.sentToday.toLocaleString()} sent today · {q.sentMonth.toLocaleString()} in last 30 days · {q.ratePerSec} req/s throttle
            </div>
          </div>
        </div>
      ) : (
        <>
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
            <QuotaBar label="Today (UTC)" used={q.sentToday} total={q.dailyLimit} pct={dailyPct} hot={dailyHot} />
            <QuotaBar label="Last 30 days" used={q.sentMonth} total={q.monthlyLimit} pct={monthlyPct} hot={monthlyHot} />
          </div>

          {(dailyHot || monthlyHot) && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              <AlertTriangle className="h-4 w-4 mt-0.5" />
              <span>
                {dailyPct >= 100
                  ? "Daily limit reached — new sends blocked until UTC midnight. Upgrade to Pro to remove the cap."
                  : monthlyPct >= 100
                  ? "Monthly limit reached — sends paused. Upgrade to Pro to remove the cap."
                  : "Approaching the Free-plan limit — switch to Pro in Plan & limits to remove it."}
              </span>
            </div>
          )}
        </>
      )}

      <p className="mt-3 text-[11px] text-[#1A1A1A]/50">
        Throttle: {q.ratePerSec} req/s. All outbound mail (CRM, outreach, e-sign, notifications) shares this counter.
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
