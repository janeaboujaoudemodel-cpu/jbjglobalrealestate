import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Lock } from "lucide-react";

interface SubjectInputProps {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  locked?: boolean;
  id?: string;
  label?: string;
  helpText?: string;
}

/**
 * Mandatory editable Subject field for every outreach surface.
 * - Required, non-empty, ≤ 250 chars.
 * - Flags unresolved {{variables}}.
 * - Once `locked` is true, becomes read-only with a lock icon.
 *
 * Used by every send dialog/page so all surfaces enforce identical rules.
 */
export function SubjectInput({
  value,
  onChange,
  disabled = false,
  locked = false,
  id = "outreach-subject",
  label = "Subject",
  helpText,
}: SubjectInputProps) {
  const trimmed = value.trim();
  const tooLong = trimmed.length > 250;
  const empty = trimmed.length === 0;
  const unresolved = trimmed.match(/\{\{\s*[a-zA-Z_][\w]*\s*\}\}/g);

  const error = empty
    ? "Subject is required"
    : tooLong
    ? `Subject must be ≤ 250 characters (currently ${trimmed.length})`
    : unresolved
    ? `Unresolved placeholders: ${unresolved.join(", ")}`
    : null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-[13px] font-medium text-[#1A1A1A]">
          {label}
          <span className="ml-1 text-[#B89555]">*</span>
        </Label>
        <span className="text-[11px] text-[#1A1A1A]/60">{trimmed.length}/250</span>
      </div>
      <div className="relative">
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || locked}
          maxLength={250}
          required
          aria-invalid={!!error}
          className={`bg-white border-[#B89555]/30 text-[#1A1A1A] ${
            locked ? "pr-9" : ""
          } ${error ? "border-red-400" : ""}`}
          placeholder="Final subject the recipient will see"
        />
        {locked && (
          <Lock className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[#B89555]" />
        )}
      </div>
      {(error || helpText) && (
        <p
          className={`text-[12px] flex items-center gap-1 ${
            error ? "text-red-600" : "text-[#1A1A1A]/60"
          }`}
        >
          {error && <AlertCircle className="h-3 w-3" />}
          {error || helpText}
        </p>
      )}
    </div>
  );
}

/** True if the subject is valid for sending. */
export function isSubjectValid(s: string): boolean {
  const t = s.trim();
  if (!t || t.length > 250) return false;
  if (/\{\{\s*[a-zA-Z_][\w]*\s*\}\}/.test(t)) return false;
  return true;
}
