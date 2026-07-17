/**
 * Public briefing survey — recipients open this from the email link.
 * Uses submit-briefing-survey edge function (GET to load, POST to submit).
 */
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Star, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function BriefingSurvey() {
  const { token = "" } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("submit-briefing-survey", {
          method: "GET" as any,
        } as any);
        // functions.invoke does not support GET query params well — fall back to direct fetch
        void data; void error;
        const url = `${(supabase as any).functionsUrl || (import.meta.env.VITE_SUPABASE_URL + "/functions/v1")}/submit-briefing-survey?token=${encodeURIComponent(token)}`;
        const res = await fetch(url, {
          headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        });
        const j = await res.json();
        if (!j.ok) throw new Error(j.error || "Invalid link");
        setMeta(j);
      } catch (e: any) {
        setError(e?.message || "This survey link is not valid");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const submit = async () => {
    if (rating < 1) {
      toast.error("Please select a star rating");
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("submit-briefing-survey", {
        body: { token, rating, feedback },
      });
      if (error) throw error;
      if (!(data as any)?.ok) throw new Error((data as any)?.error || "Submit failed");
      setDone(true);
    } catch (e: any) {
      toast.error(e?.message || "Could not submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white border border-[#B89555]/40 rounded-xl p-8 shadow-[0_10px_40px_-12px_rgba(184,149,85,0.25)]">
        <div className="text-[11px] tracking-[0.22em] uppercase text-[#B89555] mb-3">JBJ Global — Briefing survey</div>
        {loading ? (
          <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#B89555]" /></div>
        ) : error ? (
          <div>
            <h1 className="text-2xl font-semibold text-[#064E3B] mb-2">Link unavailable</h1>
            <p className="text-[#1A1A1A]/70 text-sm">{error}</p>
          </div>
        ) : done ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-12 h-12 text-[#064E3B] mx-auto mb-3" />
            <h1 className="text-2xl font-semibold text-[#064E3B] mb-1">Thank you</h1>
            <p className="text-sm text-[#1A1A1A]/70">Your rating has been recorded.</p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-[#064E3B] mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Rate {meta?.rep_name || "the sales rep"}
            </h1>
            <p className="text-sm text-[#1A1A1A]/70 mb-5">
              {meta?.briefing?.developer_name} · {meta?.briefing?.project_name} · {meta?.briefing?.briefing_date}
            </p>
            <div className="flex items-center gap-2 mb-5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-label={`${n} stars`}
                  onClick={() => setRating(n)}
                  className="p-1"
                >
                  <Star className={`w-8 h-8 ${n <= rating ? "fill-[#B89555] text-[#B89555]" : "text-[#B89555]/30"}`} />
                </button>
              ))}
            </div>
            <label className="text-xs uppercase tracking-wider text-[#1A1A1A]/70 block mb-1">Feedback (optional)</label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              maxLength={2000}
              rows={4}
              className="w-full border border-[#B89555]/40 rounded-md p-3 text-sm bg-[#FDFBF7]"
              placeholder="What worked well? What could be improved?"
            />
            <button
              onClick={submit}
              disabled={submitting}
              className="mt-5 w-full bg-[#064E3B] text-white font-semibold py-3 rounded-md hover:bg-[#042C1C] disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Submit rating
            </button>
          </>
        )}
      </div>
    </div>
  );
}
