import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getListingAdmin } from "@/config/team-members";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Send,
  Mic,
  MicOff,
  Loader2,
  Upload,
  Link as LinkIcon,
  X,
  Sparkles,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ListingAdminChatProps {
  onBulkUpload?: (url: string) => void;
  onCreateListing?: (type: "off-plan" | "secondary", data: any) => void;
}

const ListingAdminChat = ({ onBulkUpload, onCreateListing }: ListingAdminChatProps) => {
  const adminPersona = getListingAdmin();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hello! I'm ${adminPersona?.name || "Sarah Mitchell"}, your Senior Listing Administrator. I can help you with:\n\n• **Off-Plan Listings** - New developer projects\n• **Secondary Market** - Resale properties\n• **Bulk Uploads** - Share a Google Drive link and I'll process all files\n• **Developer Relations** - Documentation and coordination\n\nWhat would you like to list today?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [bulkUploadUrl, setBulkUploadUrl] = useState("");
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Build conversation context
      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const { data, error } = await supabase.functions.invoke("listing-admin-chat", {
        body: {
          message: userMessage.content,
          conversationHistory,
          personaName: adminPersona?.name || "Sarah Mitchell",
          personaRole: adminPersona?.role || "Senior Listing Administrator",
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data?.response || "I apologize, I couldn't process that request. Please try again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Check if the response indicates listing creation
      if (data?.action === "create_listing" && onCreateListing) {
        onCreateListing(data.listingType, data.listingData);
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I apologize, there was an error processing your request. Please try again or contact support if the issue persists.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkUpload = () => {
    if (!bulkUploadUrl.trim()) {
      toast.error("Please enter a valid Google Drive URL");
      return;
    }

    // Validate Google Drive URL
    if (!bulkUploadUrl.includes("drive.google.com") && !bulkUploadUrl.includes("docs.google.com")) {
      toast.error("Please enter a valid Google Drive link");
      return;
    }

    onBulkUpload?.(bulkUploadUrl);
    
    const uploadMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: `I'd like to bulk upload from this Google Drive: ${bulkUploadUrl}`,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, uploadMessage]);
    setBulkUploadUrl("");
    setShowBulkUpload(false);

    // Simulate processing
    setTimeout(() => {
      const responseMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Perfect! I've received your Google Drive link. I'll process all the files and organize them by developer. This may take a few minutes depending on the file sizes.\n\n📁 **Processing started...**\n\nI'll categorize:\n• Project brochures\n• Floor plans\n• Renders & images\n• Fact sheets\n• Payment plans\n\nYou'll be notified once the upload is complete.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, responseMessage]);
      toast.success("Bulk upload initiated! Processing files...");
    }, 1500);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        // For now, just notify the user that voice is being processed
        toast.info("Voice message recorded. Processing...");
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info("Recording started...");
    } catch (error) {
      toast.error("Could not access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-zinc-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-zinc-200 bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
        <Avatar className="w-10 h-10 border-2 border-gold/30">
          <AvatarImage src={adminPersona?.avatar} alt={adminPersona?.name} />
          <AvatarFallback className="bg-gold/20 text-gold font-semibold">SM</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-semibold text-black text-sm">{adminPersona?.name || "Sarah Mitchell"}</h3>
          <p className="text-xs text-zinc-600">{adminPersona?.role || "Senior Listing Administrator"}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-zinc-600">Online</span>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {message.role === "assistant" && (
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={adminPersona?.avatar} alt={adminPersona?.name} />
                  <AvatarFallback className="bg-gold/20 text-gold text-xs">SM</AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-[80%] rounded-xl px-4 py-2.5 ${
                  message.role === "user"
                    ? "bg-black text-white"
                    : "bg-zinc-100 text-zinc-800"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-[10px] mt-1 opacity-60">
                  {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src={adminPersona?.avatar} alt={adminPersona?.name} />
                <AvatarFallback className="bg-gold/20 text-gold text-xs">SM</AvatarFallback>
              </Avatar>
              <div className="bg-zinc-100 rounded-xl px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-gold" />
                <span className="text-sm text-zinc-600">Typing...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Bulk Upload Section */}
      {showBulkUpload && (
        <div className="p-4 border-t border-zinc-200 bg-zinc-50">
          <div className="flex items-center gap-2 mb-2">
            <LinkIcon className="w-4 h-4 text-gold" />
            <span className="text-sm font-medium text-black">Bulk Upload from Google Drive</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBulkUpload(false)}
              className="ml-auto h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Input
              value={bulkUploadUrl}
              onChange={(e) => setBulkUploadUrl(e.target.value)}
              placeholder="Paste Google Drive folder link..."
              className="flex-1 bg-white border-zinc-300 text-black"
            />
            <Button onClick={handleBulkUpload} variant="primary" size="sm">
              <Upload className="w-4 h-4 mr-1" />
              Process
            </Button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-zinc-200 bg-white">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowBulkUpload(!showBulkUpload)}
            className="h-10 w-10 p-0 text-zinc-600 hover:text-gold hover:bg-gold/10"
            title="Bulk Upload"
          >
            <Upload className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={isRecording ? stopRecording : startRecording}
            className={`h-10 w-10 p-0 ${isRecording ? "text-red-500 bg-red-50" : "text-zinc-600 hover:text-gold hover:bg-gold/10"}`}
            title={isRecording ? "Stop Recording" : "Voice Message"}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
            placeholder="Ask Sarah anything about listings..."
            className="flex-1 bg-zinc-50 border-zinc-300 text-black"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="h-10 w-10 p-0 bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/30 hover:bg-black hover:border-black group transition-all duration-300"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-gold group-hover:text-gold" />
            ) : (
              <Send className="w-5 h-5 text-gold group-hover:text-white" />
            )}
          </Button>
        </div>
        <div className="flex items-center justify-center gap-1 mt-2 text-[10px] text-zinc-400">
          <Sparkles className="w-3 h-3" />
          <span>Powered by AI • Sarah can create listings, process bulk uploads, and answer questions</span>
        </div>
      </div>
    </div>
  );
};

export default ListingAdminChat;
