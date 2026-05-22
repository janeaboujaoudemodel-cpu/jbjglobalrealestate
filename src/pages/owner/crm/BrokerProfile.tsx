/**
 * Broker Profile Hub — owner-only.
 *
 * /owner/crm/brokers/:brokerId
 *
 * Shows everything the owner needs to audit one broker: their identity,
 * the leads currently shared with them, every action they have taken
 * (calls, whatsapps, emails, status changes, file opens, exports, logins),
 * and quick access to revoke their session.
 */
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, User, Loader2, Mail, Phone, Activity, Users,
  Shield, Clock, ExternalLink, FileText,
} from "lucide-react";
import { toast } from "sonner";

type Overview = {
  broker_id: string;
  broker_user_id: string | null;
  full_name: string | null;
  email: string | null;
  last_active_at: string | null;
  leads_shared: number;
  activity_count: number;
  last_activity_at: string | null;
};

type SharedLeadRow = {
  lead_id: string;
  name: string;
  email: string;
  phone: string;
  pipeline_stage: string | null;
  priority: string | null;
  shared_at: string;
  permission_level: string;
};

type ActivityRow = {
  id: string;
  action: string;
  lead_id: string | null;
  meta: Record<string, any>;
  occurred_at: string;
};

const ACTION_LABELS: Record<string, { label: string; tone: string }> = {
  lead_create:    { label: "Created lead",   tone: "bg-emerald-100 text-emerald-800" },
  lead_edit:      { label: "Edited lead",    tone: "bg-blue-100 text-blue-800" },
  status_change:  { label: "Status change",  tone: "bg-amber-100 text-amber-800" },
  call:           { label: "Call",           tone: "bg-cyan-100 text-cyan-800" },
  whatsapp:       { label: "WhatsApp",       tone: "bg-emerald-100 text-emerald-800" },
  email:          { label: "Email",          tone: "bg-violet-100 text-violet-800" },
  file_open:      { label: "Opened file",    tone: "bg-slate-100 text-slate-800" },
  export:         { label: "Export",         tone: "bg-rose-100 text-rose-800" },
  login:          { label: "Login",          tone: "bg-stone-100 text-stone-800" },
};

export default function BrokerProfile() {
  const { brokerId } = useParams<{ brokerId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [leads, setLeads] = useState<SharedLeadRow[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    if (!brokerId) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc("crm_broker_profile_bundle", {
        p_broker_id: brokerId,
      });
      if (error) {
        toast.error("Failed to load broker profile", { description: error.message });
        setLoading(false);
        return;
      }
      const bundle = data as any;
      setOverview(bundle?.overview ?? null);
      setLeads(bundle?.leads ?? []);
      setActivity(bundle?.activity ?? []);
      setLoading(false);
    })();
  }, [brokerId]);

  const revokeSessions = async () => {
    if (!overview?.broker_user_id) return;
    if (!confirm("Revoke ALL active sessions for this broker? They will be signed out everywhere.")) return;
    setRevoking(true);
    const { error } = await supabase.functions.invoke("crm-broker-revoke-sessions", {
      body: { broker_user_id: overview.broker_user_id },
    });
    setRevoking(false);
    if (error) {
      toast.error("Failed to revoke sessions", { description: error.message });
      return;
    }
    toast.success("All broker sessions revoked");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-7 h-7 animate-spin text-[#1A1A1A]/50" />
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="rounded-xl border border-[#B89555]/30 bg-[#FDFBF7] p-12 text-center">
        <p className="text-sm text-[#1A1A1A]/70">Broker not found.</p>
        <Button onClick={() => navigate(-1)} variant="outline" className="mt-4">
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Back link */}
      <Link
        to="/owner/crm?entity=brokers&view=directory"
        className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#1A1A1A]/70 hover:text-[#1A1A1A]"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        All Brokers
      </Link>

      {/* Header card */}
      <div className="rounded-2xl border border-[#B89555]/30 bg-gradient-to-br from-[#FDFBF7] to-[#EFE6D6] p-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-[#1A1A1A] flex items-center justify-center shrink-0">
            <User className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-[#1A1A1A] leading-tight">
              {overview.full_name || "Unnamed broker"}
            </h1>
            <div className="flex items-center gap-3 flex-wrap mt-2 text-[13px] text-[#1A1A1A]/75">
              {overview.email && (
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  {overview.email}
                </span>
              )}
              {overview.last_active_at && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Last active {new Date(overview.last_active_at).toLocaleString()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-3">
              <Badge variant="outline" className="border-[#B89555]/40 text-[#1A1A1A]">
                <Users className="w-3 h-3 mr-1" />
                {overview.leads_shared} leads shared
              </Badge>
              <Badge variant="outline" className="border-[#B89555]/40 text-[#1A1A1A]">
                <Activity className="w-3 h-3 mr-1" />
                {overview.activity_count} actions logged
              </Badge>
            </div>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="border-[#B89555]/40"
              onClick={() => navigate(`/owner/crm?entity=brokers&view=directory`)}
            >
              Manage access
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={revoking || !overview.broker_user_id}
              onClick={revokeSessions}
            >
              {revoking ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Shield className="w-3.5 h-3.5 mr-1.5" />}
              Revoke sessions
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="leads" className="w-full">
        <TabsList className="bg-[#F7F2EA] border border-[#B89555]/25">
          <TabsTrigger value="leads">Leads ({leads.length})</TabsTrigger>
          <TabsTrigger value="activity">Activity ({activity.length})</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="mt-4">
          {leads.length === 0 ? (
            <Empty icon={Users} text="No leads currently shared with this broker." />
          ) : (
            <div className="rounded-xl border border-[#B89555]/30 bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#F7F2EA] text-[#1A1A1A]/70 text-[11px] uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-4 py-2.5">Lead</th>
                    <th className="text-left px-4 py-2.5">Contact</th>
                    <th className="text-left px-4 py-2.5">Stage</th>
                    <th className="text-left px-4 py-2.5">Shared</th>
                    <th className="text-left px-4 py-2.5">Access</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l) => (
                    <tr key={l.lead_id} className="border-t border-[#B89555]/15 hover:bg-[#FDFBF7]">
                      <td className="px-4 py-3 font-semibold text-[#1A1A1A]">{l.name}</td>
                      <td className="px-4 py-3 text-[#1A1A1A]/70">
                        <div className="flex flex-col">
                          {l.email && <span className="text-[12px]">{l.email}</span>}
                          {l.phone && <span className="text-[11.5px] text-[#1A1A1A]/55">{l.phone}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="border-[#B89555]/40 text-[#1A1A1A]">
                          {l.pipeline_stage || "—"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-[#1A1A1A]/65 text-[12px]">
                        {new Date(l.shared_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-[12px] capitalize">{l.permission_level}</td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/owner/crm?entity=leads&view=all&lead=${l.lead_id}`}
                          className="text-[#1A1A1A] hover:opacity-70"
                          title="Open lead"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          {activity.length === 0 ? (
            <Empty icon={Activity} text="No activity logged yet for this broker." />
          ) : (
            <div className="rounded-xl border border-[#B89555]/30 bg-white">
              <ul className="divide-y divide-[#B89555]/15">
                {activity.map((a) => {
                  const meta = ACTION_LABELS[a.action] || { label: a.action, tone: "bg-stone-100 text-stone-800" };
                  return (
                    <li key={a.id} className="px-4 py-3 flex items-start gap-3 hover:bg-[#FDFBF7]">
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full shrink-0 ${meta.tone}`}>
                        {meta.label}
                      </span>
                      <div className="flex-1 min-w-0">
                        {a.lead_id && (
                          <p className="text-[12.5px] text-[#1A1A1A]/75">
                            on lead{" "}
                            <Link
                              to={`/owner/crm?entity=leads&view=all&lead=${a.lead_id}`}
                              className="font-semibold underline"
                            >
                              {a.lead_id.slice(0, 8)}
                            </Link>
                          </p>
                        )}
                        {Object.keys(a.meta || {}).length > 0 && (
                          <pre className="text-[10.5px] text-[#1A1A1A]/55 mt-1 font-mono whitespace-pre-wrap break-words">
                            {JSON.stringify(a.meta, null, 0).slice(0, 200)}
                          </pre>
                        )}
                      </div>
                      <span className="text-[11px] text-[#1A1A1A]/50 shrink-0">
                        {new Date(a.occurred_at).toLocaleString()}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </TabsContent>

        <TabsContent value="performance" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KPI label="Leads shared" value={overview.leads_shared} />
            <KPI label="Actions logged" value={overview.activity_count} />
            <KPI
              label="Last activity"
              value={
                overview.last_activity_at
                  ? new Date(overview.last_activity_at).toLocaleDateString()
                  : "—"
              }
            />
          </div>
          <p className="text-[12px] text-[#1A1A1A]/55 mt-4">
            Per-stage breakdown and conversion charts will populate as activity accrues.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Empty({ icon: Icon, text }: { icon: typeof Users; text: string }) {
  return (
    <div className="rounded-xl border border-[#B89555]/30 bg-[#FDFBF7] p-12 text-center">
      <Icon className="w-10 h-10 text-[#1A1A1A]/30 mx-auto mb-3" />
      <p className="text-sm text-[#1A1A1A]/70">{text}</p>
    </div>
  );
}

function KPI({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-[#B89555]/30 bg-white p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#1A1A1A]/55">{label}</p>
      <p className="text-2xl font-bold text-[#1A1A1A] mt-1">{value}</p>
    </div>
  );
}
