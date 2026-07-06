export type PaymentPlanStage = {
  label: string;
  value: string;
  detail?: string;
  tone: "booking" | "construction" | "handover" | "post" | "general";
};

export type PaymentPlanPresentation = {
  headline: string;
  badge: string;
  summary: string;
  stages: PaymentPlanStage[];
  note: string;
  raw: string;
};

const pct = (value: number) => `${Math.max(0, Math.min(100, Math.round(value)))}%`;

const firstPercentNear = (raw: string, pattern: RegExp) => {
  const source = raw.toLowerCase();
  const matches = Array.from(source.matchAll(/(\d{1,3})\s*%/g));
  for (const match of matches) {
    const index = match.index ?? 0;
    const window = source.slice(Math.max(0, index - 34), Math.min(source.length, index + 58));
    if (pattern.test(window)) return Number(match[1]);
  }
  return null;
};

const monthsFrom = (raw: string) => {
  const m = raw.match(/(\d{1,3})\s*(?:months?|installments?|instalments?)/i);
  return m ? Number(m[1]) : null;
};

const yearsFrom = (raw: string) => {
  const m = raw.match(/(\d{1,2})\s*years?/i);
  return m ? Number(m[1]) : null;
};

export function formatPaymentPlanForDisplay(rawPlan?: string | null, handoverDate?: string | null): PaymentPlanPresentation | null {
  const raw = (rawPlan || "").replace(/\s+/g, " ").trim();
  if (!raw) return null;

  const ratio = raw.match(/\b(\d{1,3})\s*[\/\-]\s*(\d{1,3})\b/);
  const ratioA = ratio ? Number(ratio[1]) : null;
  const ratioB = ratio ? Number(ratio[2]) : null;
  const hasPost = /post[-\s]?handover|after\s+handover|post handover/i.test(raw);
  const down = firstPercentNear(raw, /down|booking|reservation|on\s+book/);
  const construction = firstPercentNear(raw, /construction|during|instal|install(?!.*post)|monthly/);
  const handover = firstPercentNear(raw, /handover|completion/) && !hasPost ? firstPercentNear(raw, /handover|completion/) : null;
  const post = firstPercentNear(raw, /post|after\s+handover/);
  const months = monthsFrom(raw);
  const years = yearsFrom(raw);
  const afterMonth = raw.match(/(\d{1,3})\s*%[^.]{0,28}after\s+(\d{1,2})\s*months?/i);

  const stages: PaymentPlanStage[] = [];
  if (down !== null) stages.push({ label: "Down payment", value: pct(down), detail: "Initial booking commitment", tone: "booking" });
  if (afterMonth) stages.push({ label: "Early installment", value: pct(Number(afterMonth[1])), detail: `Due after ${afterMonth[2]} month${afterMonth[2] === "1" ? "" : "s"}`, tone: "booking" });

  if (ratioA !== null && ratioB !== null && hasPost) {
    const knownPre = stages.reduce((sum, s) => sum + Number(s.value.replace("%", "")), 0);
    const constructionBalance = Math.max(0, ratioA - knownPre);
    if (constructionBalance > 0) {
      stages.push({ label: "Before handover", value: pct(constructionBalance), detail: "Structured across the construction period", tone: "construction" });
    }
    stages.push({
      label: "Post-handover balance",
      value: pct(post ?? ratioB),
      detail: months ? `Payable over ${months} monthly installments` : years ? `Payable over ${years} years` : "Extended after handover",
      tone: "post",
    });
  } else {
    if (construction !== null && !stages.some((s) => s.value === pct(construction))) {
      stages.push({ label: "During construction", value: pct(construction), detail: "Scheduled construction-linked payments", tone: "construction" });
    }
    if (handover !== null) stages.push({ label: "On handover", value: pct(handover), detail: handoverDate ? `Due around ${handoverDate}` : "Due on completion", tone: "handover" });
    if (post !== null) stages.push({ label: "Post-handover", value: pct(post), detail: months ? `Spread over ${months} months` : years ? `Spread over ${years} years` : "Extended after handover", tone: "post" });
  }

  if (stages.length === 0 && ratioA !== null && ratioB !== null) {
    stages.push({ label: "First milestone", value: pct(ratioA), detail: "Developer-provided split", tone: "construction" });
    stages.push({ label: "Final milestone", value: pct(ratioB), detail: "Developer-provided split", tone: "handover" });
  }

  const badge = ratio ? `${ratio[1]}/${ratio[2]}` : stages[0]?.value || "%";
  const headline = ratio && hasPost
    ? `${ratio[1]}/${ratio[2]} post-handover payment structure`
    : ratio
      ? `${ratio[1]}/${ratio[2]} payment structure`
      : stages.length
        ? "Flexible payment structure"
        : "Payment plan available";
  const postStage = stages.find((s) => s.tone === "post");
  const summary = postStage
    ? `${postStage.value} balance ${postStage.detail?.toLowerCase() || "after handover"}.`
    : stages.length
      ? `${stages.map((s) => `${s.value} ${s.label.toLowerCase()}`).join(" · ")}.`
      : "Developer payment notes are available for review.";

  return {
    headline,
    badge,
    summary,
    stages,
    note: "Presented from the uploaded developer notes. Confirm the official milestone schedule with our team before signing.",
    raw,
  };
}