import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  FileSignature, CheckCircle2, XCircle, AlertTriangle, Loader2, Download, Pencil,
  ChevronLeft, ChevronRight, PenTool,
} from "lucide-react";
import { toast } from "sonner";
import ESignaturePad from "@/components/e-signature/ESignaturePad";
import PdfPageCanvas from "@/components/e-signature/PdfPageCanvas";
import { loadPdfJs } from "@/components/e-signature/documentFieldTypes";
import { maybeProxyStorageUrl } from "@/utils/downloadProxy";
import { SUPABASE_URL } from "@/config/backend";

interface SignField {
  id: string;
  field_type: string;
  page_number: number;
  x_position: number; // percent (0-100)
  y_position: number; // percent (0-100)
  width: number;       // px @ pdf scale 1
  height: number;
  is_required: boolean;
  is_completed: boolean;
}

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
  fields: SignField[];
}

export default function SignDocument() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RecipientData | null>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [initialsData, setInitialsData] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [drawOpen, setDrawOpen] = useState<null | "signature" | "initials">(null);

  // PDF state
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageNum, setPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageRef = useRef<HTMLDivElement>(null);

  // Load envelope/recipient/fields
  useEffect(() => {
    const fetchData = async () => {
      if (!token) { setError("This signing link is missing its token. Please open the link directly from your email."); setLoading(false); return; }
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/esign-load-document`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const out = await res.json().catch(() => ({}));
        // Terminal states return HTTP 200 with `{ state, error }` so global
        // error reporters don't flag the signing page as a runtime crash.
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
          setError("This document has already been completed by all parties. A signed copy was sent to you by email."); setLoading(false); return;
        }
        if (["voided", "expired", "declined"].includes(out.envelope.status)) {
          setError(`This document is no longer available for signing (status: ${out.envelope.status}).`); setLoading(false); return;
        }
        setData({
          id: out.recipient.id,
          name: out.recipient.name,
          email: out.recipient.email,
          status: out.recipient.status,
          envelope: out.envelope,
          fields: out.fields || [],
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

  // Load PDF document for inline rendering
  useEffect(() => {
    if (!data?.envelope.document_url) return;
    let cancelled = false;
    (async () => {
      try {
        const lib = await loadPdfJs();
        const docUrl = maybeProxyStorageUrl(data.envelope.document_url, data.envelope.document_filename);
        const doc = await lib.getDocument(docUrl).promise;
        if (cancelled) return;
        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        // Jump to the first page that has fields for this signer
        const firstFieldPage = data.fields[0]?.page_number || 1;
        setPageNum(firstFieldPage);
      } catch (e) {
        console.warn("PDF preload failed:", e);
      }
    })();
    return () => { cancelled = true; };
  }, [data?.envelope.document_url, data?.envelope.document_filename, data?.fields]);

  const docUrl = data?.envelope.document_url
    ? maybeProxyStorageUrl(data.envelope.document_url, data.envelope.document_filename)
    : null;

  const submit = async () => {
    if (!data) return;
    if (!signatureData) { toast.error("Please draw your signature"); return; }
    const needsInitials = data.fields.some(f => f.field_type === "initials");
    if (needsInitials && !initialsData) { toast.error("Please provide your initials"); return; }
    setSubmitting(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/esign-process-signature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          signature_data: signatureData,
          initials_data: initialsData,
          signed_date: new Date().toLocaleDateString("en-GB"),
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to process signature");
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

  const decline = async () => {
    if (!data) return;
    const reason = prompt("Please provide a reason for declining (optional):");
    setSubmitting(true);
    try {
      await supabase.from("esign_recipients").update({
        status: "declined",
        declined_at: new Date().toISOString(),
        decline_reason: reason || null,
      }).eq("id", data.id);
      await supabase.from("esign_envelopes").update({ status: "declined" }).eq("id", data.envelope.id);
      await supabase.from("esign_audit_log").insert({
        envelope_id: data.envelope.id,
        recipient_id: data.id,
        action: "declined",
        description: `${data.name} declined to sign${reason ? `: ${reason}` : ""}`,
        actor_email: data.email,
        actor_name: data.name,
      });
      setDeclined(true);
    } catch { toast.error("Failed to decline"); } finally { setSubmitting(false); }
  };

  // ── Loading/error/done/declined states ────────────────────────────────────
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
            <p className="text-xs text-[#1A1A1A]/55 mt-5">
              If you believe this is a mistake, please reply to the original email and our team will issue a new link.
            </p>
            <HomeActions />
          </CardContent>
        </Card>
      </div>
    );
  }
  if (completed) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-[#F7F2EA] border-[#B89555]/30">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="w-20 h-20 text-emerald-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-[#1A1A1A]">Document Signed!</h2>
            <p className="text-[#1A1A1A]/70">A confirmation email will be sent to you shortly.</p>
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

  const pageFields = data?.fields.filter(f => f.page_number === pageNum) || [];
  const today = new Date().toLocaleDateString("en-GB");

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-6 px-3">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Header */}
        <div className="text-center">
          <FileSignature className="w-10 h-10 text-[#B89555] mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Sign Document</h1>
          <p className="text-[#1A1A1A]/70 text-sm">
            {data?.envelope.sender_name || data?.envelope.sender_email} has requested your signature
          </p>
        </div>

        {/* Signer card */}
        <Card className="bg-[#F7F2EA] border-[#B89555]/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#EFE6D6] border border-[#B89555]/40 flex items-center justify-center text-base font-bold text-[#1A1A1A]">
              {data?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[#1A1A1A] truncate">{data?.name}</p>
              <p className="text-sm text-[#1A1A1A]/70 truncate">{data?.envelope.name}</p>
            </div>
            {docUrl && (
              <Button variant="outline" size="sm" onClick={() => window.open(docUrl, "_blank")}>
                <Download className="w-4 h-4 mr-2" /> PDF
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Document with field overlays */}
        <Card className="bg-white border-[#B89555]/30 overflow-hidden">
          <CardHeader className="bg-[#F7F2EA] border-b border-[#B89555]/30 py-3">
            <CardTitle className="text-sm flex items-center justify-between text-[#1A1A1A]">
              <span>Document — click "Sign Here" to add your signature</span>
              {totalPages > 1 && (
                <span className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-7 w-7"
                    onClick={() => setPageNum(p => Math.max(1, p - 1))} disabled={pageNum <= 1}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-xs">Page {pageNum} of {totalPages}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7"
                    onClick={() => setPageNum(p => Math.min(totalPages, p + 1))} disabled={pageNum >= totalPages}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 bg-[#FDFBF7]">
            <div className="w-full overflow-auto flex justify-center">
              <div ref={pageRef} className="relative" style={{ display: "inline-block" }}>
                {docUrl && (
                  <PdfPageCanvas
                    pdfDoc={pdfDoc}
                    pageNumber={pageNum}
                    pdfUrl={docUrl}
                    onDocLoaded={(d) => { setPdfDoc(d); setTotalPages(d.numPages); }}
                  />
                )}
                {/* Field overlays — clickable Sign Here / Initials / Date */}
                {pageFields.map((f) => {
                  const isSig = f.field_type === "signature";
                  const isInit = f.field_type === "initials";
                  const isDate = f.field_type === "date";
                  const filled = (isSig && signatureData) || (isInit && initialsData);
                  // Legacy fields stored x/y in raw pixels on the 794×1123 reference
                  // viewport. Modern fields store percentages 0-100. Detect and normalise.
                  const REF_W = 794;
                  const REF_H = 1123;
                  const isLegacyPx = f.x_position > 100 || f.y_position > 100;
                  const xPct = isLegacyPx ? (f.x_position / REF_W) * 100 : f.x_position;
                  const yPct = isLegacyPx ? (f.y_position / REF_H) * 100 : f.y_position;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        if (isSig) setDrawOpen("signature");
                        else if (isInit) setDrawOpen("initials");
                      }}
                      disabled={isDate}
                      className={`absolute rounded border-2 transition-colors ${
                        filled
                          ? "border-emerald-500 bg-emerald-50/60"
                          : isDate
                          ? "border-[#B89555]/60 bg-[#FDF6E9]/80"
                          : "border-amber-500 bg-amber-100/80 hover:bg-amber-200 animate-pulse"
                      }`}
                      style={{
                        left: `${xPct}%`,
                        top: `${yPct}%`,
                        width: `${f.width}px`,
                        height: `${f.height}px`,
                        cursor: isDate ? "default" : "pointer",
                      }}
                      title={isSig ? "Click to sign" : isInit ? "Click to add initials" : "Auto-filled with signing date"}
                    >
                      {isSig && signatureData && (
                        <img src={signatureData} alt="Signature" className="w-full h-full object-contain" draggable={false} />
                      )}
                      {isInit && initialsData && (
                        <img src={initialsData} alt="Initials" className="w-full h-full object-contain" draggable={false} />
                      )}
                      {isSig && !signatureData && (
                        <span className="flex items-center justify-center gap-1.5 h-full text-amber-900 text-xs font-bold uppercase tracking-wider">
                          <Pencil className="w-3.5 h-3.5" /> Sign Here
                        </span>
                      )}
                      {isInit && !initialsData && (
                        <span className="flex items-center justify-center gap-1.5 h-full text-amber-900 text-xs font-bold uppercase tracking-wider">
                          <PenTool className="w-3.5 h-3.5" /> Initials
                        </span>
                      )}
                      {isDate && (
                        <span className="flex items-center justify-center h-full text-[#1A1A1A]/80 text-xs font-medium px-2">
                          {today}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Signature pad fallback (still allow drawing if no fields placed) */}
        {data && data.fields.length === 0 && (
          <Card className="bg-white border-[#B89555]/30">
            <CardHeader><CardTitle className="text-base text-[#1A1A1A]">Your Signature</CardTitle></CardHeader>
            <CardContent>
              <ESignaturePad onSignatureChange={setSignatureData} height={150} />
            </CardContent>
          </Card>
        )}

        {/* Legal notice + actions */}
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4 text-sm text-amber-900">
            <strong>Legal Notice:</strong> By clicking "Sign Document", you agree that your electronic signature is the legal equivalent of your manual signature.
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" onClick={decline} disabled={submitting} className="flex-1">
            <XCircle className="w-4 h-4 mr-2" /> Decline
          </Button>
          <Button
            variant="gold"
            onClick={submit}
            disabled={submitting || !signatureData}
            className="flex-1"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
            ) : (
              <><CheckCircle2 className="w-4 h-4 mr-2" /> Sign Document</>
            )}
          </Button>
        </div>

        <div className="text-center text-xs text-[#1A1A1A]/60">
          Powered by JBJ Global Real Estate · Questions? <a href="mailto:contact@jbj.ae" className="underline">contact@jbj.ae</a>
        </div>
      </div>

      {/* Draw signature / initials dialog */}
      <Dialog open={!!drawOpen} onOpenChange={(o) => !o && setDrawOpen(null)}>
        <DialogContent className="sm:max-w-md bg-[#FDFBF7]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#1A1A1A]">
              <Pencil className="w-5 h-5" />
              {drawOpen === "initials" ? "Draw Your Initials" : "Draw Your Signature"}
            </DialogTitle>
          </DialogHeader>
          <ESignaturePad
            onSignatureChange={(dataUrl) => {
              if (!dataUrl) return;
              if (drawOpen === "initials") setInitialsData(dataUrl);
              else setSignatureData(dataUrl);
            }}
            height={180}
          />
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="outline" onClick={() => setDrawOpen(null)}>Cancel</Button>
            <Button
              variant="gold"
              onClick={() => {
                if (drawOpen === "initials" && !initialsData) { toast.error("Please draw your initials"); return; }
                if (drawOpen === "signature" && !signatureData) { toast.error("Please draw your signature"); return; }
                setDrawOpen(null);
                toast.success("Applied");
              }}
            >
              Apply
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
