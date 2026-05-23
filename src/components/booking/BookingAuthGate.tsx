/**
 * BookingAuthGate
 *
 * Renders a champagne-on-ink "Create your account to book with Jane" panel
 * for any visitor who is not yet authenticated. Once they sign up / sign in,
 * the parent receives the resolved `user` via AuthContext and shows the form.
 *
 * Rule: bookings are only accepted from registered accounts. A signup here
 * causes `crm_leads.account_status = 'registered'` server-side via
 * `submit-meeting-booking`.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Lock, ShieldCheck, Mail } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export function BookingAuthGate() {
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSignup() {
    if (!/^\S+@\S+\.\S+$/.test(email)) return toast.error("Enter a valid email.");
    if (password.length < 8) return toast.error("Password must be at least 8 characters.");
    setBusy(true);
    const { error } = await signUp(email.trim().toLowerCase(), password);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Account created. You can now book your meeting.");
  }

  async function handleSignin() {
    if (!/^\S+@\S+\.\S+$/.test(email)) return toast.error("Enter a valid email.");
    if (!password) return toast.error("Enter your password.");
    setBusy(true);
    const { error } = await signIn(email.trim().toLowerCase(), password);
    setBusy(false);
    if (error) return toast.error(error.message);
  }

  async function handleGoogle() {
    setBusy(true);
    const { error } = await signInWithGoogle();
    setBusy(false);
    if (error) toast.error(error.message);
  }

  async function handleReset() {
    if (!/^\S+@\S+\.\S+$/.test(email)) return toast.error("Enter your email above first.");
    const { error } = await resetPassword(email.trim().toLowerCase());
    if (error) return toast.error(error.message);
    toast.success("Password reset email sent.");
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-[#F7F2EA] border border-[#B89555]/30 rounded-2xl p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="w-4 h-4 text-[#B89555]" />
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#B89555]">Members only</p>
        </div>
        <h2 className="text-2xl font-semibold text-[#1A1A1A] mb-2">
          Create your account to book with Jane
        </h2>
        <p className="text-sm text-[#1A1A1A]/75 mb-6">
          To protect Jane's calendar and provide a secure, audited record of every meeting,
          bookings are reserved for registered clients. It takes 20 seconds.
        </p>

        <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-full">
          <TabsList className="bg-white border border-[#B89555]/20 w-full">
            <TabsTrigger value="signup" className="flex-1">Create account</TabsTrigger>
            <TabsTrigger value="signin" className="flex-1">I already have one</TabsTrigger>
          </TabsList>

          <TabsContent value="signup" className="mt-4 space-y-3">
            <div>
              <Label className="text-xs">Email *</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="bg-white border-[#B89555]/30" placeholder="you@company.com" />
            </div>
            <div>
              <Label className="text-xs">Choose a password *</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="bg-white border-[#B89555]/30" placeholder="At least 8 characters" />
            </div>
            <Button variant="gold" onClick={handleSignup} disabled={busy} className="w-full">
              {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
              Create my account & continue
            </Button>
          </TabsContent>

          <TabsContent value="signin" className="mt-4 space-y-3">
            <div>
              <Label className="text-xs">Email *</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="bg-white border-[#B89555]/30" />
            </div>
            <div>
              <Label className="text-xs">Password *</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="bg-white border-[#B89555]/30" />
            </div>
            <Button variant="gold" onClick={handleSignin} disabled={busy} className="w-full">
              {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
              Sign in & continue
            </Button>
            <button type="button" onClick={handleReset}
              className="text-xs text-[#1A1A1A]/70 underline underline-offset-4 decoration-[#B89555]/60 hover:text-[#1A1A1A]">
              Forgot password?
            </button>
          </TabsContent>
        </Tabs>

        <div className="my-5 flex items-center gap-3">
          <span className="flex-1 h-px bg-[#B89555]/25" />
          <span className="text-[10px] uppercase tracking-[0.22em] text-[#1A1A1A]/50">or</span>
          <span className="flex-1 h-px bg-[#B89555]/25" />
        </div>
        <Button variant="outline" onClick={handleGoogle} disabled={busy}
          className="w-full bg-white border-[#B89555]/30 hover:bg-[#FDFBF7]">
          Continue with Google
        </Button>

        <p className="text-[11px] text-[#1A1A1A]/55 mt-5 text-center">
          By continuing you agree to JBJ Global Real Estate's Terms & Privacy Policy.
          Your account is added to your private client record and never shared.
        </p>
      </div>
    </div>
  );
}
