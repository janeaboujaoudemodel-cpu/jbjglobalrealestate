import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause, Sparkles, Volume2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  firstName: string;
  metrics: {
    totalLeads: number;
    activeDeals: number;
    meetingsToday: number;
    followUps: number;
    newAssignments: number;
  };
  /** Stable user id — used to scope today's cache so each user gets one fresh greeting per day. */
  userId?: string | null;
}

/** Build a warm, premium one-paragraph concierge brief from real numbers. */
function buildScript(firstName: string, m: Props["metrics"]): string {
  const parts: string[] = [];
  const hour = new Date().getHours();
  const salutation =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  parts.push(`${salutation}, ${firstName}.`);

  if (m.meetingsToday > 0) {
    parts.push(
      `You have ${m.meetingsToday} meeting${m.meetingsToday === 1 ? "" : "s"} on the calendar today.`,
    );
  }

  if (m.newAssignments > 0) {
    parts.push(
      `${m.newAssignments} fresh lead${m.newAssignments === 1 ? " was" : "s were"} assigned to you overnight.`,
    );
  }

  if (m.followUps > 0) {
    parts.push(
      `${m.followUps} client${m.followUps === 1 ? "" : "s"} ${m.followUps === 1 ? "is" : "are"} waiting on a follow-up — let's clear those first.`,
    );
  } else if (m.totalLeads > 0) {
    parts.push("Your follow-ups are clean — beautiful work.");
  }

  if (m.activeDeals > 0) {
    parts.push(
      `${m.activeDeals} active deal${m.activeDeals === 1 ? " is" : "s are"} moving in the pipeline.`,
    );
  }

  parts.push("Wishing you a remarkable day.");
  return parts.join(" ");
}

function cacheKey(userId: string | null | undefined) {
  const today = new Date().toISOString().slice(0, 10);
  return `jbj_concierge_greeting_${userId ?? "anon"}_${today}`;
}

export default function ConciergeGreeting({ firstName, metrics, userId }: Props) {
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const script = buildScript(firstName, metrics);

  // Restore cached audio for today
  useEffect(() => {
    try {
      const cached = localStorage.getItem(cacheKey(userId));
      if (cached) setAudioUrl(cached);
    } catch {
      /* ignore */
    }
  }, [userId]);

  const synthesize = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("sarah-voice", {
        body: { text: script },
      });
      if (error) throw error;
      // supabase-js returns Blob for binary responses
      const blob =
        data instanceof Blob
          ? data
          : new Blob([data as ArrayBuffer], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      try {
        // Cache the object URL for the rest of the session/day.
        // (Object URLs persist for the document lifetime; we re-create on reload.)
        localStorage.setItem(cacheKey(userId), url);
      } catch {
        /* quota — ignore */
      }
      return url;
    } catch (err: any) {
      console.error("Concierge greeting failed", err);
      toast.error("Concierge voice unavailable — try again in a moment.");
      return null;
    } finally {
      setLoading(false);
    }
  }, [script, userId]);

  const handlePlay = useCallback(async () => {
    let url = audioUrl;
    if (!url) {
      url = await synthesize();
      if (!url) return;
    }
    if (!audioRef.current) audioRef.current = new Audio();
    audioRef.current.src = url;
    audioRef.current.onended = () => setPlaying(false);
    audioRef.current.onpause = () => setPlaying(false);
    audioRef.current.onplay = () => setPlaying(true);
    try {
      await audioRef.current.play();
    } catch {
      /* user gesture missing */
    }
  }, [audioUrl, synthesize]);

  const handlePause = useCallback(() => {
    audioRef.current?.pause();
    setPlaying(false);
  }, []);

  return (
    <div
      data-no-contrast-guard
      className="relative overflow-hidden rounded-2xl border border-[#B89555]/45 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] p-4 md:p-5 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_10px_28px_-18px_rgba(10,10,10,0.25)]"
    >
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#B89555]/55 to-transparent" />
      <div className="flex items-start gap-3 md:gap-4">
        <button
          type="button"
          onClick={playing ? handlePause : handlePlay}
          disabled={loading}
          aria-label={playing ? "Pause concierge greeting" : "Play concierge greeting"}
          data-allow-dark-cta
          className="allow-white relative shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center border border-white/20 shadow-[0_10px_22px_-12px_rgba(6,78,59,0.85),inset_0_1px_0_rgba(255,255,255,0.18)] hover:-translate-y-0.5 hover:shadow-[0_18px_32px_-12px_rgba(6,78,59,0.95),0_0_18px_rgba(52,211,153,0.22)] transition-all disabled:opacity-60"
          style={{ backgroundImage: "var(--jj-emerald-ombre)" }}
        >
          {loading ? (
            <Sparkles
              className="h-5 w-5 animate-pulse"
              style={{ color: "#FFFFFF", stroke: "#FFFFFF" }}
            />
          ) : playing ? (
            <Pause className="h-5 w-5" style={{ color: "#FFFFFF", stroke: "#FFFFFF", fill: "#FFFFFF" }} />
          ) : (
            <Play className="h-5 w-5 ml-0.5" style={{ color: "#FFFFFF", stroke: "#FFFFFF", fill: "#FFFFFF" }} />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Volume2 className="h-3.5 w-3.5 text-[#B89555]" strokeWidth={2.2} />
            <span className="text-[10px] uppercase tracking-[0.22em] font-semibold text-[#1A1A1A]/70">
              Concierge brief · {new Date().toLocaleDateString("en-AE", { weekday: "long", month: "short", day: "numeric" })}
            </span>
          </div>
          <p className="font-display text-[15px] md:text-[16px] leading-snug text-[#1A1A1A]">
            {script}
          </p>
          <div className="mt-2 text-[11px] text-[#1A1A1A]/55">
            {audioUrl
              ? "Your daily voice brief is ready — tap play."
              : "Tap play to hear Amanda read your morning brief."}
          </div>
        </div>
      </div>
    </div>
  );
}
