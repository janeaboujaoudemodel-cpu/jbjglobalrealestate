/**
 * AddBrokerInlineDialog — minimal "+ Add Broker" quick-create.
 * Inserts into crm_brokers and returns the created row via onCreated.
 */
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (broker: { id: string; full_name: string }) => void;
}

export function AddBrokerInlineDialog({ open, onClose, onCreated }: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    nationality: "",
    languages: "",
    current_company: "",
  });

  const reset = () => setForm({ full_name: "", email: "", phone: "", nationality: "", languages: "", current_company: "" });

  const handleSave = async () => {
    if (!form.full_name.trim()) {
      toast.error("Full name is required");
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const payload: any = {
        owner_user_id: user.id,
        full_name: form.full_name.trim(),
        email_lower: form.email.trim().toLowerCase() || null,
        phone_e164: form.phone.trim() || null,
        nationality: form.nationality.trim() || null,
        current_company: form.current_company.trim() || null,
        languages: form.languages
          ? form.languages.split(",").map(l => l.trim()).filter(Boolean)
          : null,
      };

      const { data, error } = await supabase
        .from("crm_brokers" as any)
        .insert(payload)
        .select("id, full_name")
        .single();

      if (error) throw error;
      toast.success(`Broker "${(data as any).full_name}" created`);
      onCreated?.(data as any);
      reset();
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Could not create broker");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#FDFBF7] border-[#B89555]/30 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#1A1A1A]">
            <UserPlus className="h-4 w-4 text-[#B89555]" />
            Add broker
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs text-[#1A1A1A]/70">Full name *</Label>
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="mt-1" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-[#1A1A1A]/70">Email</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-[#1A1A1A]/70">Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-[#1A1A1A]/70">Company / Brokerage</Label>
            <Input value={form.current_company} onChange={(e) => setForm({ ...form, current_company: e.target.value })} className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-[#1A1A1A]/70">Nationality</Label>
              <Input value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-[#1A1A1A]/70">Languages</Label>
              <Input
                value={form.languages}
                onChange={(e) => setForm({ ...form, languages: e.target.value })}
                placeholder="English, Arabic"
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-[#1A1A1A] text-[#FDFBF7] hover:bg-[#1A1A1A]/90">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Create broker
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddBrokerInlineDialog;
