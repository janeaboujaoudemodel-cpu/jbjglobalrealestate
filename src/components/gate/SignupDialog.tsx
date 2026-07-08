import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Loader2, Check } from "lucide-react";
import { SERVICES, USER_TYPES, LANGUAGES } from "./LeadFormDialog";
import { useNavigate } from "react-router-dom";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export default function SignupDialog({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "", email: "", password: "", phone: "", nationality: "",
    preferred_language: "English", user_type: "buyer", notes: "",
  });
  const [services, setServices] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggle = (s: string) =>
    setServices((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("signup-client", {
        body: { ...form, services, source_page: window.location.pathname },
      });
      if (error || (data && (data as any).error)) {
        throw new Error((data as any)?.error ?? error?.message ?? "Signup failed");
      }
      // Auto sign in
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: form.email.toLowerCase(),
        password: form.password,
      });
      if (signInErr) throw signInErr;
      toast.success("Welcome to JBJ Global");
      onOpenChange(false);
      navigate("/", { replace: true });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#FDFBF7] text-[#1A1A1A] border-[#B89555]/30">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl text-[#0d3a2b]">Create your JBJ account</DialogTitle>
          <DialogDescription className="text-[#1A1A1A]/70">
            Unlock the full platform — listings, off-plan intelligence, advisory & more.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full name" required>
              <Input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </Field>
            <Field label="Email" required>
              <Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Password" required>
              <Input required type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </Field>
            <Field label="Phone" required>
              <Input required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="Nationality">
              <Input value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} />
            </Field>
            <Field label="Preferred language">
              <select className="h-10 rounded-md border border-[#B89555]/30 bg-white px-3 text-sm"
                value={form.preferred_language} onChange={(e) => setForm({ ...form, preferred_language: e.target.value })}>
                {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
              </select>
            </Field>
            <Field label="I am a">
              <select className="h-10 rounded-md border border-[#B89555]/30 bg-white px-3 text-sm capitalize"
                value={form.user_type} onChange={(e) => setForm({ ...form, user_type: e.target.value })}>
                {USER_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Services you're interested in">
            <div className="flex flex-wrap gap-2">
              {SERVICES.map((s) => (
                <button type="button" key={s} onClick={() => toggle(s)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium border transition-all",
                    services.includes(s)
                      ? "bg-[#064E3B] text-white border-[#064E3B]"
                      : "bg-white text-[#1A1A1A] border-[#B89555]/40 hover:border-[#064E3B]",
                  )}>
                  {services.includes(s) && <Check className="inline w-3 h-3 mr-1" />}{s}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Notes">
            <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          <Button type="submit" variant="primary" disabled={loading} className="w-full">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating account…</> : "Create account"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-semibold text-[#1A1A1A]/80 tracking-wide uppercase">
        {label}{required && <span className="text-[#064E3B] ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}
