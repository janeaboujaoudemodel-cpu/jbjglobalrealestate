import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { BROKER_FORM_TYPES, useCreateBrokerFormRequest } from "@/hooks/useBrokerFormRequests";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function NewFormRequestDialog({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const [formType, setFormType] = useState<string>("");
  const [leadId, setLeadId] = useState<string>("none");
  const [notes, setNotes] = useState("");
  const create = useCreateBrokerFormRequest();

  // Only leads explicitly assigned to this broker
  const { data: leads = [] } = useQuery({
    queryKey: ["broker-assigned-leads-min", user?.id],
    enabled: !!user?.id && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_leads")
        .select("id, full_name")
        .eq("assigned_broker_id", user!.id)
        .order("updated_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
  });

  const submit = async () => {
    if (!formType) { toast.error("Pick a form type"); return; }
    try {
      await create.mutateAsync({
        form_type: formType,
        lead_id: leadId === "none" ? null : leadId,
        notes: notes.trim() || null,
      });
      toast.success("Request sent to JBJ");
      setFormType(""); setLeadId("none"); setNotes("");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Could not send request");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-[#FDFBF7] border-[#B89555]/30">
        <DialogHeader>
          <DialogTitle className="text-[#1A1A1A]">Request a form from JBJ</DialogTitle>
          <DialogDescription className="text-[#1A1A1A]/70">
            Pick the form you need. The JBJ owner reviews every request and sends the prepared document back to you.
            You won't draft JBJ paperwork yourself.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-[#1A1A1A]">Form type</Label>
            <Select value={formType} onValueChange={setFormType}>
              <SelectTrigger className="bg-[#F7F2EA] border-[#B89555]/35 text-[#1A1A1A]">
                <SelectValue placeholder="Select a form…" />
              </SelectTrigger>
              <SelectContent>
                {BROKER_FORM_TYPES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[#1A1A1A]">Related lead (optional)</Label>
            <Select value={leadId} onValueChange={setLeadId}>
              <SelectTrigger className="bg-[#F7F2EA] border-[#B89555]/35 text-[#1A1A1A]">
                <SelectValue placeholder="No specific lead" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific lead</SelectItem>
                {leads.map((l: any) => (
                  <SelectItem key={l.id} value={l.id}>{l.full_name || l.id.slice(0, 8)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[#1A1A1A]">Notes for JBJ</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Who is it for, any specific clauses, deadline…"
              className="bg-[#F7F2EA] border-[#B89555]/35 text-[#1A1A1A] min-h-[110px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={submit}
            disabled={create.isPending || !formType}
            className="bg-[#102540] text-white hover:bg-[#1a3d63]"
            data-allow-dark-cta
          >
            {create.isPending ? "Sending…" : "Send request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
