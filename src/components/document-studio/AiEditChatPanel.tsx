/**
 * AiEditChatPanel — Live Document Editor (right rail)
 * ---------------------------------------------------
 * Owner-side AI co-editor with:
 *   • Native browser microphone dictation (Web Speech API — no API keys)
 *   • Language selector (STT + AI reply language)
 *   • File attachments (paperclip → images / PDFs as base64 chips)
 *   • Free-text instruction box
 * The locked premium chrome (header + footer) is never sent to the AI
 * and never returned — only the editable body changes.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles, Loader2, Send, Mic, MicOff, Paperclip, X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { stripChromeArtifacts } from "@/templates/jbjLockedChrome";

interface Msg { role: "user" | "assistant"; content: string }
interface Attachment { name: string; type: string; dataUrl: string }

interface Props {
  currentBody: string;
  aiInstructions: string;
  onApply: (nextBody: string) => void;
  language?: string;
  onClose?: () => void;
}

export const LANGUAGES: Array<{ code: string; label: string; bcp47: string }> = [
  { code: "English",    label: "English",    bcp47: "en-US" },
  { code: "Arabic",     label: "العربية",    bcp47: "ar-AE" },
  { code: "French",     label: "Français",   bcp47: "fr-FR" },
  { code: "Spanish",    label: "Español",    bcp47: "es-ES" },
  { code: "Hindi",      label: "हिन्दी",      bcp47: "hi-IN" },
  { code: "Urdu",       label: "اردو",       bcp47: "ur-PK" },
  { code: "Russian",    label: "Русский",    bcp47: "ru-RU" },
  { code: "German",     label: "Deutsch",    bcp47: "de-DE" },
  { code: "Italian",    label: "Italiano",   bcp47: "it-IT" },
  { code: "Portuguese", label: "Português",  bcp47: "pt-PT" },
  { code: "Chinese",    label: "中文",        bcp47: "zh-CN" },
];

export default function AiEditChatPanel({ currentBody, aiInstructions, onApply, language: languageProp, onClose }: Props) {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        'I\'m your document editor. Type, dictate (mic), or attach a file — e.g. "raise the salary to AED 30,000", "add a 90-day probation clause", "make the tone warmer".',
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const language = languageProp || "English";
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  /* ───── Native browser dictation (Web Speech API) ───── */
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef<string>("");

  const sttSupported = typeof window !== "undefined" &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const startMic = useCallback(() => {
    if (!sttSupported) {
      toast.error("Your browser doesn't support voice dictation. Try Chrome or Edge.");
      return;
    }
    try {
      const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new Ctor();
      const lang = LANGUAGES.find((l) => l.code === language)?.bcp47 || "en-US";
      rec.lang = lang;
      rec.continuous = true;
      rec.interimResults = true;
      baseTextRef.current = input.trim();

      rec.onresult = (e: any) => {
        let interim = "";
        let finalText = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) finalText += t;
          else interim += t;
        }
        if (finalText) {
          baseTextRef.current = (baseTextRef.current + " " + finalText).trim();
        }
        setInput((baseTextRef.current + " " + interim).trim());
      };
      rec.onerror = (e: any) => {
        const msg = e?.error === "not-allowed"
          ? "Microphone permission denied"
          : e?.error === "no-speech" ? "No speech detected" : `Mic error: ${e?.error || "unknown"}`;
        toast.error(msg);
        setListening(false);
      };
      rec.onend = () => setListening(false);

      recognitionRef.current = rec;
      rec.start();
      setListening(true);
      toast.success("Listening…");
    } catch (e: any) {
      toast.error(e?.message || "Microphone unavailable");
    }
  }, [sttSupported, language, input]);

  const stopMic = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch { /* noop */ }
    setListening(false);
  }, []);

  useEffect(() => () => { try { recognitionRef.current?.stop(); } catch { /* noop */ } }, []);

  /* ───── Attachments ───── */
  const [dragOver, setDragOver] = useState(false);
  const onPickFiles = () => fileRef.current?.click();
  const ingestFiles = useCallback(async (files: File[]) => {
    if (!files.length) return;
    const next: Attachment[] = [];
    for (const f of files) {
      if (f.size > 8 * 1024 * 1024) { toast.error(`${f.name} too large (max 8MB)`); continue; }
      try {
        const dataUrl: string = await new Promise((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(String(r.result));
          r.onerror = () => rej(r.error);
          r.readAsDataURL(f);
        });
        next.push({ name: f.name, type: f.type, dataUrl });
      } catch {
        toast.error(`Could not read ${f.name}`);
      }
    }
    if (next.length) {
      setAttachments((a) => [...a, ...next]);
      toast.success(`${next.length} file${next.length > 1 ? "s" : ""} attached`);
    }
  }, []);
  const onFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    await ingestFiles(files);
  };
  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files || []);
    await ingestFiles(files);
  };
  const removeAttachment = (i: number) =>
    setAttachments((a) => a.filter((_, idx) => idx !== i));

  /* ───── Send ───── */
  const send = async () => {
    const instruction = input.trim();
    if ((!instruction && attachments.length === 0) || busy) return;
    if (listening) stopMic();

    setMessages((m) => [...m, {
      role: "user",
      content: instruction + (attachments.length ? `\n\n📎 ${attachments.map((a) => a.name).join(", ")}` : ""),
    }]);
    setInput("");
    baseTextRef.current = "";
    setBusy(true);

    try {
      const promptParts = [
        `ROLE: You are a UAE-licensed HR Director and corporate lawyer drafting on behalf of JBJ GLOBAL REAL ESTATE (Dubai). You write offers, contracts, warnings, NDAs, commission and tenancy documents that comply with UAE Federal Decree-Law No. 33 of 2021 (Labour Law) and its Executive Regulations, RERA / DLD Forms (A, F, I, U), and the UAE Civil Code. You are precise, formal, defensible in court, and never invent figures.`,
        `STYLE: Inter, single-page A4, no markdown asterisks, no emoji. Tight clauses. Currency = AED unless stated. Dates DD Month YYYY. Never expose private contact info. Cite article numbers ONLY when the user asks.`,
        `RULES: Do not fabricate names, salaries, IDs, or dates that aren't already in the body or instruction. If a value is missing, leave a clean blank line — NEVER a placeholder like "[NAME]". Preserve every existing field value unless the instruction explicitly changes it.`,
        ``,
        `Steering: ${aiInstructions}`,
        ``,
        `Reply in ${language}.`,
        ``,
        `Current body (plain text):`,
        `"""`,
        stripChromeArtifacts(currentBody)
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<\/p>/gi, "\n\n")
          .replace(/<[^>]+>/g, "")
          .replace(/\n{3,}/g, "\n\n")
          .trim(),
        `"""`,
        ``,
        attachments.length
          ? `Attached files (consider their content): ${attachments.map((a) => `${a.name} (${a.type || "file"})`).join(", ")}`
          : ``,
        ``,
        `Apply this instruction and return the FULL revised body:`,
        instruction || "(use attachments to fill the document)",
      ].filter(Boolean).join("\n");

      const { data, error } = await supabase.functions.invoke("letter-ai-generate", {
        body: {
          prompt: promptParts,
          tone: "formal",
          language,
          attachments: attachments.map((a) => ({ name: a.name, type: a.type, dataUrl: a.dataUrl })),
        },
      });
      if (error) throw error;

      const newBodyText: string = (data?.body_text || data?.bodyText || "").toString().trim();
      if (!newBodyText) throw new Error("No content returned");

      const html = newBodyText
        .split(/\n{2,}/)
        .map((p) => `<p style="margin:0 0 14px;line-height:1.65;">${p.replace(/\n/g, "<br/>")}</p>`)
        .join("");

      onApply(html);
      setAttachments([]);
      setMessages((m) => [...m, { role: "assistant", content: "Done — the document has been updated. Anything else?" }]);
    } catch (e: any) {
      toast.error(e?.message || "AI edit failed");
      setMessages((m) => [...m, { role: "assistant", content: "I couldn't apply that change. Try rephrasing." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      data-no-contrast-guard
      onDragOver={(e) => { e.preventDefault(); if (!dragOver) setDragOver(true); }}
      onDragLeave={(e) => { if (e.currentTarget === e.target) setDragOver(false); }}
      onDrop={onDrop}
      className="relative flex flex-col h-full bg-[#FDFBF7] border border-[#B89555]/55 rounded-xl overflow-hidden shadow-sm"
    >
      {dragOver && (
        <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center bg-[#FDFBF7]/95 border-2 border-dashed border-[#064E3B] rounded-xl">
          <div className="text-center px-6">
            <Paperclip className="w-8 h-8 mx-auto mb-2 text-[#064E3B]" />
            <p className="text-sm font-semibold text-[#1A1A1A]">Drop files to attach</p>
            <p className="text-xs text-[#1A1A1A]/60 mt-1">Images, PDF, DOC, DOCX, TXT · up to 8MB each · multiple files OK</p>
          </div>
        </div>
      )}
      <div className="px-4 py-3 border-b border-[#B89555]/45 flex items-center gap-2 bg-[#F7F2EA]">
        <Sparkles className="w-4 h-4 shrink-0" style={{ color: "#064E3B" }} />
        <span className="text-sm font-semibold leading-tight min-w-0" style={{ color: "#1A1A1A" }}>AI Document Assistant</span>
        <span className="ml-auto text-[10px] uppercase tracking-[0.14em] font-semibold shrink-0" style={{ color: "#1A1A1A" }}>
          {language}
        </span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close AI Assistant"
            className="h-9 w-9 rounded-md border border-[#B89555]/45 bg-[#FDFBF7] text-[#1A1A1A] inline-flex items-center justify-center hover:bg-[#EFE6D6] shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>


      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-[240px]">
        {messages.map((m, i) => (
          <div
            key={i}
            className={[
              "text-sm rounded-lg px-3 py-2 max-w-[92%] whitespace-pre-wrap",
              m.role === "assistant"
                ? "bg-[#F7F2EA] border border-[#B89555]/40 text-[#1A1A1A] mr-auto"
                : "bg-[#EFE6D6] border border-[#B89555]/55 text-[#1A1A1A] ml-auto",
            ].join(" ")}
          >
            {m.content}
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-2 text-xs text-[#1A1A1A]/70">
            <Loader2 className="w-3 h-3 animate-spin" /> Updating document…
          </div>
        )}
      </div>

      {attachments.length > 0 && (
        <div className="px-3 pt-2 flex flex-wrap gap-1.5">
          {attachments.map((a, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 text-[11px] bg-[#F7F2EA] border border-[#B89555]/30 text-[#1A1A1A] rounded-full px-2 py-0.5"
            >
              📎 {a.name.length > 22 ? a.name.slice(0, 20) + "…" : a.name}
              <button onClick={() => removeAttachment(i)} className="ml-0.5 hover:text-red-600" aria-label="Remove">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="p-4 border-t border-[#B89555]/45 space-y-2 bg-[#F7F2EA]">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={listening ? "Listening… speak now" : "Tell the editor what to change…"}
          rows={3}
          className="text-sm resize-none bg-[#FDFBF7] border-[#B89555]/60 focus-visible:ring-[#B89555]"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); }
          }}
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*,application/pdf,.doc,.docx,.txt,.rtf,.xls,.xlsx,.csv,.heic,.heif"
            onChange={onFilesSelected}
            className="hidden"
          />
          <Button type="button" variant="outline" size="sm" onClick={onPickFiles} title="Attach files" className="h-10 px-3 w-full justify-center">
            <Paperclip className="w-4 h-4 mr-2" />
            Attach Files
          </Button>
          <Button
            type="button"
            variant={listening ? "destructive" : "outline"}
            size="sm"
            onClick={listening ? stopMic : startMic}
            title={listening ? "Stop dictation" : "Start dictation"}
            className="h-10 px-3 w-full justify-center"
          >
            {listening ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
            {listening ? "Stop" : "Dictate"}
          </Button>
          <Button
            onClick={send}
            disabled={busy || (!input.trim() && attachments.length === 0)}
            className="h-10 px-3 col-span-2 w-full justify-center"
            size="sm"
          >
            <Send className="w-4 h-4 mr-2" /> Apply with AI
          </Button>
        </div>
      </div>
    </div>
  );
}
