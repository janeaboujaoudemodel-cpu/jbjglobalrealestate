import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Field from "@/components/signup/Field";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export default function LoginDialog({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [reveal, setReveal] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.toLowerCase(), password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
    onOpenChange(false);
    navigate("/", { replace: true });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#FDFBF7] text-[#1A1A1A] border-[#B89555]/30 shadow-[0_20px_60px_-20px_rgba(6,78,59,0.35)]">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl text-[#0d3a2b]">Log in</DialogTitle>
          <DialogDescription className="text-[#1A1A1A]/70">
            Welcome back to JBJ Global Real Estate.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} autoComplete="on" className="grid gap-4 mt-2">
          <Field label="Email" required>
            <input
              id="login-email"
              name="username"
              type="email"
              required
              autoComplete="username email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 rounded-md bg-white border border-[#B89555]/40 px-3 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/15 transition-colors"
            />
          </Field>
          <Field label="Password" required>
            <div className="relative">
              <input
                id="login-password"
                name="current-password"
                type={reveal ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 rounded-md bg-white border border-[#B89555]/40 px-3 pr-10 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/15 transition-colors"
              />
              <button
                type="button"
                onClick={() => setReveal((r) => !r)}
                aria-label={reveal ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-1.5 my-auto h-8 w-8 grid place-items-center rounded-md text-[#1A1A1A]/60 hover:text-[#064E3B] hover:bg-[#064E3B]/8 transition-colors"
              >
                {reveal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </Field>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="w-full h-11 transition-all active:scale-[0.98] shadow-[0_10px_24px_-12px_rgba(6,78,59,0.55)]"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Signing in…</> : "Log in"}
          </Button>
          <a href="/auth?mode=forgot" className="text-xs text-[#0d3a2b] hover:text-[#053929] underline text-center transition-colors">Forgot password?</a>
        </form>
      </DialogContent>
    </Dialog>
  );
}
