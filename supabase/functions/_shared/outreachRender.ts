/**
 * Per-recipient template renderer for brokerage outreach.
 *
 * Replaces ONLY {{brokerage_name}} (whitespace-tolerant). Throws if any
 * other unresolved {{var}} token remains — guarantees no "Dear {{name}}"
 * ever escapes to a recipient.
 */

const PLACEHOLDER_RE = /\{\{\s*([a-zA-Z_][\w]*)\s*\}\}/g;

export interface RenderVars {
  brokerage_name: string;
}

export function renderOutreachTemplate(template: string, vars: RenderVars): string {
  if (!vars.brokerage_name || !vars.brokerage_name.trim()) {
    throw new Error("brokerage_name is required for personalization");
  }
  const safeName = vars.brokerage_name.trim();
  const replaced = template.replace(/\{\{\s*brokerage_name\s*\}\}/g, safeName);
  const remaining = [...replaced.matchAll(PLACEHOLDER_RE)].map((m) => m[1]);
  if (remaining.length > 0) {
    const unique = [...new Set(remaining)];
    throw new Error(
      `Unresolved template variables: ${unique.join(", ")} — only {{brokerage_name}} is allowed`,
    );
  }
  return replaced;
}

/** Validate at job-creation time. */
export function validateOutreachTemplate(template: string): { ok: boolean; error?: string } {
  if (!template || !template.trim()) return { ok: false, error: "Template is empty" };
  const all = [...template.matchAll(PLACEHOLDER_RE)].map((m) => m[1]);
  const bad = [...new Set(all.filter((v) => v !== "brokerage_name"))];
  if (bad.length > 0) {
    return { ok: false, error: `Unsupported variables: ${bad.join(", ")} — only {{brokerage_name}} is allowed` };
  }
  if (!/\{\{\s*brokerage_name\s*\}\}/.test(template)) {
    return { ok: false, error: "Template must include {{brokerage_name}} at least once" };
  }
  return { ok: true };
}
