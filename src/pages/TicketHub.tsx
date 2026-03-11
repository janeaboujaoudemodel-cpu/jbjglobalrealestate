import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Ticket,
  Plus,
  Search,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  Mail,
  Hash,
  Copy,
  Inbox,
  MessageSquare,
  RotateCcw,
  Mic,
} from "lucide-react";
import { VoiceInputButton } from "@/components/ui/VoiceInputButton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const SERVICE_CATEGORIES = [
  "General Inquiry",
  "Property Issue",
  "Payment & Billing",
  "Account Access",
  "Technical Support",
  "Complaint",
  "Other",
];

const statusConfig: Record<string, { label: string; className: string; icon: typeof CheckCircle }> = {
  open: { label: "Open", className: "bg-yellow-500/20 text-yellow-600", icon: AlertCircle },
  in_progress: { label: "In Review", className: "bg-blue-500/20 text-blue-600", icon: Clock },
  resolved: { label: "Resolved", className: "bg-green-500/20 text-green-600", icon: CheckCircle },
};

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

const TicketHub = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const initialTab = searchParams.get("tab") === "new" ? "new" : "track";
  const [activeTab, setActiveTab] = useState(initialTab);

  // New ticket form
  const [newTicket, setNewTicket] = useState({
    full_name: "",
    email: "",
    subject: "",
    description: "",
    service_category: "General Inquiry",
  });
  const [submitting, setSubmitting] = useState(false);

  // Track tab
  const [selectedTicket, setSelectedTicket] = useState<TicketWithMessages | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [trackEmail, setTrackEmail] = useState("");
  const [trackTicketNumber, setTrackTicketNumber] = useState("");
  const [isTracking, setIsTracking] = useState(false);
  const [trackError, setTrackError] = useState("");

  // Pre-fill for logged in users
  useEffect(() => {
    if (user?.email) {
      setNewTicket((p) => ({ ...p, email: user.email || "" }));
    }
  }, [user?.email]);

  // Fetch user tickets
  const { data: userTickets, isLoading: loadingTickets } = useQuery({
    queryKey: ["ticket-hub-tickets", user?.id, user?.email],
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

  const inboxQuery = useQuery({
    queryKey: ["ticket-hub-inbox", user?.id, userTickets?.length],
    queryFn: async () => {
      if (!user || !userTickets?.length) return [];
      const ticketIds = userTickets.map((t) => t.id);
      const { data, error } = await supabase
        .from("support_ticket_messages")
        .select("id, message, created_at, ticket_id, support_tickets!inner(ticket_number, subject)")
        .eq("sender_type", "staff")
        .in("ticket_id", ticketIds)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as Array<{
        id: string; message: string; created_at: string; ticket_id: string;
        support_tickets?: { ticket_number?: string; subject?: string } | null;
      }>;
    },
    enabled: !!user,
  });

  const sendReplyMutation = useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: string; message: string }) => {
      const { error } = await supabase.from("support_ticket_messages").insert({
        ticket_id: ticketId, sender_type: "user", sender_user_id: user?.id || null, message, attachment_urls: [],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reply sent!");
      setReplyMessage("");
      if (selectedTicket) handleSelectTicket(selectedTicket.id);
      queryClient.invalidateQueries({ queryKey: ["ticket-hub-tickets"] });
    },
    onError: () => toast.error("Failed to send reply"),
  });

  const reopenMutation = useMutation({
    mutationFn: async ({ ticketNumber, token }: { ticketNumber: string; token: string }) => {
      const { data, error } = await supabase.functions.invoke("reopen-ticket", { body: { ticketNumber, token } });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Ticket reopened!");
      queryClient.invalidateQueries({ queryKey: ["ticket-hub-tickets"] });
      if (selectedTicket) handleSelectTicket(selectedTicket.id);
    },
    onError: () => toast.error("Failed to reopen ticket"),
  });

  const handleSubmitNewTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicket.full_name || !newTicket.email || !newTicket.subject || !newTicket.description) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    try {
      const ticketNumber = `JBJ-${Date.now()}`;
      const { error } = await supabase.from("support_tickets").insert({
        ticket_number: ticketNumber,
        full_name: newTicket.full_name,
        email: newTicket.email,
        subject: newTicket.subject,
        description: newTicket.description,
        service_category: newTicket.service_category,
        user_id: user?.id || null,
        status: "open",
        priority: "medium",
      } as any);
      if (error) throw error;
      toast.success(`Ticket ${ticketNumber} created successfully!`);
      setNewTicket({ full_name: "", email: user?.email || "", subject: "", description: "", service_category: "General Inquiry" });
      setActiveTab("track");
      queryClient.invalidateQueries({ queryKey: ["ticket-hub-tickets"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectTicket = async (ticketId: string) => {
    const ticketData = userTickets?.find((t) => t.id === ticketId);
    if (!ticketData) return;
    const { data: messages } = await supabase
      .from("support_ticket_messages")
      .select("id, sender_type, message, created_at")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });
    setSelectedTicket({ ...ticketData, messages: messages || [] });
  };

  const handleTrackTicket = async () => {
    if (!trackEmail.trim() || !trackTicketNumber.trim()) {
      setTrackError("Please enter both email and ticket number");
      return;
    }
    setIsTracking(true);
    setTrackError("");
    try {
      const { data: ticket, error } = await supabase
        .from("support_tickets")
        .select("id, ticket_number, full_name, email, subject, description, service_category, status, priority, created_at, is_reopened, reopen_token")
        .eq("ticket_number", trackTicketNumber.toUpperCase().trim())
        .eq("email", trackEmail.toLowerCase().trim())
        .single();
      if (error || !ticket) { setTrackError("Ticket not found. Check your details."); return; }
      const { data: messages } = await supabase
        .from("support_ticket_messages")
        .select("id, sender_type, message, created_at")
        .eq("ticket_id", ticket.id)
        .order("created_at", { ascending: true });
      setSelectedTicket({ ...ticket, messages: messages || [] });
    } catch { setTrackError("An error occurred."); } finally { setIsTracking(false); }
  };

  const handleCopyTicketNumber = async (num: string) => {
    try { await navigator.clipboard.writeText(num); toast.success("Copied!"); } catch { toast.error("Could not copy"); }
  };

  const handleVoiceTranscript = (text: string) => {
    setNewTicket((p) => ({ ...p, description: p.description ? `${p.description} ${text}` : text }));
  };

  return (
    <>
      <SEOHead title="Support Ticket Hub | JBJ Global" description="Submit a new support ticket or track existing tickets." />
      <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
        <div className="pt-8 pb-16 px-4">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/10 rounded-full mb-4 border-2 border-red-500/20">
                <Ticket className="w-8 h-8 text-red-500" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Support Ticket Hub</h1>
              <p className="text-muted-foreground">Submit a new ticket or track your existing complaints</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 bg-muted/60 border-2 border-gold/30 rounded-xl h-12 p-1 gap-1">
                <TabsTrigger value="new" className="text-sm font-semibold h-full rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-foreground data-[state=active]:shadow-md">
                  <Plus className="w-4 h-4 mr-2" />
                  New Ticket
                </TabsTrigger>
                <TabsTrigger value="track" className="text-sm font-semibold h-full rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-foreground data-[state=active]:shadow-md">
                  <Search className="w-4 h-4 mr-2" />
                  My Tickets
                </TabsTrigger>
                <TabsTrigger value="inbox" className="text-sm font-semibold h-full rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-foreground data-[state=active]:shadow-md relative">
                  <Inbox className="w-4 h-4 mr-2" />
                  Inbox
                  {(inboxQuery.data?.length || 0) > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {inboxQuery.data?.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* NEW TICKET TAB */}
              <TabsContent value="new">
                <Card className="border-2 border-red-500/20 bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <Plus className="w-5 h-5 text-red-500" />
                      Submit a New Ticket
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Describe your issue and our team will respond promptly.</p>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmitNewTicket} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Full Name *</Label>
                          <Input value={newTicket.full_name} onChange={(e) => setNewTicket((p) => ({ ...p, full_name: e.target.value }))} placeholder="Your full name" required />
                        </div>
                        <div className="space-y-2">
                          <Label>Email *</Label>
                          <Input type="email" value={newTicket.email} onChange={(e) => setNewTicket((p) => ({ ...p, email: e.target.value }))} placeholder="your@email.com" required />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Subject *</Label>
                          <Input value={newTicket.subject} onChange={(e) => setNewTicket((p) => ({ ...p, subject: e.target.value }))} placeholder="Brief summary of your issue" required />
                        </div>
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Select value={newTicket.service_category} onValueChange={(v) => setNewTicket((p) => ({ ...p, service_category: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {SERVICE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center justify-between">
                          Description *
                          <VoiceInputButton
                            onTranscript={handleVoiceTranscript}
                            onTranscriptResult={(result) => {
                              if (result.translated && !result.isEnglish) {
                                const combined = `[${result.languageName || "Original"}]: ${result.original}\n[English]: ${result.translated}`;
                                setNewTicket((p) => ({ ...p, description: p.description ? `${p.description}\n\n${combined}` : combined }));
                              }
                            }}
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          />
                        </Label>
                        <Textarea value={newTicket.description} onChange={(e) => setNewTicket((p) => ({ ...p, description: e.target.value }))} placeholder="Describe your issue in detail..." rows={5} required />
                      </div>
                      <Button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-bold h-12">
                        {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : <><Send className="w-4 h-4 mr-2" /> Submit Ticket</>}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TRACK TAB */}
              <TabsContent value="track">
                {user ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Ticket List */}
                    <div className="bg-background rounded-2xl border-2 border-gold/30 shadow-lg overflow-hidden">
                      <div className="p-4 border-b border-gold/20 bg-gradient-to-r from-[#F5EBD7]/50 to-transparent">
                        <h2 className="font-semibold text-foreground flex items-center gap-2">
                          <Ticket className="w-4 h-4 text-gold" />
                          Your Tickets ({userTickets?.length || 0})
                        </h2>
                      </div>
                      {loadingTickets ? (
                        <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gold" /></div>
                      ) : userTickets && userTickets.length > 0 ? (
                        <ScrollArea className="h-[450px]">
                          <div className="divide-y divide-gold/10">
                            {userTickets.map((ticket) => {
                              const status = statusConfig[ticket.status] || statusConfig.open;
                              const StatusIcon = status.icon;
                              return (
                                <button key={ticket.id} onClick={() => handleSelectTicket(ticket.id)}
                                  className={cn("w-full p-4 text-left hover:bg-gold/5 transition-colors",
                                    selectedTicket?.id === ticket.id && "bg-gold/10 border-l-4 border-l-gold")}>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-mono text-gold font-semibold text-sm">{ticket.ticket_number}</span>
                                    <Badge className={cn("text-xs", status.className)}><StatusIcon className="w-3 h-3 mr-1" />{status.label}</Badge>
                                  </div>
                                  <p className="text-foreground font-medium truncate text-sm">{ticket.subject}</p>
                                  <p className="text-muted-foreground text-xs mt-1">{format(new Date(ticket.created_at), "MMM d, yyyy")}</p>
                                </button>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      ) : (
                        <div className="p-8 text-center text-muted-foreground">
                          <Ticket className="w-10 h-10 mx-auto mb-3 opacity-40" />
                          <p>No tickets found</p>
                        </div>
                      )}
                    </div>
                    {/* Detail */}
                    <div className="bg-background rounded-2xl border-2 border-gold/30 shadow-lg overflow-hidden">
                      {selectedTicket ? (
                        <>
                          <div className="p-4 border-b border-gold/20 bg-gradient-to-r from-[#F5EBD7]/50 to-transparent">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-gold font-semibold">{selectedTicket.ticket_number}</span>
                              <button onClick={() => handleCopyTicketNumber(selectedTicket.ticket_number)}
                                className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-gold/30 text-gold hover:bg-gold/10">
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <Badge className={statusConfig[selectedTicket.status]?.className}>{statusConfig[selectedTicket.status]?.label}</Badge>
                            </div>
                            <h3 className="font-semibold text-foreground mt-2 truncate">{selectedTicket.subject}</h3>
                            <p className="text-xs text-muted-foreground mt-1">{format(new Date(selectedTicket.created_at), "MMM d, yyyy h:mm a")} · {selectedTicket.service_category}</p>
                          </div>
                          <ScrollArea className="h-[300px]">
                            <div className="p-4 space-y-3">
                              <div className="bg-[#FDFBF7] rounded-lg p-3 border border-gold/10">
                                <p className="text-[10px] text-gold uppercase tracking-wide mb-1 font-semibold">Your Message</p>
                                <p className="text-muted-foreground text-sm whitespace-pre-wrap">{selectedTicket.description}</p>
                              </div>
                              {selectedTicket.messages.map((msg) => (
                                <div key={msg.id} className={cn("rounded-lg p-3", msg.sender_type === "staff" ? "bg-gold/10 border border-gold/20 ml-4" : "bg-[#FDFBF7] border border-gold/10 mr-4")}>
                                  <p className="text-[10px] uppercase tracking-wide mb-1 font-semibold text-gold">{msg.sender_type === "staff" ? "Staff Reply" : "You"}</p>
                                  <p className="text-muted-foreground text-sm whitespace-pre-wrap">{msg.message}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{format(new Date(msg.created_at), "MMM d, h:mm a")}</p>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                          <div className="p-3 border-t border-gold/20 bg-[#FDFBF7]">
                            {selectedTicket.status === "resolved" && selectedTicket.reopen_token && (
                              <Button onClick={() => reopenMutation.mutate({ ticketNumber: selectedTicket.ticket_number, token: selectedTicket.reopen_token! })}
                                disabled={reopenMutation.isPending} variant="outline" size="sm"
                                className="w-full mb-2 border-red-500 text-red-600 hover:bg-red-50 font-semibold">
                                {reopenMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RotateCcw className="w-4 h-4 mr-2" />}
                                Reopen This Ticket
                              </Button>
                            )}
                            <div className="flex gap-2">
                              <Textarea value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} placeholder="Type your reply..." rows={2}
                                className="flex-1 min-h-[48px] text-sm" />
                              <Button onClick={() => { if (replyMessage.trim() && selectedTicket) sendReplyMutation.mutate({ ticketId: selectedTicket.id, message: replyMessage }); }}
                                disabled={!replyMessage.trim() || sendReplyMutation.isPending}
                                className="bg-gradient-to-r from-[#D4B896] to-[#C4A87A] hover:from-[#C4A87A] hover:to-[#B4986A] text-foreground self-end">
                                {sendReplyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                              </Button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="h-[450px] flex items-center justify-center text-muted-foreground">
                          <div className="text-center">
                            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
                            <p>Select a ticket to view details</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Guest tracking */
                  <Card className="border-2 border-gold/30 max-w-lg mx-auto">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Search className="w-5 h-5 text-gold" /> Track Your Ticket</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Email Address</Label>
                        <div className="relative mt-1">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input type="email" value={trackEmail} onChange={(e) => setTrackEmail(e.target.value)} placeholder="Email used for ticket" className="pl-10" />
                        </div>
                      </div>
                      <div>
                        <Label>Ticket Number</Label>
                        <div className="relative mt-1">
                          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input value={trackTicketNumber} onChange={(e) => setTrackTicketNumber(e.target.value.toUpperCase())} placeholder="e.g. JBJ-1234567890" className="pl-10 font-mono" />
                        </div>
                      </div>
                      {trackError && <p className="text-destructive text-sm flex items-center gap-1"><AlertCircle className="w-4 h-4" />{trackError}</p>}
                      <Button onClick={handleTrackTicket} disabled={isTracking} className="w-full bg-gradient-to-r from-[#D4B896] to-[#C4A87A] hover:from-[#C4A87A] hover:to-[#B4986A] text-foreground font-semibold">
                        {isTracking ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                        Track Ticket
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* INBOX TAB */}
              <TabsContent value="inbox">
                <div className="bg-background rounded-2xl border-2 border-gold/30 shadow-lg overflow-hidden">
                  <div className="p-4 border-b border-gold/20 bg-gradient-to-r from-[#F5EBD7]/50 to-transparent">
                    <h2 className="font-semibold text-foreground flex items-center gap-2">
                      <Inbox className="w-4 h-4 text-gold" />
                      JBJ Messages Inbox
                      {(inboxQuery.data?.length || 0) > 0 && <Badge className="bg-red-500 text-white text-xs">{inboxQuery.data?.length}</Badge>}
                    </h2>
                  </div>
                  <ScrollArea className="h-[500px]">
                    {(inboxQuery.data?.length || 0) > 0 ? (
                      <div className="divide-y divide-gold/10">
                        {inboxQuery.data?.map((msg) => (
                          <button key={msg.id} onClick={() => { handleSelectTicket(msg.ticket_id); setActiveTab("track"); }}
                            className="w-full p-4 text-left hover:bg-gold/5 transition-colors">
                            <div className="flex items-center justify-between mb-1 gap-2">
                              <span className="text-sm font-semibold text-foreground truncate">{msg.support_tickets?.subject || "Message from JBJ"}</span>
                              <span className="font-mono text-[11px] text-gold shrink-0">{msg.support_tickets?.ticket_number || ""}</span>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">{msg.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">{format(new Date(msg.created_at), "MMM d, yyyy h:mm a")}</p>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-12 text-center text-muted-foreground">
                        <Inbox className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p>No JBJ messages yet</p>
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
};

export default TicketHub;
