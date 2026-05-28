import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles, Phone, ExternalLink, Target } from "lucide-react";
import { formatDisplayDate } from "@/utils/formatDate";
import { Link } from "react-router-dom";

interface CallDetailSheetProps {
  callId: string | null;
  leadName?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatDuration = (s?: number | null) => {
  const x = Math.max(0, Number(s ?? 0));
  return `${Math.floor(x / 60)}m ${(x % 60).toString().padStart(2, "0")}s`;
};

export default function CallDetailSheet({ callId, leadName, open, onOpenChange }: CallDetailSheetProps) {
  const [log, setLog] = useState<any | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !callId) {
      setLog(null);
      setAudioUrl(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("broker_call_logs")
          .select("id, lead_id, phone_number, call_type, call_status, duration_seconds, notes, created_at, recording_url, transcript_text, ai_summary, ai_next_step, ai_score, ai_matches, ai_processed_at")
          .eq("id", callId)
          .maybeSingle();
        if (error) throw error;
        if (cancelled) return;
        setLog(data);

        if (data?.recording_url) {
          const { data: signed } = await supabase
            .storage
            .from("call-recordings")
            .createSignedUrl(data.recording_url, 60 * 30);
          if (!cancelled) setAudioUrl(signed?.signedUrl ?? null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, callId]);

  const matches: any[] = Array.isArray(log?.ai_matches) ? log.ai_matches : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-[#FDFBF7] border-l border-[#B89555]/30 w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-[#1A1A1A] flex items-center gap-2">
            <Phone className="h-4 w-4 text-[#1A1A1A]/70" />
            {leadName ? `Call with ${leadName}` : "Call detail"}
          </SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="py-12 grid place-items-center text-[#1A1A1A]/60">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : !log ? (
          <div className="py-12 text-center text-sm text-[#1A1A1A]/60">Call not found.</div>
        ) : (
          <div className="mt-5 space-y-5">
            {/* Meta */}
            <div className="rounded-xl border border-[#B89555]/25 bg-[#F7F2EA] p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#1A1A1A]/70">
                <Badge variant="outline" className="border-[#B89555]/40 text-[#1A1A1A]">
                  {log.call_status || "completed"}
                </Badge>
                <Badge variant="outline" className="border-[#B89555]/40 text-[#1A1A1A]">
                  {log.call_type || "outbound"}
                </Badge>
                <span>· {formatDuration(log.duration_seconds)}</span>
                <span>· {formatDisplayDate(log.created_at)}</span>
              </div>
              <div className="mt-2 text-sm text-[#1A1A1A] tabular-nums">{log.phone_number}</div>
              {log.notes && <div className="mt-2 text-sm text-[#1A1A1A]/80 whitespace-pre-wrap">{log.notes}</div>}
            </div>

            {/* Recording */}
            {audioUrl ? (
              <div className="rounded-xl border border-[#B89555]/25 bg-[#F7F2EA] p-4">
                <div className="text-xs uppercase tracking-[0.14em] text-[#1A1A1A]/60 mb-2">Recording</div>
                <audio controls src={audioUrl} className="w-full" />
              </div>
            ) : log.recording_url ? (
              <div className="rounded-xl border border-[#B89555]/25 bg-[#F7F2EA] p-4 text-sm text-[#1A1A1A]/70">
                Recording stored but signed URL unavailable.
              </div>
            ) : null}

            {/* AI Summary */}
            {log.ai_summary || log.ai_next_step || log.ai_score != null ? (
              <div className="rounded-xl border border-[#B89555]/25 bg-[#F7F2EA] p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#1A1A1A]/70" />
                  <div className="text-xs uppercase tracking-[0.14em] text-[#1A1A1A]/60">AI summary</div>
                  {log.ai_score != null && (
                    <Badge variant="outline" className="ml-auto border-[#B89555]/40 text-[#1A1A1A]">
                      Score {log.ai_score}
                    </Badge>
                  )}
                </div>
                {log.ai_summary && (
                  <p className="text-sm text-[#1A1A1A]/85 whitespace-pre-wrap leading-relaxed">{log.ai_summary}</p>
                )}
                {log.ai_next_step && (
                  <div className="rounded-md bg-[#EFE6D6] border border-[#B89555]/30 px-3 py-2 text-sm text-[#1A1A1A]">
                    <span className="font-medium">Next step:</span> {log.ai_next_step}
                  </div>
                )}
              </div>
            ) : log.recording_url ? (
              <div className="rounded-xl border border-[#B89555]/25 bg-[#F7F2EA] p-4 text-sm text-[#1A1A1A]/60">
                AI processing pending — refresh in a moment.
              </div>
            ) : null}

            {/* Matches */}
            {matches.length > 0 && (
              <div className="rounded-xl border border-[#B89555]/25 bg-[#F7F2EA] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-4 w-4 text-[#1A1A1A]/70" />
                  <div className="text-xs uppercase tracking-[0.14em] text-[#1A1A1A]/60">Recommended properties</div>
                </div>
                <ul className="space-y-2">
                  {matches.slice(0, 6).map((m: any, i: number) => (
                    <li key={i} className="flex items-start justify-between gap-3 text-sm text-[#1A1A1A]">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{m.name || m.title || m.project_name || "Property"}</div>
                        {m.reason && <div className="text-xs text-[#1A1A1A]/65">{m.reason}</div>}
                      </div>
                      {m.slug && (
                        <Link to={`/project/${m.slug}`} className="text-xs text-[#1A1A1A]/70 hover:text-[#1A1A1A] inline-flex items-center gap-1">
                          Open <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Transcript */}
            {log.transcript_text && (
              <div className="rounded-xl border border-[#B89555]/25 bg-[#F7F2EA] p-4">
                <div className="text-xs uppercase tracking-[0.14em] text-[#1A1A1A]/60 mb-2">Transcript</div>
                <p className="text-sm text-[#1A1A1A]/85 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                  {log.transcript_text}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              {log.lead_id && (
                <Link
                  to={`/broker/leads?id=${log.lead_id}`}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-[#B89555]/40 text-[#1A1A1A] text-xs hover:bg-[#EFE6D6]"
                >
                  Open lead <ExternalLink className="h-3 w-3" />
                </Link>
              )}
              <Button
                variant="outline"
                size="sm"
                className="border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
