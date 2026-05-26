import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ShieldCheck, Users, Database, UserPlus, Loader2, Search, FileLock2, Settings2, X } from "lucide-react";
import { toast } from "sonner";

interface Employee {
  user_id: string;
  display_name: string | null;
  email: string | null;
  job_title: string | null;
  department: string | null;
  is_active: boolean;
  assigned_count?: number;
}

interface LeadRow {
  id: string;
  full_name: string;
  email_lower: string | null;
  phone_e164: string | null;
  pipeline_stage: string | null;
  source: string | null;
}

interface DbRow {
  id: string;
  name: string;
  row_count: number;
  uploaded_at: string;
}

export default function EmployeeAssignmentsPanel({ searchQuery = "" }: { searchQuery?: string }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState<Employee | null>(null);
  const [manage, setManage] = useState<Employee | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: profs } = await supabase
      .from("crm_users_profile")
      .select("user_id, display_name, email, job_title, department, is_active")
      .eq("is_active", true)
      .order("display_name", { ascending: true });

    const list = (profs || []) as Employee[];

    if (list.length) {
      const ids = list.map((e) => e.user_id);
      const { data: counts } = await supabase
        .from("crm_lead_assignments")
        .select("assigned_to_user_id")
        .in("assigned_to_user_id", ids)
        .is("unassigned_at", null);

      const map = new Map<string, number>();
      (counts || []).forEach((r: any) =>
        map.set(r.assigned_to_user_id, (map.get(r.assigned_to_user_id) || 0) + 1),
      );
      list.forEach((e) => (e.assigned_count = map.get(e.user_id) || 0));
    }

    setEmployees(list);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        (e.display_name || "").toLowerCase().includes(q) ||
        (e.email || "").toLowerCase().includes(q) ||
        (e.job_title || "").toLowerCase().includes(q) ||
        (e.department || "").toLowerCase().includes(q),
    );
  }, [employees, searchQuery]);

  return (
    <div className="space-y-4">
      <Card className="bg-[#F7F2EA] border border-[#B89555]/30">
        <CardContent className="p-4 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#B89555] shrink-0 mt-0.5" />
          <div className="text-sm text-[#1A1A1A]">
            <div className="font-semibold mb-1">No-delete employee CRM — enforced at the database</div>
            <div className="text-[#1A1A1A]/70">
              Employees can only see leads explicitly assigned to them and update statuses
              (e.g. mark as Junk / Qualified). They <strong>cannot delete</strong> leads, change
              ownership, or see data outside their assignments. Enforced by row-level security
              policies on <code className="text-xs">crm_leads</code> and{" "}
              <code className="text-xs">crm_lead_assignments</code>.
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40">
        <CardHeader>
          <CardTitle className="text-[#1A1A1A] flex items-center gap-2">
            <Users className="w-5 h-5" /> Active employees ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#B89555]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-[#1A1A1A]/60">
              No active employees yet. Provision an account first from the IT Provisioning tab.
            </div>
          ) : (
            <div className="divide-y divide-[#B89555]/20">
              {filtered.map((e) => (
                <div
                  key={e.user_id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-[#1A1A1A] truncate">
                      {e.display_name || e.email || "Employee"}
                    </div>
                    <div className="text-xs text-[#1A1A1A]/60 truncate">
                      {[e.job_title, e.department].filter(Boolean).join(" · ") || e.email}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant="outline"
                      className="bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A]"
                    >
                      {e.assigned_count ?? 0} leads
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setManage(e)}
                      className="border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]"
                      disabled={!e.assigned_count}
                    >
                      <Settings2 className="w-3.5 h-3.5 mr-1.5" /> Manage
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setTarget(e)}
                      className="bg-[#1A1A1A] text-white hover:bg-[#2a2a2a]"
                    >
                      <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Assign
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {target && (
        <AssignmentDialog
          employee={target}
          employees={employees}
          onClose={(changed) => {
            setTarget(null);
            if (changed) load();
          }}
        />
      )}

      {manage && (
        <ManageAssignmentsDialog
          employee={manage}
          employees={employees}
          onClose={(changed) => {
            setManage(null);
            if (changed) load();
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------- dialog ---------------------------------- */

function AssignmentDialog({
  employee,
  employees: _employees,
  onClose,
}: {
  employee: Employee;
  employees: Employee[];
  onClose: (changed: boolean) => void;
}) {
  const [tab, setTab] = useState<"leads" | "database">("leads");
  const [search, setSearch] = useState("");
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [dbs, setDbs] = useState<DbRow[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [selectedDb, setSelectedDb] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: ld }, { data: db }] = await Promise.all([
        supabase
          .from("crm_leads")
          .select("id, full_name, email_lower, phone_e164, pipeline_stage, source")
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(500),
        supabase
          .from("crm_source_databases")
          .select("id, name, row_count, uploaded_at")
          .is("archived_at", null)
          .order("uploaded_at", { ascending: false })
          .limit(100),
      ]);
      setLeads((ld || []) as LeadRow[]);
      setDbs((db || []) as DbRow[]);
      setLoading(false);
    })();
  }, []);

  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter(
      (l) =>
        l.full_name?.toLowerCase().includes(q) ||
        l.email_lower?.toLowerCase().includes(q) ||
        l.phone_e164?.toLowerCase().includes(q),
    );
  }, [leads, search]);

  const filteredDbs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return dbs;
    return dbs.filter((d) => d.name.toLowerCase().includes(q));
  }, [dbs, search]);

  const toggleLead = (id: string) => {
    const next = new Set(selectedLeads);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedLeads(next);
  };

  const handleAssign = async () => {
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const assignedBy = u?.user?.id || null;

      let leadIds: string[] = [];
      if (tab === "leads") {
        leadIds = Array.from(selectedLeads);
      } else if (tab === "database" && selectedDb) {
        const { data: rows } = await supabase
          .from("crm_leads")
          .select("id")
          .eq("source_database_id", selectedDb)
          .is("deleted_at", null);
        leadIds = (rows || []).map((r: any) => r.id);
      }

      if (!leadIds.length) {
        toast.error("Select at least one lead or a database with leads");
        setBusy(false);
        return;
      }

      // Skip leads already actively assigned to this employee
      const { data: existing } = await supabase
        .from("crm_lead_assignments")
        .select("lead_id")
        .eq("assigned_to_user_id", employee.user_id)
        .is("unassigned_at", null)
        .in("lead_id", leadIds);
      const dup = new Set((existing || []).map((r: any) => r.lead_id));
      const fresh = leadIds.filter((id) => !dup.has(id));

      if (!fresh.length) {
        toast.info(`All ${leadIds.length} leads are already assigned to ${employee.display_name || "this employee"}`);
        onClose(false);
        return;
      }

      const rows = fresh.map((lead_id) => ({
        lead_id,
        assigned_to_user_id: employee.user_id,
        assigned_by_user_id: assignedBy,
      }));

      const { error } = await supabase.from("crm_lead_assignments").insert(rows);
      if (error) throw error;

      // Mirror onto crm_leads.assigned_to_user_id for fast filtering / kanban
      await supabase
        .from("crm_leads")
        .update({ assigned_to_user_id: employee.user_id })
        .in("id", fresh);

      toast.success(
        `Assigned ${fresh.length} lead${fresh.length === 1 ? "" : "s"} to ${employee.display_name || "employee"}` +
          (dup.size ? ` (${dup.size} already assigned)` : ""),
      );
      onClose(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to assign leads");
    } finally {
      setBusy(false);
    }
  };

  const targetDb = selectedDb ? dbs.find((d) => d.id === selectedDb) : null;
  const canSubmit =
    (tab === "leads" && selectedLeads.size > 0) || (tab === "database" && !!selectedDb);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose(false)}>
      <DialogContent className="max-w-2xl bg-[#FDFBF7] border-[#B89555]/40">
        <DialogHeader>
          <DialogTitle className="text-[#1A1A1A] flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#B89555]" />
            Assign to {employee.display_name || employee.email}
          </DialogTitle>
          <DialogDescription className="text-[#1A1A1A]/70">
            Pick individual leads, or assign an entire database. The employee will see only what
            you assign — and can never delete leads.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="bg-[#F7F2EA] border border-[#B89555]/30">
            <TabsTrigger value="leads" className="data-[state=active]:bg-[#EFE6D6]">
              <Users className="w-3.5 h-3.5 mr-1.5" /> Individual leads
            </TabsTrigger>
            <TabsTrigger value="database" className="data-[state=active]:bg-[#EFE6D6]">
              <Database className="w-3.5 h-3.5 mr-1.5" /> Whole database
            </TabsTrigger>
          </TabsList>

          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]/50" />
            <Input
              placeholder={tab === "leads" ? "Search leads by name, email, phone…" : "Search databases…"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A]"
            />
          </div>

          <TabsContent value="leads" className="mt-3">
            <div className="border border-[#B89555]/30 rounded-md max-h-[340px] overflow-y-auto bg-[#FDFBF7]">
              {loading ? (
                <div className="py-10 flex justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-[#B89555]" />
                </div>
              ) : filteredLeads.length === 0 ? (
                <div className="py-8 text-center text-sm text-[#1A1A1A]/60">No leads found.</div>
              ) : (
                <ul className="divide-y divide-[#B89555]/15">
                  {filteredLeads.map((l) => {
                    const checked = selectedLeads.has(l.id);
                    return (
                      <li key={l.id}>
                        <label className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-[#F7F2EA]">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleLead(l.id)}
                            className="accent-[#B89555]"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-[#1A1A1A] truncate">
                              {l.full_name || "(unnamed)"}
                            </div>
                            <div className="text-xs text-[#1A1A1A]/60 truncate">
                              {l.email_lower || l.phone_e164 || "—"}
                              {l.source ? ` · ${l.source}` : ""}
                            </div>
                          </div>
                          {l.pipeline_stage && (
                            <Badge variant="outline" className="text-xs border-[#B89555]/30">
                              {l.pipeline_stage}
                            </Badge>
                          )}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div className="mt-2 text-xs text-[#1A1A1A]/60 flex items-center gap-2">
              <FileLock2 className="w-3.5 h-3.5" />
              {selectedLeads.size} selected · showing first 500 leads (refine with search)
            </div>
          </TabsContent>

          <TabsContent value="database" className="mt-3">
            <div className="border border-[#B89555]/30 rounded-md max-h-[340px] overflow-y-auto bg-[#FDFBF7]">
              {loading ? (
                <div className="py-10 flex justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-[#B89555]" />
                </div>
              ) : filteredDbs.length === 0 ? (
                <div className="py-8 text-center text-sm text-[#1A1A1A]/60">
                  No databases yet. Upload one from the CRM &gt; Database section first.
                </div>
              ) : (
                <ul className="divide-y divide-[#B89555]/15">
                  {filteredDbs.map((d) => (
                    <li key={d.id}>
                      <label className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-[#F7F2EA]">
                        <input
                          type="radio"
                          name="db"
                          checked={selectedDb === d.id}
                          onChange={() => setSelectedDb(d.id)}
                          className="accent-[#B89555]"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-[#1A1A1A] truncate">{d.name}</div>
                          <div className="text-xs text-[#1A1A1A]/60">
                            {d.row_count.toLocaleString()} rows · uploaded{" "}
                            {new Date(d.uploaded_at).toLocaleDateString()}
                          </div>
                        </div>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {targetDb && (
              <div className="mt-2 text-xs text-[#1A1A1A]/70">
                Will assign all <strong>{targetDb.row_count.toLocaleString()}</strong> leads from
                "{targetDb.name}" to {employee.display_name || "this employee"}.
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onClose(false)} disabled={busy}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!canSubmit || busy}
            className="bg-[#1A1A1A] text-white hover:bg-[#2a2a2a]"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* --------------------------- manage dialog ------------------------------ */

interface AssignedLeadRow {
  assignment_id: string;
  lead_id: string;
  full_name: string;
  email_lower: string | null;
  phone_e164: string | null;
  pipeline_stage: string | null;
  assigned_at: string;
}

function ManageAssignmentsDialog({
  employee,
  employees,
  onClose,
}: {
  employee: Employee;
  employees: Employee[];
  onClose: (changed: boolean) => void;
}) {
  const [rows, setRows] = useState<AssignedLeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [reassignTo, setReassignTo] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [changed, setChanged] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("crm_lead_assignments")
      .select("id, lead_id, assigned_at, crm_leads(full_name, email_lower, phone_e164, pipeline_stage)")
      .eq("assigned_to_user_id", employee.user_id)
      .is("unassigned_at", null)
      .order("assigned_at", { ascending: false });

    const mapped: AssignedLeadRow[] = (data || []).map((r: any) => ({
      assignment_id: r.id,
      lead_id: r.lead_id,
      full_name: r.crm_leads?.full_name || "(unnamed)",
      email_lower: r.crm_leads?.email_lower || null,
      phone_e164: r.crm_leads?.phone_e164 || null,
      pipeline_stage: r.crm_leads?.pipeline_stage || null,
      assigned_at: r.assigned_at,
    }));
    setRows(mapped);
    setSelected(new Set());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [employee.user_id]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.full_name.toLowerCase().includes(q) ||
        r.email_lower?.toLowerCase().includes(q) ||
        r.phone_e164?.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const toggle = (id: string) => {
    const n = new Set(selected);
    n.has(id) ? n.delete(id) : n.add(id);
    setSelected(n);
  };

  const selectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((r) => r.assignment_id)));
  };

  const handleRevoke = async () => {
    if (!selected.size) return;
    setBusy(true);
    try {
      const ids = Array.from(selected);
      const { error } = await supabase
        .from("crm_lead_assignments")
        .update({ unassigned_at: new Date().toISOString() })
        .in("id", ids);
      if (error) throw error;

      const leadIds = rows.filter((r) => selected.has(r.assignment_id)).map((r) => r.lead_id);
      await supabase
        .from("crm_leads")
        .update({ assigned_to_user_id: null })
        .in("id", leadIds)
        .eq("assigned_to_user_id", employee.user_id);

      toast.success(`Revoked ${ids.length} assignment${ids.length === 1 ? "" : "s"}`);
      setChanged(true);
      await load();
    } catch (err: any) {
      toast.error(err.message || "Failed to revoke");
    } finally {
      setBusy(false);
    }
  };

  const handleReassign = async () => {
    if (!selected.size || !reassignTo) return;
    setBusy(true);
    try {
      const ids = Array.from(selected);
      const picked = rows.filter((r) => selected.has(r.assignment_id));
      const leadIds = picked.map((r) => r.lead_id);

      // 1. revoke current
      const { error: revErr } = await supabase
        .from("crm_lead_assignments")
        .update({ unassigned_at: new Date().toISOString() })
        .in("id", ids);
      if (revErr) throw revErr;

      // 2. skip leads already actively assigned to target
      const { data: existing } = await supabase
        .from("crm_lead_assignments")
        .select("lead_id")
        .eq("assigned_to_user_id", reassignTo)
        .is("unassigned_at", null)
        .in("lead_id", leadIds);
      const dup = new Set((existing || []).map((r: any) => r.lead_id));
      const fresh = leadIds.filter((id) => !dup.has(id));

      if (fresh.length) {
        const { data: u } = await supabase.auth.getUser();
        const insertRows = fresh.map((lead_id) => ({
          lead_id,
          assigned_to_user_id: reassignTo,
          assigned_by_user_id: u?.user?.id || null,
        }));
        const { error: insErr } = await supabase.from("crm_lead_assignments").insert(insertRows);
        if (insErr) throw insErr;

        await supabase
          .from("crm_leads")
          .update({ assigned_to_user_id: reassignTo })
          .in("id", fresh);
      }

      toast.success(
        `Reassigned ${fresh.length} lead${fresh.length === 1 ? "" : "s"}` +
          (dup.size ? ` (${dup.size} already assigned to target)` : ""),
      );
      setChanged(true);
      setReassignTo("");
      await load();
    } catch (err: any) {
      toast.error(err.message || "Failed to reassign");
    } finally {
      setBusy(false);
    }
  };

  const otherEmployees = employees.filter((e) => e.user_id !== employee.user_id);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose(changed)}>
      <DialogContent className="max-w-3xl bg-[#FDFBF7] border-[#B89555]/40">
        <DialogHeader>
          <DialogTitle className="text-[#1A1A1A] flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-[#B89555]" />
            Manage assignments — {employee.display_name || employee.email}
          </DialogTitle>
          <DialogDescription className="text-[#1A1A1A]/70">
            Revoke individual assignments or bulk-reassign leads to a different employee. Revoking
            does not delete the lead — it only removes this employee's access.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]/50" />
          <Input
            placeholder="Search assigned leads…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A]"
          />
        </div>

        <div className="border border-[#B89555]/30 rounded-md max-h-[360px] overflow-y-auto bg-[#FDFBF7]">
          {loading ? (
            <div className="py-10 flex justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-[#B89555]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-[#1A1A1A]/60">
              {rows.length ? "No leads match your search." : "No active assignments."}
            </div>
          ) : (
            <>
              <div className="sticky top-0 bg-[#F7F2EA] border-b border-[#B89555]/20 px-3 py-2 flex items-center gap-2 text-xs text-[#1A1A1A]">
                <input
                  type="checkbox"
                  checked={selected.size > 0 && selected.size === filtered.length}
                  onChange={selectAll}
                  className="accent-[#B89555]"
                />
                <span>
                  {selected.size} of {filtered.length} selected
                </span>
              </div>
              <ul className="divide-y divide-[#B89555]/15">
                {filtered.map((r) => (
                  <li key={r.assignment_id}>
                    <label className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-[#F7F2EA]">
                      <input
                        type="checkbox"
                        checked={selected.has(r.assignment_id)}
                        onChange={() => toggle(r.assignment_id)}
                        className="accent-[#B89555]"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-[#1A1A1A] truncate">
                          {r.full_name}
                        </div>
                        <div className="text-xs text-[#1A1A1A]/60 truncate">
                          {r.email_lower || r.phone_e164 || "—"} · assigned{" "}
                          {new Date(r.assigned_at).toLocaleDateString()}
                        </div>
                      </div>
                      {r.pipeline_stage && (
                        <Badge variant="outline" className="text-xs border-[#B89555]/30">
                          {r.pipeline_stage}
                        </Badge>
                      )}
                    </label>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between border-t border-[#B89555]/20 pt-3">
          <div className="flex items-center gap-2 flex-1">
            <select
              value={reassignTo}
              onChange={(e) => setReassignTo(e.target.value)}
              className="h-9 rounded-md border border-[#B89555]/30 bg-[#FDFBF7] px-2 text-sm text-[#1A1A1A] flex-1 min-w-0"
              disabled={!selected.size || busy}
            >
              <option value="">Reassign selected to…</option>
              {otherEmployees.map((e) => (
                <option key={e.user_id} value={e.user_id}>
                  {e.display_name || e.email || e.user_id}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              onClick={handleReassign}
              disabled={!selected.size || !reassignTo || busy}
              className="bg-[#1A1A1A] text-white hover:bg-[#2a2a2a] shrink-0"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <UserPlus className="w-3.5 h-3.5 mr-1.5" />}
              Reassign
            </Button>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRevoke}
            disabled={!selected.size || busy}
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            <X className="w-3.5 h-3.5 mr-1.5" />
            Revoke ({selected.size})
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onClose(changed)} disabled={busy}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
