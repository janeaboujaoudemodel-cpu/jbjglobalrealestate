/**
 * IndividualBrokersTab — flat directory of every broker (person) you've added,
 * across all agencies plus standalone brokers. Renders both a card grid and an
 * Excel-style grid so it's always usable as either view.
 */
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ExcelGridView } from "@/components/crm/ExcelGridView";
import BrokerBulkUploadDialog from "@/components/crm/BrokerBulkUploadDialog";
import { exportRowsToXlsx } from "@/utils/exportXlsx";
import { Plus, Search, User, Phone, Mail, MessageCircle, Trash2, UploadCloud, FileDown } from "lucide-react";

type Row = {
  id: string;
  brokerage_id: string | null;
  name: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  role: string | null;
  status: string;
  source: string;
  created_at: string;
  expertise_type?: string | null;
  expertise_areas?: string[] | null;
  import_label?: string | null;
  specialty_labels?: string[] | null;
  source_history?: any[] | null;
  source_batch_ids?: string[] | null;
  country?: string | null;
  license_number?: string | null;
  rera_number?: string | null;
  brokerage?: { company_name: string | null } | null;
};

const STATUS_OPTS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "unknown", label: "Unknown" },
];

export default function IndividualBrokersTab() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [agencyFilter, setAgencyFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expertiseFilter, setExpertiseFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Row> | null>(null);

  const { data: rows = [], isLoading } = useQuery<Row[]>({
    queryKey: ["crm-individual-brokers"],
    queryFn: async () => {
      const PAGE = 1000;
      const all: Row[] = [];
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await (supabase as any)
          .from("crm_brokerage_agents")
          .select("id, brokerage_id, name, phone, whatsapp, email, role, status, source, created_at, expertise_type, expertise_areas, import_label, specialty_labels, source_history, source_batch_ids, country, license_number, rera_number, brokerage:crm_brokerages(company_name)")
          .order("created_at", { ascending: false })
          .range(from, from + PAGE - 1);
        if (error) throw error;
        const batch = (data ?? []) as Row[];
        all.push(...batch);
        if (batch.length < PAGE) break;
        if (from > 200_000) break;
      }
      return all;
    },
  });

  const { data: brokerages = [] } = useQuery<{ id: string; company_name: string }[]>({
    queryKey: ["crm-brokerages-min"],
    queryFn: async () => {
      const PAGE = 1000;
      const all: any[] = [];
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await (supabase as any)
          .from("crm_brokerages")
          .select("id, company_name")
          .order("company_name")
          .range(from, from + PAGE - 1);
        if (error) throw error;
        const batch = data ?? [];
        all.push(...batch);
        if (batch.length < PAGE) break;
        if (from > 200_000) break;
      }
      return all;
    },
  });

  const upsert = useMutation({
    mutationFn: async (patch: Partial<Row> & { id?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const payload: any = {
        owner_id: user.id,
        brokerage_id: patch.brokerage_id || null,
        name: patch.name || "Unknown",
        phone: patch.phone || null,
        whatsapp: patch.whatsapp || patch.phone || null,
        email: patch.email || null,
        role: patch.role || null,
        status: patch.status || "active",
        source: patch.source || "manual",
        expertise_type: patch.expertise_type || "both",
        expertise_areas: patch.expertise_areas || [],
      };
      if (patch.id) {
        const { error } = await (supabase as any).from("crm_brokerage_agents").update(payload).eq("id", patch.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("crm_brokerage_agents").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-individual-brokers"] });
      toast.success("Broker saved");
      setOpen(false);
    },
    onError: (e: any) => toast.error(e?.message || "Could not save"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("crm_brokerage_agents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-individual-brokers"] });
      toast.success("Broker removed");
    },
  });

  const updateStatus = (row: Row, next: string) => upsert.mutate({ id: row.id, status: next, brokerage_id: row.brokerage_id });

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (expertiseFilter !== "all") {
        const et = r.expertise_type || "both";
        if (expertiseFilter === "leasing" && !(et === "leasing" || et === "both")) return false;
        if (expertiseFilter === "selling" && !(et === "selling" || et === "both")) return false;
      }
      if (agencyFilter === "__none__" && r.brokerage_id) return false;
      if (agencyFilter !== "all" && agencyFilter !== "__none__" && r.brokerage_id !== agencyFilter) return false;
      if (!ql) return true;
      const hay = [r.name, r.phone, r.whatsapp, r.email, r.role, r.brokerage?.company_name, ...(r.expertise_areas || [])].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(ql);
    });
  }, [rows, q, agencyFilter, statusFilter, expertiseFilter]);

  const openNew = () => { setEditing({ status: "active", source: "manual", expertise_type: "both", expertise_areas: [] }); setOpen(true); };

  const exportExcel = () => {
    if (filtered.length === 0) { toast.error("Nothing to export"); return; }
    const out = filtered.map(r => ({
      Name: r.name, Agency: r.brokerage?.company_name || "Standalone",
      Role: r.role, Phone: r.phone, WhatsApp: r.whatsapp, Email: r.email,
      Expertise: r.expertise_type || "both",
      Areas: (r.expertise_areas || []).join(", "),
      Status: r.status, Batch: r.import_label || "",
      Added: new Date(r.created_at).toLocaleDateString(),
    }));
    exportRowsToXlsx(out, "individual-brokers");
    toast.success(`Exported ${out.length} brokers`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#1A1A1A]/70" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone, email, agency…" className="pl-10" />
        </div>
        <Select value={agencyFilter} onValueChange={setAgencyFilter}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Agency" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All agencies · {rows.length}</SelectItem>
            <SelectItem value="__none__">Standalone (no agency)</SelectItem>
            {brokerages.map((b) => (
              <SelectItem key={b.id} value={b.id}>{b.company_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_OPTS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={expertiseFilter} onValueChange={setExpertiseFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All expertise</SelectItem>
            <SelectItem value="leasing">Leasing</SelectItem>
            <SelectItem value="selling">Selling</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportExcel}><FileDown className="w-4 h-4 mr-2" /> Export Excel</Button>
        <Button variant="outline" onClick={() => setBulkOpen(true)}><UploadCloud className="w-4 h-4 mr-2" /> Upload database</Button>
        <Button variant="gold" onClick={openNew}><Plus className="w-4 h-4 mr-2" /> Add broker</Button>
      </div>

      <div className="rounded-xl border border-[#B89555]/30 bg-[#FDFBF7] p-3 text-xs text-[#1A1A1A]/80">
        <b className="text-[#1A1A1A]">{filtered.length}</b> broker{filtered.length === 1 ? "" : "s"} shown · total <b className="text-[#1A1A1A]">{rows.length}</b>.
        Both a card view and the Excel grid render below — newly added brokers appear immediately in both.
      </div>

      {/* Cards */}
      {isLoading ? (
        <Skeleton className="h-40" />
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-[#1A1A1A]/70">
          No brokers yet — click <b className="text-[#1A1A1A]">Add broker</b> to start your individual broker rolodex.
        </CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => (
            <Card key={r.id} className="bg-[#FDFBF7] border-[#1A1A1A]/10 hover:shadow-md transition rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#EFE6D6] border border-[#B89555]/40 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-[#1A1A1A]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => { setEditing(r); setOpen(true); }}
                      className="font-bold text-[#1A1A1A] hover:underline decoration-[#B89555] underline-offset-4 truncate text-left block w-full"
                    >
                      {r.name || "Unknown"}
                    </button>
                    <div className="text-[11px] text-[#1A1A1A]/70 truncate">
                      {r.role ? `${r.role} · ` : ""}{r.brokerage?.company_name || "Standalone"}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                      {(r.expertise_type === "leasing" || r.expertise_type === "both") && (
                        <span className="px-2 py-0.5 rounded-full border border-emerald-300 bg-emerald-50 text-emerald-900">Leasing</span>
                      )}
                      {(r.expertise_type === "selling" || r.expertise_type === "both") && (
                        <span className="px-2 py-0.5 rounded-full border border-blue-300 bg-blue-50 text-blue-900">Selling</span>
                      )}
                      {(r.expertise_areas || []).slice(0, 3).map((a) => (
                        <span key={a} className="px-2 py-0.5 rounded-full border border-[#B89555]/40 bg-[#EFE6D6] text-[#1A1A1A]">{a}</span>
                      ))}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                      {r.phone && <a href={`tel:${r.phone}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#B89555]/40 bg-[#F7F2EA] text-[#1A1A1A] hover:bg-[#EFE6D6]"><Phone className="w-3 h-3" />{r.phone}</a>}
                      {r.whatsapp && <a href={`https://wa.me/${r.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#B89555]/40 bg-[#F7F2EA] text-[#1A1A1A] hover:bg-[#EFE6D6]"><MessageCircle className="w-3 h-3" />WhatsApp</a>}
                      {r.email && <a href={`mailto:${r.email}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#B89555]/40 bg-[#F7F2EA] text-[#1A1A1A] hover:bg-[#EFE6D6]"><Mail className="w-3 h-3" />{r.email}</a>}
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => { if (confirm(`Remove ${r.name || "this broker"}?`)) remove.mutate(r.id); }} aria-label="Remove broker">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Excel grid — always visible */}
      <ExcelGridView
        rows={filtered as any[]}
        columns={[
          { key: "name", label: "Name", width: 200, editable: true },
          { key: "agency", label: "Agency", width: 220, render: (r: any) => r.brokerage?.company_name || "—" },
          { key: "role", label: "Role", width: 160, editable: true },
          { key: "phone", label: "Phone", width: 150, editable: true },
          { key: "whatsapp", label: "WhatsApp", width: 150, editable: true },
          { key: "email", label: "Email", width: 220, editable: true },
          {
            key: "status", label: "Status", width: 130, status: true,
            statusOptions: STATUS_OPTS,
            onStatusChange: (r: any, next) => updateStatus(r, next),
          },
          { key: "expertise_type", label: "Expertise", width: 110, render: (r: any) => r.expertise_type || "both" },
          { key: "expertise_areas", label: "Areas", width: 200, render: (r: any) => (r.expertise_areas || []).join(", ") || "—" },
          { key: "import_label", label: "Batch", width: 160, render: (r: any) => r.import_label || "—" },
          { key: "created_at", label: "Added", width: 130, render: (r: any) => new Date(r.created_at).toLocaleDateString() },
        ]}
        onCellEdit={(r: any, key, value) => upsert.mutate({ id: r.id, brokerage_id: r.brokerage_id, [key]: value } as any)}
        emptyLabel="No brokers match these filters."
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit broker" : "Add individual broker"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Name</Label><Input value={editing?.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div><Label>Role / specialty</Label><Input value={editing?.role || ""} onChange={(e) => setEditing({ ...editing, role: e.target.value })} /></div>
              <div><Label>Phone</Label><Input value={editing?.phone || ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} /></div>
              <div><Label>WhatsApp</Label><Input value={editing?.whatsapp || ""} onChange={(e) => setEditing({ ...editing, whatsapp: e.target.value })} /></div>
              <div className="col-span-2"><Label>Email</Label><Input type="email" value={editing?.email || ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></div>
              <div className="col-span-2">
                <Label>Agency (optional)</Label>
                <Select value={editing?.brokerage_id || "__none__"} onValueChange={(v) => setEditing({ ...editing, brokerage_id: v === "__none__" ? null : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Standalone (no agency)</SelectItem>
                    {brokerages.map((b) => <SelectItem key={b.id} value={b.id}>{b.company_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={editing?.status || "active"} onValueChange={(v) => setEditing({ ...editing, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUS_OPTS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Expertise *</Label>
                <Select value={editing?.expertise_type || "both"} onValueChange={(v) => setEditing({ ...editing, expertise_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leasing">Leasing</SelectItem>
                    <SelectItem value="selling">Selling</SelectItem>
                    <SelectItem value="both">Both (leasing + selling)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Areas of expertise (comma-separated)</Label>
                <Input
                  value={(editing?.expertise_areas || []).join(", ")}
                  placeholder="e.g. Dubai Marina, Downtown, JVC"
                  onChange={(e) => setEditing({ ...editing, expertise_areas: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => upsert.mutate(editing as any)} disabled={!editing?.name}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BrokerBulkUploadDialog
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        brokerages={brokerages}
        onDone={() => qc.invalidateQueries({ queryKey: ["crm-individual-brokers"] })}
      />
    </div>
  );
}
