import { useState } from "react";

/**
 * Anti-spam trap for lead-capture forms. Real users never see or reach this
 * field (off-canvas, unfocusable, unannounced); scripted form-fillers that
 * blindly populate every input will fill it, so a non-empty value on submit
 * means "reject/no-op silently" — see useHoneypot() below.
 *
 * Off-canvas positioning (not display:none/visibility:hidden) matches
 * src/components/security/AntiBot.tsx's existing convention: some bots skip
 * inputs hidden via display/visibility, so this stays laid out but pushed
 * off-screen. tabIndex={-1} + aria-hidden keep it out of the tab order and
 * off the accessibility tree for keyboard/screen-reader users.
 */
export function useHoneypot() {
  const [honeypot, setHoneypot] = useState("");
  return { honeypot, setHoneypot, isBot: honeypot.trim().length > 0 };
}

interface HoneypotFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** Unique per-form field name so autofill doesn't cross-pollinate forms. */
  name?: string;
}

export function HoneypotField({ value, onChange, name = "company_website" }: HoneypotFieldProps) {
  return (
    <div
      aria-hidden="true"
      style={{ position: "absolute", left: "-9999px", top: "-9999px", opacity: 0, pointerEvents: "none" }}
    >
      <input
        type="text"
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
      />
    </div>
  );
}
