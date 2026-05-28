import { TrendingUp, Target, ArrowRight, Sparkles } from "lucide-react";

export interface Match {
  project_id: string;
  name: string;
  developer: string;
  area?: string;
  beds?: string;
  price_from?: number | null;
  currency?: string;
  match_score: number;
  reason: string;
}

interface Props {
  score?: number;
  scoreReason?: string;
  matches?: Match[];
  nextStep?: string;
  onUseMatch?: (m: Match) => void;
}

function scoreColor(s: number) {
  if (s >= 80) return "text-emerald-600 border-emerald-500";
  if (s >= 60) return "text-amber-600 border-amber-500";
  if (s >= 40) return "text-blue-600 border-blue-500";
  return "text-[#1A1A1A]/60 border-[#1A1A1A]/30";
}

export default function AssistantInsights({ score, scoreReason, matches, nextStep, onUseMatch }: Props) {
  return (
    <aside className="w-full lg:w-80 shrink-0 space-y-4">
      <div className="rounded-2xl border border-[#B89555]/40 bg-[#FDFBF7] p-5">
        <div className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/60 font-semibold flex items-center gap-1.5">
          <Sparkles className="h-3 w-3" /> Lead readiness
        </div>
        <div className="mt-3 flex items-center gap-4">
          <div className={`h-20 w-20 rounded-md border-[6px] grid place-items-center font-bold text-xl tabular-nums ${score != null ? scoreColor(score) : "border-[#1A1A1A]/15 text-[#1A1A1A]/30"}`}>
            {score != null ? `${score}%` : "—"}
          </div>
          <p className="text-sm text-[#1A1A1A]/80 leading-snug flex-1">
            {scoreReason || "Ask the assistant to score this lead."}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-[#B89555]/40 bg-[#FDFBF7] p-5">
        <div className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/60 font-semibold flex items-center gap-1.5 mb-3">
          <Target className="h-3 w-3" /> Top property matches
        </div>
        {!matches || matches.length === 0 ? (
          <p className="text-xs text-[#1A1A1A]/50">Ask "recommend properties" to see best-fit listings.</p>
        ) : (
          <div className="space-y-2.5">
            {matches.slice(0, 3).map((m) => (
              <div key={m.project_id} className="rounded-lg border border-[#B89555]/30 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[#1A1A1A] truncate">{m.name}</div>
                    <div className="text-[11px] text-[#1A1A1A]/60 truncate">
                      by {m.developer}{m.area ? ` · ${m.area}` : ""}{m.beds ? ` · ${m.beds} BR` : ""}
                    </div>
                    {m.price_from ? (
                      <div className="text-[11px] text-[#1A1A1A]/70 mt-0.5">
                        From {m.currency || "AED"} {m.price_from.toLocaleString()}
                      </div>
                    ) : null}
                  </div>
                  <span className={`shrink-0 text-[11px] font-bold px-2 py-1 rounded-md border ${scoreColor(m.match_score)} bg-transparent`}>
                    {m.match_score}%
                  </span>
                </div>
                <div className="text-[11px] text-[#1A1A1A]/70 mt-1.5">{m.reason}</div>
                {onUseMatch && (
                  <button
                    type="button"
                    onClick={() => onUseMatch(m)}
                    className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#102540] hover:underline"
                  >
                    Draft message about this <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-[#B89555]/40 bg-[#FDFBF7] p-5">
        <div className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/60 font-semibold flex items-center gap-1.5 mb-2">
          <TrendingUp className="h-3 w-3" /> Suggested next step
        </div>
        <p className="text-sm text-[#1A1A1A]/85 leading-snug">
          {nextStep || "Ask the assistant for the best next step."}
        </p>
      </div>
    </aside>
  );
}
