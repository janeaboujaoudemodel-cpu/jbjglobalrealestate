/**
 * EmailRecipientChips — chip-style multi-email input used by both
 * "To" and "CC" rows in the e-signature send dialog. Accepts comma,
 * semicolon, space, Enter, Tab as separators. Pasted lists are split
 * automatically. Invalid emails are rejected with a toast.
 */
import { useState, KeyboardEvent, ClipboardEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { toast } from "sonner";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isValidEmail = (e: string) => EMAIL_RE.test(e.trim());

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  ariaLabel?: string;
}

export function EmailRecipientChips({ value, onChange, placeholder, ariaLabel }: Props) {
  const [draft, setDraft] = useState("");

  const commit = (raw: string) => {
    const parts = raw
      .split(/[,;\s]+/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (!parts.length) return;
    const valid: string[] = [];
    const invalid: string[] = [];
    for (const p of parts) (isValidEmail(p) ? valid : invalid).push(p);
    if (invalid.length) toast.error(`Invalid email${invalid.length > 1 ? "s" : ""}: ${invalid.join(", ")}`);
    if (valid.length) {
      const merged = Array.from(new Set([...value, ...valid]));
      onChange(merged);
    }
    setDraft("");
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Tab" || e.key === "," || e.key === ";") {
      if (draft.trim()) {
        e.preventDefault();
        commit(draft);
      }
    } else if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    if (/[,;\s]/.test(text)) {
      e.preventDefault();
      commit(text);
    }
  };

  return (
    <div
      className="flex flex-wrap items-center gap-1.5 min-h-[40px] w-full rounded-md border border-[#B89555]/40 bg-white px-2 py-1.5"
      onClick={(e) => {
        const input = (e.currentTarget as HTMLDivElement).querySelector("input");
        input?.focus();
      }}
    >
      {value.map((email) => (
        <Badge
          key={email}
          variant="secondary"
          className="gap-1 bg-[#F7F2EA] border border-[#B89555]/40 text-[#1A1A1A] font-normal"
        >
          <span className="break-all">{email}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(value.filter((v) => v !== email));
            }}
            className="ml-0.5 hover:opacity-70"
            aria-label={`Remove ${email}`}
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      ))}
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKey}
        onPaste={handlePaste}
        onBlur={() => draft.trim() && commit(draft)}
        placeholder={value.length === 0 ? placeholder : ""}
        aria-label={ariaLabel}
        className="flex-1 min-w-[140px] h-7 border-0 shadow-none px-1 text-sm focus-visible:ring-0 bg-transparent"
      />
    </div>
  );
}
