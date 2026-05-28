// Log-a-call dialog with:
// - searchable lead picker (name / phone / email / nationality / source)
// - browser microphone recorder
// - upload of recording, AI transcription + evaluation
// - auto duration, points awarded by parent
// Designed to live inside BrokerCRM.tsx as the only call-logging surface.

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Phone, CheckCircle2, Loader2, Mic, Square, Search, X, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface PickerLead {
  id: string;
  full_name?: string | null;
  email?: string | null;
  email_lower?: string | null;
  phone?: string | null;
  phone_e164?: string | null;
  nationality?: string | null;
  source?: string | null;
  pipeline_stage?: string | null;
}

export interface LogCallSubmit {
  leadId?: string | null;
  phoneNumber: string;
  callType: string;
  callStatus: string;
  durationSeconds: number;
  notes?: string | null;
  audioBlob?: Blob | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leads: PickerLead[];
  userId?: string | null;
  submitting: boolean;
  onSubmit: (input: LogCallSubmit) => Promise<{ callLogId?: string } | void>;
}

const getPhone = (l: PickerLead) => (l.phone ?? l.phone_e164 ?? "").toString();
const getEmail = (l: PickerLead) => (l.email ?? l.email_lower ?? "").toString();

function formatTimer(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export default function LogCallDialog({
  open, onOpenChange, leads, userId, submitting, onSubmit,
}: Props) {
  // Form state
  const [leadId, setLeadId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [callType, setCallType] = useState("outbound");
  const [callStatus, setCallStatus] = useState("completed");
  const [durationSeconds, setDurationSeconds] = useState("0");
  const [notes, setNotes] = useState("");

  // Recorder state
  const [recState, setRecState] = useState<"idle" | "recording" | "stopped">("idle");
  const [seconds, setSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [coachTips, setCoachTips] = useState<string[]>([]);
  const [coachLoading, setCoachLoading] = useState(false);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const liveTextRef = useRef<string>("");

  const selectedLead = useMemo(
    () => leads.find((l) => l.id === leadId) || null,
    [leads, leadId],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return leads.slice(0, 25);
    return leads
      .filter((l) =>
        (l.full_name || "").toLowerCase().includes(q) ||
        getPhone(l).toLowerCase().includes(q) ||
        getEmail(l).toLowerCase().includes(q) ||
        (l.nationality || "").toLowerCase().includes(q) ||
        (l.source || "").toLowerCase().includes(q),
      )
      .slice(0, 25);
  }, [leads, search]);

  const reset = () => {
    setLeadId(null);
    setSearch("");
    setPhoneNumber("");
    setCallType("outbound");
    setCallStatus("completed");
    setDurationSeconds("0");
    setNotes("");
    setRecState("idle");
    setSeconds(0);
    setAudioBlob(null);
    setCoachTips([]);
    liveTextRef.current = "";
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    recRef.current = null;
    chunksRef.current = [];
  };

  useEffect(() => { if (!open) reset(); }, [open]);

  const handlePickLead = (l: PickerLead) => {
    setLeadId(l.id);
    if (!phoneNumber) setPhoneNumber(getPhone(l));
    setSearch("");
  };

  // Recorder
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const mr = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
          // every chunk → fire a live coach call with what we have so far (best-effort)
          maybeAskCoach();
        }
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mime });
        setAudioBlob(blob);
        setDurationSeconds(String(seconds));
      };
      mr.start(6000); // emit chunks every 6s for live-ish coach
      recRef.current = mr;
      setRecState("recording");
      setSeconds(0);
      timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000) as unknown as number;
      toast.success("Recording started — put your phone on speaker");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Microphone permission required");
    }
  };

  const stopRecording = () => {
    if (recRef.current && recRef.current.state !== "inactive") recRef.current.stop();
    if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    setRecState("stopped");
  };

  const maybeAskCoach = async () => {
    if (coachLoading) return;
    if (!leadId) return;
    if (chunksRef.current.length === 0) return;
    try {
      setCoachLoading(true);
      // Transcribe the latest small chunk to feed the coach
      const lastChunk = chunksRef.current[chunksRef.current.length - 1] as Blob;
      const b64 = await blobToBase64(lastChunk);
      const { data: tx } = await supabase.functions.invoke("video-transcribe", {
        body: { audio: b64, mimeType: lastChunk.type || "audio/webm", language: "en" },
      });
      const text = (tx?.text || tx?.segments?.map((s: any) => s.text).join(" ") || "").trim();
      if (text) liveTextRef.current = `${liveTextRef.current} ${text}`.trim();
      if (!liveTextRef.current) return;
      const { data, error } = await supabase.functions.invoke("broker-call-live-coach", {
        body: { leadId, transcript: liveTextRef.current.slice(-2500) },
      });
      if (error) return;
      const tips: string[] = Array.isArray(data?.tips) ? data.tips : [];
      if (tips.length) setCoachTips(tips.slice(0, 4));
    } catch (e) {
      // soft fail – live coach is best-effort
    } finally {
      setCoachLoading(false);
    }
  };

  const submit = async (e: any) => {
    e.preventDefault();
    const phone = phoneNumber.trim();
    if (!phone) { toast.error("Add a phone number before saving the call"); return; }
    if (recState === "recording") {
      stopRecording();
      await new Promise((r) => setTimeout(r, 200));
    }
    const result = await onSubmit({
      leadId: leadId || null,
      phoneNumber: phone,
      callType,
      callStatus,
      durationSeconds: Math.max(0, Number(durationSeconds) || 0),
      notes: notes.trim() || (selectedLead?.full_name ? `Call with ${selectedLead.full_name}` : null),
      audioBlob,
    });

    // If we got a callLogId AND have audio, upload + trigger transcription
    const callLogId = (result as any)?.callLogId as string | undefined;
    if (callLogId && audioBlob && userId) {
      try {
        const ext = (audioBlob.type.includes("ogg") ? "ogg" : "webm");
        const path = `${userId}/${callLogId}.${ext}`;
        const { error: upErr } = await supabase
          .storage
          .from("call-recordings")
          .upload(path, audioBlob, { contentType: audioBlob.type, upsert: true });
        if (upErr) throw upErr;
        await supabase
          .from("broker_call_logs")
          .update({ recording_url: path })
          .eq("id", callLogId);
        // Kick off transcription + AI evaluation (don't await — runs in background)
        supabase.functions.invoke("broker-call-process", {
          body: { callLogId, leadId: leadId || null },
        }).then(({ error }) => {
          if (error) console.warn("call process error", error);
          else toast.success("Call transcript & AI summary ready");
        });
        toast.success("Recording uploaded — AI is processing it");
      } catch (e: any) {
        console.error(e);
        toast.error("Saved log, but recording upload failed");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="max-w-2xl bg-[#FDFBF7] border-[#B89555]/30 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#1A1A1A] flex items-center gap-2">
            <Phone className="h-5 w-5 text-[#1A1A1A]" /> Log a call
          </DialogTitle>
          <DialogDescription className="text-[#1A1A1A]/70">
            Pick a lead, start recording from your laptop mic (put your phone on speaker),
            and the AI will transcribe and summarise the call into the lead's history.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4 py-2">
          {/* Lead picker */}
          <div className="space-y-1.5">
            <Label className="text-[#1A1A1A]">Lead</Label>
            {selectedLead ? (
              <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-[#EFE6D6]/60 border border-[#B89555]/40">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#1A1A1A] truncate">{selectedLead.full_name || "Unnamed lead"}</div>
                  <div className="text-[11px] text-[#1A1A1A]/65 truncate">
                    {getPhone(selectedLead) || getEmail(selectedLead) || "—"}
                    {selectedLead.nationality ? ` · ${selectedLead.nationality}` : ""}
                    {selectedLead.source ? ` · ${selectedLead.source}` : ""}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setLeadId(null); setPhoneNumber(""); }}
                  className="h-7 w-7 grid place-items-center rounded-md border border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#FDFBF7]"
                  aria-label="Change lead"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1A1A1A]/40" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, phone, email, nationality, source…"
                    className="pl-9 bg-[#F7F2EA] border-[#B89555]/35 text-[#1A1A1A]"
                  />
                </div>
                <div className="max-h-44 overflow-y-auto rounded-md border border-[#B89555]/25 bg-[#FDFBF7] divide-y divide-[#B89555]/15">
                  <button
                    type="button"
                    onClick={() => { setLeadId(null); setSearch(""); }}
                    className="w-full text-left px-3 py-2 text-sm text-[#1A1A1A] hover:bg-[#F7F2EA]"
                  >
                    <span className="font-semibold">Manual call</span>
                    <span className="text-[#1A1A1A]/60"> · no lead attached</span>
                  </button>
                  {filtered.length === 0 ? (
                    <div className="px-3 py-2.5 text-xs text-[#1A1A1A]/55">No leads match.</div>
                  ) : (
                    filtered.map((l) => (
                      <button
                        type="button"
                        key={l.id}
                        onClick={() => handlePickLead(l)}
                        className="w-full text-left px-3 py-2 hover:bg-[#F7F2EA]"
                      >
                        <div className="text-sm text-[#1A1A1A] truncate">{l.full_name || "Unnamed lead"}</div>
                        <div className="text-[11px] text-[#1A1A1A]/60 truncate">
                          {getPhone(l) || getEmail(l) || "—"}
                          {l.pipeline_stage ? ` · ${l.pipeline_stage}` : ""}
                          {l.source ? ` · ${l.source}` : ""}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {/* Recorder */}
          <div className="rounded-xl border border-[#B89555]/30 bg-[#F7F2EA]/60 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-[#1A1A1A]/70">
                Call recording
              </div>
              <div className="text-xs tabular-nums text-[#1A1A1A]/75">{formatTimer(seconds)}</div>
            </div>
            <div className="flex items-center gap-2">
              {recState !== "recording" ? (
                <Button
                  type="button"
                  onClick={startRecording}
                  className="bg-[#102540] text-white hover:bg-[#1a3d63]"
                  data-allow-dark-cta
                  data-no-contrast-guard
                >
                  <Mic className="h-4 w-4 mr-2 text-white" />
                  <span className="text-white">{recState === "stopped" ? "Re-record" : "Start recording"}</span>
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={stopRecording}
                  variant="outline"
                  className="border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6] hover:text-[#1A1A1A]"
                >
                  <Square className="h-4 w-4 mr-2 text-[#1A1A1A]" />
                  Stop recording
                </Button>
              )}
              {audioBlob && recState === "stopped" && (
                <span className="text-[11px] text-[#1A1A1A]/70">
                  Captured · {(audioBlob.size / 1024).toFixed(0)} KB · will be transcribed on save
                </span>
              )}
            </div>
            {(coachTips.length > 0 || coachLoading) && (
              <div className="mt-2 rounded-md bg-[#FDFBF7] border border-[#B89555]/30 p-2.5">
                <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#1A1A1A]/70 flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-[#1A1A1A]/70" />
                  Live coach
                  {coachLoading && <Loader2 className="h-3 w-3 animate-spin text-[#1A1A1A]/60" />}
                </div>
                <ul className="text-xs text-[#1A1A1A] mt-1 space-y-0.5">
                  {coachTips.map((t, i) => <li key={i}>• {t}</li>)}
                </ul>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[#1A1A1A]">Phone number</Label>
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+971 XX XXX XXXX"
                className="bg-[#F7F2EA] border-[#B89555]/35 text-[#1A1A1A]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[#1A1A1A]">Duration (seconds)</Label>
              <Input
                type="number"
                min="0"
                value={durationSeconds}
                onChange={(e) => setDurationSeconds(e.target.value)}
                className="bg-[#F7F2EA] border-[#B89555]/35 text-[#1A1A1A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[#1A1A1A]">Call type</Label>
              <Select value={callType} onValueChange={setCallType}>
                <SelectTrigger className="bg-[#F7F2EA] border-[#B89555]/35 text-[#1A1A1A]"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#FDFBF7] border-[#B89555]/35">
                  <SelectItem value="outbound">Outbound</SelectItem>
                  <SelectItem value="inbound">Inbound</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[#1A1A1A]">Outcome</Label>
              <Select value={callStatus} onValueChange={setCallStatus}>
                <SelectTrigger className="bg-[#F7F2EA] border-[#B89555]/35 text-[#1A1A1A]"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#FDFBF7] border-[#B89555]/35">
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="no_answer">No answer</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                  <SelectItem value="voicemail">Voicemail</SelectItem>
                  <SelectItem value="wrong_number">Wrong number</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[#1A1A1A]">Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Call summary, next step, objection, or follow-up note…"
              className="bg-[#F7F2EA] border-[#B89555]/35 text-[#1A1A1A] min-h-[90px]"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6] hover:text-[#1A1A1A]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-[#102540] text-white hover:bg-[#1a3d63]"
              data-allow-dark-cta
              data-no-contrast-guard
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin text-white" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2 text-white" />
              )}
              <span className="text-white">Save call log</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as any);
  }
  return btoa(bin);
}
