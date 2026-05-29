import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Upload, Languages, Loader2, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  headline: string;
  onSummary: (text: string) => void;
  onParsedCV: (cv: any) => void;
  onTranslateAll: (lang: string) => Promise<void>;
}

export function CVAIAssistant({ headline, onSummary, onParsedCV, onTranslateAll }: Props) {
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState<null | "summary" | "parse" | "translate">(null);
  const [lang, setLang] = useState("Arabic");
  const fileRef = useRef<HTMLInputElement>(null);

  const writeSummary = async () => {
    if (!desc.trim()) {
      toast.error("Describe yourself first");
      return;
    }
    setBusy("summary");
    try {
      const { data, error } = await supabase.functions.invoke("cv-ai-assist", {
        body: { action: "summary", description: desc, headline },
      });
      if (error) throw error;
      if (data?.text) {
        onSummary(data.text);
        toast.success("Summary written");
      }
    } catch (e: any) {
      toast.error(e?.message || "AI failed");
    } finally {
      setBusy(null);
    }
  };

  const handleUpload = async (file: File) => {
    setBusy("parse");
    try {
      let rawText = "";
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        const pdfjs: any = await import("pdfjs-dist");
        // Worker
        try {
          const workerSrc = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
          pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
        } catch {
          /* worker may already be configured globally */
        }
        const buf = await file.arrayBuffer();
        const doc = await pdfjs.getDocument({ data: buf }).promise;
        const parts: string[] = [];
        for (let i = 1; i <= doc.numPages; i++) {
          const p = await doc.getPage(i);
          const c = await p.getTextContent();
          parts.push(c.items.map((it: any) => it.str).join(" "));
        }
        rawText = parts.join("\n\n");
      } else if (file.type.startsWith("text/") || file.name.match(/\.(txt|md)$/i)) {
        rawText = await file.text();
      } else {
        toast.error("Upload a PDF or .txt file");
        return;
      }
      if (rawText.trim().length < 30) {
        toast.error("Could not extract enough text from the file");
        return;
      }
      const { data, error } = await supabase.functions.invoke("cv-ai-parse", {
        body: { rawText },
      });
      if (error) throw error;
      if (data?.cv) {
        onParsedCV(data.cv);
        toast.success("CV imported and cleaned with AI");
      }
    } catch (e: any) {
      toast.error(e?.message || "Could not parse CV");
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const translate = async () => {
    setBusy("translate");
    try { await onTranslateAll(lang); } finally { setBusy(null); }
  };

  return (
    <aside className="space-y-4">
      <div className="rounded-xl border border-[#B89555]/30 bg-[#F7F2EA] p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-md border border-[#B89555]/40 bg-[#FDFBF7] flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-[#1A1A1A]" />
          </div>
          <h3 className="text-[13px] font-semibold text-[#1A1A1A]">Write summary with AI</h3>
        </div>
        <Label className="text-[10px] uppercase tracking-[0.16em] text-[#1A1A1A]/60 mb-1 block">
          Describe yourself in a few words
        </Label>
        <Textarea
          rows={4}
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="e.g., 8 years in Dubai off-plan sales, AED 400M+ closed, fluent in Arabic and English, looking to lead a luxury team."
          className="bg-white resize-none mb-2"
        />
        <Button size="sm" className="w-full" onClick={writeSummary} disabled={busy === "summary"}>
          {busy === "summary" ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Wand2 className="w-4 h-4 mr-1.5" />}
          Generate summary
        </Button>
      </div>

      <div className="rounded-xl border border-[#B89555]/30 bg-[#F7F2EA] p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-md border border-[#B89555]/40 bg-[#FDFBF7] flex items-center justify-center">
            <Upload className="w-3.5 h-3.5 text-[#1A1A1A]" />
          </div>
          <h3 className="text-[13px] font-semibold text-[#1A1A1A]">Regenerate from old CV</h3>
        </div>
        <p className="text-[11px] text-[#1A1A1A]/70 mb-2">
          Upload your previous CV (PDF or .txt). AI will rebuild a clean, editable version.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.txt,application/pdf,text/plain"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
        />
        <Button size="sm" variant="outline" className="w-full" disabled={busy === "parse"} onClick={() => fileRef.current?.click()}>
          {busy === "parse" ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Upload className="w-4 h-4 mr-1.5" />}
          Upload &amp; rebuild
        </Button>
      </div>

      <div className="rounded-xl border border-[#B89555]/30 bg-[#F7F2EA] p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-md border border-[#B89555]/40 bg-[#FDFBF7] flex items-center justify-center">
            <Languages className="w-3.5 h-3.5 text-[#1A1A1A]" />
          </div>
          <h3 className="text-[13px] font-semibold text-[#1A1A1A]">Translate CV</h3>
        </div>
        <Input value={lang} onChange={(e) => setLang(e.target.value)} className="bg-white mb-2" />
        <Button size="sm" variant="outline" className="w-full" onClick={translate} disabled={busy === "translate"}>
          {busy === "translate" ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Languages className="w-4 h-4 mr-1.5" />}
          Translate everything
        </Button>
      </div>
    </aside>
  );
}
