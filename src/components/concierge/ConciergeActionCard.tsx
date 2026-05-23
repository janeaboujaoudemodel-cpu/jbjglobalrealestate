/**
 * ConciergeActionCard — gold-bordered step-by-step shortcut card with a CTA
 * that deep-links into the JBJ platform. Used by AIConcierge to render
 * structured `jbj-actions` blocks emitted by the model.
 */
import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";

export type ConciergeAction = {
  title?: string;
  steps: string[];
  cta: { label: string; href: string };
};

/** Extracts the first ```jbj-actions ... ``` block from a markdown string.
 * Returns { action, cleaned } where `cleaned` is the prose with the block removed. */
export function parseAction(markdown: string): { action: ConciergeAction | null; cleaned: string } {
  if (!markdown) return { action: null, cleaned: markdown };
  const fence = /```jbj-actions\s*([\s\S]*?)```/i;
  const m = markdown.match(fence);
  if (!m) return { action: null, cleaned: markdown };
  try {
    const parsed = JSON.parse(m[1].trim()) as ConciergeAction;
    if (!parsed?.cta?.href || !parsed?.cta?.label || !Array.isArray(parsed.steps)) {
      return { action: null, cleaned: markdown };
    }
    if (!parsed.cta.href.startsWith("/")) return { action: null, cleaned: markdown };
    return { action: parsed, cleaned: markdown.replace(fence, "").trim() };
  } catch {
    return { action: null, cleaned: markdown };
  }
}

export default function ConciergeActionCard({
  action,
  onNavigate,
}: {
  action: ConciergeAction;
  onNavigate?: () => void;
}) {
  return (
    <div
      data-no-contrast-guard
      className="mt-2 rounded-xl border border-[#D4B896]/55 bg-[#FDFBF7]/[0.08]
        backdrop-blur-sm overflow-hidden"
    >
      {action.title && (
        <div className="px-4 pt-3 text-[12px] uppercase tracking-[0.18em] font-semibold text-[#E2C9A0]">
          {action.title}
        </div>
      )}
      <ol className="px-4 py-3 space-y-2">
        {action.steps.map((step, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[13px] text-[#FDFBF7] leading-snug">
            <span
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full
                border border-[#E2C9A0]/70 text-[10.5px] font-semibold text-[#E2C9A0]"
            >
              {i + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <Link
        to={action.cta.href}
        onClick={onNavigate}
        data-no-contrast-guard
        className="group flex items-center justify-between gap-2 px-4 py-3
          border-t border-[#D4B896]/40 bg-[#E2C9A0]/[0.10] hover:bg-[#E2C9A0]/[0.18] transition-colors"
      >
        <span className="flex items-center gap-2 text-[13px] font-semibold text-[#FDFBF7]">
          <Check className="h-3.5 w-3.5 text-[#E2C9A0]" />
          {action.cta.label}
        </span>
        <ArrowRight className="h-4 w-4 text-[#E2C9A0] group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
}
