import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { LockedPayload } from "@/components/outreach/DeliveryPreviewDialog";

export interface LockPayloadInput {
  surface: string;
  recipient_email: string;
  cc_emails?: string[];
  from_email: string;
  from_name: string;
  reply_to: string;
  subject: string;
  preheader?: string;
  inner_html: string;
  plain_text?: string;
  metadata?: Record<string, unknown>;
}

/**
 * useLockedSend — the universal lock-and-send pipeline.
 *
 * Flow:
 *   1. lockPayload(input)           → returns LockedPayload (status='locked')
 *   2. <DeliveryPreviewDialog />    → user reviews exact bytes
 *   3. sendLocked(payload.id)       → sends byte-for-byte via Gmail
 *
 * Every outreach surface (CRM, registries, campaigns, hunting) uses this.
 */
export function useLockedSend() {
  const [locked, setLocked] = useState<LockedPayload | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [locking, setLocking] = useState(false);
  const [sending, setSending] = useState(false);

  const lockPayload = useCallback(async (input: LockPayloadInput) => {
    setLocking(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "outreach-lock-payload",
        { body: input },
      );
      if (error) throw new Error(error.message);
      const payload = (data as any)?.payload as LockedPayload | undefined;
      if (!payload?.id) throw new Error("Lock failed — no payload returned");
      setLocked(payload);
      setPreviewOpen(true);
      return payload;
    } catch (e) {
      toast.error("Could not lock email", { description: String((e as Error).message) });
      throw e;
    } finally {
      setLocking(false);
    }
  }, []);

  const sendLocked = useCallback(async (payload: LockedPayload) => {
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "outreach-send-locked",
        { body: { payload_id: payload.id, expected_hash: payload.payload_hash } },
      );
      if (error) throw new Error(error.message);
      const result = data as any;
      if (result?.error) throw new Error(result.error);
      toast.success("Email sent — exact mirror of preview");
      setPreviewOpen(false);
      setLocked(null);
      return result;
    } catch (e) {
      toast.error("Send failed", { description: String((e as Error).message) });
      throw e;
    } finally {
      setSending(false);
    }
  }, []);

  return {
    locked,
    previewOpen,
    setPreviewOpen,
    locking,
    sending,
    lockPayload,
    sendLocked,
  };
}
