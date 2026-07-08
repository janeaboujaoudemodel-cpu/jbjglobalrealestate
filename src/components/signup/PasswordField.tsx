import { useState, useMemo } from "react";
import { Eye, EyeOff, Copy, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (v: string) => void;
  id?: string;
}

/** Generate a strong 16-char password with mixed alphabet. */
function generatePassword(len = 16) {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%&*?";
  const all = upper + lower + digits + symbols;
  const pick = (s: string) => s[Math.floor(Math.random() * s.length)];
  const seed = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  const rest = Array.from({ length: len - seed.length }, () => pick(all));
  return [...seed, ...rest].sort(() => Math.random() - 0.5).join("");
}

function scorePassword(pw: string): { score: number; label: string } {
  if (!pw) return { score: 0, label: "" };
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const label = ["Too short", "Weak", "Fair", "Good", "Strong", "Excellent"][s];
  return { score: s, label };
}

export default function PasswordField({ value, onChange, id = "password" }: Props) {
  const [reveal, setReveal] = useState(false);
  const [copied, setCopied] = useState(false);
  const { score, label } = useMemo(() => scorePassword(value), [value]);

  const generate = () => {
    const pw = generatePassword(16);
    onChange(pw);
    setReveal(true);
    toast.success("Strong password generated — copy it or let Chrome save it on submit.");
  };

  const copy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Password copied to clipboard");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <div className="grid gap-2">
      <div className="relative">
        <input
          id={id}
          name="new-password"
          required
          minLength={8}
          autoComplete="new-password"
          type={reveal ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full h-11 rounded-md bg-white border border-[#B89555]/40",
            "px-3 pr-24 text-sm font-mono tracking-wider text-[#1A1A1A]",
            "focus:outline-none focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/20",
            "transition-colors"
          )}
          placeholder="Enter or generate a strong password"
        />
        <div className="absolute inset-y-0 right-1.5 flex items-center gap-0.5">
          <button
            type="button"
            onClick={copy}
            disabled={!value}
            aria-label="Copy password"
            className="h-8 w-8 grid place-items-center rounded-md text-[#1A1A1A]/60 hover:text-[#064E3B] hover:bg-[#064E3B]/10 disabled:opacity-30 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-[#064E3B]" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            aria-label={reveal ? "Hide password" : "Show password"}
            className="h-8 w-8 grid place-items-center rounded-md text-[#1A1A1A]/60 hover:text-[#064E3B] hover:bg-[#064E3B]/10 transition-colors"
          >
            {reveal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={generate}
          className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.14em] uppercase text-[#064E3B] hover:text-[#053929] font-medium transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Generate strong password
        </button>
        {value && (
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 w-5 rounded-full transition-colors",
                    i <= score
                      ? score >= 4
                        ? "bg-[#064E3B]"
                        : score >= 3
                        ? "bg-[#B89555]"
                        : "bg-[#B89555]/60"
                      : "bg-[#B89555]/15"
                  )}
                />
              ))}
            </div>
            <span className="text-[10px] tracking-[0.14em] uppercase text-[#1A1A1A]/60">{label}</span>
          </div>
        )}
      </div>

      {reveal && value && (
        <p className="text-[11px] text-[#0d3a2b] bg-[#F0F7F3] border border-[#064E3B]/30 font-medium rounded-md px-3 py-2">
          Your password is visible above — copy it now if you want to save it manually.
          Chrome will also offer to save your username and this password when you submit the form.
        </p>
      )}
    </div>
  );
}
