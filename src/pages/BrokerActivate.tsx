import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { toast } from "sonner";
import { Loader2, ShieldCheck, AlertTriangle, CheckCircle2 } from "lucide-react";
import { anonHeaders, edgeFnUrl } from "@/config/backend";

type Step = "verifying-token" | "invalid" | "expired" | "otp_expired" | "already_activated" | "blocked" | "otp" | "password" | "done";

const PASSWORD_SYMBOL_RE = /[!@#$%^&*()_+\-=\[\]{};':"|<>?,.\/`~]/;

function cleanActivationError(message?: string): string {
  const text = String(message ?? "").trim();
  if (!text) return "We could not complete activation. Please try again.";
  if (/password should contain at least one character of each/i.test(text)) {
    return "Password must include uppercase, lowercase, number, and symbol characters.";
  }
  if (/edge function|non-2xx|supabase|json|internal|unexpected/i.test(text)) {
    return "We could not complete activation. Please check the details and try again.";
  }
  return text;
}

async function callBrokerFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(edgeFnUrl(name), {
    method: "POST",
    headers: anonHeaders(),
    body: JSON.stringify(body),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload?.error || `Request failed (${res.status})`);
  return payload as T;
}

export default function BrokerActivate() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("verifying-token");
  const [emailMasked, setEmailMasked] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [ticket, setTicket] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preflight: never 404. Validate token state up-front and route to the right step.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) {
        setStep("invalid");
        return;
      }
      try {
        const data = await callBrokerFunction<any>("crm-broker-invite-status", { token });
        if (cancelled) return;
        const status = data?.status ?? "invalid";
        setEmailMasked(data?.email_masked ?? null);
        if (status === "ok") setStep("otp");
        else if (status === "verified") { setTicket(token); setStep("password"); }
        else if (status === "expired") setStep("expired");
        else if (status === "otp_expired") setStep("otp_expired");
        else if (status === "already_activated") setStep("already_activated");
        else if (status === "blocked") setStep("blocked");
        else setStep("invalid");
      } catch {
        if (!cancelled) setStep("invalid");
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const pwOk = useMemo(
    () => password.length >= 10 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password) && PASSWORD_SYMBOL_RE.test(password),
    [password],
  );

  async function verifyOtp() {
    if (!token) { setError("Activation token is missing from this link."); return; }
    if (otp.length < 6) { setError("Enter the full 6-digit code from the invitation email."); return; }
    setBusy(true); setError(null);
    try {
      const data = await callBrokerFunction<any>("crm-broker-verify-otp", { token, otp: otp.trim() });
      if (!data?.ok) throw new Error(data?.error ?? "Verification failed");
      setTicket(data.ticket);
      setEmail(data.broker?.email ?? null);
      setStep("password");
    } catch (e: any) {
      setError(cleanActivationError(e.message));
    } finally {
      setBusy(false);
    }
  }

  async function setNewPassword() {
    if (!ticket) { setError("Please verify the invitation code first."); return; }
    if (!pwOk) { setError("Password must include 10+ characters, uppercase, lowercase, number, and symbol characters."); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setBusy(true); setError(null);
    try {
      const data = await callBrokerFunction<any>("crm-broker-activate", { ticket, password });
      if (!data?.ok) throw new Error(data?.error ?? "Activation failed");
      const loginEmail = email ?? data.email;
      if (loginEmail) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
        if (signInError) throw new Error(signInError.message);
        await supabase.auth.refreshSession();
      }
      setStep("done");
      toast.success("Account activated");
      setTimeout(() => navigate("/broker/crm", { replace: true }), 1100);
    } catch (e: any) {
      setError(cleanActivationError(e.message));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-[#B89555] rounded-2xl shadow-[0_8px_28px_rgba(26,26,26,0.06)] overflow-hidden">
        {/* Header */}
        <div className="bg-[#F7F2EA] border-b border-[#B89555]/45 px-8 py-7 text-center">
          <img src="/jbj-monogram-dark-on-light.png" alt="JBJ" className="h-20 w-20 mx-auto mb-4 object-contain"  loading="lazy" decoding="async" />
          <div className="text-[11px] tracking-[0.32em] uppercase text-[#1A1A1A]">JBJ Global Real Estate</div>
          <div className="h-px w-10 bg-[#B89555] mx-auto mt-3" />
        </div>

        <div className="p-8">
          <div className="text-center mb-6">
            <h1 className="text-xl font-semibold text-[#1A1A1A]">Activate broker access</h1>
            {emailMasked && (step === "otp" || step === "password") && (
              <p className="mt-1 text-[12px] text-[#1A1A1A]/60">for {emailMasked}</p>
            )}
            <p className="mt-2 text-sm text-[#1A1A1A]/70">
              {step === "verifying-token" && "Verifying your invitation…"}
              {step === "otp" && "Enter the 6-digit code from your invitation email."}
              {step === "password" && "Create a private password for your account."}
              {step === "done" && "Your account is active. Redirecting to your CRM…"}
              {step === "invalid" && "This invitation link is not valid."}
      {step === "expired" && "This invitation has expired."}
      {step === "otp_expired" && "This security code has expired."}
              {step === "already_activated" && "This account is already activated."}
              {step === "blocked" && "This account has been blocked."}
            </p>
          </div>

          {/* Step indicator */}
          {(step === "otp" || step === "password" || step === "done") && (
            <ol className="flex items-center justify-center gap-2 mb-6 text-[10px] uppercase tracking-[0.22em] text-[#1A1A1A]/60">
              <li className={step !== "otp" ? "text-[#1A1A1A]" : ""}>1 · Verify</li>
              <span className="text-[#B89555]">—</span>
              <li className={step === "password" || step === "done" ? "text-[#1A1A1A]" : ""}>2 · Password</li>
              <span className="text-[#B89555]">—</span>
              <li className={step === "done" ? "text-[#1A1A1A]" : ""}>3 · CRM</li>
            </ol>
          )}

          {error && (
            <div className="mb-4 px-3 py-2 text-sm text-[#1A1A1A] bg-[#F7F2EA] border border-[#B89555]/60 rounded-lg flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 text-[#1A1A1A]/70 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === "verifying-token" && (
            <div className="py-8 text-center text-sm text-[#1A1A1A]/60 flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Validating invitation…
            </div>
          )}

          {step === "otp" && (
            <div className="space-y-4">
              <Input
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="text-center tracking-[0.5em] text-lg font-semibold"
              />
              <Button onClick={verifyOtp} disabled={busy} className="w-full">
                {busy ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Verifying…</> : "Verify code"}
              </Button>
            </div>
          )}

          {step === "password" && (
            <div className="space-y-3">
              <PasswordInput placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" visibilityLabel="new password" />
              <PasswordInput placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" visibilityLabel="confirmed password" />
              <ul className="text-[11px] text-[#1A1A1A]/70 space-y-1 pl-2">
                <li>• 10+ characters</li>
                <li>• Upper &amp; lower case letters</li>
                <li>• At least one number</li>
                <li>• At least one symbol</li>
              </ul>
              <Button onClick={setNewPassword} disabled={busy} className="w-full">
                {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                {busy ? "Activating…" : "Set password & enter CRM"}
              </Button>
            </div>
          )}

          {step === "done" && (
            <div className="py-6 text-center">
              <CheckCircle2 className="h-10 w-10 mx-auto text-[#1A1A1A]" />
              <div className="mt-3 text-sm text-[#1A1A1A]/70">Redirecting to your broker CRM…</div>
              <Button onClick={() => navigate("/broker/crm", { replace: true })} className="mt-4 w-full">Enter CRM</Button>
            </div>
          )}

          {(step === "invalid" || step === "expired" || step === "otp_expired" || step === "already_activated" || step === "blocked") && (
            <div className="space-y-4">
              <div className="px-4 py-4 rounded-lg bg-[#F7F2EA] border border-[#B89555]/60 text-sm text-[#1A1A1A]/80">
                {step === "invalid" && "We could not find this invitation. The link may have been mistyped, already used, or revoked."}
                {step === "expired" && "Your invitation has expired. Please ask the JBJ owner to resend a fresh invitation."}
                {step === "otp_expired" && "Your 6-digit security code has expired. Please ask the JBJ owner to resend the broker invitation."}
                {step === "already_activated" && "This broker account is already active. Sign in to continue."}
                {step === "blocked" && "This broker account has been blocked. Please contact JBJ to restore access."}
              </div>
              {step === "already_activated" ? (
                <Button onClick={() => navigate("/auth?redirect=/broker/crm")} className="w-full">Go to sign in</Button>
              ) : (
                <Button onClick={() => navigate("/")} variant="outline" className="w-full">Return to homepage</Button>
              )}
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-[#B89555]/30 text-center text-[10px] uppercase tracking-[0.22em] text-[#1A1A1A]/50">
            JBJ Global Real Estate L.L.C S.O.C
          </div>
        </div>
      </div>
    </div>
  );
}
