import { useState } from "react";
import { Phone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import LogCallDialog, {
  type PickerLead,
  type LogCallSubmit,
} from "@/components/broker-crm/LogCallDialog";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  lead: {
    id: string;
    full_name?: string | null;
    phone?: string | null;
    email?: string | null;
  };
  variant?: "outline" | "default";
  size?: "sm" | "default";
  className?: string;
  onSaved?: () => void;
}

/**
 * Phase 6 — Reusable "Call with AI" launcher.
 * Opens the browser-mic LogCallDialog for a single lead. Persists the call
 * to broker_call_logs; LogCallDialog itself handles upload + AI processing.
 */
export default function LeadCallButton({
  lead,
  variant = "outline",
  size = "sm",
  className,
  onSaved,
}: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const pickerLead: PickerLead = {
    id: lead.id,
    full_name: lead.full_name ?? null,
    phone: lead.phone ?? null,
    email: lead.email ?? null,
  };

  async function saveCallLog(input: LogCallSubmit) {
    if (!user?.id) {
      toast.error("Please sign in");
      throw new Error("not signed in");
    }
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("broker_call_logs")
        .insert({
          user_id: user.id,
          lead_id: input.leadId || lead.id,
          phone_number: input.phoneNumber,
          call_type: input.callType,
          call_status: input.callStatus,
          duration_seconds: input.durationSeconds,
          notes: input.notes || null,
        })
        .select("id")
        .single();
      if (error) throw error;
      toast.success("Call logged");
      return { callLogId: data.id as string };
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant={variant as any}
        size={size}
        className={className}
        onClick={(e) => {
          e.stopPropagation();
          if (!lead.phone) {
            toast.error("No phone number on this lead");
            return;
          }
          setOpen(true);
        }}
      >
        <Phone className="h-4 w-4 mr-1.5" />
        Call
      </Button>
      <LogCallDialog
        open={open}
        onOpenChange={setOpen}
        leads={[pickerLead]}
        userId={user?.id ?? null}
        initialLeadId={lead.id}
        submitting={saving}
        onSubmit={saveCallLog}
        onSaved={() => {
          onSaved?.();
        }}
      />
    </>
  );
}
