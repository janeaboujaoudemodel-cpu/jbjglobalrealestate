import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

/**
 * Lightweight broker-facing request: the broker asks the JBJ owner to share
 * (or upload) a new database. Persisted into `broker_form_requests` with a
 * dedicated form_type so the existing owner inbox surfaces it without needing
 * a new table — the owner reviews and approves the access grant.
 */
export default function RequestDatabaseDialog({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!user?.id) { toast.error("Please sign in"); return; }
    if (!title.trim()) { toast.error("Add a database name or audience"); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("broker_form_requests" as any)
        .insert({
          broker_user_id: user.id,
          form_type: "Database Access Request",
          notes: [`Requested database: ${title.trim()}`, notes.trim()].filter(Boolean).join("\n\n"),
          status: "pending",
        } as any);
      if (error) throw error;
      toast.success("Request sent — JBJ will review and grant access.");
      setTitle(""); setNotes("");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Could not send request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-[#FDFBF7] border-[#B89555]/30">
        <DialogHeader>
          <DialogTitle className="text-[#1A1A1A]">Request a database</DialogTitle>
          <DialogDescription className="text-[#1A1A1A]/70">
            Brokers can't upload databases directly. Tell JBJ which audience or
            database you need access to and the owner will grant scoped access
            to your account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-[#1A1A1A]">Database name / audience</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Downtown Dubai investors — Q1 2026"
              className="bg-[#F7F2EA] border-[#B89555]/35 text-[#1A1A1A]"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[#1A1A1A]">Notes for JBJ</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Why you need it, time window, target stage, etc."
              className="bg-[#F7F2EA] border-[#B89555]/35 text-[#1A1A1A] min-h-[110px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={submit}
            disabled={submitting || !title.trim()}
            className="jj-surface-emerald allow-white text-white hover:-translate-y-0.5 hover:brightness-110"
            data-allow-dark-cta
          >
            {submitting ? "Sending…" : "Send request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
