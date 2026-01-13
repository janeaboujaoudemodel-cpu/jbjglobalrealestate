import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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
import { JBJSidebar } from "@/components/jbj-broker/JBJSidebar";

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
      });

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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <JBJSidebar brokerProfile={brokerProfile} activePage="messages" />

      {/* Main Content */}
      <div className="flex-1 ml-64 flex">
        {/* Conversations List */}
        <div className="w-80 bg-white border-r flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-900 mb-3">Conversations</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
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
                className={`p-4 border-b cursor-pointer transition-all hover:bg-gray-50 ${
                  selectedLead?.id === lead.id ? "bg-gold/10 border-l-4 border-l-gold" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gray-200 text-gray-600">
                      {lead.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{lead.name}</p>
                    <p className="text-sm text-gray-500 truncate">
                      {lead.email || lead.phone || "No contact"}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      lead.status === "new"
                        ? "border-blue-500 text-blue-500"
                        : lead.status === "qualified"
                        ? "border-green-500 text-green-500"
                        : "border-gray-500 text-gray-500"
                    }
                  >
                    {lead.status}
                  </Badge>
                </div>
              </div>
            ))}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedLead ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gold/20 text-gold">
                      {selectedLead.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedLead.name}</h3>
                    <p className="text-sm text-gray-500">
                      {selectedLead.phone || selectedLead.email}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant={activeChannel === "whatsapp" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveChannel("whatsapp")}
                    className={activeChannel === "whatsapp" ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    WhatsApp
                  </Button>
                  <Button
                    variant={activeChannel === "email" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveChannel("email")}
                    className={activeChannel === "email" ? "bg-blue-600 hover:bg-blue-700" : ""}
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    Email
                  </Button>
                  <Button
                    variant={activeChannel === "call" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveChannel("call")}
                    className={activeChannel === "call" ? "bg-purple-600 hover:bg-purple-700" : ""}
                  >
                    <Phone className="h-4 w-4 mr-1" />
                    Call
                  </Button>
                </div>
              </div>

              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4 bg-gray-100">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.direction === "outbound" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          msg.direction === "outbound"
                            ? "bg-gold text-black"
                            : "bg-white text-gray-900"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {msg.channel}
                          </Badge>
                          <span className="text-xs opacity-70">
                            {new Date(msg.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <p>{msg.content}</p>
                        {msg.direction === "outbound" && (
                          <div className="flex items-center justify-end gap-1 mt-1">
                            <CheckCircle className="h-3 w-3" />
                            <span className="text-xs">{msg.status}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="bg-white border-t p-4">
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
                    className="bg-gold hover:bg-gold-dark text-black self-end"
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
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600">
                  Select a conversation
                </h3>
                <p className="text-gray-400">
                  Choose a lead from the list to start messaging
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Lead Info Panel */}
        {selectedLead && (
          <div className="w-72 bg-white border-l p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Lead Information</h3>

            <div className="space-y-4">
              <div className="text-center">
                <Avatar className="h-20 w-20 mx-auto mb-3">
                  <AvatarFallback className="bg-gold/20 text-gold text-2xl">
                    {selectedLead.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <h4 className="font-medium text-gray-900">{selectedLead.name}</h4>
                <Badge variant="outline" className="mt-1">
                  {selectedLead.status}
                </Badge>
              </div>

              <div className="space-y-3 text-sm">
                {selectedLead.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{selectedLead.phone}</span>
                  </div>
                )}
                {selectedLead.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="truncate">{selectedLead.email}</span>
                  </div>
                )}
                {selectedLead.last_contact && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>
                      Last: {new Date(selectedLead.last_contact).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t space-y-2">
                <Button className="w-full" variant="outline" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  View Full Profile
                </Button>
                <Button className="w-full" variant="outline" size="sm">
                  <Video className="h-4 w-4 mr-2" />
                  Schedule Video Call
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
