import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, FileText, Users, Wallet, ArrowRight } from "lucide-react";

interface Stats {
  openPositions: number;
  applications7d: number;
  employees: number;
  archived: number;
}

const TILES: Array<{
  key: "positions" | "applications" | "employees" | "payroll";
  label: string;
  icon: typeof Briefcase;
  metric: (s: Stats) => string;
  hint: string;
}> = [
  { key: "positions",    label: "Open Positions",     icon: Briefcase, metric: (s) => String(s.openPositions),  hint: "Active & visible on Careers" },
  { key: "applications", label: "Applications (7d)",  icon: FileText,  metric: (s) => String(s.applications7d), hint: "New CV submissions this week" },
  { key: "employees",    label: "Employees",          icon: Users,     metric: (s) => String(s.employees),      hint: "HR roster headcount" },
  { key: "payroll",      label: "Archived Positions", icon: Wallet,    metric: (s) => String(s.archived),       hint: "Kept for audit, hidden publicly" },
];

export default function CareersPortalOverview({ onJump }: { onJump: (s: "positions" | "applications" | "employees" | "payroll") => void }) {
  const [stats, setStats] = useState<Stats>({ openPositions: 0, applications7d: 0, employees: 0, archived: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
      const [open, archived, apps, emps] = await Promise.all([
        supabase.from("open_positions").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("open_positions").select("id", { count: "exact", head: true }).eq("is_active", false),
        supabase.from("hr_cv_submissions").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
        supabase.from("hr_employees").select("id", { count: "exact", head: true }),
      ]);
      setStats({
        openPositions: open.count ?? 0,
        archived: archived.count ?? 0,
        applications7d: apps.count ?? 0,
        employees: emps.count ?? 0,
      });
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {TILES.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onJump(t.key)}
              className="text-left rounded-xl border border-[#B89555]/40 bg-white/60 p-4 hover:bg-[#EFE6D6]/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <Icon className="w-5 h-5 text-[#102540]" />
                <ArrowRight className="w-4 h-4 text-[#1A1A1A]/40" />
              </div>
              <p className="mt-3 text-3xl font-semibold text-[#1A1A1A]">
                {loading ? "—" : t.metric(stats)}
              </p>
              <p className="text-sm font-medium text-[#1A1A1A]">{t.label}</p>
              <p className="text-xs text-[#1A1A1A]/60 mt-0.5">{t.hint}</p>
            </button>
          );
        })}
      </div>

      <Card>
        <CardContent className="py-6">
          <h3 className="font-semibold text-[#1A1A1A]">What lives here</h3>
          <p className="text-sm text-[#1A1A1A]/70 mt-1">
            The Careers Portal consolidates every HR, payroll, hiring and employee surface
            into one workspace. Use the sub-header above to jump between sections — each one
            is the same tool you used before, now wired into a single home. Old standalone
            pages still work; deep links resolve here automatically.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
