import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconTile } from "@/components/ui/icon-tile";
import { FileText, Download, Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useOwnerSignatureAssets } from "@/hooks/useOwnerSignatureAssets";

export default function VatCertificate() {
  const loc = useLocation() as { state?: { recipient?: string; email?: string } };
  const [recipient, setRecipient] = useState(loc.state?.recipient ?? "");
  const [company, setCompany] = useState("");
  const [trn, setTrn] = useState("");
  const [effective, setEffective] = useState(new Date().toISOString().split("T")[0]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const { data: signatures = [] } = useOwnerSignatureAssets("signature");
  const { data: stamps = [] } = useOwnerSignatureAssets("stamp");
  const sigDefault = signatures.find((s) => s.is_default) ?? signatures[0];
  const stampDefault = stamps.find((s) => s.is_default) ?? stamps[0];

  async function urlToB64(url: string): Promise<string | null> {
    try {
      const blob = await (await fetch(url)).blob();
      return await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = rej;
        r.readAsDataURL(blob);
      });
    } catch { return null; }
  }

  async function generate() {
    setLoading(true);
    try {
      const sigB64 = sigDefault ? await urlToB64(sigDefault.image_url) : null;
      const stampB64 = stampDefault ? await urlToB64(stampDefault.image_url) : null;
      const { data, error } = await supabase.functions.invoke("generate-vat-certificate", {
        body: {
          recipient_name: recipient,
          recipient_company: company,
          trn_number: trn,
          effective_date: effective,
          signature_image_b64: sigB64,
          stamp_image_b64: stampB64,
        },
      });
      if (error) throw error;
      setPdfUrl(data.signed_url ?? null);
      setPdfBase64(data.pdf_base64 ?? null);
      toast.success("VAT certificate generated");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function sendToDeveloper() {
    if (!loc.state?.email || !pdfUrl) {
      toast.error("Recipient email or PDF missing");
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-developer-reply", {
        body: {
          to: loc.state.email,
          subject: "VAT Certificate — JBJ GLOBAL REAL ESTATE",
          body: `Dear ${recipient || "Sir/Madam"},\n\nPlease find our VAT certificate available at the link below.`,
          document_link: pdfUrl,
        },
      });
      if (error) throw error;
      toast.success("Email sent to " + loc.state.email);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="p-6 space-y-6 bg-[#FDFBF7] min-h-screen">
      <div className="flex items-center gap-3">
        <IconTile icon={FileText} tone="gold" />
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">VAT Certificate Generator</h1>
          <p className="text-sm text-[#1A1A1A]/70">Branded JBJ template — auto-fills your saved signature & stamp.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-[#F7F2EA] border-[#B89555]/20">
          <CardHeader>
            <CardTitle className="text-[#1A1A1A] text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-[#1A1A1A]">Recipient name</Label>
              <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="To Whom It May Concern" />
            </div>
            <div>
              <Label className="text-[#1A1A1A]">Recipient company</Label>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Optional" />
            </div>
            <div>
              <Label className="text-[#1A1A1A]">TRN (Tax Registration Number)</Label>
              <Input value={trn} onChange={(e) => setTrn(e.target.value)} placeholder="100123456789012" />
            </div>
            <div>
              <Label className="text-[#1A1A1A]">Effective date</Label>
              <Input type="date" value={effective} onChange={(e) => setEffective(e.target.value)} />
            </div>
            <div className="text-xs text-[#1A1A1A]/70 pt-2 border-t border-[#B89555]/15">
              <p>Signature: {sigDefault ? "✓ default loaded" : "— set one in Adopt Signature Studio"}</p>
              <p>Stamp: {stampDefault ? "✓ default loaded" : "— set one in Adopt Signature Studio"}</p>
            </div>
            <Button variant="gold" className="w-full" onClick={generate} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
              Generate PDF
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-[#F7F2EA] border-[#B89555]/20">
          <CardHeader>
            <CardTitle className="text-[#1A1A1A] text-base">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {pdfBase64 ? (
              <iframe
                title="VAT preview"
                src={`data:application/pdf;base64,${pdfBase64}`}
                className="w-full h-[500px] rounded-md border border-[#B89555]/20 bg-white"
              />
            ) : (
              <div className="h-[500px] flex items-center justify-center border-2 border-dashed border-[#B89555]/25 rounded-md text-[#1A1A1A]/50 text-sm">
                Generated PDF appears here
              </div>
            )}
            {pdfUrl && (
              <div className="flex flex-wrap gap-2 mt-3">
                <Button asChild variant="outline" className="border-[#B89555]/40 text-[#1A1A1A]">
                  <a href={pdfUrl} target="_blank" rel="noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </a>
                </Button>
                <Button variant="gold" onClick={sendToDeveloper} disabled={sending || !loc.state?.email}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  Send to {loc.state?.email ?? "developer"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
