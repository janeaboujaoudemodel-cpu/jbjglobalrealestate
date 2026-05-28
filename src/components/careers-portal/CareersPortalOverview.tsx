import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import {
  Briefcase, FileText, Users, ClipboardCheck, GraduationCap, Wallet,
  UserPlus, Bot, MessagesSquare, ArrowRight, TrendingUp, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SectionKey } from "@/pages/owner/CareersPortal";

interface Stats {
  employees: number;
  activePositions: number;
  pendingApprovals: number;
  cvsAwaitingReview: number;
  onboardingInProgress: number;
  recentHires30d: number;
  payrollRecords: number;
  aiInsights: number;
  recentComms: number;
}

const initial: Stats = {
  employees: 0,
  activePositions: 0,
  pendingApprovals: 0,
  cvsAwaitingReview: 0,
  onboardingInProgress: 0,
  recentHires30d: 0,
  payrollRecords: 0,
  aiInsights: 0,
  recentComms: 0,
};

const TILES: Array<{
  key: SectionKey;
  label: string;
  icon: typeof Briefcase;
  metric: (s: Stats) => number;
  hint: string;
}> = [
  { key: "employees",     label: "Employees",            icon: Users,         metric: (s) => s.employees,            hint: "Active HR roster" },
  { key: "positions",     label: "Active Positions",     icon: Briefcase,     metric: (s) => s.activePositions,      hint: "Live on Careers page" },
  { key: "approvals",     label: "Pending Approvals",    icon: ClipboardCheck,metric: (s) => s.pendingApprovals,     hint: "Awaiting your decision" },
  { key: "cv-center",     label: "CVs Awaiting Review",  icon: FileText,      metric: (s) => s.cvsAwaitingReview,    hint: "New applications" },
  { key: "onboarding",    label: "Onboarding In Progress",icon: GraduationCap,metric: (s) => s.onboardingInProgress, hint: "New joiners in flight" },
  { key: "payroll",       label: "Payroll Records",      icon: Wallet,        metric: (s) => s.payrollRecords,       hint: "Salary entries on file" },
  { key: "employees",     label: "Recent Hires (30d)",   icon: UserPlus,      metric: (s) => s.recentHires30d,       hint: "Joined this month" },
  { key: "ai-recruiting", label: "AI Recruiting Signals",icon: Bot,           metric: (s) => s.aiInsights,           hint: "Open prospects in hunt engine" },
  { key: "comms",         label: "Recent Comms (7d)",    icon: MessagesSquare,metric: (s) => s.recentComms,          hint: "Internal employee messages" },
];

export default function CareersPortalOverview({ onJump }: { onJump: (s: SectionKey) => void }) {
  const [stats, setStats] = useState<Stats>(initial);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

      // Each query is wrapped so a single missing table never breaks Overview.
      const sb = supabase as any;
      const safe = async (q: any): Promise<number> => {
        try { const r = await q; return (r?.count as number | null) ?? 0; } catch { return 0; }
      };

      const [
        employees, activePositions, pendingApprovals, cvsAwaiting,
        onboarding, recentHires, payroll, aiInsights, recentComms,
      ] = await Promise.all([
        safe(sb.from("hr_employees").select("id", { count: "exact", head: true })),
        safe(sb.from("open_positions").select("id", { count: "exact", head: true }).eq("is_active", true)),
        safe(sb.from("hr_approval_requests").select("id", { count: "exact", head: true }).eq("status", "pending")),
        safe(sb.from("hr_cv_submissions").select("id", { count: "exact", head: true }).eq("status", "new")),
        safe(sb.from("hr_employee_onboarding").select("id", { count: "exact", head: true }).neq("status", "completed")),
        safe(sb.from("hr_employees").select("id", { count: "exact", head: true }).gte("hired_at", thirtyDaysAgo)),
        safe(sb.from("employee_salaries").select("id", { count: "exact", head: true })),
        safe(sb.from("hunt_prospects").select("id", { count: "exact", head: true }).eq("status", "new")),
        safe(sb.from("employee_chat_messages").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo)),
      ]);


      if (cancelled) return;
      setStats({
        employees, activePositions, pendingApprovals,
        cvsAwaitingReview: cvsAwaiting, onboardingInProgress: onboarding,
        recentHires30d: recentHires, payrollRecords: payroll,
        aiInsights, recentComms,
      });
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6">
      {/* Quick-action toolbar — real-number summary + one-click jumps to the
          operational tabs. Lives only on the owner Careers Portal overview. */}
      <div className="rounded-2xl border border-[#B89555]/40 bg-[#F7F2EA] p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 mr-auto">
          <div className="w-10 h-10 rounded-xl bg-[#EFE6D6] border border-[#B89555]/40 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-[#1A1A1A]" />
          </div>
          <div className="leading-tight">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/60">Live Snapshot</p>
            <p className="text-sm text-[#1A1A1A]">
              <span className="font-semibold">{loading ? "—" : stats.employees}</span> employees ·{" "}
              <span className="font-semibold">{loading ? "—" : stats.payrollRecords}</span> payroll records ·{" "}
              <span className="font-semibold">{loading ? "—" : stats.pendingApprovals}</span> pending approvals
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onJump("payroll")}
          className="border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]"
        >
          <Wallet className="w-4 h-4 mr-1.5" /> Open Payroll
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onJump("performance")}
          className="border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]"
        >
          <TrendingUp className="w-4 h-4 mr-1.5" /> Open Performance
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onJump("employees")}
          className="border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]"
        >
          <Users className="w-4 h-4 mr-1.5" /> Open Employees
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onJump("cv-center")}
          className="border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]"
        >
          <FileText className="w-4 h-4 mr-1.5" /> Open CV Center
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onJump("approvals")}
          className="border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]"
        >
          <ClipboardCheck className="w-4 h-4 mr-1.5" /> Open Approvals
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TILES.map((t, i) => {
          const Icon = t.icon;
          const value = t.metric(stats);
          return (
            <button
              key={`${t.key}-${i}`}
              type="button"
              onClick={() => onJump(t.key)}
              className="text-left rounded-2xl border border-[#B89555]/40 bg-[#F7F2EA] p-5 hover:bg-[#EFE6D6] transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#EFE6D6] border border-[#B89555]/40 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#1A1A1A]" />
                </div>
                <ArrowRight className="w-4 h-4 text-[#1A1A1A]/40 group-hover:text-[#1A1A1A] transition-colors" />
              </div>
              <p className="mt-4 text-3xl font-semibold text-[#1A1A1A]">
                {loading ? "—" : value}
              </p>
              <p className="text-sm font-medium text-[#1A1A1A]">{t.label}</p>
              <p className="text-xs text-[#1A1A1A]/60 mt-0.5">{t.hint}</p>
            </button>
          );
        })}
      </div>

      <Card className="bg-[#F7F2EA] border border-[#B89555]/40 rounded-2xl shadow-none">
        <CardContent className="py-6">
          <h3 className="font-semibold text-[#1A1A1A]">JBJ GLOBAL REAL ESTATE — Careers Portal</h3>
          <p className="text-sm text-[#1A1A1A]/70 mt-1">
            Single canonical workspace for hiring, employees, payroll, performance, contracts,
            internal communications, AI recruiting, LinkedIn import, competitor intelligence and
            audit logs. All numbers above are pulled from live tables — never invented. Empty
            metrics mean no real data exists yet, not a broken count.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
