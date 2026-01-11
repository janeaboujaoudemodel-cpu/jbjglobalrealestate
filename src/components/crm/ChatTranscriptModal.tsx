import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { MessageSquare, User, Bot, Clock, Calendar, Star, ThumbsUp, ThumbsDown } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
}

interface ChatTranscriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: {
    id: string;
    user_name: string | null;
    user_email: string;
    user_phone: string | null;
    messages: Message[] | any;
    status: string;
    service_type: string | null;
    page_source: string | null;
    rating: number | null;
    rating_feedback: string | null;
    created_at: string;
    updated_at: string;
  } | null;
}

const ChatTranscriptModal = ({ isOpen, onClose, conversation }: ChatTranscriptModalProps) => {
  if (!conversation) return null;

  // Parse messages safely
  const messages: Message[] = Array.isArray(conversation.messages) 
    ? conversation.messages 
    : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "closed": return "bg-zinc-500";
      case "pending": return "bg-amber-500";
      default: return "bg-blue-500";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] bg-zinc-950 border-zinc-800 p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-gold" />
              Chat Transcript
            </DialogTitle>
            <Badge className={getStatusColor(conversation.status)}>
              {conversation.status}
            </Badge>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
            <div>
              <p className="text-zinc-500">Contact</p>
              <p className="text-white font-medium">{conversation.user_name || "Anonymous"}</p>
              <p className="text-zinc-400">{conversation.user_email}</p>
              {conversation.user_phone && (
                <p className="text-zinc-400">{conversation.user_phone}</p>
              )}
            </div>
            <div>
              <p className="text-zinc-500">Details</p>
              <div className="flex items-center gap-2 text-zinc-400">
                <Calendar className="w-3 h-3" />
                <span>{format(new Date(conversation.created_at), "MMM d, yyyy")}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400">
                <Clock className="w-3 h-3" />
                <span>{format(new Date(conversation.created_at), "h:mm a")}</span>
              </div>
              {conversation.service_type && (
                <Badge variant="outline" className="mt-1 text-gold border-gold/30">
                  {conversation.service_type}
                </Badge>
              )}
            </div>
          </div>

          {/* Rating if available */}
          {conversation.rating && (
            <div className="flex items-center gap-2 mt-3 p-3 bg-zinc-900 rounded-lg">
              <Star className="w-4 h-4 text-gold" />
              <span className="text-white font-medium">{conversation.rating}/5</span>
              {conversation.rating_feedback && (
                <span className="text-zinc-400 text-sm">- {conversation.rating_feedback}</span>
              )}
            </div>
          )}
        </DialogHeader>

        {/* Messages */}
        <ScrollArea className="flex-1 h-[400px]">
          <div className="p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-zinc-500 py-8">
                No messages in this conversation
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={message.id || index}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role !== "user" && (
                    <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-gold" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-gold text-black"
                        : "bg-zinc-800 text-white"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.timestamp && (
                      <p className={`text-xs mt-1 ${
                        message.role === "user" ? "text-black/60" : "text-zinc-500"
                      }`}>
                        {format(new Date(message.timestamp), "h:mm a")}
                      </p>
                    )}
                  </div>

                  {message.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-zinc-300" />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 flex justify-between items-center">
          <p className="text-xs text-zinc-500">
            {messages.length} messages • Last updated {format(new Date(conversation.updated_at), "MMM d, h:mm a")}
          </p>
          <Button onClick={onClose} variant="outline" className="border-zinc-700">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatTranscriptModal;
