import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileSignature, 
  CheckCircle2, 
  XCircle,
  AlertTriangle,
  Loader2,
  Download
} from "lucide-react";
import { toast } from "sonner";
import ESignaturePad from "@/components/e-signature/ESignaturePad";
import { maybeProxyStorageUrl } from "@/utils/downloadProxy";

interface RecipientData {
  id: string;
  name: string;
  email: string;
  status: string;
  envelope: {
    id: string;
    name: string;
    document_url: string;
    document_filename: string;
    sender_name: string | null;
    sender_email: string;
  };
  fields: {
    id: string;
    field_type: string;
    page_number: number;
    x_position: number;
    y_position: number;
    width: number;
    height: number;
    is_required: boolean;
    is_completed: boolean;
  }[];
}

export default function SignDocument() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipientData, setRecipientData] = useState<RecipientData | null>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [initialsData, setInitialsData] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [declined, setDeclined] = useState(false);

  // Fetch recipient and document data
  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setError("Invalid signing link");
        setLoading(false);
        return;
      }

      try {
        const { data: recipient, error: recipientError } = await supabase
          .from("esign_recipients")
          .select(`
            id,
            name,
            email,
            status,
            envelope_id
          `)
          .eq("signing_token", token)
          .single();

        if (recipientError || !recipient) {
          setError("This signing link is invalid or has expired");
          setLoading(false);
          return;
        }

        if (recipient.status === "signed") {
          setCompleted(true);
          setLoading(false);
          return;
        }

        if (recipient.status === "declined") {
          setDeclined(true);
          setLoading(false);
          return;
        }

        const { data: envelope, error: envelopeError } = await supabase
          .from("esign_envelopes")
          .select("id, name, document_url, document_filename, sender_name, sender_email, status")
          .eq("id", recipient.envelope_id)
          .single();

        if (envelopeError || !envelope) {
          setError("Document not found");
          setLoading(false);
          return;
        }

        if (["completed", "voided", "expired"].includes(envelope.status)) {
          setError(`This document has been ${envelope.status}`);
          setLoading(false);
          return;
        }

        const { data: fields, error: fieldsError } = await supabase
          .from("esign_fields")
          .select("*")
          .eq("recipient_id", recipient.id);

        if (fieldsError) {
          setError("Failed to load signature fields");
          setLoading(false);
          return;
        }

        setRecipientData({
          id: recipient.id,
          name: recipient.name,
          email: recipient.email,
          status: recipient.status,
          envelope: envelope,
          fields: fields || [],
        });

        await supabase
          .from("esign_recipients")
          .update({ 
            status: "viewed",
            viewed_at: new Date().toISOString()
          })
          .eq("id", recipient.id);

        await supabase.from("esign_audit_log").insert({
          envelope_id: envelope.id,
          recipient_id: recipient.id,
          action: "viewed",
          description: `${recipient.name} viewed the document`,
          actor_email: recipient.email,
          actor_name: recipient.name,
        });

        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load document");
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleSubmitSignature = async () => {
    if (!recipientData || !signatureData) {
      toast.error("Please provide your signature");
      return;
    }

    const hasInitialsField = recipientData.fields.some(f => f.field_type === "initials");
    if (hasInitialsField && !initialsData) {
      toast.error("Please provide your initials");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/esign-process-signature`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            signature_data: signatureData,
            initials_data: initialsData,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process signature");
      }

      setCompleted(true);
      toast.success("Document signed successfully!");
    } catch (err: any) {
      console.error("Error submitting signature:", err);
      toast.error(err.message || "Failed to submit signature");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async () => {
    if (!recipientData) return;

    const reason = prompt("Please provide a reason for declining (optional):");
    
    setSubmitting(true);
    try {
      await supabase
        .from("esign_recipients")
        .update({
          status: "declined",
          declined_at: new Date().toISOString(),
          decline_reason: reason || null,
        })
        .eq("id", recipientData.id);

      await supabase
        .from("esign_envelopes")
        .update({ status: "declined" })
        .eq("id", recipientData.envelope.id);

      await supabase.from("esign_audit_log").insert({
        envelope_id: recipientData.envelope.id,
        recipient_id: recipientData.id,
        action: "declined",
        description: `${recipientData.name} declined to sign${reason ? `: ${reason}` : ""}`,
        actor_email: recipientData.email,
        actor_name: recipientData.name,
      });

      setDeclined(true);
    } catch (err) {
      toast.error("Failed to decline");
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 text-gold animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading document...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Unable to Load Document</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Completed state
  if (completed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Document Signed!</h2>
            <p className="text-muted-foreground mb-6">
              Thank you for signing. A confirmation email will be sent to you shortly.
            </p>
            <div className="p-4 bg-green-50 rounded-lg text-sm text-green-800">
              <p className="font-medium">What happens next?</p>
              <p className="mt-1">
                You will receive an email with the completed document once all parties have signed.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Declined state
  if (declined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="p-8 text-center">
            <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Signing Declined</h2>
            <p className="text-muted-foreground">
              You have declined to sign this document. The sender has been notified.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const docUrl = recipientData?.envelope.document_url
    ? maybeProxyStorageUrl(recipientData.envelope.document_url, recipientData.envelope.document_filename)
    : null;

  // Main signing view
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <FileSignature className="w-12 h-12 text-gold mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Sign Document</h1>
          <p className="text-muted-foreground">
            {recipientData?.envelope.sender_name || recipientData?.envelope.sender_email} has requested your signature
          </p>
        </div>

        {/* Document Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{recipientData?.envelope.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Signing as: <span className="font-medium text-foreground">{recipientData?.name}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Email: {recipientData?.email}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  if (docUrl) window.open(docUrl, "_blank");
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>

            {/* Inline centered PDF preview */}
            {docUrl && (
              <div className="w-full flex justify-center">
                <iframe
                  src={`${docUrl}#toolbar=0&navpanes=0`}
                  className="w-full max-w-3xl h-[60vh] border border-border rounded-xl mx-auto"
                  title="Document Preview"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Signature Section */}
        <Card>
          <CardHeader>
            <CardTitle>Your Signature</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Draw your signature below *
              </label>
              <ESignaturePad
                onSignatureChange={setSignatureData}
                height={150}
              />
            </div>

            {recipientData?.fields.some(f => f.field_type === "initials") && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Draw your initials below *
                </label>
                <ESignaturePad
                  onSignatureChange={setInitialsData}
                  height={100}
                />
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
              <p className="font-medium text-amber-800 mb-1">
                Legal Notice
              </p>
              <p className="text-amber-700">
                By clicking "Sign Document", you agree that your electronic signature is the legal 
                equivalent of your manual signature on this document.
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={handleDecline}
                disabled={submitting}
                className="flex-1"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Decline
              </Button>
              <Button
                onClick={handleSubmitSignature}
                disabled={submitting || !signatureData}
                className="flex-1 bg-gold hover:bg-gold/90"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Sign Document
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Powered by JBJ Global Real Estate E-Signature</p>
          <p className="mt-1">
            Questions? Contact{" "}
            <a href="mailto:janeaboujaoudenails@gmail.com" className="text-gold hover:underline">
              janeaboujaoudenails@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
