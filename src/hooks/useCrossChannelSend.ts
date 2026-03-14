import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CrossChannelSendOptions {
  /** Primary channel being used */
  primaryChannel: "email" | "chat";
  /** Recipient email address */
  recipientEmail: string;
  /** Email subject (for email-first) or auto-generated (for chat-first) */
  subject: string;
  /** Message body */
  body: string;
  /** Whether to also send via the secondary channel */
  alsoSendSecondary: boolean;
  /** Sender info — defaults to owner */
  senderName?: string;
  senderEmail?: string;
  senderTitle?: string;
  senderId?: string;
  /** For email-first: the chat recipient ID (userId or teamMemberId) */
  chatRecipientId?: string;
  /** For chat-first: the recipient member name (for toast) */
  recipientName?: string;
}

/**
 * Centralised cross-channel send logic.
 *
 * - **email primary + alsoNotifyChat**: fires `send-owner-email` with `alsoNotifyChat` flag
 * - **chat primary + alsoSendByEmail**: fires `send-owner-email` separately for the email copy
 *
 * Secondary channel errors are isolated — they never block the primary send.
 */
export function useCrossChannelSend() {
  const sendSecondaryEmail = useCallback(
    async (opts: CrossChannelSendOptions) => {
      if (!opts.alsoSendSecondary) return;

      if (opts.primaryChannel === "chat") {
        // Chat-first → send an email copy
        try {
          await supabase.functions.invoke("send-owner-email", {
            body: {
              to: opts.recipientEmail,
              subject: opts.subject,
              body: opts.body,
              senderId: opts.senderId || "owner",
              senderName: opts.senderName || "Jane Bou Jaoude",
              senderEmail: opts.senderEmail || "ceo@jbj.ae",
              senderTitle: opts.senderTitle || "Founder & CEO",
              account: "company",
              useResend: true,
              alsoSendByEmail: true,
              chatRecipientEmail: opts.recipientEmail,
            },
          });
          toast.success(`Also emailed to ${opts.recipientName || opts.recipientEmail}`);
        } catch (err) {
          console.error("Cross-channel email error:", err);
          // Don't block chat — secondary failure is isolated
        }
      }
      // For email-first → the send-owner-email edge function already handles the
      // `alsoNotifyChat` flag natively, so no extra call is needed here.
    },
    []
  );

  return { sendSecondaryEmail };
}
