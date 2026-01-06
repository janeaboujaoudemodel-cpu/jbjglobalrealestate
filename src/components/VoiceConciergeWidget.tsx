import { useState, useCallback } from "react";
import { useConversation } from "@elevenlabs/react";
import { Phone, PhoneOff, X, Mic, Volume2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STORAGE_KEY = "jj_voice_concierge_minimized_at";
const RESTORE_AFTER_MS = 24 * 60 * 60 * 1000; // 24 hours

const getInitialMinimized = (): boolean => {
  try {
    const minimizedAt = localStorage.getItem(STORAGE_KEY);
    if (!minimizedAt) return false;
    
    const elapsed = Date.now() - parseInt(minimizedAt, 10);
    if (elapsed >= RESTORE_AFTER_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

const VoiceConciergeWidget = () => {
  const [isMinimized, setIsMinimized] = useState(getInitialMinimized);
  const [isConnecting, setIsConnecting] = useState(false);

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to JJ Global Capital Concierge");
      toast.success("Connected to concierge");
    },
    onDisconnect: () => {
      console.log("Disconnected from concierge");
    },
    onMessage: (message) => {
      console.log("Concierge message:", message);
    },
    onError: (error) => {
      console.error("Concierge error:", error);
      toast.error("Connection error. Please try again.");
    },
  });

  const handleMinimize = () => {
    setIsMinimized(true);
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      // Silent fail
    }
  };

  const handleRestore = () => {
    setIsMinimized(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Silent fail
    }
  };

  const startConversation = useCallback(async () => {
    setIsConnecting(true);
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get token from edge function
      const { data, error } = await supabase.functions.invoke(
        "elevenlabs-conversation-token"
      );

      if (error) {
        throw new Error(error.message || "Failed to get conversation token");
      }

      if (!data?.token) {
        throw new Error("No token received");
      }

      // Start the conversation with WebRTC
      await conversation.startSession({
        conversationToken: data.token,
        connectionType: "webrtc",
      });
    } catch (error) {
      console.error("Failed to start conversation:", error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : "Failed to connect. Please try again."
      );
    } finally {
      setIsConnecting(false);
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  const isConnected = conversation.status === "connected";

  // Minimized state - small icon button
  if (isMinimized) {
    return (
      <button
        onClick={handleRestore}
        className="fixed bottom-6 right-6 z-50 w-10 h-10 bg-gold hover:bg-gold-light text-gold-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center"
        aria-label="Show voice concierge"
      >
        <Phone className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Pulse ring - only when not connected */}
      {!isConnected && (
        <>
          <span className="absolute inset-0 rounded-full bg-gold/40 animate-ping" />
          <span className="absolute inset-0 rounded-full bg-gold/20 animate-pulse" />
        </>
      )}
      
      {/* Speaking indicator ring */}
      {conversation.isSpeaking && (
        <span className="absolute inset-0 rounded-full bg-gold/60 animate-pulse" />
      )}
      
      {/* Close/minimize button */}
      <button
        onClick={handleMinimize}
        className="absolute -top-2 -right-2 w-6 h-6 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-full shadow-md flex items-center justify-center transition-colors z-10"
        aria-label="Minimize voice concierge"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      
      {/* Main button */}
      {!isConnected ? (
        <button
          onClick={startConversation}
          disabled={isConnecting}
          className="relative flex items-center gap-2 bg-gold hover:bg-gold-light text-gold-foreground px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group disabled:opacity-70 disabled:cursor-not-allowed"
          aria-label="Start voice call with concierge"
        >
          {isConnecting ? (
            <>
              <div className="w-6 h-6 border-2 border-gold-foreground/30 border-t-gold-foreground rounded-full animate-spin" />
              <span className="font-medium text-sm hidden sm:inline">
                Connecting...
              </span>
            </>
          ) : (
            <>
              <Phone className="w-6 h-6" />
              <span className="font-medium text-sm hidden sm:inline group-hover:inline">
                Speak with us
              </span>
            </>
          )}
        </button>
      ) : (
        <div className="relative flex items-center gap-2 bg-gold text-gold-foreground pl-4 pr-2 py-2 rounded-full shadow-lg">
          {/* Status indicator */}
          <div className="flex items-center gap-2">
            {conversation.isSpeaking ? (
              <Volume2 className="w-5 h-5 animate-pulse" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
            <span className="font-medium text-sm">
              {conversation.isSpeaking ? "Speaking..." : "Listening..."}
            </span>
          </div>
          
          {/* End call button */}
          <button
            onClick={stopConversation}
            className="ml-2 w-8 h-8 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition-colors"
            aria-label="End call"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default VoiceConciergeWidget;
