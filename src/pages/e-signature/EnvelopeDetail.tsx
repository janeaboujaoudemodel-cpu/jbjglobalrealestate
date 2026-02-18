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
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { maybeProxyStorageUrl } from "@/utils/downloadProxy";

type EnvelopeStatus = 'draft' | 'sent' | 'viewed' | 'partially_signed' | 'completed' | 'declined' | 'expired' | 'voided';
type RecipientStatus = 'pending' | 'sent' | 'delivered' | 'viewed' | 'signed' | 'declined';
type AuditAction = 'created' | 'sent' | 'viewed' | 'signed' | 'declined' | 'reminder_sent' | 'downloaded' | 'voided' | 'expired' | 'completed';

const statusConfig: Record<EnvelopeStatus, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-700", icon: <FileSignature className="w-4 h-4" /> },
  sent: { label: "Sent", color: "bg-blue-100 text-blue-700", icon: <Send className="w-4 h-4" /> },
  viewed: { label: "Viewed", color: "bg-yellow-100 text-yellow-700", icon: <Eye className="w-4 h-4" /> },
  partially_signed: { label: "Partially Signed", color: "bg-orange-100 text-orange-700", icon: <Clock className="w-4 h-4" /> },
  completed: { label: "Completed", color: "bg-green-100 text-green-700", icon: <CheckCircle2 className="w-4 h-4" /> },
  declined: { label: "Declined", color: "bg-red-100 text-red-700", icon: <XCircle className="w-4 h-4" /> },
  expired: { label: "Expired", color: "bg-gray-100 text-gray-500", icon: <Clock className="w-4 h-4" /> },
  voided: { label: "Voided", color: "bg-gray-100 text-gray-500", icon: <XCircle className="w-4 h-4" /> },
};

const recipientStatusConfig: Record<RecipientStatus, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-gray-100 text-gray-700" },
  sent: { label: "Sent", color: "bg-blue-100 text-blue-700" },
  delivered: { label: "Delivered", color: "bg-blue-100 text-blue-700" },
  viewed: { label: "Viewed", color: "bg-yellow-100 text-yellow-700" },
  signed: { label: "Signed", color: "bg-green-100 text-green-700" },
  declined: { label: "Declined", color: "bg-red-100 text-red-700" },
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
  // Track loading state: "all" for the bulk remind button, or recipientId for individual
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

  /** Sends a reminder to all pending recipients (or a single one via recipient_id). */
  const sendReminder = async (recipientId?: string) => {
    const key = recipientId || "all";
    setRemindingId(key);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/esign-send-reminder`,
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
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!envelope) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 p-6">
        <div className="max-w-5xl mx-auto text-center py-12">
          <FileSignature className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Envelope Not Found</h2>
          <p className="text-muted-foreground mb-4">
            This envelope may have been deleted or you don't have access.
          </p>
          <Link to="/e-signature">
            <Button>Back to Dashboard</Button>
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/e-signature")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{envelope.name}</h1>
                <Badge className={`${config.color} flex items-center gap-1`}>
                  {config.icon}
                  {config.label}
                </Badge>
              </div>
              {envelope.description && (
                <p className="text-muted-foreground mt-1">{envelope.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            {["sent", "viewed", "partially_signed"].includes(envelope.status) && (
              <Button
                variant="outline"
                onClick={handleSendReminder}
                disabled={remindingId !== null}
              >
                {remindingId === "all" ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Bell className="w-4 h-4 mr-2" />
                )}
                {remindingId === "all" ? "Sending…" : "Send Reminder"}
              </Button>
            )}
            {signedDoc && (
              <Button 
                onClick={() => handleDownload(signedDoc.document_url, signedDoc.document_filename)}
                className="bg-gold hover:bg-gold/90"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Signed
              </Button>
            )}
            {!signedDoc && (
              <Button 
                variant="outline"
                onClick={() => handleDownload(envelope.document_url, envelope.document_filename)}
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Recipients
                  </span>
                  {["sent", "viewed", "partially_signed"].includes(envelope.status) && (
                    <span className="text-xs font-normal text-muted-foreground">
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
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50 gap-3"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                            <User className="w-5 h-5 text-gold" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium">{recipient.name}</p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
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
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Signed {format(new Date(recipient.signed_at), "MMM d, yyyy 'at' h:mm a")}
                              </p>
                            )}
                            {recipient.viewed_at && !recipient.signed_at && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Viewed {formatDistanceToNow(new Date(recipient.viewed_at), { addSuffix: true })}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge className={rConfig.color}>{rConfig.label}</Badge>
                          {canRemind && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1.5 text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
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
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          {aConfig.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{log.description}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
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
                    <p className="text-muted-foreground text-center py-4">
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
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Document Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">File Name</span>
                  <span className="font-medium truncate max-w-[150px]" title={envelope.document_filename}>
                    {envelope.document_filename}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Created</span>
                  <span>{format(new Date(envelope.created_at), "MMM d, yyyy")}</span>
                </div>
                {envelope.expires_at && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Expires</span>
                    <span>{formatDistanceToNow(new Date(envelope.expires_at), { addSuffix: true })}</span>
                  </div>
                )}
                {envelope.completed_at && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Completed</span>
                    <span>{format(new Date(envelope.completed_at), "MMM d, yyyy")}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Reminders Sent</span>
                  <span>{envelope.reminders_sent || 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* Signing Certificate */}
            {signedDoc?.certificate_data && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-500" />
                    Signing Certificate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    This document has been electronically signed and verified.
                  </p>
                  {signedDoc.certificate_url && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleDownload(signedDoc.certificate_url, "certificate.pdf")}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Certificate
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
