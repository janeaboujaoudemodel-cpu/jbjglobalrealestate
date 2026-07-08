import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export default function LoginDialog({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      <DialogContent className="max-w-md bg-[#FDFBF7] text-[#1A1A1A] border-[#B89555]/30">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl text-[#0d3a2b]">Log in</DialogTitle>
          <DialogDescription className="text-[#1A1A1A]/70">
            Welcome back to JBJ Global Real Estate.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4 mt-2">
          <div className="grid gap-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide">Email</Label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide">Password</Label>
            <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" variant="primary" disabled={loading} className="w-full">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Signing in…</> : "Log in"}
          </Button>
          <a href="/auth?mode=forgot" className="text-xs text-[#0d3a2b] underline text-center">Forgot password?</a>
        </form>
      </DialogContent>
    </Dialog>
  );
}
