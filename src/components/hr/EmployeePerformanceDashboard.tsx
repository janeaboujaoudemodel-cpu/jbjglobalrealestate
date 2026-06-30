import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Activity, Clock, Phone, MessageSquare, TrendingUp, Target,
  Search, Trash2, UserCheck, Briefcase, ExternalLink, Download,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type EmploymentType =
  | "full_time" | "part_time" | "freelancer" | "referral" | "intern" | "contractor";
type EmploymentStatus =
  | "active" | "on_leave" | "left_company" | "terminated" | "inactive";

interface EmployeeProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  job_title: string | null;
  department: string | null;
  photo_url: string | null;
  is_active: boolean;
  employment_type: EmploymentType | null;
  employment_status: EmploymentStatus;
  left_at: string | null;
  left_reason: string | null;
}

interface ActivityRow {
  user_id: string;
  calls_30d: number;
  chats_30d: number;
  leads_assigned: number;
  leads_contacted_30d: number;
  leads_updated_30d: number;
  pipeline_counts: Record<string, number>;
  tasks_assigned: number;
  tasks_completed: number;
}

const TYPE_LABEL: Record<EmploymentType, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  freelancer: "Freelancer",
  referral: "Referral",
  intern: "Intern",
  contractor: "Contractor",
};

const STATUS_LABEL: Record<EmploymentStatus, string> = {
  active: "Active",
  on_leave: "On leave",
  left_company: "Left company",
  terminated: "Terminated",
  inactive: "Inactive",
};

const PIPELINE_COLORS: Record<string, string> = {
  interested: "border-[color:var(--emerald-1)]/30/40 text-[color:var(--emerald-1)] jj-emerald-soft",
  not_interested: "border-red-500/40 text-red-700 bg-red-50",
  junk: "border-amber-500/40 text-amber-700 bg-amber-50",
  won: "border-[color:var(--emerald-1)]/30/40 text-[color:var(--emerald-1)] jj-emerald-soft",
  lost: "border-red-600/40 text-red-800 bg-red-50",
  contacted: "border-blue-500/40 text-blue-700 bg-blue-50",
  new: "border-[#B89555]/40 text-[#1A1A1A] bg-[#EFE6D6]",
};

function fmtStageKey(k: string): string {
  return k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function EmployeePerformanceDashboard() {
  const [params, setParams] = useSearchParams();
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [activity, setActivity] = useState<Record<string, ActivityRow>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Filters
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState<string>(params.get("department") ?? "all");
  const [empType, setEmpType] = useState<string>(params.get("type") ?? "all");
  const [empStatus, setEmpStatus] = useState<string>(params.get("status") ?? "active");

  // Bulk dialogs
  const [statusDialog, setStatusDialog] = useState<EmploymentStatus | null>(null);
  const [typeDialog, setTypeDialog] = useState<EmploymentType | null>(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [empRes, actRes] = await Promise.all([
        supabase
          .from("crm_users_profile")
          .select("id, user_id, display_name, email, job_title, department, photo_url, is_active, employment_type, employment_status, left_at, left_reason"),
        supabase.from("vw_employee_activity_30d").select("*"),
      ]);
      setEmployees((empRes.data ?? []) as EmployeeProfile[]);
      const map: Record<string, ActivityRow> = {};
      (actRes.data ?? []).forEach((r: any) => { map[r.user_id] = r as ActivityRow; });
      setActivity(map);
    } catch (e) {
      console.error("Error fetching performance data:", e);
      toast.error("Could not load performance data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Persist filters in URL
  useEffect(() => {
    const next = new URLSearchParams(params);
    department === "all" ? next.delete("department") : next.set("department", department);
    empType === "all" ? next.delete("type") : next.set("type", empType);
    empStatus === "active" ? next.delete("status") : next.set("status", empStatus);
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [department, empType, empStatus]);

  const departments = useMemo(() => {
    const s = new Set<string>();
    employees.forEach((e) => e.department && s.add(e.department));
    return Array.from(s).sort();
  }, [employees]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((e) => {
      if (department !== "all" && (e.department ?? "") !== department) return false;
      if (empType !== "all" && (e.employment_type ?? "") !== empType) return false;
      if (empStatus !== "all") {
        if (empStatus === "active" && e.employment_status !== "active") return false;
        if (empStatus === "left" && e.employment_status === "active") return false;
      }
      if (q && !(e.display_name ?? "").toLowerCase().includes(q)
           && !(e.email ?? "").toLowerCase().includes(q)
           && !(e.job_title ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [employees, department, empType, empStatus, search]);

  // Aggregate KPIs over filtered set
  const totals = useMemo(() => {
    let calls = 0, chats = 0, leads = 0, tasks = 0;
    filtered.forEach((e) => {
      const a = activity[e.user_id];
      if (!a) return;
      calls += a.calls_30d;
      chats += a.chats_30d;
      leads += a.leads_contacted_30d;
      tasks += a.tasks_completed;
    });
    return { calls, chats, leads, tasks };
  }, [filtered, activity]);

  const toggleOne = (uid: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(uid) ? next.delete(uid) : next.add(uid);
      return next;
    });
  };
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((e) => e.user_id)));
  };

  const runBulk = async (
    action: "set_status" | "set_employment_type" | "delete",
    payload: Record<string, unknown>,
  ) => {
    if (selected.size === 0) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("hr-bulk-employee-action", {
        body: { action, user_ids: Array.from(selected), payload },
      });
      if (error) throw error;
      toast.success((data as any)?.summary ?? "Updated");
      setSelected(new Set());
      setStatusDialog(null); setTypeDialog(null); setDeleteDialog(false); setReason("");
      await fetchData();
    } catch (e: any) {
      toast.error(e?.message ?? "Bulk action failed");
    } finally {
      setSubmitting(false);
    }
  };

  const exportCsv = () => {
    const rows = filtered.map((e) => {
      const a = activity[e.user_id] ?? {} as ActivityRow;
      return {
        name: e.display_name ?? "",
        email: e.email ?? "",
        department: e.department ?? "",
        type: e.employment_type ?? "",
        status: e.employment_status,
        calls_30d: a.calls_30d ?? 0,
        chats_30d: a.chats_30d ?? 0,
        leads_assigned: a.leads_assigned ?? 0,
        leads_contacted_30d: a.leads_contacted_30d ?? 0,
        leads_updated_30d: a.leads_updated_30d ?? 0,
        tasks_completed: a.tasks_completed ?? 0,
      };
    });
    const header = Object.keys(rows[0] ?? { name: "" }).join(",");
    const csv = [header, ...rows.map((r) => Object.values(r).map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `employee-performance-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* KPI cards (filtered) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Calls (30d)" value={totals.calls} icon={<Phone className="h-6 w-6 text-[color:var(--emerald-1)]" />} />
        <KpiCard label="Chats (30d)" value={totals.chats} icon={<MessageSquare className="h-6 w-6 text-blue-600" />} />
        <KpiCard label="Leads Contacted (30d)" value={totals.leads} icon={<TrendingUp className="h-6 w-6 text-[#1A1A1A]" />} />
        <KpiCard label="Tasks Completed" value={totals.tasks} icon={<Target className="h-6 w-6 text-amber-600" />} />
      </div>

      {/* Filters toolbar */}
      <Card className="bg-gradient-to-br from-[#FDFBF7] to-[#F7F1E6] border-2 border-[#B89555]/30 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-[#1A1A1A]/70 mb-1 block">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1A1A1A]/50" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, email, title…" className="pl-8" />
              </div>
            </div>
            <FilterSelect label="Department" value={department} onChange={setDepartment} options={[
              { v: "all", l: "All departments" }, ...departments.map((d) => ({ v: d, l: d })),
            ]} />
            <FilterSelect label="Type" value={empType} onChange={setEmpType} options={[
              { v: "all", l: "All types" },
              ...Object.entries(TYPE_LABEL).map(([v, l]) => ({ v, l })),
            ]} />
            <FilterSelect label="Status" value={empStatus} onChange={setEmpStatus} options={[
              { v: "active", l: "Active" }, { v: "left", l: "Left / Inactive" }, { v: "all", l: "All" },
            ]} />
            <Button variant="outline" size="sm" onClick={exportCsv} className="gap-2">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>

          {/* Bulk action bar */}
          {selected.size > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2 p-3 rounded-lg bg-[#EFE6D6] border border-[#B89555]/40">
              <span className="font-semibold text-[#1A1A1A]">{selected.size} selected</span>
              <div className="flex-1" />
              <Button size="sm" variant="outline" onClick={() => setStatusDialog("left_company")} className="gap-1">
                <UserCheck className="h-4 w-4" /> Mark as left
              </Button>
              <Button size="sm" variant="outline" onClick={() => setStatusDialog("on_leave")}>On leave</Button>
              <Select onValueChange={(v) => setTypeDialog(v as EmploymentType)}>
                <SelectTrigger className="w-[180px] h-9"><Briefcase className="h-4 w-4 mr-1" /><SelectValue placeholder="Set employment type" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABEL).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button size="sm" variant="destructive" onClick={() => setDeleteDialog(true)} className="gap-1">
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employee list */}
      <Card className="bg-gradient-to-br from-[#FDFBF7] to-[#F7F1E6] border-2 border-[#B89555]/30 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Activity className="h-5 w-5 text-[#1A1A1A]" />
            Employee Performance Overview
            <Badge className="ml-2 bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/40">
              {filtered.length} {filtered.length === 1 ? "employee" : "employees"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B89555]" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-[#1A1A1A]/70 text-center py-8">No employees match the current filters.</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-2 pb-2 text-xs text-[#1A1A1A]/70">
                <Checkbox checked={selected.size === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} />
                <span>Select all visible</span>
              </div>
              {filtered.map((emp) => {
                const a = activity[emp.user_id];
                const isSelected = selected.has(emp.user_id);
                const inactive = emp.employment_status !== "active";
                return (
                  <div
                    key={emp.id}
                    className={`border rounded-xl p-4 transition-all ${
 isSelected ? "border-[#B89555] bg-[#FDFBF7]" : "border-[#B89555]/20 bg-[#FDFBF7]/60"
 } ${inactive ? "opacity-70" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox checked={isSelected} onCheckedChange={() => toggleOne(emp.user_id)} className="mt-2" />
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#EFE6D6] to-[#F7F1E6] flex items-center justify-center border border-[#B89555]/40 shrink-0">
                        {emp.photo_url ? (
                          <img src={emp.photo_url} alt="" className="w-full h-full rounded-full object-cover"  loading="lazy" decoding="async" />
                        ) : (
                          <span className="font-bold text-[#1A1A1A]">{(emp.display_name ?? "?").charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-[#1A1A1A]">{emp.display_name ?? "Unnamed"}</p>
                          {emp.employment_type && (
                            <Badge variant="outline" className="text-[10px] border-[#B89555]/40 text-[#1A1A1A]">
                              {TYPE_LABEL[emp.employment_type]}
                            </Badge>
                          )}
                          {inactive && (
                            <Badge variant="outline" className="text-[10px] border-red-400/50 text-red-700 bg-red-50">
                              {STATUS_LABEL[emp.employment_status]}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-[#1A1A1A]/70">
                          {emp.job_title ?? "Employee"}
                          {emp.department ? ` • ${emp.department}` : ""}
                        </p>

                        {/* Pipeline chips */}
                        {a && Object.keys(a.pipeline_counts ?? {}).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {Object.entries(a.pipeline_counts).map(([k, v]) => (
                              <span
                                key={k}
                                className={`text-[10px] px-2 py-0.5 rounded-full border ${PIPELINE_COLORS[k] ?? "border-[#B89555]/30 text-[#1A1A1A] bg-[#F7F1E6]"}`}
                              >
                                {fmtStageKey(k)}: {v}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="hidden md:grid grid-cols-4 gap-4 text-center text-sm">
                        <Metric label="Calls" v={a?.calls_30d ?? 0} />
                        <Metric label="Chats" v={a?.chats_30d ?? 0} />
                        <Metric label="Leads" v={a?.leads_contacted_30d ?? 0} />
                        <Metric label="Tasks" v={a?.tasks_completed ?? 0} />
                      </div>

                      <Button asChild variant="outline" size="sm" className="gap-1 shrink-0">
                        <Link to={`/owner/hr/employee/${emp.user_id}`}>
                          Open <ExternalLink className="h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status confirm */}
      <AlertDialog open={!!statusDialog} onOpenChange={(o) => !o && setStatusDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Set status to {statusDialog ? STATUS_LABEL[statusDialog] : ""} for {selected.size} employee(s)?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Their account becomes inactive. They keep ownership of past leads/calls so history stays intact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <label className="text-xs text-[#1A1A1A]/70">Reason (optional)</label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Left to join …" />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={submitting}
              onClick={() => statusDialog && runBulk("set_status", {
                employment_status: statusDialog,
                left_reason: reason || undefined,
              })}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Type confirm */}
      <AlertDialog open={!!typeDialog} onOpenChange={(o) => !o && setTypeDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Set employment type to {typeDialog ? TYPE_LABEL[typeDialog] : ""} for {selected.size} employee(s)?
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={submitting}
              onClick={() => typeDialog && runBulk("set_employment_type", { employment_type: typeDialog })}
            >
              Apply
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirm */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {selected.size} employee(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              They are marked terminated and deactivated. Their leads, calls and historical activity remain in the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <label className="text-xs text-[#1A1A1A]/70">Reason (optional)</label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Departure reason" />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => runBulk("delete", { left_reason: reason || undefined })}
            >
              Confirm remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function KpiCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card className="bg-gradient-to-br from-[#F7F1E6] to-[#ECE2D2] border-2 border-[#B89555]/30 shadow-lg">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[#1A1A1A]/70">{label}</p>
            <p className="text-2xl font-bold text-[#1A1A1A]">{value.toLocaleString()}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#FDFBF7] border border-[#B89555]/30 flex items-center justify-center">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, v }: { label: string; v: number }) {
  return (
    <div>
      <p className="text-[#1A1A1A]/70 text-xs">{label}</p>
      <p className="font-semibold text-[#1A1A1A]">{v}</p>
    </div>
  );
}

function FilterSelect({
  label, value, onChange, options,
}: { label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <div className="min-w-[160px]">
      <label className="text-xs text-[#1A1A1A]/70 mb-1 block">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
