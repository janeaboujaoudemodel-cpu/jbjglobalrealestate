import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileSignature, CheckCircle2, XCircle, AlertTriangle, Loader2, Download,
  Smartphone, Mail, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { maybeProxyStorageUrl } from "@/utils/downloadProxy";
import { SUPABASE_URL } from "@/config/backend";
import {
  DOCUSIGN_APP_STORE,
  DOCUSIGN_PLAY_STORE,
  DOCUSIGN_WEB,
  SIGNED_RETURN_EMAIL,
} from "@/config/docusignHandoff";

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
}

export default function SignDocument() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RecipientData | null>(null);
  const [completed, setCompleted] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [acked, setAcked] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setError("This signing link is missing its token. Please open the link directly from your email.");
        setLoading(false); return;
      }
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/esign-load-document`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const out = await res.json().catch(() => ({}));
        const terminalState = out?.state as string | undefined;
        if (!res.ok || terminalState === "expired" || terminalState === "invalid" || terminalState === "removed") {
          let msg = out?.error || "We couldn't load this document.";
          if (terminalState === "expired" || res.status === 410) msg = "This signing link has expired. Please ask the sender to issue a new link.";
          else if (terminalState === "invalid" || res.status === 404) msg = "This signing link is no longer valid. It may have been revoked or the document was removed.";
          else if (terminalState === "removed") msg = "This document has been removed by the sender.";
          setError(msg); setLoading(false); return;
        }
        if (out.recipient.status === "signed") { setCompleted(true); setLoading(false); return; }
        if (out.recipient.status === "declined") { setDeclined(true); setLoading(false); return; }
        if (out.envelope.status === "completed") {
          setError("This document has already been completed. A signed copy was sent to you by email.");
          setLoading(false); return;
        }
        if (["voided", "expired", "declined"].includes(out.envelope.status)) {
          setError(`This document is no longer available for signing (status: ${out.envelope.status}).`);
          setLoading(false); return;
        }
        setData({
          id: out.recipient.id,
          name: out.recipient.name,
          email: out.recipient.email,
          status: out.recipient.status,
          envelope: out.envelope,
        });
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("We couldn't reach the signing server. Please check your connection and try again.");
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const docUrl = data?.envelope.document_url
    ? maybeProxyStorageUrl(data.envelope.document_url, data.envelope.document_filename)
    : null;

  const downloadAgreement = () => {
    if (!docUrl) { toast.error("Document not available"); return; }
    window.open(docUrl, "_blank");
  };

  const markSentBack = async () => {
    if (!data) return;
    setSubmitting(true);
    try {
      // Best-effort notify backend; fall through on failure so the user still
      // gets the confirmation card (they may already have emailed the PDF).
      await fetch(`${SUPABASE_URL}/functions/v1/esign-mark-awaiting-return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      }).catch(() => null);
      setAcked(true);
      toast.success("Thanks — we'll process your signed copy as soon as it arrives.");
    } finally {
      setSubmitting(false);
    }
  };

  const HomeActions = () => (
    <div className="mt-6 flex flex-col items-center gap-3">
      <Button
        onClick={() => { window.location.href = "/"; }}
        className="bg-[#EFE6D6] hover:bg-[#E7DCC7] text-[#1A1A1A] border border-[#B89555]/60 hover:border-[#B89555] rounded-md px-6 py-2 text-sm font-medium shadow-none"
      >
        Return to Homepage
      </Button>
      <a
        href="mailto:info@jbj.ae"
        className="text-xs text-[#1A1A1A]/60 hover:text-[#1A1A1A] underline underline-offset-4 decoration-[#B89555]/50"
      >
        Contact our team
      </a>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-[#F7F2EA] border-[#B89555]/30">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 text-[#B89555] animate-spin mx-auto mb-4" />
            <p className="text-[#1A1A1A]/70">Loading document...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-[#F7F2EA] border-[#B89555]/30">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-14 h-14 text-[#B89555] mx-auto mb-4" />
            <div className="text-[11px] tracking-[0.22em] uppercase text-[#1A1A1A]/60 mb-2">
              JBJ Global Real Estate
            </div>
            <h2 className="text-xl font-bold mb-2 text-[#1A1A1A]">We couldn't open this document</h2>
            <p className="text-[#1A1A1A]/75 text-sm leading-relaxed">{error}</p>
            <HomeActions />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (completed || acked) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-[#F7F2EA] border-[#B89555]/30">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="w-20 h-20 text-emerald-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-[#1A1A1A]">
              {acked ? "Thank you" : "Document Signed!"}
            </h2>
            <p className="text-[#1A1A1A]/70">
              {acked
                ? `Our team will process your signed copy as soon as it arrives at ${SIGNED_RETURN_EMAIL}, then send you a confirmation email with the executed document.`
                : "A confirmation email has been sent to you with the signed copy."}
            </p>
            <HomeActions />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (declined) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-[#F7F2EA] border-[#B89555]/30">
          <CardContent className="p-8 text-center">
            <XCircle className="w-20 h-20 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-[#1A1A1A]">Signing Declined</h2>
            <p className="text-[#1A1A1A]/70">You have declined to sign this document. The sender has been notified.</p>
            <HomeActions />
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── DocuSign handoff (default) ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FDFBF7] py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="text-[11px] tracking-[0.22em] uppercase text-[#1A1A1A]/60 mb-2">
            JBJ Global Real Estate
          </div>
          <FileSignature className="w-10 h-10 text-[#B89555] mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Sign your agreement with DocuSign</h1>
          <p className="text-[#1A1A1A]/70 text-sm mt-2">
            {data?.envelope.sender_name || data?.envelope.sender_email} has prepared
            <span className="font-medium text-[#1A1A1A]"> "{data?.envelope.name}" </span>
            for your signature.
          </p>
        </div>

        {/* UAE compliance notice */}
        <Card className="bg-[#F7F2EA] border-[#B89555]/30">
          <CardContent className="p-5 text-sm text-[#1A1A1A]/85 leading-relaxed">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#B89555] shrink-0 mt-0.5" />
              <p>
                This agreement must be signed using <strong>DocuSign</strong> — the
                only e-signature platform officially recognised by UAE authorities.
                Signatures captured anywhere else cannot be accepted.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Step 1 — open / install DocuSign */}
        <Card className="bg-white border-[#B89555]/30">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-[#EFE6D6] border border-[#B89555]/60 text-[#1A1A1A] text-xs font-bold flex items-center justify-center">1</span>
              <h2 className="font-semibold text-[#1A1A1A]">Open DocuSign to sign</h2>
            </div>
            <p className="text-sm text-[#1A1A1A]/70 mb-4">
              Tap the button below — it opens DocuSign automatically if it's already installed.
              If not, use the App Store or Google Play link underneath to install it first.
            </p>

            {/* Primary: open DocuSign (universal link → app if installed, web otherwise) */}
            <a href={DOCUSIGN_WEB} target="_blank" rel="noopener noreferrer">
              <Button className="w-full bg-[#1A1A1A] hover:bg-[#1A1A1A]/90 text-white border border-[#B89555]/40">
                <FileSignature className="w-4 h-4 mr-2" /> Sign with DocuSign
                <ExternalLink className="w-3.5 h-3.5 ml-2 opacity-70" />
              </Button>
            </a>

            {/* Fallback: install links (smaller, secondary) */}
            <div className="mt-4 pt-4 border-t border-[#B89555]/20">
              <p className="text-xs text-[#1A1A1A]/60 mb-2">Don't have DocuSign yet?</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <a href={DOCUSIGN_APP_STORE} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full border-[#B89555]/50 text-[#1A1A1A] hover:bg-[#EFE6D6]">
                    <Smartphone className="w-3.5 h-3.5 mr-2" /> App Store (iOS)
                  </Button>
                </a>
                <a href={DOCUSIGN_PLAY_STORE} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full border-[#B89555]/50 text-[#1A1A1A] hover:bg-[#EFE6D6]">
                    <Smartphone className="w-3.5 h-3.5 mr-2" /> Google Play (Android)
                  </Button>
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 2 — get the file */}
        <Card className="bg-white border-[#B89555]/30">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-[#EFE6D6] border border-[#B89555]/60 text-[#1A1A1A] text-xs font-bold flex items-center justify-center">2</span>
              <h2 className="font-semibold text-[#1A1A1A]">Download the agreement</h2>
            </div>
            <p className="text-sm text-[#1A1A1A]/70 mb-4">
              Save the PDF to your device, then open it inside the DocuSign app and follow
              the on-screen prompts to place your signature, initials and date.
            </p>
            <Button
              onClick={downloadAgreement}
              className="bg-[#EFE6D6] hover:bg-[#E7DCC7] text-[#1A1A1A] border border-[#B89555]/60"
            >
              <Download className="w-4 h-4 mr-2" />
              Download "{data?.envelope.document_filename || "agreement.pdf"}"
            </Button>
          </CardContent>
        </Card>

        {/* Step 3 — return signed copy */}
        <Card className="bg-white border-[#B89555]/30">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-[#EFE6D6] border border-[#B89555]/60 text-[#1A1A1A] text-xs font-bold flex items-center justify-center">3</span>
              <h2 className="font-semibold text-[#1A1A1A]">Email the signed copy back</h2>
            </div>
            <p className="text-sm text-[#1A1A1A]/70 mb-4">
              Once DocuSign has finalised the document, send the signed PDF to:
            </p>
            <a
              href={`mailto:${SIGNED_RETURN_EMAIL}?subject=${encodeURIComponent(`Signed agreement — ${data?.envelope.name || ""}`)}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#1A1A1A] text-white text-sm font-medium hover:bg-[#1A1A1A]/90"
            >
              <Mail className="w-4 h-4" /> {SIGNED_RETURN_EMAIL}
            </a>
            <p className="text-xs text-[#1A1A1A]/60 mt-4">
              We'll file the signed copy in our records and email you a confirmation.
            </p>
          </CardContent>
        </Card>

        {/* Confirmation button */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            disabled={submitting}
            onClick={() => { window.location.href = "/"; }}
            className="flex-1 border-[#B89555]/40 text-[#1A1A1A]"
          >
            I'll do this later
          </Button>
          <Button
            onClick={markSentBack}
            disabled={submitting}
            className="flex-1 bg-[#EFE6D6] hover:bg-[#E7DCC7] text-[#1A1A1A] border border-[#B89555]/60"
          >
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
            I've emailed the signed copy
          </Button>
        </div>

        <div className="text-center text-xs text-[#1A1A1A]/60 pt-2">
          Powered by JBJ Global Real Estate · Questions?{" "}
          <a href="mailto:info@jbj.ae" className="underline decoration-[#B89555]/50">info@jbj.ae</a>
        </div>
      </div>
    </div>
  );
}
