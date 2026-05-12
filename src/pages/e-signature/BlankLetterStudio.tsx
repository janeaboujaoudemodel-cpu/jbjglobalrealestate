/**
 * Blank Letter Studio — generate a JBJ letter with AI on a branded A4 sheet.
 * Header + footer match the PAA template; body is AI-generated and editable.
 * Stamp/Signature load from the user's saved owner_signature_assets.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Sparkles, Download, Loader2, ArrowLeft, Stamp as StampIcon, PenTool, Calendar, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { renderHtmlToPdfBlob, allocateDocNumber } from "@/hooks/useEsignTemplates";
import { buildBlankLetterHtml, BLANK_LETTER_TEMPLATE_KEY, type BlankLetterValues } from "@/templates/jbjBlankLetter";
import { useOwnerSignatureAssets, useSaveSignatureAsset } from "@/hooks/useOwnerSignatureAssets";

const PRESETS = [
  { id: "offer", label: "Job Offer", prompt: "Write a job offer letter for [Name] for the position of [Title], salary AED [amount]/month, start date [date]." },
  { id: "warning", label: "Warning Letter", prompt: "Write a formal HR warning letter to [Name] regarding [issue]. Reference company policy and request corrective action within [N] days." },
  { id: "vat", label: "VAT Exemption", prompt: "Write a VAT exemption confirmation letter for [client/property] in accordance with UAE FTA guidance for [reason]." },
  { id: "noc", label: "NOC", prompt: "Write a No-Objection Certificate (NOC) authorising [Name] to [action] on behalf of JBJ Global Real Estate." },
  { id: "salary", label: "Salary Certificate", prompt: "Write a salary certificate for employee [Name], position [Title], confirming gross monthly salary AED [amount] for [purpose]." },
  { id: "termination", label: "Termination", prompt: "Write a respectful employment termination letter for [Name] effective [date], referencing notice period and final settlement." },
  { id: "reference", label: "Reference Letter", prompt: "Write a professional reference letter for [Name] who served as [Title] from [date] to [date]." },
];

export default function BlankLetterStudio() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);

  const [docNumber, setDocNumber] = useState("");
  const [prompt, setPrompt] = useState("");
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [signerName, setSignerName] = useState("");
  const [signerTitle, setSignerTitle] = useState("");
  const [date, setDate] = useState("");
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: signatures = [] } = useOwnerSignatureAssets("signature");
  const { data: stamps = [] } = useOwnerSignatureAssets("stamp");
  const saveAsset = useSaveSignatureAsset();

  const defaultSignature = signatures.find((s) => s.is_default) || signatures[0];
  const defaultStamp = stamps.find((s) => s.is_default) || stamps[0];

  // Allocate a doc number on mount
  useEffect(() => {
    (async () => {
      try {
        const dn = await allocateDocNumber(BLANK_LETTER_TEMPLATE_KEY);
        setDocNumber(dn);
      } catch {
        setDocNumber(`JBJ-LTR-${Date.now().toString().slice(-6)}`);
      }
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      if (u) {
        setSignerName(((u.user_metadata as any)?.full_name) || u.email || "");
      }
    })();
  }, []);

  const values: BlankLetterValues = useMemo(() => ({
    doc_number: docNumber,
    subject,
    date,
    recipient,
    body_html: bodyHtml,
    signer_name: signerName,
    signer_title: signerTitle,
  }), [docNumber, subject, date, recipient, bodyHtml, signerName, signerTitle]);

  const previewHtml = useMemo(() => buildBlankLetterHtml(values, {
    ownerSignatureUrl: defaultSignature?.image_url || null,
    ownerStampUrl: defaultStamp?.image_url || null,
    renderMode: "edit",
  }), [values, defaultSignature?.image_url, defaultStamp?.image_url]);

  const handleGenerate = async () => {
    if (!prompt.trim()) { toast.error("Type what the letter should say"); return; }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("letter-ai-generate", {
        body: { prompt, recipient },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const r: any = data;
      if (r?.subject) setSubject(r.subject);
      if (r?.recipient) setRecipient(r.recipient);
      if (r?.body_html) setBodyHtml(r.body_html);
      toast.success("Letter drafted — review and edit before saving");
    } catch (e: any) {
      toast.error(e?.message || "AI generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleUploadStamp = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await saveAsset.mutateAsync({
          kind: "stamp",
          image_data_url: String(reader.result),
          label: file.name,
          makeDefault: true,
        });
      } catch {/* toast handled in hook */}
    };
    reader.readAsDataURL(file);
    if (stampInputRef.current) stampInputRef.current.value = "";
  };

  const handleUploadSignature = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await saveAsset.mutateAsync({
          kind: "signature",
          image_data_url: String(reader.result),
          label: file.name,
          makeDefault: true,
        });
      } catch {/* */}
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleInsertDate = () => {
    const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    setBodyHtml((prev) => prev + `<p>${today}</p>`);
  };

  const buildFinalHtml = () => buildBlankLetterHtml(values, {
    ownerSignatureUrl: defaultSignature?.image_url || null,
    ownerStampUrl: defaultStamp?.image_url || null,
    renderMode: "final",
  });

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const html = buildFinalHtml();
      const { blob } = await renderHtmlToPdfBlob(html);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${docNumber || "JBJ-Letter"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Letter downloaded");
    } catch (e: any) {
      toast.error(e?.message || "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  const handleSave = async () => {
    if (!subject && !bodyHtml) { toast.error("Nothing to save yet"); return; }
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) throw new Error("Not signed in");
      const html = buildFinalHtml();
      const { blob } = await renderHtmlToPdfBlob(html);
      const filename = `${user.id}/${crypto.randomUUID()}.pdf`;
      const { error: upErr } = await supabase.storage
        .from("esign-documents")
        .upload(filename, blob, { contentType: "application/pdf", upsert: false });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("esign-documents").getPublicUrl(filename);
      const { data: env, error: envErr } = await supabase
        .from("esign_envelopes")
        .insert({
          name: `${docNumber} — ${subject || "Letter"}`,
          description: "AI-drafted letter",
          document_url: urlData.publicUrl,
          document_filename: `${docNumber}.pdf`,
          document_size_bytes: blob.size,
          page_count: 1,
          sender_id: user.id,
          sender_email: user.email!,
          sender_name: ((user.user_metadata as any)?.full_name) || user.email,
          status: "draft",
          email_subject: subject || `Letter ${docNumber}`,
          category: "other",
          template_key: BLANK_LETTER_TEMPLATE_KEY,
          template_html: html,
          template_field_values: values as any,
          metadata: { doc_number: docNumber, cc_emails: [] },
          expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();
      if (envErr) throw envErr;
      toast.success("Letter saved to your library");
      navigate(`/e-signature/${env.id}`);
    } catch (e: any) {
      toast.error(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/e-signature")} className="text-[#1A1A1A]">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#1A1A1A]">Blank Letter Studio</h1>
              <p className="text-sm text-[#1A1A1A]/70">AI-drafted letters on JBJ letterhead · {docNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save
            </Button>
            <Button onClick={handleDownload} disabled={downloading} className="bg-[#1A1A1A] hover:bg-[#1A1A1A]/90 text-white">
              {downloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Download PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6">
          {/* Editor */}
          <div className="space-y-4">
            <Card className="p-4 bg-white border-[#EFE6D6]">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-[#B89555]" />
                <Label className="text-sm font-semibold text-[#1A1A1A]">AI Prompt</Label>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPrompt(p.prompt)}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-[#EFE6D6] hover:border-[#B89555] text-[#1A1A1A] bg-[#FDFBF7]"
                  >{p.label}</button>
                ))}
              </div>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                placeholder="e.g. Write a job offer letter for Jane Doe as Senior Broker, AED 18,000/month, start 1 June 2026."
                className="text-sm resize-none"
              />
              <Button onClick={handleGenerate} disabled={generating} className="mt-2 w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:opacity-90 text-white">
                {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Generate with AI
              </Button>
            </Card>

            <Card className="p-4 bg-white border-[#EFE6D6] space-y-3">
              <div>
                <Label className="text-xs uppercase tracking-wider text-[#1A1A1A]/70">Subject</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Letter subject" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-[#1A1A1A]/70">Recipient</Label>
                  <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Mr. John Doe" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-[#1A1A1A]/70">Date</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-[#1A1A1A]/70">Body (HTML)</Label>
                <Textarea value={bodyHtml} onChange={(e) => setBodyHtml(e.target.value)} rows={10} className="text-sm font-mono" placeholder="<p>Dear …</p>" />
                <Button size="sm" variant="outline" className="mt-2" onClick={handleInsertDate}>
                  <Calendar className="w-3.5 h-3.5 mr-1.5" /> Insert today's date
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-[#1A1A1A]/70">Signer Name</Label>
                  <Input value={signerName} onChange={(e) => setSignerName(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-[#1A1A1A]/70">Title</Label>
                  <Input value={signerTitle} onChange={(e) => setSignerTitle(e.target.value)} placeholder="CEO" />
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-white border-[#EFE6D6] space-y-2">
              <Label className="text-sm font-semibold text-[#1A1A1A]">Brand Assets</Label>
              <div className="flex items-center gap-2">
                <PenTool className="w-4 h-4 text-[#1A1A1A]/70" />
                <span className="text-xs text-[#1A1A1A]/80 flex-1">
                  Signature: {defaultSignature ? "✓ on file" : "none yet"}
                </span>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUploadSignature} className="hidden" />
                <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>Upload</Button>
              </div>
              <div className="flex items-center gap-2">
                <StampIcon className="w-4 h-4 text-[#1A1A1A]/70" />
                <span className="text-xs text-[#1A1A1A]/80 flex-1">
                  Stamp: {defaultStamp ? "✓ on file" : "none yet"}
                </span>
                <input ref={stampInputRef} type="file" accept="image/*" onChange={handleUploadStamp} className="hidden" />
                <Button size="sm" variant="outline" onClick={() => stampInputRef.current?.click()}>Upload</Button>
              </div>
              <p className="text-[10px] text-[#1A1A1A]/60 pt-1">
                Saved stamps and signatures appear automatically in the signature row of the letter.
              </p>
            </Card>
          </div>

          {/* Preview */}
          <Card className="p-3 bg-[#F7F2EA] border-[#EFE6D6] overflow-auto" style={{ maxHeight: "calc(100vh - 140px)" }}>
            <div
              className="bg-white shadow-lg mx-auto"
              style={{ width: 794, minHeight: 1123 }}
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
