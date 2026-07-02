import { useEffect, useRef, useState } from "react";
import {
  Wand2, X, Sparkles, TrendingUp, Handshake, Target, Users, CalendarDays,
  AlertTriangle, Lightbulb, Send, Mic, Paperclip, ChevronRight,
} from "lucide-react";

type Props = { open: boolean; onClose: () => void };

type ZiaTab = "insights" | "predictions" | "suggestions" | "ask";

type Suggestion = {
  id: string;
  icon: any;
  title: string;
  body: string;
  cta: string;
  tone: "lead" | "deal" | "risk" | "growth";
};

type Prediction = {
  id: string;
  title: string;
  meta: string;
  score: number;
  trend: "up" | "down" | "flat";
};

type ChatMsg = { id: string; who: "zia" | "you"; text: string };

const SUGGESTIONS: Suggestion[] = [
  { id: "s1", icon: Target, tone: "lead", title: "12 leads are cold — nudge today", body: "No touch in >14 days. Draft a re-engagement email to all 12 in one click.", cta: "Draft nudge email" },
  { id: "s2", icon: Handshake, tone: "deal", title: "Deal at risk: Marina Vista T2 · 4802", body: "No activity for 9 days; competitor discount announced yesterday.", cta: "Open playbook" },
  { id: "s3", icon: Users, tone: "growth", title: "Rania has capacity for 3 more leads", body: "Assignment engine suggests re-balancing from Omar this week.", cta: "Rebalance" },
  { id: "s4", icon: AlertTriangle, tone: "risk", title: "Missing next steps on 7 deals", body: "Pipeline hygiene: add a next step to keep Zia forecasts accurate.", cta: "Review deals" },
];

const PREDICTIONS: Prediction[] = [
  { id: "p1", title: "Bugatti Residences PH", meta: "Negotiation · AED 18.9M", score: 82, trend: "up" },
  { id: "p2", title: "Emaar Beachfront T3 · 2402", meta: "Proposal · AED 6.4M", score: 71, trend: "up" },
  { id: "p3", title: "Palm Jebel Ali Signature Villa", meta: "Qualification · AED 42M", score: 44, trend: "flat" },
  { id: "p4", title: "Vida Residences · Unit 1108", meta: "Discovery · AED 2.9M", score: 28, trend: "down" },
];

const INSIGHTS = [
  { label: "Pipeline this week", value: "AED 84.2M", delta: "+12.4%", up: true },
  { label: "Predicted Q1 close", value: "AED 51.6M", delta: "+7.1%", up: true },
  { label: "Avg. deal age", value: "23 days", delta: "-3 days", up: true },
  { label: "Response time", value: "1h 42m", delta: "+18m", up: false },
];

const QUICK_ASKS = [
  "Which deals are most likely to close this month?",
  "Draft a follow-up for cold leads in Dubai Marina",
  "Summarize activity for Bugatti Residences PH",
  "Who on my team is behind on tasks?",
];

export default function CrmZiaPanel({ open, onClose }: Props) {
  const [tab, setTab] = useState<ZiaTab>("insights");
  const [input, setInput] = useState("");
  const [chat, setChat] = useState<ChatMsg[]>([
    { id: "z0", who: "zia", text: "Hi — I'm Zia. Ask me about your pipeline, leads, or team performance." },
  ]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const send = (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg) return;
    setChat((c) => [
      ...c,
      { id: `u${Date.now()}`, who: "you", text: msg },
      { id: `z${Date.now() + 1}`, who: "zia", text: "Analyzing your CRM… I found 4 relevant records and 2 next-best-actions. Opening the summary in the main panel." },
    ]);
    setInput("");
    setTab("ask");
  };

  return (
    <>
      <div className="jc-zia__scrim" onClick={onClose} aria-hidden />
      <aside
        className="jc-zia"
        ref={ref}
        role="dialog"
        aria-label="Zia AI Assistant"
      >
        <header className="jc-zia__head">
          <div className="jc-zia__brand">
            <span className="jc-zia__mark"><Wand2 size={17} /></span>
            <div>
              <h3>Zia</h3>
              <p>AI Assistant · JBJ CRM</p>
            </div>
          </div>
          <button type="button" className="jc-zia__close" onClick={onClose} aria-label="Close Zia">
            <X size={18} />
          </button>
        </header>

        <nav className="jc-zia__tabs" role="tablist">
          {([
            ["insights", "Insights", Sparkles],
            ["predictions", "Predictions", TrendingUp],
            ["suggestions", "Suggestions", Lightbulb],
            ["ask", "Ask Zia", Wand2],
          ] as const).map(([id, label, Icon]) => (
            <button
              key={id}
              role="tab"
              type="button"
              aria-selected={tab === id}
              className="jc-zia__tab"
              data-active={tab === id}
              onClick={() => setTab(id as ZiaTab)}
            >
              <Icon size={14} /> <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="jc-zia__body">
          {tab === "insights" && (
            <div className="jc-zia__section">
              <h4 className="jc-zia__section-title">This week at a glance</h4>
              <div className="jc-zia__insights">
                {INSIGHTS.map((i) => (
                  <div className="jc-zia__insight" key={i.label}>
                    <span className="jc-zia__insight-label">{i.label}</span>
                    <span className="jc-zia__insight-value">{i.value}</span>
                    <span className="jc-zia__insight-delta" data-up={i.up}>{i.delta}</span>
                  </div>
                ))}
              </div>

              <h4 className="jc-zia__section-title">Highlights</h4>
              <ul className="jc-zia__highlights">
                <li><CalendarDays size={14} /> 6 meetings scheduled today · 2 conflicts</li>
                <li><Handshake size={14} /> 3 deals crossed AED 5M this week</li>
                <li><Target size={14} /> Meta Ads campaign delivered 27 new leads</li>
                <li><AlertTriangle size={14} /> 4 SLA breaches — Cases module</li>
              </ul>
            </div>
          )}

          {tab === "predictions" && (
            <div className="jc-zia__section">
              <h4 className="jc-zia__section-title">Deals — win probability</h4>
              <ul className="jc-zia__preds">
                {PREDICTIONS.map((p) => (
                  <li key={p.id}>
                    <div className="jc-zia__pred-head">
                      <span className="jc-zia__pred-title">{p.title}</span>
                      <span className="jc-zia__pred-score" data-band={p.score >= 70 ? "high" : p.score >= 45 ? "mid" : "low"}>{p.score}%</span>
                    </div>
                    <span className="jc-zia__pred-meta">{p.meta}</span>
                    <div className="jc-zia__pred-bar"><span style={{ width: `${p.score}%` }} data-band={p.score >= 70 ? "high" : p.score >= 45 ? "mid" : "low"} /></div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {tab === "suggestions" && (
            <div className="jc-zia__section">
              <h4 className="jc-zia__section-title">Next best actions</h4>
              <ul className="jc-zia__sugs">
                {SUGGESTIONS.map((s) => {
                  const Icon = s.icon;
                  return (
                    <li key={s.id} className={`jc-zia__sug jc-zia__sug--${s.tone}`}>
                      <span className="jc-zia__sug-icon"><Icon size={15} /></span>
                      <div className="jc-zia__sug-body">
                        <span className="jc-zia__sug-title">{s.title}</span>
                        <span className="jc-zia__sug-text">{s.body}</span>
                        <button type="button" className="jc-zia__sug-cta">{s.cta} <ChevronRight size={13} /></button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {tab === "ask" && (
            <div className="jc-zia__section jc-zia__section--chat">
              <div className="jc-zia__chat">
                {chat.map((m) => (
                  <div key={m.id} className={`jc-zia__msg jc-zia__msg--${m.who}`}>
                    {m.who === "zia" && <span className="jc-zia__msg-avatar"><Wand2 size={12} /></span>}
                    <span className="jc-zia__msg-bubble">{m.text}</span>
                  </div>
                ))}
              </div>
              <div className="jc-zia__quick">
                {QUICK_ASKS.map((q) => (
                  <button key={q} type="button" onClick={() => send(q)}>{q}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        <footer className="jc-zia__composer">
          <button type="button" aria-label="Attach"><Paperclip size={16} /></button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Zia anything about your CRM…"
            onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          />
          <button type="button" aria-label="Voice"><Mic size={16} /></button>
          <button type="button" className="jc-zia__send" aria-label="Send" onClick={() => send()}>
            <Send size={15} />
          </button>
        </footer>
      </aside>
    </>
  );
}
