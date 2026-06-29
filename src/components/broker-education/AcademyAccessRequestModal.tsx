import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserModeContext } from "@/contexts/UserModeContext";
import { toast } from "sonner";
import { Loader2, GraduationCap } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  item: { id: string; title: string; type: "module" | "book" } | null;
}

export default function AcademyAccessRequestModal({ open, onOpenChange, item }: Props) {
  const { user } = useAuth();
  const { mode } = useUserModeContext();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && user) {
      setEmail(user.email ?? "");
      setFullName((user.user_metadata as any)?.full_name ?? "");
    }
  }, [open, user]);

  const submit = async () => {
    if (!fullName.trim() || !email.trim()) {
      toast.error("Please enter your name and email");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("academy_access_requests" as any).insert({
      user_id: user?.id ?? null,
      full_name: fullName.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
      note: note.trim() || null,
      requested_item_type: item?.type ?? null,
      requested_item_id: item?.id ?? null,
      requested_item_title: item?.title ?? null,
      user_mode: mode,
      status: "pending",
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Request sent", {
      description: "We'll review your application and email you once it's approved.",
    });
    setNote("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#FDFBF7] border-[#B89555]/40">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[#B89555]" />
            <DialogTitle className="text-[#1A1A1A]">Request Academy Access</DialogTitle>
          </div>
          <DialogDescription className="text-[#1A1A1A]/70">
            {item ? <>For <span className="font-medium text-[#1A1A1A]">{item.title}</span>. </> : null}
            Tell us a bit about you. Once approved, you'll receive an email with login access.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <div>
            <Label htmlFor="aa-name" className="text-[#1A1A1A]">Full name</Label>
            <Input id="aa-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
          </div>
          <div>
            <Label htmlFor="aa-email" className="text-[#1A1A1A]">Email</Label>
            <Input id="aa-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <Label htmlFor="aa-phone" className="text-[#1A1A1A]">Phone (optional)</Label>
            <Input id="aa-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+971 ..." />
          </div>
          <div>
            <Label htmlFor="aa-note" className="text-[#1A1A1A]">Note</Label>
            <Textarea
              id="aa-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Brokerage, RERA number, or why you need access…"
              rows={4}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="jj-cta-outline" data-cta="aa-cancel">
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={submitting}
            className="jj-pill-emerald-metallic disabled:opacity-100"
            data-cta="aa-submit"
            data-surface="emerald"
            style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 mr-1.5 animate-spin text-white" strokeWidth={2.6} /> <span className="text-white">Sending…</span></>
            ) : (
              <><GraduationCap className="w-4 h-4 mr-1.5 text-white" strokeWidth={2.6} /> <span className="text-white">Send Request</span></>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
