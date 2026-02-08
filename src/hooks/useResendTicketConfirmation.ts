import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ResendResult {
  success: boolean;
  error?: string;
}

export function useResendTicketConfirmation() {
  const [isResending, setIsResending] = useState(false);

  const resendConfirmation = async (
    ticketNumber: string,
    email: string
  ): Promise<ResendResult> => {
    if (!ticketNumber || !email) {
      return { success: false, error: "Missing ticket number or email" };
    }

    setIsResending(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "resend-support-ticket-confirmation",
        {
          body: { ticketNumber, email },
        }
      );

      if (error) {
        console.error("Resend confirmation error:", error);
        const errorMessage = error.message || "Failed to resend confirmation";
        toast.error("Failed to resend email", { description: errorMessage });
        return { success: false, error: errorMessage };
      }

      if (data?.success) {
        toast.success("Confirmation email sent!", {
          description: `Check your inbox at ${email}`,
        });
        return { success: true };
      } else {
        const errorMessage = data?.error || "Unknown error occurred";
        toast.error("Failed to resend email", { description: errorMessage });
        return { success: false, error: errorMessage };
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Network error";
      console.error("Resend confirmation exception:", err);
      toast.error("Failed to resend email", { description: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      setIsResending(false);
    }
  };

  return { resendConfirmation, isResending };
}
