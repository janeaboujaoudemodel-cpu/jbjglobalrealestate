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
import { ShieldCheck, Users, Database, UserPlus, Loader2, Search, FileLock2 } from "lucide-react";
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
          onClose={(changed) => {
            setTarget(null);
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
  onClose,
}: {
  employee: Employee;
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
