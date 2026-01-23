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
  Copy,
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
      toast.error("Please enter a valid URL");
      return;
    }

    // Accept Google URLs, property portals, or any https URL
    const isValidUrl = bulkUploadUrl.startsWith("http://") || bulkUploadUrl.startsWith("https://");
    
    if (!isValidUrl) {
      toast.error("Please enter a valid URL (Google Drive, property portal, or web link)");
      return;
    }

    const isGoogleUrl = bulkUploadUrl.includes("google.com");
    const isPropertyPortal = bulkUploadUrl.includes("bayut.com") || 
                             bulkUploadUrl.includes("propertyfinder.ae") || 
                             bulkUploadUrl.includes("dubizzle.com");
    const isDeveloperSite = bulkUploadUrl.includes("emaar.com") || 
                            bulkUploadUrl.includes("damac") ||
                            bulkUploadUrl.includes("sobha") ||
                            bulkUploadUrl.includes("azizi");

    onBulkUpload?.(bulkUploadUrl);
    
    const uploadMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: `I'd like to extract listing data from this link: ${bulkUploadUrl}`,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, uploadMessage]);
    const urlToProcess = bulkUploadUrl;
    setBulkUploadUrl("");
    setShowBulkUpload(false);
    setIsLoading(true);

    try {
      // Call the new extract-listing-from-link edge function with Firecrawl
      const { data, error } = await supabase.functions.invoke("extract-listing-from-link", {
        body: {
          url: urlToProcess,
          userId: user?.id,
          albumName: null, // Will be extracted from URL
        },
      });

      if (error) throw error;

      let responseContent = "";
      
      if (data?.success && data?.extractedProject) {
        const p = data.extractedProject;
        const keyFeatures = data.keyFeatures || [];
        const mediaCount = data.mediaCount || { images: 0, pdfs: 0 };
        
        responseContent = `**Link processed successfully!**

---

**Project Name**: ${p.name || "Not detected"}
**Developer**: ${p.developer || "Not detected"}
**Location**: ${p.location || "Not specified"}, ${p.emirate || "Dubai"}

**Price Range**: ${p.priceFrom ? `AED ${(p.priceFrom/1000000).toFixed(1)}M` : "TBD"} - ${p.priceTo ? `AED ${(p.priceTo/1000000).toFixed(1)}M` : "TBD"}
**Bedrooms**: ${p.bedroomsMin || "?"} - ${p.bedroomsMax || "?"} BR
**Handover**: ${p.handoverDate || "Not specified"}
**Status**: ${p.projectStatus || "Off-Plan"}

**Description**:
${p.description || "No description extracted. Please add manually."}

${p.amenities?.length > 0 ? `**Amenities**:\n${p.amenities.map((a: string) => `- ${a}`).join("\n")}` : ""}

${keyFeatures.length > 0 ? `**Key Features**:\n${keyFeatures.map((f: string) => `- ${f}`).join("\n")}` : ""}

${p.paymentPlan ? `**Payment Plan**: ${p.paymentPlan}` : ""}

${p.unitTypes?.length > 0 ? `**Unit Types Available**:\n${p.unitTypes.map((u: string) => `- ${u}`).join("\n")}` : ""}

**Media Extracted**:
- Images: ${mediaCount.images} photos
- Brochure: ${p.brochureUrl ? "Yes" : "No"}
- Floor Plans: ${p.floorPlanUrls?.length || 0}
- Video: ${p.videoUrl ? "Yes" : "No"}

---

**Next Steps:**
1. Click "Add New Project" on the left panel
2. Review and fill in any missing details
3. Upload the extracted images (${mediaCount.images} found)
4. Save as draft for review

Would you like me to help with any specific details or create another listing from a different album?`;
      } else {
        responseContent = `I've received the link and started processing.

**Link**: ${urlToProcess}
**Status**: Processing...

${data?.error ? `**Note**: ${data.error}` : ""}

The extraction may take a moment. You can:
1. Click "Add New Project" to start manually
2. Wait for the extraction to complete
3. Share additional details about this project

How would you like to proceed?`;
      }

      const responseMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseContent,
        timestamp: new Date(),
        type: data?.success ? "success" : "processing",
      };
      setMessages((prev) => [...prev, responseMessage]);
      
      if (data?.success) {
        toast.success("Link processed! Review the extracted data.");
      } else {
        toast.info("Processing link...");
      }

    } catch (error: any) {
      console.error("Link processing error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I encountered an issue processing the link. 

**Error**: ${error.message || "Unknown error"}

Please try:
1. Checking if the link is accessible
2. Using a different link format
3. Manually creating the listing using "Add New Project"

Would you like to try a different approach?`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      toast.error("Failed to process link. Try manually creating the listing.");
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
    <div className="flex flex-col h-full bg-white overflow-hidden">
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
              className={`flex gap-3 group ${message.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {message.role === "assistant" && (
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={adminPersona?.avatar} alt={adminPersona?.name} />
                  <AvatarFallback className="bg-gold/20 text-gold text-xs">SM</AvatarFallback>
                </Avatar>
              )}
              <div className="flex flex-col max-w-[80%]">
                <div
                  className={`rounded-xl px-4 py-2.5 select-text cursor-text ${
                    message.role === "user"
                      ? "bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] text-black border border-gold/30 shadow-md rounded-tr-sm"
                      : message.type === "processing"
                      ? "bg-amber-50 text-black border border-amber-200 rounded-tl-sm"
                      : message.type === "success"
                      ? "bg-green-50 text-black border border-green-200 rounded-tl-sm"
                      : "bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] text-black border border-gold/20 shadow-sm rounded-tl-sm"
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
                  <p className="text-sm whitespace-pre-wrap leading-relaxed select-text">{message.content}</p>
                  <p className="text-[10px] mt-1 opacity-60 select-none">
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {/* Copy Button */}
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(message.content);
                    toast.success(t('chat.messageCopied') || 'Message copied');
                  }}
                  className={`flex items-center gap-1 mt-1 text-[10px] text-zinc-400 hover:text-zinc-700 transition-colors opacity-0 group-hover:opacity-100 ${
                    message.role === "user" ? "self-end mr-1" : "self-start ml-1"
                  }`}
                >
                  <Copy className="w-3 h-3" />
                  <span>{t('chat.copy') || 'Copy'}</span>
                </button>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src={adminPersona?.avatar} alt={adminPersona?.name} />
                <AvatarFallback className="bg-gold/20 text-gold text-xs">SM</AvatarFallback>
              </Avatar>
              <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] rounded-xl px-4 py-3 flex items-center gap-2 border border-gold/20">
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
            <span className="font-medium text-black">{t('listingAdminChat.bulkUploadTitle') || 'Extract Listing from URL'}</span>
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
            {t('listingAdminChat.bulkUploadDesc') || "Paste any link: Google Drive, Bayut, PropertyFinder, Dubizzle, or developer websites. I'll extract the project data automatically."}
          </p>
          <div className="flex gap-2">
            <Input
              value={bulkUploadUrl}
              onChange={(e) => setBulkUploadUrl(e.target.value)}
              placeholder="https://drive.google.com/... or https://bayut.com/..."
              className="flex-1 bg-white border-zinc-300 text-black"
            />
            <Button 
              onClick={handleBulkUpload} 
              variant="primary" 
              size="sm"
              disabled={isLoading || !bulkUploadUrl.trim()}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-1" />
                  {t('listingAdminChat.extract') || 'Extract'}
                </>
              )}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded">Google Drive</span>
            <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded">Bayut</span>
            <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 rounded">PropertyFinder</span>
            <span className="text-[10px] px-2 py-0.5 bg-orange-100 text-orange-700 rounded">Developer Sites</span>
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