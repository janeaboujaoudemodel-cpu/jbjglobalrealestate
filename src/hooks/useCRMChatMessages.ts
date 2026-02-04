import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ChatMessage {
  id: string;
  sender: string;
  senderId: string;
  message: string;
  timestamp: string;
  isMe?: boolean;
  channelId: string;
}

interface DBChatMessage {
  id: string;
  channel_id: string;
  sender_id: string;
  sender_name: string;
  message: string;
  is_from_current_user: boolean;
  created_at: string;
}

const formatTimestamp = (isoDate: string) => {
  return new Date(isoDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const dbToLocal = (msg: DBChatMessage, currentUserId?: string): ChatMessage => ({
  id: msg.id,
  sender: msg.sender_name,
  senderId: msg.sender_id,
  message: msg.message,
  timestamp: formatTimestamp(msg.created_at),
  isMe: msg.sender_id === currentUserId || msg.is_from_current_user,
  channelId: msg.channel_id,
});

export const useCRMChatMessages = (channelId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id);
    });
  }, []);

  // Fetch messages for channel
  const fetchMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("crm_chat_messages")
        .select("*")
        .eq("channel_id", channelId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) throw error;

      const formattedMessages = (data || []).map((msg: DBChatMessage) => 
        dbToLocal(msg, currentUserId)
      );
      setMessages(formattedMessages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
    } finally {
      setLoading(false);
    }
  }, [channelId, currentUserId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel(`crm-chat-${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "crm_chat_messages",
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          const newMsg = dbToLocal(payload.new as DBChatMessage, currentUserId);
          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId, currentUserId]);

  // Send a new message
  const sendMessage = useCallback(
    async (text: string, senderName: string) => {
      if (!text.trim()) return null;

      const { data, error } = await supabase
        .from("crm_chat_messages")
        .insert({
          channel_id: channelId,
          sender_id: currentUserId || "anonymous",
          sender_name: senderName,
          message: text.trim(),
          is_from_current_user: true,
        })
        .select()
        .single();

      if (error) {
        toast.error("Failed to send message");
        console.error("Send message error:", error);
        return null;
      }

      return data;
    },
    [channelId, currentUserId]
  );

  return { messages, loading, sendMessage, refetch: fetchMessages };
};
