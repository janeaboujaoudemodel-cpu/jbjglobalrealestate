import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

interface Props {
  developerId?: string | null;
  developerName?: string | null;
}

/**
 * BrokerRequestAccessButton — shown on the public /developer/:slug page
 * to logged-in users with the `broker` role only. Submits a request to
 * developer_rep_access_requests for owner approval.
 *
 * Investors do NOT see this button (rep details remain hidden).
 */
export default function BrokerRequestAccessButton({ developerId, developerName }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  const { data: isBroker } = useQuery({
    queryKey: ["is-broker", user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      const roles = (data ?? []).map((r: any) => r.role);
      return roles.some((r: string) => r === "broker" || r === "broker_jbj" || r === "broker_partner");
    },
  });

  const { data: existing } = useQuery({
    queryKey: ["broker-access-existing", user?.id, developerId],
    enabled: !!user?.id && !!developerId && !!isBroker,
    queryFn: async () => {
      if (!user?.id || !developerId) return null;
      const { data } = await supabase
        .from("developer_rep_access_requests")
        .select("id, status, expires_at")
        .eq("broker_id", user.id)
        .eq("developer_id", developerId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const submit = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not signed in");
      const { error } = await supabase.from("developer_rep_access_requests").insert({
        broker_id: user.id,
        developer_id: developerId ?? null,
        developer_name: developerName ?? null,
        reason: reason || null,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Request submitted — pending review."); setOpen(false); setReason(""); },
    onError: (e: any) => toast.error(e?.message ?? "Failed to submit"),
  });

  if (!user || !isBroker) return null;

  if (existing?.status === "approved") {
    return (
      <Button data-label-emerald-only variant="outline" disabled className="jj-pill-emerald-metallic allow-white border-0 text-white">
        <ShieldCheck className="w-4 h-4 mr-2" /> Access granted
      </Button>
    );
  }

  if (existing?.status === "pending") {
    return (
      <Button variant="outline" disabled>
        <ShieldCheck className="w-4 h-4 mr-2" /> Request pending review
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-label-emerald-only variant="outline" className="jj-pill-emerald-metallic allow-white border-0 text-white">
          <ShieldCheck className="w-4 h-4 mr-2" />
          Request access to sales rep
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request rep access — {developerName || "developer"}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-[#1A1A1A]/70">
          As a broker, request access to {developerName || "this developer"}'s sales representatives.
          Once approved you'll be able to view contact details and book a meeting.
        </p>
        <Textarea rows={4} placeholder="Tell us about the deal (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
        <DialogFooter>
          <Button onClick={() => submit.mutate()} disabled={submit.isPending}>
            {submit.isPending ? "Submitting…" : "Submit request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
