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
  });
}

// Fetch single ticket with messages
export function useSupportTicketDetail(ticketId: string | null) {
  return useQuery({
    queryKey: ["support-ticket-detail", ticketId],
    queryFn: async () => {
      if (!ticketId) return null;

      // Fetch ticket
      const { data: ticket, error: ticketError } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("id", ticketId)
        .single();

      if (ticketError) throw ticketError;

      // Fetch messages
      const { data: messages, error: messagesError } = await supabase
        .from("support_ticket_messages")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (messagesError) throw messagesError;

      return {
        ticket: ticket as SupportTicket,
        messages: messages as SupportTicketMessage[],
      };
    },
    enabled: !!ticketId,
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["support-ticket-detail"] });
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
      toast.success("Reply sent successfully");
    },
    onError: (error) => {
      console.error("Failed to send reply:", error);
      toast.error("Failed to send reply");
    },
  });
}
