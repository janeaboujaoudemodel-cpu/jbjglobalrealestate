import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Step = "otp" | "password" | "done";

export default function BrokerActivate() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("otp");
  const [otp, setOtp] = useState("");
  const [ticket, setTicket] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) setError("Missing invitation token.");
  }, [token]);

  const pwOk = useMemo(
    () => password.length >= 10 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password),
    [password],
  );

  async function verifyOtp() {
    if (!token || otp.length < 6) return;
    setBusy(true); setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("crm-broker-verify-otp", {
        body: { token, otp: otp.trim() },
      });
      if (error || !data?.ok) throw new Error(data?.error ?? error?.message ?? "Verification failed");
      setTicket(data.ticket);
      setEmail(data.broker?.email ?? null);
      setStep("password");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function setNewPassword() {
    if (!ticket || !pwOk) return;
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setBusy(true); setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("crm-broker-activate", {
        body: { ticket, password },
      });
      if (error || !data?.ok) throw new Error(data?.error ?? error?.message ?? "Activation failed");
      // sign in immediately
      if (email) {
        await supabase.auth.signInWithPassword({ email, password });
      }
      setStep("done");
      toast.success("Account activated");
      setTimeout(() => navigate("/broker/crm"), 1200);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-[#B89555] rounded-2xl p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="text-[11px] tracking-[0.32em] uppercase text-[#1A1A1A]/70">JBJ Global Real Estate</div>
          <h1 className="mt-3 text-xl font-semibold text-[#1A1A1A]">Activate broker access</h1>
          <p className="mt-2 text-sm text-[#1A1A1A]/70">
            {step === "otp" && "Enter the 6-digit code from your invitation email."}
            {step === "password" && "Create a private password for your account."}
            {step === "done" && "Your account is active. Redirecting to your CRM…"}
          </p>
        </div>

        <ol className="flex items-center justify-center gap-2 mb-6 text-[10px] uppercase tracking-[0.22em] text-[#1A1A1A]/60">
          <li className={step !== "otp" ? "text-[#1A1A1A]" : ""}>1 · Verify</li>
          <span className="text-[#B89555]">—</span>
          <li className={step === "password" || step === "done" ? "text-[#1A1A1A]" : ""}>2 · Password</li>
          <span className="text-[#B89555]">—</span>
          <li className={step === "done" ? "text-[#1A1A1A]" : ""}>3 · CRM</li>
        </ol>

        {error && (
          <div className="mb-4 px-3 py-2 text-sm text-[#1A1A1A] bg-[#F7F2EA] border border-[#B89555]/60 rounded-lg">
            {error}
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
            <Button onClick={verifyOtp} disabled={busy || otp.length < 6} className="w-full">
              {busy ? "Verifying…" : "Verify code"}
            </Button>
          </div>
        )}

        {step === "password" && (
          <div className="space-y-3">
            <Input type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Input type="password" placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            <ul className="text-[11px] text-[#1A1A1A]/70 space-y-1 pl-2">
              <li>• 10+ characters</li>
              <li>• Upper &amp; lower case letters</li>
              <li>• At least one number</li>
            </ul>
            <Button onClick={setNewPassword} disabled={busy || !pwOk || password !== confirm} className="w-full">
              {busy ? "Activating…" : "Set password & enter CRM"}
            </Button>
          </div>
        )}

        {step === "done" && (
          <div className="text-center text-sm text-[#1A1A1A]/70">Redirecting…</div>
        )}

        <div className="mt-6 pt-4 border-t border-[#B89555]/30 text-center text-[10px] uppercase tracking-[0.22em] text-[#1A1A1A]/50">
          JBJ Global Real Estate L.L.C S.O.C
        </div>
      </div>
    </div>
  );
}
