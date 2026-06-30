import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Inbox, UserPlus, ShieldCheck, Pause, RotateCcw, Loader2, Building2,
} from "lucide-react";
import { toast } from "sonner";
import { SEOHead } from "@/components/SEOHead";

interface Developer {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  logo_url_processed: string | null;
  has_active_rep: boolean;
}

interface Application {
  id: string;
  developer_id: string;
  applicant_user_id: string;
  applicant_name: string | null;
  applicant_email: string | null;
  applicant_phone: string | null;
  about_developer: string | null;
  drive_link: string | null;
  brochure_urls: string[];
  past_projects: unknown[];
  current_projects: unknown[];
  upcoming_projects: unknown[];
  status: "pending" | "approved" | "rejected" | "changes_requested";
  created_at: string;
}

interface Representative {
  id: string;
  user_id: string | null;
  developer_id: string | null;
  developer_name: string | null;
  full_name: string;
  email: string;
  status: string;
  authorized_at: string | null;
  last_activity_at: string | null;
}

interface SoftDeletedProject {
  id: string;
  name: string;
  developer_id: string | null;
  data_quality_flags: string[];
  deleted_at: string;
}

const DeveloperLogo = ({ dev }: { dev?: Developer | null }) => {
  const src = dev?.logo_url_processed || dev?.logo_url;
  return (
    <div className="w-10 h-10 rounded-md bg-[#FDFBF7] border border-[#B89555]/30 flex items-center justify-center overflow-hidden shrink-0">
      {src ? (
        <img src={src} alt={dev?.name || "developer"} className="max-w-full max-h-full object-contain p-1"  loading="lazy" decoding="async" />
      ) : (
        <Building2 className="w-5 h-5 text-[#1A1A1A]/40" />
      )}
    </div>
  );
};

const DeveloperPartnershipPanel = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [newRep, setNewRep] = useState({ developer_id: "", full_name: "", email: "" });

  const { data: developers } = useQuery({
    queryKey: ["partnership-developers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developers")
        .select("id, name, slug, logo_url, logo_url_processed, has_active_rep")
        .order("name");
      if (error) throw error;
      return (data || []) as Developer[];
    },
  });

  const devById = (id?: string | null) => developers?.find((d) => d.id === id);

  const { data: applications, isLoading: appsLoading } = useQuery({
    queryKey: ["dev-applications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developer_applications" as never)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Application[];
    },
  });

  const { data: reps } = useQuery({
    queryKey: ["dev-representatives"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developer_representatives")
        .select("id, user_id, developer_id, developer_name, full_name, email, status, authorized_at, last_activity_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Representative[];
    },
  });

  const { data: softDeleted } = useQuery({
    queryKey: ["soft-deleted-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, developer_id, data_quality_flags, deleted_at")
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as SoftDeletedProject[];
    },
  });

  const approveApplication = useMutation({
    mutationFn: async (app: Application) => {
      // 1. mark application approved
      const { error: e1 } = await supabase
        .from("developer_applications" as never)
        .update({
          status: "approved",
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        } as never)
        .eq("id", app.id);
      if (e1) throw e1;

      // 2. create representative row (active)
      const dev = devById(app.developer_id);
      const { error: e2 } = await supabase
        .from("developer_representatives")
        .insert({
          user_id: app.applicant_user_id,
          developer_id: app.developer_id,
          developer_name: dev?.name ?? "",
          full_name: app.applicant_name ?? app.applicant_email ?? "Representative",
          email: app.applicant_email ?? "",
          status: "active",
          authorized_by: user?.id,
          authorized_at: new Date().toISOString(),
          application_id: app.id,
          role: "sales_representative",
        } as never);
      if (e2) throw e2;
    },
    onSuccess: () => {
      toast.success("Application approved & representative authorized");
      qc.invalidateQueries({ queryKey: ["dev-applications"] });
      qc.invalidateQueries({ queryKey: ["dev-representatives"] });
      qc.invalidateQueries({ queryKey: ["partnership-developers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rejectApplication = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("developer_applications" as never)
        .update({
          status: "rejected",
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Application rejected");
      qc.invalidateQueries({ queryKey: ["dev-applications"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setRepStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const patch: Record<string, unknown> = { status };
      if (status === "suspended") patch.suspended_at = new Date().toISOString();
      const { error } = await supabase.from("developer_representatives").update(patch as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Representative updated");
      qc.invalidateQueries({ queryKey: ["dev-representatives"] });
      qc.invalidateQueries({ queryKey: ["partnership-developers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addRepManually = useMutation({
    mutationFn: async () => {
      if (!newRep.developer_id || !newRep.email) throw new Error("Pick a developer and enter an email");
      const dev = devById(newRep.developer_id);
      const { error } = await supabase
        .from("developer_representatives")
        .insert({
          developer_id: newRep.developer_id,
          developer_name: dev?.name ?? "",
          full_name: newRep.full_name || newRep.email,
          email: newRep.email,
          status: "active",
          authorized_by: user?.id,
          authorized_at: new Date().toISOString(),
          role: "sales_representative",
        } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Representative added — invite them to sign up with this email");
      setAddOpen(false);
      setNewRep({ developer_id: "", full_name: "", email: "" });
      qc.invalidateQueries({ queryKey: ["dev-representatives"] });
      qc.invalidateQueries({ queryKey: ["partnership-developers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const restoreProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("projects")
        .update({ deleted_at: null } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Project restored");
      qc.invalidateQueries({ queryKey: ["soft-deleted-projects"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pendingApps = applications?.filter((a) => a.status === "pending") || [];
  const filteredReps = (reps || []).filter((r) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      (r.full_name || "").toLowerCase().includes(q) ||
      (r.email || "").toLowerCase().includes(q) ||
      (r.developer_name || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <SEOHead title="Developer Partnerships" description="Manage developer applications and authorized representatives" noIndex />
      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold text-[#1A1A1A] tracking-tight">
            Developer Partnerships
          </h1>
          <p className="text-[#1A1A1A]/70 text-sm mt-1">
            Review applications from sales representatives, authorize them to manage a specific developer's
            portal, and restore any accidentally-deleted projects.
          </p>
        </header>

        <Tabs defaultValue="applications" className="w-full">
          <TabsList className="bg-[#F7F2EA] border border-[#B89555]/30">
            <TabsTrigger value="applications" className="gap-2">
              <Inbox className="w-4 h-4" /> Applications
              {pendingApps.length > 0 && (
                <Badge className="ml-1 bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/40">
                  {pendingApps.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="representatives" className="gap-2">
              <ShieldCheck className="w-4 h-4" /> Representatives
            </TabsTrigger>
            <TabsTrigger value="restore" className="gap-2">
              <RotateCcw className="w-4 h-4" /> Restore projects
            </TabsTrigger>
          </TabsList>

          {/* APPLICATIONS */}
          <TabsContent value="applications" className="mt-5">
            {appsLoading ? (
              <div className="flex items-center justify-center py-16 text-[#1A1A1A]/60">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading applications…
              </div>
            ) : pendingApps.length === 0 ? (
              <Card className="p-10 text-center bg-[#F7F2EA] border-[#B89555]/30">
                <Inbox className="w-10 h-10 text-[#1A1A1A]/40 mx-auto mb-3" />
                <h3 className="font-semibold text-[#1A1A1A]">No pending applications</h3>
                <p className="text-sm text-[#1A1A1A]/70 mt-1 max-w-md mx-auto">
                  When a sales representative submits an application to represent a developer
                  (with brochures, descriptions, Google Drive link, and projects), it will appear
                  here for your approval. Until then, there's nothing to approve — that's why the
                  developers list no longer shows a "pending" chip.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {pendingApps.map((app) => {
                  const dev = devById(app.developer_id);
                  return (
                    <Card key={app.id} className="p-4 bg-[#F7F2EA] border-[#B89555]/30">
                      <div className="flex items-start gap-4">
                        <DeveloperLogo dev={dev} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-[#1A1A1A]">
                              {dev?.name || "Unknown developer"}
                            </h3>
                            <Badge variant="outline" className="border-[#B89555]/40 text-[#1A1A1A]">
                              Application
                            </Badge>
                          </div>
                          <p className="text-sm text-[#1A1A1A]/70 mt-1">
                            From <strong>{app.applicant_name || app.applicant_email}</strong>
                            {app.applicant_email && ` · ${app.applicant_email}`}
                          </p>
                          {app.about_developer && (
                            <p className="text-sm text-[#1A1A1A]/80 mt-2 line-clamp-3">
                              {app.about_developer}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-3 text-xs text-[#1A1A1A]/60 mt-3">
                            {app.drive_link && (
                              <a href={app.drive_link} target="_blank" rel="noreferrer" className="underline">
                                Drive link
                              </a>
                            )}
                            <span>{(app.brochure_urls || []).length} brochures</span>
                            <span>
                              {(app.past_projects || []).length} past ·{" "}
                              {(app.current_projects || []).length} current ·{" "}
                              {(app.upcoming_projects || []).length} upcoming projects
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          <Button
                            size="sm"
                            disabled={approveApplication.isPending}
                            onClick={() => approveApplication.mutate(app)}
                            className="bg-[#1A1A1A] hover:bg-[#0A0A0A] text-white"
                          >
                            Approve & Authorize
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={rejectApplication.isPending}
                            onClick={() => rejectApplication.mutate(app.id)}
                            className="border-[#B89555]/40 text-[#1A1A1A]"
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* REPRESENTATIVES */}
          <TabsContent value="representatives" className="mt-5">
            <div className="flex items-center gap-3 mb-4">
              <Input
                placeholder="Search by name, email or developer…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm bg-[#FDFBF7] border-[#B89555]/30"
              />
              <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#1A1A1A] hover:bg-[#0A0A0A] text-white gap-2">
                    <UserPlus className="w-4 h-4" /> Add representative manually
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#FDFBF7] border-[#B89555]/40">
                  <DialogHeader>
                    <DialogTitle>Add representative</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-[#1A1A1A]/70">Developer</label>
                      <Select
                        value={newRep.developer_id}
                        onValueChange={(v) => setNewRep((r) => ({ ...r, developer_id: v }))}
                      >
                        <SelectTrigger className="bg-[#F7F2EA] border-[#B89555]/30">
                          <SelectValue placeholder="Pick a developer" />
                        </SelectTrigger>
                        <SelectContent>
                          {(developers || []).map((d) => (
                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#1A1A1A]/70">Full name</label>
                      <Input
                        value={newRep.full_name}
                        onChange={(e) => setNewRep((r) => ({ ...r, full_name: e.target.value }))}
                        className="bg-[#F7F2EA] border-[#B89555]/30"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#1A1A1A]/70">Email</label>
                      <Input
                        type="email"
                        value={newRep.email}
                        onChange={(e) => setNewRep((r) => ({ ...r, email: e.target.value }))}
                        className="bg-[#F7F2EA] border-[#B89555]/30"
                      />
                    </div>
                    <p className="text-[11px] text-[#1A1A1A]/60">
                      The rep will need to sign up with this same email. Their Developer Hub will be
                      scoped to this one developer only — they cannot view the CRM, leads, or any
                      other developer's projects.
                    </p>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                    <Button
                      disabled={addRepManually.isPending}
                      onClick={() => addRepManually.mutate()}
                      className="bg-[#1A1A1A] hover:bg-[#0A0A0A] text-white"
                    >
                      Authorize
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-2">
              {filteredReps.length === 0 && (
                <Card className="p-8 text-center bg-[#F7F2EA] border-[#B89555]/30 text-sm text-[#1A1A1A]/70">
                  No representatives yet. Approve an application or add one manually above.
                </Card>
              )}
              {filteredReps.map((rep) => {
                const dev = devById(rep.developer_id);
                return (
                  <Card key={rep.id} className="p-4 bg-[#F7F2EA] border-[#B89555]/30">
                    <div className="flex items-center gap-4">
                      <DeveloperLogo dev={dev} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-[#1A1A1A]">{rep.full_name}</span>
                          <span className="text-xs text-[#1A1A1A]/60">{rep.email}</span>
                          <Badge
                            className={
                              rep.status === "active" || rep.status === "approved"
                                ? "jj-emerald-soft text-[color:var(--emerald-1)] border border-[color:var(--emerald-1)]/30"
                                : rep.status === "suspended"
                                ? "bg-amber-100 text-amber-900 border border-amber-300"
                                : "bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/40"
                            }
                          >
                            {rep.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-[#1A1A1A]/60 mt-1">
                          Represents <strong>{dev?.name || rep.developer_name || "—"}</strong>
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {rep.status === "active" || rep.status === "approved" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-[#B89555]/40 text-[#1A1A1A] gap-1"
                            onClick={() => setRepStatus.mutate({ id: rep.id, status: "suspended" })}
                          >
                            <Pause className="w-3.5 h-3.5" /> Suspend
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="bg-[#1A1A1A] hover:bg-[#0A0A0A] text-white"
                            onClick={() => setRepStatus.mutate({ id: rep.id, status: "active" })}
                          >
                            Reactivate
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-[#B89555]/40 text-[#1A1A1A]"
                          onClick={() => setRepStatus.mutate({ id: rep.id, status: "removed" })}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* RESTORE */}
          <TabsContent value="restore" className="mt-5">
            <div className="space-y-2">
              {(softDeleted || []).length === 0 && (
                <Card className="p-8 text-center bg-[#F7F2EA] border-[#B89555]/30 text-sm text-[#1A1A1A]/70">
                  Nothing in the recycle bin.
                </Card>
              )}
              {(softDeleted || []).map((p) => {
                const dev = devById(p.developer_id);
                return (
                  <Card key={p.id} className="p-3 bg-[#F7F2EA] border-[#B89555]/30 flex items-center gap-3">
                    <DeveloperLogo dev={dev} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#1A1A1A] truncate">{p.name}</p>
                      <p className="text-xs text-[#1A1A1A]/60">
                        Flags: {(p.data_quality_flags || []).join(", ") || "none"}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-[#B89555]/40 text-[#1A1A1A] gap-1"
                      onClick={() => restoreProject.mutate(p.id)}
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Restore
                    </Button>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DeveloperPartnershipPanel;
