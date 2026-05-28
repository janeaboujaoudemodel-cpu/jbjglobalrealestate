import { cn } from "@/lib/utils";

/**
 * JBJ form-field class helpers — every public lead-capture form
 * (Inquiry, Chat, Concierge, PreJoin, JoinApplication, CareersIntake,
 * etc.) routes its field className through these helpers so the
 * navy-vs-gold identity stays consistent in one place.
 *
 *   identityFieldClass()   → navy 2px border (name, email, phone, …)
 *   preferenceFieldClass() → gold  2px border (preferences, opt-ins, …)
 *
 * The underlying classes (`.jbj-blue-field`, `.jbj-gold-field`) live in
 * `src/styles/theme-tokens.css` and resolve their colours from the
 * `--brand-blue` / `--brand-gold` CSS variables, so a token swap
 * cascades to every form automatically.
 */

export function identityFieldClass(extra?: string): string {
  return cn("jbj-blue-field", extra);
}

export function preferenceFieldClass(extra?: string): string {
  return cn("jbj-gold-field", extra);
}

/** Convenience attribute spreader for an `<input data-field-tone="…" />`. */
export const fieldTone = {
  identity:   { "data-field-tone": "blue" } as const,
  preference: { "data-field-tone": "gold" } as const,
};
