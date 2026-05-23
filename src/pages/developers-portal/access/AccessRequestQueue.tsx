import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

/**
 * AccessRequestQueue — owner approves/denies:
 *  - Rep self-serve applications (developer_rep_applications)
 *  - Broker → rep access requests (developer_rep_access_requests)
 */
export default function AccessRequestQueue() {
  const [tab, setTab] = useState<"applications" | "broker_access">("applications");
  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs uppercase tracking-[0.18em] text-[#1A1A1A]/60">Developers Portal</p>
        <h1 className="text-3xl font-semibold tracking-tight text-[#1A1A1A] mt-1">Access Requests</h1>
        <p className="text-sm text-[#1A1A1A]/70 mt-1">
          Approve sales-rep applications and broker requests for rep access.
        </p>
      </header>
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="applications">Rep Applications</TabsTrigger>
          <TabsTrigger value="broker_access">Broker Access Requests</TabsTrigger>
        </TabsList>
        <TabsContent value="applications" className="mt-4">
          <ApplicationsList />
        </TabsContent>
        <TabsContent value="broker_access" className="mt-4">
          <BrokerAccessList />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ApplicationsList() {
  const qc = useQueryClient();
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["rep-applications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developer_rep_applications")
        .select("*")
        .order("applied_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const decide = useMutation({
    mutationFn: async ({ id, action, row }: { id: string; action: "approve" | "deny"; row: any }) => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id ?? null;

      if (action === "deny") {
        const { error } = await supabase
          .from("developer_rep_applications")
          .update({ status: "denied", decided_by: uid, decided_at: new Date().toISOString() })
          .eq("id", id);
        if (error) throw error;
        return;
      }

      // approve → create sales-rep row (RLS owner-only), then mark application approved
      if (!row.requested_developer_id) {
        throw new Error("Application is missing a developer assignment — edit it before approving.");
      }
      const { data: created, error: insErr } = await supabase
        .from("developer_sales_reps")
        .insert({
          developer_id: row.requested_developer_id,
          full_name: row.full_name,
          email: row.email,
          phone_e164: row.phone_e164 ?? "",
          position: row.position ?? null,
          nationality: row.nationality ?? null,
          languages: row.languages ?? [],
          assigned_emirates: row.assigned_emirates ?? [],
          availability_status: "available",
          is_active: true,
        })
        .select("id")
        .single();
      if (insErr) throw insErr;

      const { error: updErr } = await supabase
        .from("developer_rep_applications")
        .update({
          status: "approved",
          decided_by: uid,
          decided_at: new Date().toISOString(),
          created_rep_id: created?.id ?? null,
        })
        .eq("id", id);
      if (updErr) throw updErr;
    },
    onSuccess: (_d, vars) => {
      toast.success(vars.action === "approve" ? "Application approved · rep created" : "Application denied");
      qc.invalidateQueries({ queryKey: ["rep-applications"] });
      qc.invalidateQueries({ queryKey: ["portal-overview"] });
      qc.invalidateQueries({ queryKey: ["developer-sales-reps"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Action failed"),
  });

  if (isLoading) return <p className="text-sm text-[#1A1A1A]/60">Loading…</p>;
  if (rows.length === 0) return (
    <Card className="p-8 text-center text-[#1A1A1A]/70 bg-[#F7F2EA] border border-[#B89555]/30">
      <p className="font-semibold text-[#1A1A1A] mb-1">No sales rep applications yet</p>
      <p className="text-sm">When someone submits the public form at <code className="bg-[#EFE6D6] px-1 rounded">/developers-portal/reps/apply</code>, their request appears here for approval.</p>
    </Card>
  );

  return (
    <div className="space-y-3">
      {rows.map((row: any) => (
        <Card key={row.id} className="p-4 bg-[#F7F2EA] border border-[#B89555]/30">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[#1A1A1A]">{row.full_name} · <span className="text-xs uppercase tracking-[0.14em] text-[#1A1A1A]/60">{row.status}</span></p>
              <p className="text-xs text-[#1A1A1A]/60 mt-0.5">{row.email}{row.phone_e164 ? ` · ${row.phone_e164}` : ""}</p>
              <p className="text-xs text-[#1A1A1A]/60 mt-0.5">
                Requested: {row.requested_developer_name || "—"} · Position: {row.position || "—"}
              </p>
              <p className="text-xs text-[#1A1A1A]/60 mt-0.5">
                Languages: {(row.languages ?? []).join(", ") || "—"} · Emirates: {(row.assigned_emirates ?? []).join(", ") || "—"}
              </p>
              {row.message && <p className="text-sm text-[#1A1A1A] mt-2 whitespace-pre-wrap">{row.message}</p>}
              <p className="text-[10.5px] text-[#1A1A1A]/50 mt-2">
                {formatDistanceToNow(new Date(row.applied_at))} ago
              </p>
            </div>
            {row.status === "pending" && (
              <div className="flex gap-2 flex-shrink-0">
                <Button size="sm" onClick={() => decide.mutate({ id: row.id, action: "approve" })} disabled={decide.isPending}>
                  Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => decide.mutate({ id: row.id, action: "deny" })} disabled={decide.isPending}>
                  Deny
                </Button>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

function BrokerAccessList() {
  const qc = useQueryClient();
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["broker-access-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developer_rep_access_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const decide = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "approve" | "deny" | "revoke" }) => {
      const { data, error } = await supabase.functions.invoke("portal-decide-access-request", {
        body: { request_id: id, action },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
    },
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["broker-access-requests"] });
      qc.invalidateQueries({ queryKey: ["portal-overview"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Action failed"),
  });

  if (isLoading) return <p className="text-sm text-[#1A1A1A]/60">Loading…</p>;
  if (rows.length === 0) return (
    <Card className="p-8 text-center text-[#1A1A1A]/70 bg-[#F7F2EA] border border-[#B89555]/30">
      <p className="font-semibold text-[#1A1A1A] mb-1">No broker access requests yet</p>
      <p className="text-sm">Brokers can request access from any developer page via the "Request access to sales rep" button.</p>
    </Card>
  );

  return (
    <div className="space-y-3">
      {rows.map((row: any) => (
        <Card key={row.id} className="p-4 bg-[#F7F2EA] border border-[#B89555]/30">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[#1A1A1A]">
                Broker request · <span className="text-xs uppercase tracking-[0.14em] text-[#1A1A1A]/60">{row.status}</span>
              </p>
              <p className="text-xs text-[#1A1A1A]/60 mt-0.5">
                Developer: {row.developer_name || row.developer_id || "—"} · Rep: {row.rep_id || "any"}
              </p>
              {row.reason && <p className="text-sm text-[#1A1A1A] mt-2 whitespace-pre-wrap">{row.reason}</p>}
              <p className="text-[10.5px] text-[#1A1A1A]/50 mt-2">
                {formatDistanceToNow(new Date(row.created_at))} ago
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {row.status === "pending" && (
                <>
                  <Button size="sm" onClick={() => decide.mutate({ id: row.id, action: "approve" })} disabled={decide.isPending}>Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => decide.mutate({ id: row.id, action: "deny" })} disabled={decide.isPending}>Deny</Button>
                </>
              )}
              {row.status === "approved" && (
                <Button size="sm" variant="outline" onClick={() => decide.mutate({ id: row.id, action: "revoke" })} disabled={decide.isPending}>
                  Revoke
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
