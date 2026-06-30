import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft, Download, Phone, MessageSquare, TrendingUp, Target,
  Briefcase, UserX, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

const TYPE_LABEL: Record<string, string> = {
  full_time: "Full-time", part_time: "Part-time", freelancer: "Freelancer",
  referral: "Referral", intern: "Intern", contractor: "Contractor",
};

export default function EmployeeProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any | null>(null);
  const [activity, setActivity] = useState<any | null>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [calls, setCalls] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Danger zone
  const [statusOpen, setStatusOpen] = useState<string | null>(null);
  const [typeOpen, setTypeOpen] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [profRes, actRes, leadRes, callsRes, chatsRes] = await Promise.all([
        supabase.from("crm_users_profile").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("vw_employee_activity_30d").select("*").eq("user_id", userId).maybeSingle(),
        supabase.rpc("get_employee_lead_breakdown", { _user_id: userId }),
        supabase.from("broker_call_logs").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(200),
        supabase.from("broker_chat_logs").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(200),
      ]);
      setProfile(profRes.data);
      setActivity(actRes.data);
      setLeads(leadRes.data ?? []);
      setCalls(callsRes.data ?? []);
      setChats(chatsRes.data ?? []);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [userId]);

  const runAction = async (
    action: "set_status" | "set_employment_type" | "delete",
    payload: Record<string, unknown>,
  ) => {
    if (!userId) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("hr-bulk-employee-action", {
        body: { action, user_ids: [userId], payload },
      });
      if (error) throw error;
      toast.success((data as any)?.summary ?? "Updated");
      setStatusOpen(null); setTypeOpen(null); setDeleteOpen(false); setReason("");
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? "Action failed");
    } finally {
      setSubmitting(false);
    }
  };

  const exportLeadsCsv = () => {
    if (leads.length === 0) return;
    const header = Object.keys(leads[0]).join(",");
    const csv = [
      header,
      ...leads.map((l) => Object.values(l).map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${profile?.display_name ?? "employee"}-leads.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pipelineCounts = useMemo(() => activity?.pipeline_counts ?? {}, [activity]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B89555]" />
      </div>
    );
  }
  if (!profile) {
    return (
      <div className="container max-w-4xl mx-auto pt-24 px-4">
        <Button variant="ghost" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
        <p className="mt-8 text-center text-[#1A1A1A]/70">Employee not found.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto pt-24 px-4 pb-12 space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="gap-1">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      {/* Header */}
      <Card className="bg-gradient-to-br from-[#FDFBF7] to-[#F7F1E6] border-2 border-[#B89555]/30">
        <CardContent className="pt-6 flex flex-wrap items-start gap-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#EFE6D6] to-[#F7F1E6] flex items-center justify-center border border-[#B89555]/40">
            {profile.photo_url ? (
              <img src={profile.photo_url} alt="" className="w-full h-full rounded-full object-cover"  loading="lazy" decoding="async" />
            ) : (
              <span className="text-2xl font-bold text-[#1A1A1A]">{(profile.display_name ?? "?").charAt(0)}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-[#1A1A1A]">{profile.display_name ?? "Unnamed"}</h1>
            <p className="text-[#1A1A1A]/70">
              {profile.job_title ?? "Employee"}{profile.department ? ` • ${profile.department}` : ""}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {profile.employment_type && (
                <Badge variant="outline" className="border-[#B89555]/40 text-[#1A1A1A]">
                  {TYPE_LABEL[profile.employment_type] ?? profile.employment_type}
                </Badge>
              )}
              <Badge variant="outline" className={profile.employment_status === "active"
                ? "border-[color:var(--emerald-1)]/30/40 text-[color:var(--emerald-1)] jj-emerald-soft"
                : "border-red-400/50 text-red-700 bg-red-50"}>
                {profile.employment_status}
              </Badge>
              {profile.left_at && (
                <Badge variant="outline" className="border-[#B89555]/40 text-[#1A1A1A]">
                  Left: {new Date(profile.left_at).toLocaleDateString()}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Calls (30d)" v={activity?.calls_30d ?? 0} icon={<Phone className="h-5 w-5 text-[color:var(--emerald-1)]" />} />
        <Kpi label="Chats (30d)" v={activity?.chats_30d ?? 0} icon={<MessageSquare className="h-5 w-5 text-blue-600" />} />
        <Kpi label="Leads Assigned" v={activity?.leads_assigned ?? 0} icon={<TrendingUp className="h-5 w-5 text-[#1A1A1A]" />} />
        <Kpi label="Tasks Completed" v={activity?.tasks_completed ?? 0} icon={<Target className="h-5 w-5 text-amber-600" />} />
      </div>

      {/* Pipeline */}
      {Object.keys(pipelineCounts).length > 0 && (
        <Card className="bg-[#FDFBF7] border-2 border-[#B89555]/30">
          <CardHeader><CardTitle className="text-[#1A1A1A]">Pipeline breakdown</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {Object.entries(pipelineCounts).map(([k, v]) => (
              <Badge key={k} variant="outline" className="border-[#B89555]/40 text-[#1A1A1A] text-sm">
                {k.replace(/_/g, " ")}: {v as number}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="leads">
        <TabsList>
          <TabsTrigger value="leads">Leads ({leads.length})</TabsTrigger>
          <TabsTrigger value="calls">Calls ({calls.length})</TabsTrigger>
          <TabsTrigger value="chats">Chats ({chats.length})</TabsTrigger>
          <TabsTrigger value="danger">Manage</TabsTrigger>
        </TabsList>

        <TabsContent value="leads">
          <Card className="bg-[#FDFBF7] border-2 border-[#B89555]/30">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-[#1A1A1A]">Leads owned by this employee</CardTitle>
              <Button variant="outline" size="sm" onClick={exportLeadsCsv} disabled={leads.length === 0} className="gap-1">
                <Download className="h-4 w-4" /> Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              {leads.length === 0 ? (
                <p className="text-[#1A1A1A]/70 text-sm py-6 text-center">No leads assigned.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-[#1A1A1A]/70 text-xs uppercase">
                      <tr>
                        <th className="py-2 pr-4">Name</th>
                        <th className="py-2 pr-4">Stage</th>
                        <th className="py-2 pr-4">Priority</th>
                        <th className="py-2 pr-4">Budget</th>
                        <th className="py-2 pr-4">Last contact</th>
                        <th className="py-2 pr-4">Notes</th>
                        <th className="py-2 pr-4"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((l) => (
                        <tr key={l.id} className="border-t border-[#B89555]/20">
                          <td className="py-2 pr-4 font-medium text-[#1A1A1A]">{l.full_name ?? "—"}</td>
                          <td className="py-2 pr-4">{l.pipeline_stage ?? "—"}</td>
                          <td className="py-2 pr-4">{l.priority ?? "—"}</td>
                          <td className="py-2 pr-4">
                            {l.budget_min || l.budget_max
                              ? `${l.budget_currency ?? ""} ${l.budget_min ?? "?"}–${l.budget_max ?? "?"}`
                              : "—"}
                          </td>
                          <td className="py-2 pr-4">{l.last_contacted_at ? new Date(l.last_contacted_at).toLocaleDateString() : "—"}</td>
                          <td className="py-2 pr-4 max-w-xs truncate">{l.notes ?? "—"}</td>
                          <td className="py-2 pr-4">
                            <Button variant="ghost" size="sm" asChild>
                              <Link to={`/owner/crm?section=leads&lead=${l.id}`}>Open</Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calls">
          <Card className="bg-[#FDFBF7] border-2 border-[#B89555]/30">
            <CardHeader><CardTitle className="text-[#1A1A1A]">Recent calls</CardTitle></CardHeader>
            <CardContent>
              {calls.length === 0 ? (
                <p className="text-[#1A1A1A]/70 text-sm py-6 text-center">No calls logged.</p>
              ) : (
                <ul className="divide-y divide-[#B89555]/20">
                  {calls.map((c) => (
                    <li key={c.id} className="py-2 text-sm flex items-center justify-between">
                      <div>
                        <p className="font-medium text-[#1A1A1A]">{c.phone_number ?? "—"}</p>
                        <p className="text-xs text-[#1A1A1A]/70">{c.call_type} · {c.call_status} · {c.duration_seconds ?? 0}s</p>
                      </div>
                      <span className="text-xs text-[#1A1A1A]/70">{new Date(c.created_at).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chats">
          <Card className="bg-[#FDFBF7] border-2 border-[#B89555]/30">
            <CardHeader><CardTitle className="text-[#1A1A1A]">Recent chats</CardTitle></CardHeader>
            <CardContent>
              {chats.length === 0 ? (
                <p className="text-[#1A1A1A]/70 text-sm py-6 text-center">No chats logged.</p>
              ) : (
                <ul className="divide-y divide-[#B89555]/20">
                  {chats.map((c) => (
                    <li key={c.id} className="py-2 text-sm flex items-center justify-between">
                      <div>
                        <p className="font-medium text-[#1A1A1A]">{c.platform ?? "Chat"} · {c.contact_number ?? "—"}</p>
                        <p className="text-xs text-[#1A1A1A]/70">{c.message_count ?? 0} messages</p>
                      </div>
                      <span className="text-xs text-[#1A1A1A]/70">{new Date(c.created_at).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger">
          <Card className="bg-[#FDFBF7] border-2 border-red-300/40">
            <CardHeader>
              <CardTitle className="text-[#1A1A1A] flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" /> Manage employee
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-[#1A1A1A] mb-2">Change employment type</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(TYPE_LABEL).map(([v, l]) => (
                    <Button key={v} size="sm" variant={profile.employment_type === v ? "default" : "outline"} onClick={() => setTypeOpen(v)}>
                      <Briefcase className="h-3 w-3 mr-1" /> {l}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-[#1A1A1A] mb-2">Change status</p>
                <div className="flex flex-wrap gap-2">
                  {["active", "on_leave", "left_company", "terminated", "inactive"].map((s) => (
                    <Button key={s} size="sm" variant={profile.employment_status === s ? "default" : "outline"} onClick={() => setStatusOpen(s)}>
                      {s}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t border-[#B89555]/20">
                <Button variant="destructive" onClick={() => setDeleteOpen(true)} className="gap-1">
                  <UserX className="h-4 w-4" /> Remove employee
                </Button>
                <p className="text-xs text-[#1A1A1A]/70 mt-2">
                  Soft-removed. Leads, calls and history stay intact for compliance.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AlertDialog open={!!statusOpen} onOpenChange={(o) => !o && setStatusOpen(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set status to {statusOpen}?</AlertDialogTitle>
            <AlertDialogDescription>Updates this employee immediately.</AlertDialogDescription>
          </AlertDialogHeader>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional)" />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={submitting} onClick={() => statusOpen && runAction("set_status", { employment_status: statusOpen, left_reason: reason || undefined })}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!typeOpen} onOpenChange={(o) => !o && setTypeOpen(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set employment type to {typeOpen ? TYPE_LABEL[typeOpen] : ""}?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={submitting} onClick={() => typeOpen && runAction("set_employment_type", { employment_type: typeOpen })}>
              Apply
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this employee?</AlertDialogTitle>
            <AlertDialogDescription>They are marked terminated and deactivated. History stays intact.</AlertDialogDescription>
          </AlertDialogHeader>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Departure reason (optional)" />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={submitting} className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => runAction("delete", { left_reason: reason || undefined })}>
              Confirm remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Kpi({ label, v, icon }: { label: string; v: number; icon: React.ReactNode }) {
  return (
    <Card className="bg-gradient-to-br from-[#F7F1E6] to-[#ECE2D2] border-2 border-[#B89555]/30">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[#1A1A1A]/70">{label}</p>
            <p className="text-2xl font-bold text-[#1A1A1A]">{v.toLocaleString()}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#FDFBF7] border border-[#B89555]/30 flex items-center justify-center">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
