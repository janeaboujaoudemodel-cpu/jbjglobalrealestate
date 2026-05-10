import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageSquare,
  Mail,
  Phone,
  Clock,
  ChevronRight,
  Loader2,
} from "lucide-react";

interface Conversation {
  id: string;
  channel: string;
  client_identifier: string;
  status: string;
  message_count: number | null;
  last_message_at: string | null;
  started_at: string | null;
  lead?: {
    full_name: string;
  } | null;
}

interface AIBrokerConversationsProps {
  brokerId: string;
}

export function AIBrokerConversations({ brokerId }: AIBrokerConversationsProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  useEffect(() => {
    if (brokerId) {
      fetchConversations();
    }
  }, [brokerId]);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from("broker_conversations")
        .select(`
          *,
          lead:crm_leads(full_name)
        `)
        .eq("broker_id", brokerId)
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .limit(50);

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "whatsapp":
        return <MessageSquare className="h-4 w-4 text-emerald-500" />;
      case "email":
        return <Mail className="h-4 w-4 text-blue-500" />;
      case "phone":
        return <Phone className="h-4 w-4 text-purple-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-[#1A1A1A]/70" />;
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case "whatsapp":
        return "border-emerald-500/30 text-emerald-400";
      case "email":
        return "border-blue-500/30 text-blue-400";
      case "phone":
        return "border-purple-500/30 text-purple-400";
      default:
        return "border-[#B89555]/30/30 text-white/70";
    }
  };

  const formatTime = (date: string | null) => {
    if (!date) return "N/A";
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return "Just now";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#1A1A1A]" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <Card className="bg-[#FDFBF7] border-[#1A1A1A] border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <MessageSquare className="h-16 w-16 text-[#1A1A1A]/70 mb-4" />
          <h3 className="text-white text-lg font-medium mb-2">No Conversations Yet</h3>
          <p className="text-[#1A1A1A]/70 text-center">
            Start contacting leads to see conversations here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Conversation List */}
      <div className="lg:col-span-1">
        <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv.id)}
                  className={`w-full p-4 text-left border-b border-[#1A1A1A] hover:bg-[#1A1A1A]/50 transition-colors ${
                    selectedConversation === conv.id ? "bg-[#1A1A1A]" : ""
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getChannelIcon(conv.channel)}
                      <span className="text-white font-medium">
                        {conv.lead?.full_name || conv.client_identifier}
                      </span>
                    </div>
                    <Badge variant="outline" className={getChannelColor(conv.channel)}>
                      {conv.channel}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#1A1A1A]/70">
                      {conv.message_count || 0} messages
                    </span>
                    <span className="text-[#1A1A1A]/70 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(conv.last_message_at)}
                    </span>
                  </div>
                </button>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Conversation Detail */}
      <div className="lg:col-span-2">
        {selectedConversation ? (
          <ConversationDetail conversationId={selectedConversation} />
        ) : (
          <Card className="bg-[#FDFBF7] border-[#1A1A1A] h-[600px]">
            <CardContent className="flex flex-col items-center justify-center h-full">
              <ChevronRight className="h-12 w-12 text-[#1A1A1A]/70 mb-4" />
              <p className="text-[#1A1A1A]/70">Select a conversation to view details</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

interface ConversationDetailProps {
  conversationId: string;
}

function ConversationDetail({ conversationId }: ConversationDetailProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, [conversationId]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("broker_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-[#FDFBF7] border-[#1A1A1A] h-[600px]">
        <CardContent className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-[#1A1A1A]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#FDFBF7] border-[#1A1A1A] h-[600px] flex flex-col">
      <CardContent className="flex-1 p-4 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.direction === "outbound" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    msg.direction === "outbound"
                      ? "bg-[#EFE6D6] text-[#1A1A1A]"
                      : "bg-[#1A1A1A] text-white"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      msg.direction === "outbound" ? "text-[#1A1A1A]/60" : "text-[#1A1A1A]/70"
                    }`}
                  >
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}

            {messages.length === 0 && (
              <div className="text-center py-8">
                <p className="text-[#1A1A1A]/70">No messages in this conversation</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
