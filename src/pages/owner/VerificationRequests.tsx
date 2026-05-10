import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShieldCheck, ShieldX, Eye, Clock, CheckCircle2, XCircle, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Verification {
  id: string;
  user_id: string;
  full_name: string | null;
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
  id_document_url: string | null;
  selfie_url: string | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  approved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-600 border-red-500/20",
};

const VerificationRequests = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: verifications = [], isLoading } = useQuery({
    queryKey: ["admin-verifications", filter],
    queryFn: async () => {
      let query = supabase
        .from("user_verifications")
        .select("*")
        .order("submitted_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Verification[];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (verification: Verification) => {
      // Update verification record
      const { error: updateErr } = await supabase
        .from("user_verifications")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq("id", verification.id);
      if (updateErr) throw updateErr;

      // Update user profile
      const { error: profileErr } = await supabase
        .from("profiles")
        .update({
          is_verified: true,
          verified_at: new Date().toISOString(),
          verification_status: "approved",
        })
        .eq("id", verification.user_id);
      if (profileErr) throw profileErr;
    },
    onSuccess: () => {
      toast({ title: "User verified successfully" });
      queryClient.invalidateQueries({ queryKey: ["admin-verifications"] });
    },
    onError: (err: any) => {
      toast({ title: "Error approving", description: err.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, userId, reason }: { id: string; userId: string; reason: string }) => {
      const { error: updateErr } = await supabase
        .from("user_verifications")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          rejection_reason: reason,
        })
        .eq("id", id);
      if (updateErr) throw updateErr;

      await supabase
        .from("profiles")
        .update({ verification_status: "rejected" })
        .eq("id", userId);
    },
    onSuccess: () => {
      toast({ title: "Verification rejected" });
      setRejectId(null);
      setRejectReason("");
      queryClient.invalidateQueries({ queryKey: ["admin-verifications"] });
    },
    onError: (err: any) => {
      toast({ title: "Error rejecting", description: err.message, variant: "destructive" });
    },
  });

  const getSignedUrl = async (path: string) => {
    const { data } = await supabase.storage
      .from("verification-documents")
      .createSignedUrl(path, 300);
    return data?.signedUrl ?? null;
  };

  const handlePreview = async (path: string | null) => {
    if (!path) return;
    const url = await getSignedUrl(path);
    if (url) setPreviewUrl(url);
  };

  const filtered = verifications.filter((v) =>
    !search || v.full_name?.toLowerCase().includes(search.toLowerCase()) || v.user_id.includes(search)
  );

  const counts = {
    pending: verifications.filter((v) => v.status === "pending").length,
    all: verifications.length,
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#1A1A1A]" />
            Verification Requests
          </h1>
          <p className="text-sm text-[#1A1A1A]/70 mt-1">
            Review and approve user identity verifications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={statusColors.pending}>
            <Clock className="w-3 h-3 mr-1" />
            {counts.pending} Pending
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2">
          {["pending", "approved", "rejected", "all"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                filter === f
                  ? "bg-[#EFE6D6]/20 text-[#1A1A1A] border border-[#B89555]/30"
                  : "bg-[#F7F2EA] text-[#1A1A1A]/70 border border-transparent hover:bg-[#EFE6D6]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]/70" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-[#B89555] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-[#1A1A1A]/70">
          <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No {filter === "all" ? "" : filter} verification requests</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[#B89555]/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-[#F7F1E6] to-[#EFE6D6] text-[#1A1A1A]">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Name</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">Submitted</th>
                  <th className="text-left px-4 py-3 font-semibold">Documents</th>
                  <th className="text-right px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#B89555]/20 bg-[#FDFBF7]">
                {filtered.map((v) => (
                  <tr key={v.id} className="hover:bg-[#EFE6D6]/5 transition-colors">
                    <td className="px-4 py-3 font-medium text-[#1A1A1A]">{v.full_name || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge className={statusColors[v.status] || ""}>{v.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-[#1A1A1A]/70">
                      {new Date(v.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePreview(v.id_document_url)}
                          className="text-xs text-[#1A1A1A] hover:underline flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> ID
                        </button>
                        <button
                          onClick={() => handlePreview(v.selfie_url)}
                          className="text-xs text-[#1A1A1A] hover:underline flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> Selfie
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {v.status === "pending" && (
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            onClick={() => approveMutation.mutate(v)}
                            disabled={approveMutation.isPending}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs h-8"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setRejectId(v.id)}
                            className="border-red-300 text-red-600 hover:bg-red-50 text-xs h-8"
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                          </Button>
                        </div>
                      )}
                      {v.status === "rejected" && v.rejection_reason && (
                        <span className="text-xs text-red-500">{v.rejection_reason}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Image Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <img src={previewUrl} alt="Verification document" className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectId} onOpenChange={() => { setRejectId(null); setRejectReason(""); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldX className="w-5 h-5 text-red-500" />
              Reject Verification
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <label className="text-sm font-medium text-[#1A1A1A]">Reason for rejection</label>
            <Input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. ID photo is blurry"
            />
            <Button
              onClick={() => {
                const v = verifications.find((x) => x.id === rejectId);
                if (v && rejectReason.trim()) {
                  rejectMutation.mutate({ id: v.id, userId: v.user_id, reason: rejectReason.trim() });
                }
              }}
              disabled={!rejectReason.trim() || rejectMutation.isPending}
              className="w-full bg-red-500 hover:bg-red-600 text-white"
            >
              Confirm Rejection
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VerificationRequests;
