import { useState } from "react";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  RotateCcw,
  Send,
  Mic,
  Inbox,
  Copy,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { VoiceInputButton } from "@/components/ui/VoiceInputButton";

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
  is_reopened?: boolean;
  reopen_token?: string | null;
  messages: {
    id: string;
    sender_type: string;
    message: string;
    created_at: string;
  }[];
}

const statusConfig: Record<string, { label: string; className: string; icon: typeof CheckCircle }> = {
  open: { label: "Open", className: "bg-yellow-500/20 text-yellow-600", icon: AlertCircle },
  in_progress: { label: "In Review", className: "bg-blue-500/20 text-blue-600", icon: Clock },
  resolved: { label: "Resolved", className: "bg-green-500/20 text-green-600", icon: CheckCircle },
};

const MyTickets = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [trackEmail, setTrackEmail] = useState("");
  const [trackTicketNumber, setTrackTicketNumber] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<TicketWithMessages | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [trackError, setTrackError] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [activeTab, setActiveTab] = useState("tickets");

  // For authenticated users: fetch their tickets
  const { data: userTickets, isLoading: loadingUserTickets } = useQuery({
    queryKey: ["my-tickets", user?.id, user?.email],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("support_tickets")
        .select("id, ticket_number, full_name, email, subject, description, service_category, status, priority, created_at, is_reopened, reopen_token")
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Inbox should show only real JBJ message replies (not status notifications)
  const { data: inboxMessages = [] } = useQuery({
    queryKey: ["ticket-inbox-messages", user?.id, userTickets?.length],
    queryFn: async () => {
      if (!user || !userTickets?.length) return [];

      const ticketIds = userTickets.map((ticket) => ticket.id);
      const { data, error } = await supabase
        .from("support_ticket_messages")
        .select("id, message, created_at, ticket_id, support_tickets!inner(ticket_number, subject)")
        .eq("sender_type", "staff")
        .in("ticket_id", ticketIds)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data || []) as Array<{
        id: string;
        message: string;
        created_at: string;
        ticket_id: string;
        support_tickets?: { ticket_number?: string; subject?: string } | null;
      }>;
    },
    enabled: !!user,
  });

  const inboxCount = inboxMessages.length;

  // Send reply mutation
  const sendReplyMutation = useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: string; message: string }) => {
      const { error } = await supabase
        .from("support_ticket_messages")
        .insert({
          ticket_id: ticketId,
          sender_type: "user",
          sender_user_id: user?.id || null,
          message,
          attachment_urls: [],
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reply sent successfully!");
      setReplyMessage("");
      // Refresh ticket messages
      if (selectedTicket) {
        handleSelectUserTicket(selectedTicket.id);
      }
      queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
    },
    onError: () => {
      toast.error("Failed to send reply");
    },
  });

  // Reopen ticket mutation
  const reopenMutation = useMutation({
    mutationFn: async ({ ticketNumber, token }: { ticketNumber: string; token: string }) => {
      const { data, error } = await supabase.functions.invoke("reopen-ticket", {
        body: { ticketNumber, token },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Ticket reopened successfully!");
      queryClient.invalidateQueries({ queryKey: ["my-tickets"] });
      if (selectedTicket) {
        handleSelectUserTicket(selectedTicket.id);
      }
    },
    onError: () => {
      toast.error("Failed to reopen ticket");
    },
  });

  const handleCopyTicketNumber = async (ticketNumber: string) => {
    try {
      await navigator.clipboard.writeText(ticketNumber);
      toast.success("Ticket number copied");
    } catch {
      toast.error("Could not copy ticket number");
    }
  };

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
      const { data: ticket, error: ticketError } = await supabase
        .from("support_tickets")
        .select("id, ticket_number, full_name, email, subject, description, service_category, status, priority, created_at, is_reopened, reopen_token")
        .eq("ticket_number", trackTicketNumber.toUpperCase().trim())
        .eq("email", trackEmail.toLowerCase().trim())
        .single();

      if (ticketError || !ticket) {
        setTrackError("Ticket not found. Please check your email and ticket number.");
        return;
      }

      const { data: messages } = await supabase
        .from("support_ticket_messages")
        .select("id, sender_type, message, created_at")
        .eq("ticket_id", ticket.id)
        .order("created_at", { ascending: true });

      setSelectedTicket({ ...ticket, messages: messages || [] });
    } catch {
      setTrackError("An error occurred. Please try again.");
    } finally {
      setIsTracking(false);
    }
  };

  const handleSelectUserTicket = async (ticketId: string) => {
    const ticketData = userTickets?.find((t) => t.id === ticketId);
    if (!ticketData) return;

    const { data: messages } = await supabase
      .from("support_ticket_messages")
      .select("id, sender_type, message, created_at")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    setSelectedTicket({ ...ticketData, messages: messages || [] });
  };

  const handleSendReply = () => {
    if (!replyMessage.trim() || !selectedTicket) return;
    sendReplyMutation.mutate({ ticketId: selectedTicket.id, message: replyMessage });
  };

  const handleReopenTicket = () => {
    if (!selectedTicket?.reopen_token) {
      toast.error("Cannot reopen - no reopen token available");
      return;
    }
    reopenMutation.mutate({
      ticketNumber: selectedTicket.ticket_number,
      token: selectedTicket.reopen_token,
    });
  };

  const handleVoiceTranscript = (text: string) => {
    setReplyMessage((prev) => (prev ? `${prev} ${text}` : text));
  };

  // Ticket detail view (shared between authenticated and guest)
  const renderTicketDetail = () => {
    if (!selectedTicket) {
      return (
        <div className="h-[450px] flex items-center justify-center text-zinc-400">
          <div className="text-center">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>Select a ticket to view details</p>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="p-4 border-b border-gold/20 bg-gold/5">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide whitespace-nowrap">
            <span className="font-mono text-gold font-semibold shrink-0">
              {selectedTicket.ticket_number}
            </span>
            <button
              type="button"
              onClick={() => handleCopyTicketNumber(selectedTicket.ticket_number)}
              className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-gold/30 text-gold hover:bg-gold/10 shrink-0"
              aria-label="Copy ticket number"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <Badge className={cn("shrink-0", statusConfig[selectedTicket.status]?.className)}>
              {statusConfig[selectedTicket.status]?.label}
            </Badge>
            {selectedTicket.is_reopened && (
              <Badge className="bg-orange-500/20 text-orange-600 shrink-0 text-xs">
                🔄 Reopened
              </Badge>
            )}
          </div>
          <h3 className="font-semibold text-black mt-2 truncate">{selectedTicket.subject}</h3>
          <p className="text-xs text-zinc-500 mt-1">
            {format(new Date(selectedTicket.created_at), "MMM d, yyyy h:mm a")} · {selectedTicket.service_category}
          </p>
        </div>

        <ScrollArea className="h-[300px]">
          <div className="p-4 space-y-3">
            {/* Original Description */}
            <div className="bg-[#FDFBF7] rounded-lg p-3 border border-gold/10">
              <p className="text-[10px] text-gold uppercase tracking-wide mb-1 font-semibold">Your Message</p>
              <p className="text-zinc-700 text-sm whitespace-pre-wrap">{selectedTicket.description}</p>
            </div>

            {/* Messages */}
            {selectedTicket.messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "rounded-lg p-3",
                  msg.sender_type === "staff"
                    ? "bg-gold/10 border border-gold/20 ml-4"
                    : "bg-[#FDFBF7] border border-gold/10 mr-4"
                )}
              >
                <p className="text-[10px] uppercase tracking-wide mb-1 font-semibold text-gold">
                  {msg.sender_type === "staff" ? "📩 Staff Reply" : "You"}
                </p>
                <p className="text-zinc-700 text-sm whitespace-pre-wrap">{msg.message}</p>
                <p className="text-xs text-zinc-400 mt-1">
                  {format(new Date(msg.created_at), "MMM d, h:mm a")}
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

        {/* Reply Composer - always available */}
        <div className="p-3 border-t border-gold/20 bg-[#FDFBF7]">
          {/* Reopen button if resolved */}
          {selectedTicket.status === "resolved" && selectedTicket.reopen_token && (
            <Button
              onClick={handleReopenTicket}
              disabled={reopenMutation.isPending}
              variant="outline"
              size="sm"
              className="w-full mb-2 border-red-500 text-red-600 hover:bg-red-50 font-semibold"
            >
              {reopenMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <RotateCcw className="w-4 h-4 mr-2" />
              )}
              Reopen This Ticket
            </Button>
          )}

          <p className="text-[10px] text-zinc-400 mb-1 flex items-center gap-1">
            <Mic className="w-3 h-3" /> Speak in any language — auto-translated
          </p>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your reply..."
                rows={2}
                className="w-full min-h-[48px] px-3 py-2 pr-10 rounded-lg bg-white border border-gold/30 text-black text-sm placeholder:text-zinc-400 resize-none focus:outline-none focus:ring-2 focus:ring-gold/50"
              />
              <div className="absolute top-2 right-2">
                <VoiceInputButton
                  onTranscript={handleVoiceTranscript}
                  onTranscriptResult={(result) => {
                    if (result.translated && !result.isEnglish) {
                      const combined = `[${result.languageName || 'Original'}]: ${result.original}\n[English]: ${result.translated}`;
                      setReplyMessage((prev) => (prev ? `${prev}\n\n${combined}` : combined));
                    }
                  }}
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-gold/60 hover:text-gold"
                />
              </div>
            </div>
            <Button
              onClick={handleSendReply}
              disabled={!replyMessage.trim() || sendReplyMutation.isPending}
              className="bg-gold hover:bg-gold/90 text-black self-end"
            >
              {sendReplyMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
      <div className="pt-8 pb-16 px-4">
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
                ? "View, track, and reply to your support tickets"
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

          {/* Guest Ticket Detail */}
          {!user && selectedTicket && (
            <div className="bg-white rounded-2xl border-2 border-gold/30 shadow-lg overflow-hidden max-w-2xl mx-auto">
              {renderTicketDetail()}
            </div>
          )}

          {/* Authenticated User Tabs: Tickets + Inbox */}
          {user && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="bg-white border-2 border-gold/30 p-1">
              <TabsTrigger value="tickets" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-foreground">
                  <Ticket className="w-4 h-4 mr-2" />
                  Tickets
                </TabsTrigger>
                <TabsTrigger value="inbox" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-foreground relative">
                  <Inbox className="w-4 h-4 mr-2" />
                  Inbox
                  {inboxCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {inboxCount}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Tickets Tab */}
              <TabsContent value="tickets">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Ticket List */}
                  <div className="bg-white rounded-2xl border-2 border-gold/30 shadow-lg overflow-hidden">
                    <div className="p-4 border-b border-gold/20 bg-gold/5">
                      <h2 className="font-semibold text-black flex items-center gap-2">
                        <Ticket className="w-4 h-4 text-gold" />
                        Your Tickets ({userTickets?.length || 0})
                      </h2>
                    </div>

                    {loadingUserTickets ? (
                      <div className="p-8 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-gold" />
                      </div>
                    ) : userTickets && userTickets.length > 0 ? (
                      <ScrollArea className="h-[450px]">
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
                                  selectedTicket?.id === ticket.id && "bg-gold/10 border-l-4 border-l-gold"
                                )}
                              >
                                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide whitespace-nowrap mb-1">
                                  <span className="font-mono text-gold font-semibold text-sm shrink-0">
                                    {ticket.ticket_number}
                                  </span>
                                  <Badge className={cn("text-xs shrink-0", status.className)}>
                                    <StatusIcon className="w-3 h-3 mr-1" />
                                    {status.label}
                                  </Badge>
                                  {ticket.is_reopened && (
                                    <Badge className="bg-orange-500/20 text-orange-600 text-[10px] shrink-0">🔄</Badge>
                                  )}
                                </div>
                                <p className="text-black font-medium truncate text-sm">{ticket.subject}</p>
                                <p className="text-zinc-500 text-xs mt-1">
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
                    {renderTicketDetail()}
                  </div>
                </div>
              </TabsContent>

              {/* Inbox Tab - JBJ messages only */}
              <TabsContent value="inbox">
                <div className="bg-white rounded-2xl border-2 border-gold/30 shadow-lg overflow-hidden">
                  <div className="p-4 border-b border-gold/20 bg-gold/5">
                    <h2 className="font-semibold text-black flex items-center gap-2">
                      <Inbox className="w-4 h-4 text-gold" />
                      JBJ Messages Inbox
                      {inboxCount > 0 && (
                        <Badge className="bg-red-500 text-white text-xs">{inboxCount}</Badge>
                      )}
                    </h2>
                  </div>

                  <ScrollArea className="h-[500px]">
                    {inboxMessages.length > 0 ? (
                      <div className="divide-y divide-gold/10">
                        {inboxMessages.map((msg) => (
                          <button
                            key={msg.id}
                            onClick={() => {
                              handleSelectUserTicket(msg.ticket_id);
                              setActiveTab("tickets");
                            }}
                            className="w-full p-4 text-left hover:bg-gold/5 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-1 gap-2">
                              <span className="text-sm font-semibold text-black truncate">
                                {msg.support_tickets?.subject || "Message from JBJ"}
                              </span>
                              <span className="font-mono text-[11px] text-gold shrink-0">
                                {msg.support_tickets?.ticket_number || ""}
                              </span>
                            </div>
                            <p className="text-sm text-zinc-600 line-clamp-2">{msg.message}</p>
                            <p className="text-xs text-zinc-400 mt-1">
                              {format(new Date(msg.created_at), "MMM d, yyyy h:mm a")}
                            </p>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-12 text-center text-zinc-400">
                        <Inbox className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p>No JBJ messages yet</p>
                        <p className="text-xs mt-1">Only direct JBJ replies appear here</p>
                      </div>
                    )}
                  </ScrollArea>
                </div>

              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default MyTickets;
