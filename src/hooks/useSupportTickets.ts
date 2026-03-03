import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SupportTicket {
  id: string;
  ticket_number: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  service_category: string;
  subject: string;
  description: string;
  attachment_urls: string[];
  status: string;
  priority: string;
  escalate_to_tech: boolean;
  user_selected_priority: string | null;
  ai_analyzed_priority: string | null;
  customer_confirmation_sent_at: string | null;
  customer_confirmation_status: string | null;
  customer_confirmation_error: string | null;
  created_at: string;
  updated_at: string;
  // Reopened ticket tracking
  is_reopened: boolean;
  reopened_at: string | null;
  reopen_count: number;
  reopen_token: string | null;
}

export interface SupportTicketMessage {
  id: string;
  ticket_id: string;
  sender_type: "user" | "staff";
  sender_user_id: string | null;
  message: string;
  attachment_urls: string[];
  created_at: string;
}

export interface TicketFilters {
  status?: string;
  priority?: string;
  search?: string;
}

// Fetch all support tickets (Owner only)
export function useSupportTickets(filters?: TicketFilters) {
  return useQuery({
    queryKey: ["support-tickets", filters],
    queryFn: async () => {
      console.log("[useSupportTickets] Fetching tickets with filters:", filters);
      
      let query = supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      if (filters?.priority && filters.priority !== "all") {
        query = query.eq("priority", filters.priority);
      }

      if (filters?.search) {
        query = query.or(
          `ticket_number.ilike.%${filters.search}%,email.ilike.%${filters.search}%,full_name.ilike.%${filters.search}%,subject.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error("[useSupportTickets] Error fetching tickets:", error);
        throw error;
      }
      
      console.log(`[useSupportTickets] Successfully fetched ${data?.length || 0} tickets`);
      return data as SupportTicket[];
    },
    staleTime: 30 * 1000, // 30 seconds - reduces refetches
    gcTime: 5 * 60 * 1000, // 5 minutes cache
  });
}

// Fetch single ticket with messages
export function useSupportTicketDetail(ticketId: string | null) {
  return useQuery({
    queryKey: ["support-ticket-detail", ticketId],
    queryFn: async () => {
      if (!ticketId) return null;

      // Fetch ticket and messages in parallel for faster loading
      const [ticketResult, messagesResult] = await Promise.all([
        supabase
          .from("support_tickets")
          .select("*")
          .eq("id", ticketId)
          .single(),
        supabase
          .from("support_ticket_messages")
          .select("*")
          .eq("ticket_id", ticketId)
          .order("created_at", { ascending: true }),
      ]);

      if (ticketResult.error) throw ticketResult.error;
      if (messagesResult.error) throw messagesResult.error;

      return {
        ticket: ticketResult.data as SupportTicket,
        messages: messagesResult.data as SupportTicketMessage[],
      };
    },
    enabled: !!ticketId,
    staleTime: 10 * 1000, // 10 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes cache
  });
}

// Update ticket status
export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ticketId,
      status,
    }: {
      ticketId: string;
      status: string;
    }) => {
      const { error } = await supabase
        .from("support_tickets")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", ticketId);

      if (error) throw error;

      // Fetch ticket for notification context
      const { data: ticket } = await supabase
        .from("support_tickets")
        .select("ticket_number, subject, user_id, email, full_name")
        .eq("id", ticketId)
        .single();

      // Create user notification via edge function (service_role)
      if (ticket?.user_id) {
        const statusLabels: Record<string, string> = {
          open: "is now open",
          in_progress: "is under review",
          resolved: "has been resolved",
        };
        const label = statusLabels[status] || `status changed to ${status}`;
        
        await supabase.functions.invoke("create-user-alert", {
          body: {
            notification: {
              user_id: ticket.user_id,
              type: "support_ticket",
              title: `Ticket ${ticket.ticket_number} Update`,
              message: `Your ticket "${ticket.subject}" ${label}.`,
              metadata: { ticket_number: ticket.ticket_number, ticket_id: ticketId, action: status },
            },
          },
        }).then(({ error }) => {
          if (error) console.error("Alert creation failed:", error);
        });
      }

      // Send status update email for in_progress and resolved
      if (status === "in_progress" || status === "resolved") {
        try {
          await supabase.functions.invoke("send-ticket-status-email", {
            body: { ticketId, newStatus: status },
          });
        } catch (emailErr) {
          console.error("Status email failed (non-critical):", emailErr);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["support-ticket-detail"] });
      queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["ticket-notifications"] });
      toast.success("Ticket status updated");
    },
    onError: (error) => {
      console.error("Failed to update status:", error);
      toast.error("Failed to update ticket status");
    },
  });
}

// Send ticket reply
export function useSendTicketReply() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ticketId,
      message,
      ticketNumber,
      customerEmail,
      customerName,
    }: {
      ticketId: string;
      message: string;
      ticketNumber: string;
      customerEmail: string;
      customerName: string;
    }) => {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Insert message into database
      const { error: insertError } = await supabase
        .from("support_ticket_messages")
        .insert({
          ticket_id: ticketId,
          sender_type: "staff",
          sender_user_id: user?.id || null,
          message,
          attachment_urls: [],
        });

      if (insertError) throw insertError;

      // Fetch ticket to get user_id for notification
      const { data: ticketData } = await supabase
        .from("support_tickets")
        .select("user_id, ticket_number, subject")
        .eq("id", ticketId)
        .single();

      // Create notification + task via edge function (service_role)
      if (ticketData?.user_id) {
        await supabase.functions.invoke("create-user-alert", {
          body: {
            notification: {
              user_id: ticketData.user_id,
              type: "support_ticket",
              title: `New reply on ${ticketNumber}`,
              message: `You received a new email from JBJ on ticket "${ticketData.subject}". Review and reply if needed.`,
              metadata: { ticket_number: ticketNumber, ticket_id: ticketId, action: "staff_reply" },
              action_url: `/my-tickets?ticketId=${ticketId}`,
            },
            task: {
              user_id: ticketData.user_id,
              title: `Action required: ${ticketNumber}`,
              description: `You received a new JBJ message for "${ticketData.subject}". Open and reply here: /my-tickets?ticketId=${ticketId}`,
              category: "support_ticket",
              priority: "high",
            },
          },
        }).then(({ error }) => {
          if (error) console.error("Alert creation failed:", error);
        });
      }

      // Update ticket status to in_progress if it was open
      await supabase
        .from("support_tickets")
        .update({ status: "in_progress", updated_at: new Date().toISOString() })
        .eq("id", ticketId)
        .eq("status", "open");

      // Send email notification to customer
      const { error: emailError } = await supabase.functions.invoke(
        "send-ticket-reply-email",
        {
          body: {
            ticketNumber,
            customerEmail,
            customerName,
            replyMessage: message,
          },
        }
      );

      if (emailError) {
        console.error("Failed to send reply email:", emailError);
        // Don't throw - message was saved, just email failed
        toast.warning("Reply saved, but email notification failed");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-ticket-detail"] });
      queryClient.invalidateQueries({ queryKey: ["user-alert-counts"] });
      queryClient.invalidateQueries({ queryKey: ["ticket-notifications"] });
      toast.success("Reply sent successfully");
    },
    onError: (error) => {
      console.error("Failed to send reply:", error);
      toast.error("Failed to send reply");
    },
  });
}
