import { useState } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Ticket,
  Mail,
  Hash,
  AlertCircle,
  Clock,
  CheckCircle,
  Loader2,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import GlobalHeader from "@/components/GlobalHeader";
import Footer from "@/components/Footer";

interface TicketWithMessages {
  id: string;
  ticket_number: string;
  full_name: string;
  email: string;
  subject: string;
  description: string;
  service_category: string;
  status: string;
  priority: string;
  created_at: string;
  messages: {
    id: string;
    sender_type: string;
    message: string;
    created_at: string;
  }[];
}

const statusConfig: Record<string, { label: string; className: string; icon: typeof CheckCircle }> = {
  open: { label: "Open", className: "bg-yellow-500/20 text-yellow-600", icon: AlertCircle },
  in_progress: { label: "In Progress", className: "bg-blue-500/20 text-blue-600", icon: Clock },
  resolved: { label: "Resolved", className: "bg-green-500/20 text-green-600", icon: CheckCircle },
};

const MyTickets = () => {
  const { user } = useAuth();
  const [trackEmail, setTrackEmail] = useState("");
  const [trackTicketNumber, setTrackTicketNumber] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<TicketWithMessages | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [trackError, setTrackError] = useState("");

  // For authenticated users: fetch their tickets
  const { data: userTickets, isLoading: loadingUserTickets } = useQuery({
    queryKey: ["my-tickets", user?.id, user?.email],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("support_tickets")
        .select("id, ticket_number, full_name, email, subject, description, service_category, status, priority, created_at")
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Handle guest ticket tracking
  const handleTrackTicket = async () => {
    if (!trackEmail.trim() || !trackTicketNumber.trim()) {
      setTrackError("Please enter both email and ticket number");
      return;
    }

    setIsTracking(true);
    setTrackError("");
    setSelectedTicket(null);

    try {
      // Fetch ticket
      const { data: ticket, error: ticketError } = await supabase
        .from("support_tickets")
        .select("id, ticket_number, full_name, email, subject, description, service_category, status, priority, created_at")
        .eq("ticket_number", trackTicketNumber.toUpperCase().trim())
        .eq("email", trackEmail.toLowerCase().trim())
        .single();

      if (ticketError || !ticket) {
        setTrackError("Ticket not found. Please check your email and ticket number.");
        return;
      }

      // Fetch messages
      const { data: messages, error: messagesError } = await supabase
        .from("support_ticket_messages")
        .select("id, sender_type, message, created_at")
        .eq("ticket_id", ticket.id)
        .order("created_at", { ascending: true });

      if (messagesError) throw messagesError;

      setSelectedTicket({
        ...ticket,
        messages: messages || [],
      });
    } catch (error) {
      console.error("Error tracking ticket:", error);
      setTrackError("An error occurred. Please try again.");
    } finally {
      setIsTracking(false);
    }
  };

  const handleSelectUserTicket = async (ticketId: string) => {
    const ticketData = userTickets?.find((t) => t.id === ticketId);
    if (!ticketData) return;

    // Fetch messages
    const { data: messages } = await supabase
      .from("support_ticket_messages")
      .select("id, sender_type, message, created_at")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    setSelectedTicket({
      ...ticketData,
      messages: messages || [],
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
      <GlobalHeader />

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gold/20 rounded-full mb-4">
              <Ticket className="w-8 h-8 text-gold" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-black mb-2">
              My Support Tickets
            </h1>
            <p className="text-zinc-600">
              {user
                ? "View and track your support tickets"
                : "Enter your details to track your support ticket"}
            </p>
          </div>

          {/* Guest Tracking Form */}
          {!user && (
            <div className="bg-white rounded-2xl border-2 border-gold/30 p-8 shadow-lg mb-8 max-w-lg mx-auto">
              <h2 className="text-lg font-semibold text-black mb-6 flex items-center gap-2">
                <Search className="w-5 h-5 text-gold" />
                Track Your Ticket
              </h2>

              <div className="space-y-4">
                <div>
                  <Label className="text-zinc-700">Email Address</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <Input
                      type="email"
                      value={trackEmail}
                      onChange={(e) => setTrackEmail(e.target.value)}
                      placeholder="Enter the email used for ticket"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-zinc-700">Ticket Number</Label>
                  <div className="relative mt-1">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <Input
                      value={trackTicketNumber}
                      onChange={(e) => setTrackTicketNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. JBJ-1234567890"
                      className="pl-10 font-mono"
                    />
                  </div>
                </div>

                {trackError && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {trackError}
                  </p>
                )}

                <Button
                  onClick={handleTrackTicket}
                  disabled={isTracking}
                  className="w-full bg-gold hover:bg-gold/90 text-black font-semibold"
                >
                  {isTracking ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Search className="w-4 h-4 mr-2" />
                  )}
                  Track Ticket
                </Button>
              </div>
            </div>
          )}

          {/* Authenticated User Ticket List */}
          {user && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ticket List */}
              <div className="bg-white rounded-2xl border-2 border-gold/30 shadow-lg overflow-hidden">
                <div className="p-4 border-b border-gold/20 bg-gold/5">
                  <h2 className="font-semibold text-black">Your Tickets</h2>
                </div>

                {loadingUserTickets ? (
                  <div className="p-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-gold" />
                  </div>
                ) : userTickets && userTickets.length > 0 ? (
                  <ScrollArea className="h-[400px]">
                    <div className="divide-y divide-gold/10">
                      {userTickets.map((ticket) => {
                        const status = statusConfig[ticket.status] || statusConfig.open;
                        const StatusIcon = status.icon;

                        return (
                          <button
                            key={ticket.id}
                            onClick={() => handleSelectUserTicket(ticket.id)}
                            className={cn(
                              "w-full p-4 text-left hover:bg-gold/5 transition-colors",
                              selectedTicket?.id === ticket.id && "bg-gold/10"
                            )}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <span className="font-mono text-gold font-semibold text-sm">
                                {ticket.ticket_number}
                              </span>
                              <Badge className={cn("text-xs", status.className)}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {status.label}
                              </Badge>
                            </div>
                            <p className="text-black font-medium truncate">{ticket.subject}</p>
                            <p className="text-zinc-500 text-sm mt-1">
                              {format(new Date(ticket.created_at), "MMM d, yyyy")}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="p-8 text-center text-zinc-500">
                    <Ticket className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p>No tickets found</p>
                  </div>
                )}
              </div>

              {/* Ticket Detail */}
              <div className="bg-white rounded-2xl border-2 border-gold/30 shadow-lg overflow-hidden">
                {selectedTicket ? (
                  <>
                    <div className="p-4 border-b border-gold/20 bg-gold/5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-gold font-semibold">
                          {selectedTicket.ticket_number}
                        </span>
                        <Badge className={statusConfig[selectedTicket.status]?.className}>
                          {statusConfig[selectedTicket.status]?.label}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-black mt-2">{selectedTicket.subject}</h3>
                    </div>

                    <ScrollArea className="h-[350px]">
                      <div className="p-4 space-y-4">
                        {/* Original Description */}
                        <div className="bg-zinc-100 rounded-lg p-4">
                          <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wide">
                            Your Message
                          </p>
                          <p className="text-zinc-700 text-sm whitespace-pre-wrap">
                            {selectedTicket.description}
                          </p>
                          <p className="text-xs text-zinc-400 mt-2">
                            {format(new Date(selectedTicket.created_at), "MMM d, yyyy h:mm a")}
                          </p>
                        </div>

                        {/* Messages */}
                        {selectedTicket.messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={cn(
                              "rounded-lg p-4",
                              msg.sender_type === "staff"
                                ? "bg-gold/10 border border-gold/20 ml-4"
                                : "bg-zinc-100 mr-4"
                            )}
                          >
                            <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wide">
                              {msg.sender_type === "staff" ? "Staff Reply" : "You"}
                            </p>
                            <p className="text-zinc-700 text-sm whitespace-pre-wrap">
                              {msg.message}
                            </p>
                            <p className="text-xs text-zinc-400 mt-2">
                              {format(new Date(msg.created_at), "MMM d, yyyy h:mm a")}
                            </p>
                          </div>
                        ))}

                        {selectedTicket.messages.length === 0 && (
                          <p className="text-center text-zinc-400 text-sm py-4">
                            Waiting for staff response...
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  </>
                ) : (
                  <div className="h-[400px] flex items-center justify-center text-zinc-400">
                    <div className="text-center">
                      <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
                      <p>Select a ticket to view details</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Guest Ticket Detail */}
          {!user && selectedTicket && (
            <div className="bg-white rounded-2xl border-2 border-gold/30 shadow-lg overflow-hidden max-w-2xl mx-auto">
              <div className="p-4 border-b border-gold/20 bg-gold/5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-gold font-semibold">
                    {selectedTicket.ticket_number}
                  </span>
                  <Badge className={statusConfig[selectedTicket.status]?.className}>
                    {statusConfig[selectedTicket.status]?.label}
                  </Badge>
                </div>
                <h3 className="font-semibold text-black mt-2">{selectedTicket.subject}</h3>
              </div>

              <ScrollArea className="max-h-[400px]">
                <div className="p-4 space-y-4">
                  <div className="bg-zinc-100 rounded-lg p-4">
                    <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wide">
                      Your Message
                    </p>
                    <p className="text-zinc-700 text-sm whitespace-pre-wrap">
                      {selectedTicket.description}
                    </p>
                  </div>

                  {selectedTicket.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "rounded-lg p-4",
                        msg.sender_type === "staff"
                          ? "bg-gold/10 border border-gold/20 ml-4"
                          : "bg-zinc-100 mr-4"
                      )}
                    >
                      <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wide">
                        {msg.sender_type === "staff" ? "Staff Reply" : "You"}
                      </p>
                      <p className="text-zinc-700 text-sm whitespace-pre-wrap">
                        {msg.message}
                      </p>
                      <p className="text-xs text-zinc-400 mt-2">
                        {format(new Date(msg.created_at), "MMM d, yyyy h:mm a")}
                      </p>
                    </div>
                  ))}

                  {selectedTicket.messages.length === 0 && (
                    <p className="text-center text-zinc-400 text-sm py-4">
                      Waiting for staff response...
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default MyTickets;
