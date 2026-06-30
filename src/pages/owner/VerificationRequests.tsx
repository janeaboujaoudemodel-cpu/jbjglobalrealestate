import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ShieldCheck,
  ShieldX,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Copy,
  User,
  Mail,
  Phone,
  Globe,
  Calendar,
  FileText,
} from "lucide-react";
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
  id_back_url: string | null;
  selfie_url: string | null;
  reference_code: string | null;
  document_type: string | null;
  document_country: string | null;
  date_of_birth: string | null;
  nationality: string | null;
  phone: string | null;
  address: any;
  client_ip: string | null;
  user_agent: string | null;
  consent_snapshot: any;
  liveness_challenges: any;
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  approved: "jj-surface-emerald-soft text-[color:var(--emerald-1)] border-[color:var(--emerald-1)]/30/30",
  rejected: "bg-red-500/10 text-red-700 border-red-500/30",
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
  const [contactSheet, setContactSheet] = useState<Verification | null>(null);
  const [emailMap, setEmailMap] = useState<Record<string, string>>({});

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

  // Fetch profile emails on demand
  const loadEmail = async (userId: string) => {
    if (emailMap[userId]) return emailMap[userId];
    const { data } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", userId)
      .maybeSingle();
    const email = (data as any)?.email ?? "";
    setEmailMap((prev) => ({ ...prev, [userId]: email }));
    return email;
  };

  // Use the edge function for approve/reject so audit logs + emails fire
  const reviewMutation = useMutation({
    mutationFn: async ({
      verificationId,
      decision,
      reason,
    }: {
      verificationId: string;
      decision: "approved" | "rejected";
      reason?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("review-verification", {
        body: { verificationId, decision, rejectionReason: reason },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
    onSuccess: (_d, vars) => {
      toast({
        title: vars.decision === "approved" ? "User verified" : "Verification rejected",
        description: "Audit log written and applicant notified.",
      });
      setRejectId(null);
      setRejectReason("");
      queryClient.invalidateQueries({ queryKey: ["admin-verifications"] });
    },
    onError: (err: any) => {
      toast({
        title: "Review failed",
        description: err.message,
        variant: "destructive",
      });
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

  const filtered = verifications.filter(
    (v) =>
      !search ||
      v.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      v.reference_code?.toLowerCase().includes(search.toLowerCase()) ||
      v.user_id.includes(search)
  );

  const counts = {
    pending: verifications.filter((v) => v.status === "pending").length,
    all: verifications.length,
  };

  const copy = async (val: string, label = "Copied") => {
    try {
      await navigator.clipboard.writeText(val);
      toast({ title: label });
    } catch {}
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#1A1A1A]" />
            Verification Requests
          </h1>
          <p className="text-sm text-[#1A1A1A]/70 mt-1">
            Bank-grade KYC review. Decisions trigger audit log + applicant email.
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
        <div className="flex gap-2 flex-wrap">
          {["pending", "approved", "rejected", "all"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
 filter === f
 ? "bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/50"
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
            placeholder="Search name or VRF-XXXXXX..."
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
        <div className="rounded-xl border border-[#B89555]/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-[#F7F1E6] to-[#EFE6D6] text-[#1A1A1A]">
                <tr>
                  <th className="text-left px-3 py-3 font-semibold">Ref</th>
                  <th className="text-left px-3 py-3 font-semibold">Name</th>
                  <th className="text-left px-3 py-3 font-semibold">Status</th>
                  <th className="text-left px-3 py-3 font-semibold">Submitted</th>
                  <th className="text-left px-3 py-3 font-semibold">Docs</th>
                  <th className="text-right px-3 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#B89555]/20 bg-[#FDFBF7]">
                {filtered.map((v) => (
                  <tr key={v.id} className="hover:bg-[#EFE6D6]/30 transition-colors">
                    <td className="px-3 py-3">
                      {v.reference_code ? (
                        <button
                          onClick={() => copy(v.reference_code!, "Reference copied")}
                          className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-[#1A1A1A] hover:text-[#B89555]"
                          title="Copy reference"
                        >
                          {v.reference_code}
                          <Copy className="w-3 h-3 opacity-60" />
                        </button>
                      ) : (
                        <span className="text-xs text-[#1A1A1A]/40">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 font-medium text-[#1A1A1A]">
                      <button
                        className="hover:underline text-left"
                        onClick={() => {
                          setContactSheet(v);
                          void loadEmail(v.user_id);
                        }}
                      >
                        {v.full_name || "—"}
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <Badge className={statusColors[v.status] || ""}>{v.status}</Badge>
                    </td>
                    <td className="px-3 py-3 text-[#1A1A1A]/70 whitespace-nowrap">
                      {new Date(v.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => handlePreview(v.id_document_url)}
                          className="text-xs text-[#1A1A1A] hover:underline flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> Front
                        </button>
                        {v.id_back_url && (
                          <button
                            onClick={() => handlePreview(v.id_back_url)}
                            className="text-xs text-[#1A1A1A] hover:underline flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" /> Back
                          </button>
                        )}
                        <button
                          onClick={() => handlePreview(v.selfie_url)}
                          className="text-xs text-[#1A1A1A] hover:underline flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> Selfie
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right">
                      {v.status === "pending" && (
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            onClick={() =>
                              reviewMutation.mutate({
                                verificationId: v.id,
                                decision: "approved",
                              })
                            }
                            disabled={reviewMutation.isPending}
                            className="jj-surface-emerald hover:jj-surface-emerald text-white text-xs h-8"
                            data-allow-dark-cta
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
                        <span className="text-xs text-red-600">{v.rejection_reason}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Document Preview */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <img src={previewUrl} alt="Verification document" className="w-full rounded-lg"  loading="lazy" decoding="async" />
          )}
        </DialogContent>
      </Dialog>

      {/* Contact / Identity Sheet */}
      <Dialog open={!!contactSheet} onOpenChange={() => setContactSheet(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-[#B89555]" />
              Applicant Sheet
              {contactSheet?.reference_code && (
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#F7F2EA] border border-[#B89555]/40 text-[#1A1A1A]">
                  {contactSheet.reference_code}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          {contactSheet && (
            <div className="space-y-3 text-sm">
              <Row
                icon={<User className="w-4 h-4" />}
                label="Full name"
                value={contactSheet.full_name}
                copy={copy}
              />
              <Row
                icon={<Mail className="w-4 h-4" />}
                label="Email"
                value={emailMap[contactSheet.user_id] || "Loading…"}
                copy={copy}
              />
              <Row
                icon={<Phone className="w-4 h-4" />}
                label="Phone"
                value={contactSheet.phone}
                copy={copy}
              />
              <Row
                icon={<Globe className="w-4 h-4" />}
                label="Nationality"
                value={contactSheet.nationality}
                copy={copy}
              />
              <Row
                icon={<Calendar className="w-4 h-4" />}
                label="Date of birth"
                value={contactSheet.date_of_birth}
                copy={copy}
              />
              <Row
                icon={<FileText className="w-4 h-4" />}
                label="Document"
                value={
                  contactSheet.document_type
                    ? `${contactSheet.document_type.replace(/_/g, " ")} (${
                        contactSheet.document_country || "—"
                      })`
                    : null
                }
                copy={copy}
              />
              {contactSheet.address && (
                <Row
                  icon={<Globe className="w-4 h-4" />}
                  label="Address"
                  value={
                    typeof contactSheet.address === "string"
                      ? contactSheet.address
                      : JSON.stringify(contactSheet.address)
                  }
                  copy={copy}
                />
              )}
              <div className="pt-3 border-t border-[#B89555]/20 text-xs text-[#1A1A1A]/60 space-y-1">
                <p>
                  <strong>Submitted:</strong>{" "}
                  {new Date(contactSheet.submitted_at).toLocaleString()}
                </p>
                {contactSheet.client_ip && (
                  <p>
                    <strong>IP:</strong> {String(contactSheet.client_ip)}
                  </p>
                )}
                {contactSheet.liveness_challenges?.length > 0 && (
                  <p>
                    <strong>Liveness:</strong>{" "}
                    {contactSheet.liveness_challenges.length} prompts captured
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog
        open={!!rejectId}
        onOpenChange={() => {
          setRejectId(null);
          setRejectReason("");
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldX className="w-5 h-5 text-red-500" />
              Reject Verification
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <label className="text-sm font-medium text-[#1A1A1A]">
              Reason (shown to applicant)
            </label>
            <Input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. ID photo is blurry"
            />
            <Button
              onClick={() => {
                if (rejectId && rejectReason.trim()) {
                  reviewMutation.mutate({
                    verificationId: rejectId,
                    decision: "rejected",
                    reason: rejectReason.trim(),
                  });
                }
              }}
              disabled={!rejectReason.trim() || reviewMutation.isPending}
              className="w-full bg-red-500 hover:bg-red-600 text-white"
              data-allow-dark-cta
            >
              Confirm Rejection
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function Row({
  icon,
  label,
  value,
  copy,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
  copy: (v: string, l?: string) => void;
}) {
  return (
    <div className="flex items-start gap-3 py-1.5 border-b border-[#B89555]/10 last:border-b-0">
      <span className="text-[#B89555] mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/60 font-semibold">
          {label}
        </p>
        <p className="text-sm text-[#1A1A1A] break-words">{value || "—"}</p>
      </div>
      {value && (
        <button
          onClick={() => copy(value, `${label} copied`)}
          className="text-[#1A1A1A]/50 hover:text-[#B89555]"
          title={`Copy ${label}`}
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

export default VerificationRequests;
