import { useParams, useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft,
  Download,
  Bell,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Send,
  FileSignature,
  User,
  Mail,
  Phone,
  Calendar,
  Globe,
  Shield,
  Loader2,
  Link as LinkIcon,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { maybeProxyStorageUrl } from "@/utils/downloadProxy";
import { SUPABASE_URL } from "@/config/backend";

type EnvelopeStatus = 'draft' | 'sent' | 'viewed' | 'partially_signed' | 'completed' | 'declined' | 'expired' | 'voided';
type RecipientStatus = 'pending' | 'sent' | 'delivered' | 'viewed' | 'signed' | 'declined';
type AuditAction = 'created' | 'sent' | 'viewed' | 'signed' | 'declined' | 'reminder_sent' | 'downloaded' | 'voided' | 'expired' | 'completed';

const statusConfig: Record<EnvelopeStatus, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: "Draft", color: "bg-[#F7F2EA] text-[#1A1A1A]/70 border border-[#B89555]/30", icon: <FileSignature className="w-4 h-4" /> },
  sent: { label: "Sent", color: "bg-blue-50 text-blue-700 border border-blue-200", icon: <Send className="w-4 h-4" /> },
  viewed: { label: "Viewed", color: "bg-amber-50 text-amber-700 border border-amber-200", icon: <Eye className="w-4 h-4" /> },
  partially_signed: { label: "Partially Signed", color: "bg-orange-50 text-orange-700 border border-orange-200", icon: <Clock className="w-4 h-4" /> },
  completed: { label: "Completed", color: "bg-emerald-50 text-emerald-700 border border-emerald-200", icon: <CheckCircle2 className="w-4 h-4" /> },
  declined: { label: "Declined", color: "bg-red-50 text-red-700 border border-red-200", icon: <XCircle className="w-4 h-4" /> },
  expired: { label: "Expired", color: "bg-[#F7F2EA] text-[#1A1A1A]/70 border border-[#B89555]/30", icon: <Clock className="w-4 h-4" /> },
  voided: { label: "Voided", color: "bg-[#F7F2EA] text-[#1A1A1A]/70 border border-[#B89555]/30", icon: <XCircle className="w-4 h-4" /> },
};

const recipientStatusConfig: Record<RecipientStatus, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-[#F7F2EA] text-[#1A1A1A]/70 border border-[#B89555]/30" },
  sent: { label: "Sent", color: "bg-blue-50 text-blue-700 border border-blue-200" },
  delivered: { label: "Delivered", color: "bg-blue-50 text-blue-700 border border-blue-200" },
  viewed: { label: "Viewed", color: "bg-amber-50 text-amber-700 border border-amber-200" },
  signed: { label: "Signed", color: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  declined: { label: "Declined", color: "bg-red-50 text-red-700 border border-red-200" },
};

const auditActionConfig: Record<AuditAction, { label: string; icon: React.ReactNode }> = {
  created: { label: "Envelope created", icon: <FileSignature className="w-4 h-4" /> },
  sent: { label: "Sent for signature", icon: <Send className="w-4 h-4" /> },
  viewed: { label: "Document viewed", icon: <Eye className="w-4 h-4" /> },
  signed: { label: "Document signed", icon: <CheckCircle2 className="w-4 h-4" /> },
  declined: { label: "Signing declined", icon: <XCircle className="w-4 h-4" /> },
  reminder_sent: { label: "Reminder sent", icon: <Bell className="w-4 h-4" /> },
  downloaded: { label: "Document downloaded", icon: <Download className="w-4 h-4" /> },
  voided: { label: "Envelope voided", icon: <XCircle className="w-4 h-4" /> },
  expired: { label: "Envelope expired", icon: <Clock className="w-4 h-4" /> },
  completed: { label: "Signing completed", icon: <CheckCircle2 className="w-4 h-4" /> },
};

export default function EnvelopeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [remindingId, setRemindingId] = useState<string | null>(null);

  const { data: envelope, isLoading, refetch } = useQuery({
    queryKey: ["esign-envelope", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("esign_envelopes")
        .select(`
          *,
          esign_recipients (*),
          esign_audit_log (*),
          esign_signed_documents (*)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const sendReminder = async (recipientId?: string) => {
    const key = recipientId || "all";
    setRemindingId(key);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/esign-send-reminder`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ envelope_id: id, recipient_id: recipientId }),
        }
      );

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || result.message || "Failed to send reminder");
      }
      toast.success(
        recipientId
          ? `Reminder sent`
          : result.message || "Reminder sent to pending recipients"
      );
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to send reminder");
    } finally {
      setRemindingId(null);
    }
  };

  const handleSendReminder = () => sendReminder();

  const handleDownload = async (url: string, filename: string) => {
    try {
      const proxyUrl = maybeProxyStorageUrl(url, filename);
      window.open(proxyUrl, "_blank");
    } catch (error) {
      toast.error("Failed to download document");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-12 w-48 bg-[#C8A766]/20" />
          <Skeleton className="h-64 w-full bg-[#C8A766]/10" />
          <Skeleton className="h-48 w-full bg-[#C8A766]/10" />
        </div>
      </div>
    );
  }

  if (!envelope) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] p-6">
        <div className="max-w-5xl mx-auto text-center py-12">
          <FileSignature className="w-16 h-16 text-[#C8A766]/40 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-white">Envelope Not Found</h2>
          <p className="text-[#1A1A1A]/70 mb-4">
            This envelope may have been deleted or you don't have access.
          </p>
          <Link to="/e-signature">
            <Button className="bg-[#C8A766] hover:bg-[#A68444] text-[#1A1A1A]">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const config = statusConfig[envelope.status as EnvelopeStatus];
  const signedDoc = envelope.esign_signed_documents?.[0];
  const auditLogs = envelope.esign_audit_log?.sort(
    (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(32,28%,13%)] via-[hsl(33,27%,15%)] to-[hsl(33,28%,11%)]">
      <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate("/e-signature")}
                className="h-10 w-10 p-0 rounded-lg bg-[#1A1A1A]/5 hover:bg-[#1A1A1A]/10 text-[#1A1A1A]"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-[#1A1A1A]">{envelope.name}</h1>
                  <Badge className={`${config.color} flex items-center gap-1`}>
                    {config.icon}
                    {config.label}
                  </Badge>
                </div>
                {envelope.description && (
                  <p className="text-[#1A1A1A]/70 mt-1">{envelope.description}</p>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              {["sent", "viewed", "partially_signed"].includes(envelope.status) && (
                <Button
                  variant="outline"
                  onClick={handleSendReminder}
                  disabled={remindingId !== null}
                  className="border-[#C8A766]/30 text-[#1A1A1A] hover:bg-[#C8A766]/10"
                >
                  {remindingId === "all" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Bell className="w-4 h-4 mr-2 text-[#C8A766]" />
                  )}
                  {remindingId === "all" ? "Sending…" : "Send Reminder"}
                </Button>
              )}
              {signedDoc && (
                <>
                  <Button 
                    onClick={() => handleDownload(signedDoc.document_url, signedDoc.document_filename)}
                    className="bg-[#C8A766] hover:bg-[#A68444] text-[#1A1A1A] font-semibold"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Signed
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/owner/email-client", {
                      state: {
                        prefillSubject: `Signed Document: ${envelope.name}`,
                        prefillBody: `Please find attached the signed document "${envelope.name}".`,
                        prefillAttachment: {
                          id: crypto.randomUUID(),
                          name: signedDoc.document_filename || `${envelope.name}-signed.pdf`,
                          type: 'file' as const,
                          content: signedDoc.document_url,
                          mimeType: 'application/pdf',
                        },
                      },
                    })}
                    className="border-[#C8A766]/30 text-[#1A1A1A] hover:bg-[#C8A766]/10"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send via Email
                  </Button>
                </>
              )}
              {!signedDoc && (
                <Button 
                  variant="outline"
                  onClick={() => handleDownload(envelope.document_url, envelope.document_filename)}
                  className="border-[#C8A766]/30 text-[#1A1A1A] hover:bg-[#C8A766]/10"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Original
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Recipients */}
              <Card className="bg-[#FDFBF7]/80 backdrop-blur-sm border-2 border-[#C8A766]/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-[#1A1A1A]">
                    <span className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#C8A766]/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-[#C8A766]" />
                      </div>
                      Recipients
                    </span>
                    {["sent", "viewed", "partially_signed"].includes(envelope.status) && (
                      <span className="text-xs font-normal text-[#1A1A1A]/70">
                        {envelope.reminders_sent || 0} reminder{(envelope.reminders_sent || 0) !== 1 ? "s" : ""} sent
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {envelope.esign_recipients?.map((recipient: any) => {
                      const rConfig = recipientStatusConfig[recipient.status as RecipientStatus];
                      const canRemind = ["pending", "sent", "delivered", "viewed"].includes(recipient.status)
                        && ["sent", "viewed", "partially_signed"].includes(envelope.status);
                      const isReminding = remindingId === recipient.id;
                      return (
                        <div 
                          key={recipient.id} 
                          className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-[#FDFBF7] to-[#F7F2EA] border border-[#C8A766]/15 gap-3"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-[#C8A766]/10 flex items-center justify-center shrink-0 border border-[#C8A766]/20">
                              <User className="w-5 h-5 text-[#C8A766]" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-[#1A1A1A]">{recipient.name}</p>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#1A1A1A]/70">
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3 shrink-0" />
                                  <span className="truncate max-w-[200px]">{recipient.email}</span>
                                </span>
                                {recipient.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-3 h-3 shrink-0" />
                                    {recipient.phone}
                                  </span>
                                )}
                              </div>
                              {recipient.signed_at && (
                                <p className="text-xs text-emerald-600 mt-0.5 font-medium">
                                  ✓ Signed {format(new Date(recipient.signed_at), "MMM d, yyyy 'at' h:mm a")}
                                </p>
                              )}
                              {recipient.viewed_at && !recipient.signed_at && (
                                <p className="text-xs text-amber-600 mt-0.5">
                                  Viewed {formatDistanceToNow(new Date(recipient.viewed_at), { addSuffix: true })}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge className={rConfig.color}>{rConfig.label}</Badge>
                            {recipient.signing_token && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1.5 text-xs border-[#C8A766]/30 text-[#1A1A1A] hover:bg-[#C8A766]/10"
                                onClick={async () => {
                                  const url = `${window.location.origin}/sign/${recipient.signing_token}`;
                                  try {
                                    await navigator.clipboard.writeText(url);
                                    toast.success("Signing link copied", { description: url });
                                  } catch {
                                    window.prompt("Copy signing link:", url);
                                  }
                                }}
                                title="Copy the recipient's personal signing URL (for testing or manual delivery)"
                              >
                                <LinkIcon className="w-3 h-3" />
                                Copy link
                              </Button>
                            )}
                            {canRemind && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1.5 text-xs border-[#C8A766]/30 text-[#C8A766] hover:bg-[#C8A766]/10"
                                disabled={remindingId !== null}
                                onClick={() => sendReminder(recipient.id)}
                              >
                                {isReminding ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Bell className="w-3 h-3" />
                                )}
                                {isReminding ? "Sending…" : "Remind"}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Audit Trail */}
              <Card className="bg-[#FDFBF7]/80 backdrop-blur-sm border-2 border-[#C8A766]/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#1A1A1A]">
                    <div className="w-8 h-8 rounded-lg bg-[#C8A766]/10 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-[#C8A766]" />
                    </div>
                    Activity Log
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {auditLogs?.map((log: any) => {
                      const aConfig = auditActionConfig[log.action as AuditAction] || { 
                        label: log.action, 
                        icon: <Clock className="w-4 h-4" /> 
                      };
                      return (
                        <div key={log.id} className="flex items-start gap-4">
                          <div className="w-8 h-8 rounded-full bg-[#C8A766]/10 flex items-center justify-center flex-shrink-0 text-[#C8A766]">
                            {aConfig.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-[#1A1A1A]">{log.description}</p>
                            <div className="flex items-center gap-3 text-xs text-[#1A1A1A]/70 mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(log.created_at), "MMM d, yyyy 'at' h:mm a")}
                              </span>
                              {log.ip_address && (
                                <span className="flex items-center gap-1">
                                  <Globe className="w-3 h-3" />
                                  {log.ip_address}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {(!auditLogs || auditLogs.length === 0) && (
                      <p className="text-[#1A1A1A]/70 text-center py-4">
                        No activity recorded yet
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Document Info */}
              <Card className="bg-[#FDFBF7]/80 backdrop-blur-sm border-2 border-[#C8A766]/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-base text-[#1A1A1A] flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#C8A766]/10 flex items-center justify-center">
                      <FileSignature className="w-3.5 h-3.5 text-[#C8A766]" />
                    </div>
                    Document Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#1A1A1A]/70">File Name</span>
                    <span className="font-medium truncate max-w-[150px] text-[#1A1A1A]" title={envelope.document_filename}>
                      {envelope.document_filename}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#1A1A1A]/70">Created</span>
                    <span className="text-[#1A1A1A]">{format(new Date(envelope.created_at), "MMM d, yyyy")}</span>
                  </div>
                  {envelope.expires_at && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#1A1A1A]/70">Expires</span>
                      <span className="text-[#1A1A1A]">{formatDistanceToNow(new Date(envelope.expires_at), { addSuffix: true })}</span>
                    </div>
                  )}
                  {envelope.completed_at && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#1A1A1A]/70">Completed</span>
                      <span className="text-[#1A1A1A]">{format(new Date(envelope.completed_at), "MMM d, yyyy")}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-[#1A1A1A]/70">Reminders Sent</span>
                    <span className="text-[#1A1A1A]">{envelope.reminders_sent || 0}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Signing Certificate */}
              {signedDoc?.certificate_data && (
                <Card className="bg-[#FDFBF7]/80 backdrop-blur-sm border-2 border-emerald-300/40 shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-[#1A1A1A]">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <Shield className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      Signing Certificate
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-[#1A1A1A]/70">
                      This document has been electronically signed. The audit certificate contains timestamps, IP addresses, and signature images for every signer.
                    </p>

                    <div className="space-y-1.5">
                      {(signedDoc.certificate_data as any)?.signers?.map((s: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-[#1A1A1A]/70">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span className="font-medium text-[#1A1A1A]">{s.name}</span>
                          {s.signed_at && (
                            <span className="ml-auto shrink-0">
                              {format(new Date(s.signed_at), "MMM d, HH:mm")}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {signedDoc.certificate_url ? (
                      <Button
                        size="sm"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => handleDownload(signedDoc.certificate_url, `audit_certificate_${envelope.id}.pdf`)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Audit Certificate
                      </Button>
                    ) : (
                      <p className="text-xs text-[#1A1A1A]/70 italic">
                        Certificate PDF is being generated…
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
