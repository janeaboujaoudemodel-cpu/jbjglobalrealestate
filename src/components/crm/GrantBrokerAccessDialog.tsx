import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sourceDatabaseId: string;
  sourceDatabaseName: string;
  onGranted?: () => void;
}

export default function GrantBrokerAccessDialog({
  open, onOpenChange, sourceDatabaseId, sourceDatabaseName, onGranted,
}: Props) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [scope, setScope] = useState<"internal" | "external">("external");
  const [perm, setPerm] = useState<"view" | "edit">("view");
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.trim()) { toast.error("Broker email required"); return; }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("crm-grant-broker-access", {
        body: {
          source_database_id: sourceDatabaseId,
          broker_email: email.trim(),
          broker_display_name: displayName.trim() || undefined,
          permission_level: perm,
          broker_scope: scope,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
          notes: notes.trim() || null,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success(
        (data as any)?.broker_created
          ? "Broker account created and access granted"
          : "Access granted to existing broker",
      );
      onGranted?.();
      onOpenChange(false);
      setEmail(""); setDisplayName(""); setNotes(""); setExpiresAt("");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not grant access");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#1A1A1A]">
            <ShieldCheck className="h-4 w-4 text-[#B89555]" /> Give Broker Access
          </DialogTitle>
          <p className="text-xs text-[#1A1A1A]/60 mt-1 truncate">{sourceDatabaseName}</p>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs text-[#1A1A1A]/80">Broker email</Label>
            <Input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="broker@example.com"
              className="bg-white border-[#B89555]/30 text-[#1A1A1A]"
            />
          </div>
          <div>
            <Label className="text-xs text-[#1A1A1A]/80">Display name (optional)</Label>
            <Input
              value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              placeholder="John Smith"
              className="bg-white border-[#B89555]/30 text-[#1A1A1A]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-[#1A1A1A]/80">Scope</Label>
              <select value={scope} onChange={(e) => setScope(e.target.value as any)}
                className="h-9 w-full rounded-md border border-[#B89555]/30 bg-white text-sm px-2">
                <option value="external">External (Partner)</option>
                <option value="internal">Internal (JBJ)</option>
              </select>
            </div>
            <div>
              <Label className="text-xs text-[#1A1A1A]/80">Permission</Label>
              <select value={perm} onChange={(e) => setPerm(e.target.value as any)}
                className="h-9 w-full rounded-md border border-[#B89555]/30 bg-white text-sm px-2">
                <option value="view">View only</option>
                <option value="edit">Edit</option>
              </select>
            </div>
          </div>
          <div>
            <Label className="text-xs text-[#1A1A1A]/80">Expires (optional)</Label>
            <Input
              type="datetime-local" value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="bg-white border-[#B89555]/30 text-[#1A1A1A]"
            />
          </div>
          <div>
            <Label className="text-xs text-[#1A1A1A]/80">Notes (optional)</Label>
            <Textarea
              value={notes} onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="bg-white border-[#B89555]/30 text-[#1A1A1A]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}
            className="border-[#B89555]/40 text-[#1A1A1A]">Cancel</Button>
          <Button onClick={submit} disabled={busy}
            className="bg-[#EFE6D6] hover:bg-[#E7DCC7] text-[#1A1A1A] border border-[#B89555]">
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
            Grant access
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
