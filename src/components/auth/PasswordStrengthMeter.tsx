import { useEffect, useState } from "react";
import { AlertTriangle, ShieldCheck, ShieldAlert, Loader2, CheckCircle2, XCircle } from "lucide-react";

/**
 * PasswordStrengthMeter
 * ─────────────────────
 * Realtime password quality + Have-I-Been-Pwned k-anonymity leak check.
 * Only the first 5 chars of the SHA-1 hash leave the browser — the full
 * password is never sent anywhere.
 *
 * Emits `onValidityChange(isSafe)` so the parent form can block submission
 * while the password is either weak or found in a public breach list.
 */

interface Props {
  password: string;
  onValidityChange?: (safe: boolean) => void;
  className?: string;
}

type LeakState = "idle" | "checking" | "safe" | "leaked" | "error";

async function sha1Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-1", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

function scorePassword(pw: string) {
  const checks = {
    length: pw.length >= 12,
    lengthMin: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /\d/.test(pw),
    symbol: /[^A-Za-z0-9]/.test(pw),
  };
  const score =
    (checks.lengthMin ? 1 : 0) +
    (checks.length ? 1 : 0) +
    (checks.upper ? 1 : 0) +
    (checks.lower ? 1 : 0) +
    (checks.number ? 1 : 0) +
    (checks.symbol ? 1 : 0);
  return { score, checks };
}

export default function PasswordStrengthMeter({ password, onValidityChange, className }: Props) {
  const [leak, setLeak] = useState<LeakState>("idle");
  const [leakCount, setLeakCount] = useState(0);
  const { score, checks } = scorePassword(password);
  const strong = score >= 5 && checks.lengthMin;

  // Debounced HIBP k-anonymity check
  useEffect(() => {
    if (!password || password.length < 6) {
      setLeak("idle");
      setLeakCount(0);
      return;
    }
    setLeak("checking");
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const hash = await sha1Hex(password);
        const prefix = hash.slice(0, 5);
        const suffix = hash.slice(5);
        const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
          signal: controller.signal,
          headers: { "Add-Padding": "true" },
        });
        if (!res.ok) throw new Error("hibp unreachable");
        const text = await res.text();
        const line = text.split("\n").find((l) => l.startsWith(suffix));
        if (line) {
          const count = parseInt(line.split(":")[1] || "0", 10);
          if (count > 0) {
            setLeak("leaked");
            setLeakCount(count);
            return;
          }
        }
        setLeak("safe");
        setLeakCount(0);
      } catch {
        // Network / offline — fall back to strength-only check so signup
        // still works if the user is offline. Don't block.
        setLeak("error");
      }
    }, 350);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [password]);

  const safe = strong && leak !== "leaked";
  useEffect(() => {
    onValidityChange?.(password.length === 0 ? true : safe);
  }, [safe, password.length, onValidityChange]);

  if (!password) return null;

  const barColor =
    leak === "leaked"
      ? "bg-red-500"
      : score <= 2
        ? "bg-red-400"
        : score === 3 || score === 4
          ? "bg-amber-400"
          : "bg-emerald-500";
  const barWidth = leak === "leaked" ? "25%" : `${Math.min(100, (score / 6) * 100)}%`;

  return (
    <div className={`mt-2 space-y-2 ${className || ""}`}>
      <div className="h-1.5 w-full rounded-full bg-[#B89555]/20 overflow-hidden">
        <div className={`h-full transition-all duration-200 ${barColor}`} style={{ width: barWidth }} />
      </div>

      {leak === "checking" && (
        <p className="flex items-center gap-1.5 text-xs text-[#1A1A1A]/70">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking password against public breach lists…
        </p>
      )}

      {leak === "leaked" && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-[#7f1d1d]">
          <p className="flex items-start gap-1.5 font-semibold">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
            <span>
              This password appears in public breach lists ({leakCount.toLocaleString()} known exposures).
              To protect your account, please choose a new one.
            </span>
          </p>
          <ul className="mt-2 list-disc pl-8 space-y-0.5 text-[#7f1d1d]/85">
            <li>Use a unique password you have never used on any other site.</li>
            <li>Aim for 12+ characters and mix upper, lower, numbers and symbols.</li>
            <li>Consider a passphrase of 3–4 unrelated words, e.g. <code>Marina-Palm-Sunset-2029!</code></li>
            <li>Or use a password manager (1Password, Bitwarden, iCloud Keychain) to generate one.</li>
          </ul>
        </div>
      )}

      {leak === "safe" && strong && (
        <p className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
          <ShieldCheck className="w-3.5 h-3.5" /> Strong password — no matches in public breach lists.
        </p>
      )}

      {leak !== "leaked" && !strong && (
        <p className="flex items-center gap-1.5 text-xs text-[#1A1A1A]/75">
          <ShieldAlert className="w-3.5 h-3.5" /> Make it stronger for full protection.
        </p>
      )}

      {leak === "error" && (
        <p className="text-[11px] text-[#1A1A1A]/60">
          Couldn't reach the breach-check service; proceeding with strength check only.
        </p>
      )}

      <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-[#1A1A1A]/75">
        <Rule ok={checks.lengthMin} label="At least 8 characters" />
        <Rule ok={checks.length} label="12+ characters recommended" />
        <Rule ok={checks.upper} label="Uppercase letter" />
        <Rule ok={checks.lower} label="Lowercase letter" />
        <Rule ok={checks.number} label="Number" />
        <Rule ok={checks.symbol} label="Symbol" />
      </ul>
    </div>
  );
}

function Rule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-1.5">
      {ok ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
      ) : (
        <XCircle className="w-3.5 h-3.5 text-[#1A1A1A]/35 shrink-0" />
      )}
      <span className={ok ? "text-[#1A1A1A]" : ""}>{label}</span>
    </li>
  );
}
