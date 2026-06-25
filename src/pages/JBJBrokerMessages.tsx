import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  MessageSquare,
  Phone,
  Mail,
  Send,
  Search,
  Loader2,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  Video,
} from "lucide-react";


interface Lead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  status: string;
  last_contact: string | null;
}

interface Message {
  id: string;
  lead_id: string;
  broker_id: string;
  channel: string;
  content: string;
  direction: string;
  status: string;
  created_at: string;
}

export default function JBJBrokerMessages() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChannel, setActiveChannel] = useState<"whatsapp" | "email" | "call">("whatsapp");
  const [brokerProfile, setBrokerProfile] = useState<any>(null);
  const [filterWarning, setFilterWarning] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Restricted words list
  const restrictedWords = ["competitor", "discount", "free", "guarantee"];

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/jbj-broker-messages");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchBrokerProfile();
      fetchLeads();
    }
  }, [user]);

  useEffect(() => {
    if (selectedLead) {
      fetchMessages(selectedLead.id);
    }
  }, [selectedLead]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchBrokerProfile = async () => {
    const { data } = await supabase
      .from("jbj_brokers")
      .select("*")
      .eq("user_id", user?.id)
      .single();

    setBrokerProfile(data);
  };

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from("jbj_leads")
        .select("id, name, phone, email, status, last_contact")
        .order("last_contact", { ascending: false, nullsFirst: false });

      if (error) throw error;
      setLeads(data || []);
      
      if (data && data.length > 0) {
        setSelectedLead(data[0]);
      }
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast.error("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (leadId: string) => {
    const { data, error } = await supabase
      .from("jbj_messages")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return;
    }

    setMessages(data || []);
  };

  const validateMessage = (content: string): boolean => {
    // Check for restricted words
    const lowerContent = content.toLowerCase();
    for (const word of restrictedWords) {
      if (lowerContent.includes(word)) {
        setFilterWarning(`Message contains restricted word: "${word}". Please rephrase.`);
        return false;
      }
    }
    setFilterWarning(null);
    return true;
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedLead || !brokerProfile) return;

    if (!validateMessage(newMessage)) {
      toast.error("Message contains restricted content. Please rephrase.");
      return;
    }

    setSending(true);
    try {
      // Insert message
      const { data, error } = await supabase
        .from("jbj_messages")
        .insert({
          lead_id: selectedLead.id,
          broker_id: brokerProfile.id,
          channel: activeChannel,
          content: newMessage,
          direction: "outbound",
          status: "sent",
        })
        .select()
        .single();

      if (error) throw error;

      // Update lead's last contact
      await supabase
        .from("jbj_leads")
        .update({ last_contact: new Date().toISOString() })
        .eq("id", selectedLead.id);

      // Log activity
      await supabase.from("jbj_activity_logs").insert({
        actor: brokerProfile.name,
        action: `Sent ${activeChannel} message`,
        target: selectedLead.id,
      } as any);

      setMessages([...messages, data]);
      setNewMessage("");
      toast.success("Message sent successfully");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const filteredLeads = leads.filter(
    (lead) =>
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone?.includes(searchQuery)
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[hsl(32,28%,13%)] via-[hsl(33,27%,15%)] to-[hsl(33,28%,11%)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1A1A1A]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(32,28%,13%)] via-[hsl(33,27%,15%)] to-[hsl(33,28%,11%)] pt-24 lg:pt-28">
      {/* Header */}
      <header className="border-b-2 border-[#B89555]/40 bg-gradient-to-r from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] sticky top-20 lg:top-24 z-40 shadow-[0_4px_20px_rgba(200,167,102,0.15)] hover:bg-[#1A1A1A] hover:text-white hover:[&_svg]:text-[#B89555] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(184,149,85,0.35)] transition-all duration-300">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/jbj-broker-dashboard")}
                className="text-[#1A1A1A] hover:text-[#1A1A1A] hover:bg-[#EFE6D6]/10"
              >
                <MessageSquare className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-[#1A1A1A] text-xl font-bold">Messages</h1>
                <span className="text-[#1A1A1A]/70 text-sm">Communicate with your leads</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => navigate("/jbj-broker-dashboard")} variant="secondary">
                <User className="w-4 h-4 mr-2" />
                My Leads
              </Button>
              <Button variant="secondary" onClick={async () => { await supabase.auth.signOut(); navigate("/auth"); }}>
                <User className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>

          {/* Channel Tabs */}
          <div className="flex items-center gap-2">
            <Button
              variant={activeChannel === "whatsapp" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setActiveChannel("whatsapp")}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              WhatsApp
            </Button>
            <Button
              variant={activeChannel === "email" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setActiveChannel("email")}
            >
              <Mail className="h-4 w-4 mr-1" />
              Email
            </Button>
            <Button
              variant={activeChannel === "call" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setActiveChannel("call")}
            >
              <Phone className="h-4 w-4 mr-1" />
              Call
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Full Width Chat */}
      <main className="flex h-[calc(100vh-220px)]">
        {/* Conversations List - Left Panel */}
        <div className="w-80 bg-[#FDFBF7] border-r border-[#B89555]/20 flex flex-col">
          <div className="p-4 border-b border-[#B89555]/20">
            <h2 className="font-semibold text-[#1A1A1A] mb-3">Conversations</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1A1A1A]/70" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {filteredLeads.map((lead) => (
              <div
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className={`p-4 border-b border-[#B89555]/10 cursor-pointer transition-all hover:bg-[#EFE6D6]/5 ${
 selectedLead?.id === lead.id ? "bg-[#EFE6D6]/10 border-l-4 border-l-gold" : ""
 }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-[#EFE6D6]/20 text-[#1A1A1A]">
                      {lead.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#1A1A1A] truncate">{lead.name}</p>
                    <p className="text-sm text-[#1A1A1A]/70 truncate">
                      {lead.email || lead.phone || "No contact"}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      lead.status === "new"
                        ? "border-blue-500 text-blue-500"
                        : lead.status === "qualified"
                        ? "border-[color:var(--emerald-1)]/30 text-green-500"
                        : "border-[#B89555]/30 text-[#1A1A1A]/70"
                    }
                  >
                    {lead.status}
                  </Badge>
                </div>
              </div>
            ))}
          </ScrollArea>
        </div>

        {/* Chat Area - Full Width */}
        <div className="flex-1 flex flex-col bg-[#FDFBF7]">
          {selectedLead ? (
            <>
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-b border-[#B89555]/20 p-4 flex items-center justify-between hover:bg-[#1A1A1A] hover:text-white hover:[&_svg]:text-[#B89555] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(184,149,85,0.35)] transition-all duration-300">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-[#B89555]/30">
                    <AvatarFallback className="bg-[#EFE6D6]/20 text-[#1A1A1A]">
                      {selectedLead.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-[#1A1A1A]">{selectedLead.name}</h3>
                    <p className="text-sm text-[#1A1A1A]/70">
                      {selectedLead.phone || selectedLead.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages Area - Full Height */}
              <ScrollArea className="flex-1 p-4 bg-gradient-to-br from-[#F7F1E6]/30 via-[#ECE2D2]/30 to-[#D8C7A6]/30">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 group ${
 msg.direction === "outbound" ? "flex-row-reverse" : "flex-row"
 }`}
                    >
                      <div className="flex flex-col max-w-[70%]">
                        <div
                          className={`p-3 rounded-lg select-text cursor-text ${
 msg.direction === "outbound"
 ? "bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] text-[#1A1A1A] border border-[#B89555]/30 shadow-md rounded-tr-sm"
 : "bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/20 shadow-sm rounded-tl-sm"
 }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs border-[#B89555]/30">
                              {msg.channel}
                            </Badge>
                            <span className="text-xs text-[#1A1A1A]/60">
                              {new Date(msg.created_at).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="select-text">{msg.content}</p>
                          {msg.direction === "outbound" && (
                            <div className="flex items-center justify-end gap-1 mt-1">
                              <CheckCircle className="h-3 w-3 text-[color:var(--emerald-1)]" />
                              <span className="text-xs text-[#1A1A1A]/60">{msg.status}</span>
                            </div>
                          )}
                        </div>
                        {/* Copy button */}
                        <button
                          onClick={async () => {
                            await navigator.clipboard.writeText(msg.content);
                            toast.success(t('chat.messageCopied') || "Message copied");
                          }}
                          className={`flex items-center gap-1 mt-1 text-[10px] text-[#1A1A1A]/70 hover:text-[#1A1A1A] transition-colors opacity-0 group-hover:opacity-100 ${
 msg.direction === "outbound" ? "self-end mr-1" : "self-start ml-1"
 }`}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                          <span>{t('chat.copy') || 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="bg-[#FDFBF7] border-t border-[#B89555]/20 p-4">
                {filterWarning && (
                  <div className="flex items-center gap-2 text-red-600 text-sm mb-3 p-2 bg-red-50 rounded">
                    <AlertTriangle className="h-4 w-4" />
                    {filterWarning}
                  </div>
                )}

                <div className="flex gap-3">
                  <Textarea
                    placeholder={`Type your ${activeChannel} message...`}
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      validateMessage(e.target.value);
                    }}
                    className="flex-1 min-h-[80px] resize-none"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={sending || !newMessage.trim() || !!filterWarning}
                    variant="primary"
                    className="self-end"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center bg-gradient-to-br from-[#F7F1E6]/30 via-[#ECE2D2]/30 to-[#D8C7A6]/30">
              <div>
                <MessageSquare className="h-16 w-16 text-[#1A1A1A]/70 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-[#1A1A1A]">
                  Select a conversation
                </h3>
                <p className="text-[#1A1A1A]/70">
                  Choose a lead from the list to start messaging
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Lead Info Panel */}
        {selectedLead && (
          <div className="w-72 bg-[#FDFBF7] border-l border-[#B89555]/20 p-4">
            <h3 className="font-semibold text-[#1A1A1A] mb-4">Lead Information</h3>

            <div className="space-y-4">
              <div className="text-center">
                <Avatar className="h-20 w-20 mx-auto mb-3 border-2 border-[#B89555]/30">
                  <AvatarFallback className="bg-[#EFE6D6]/20 text-[#1A1A1A] text-2xl">
                    {selectedLead.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <h4 className="font-medium text-[#1A1A1A]">{selectedLead.name}</h4>
                <Badge variant="outline" className="mt-1 border-[#B89555]/30">
                  {selectedLead.status}
                </Badge>
              </div>

              <div className="space-y-3 text-sm">
                {selectedLead.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-[#1A1A1A]" />
                    <span className="text-[#1A1A1A]">{selectedLead.phone}</span>
                  </div>
                )}
                {selectedLead.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-[#1A1A1A]" />
                    <span className="text-[#1A1A1A] truncate">{selectedLead.email}</span>
                  </div>
                )}
                {selectedLead.last_contact && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#1A1A1A]" />
                    <span className="text-[#1A1A1A]">
                      Last: {new Date(selectedLead.last_contact).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-[#B89555]/20 space-y-2">
                <Button className="w-full" variant="secondary" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  View Full Profile
                </Button>
                <Button className="w-full" variant="secondary" size="sm">
                  <Video className="h-4 w-4 mr-2" />
                  Schedule Video Call
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
