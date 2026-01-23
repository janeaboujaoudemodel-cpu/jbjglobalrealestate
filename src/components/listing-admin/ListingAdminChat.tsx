import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getListingAdmin } from "@/config/team-members";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import {
  Send,
  Mic,
  MicOff,
  Loader2,
  Upload,
  Link as LinkIcon,
  X,
  FolderOpen,
  CheckCircle,
  Clock,
  Trash2,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  type?: "text" | "processing" | "success";
}

interface ListingAdminChatProps {
  onBulkUpload?: (url: string) => void;
  onCreateListing?: (type: "off-plan" | "secondary", data: any) => void;
}

const ListingAdminChat = ({ onBulkUpload, onCreateListing }: ListingAdminChatProps) => {
  const adminPersona = getListingAdmin();
  const { user } = useAuth();
  const { language, t } = useLanguage();
  
  const getWelcomeMessage = (): Message => ({
    id: "welcome",
    role: "assistant",
    content: `Hello! I'm ${adminPersona?.name || "Sarah Mitchell"}, your Senior Listing Administrator. I can help you with:\n\n• **Off-Plan Listings** - New developer projects\n• **Secondary Market** - Resale properties\n• **Bulk Uploads** - Share a Google Drive link and I'll process all files\n• **Developer Relations** - Documentation and coordination\n\nWhat would you like to list today?`,
    timestamp: new Date(),
  });

  const [messages, setMessages] = useState<Message[]>([getWelcomeMessage()]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [bulkUploadUrl, setBulkUploadUrl] = useState("");
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Load existing chat session on mount
  useEffect(() => {
    const loadChatSession = async () => {
      if (!user) return;

      try {
        // Try to find an active session
        const { data: sessions, error } = await supabase
          .from("listing_admin_chat_sessions")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "active")
          .order("updated_at", { ascending: false })
          .limit(1);

        if (error) {
          console.error("Error loading chat session:", error);
          return;
        }

        if (sessions && sessions.length > 0) {
          const session = sessions[0];
          setSessionId(session.id);
          
          // Parse messages from JSON
          const savedMessages = (session.messages as any[]).map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }));
          
          if (savedMessages.length > 0) {
            setMessages(savedMessages);
          }
        } else {
          // Create new session
          const { data: newSession, error: createError } = await supabase
            .from("listing_admin_chat_sessions")
            .insert({
              user_id: user.id,
              messages: JSON.stringify([getWelcomeMessage()]),
              status: "active",
            } as any)
            .select()
            .single();

          if (!createError && newSession) {
            setSessionId(newSession.id);
          }
        }
      } catch (err) {
        console.error("Error loading chat:", err);
      }
    };

    loadChatSession();
  }, [user]);

  // Save messages to database whenever they change
  useEffect(() => {
    const saveMessages = async () => {
      if (!sessionId || messages.length <= 1) return;

      try {
        await supabase
          .from("listing_admin_chat_sessions")
          .update({ 
            messages: messages.map(m => ({
              ...m,
              timestamp: m.timestamp.toISOString(),
            })),
          })
          .eq("id", sessionId);
      } catch (err) {
        console.error("Error saving chat:", err);
      }
    };

    const debounce = setTimeout(saveMessages, 500);
    return () => clearTimeout(debounce);
  }, [messages, sessionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleClearChat = async () => {
    if (!confirm("Are you sure you want to clear this chat? This cannot be undone.")) {
      return;
    }

    if (sessionId) {
      await supabase
        .from("listing_admin_chat_sessions")
        .update({ status: "completed" })
        .eq("id", sessionId);
    }

    // Create new session
    if (user) {
      const { data: newSession } = await supabase
        .from("listing_admin_chat_sessions")
        .insert({
          user_id: user.id,
          messages: JSON.stringify([getWelcomeMessage()]),
          status: "active",
        } as any)
        .select()
        .single();

      if (newSession) {
        setSessionId(newSession.id);
      }
    }

    setMessages([getWelcomeMessage()]);
    toast.success("Chat cleared");
  };

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
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
          language: language,
        },
      });

      if (error) throw error;

      // Clean up response - remove emojis and add proper spacing
      let responseText = data?.response || "I apologize, I couldn't process that request. Please try again.";
      responseText = responseText.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]|[\u{1F100}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F910}-\u{1F96B}]|[\u{1F980}-\u{1F9E0}]/gu, '');
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseText.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Check if the response indicates listing creation
      if (data?.action === "suggest_listing" && onCreateListing) {
        toast.success("Ready to create listing - fill in the form on the left");
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

  const handleBulkUpload = async () => {
    if (!bulkUploadUrl.trim()) {
      toast.error("Please enter a valid Google Drive URL");
      return;
    }

    // More permissive URL validation - accept any Google URL
    const isGoogleUrl = bulkUploadUrl.includes("google.com") || 
                        bulkUploadUrl.includes("googleapis.com") ||
                        bulkUploadUrl.includes("gstatic.com");
    
    if (!isGoogleUrl) {
      toast.error("Please enter a Google Drive or Google Docs link");
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
    setIsLoading(true);

    try {
      // Call the process-drive-upload edge function
      const { data, error } = await supabase.functions.invoke("process-drive-upload", {
        body: {
          driveUrl: bulkUploadUrl,
          userId: user?.id,
        },
      });

      if (error) throw error;

      const responseMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Perfect! I've received your Google Drive link.\n\n**Processing started...**\n\nI'll analyze and organize:\n\n• Project brochures - Auto-detect project name\n• Floor plans - Match to project\n• Renders and images - Group by project\n• Fact sheets - Extract pricing data\n• Payment plans - Link to project\n\nEach project will be organized separately.\nYou'll review before anything goes live.\nAutomatic developer detection enabled.\n\nI'll notify you once processing is complete.`,
        timestamp: new Date(),
        type: "processing",
      };
      setMessages((prev) => [...prev, responseMessage]);
      toast.success("Bulk upload initiated! Processing files...");

    } catch (error: any) {
      console.error("Bulk upload error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I encountered an issue processing the Google Drive link. Please ensure the link is accessible and try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      toast.error("Failed to process Google Drive link");
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      streamRef.current = stream;
      
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessingVoice(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          
          try {
            // Call voice-to-text edge function with language header
            const { data, error } = await supabase.functions.invoke('voice-to-text', {
              body: { audio: base64Audio, language: language },
            });
            
            if (error) throw error;
            
            if (data?.text) {
              setInput(data.text);
              toast.success("Voice transcribed! Review and send.");
            } else {
              toast.error(data?.error || "No speech detected. Please try again.");
            }
          } catch (err) {
            console.error("Transcription error:", err);
            toast.error("Failed to transcribe audio. Please type your message.");
          } finally {
            setIsProcessingVoice(false);
          }
        };
        
        reader.readAsDataURL(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info("Recording... Click again to stop", { duration: 2000 });
    } catch (error) {
      console.error("Failed to start recording:", error);
      toast.error("Could not access microphone. Please check permissions.");
    }
  }, [language]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
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
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearChat}
          className="h-8 w-8 p-0 text-zinc-500 hover:text-red-500 hover:bg-red-50"
          title="Clear chat"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-zinc-600">{t('listingAdminChat.online') || 'Online'}</span>
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
                    : message.type === "processing"
                    ? "bg-amber-50 text-zinc-800 border border-amber-200"
                    : message.type === "success"
                    ? "bg-green-50 text-zinc-800 border border-green-200"
                    : "bg-zinc-100 text-zinc-800"
                }`}
              >
                {message.type === "processing" && (
                  <div className="flex items-center gap-2 mb-2 text-amber-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-medium">{t('listingAdminChat.processing') || 'Processing...'}</span>
                  </div>
                )}
                {message.type === "success" && (
                  <div className="flex items-center gap-2 mb-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">{t('listingAdminChat.complete') || 'Complete'}</span>
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
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
                <span className="text-sm text-zinc-600">{t('listingAdminChat.typing') || 'Typing...'}</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Bulk Upload Section */}
      {showBulkUpload && (
        <div className="p-4 border-t border-zinc-200 bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
          <div className="flex items-center gap-2 mb-3">
            <FolderOpen className="w-5 h-5 text-gold" />
            <span className="font-medium text-black">{t('listingAdminChat.bulkUploadTitle') || 'Bulk Upload from Google Drive'}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBulkUpload(false)}
              className="ml-auto h-6 w-6 p-0 text-zinc-600 hover:text-black"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-zinc-600 mb-3">
            {t('listingAdminChat.bulkUploadDesc') || "Paste a Google Drive folder link. I'll automatically organize files by project and developer."}
          </p>
          <div className="flex gap-2">
            <Input
              value={bulkUploadUrl}
              onChange={(e) => setBulkUploadUrl(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/..."
              className="flex-1 bg-white border-zinc-300 text-black"
            />
            <Button 
              onClick={handleBulkUpload} 
              variant="primary" 
              size="sm"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-1" />
                  {t('listingAdminChat.process') || 'Process'}
                </>
              )}
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
            className={`h-10 w-10 p-0 ${showBulkUpload ? "text-gold bg-gold/10" : "text-zinc-600 hover:text-gold hover:bg-gold/10"}`}
            title="Bulk Upload from Google Drive"
          >
            <LinkIcon className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleRecording}
            disabled={isProcessingVoice}
            className={`h-10 w-10 p-0 transition-all ${
              isRecording 
                ? "text-red-500 bg-red-50 animate-pulse" 
                : isProcessingVoice
                ? "text-gold bg-gold/10"
                : "text-zinc-600 hover:text-gold hover:bg-gold/10"
            }`}
            title={isRecording ? t('listingAdminChat.stopRecording') || "Stop Recording" : isProcessingVoice ? t('listingAdminChat.processing') || "Processing..." : t('listingAdminChat.voiceMessage') || "Voice Message"}
          >
            {isProcessingVoice ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isRecording ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
            placeholder={t('listingAdminChat.askAnything') || "Ask Sarah anything about listings..."}
            className="flex-1 bg-zinc-50 border-zinc-300 text-black"
            disabled={isLoading || isRecording}
          />
          <Button
            onClick={() => handleSendMessage()}
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
        {isRecording && (
          <div className="flex items-center justify-center gap-2 mt-2 text-sm text-red-500">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span>{t('listingAdminChat.recording') || 'Recording... Click mic to stop'}</span>
          </div>
        )}
        {!isRecording && (
          <div className="flex items-center justify-center gap-1 mt-2 text-[10px] text-zinc-400">
            <span>{t('listingAdminChat.poweredByAI') || 'Powered by AI - Sarah can create listings, process bulk uploads, and answer questions'}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListingAdminChat;