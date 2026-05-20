import { useState, useCallback, useEffect, useRef } from "react";
import { useConversation } from "@elevenlabs/react";
import { Phone, PhoneOff, X, Mic, Volume2, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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

type WidgetStatus = "idle" | "initializing" | "connected" | "unavailable";

const VoiceConciergeWidget = () => {
  const [isMinimized, setIsMinimized] = useState(getInitialMinimized);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentCallLogId, setCurrentCallLogId] = useState<string | null>(null);
  const [widgetStatus, setWidgetStatus] = useState<WidgetStatus>("idle");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const hasShownUnavailableToastRef = useRef(false);
  const callStartTimeRef = useRef<Date | null>(null);
  const navigate = useNavigate();

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Log call start to database
  const logCallStart = useCallback(async (conversationId?: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;

      const { data, error } = await supabase
        .from('voice_call_logs')
        .insert({
          user_id: session.user.id,
          conversation_id: conversationId || null,
          started_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) {
        console.error('Failed to log call start:', error);
        return null;
      }

      callStartTimeRef.current = new Date();
      return data?.id || null;
    } catch (error) {
      console.error('Error logging call start:', error);
      return null;
    }
  }, []);

  // Log call end to database
  const logCallEnd = useCallback(async (callLogId: string) => {
    try {
      if (!callStartTimeRef.current) return;

      const endTime = new Date();
      const durationSeconds = Math.round((endTime.getTime() - callStartTimeRef.current.getTime()) / 1000);

      const { error } = await supabase
        .from('voice_call_logs')
        .update({
          ended_at: endTime.toISOString(),
          duration_seconds: durationSeconds,
        })
        .eq('id', callLogId);

      if (error) {
        console.error('Failed to log call end:', error);
      }

      callStartTimeRef.current = null;
    } catch (error) {
      console.error('Error logging call end:', error);
    }
  }, []);

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to JBJ Global Real Estate Concierge");
      toast.success("Connected to concierge");
    },
    onDisconnect: () => {
      console.log("Disconnected from concierge");
      // Log call end when disconnected
      if (currentCallLogId) {
        logCallEnd(currentCallLogId);
        setCurrentCallLogId(null);
      }
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

  const handleLoginRedirect = () => {
    toast.info("Please log in to use the voice concierge");
    navigate("/auth");
  };

  const startConversation = useCallback(async () => {
    // Check authentication before proceeding
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please log in to use the voice concierge");
      navigate("/auth");
      return;
    }

    setIsConnecting(true);
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get token from edge function (auth header passed automatically)
      const { data, error } = await supabase.functions.invoke(
        "elevenlabs-conversation-token"
      );

      if (error) {
        if (error.message?.includes("Authentication")) {
          toast.error("Please log in to use the voice concierge");
          navigate("/auth");
          return;
        }
        throw new Error(error.message || "Failed to get conversation token");
      }

      // Graceful fallback when the edge function returned a 200 with `fallback: true`
      // (e.g. invalid/expired ElevenLabs API key). Log internally only — never expose
      // infra/API-key errors to end users.
      if (data?.fallback || !data?.token) {
        console.warn("[VoiceConcierge] unavailable:", data?.error || "no token");
        toast.info("Voice concierge is unavailable right now. Please try again shortly.");
        return;
      }

      // Start the conversation with WebRTC
      const session = await conversation.startSession({
        conversationToken: data.token,
        connectionType: "webrtc",
      });

      // Log the call start
      const callLogId = await logCallStart(data.conversationId);
      if (callLogId) {
        setCurrentCallLogId(callLogId);
      }
    } catch (error) {
      console.error("Failed to start conversation:", error);
      // Never surface raw infra errors (API key, quota, etc.) to end users.
      const msg = error instanceof Error ? error.message : "";
      const isInfra = /api[\s_-]?key|elevenlabs|unauthor|quota|invalid|expired|token/i.test(msg);
      toast.info(
        isInfra
          ? "Voice concierge is unavailable right now. Please try again shortly."
          : "Couldn't start the call. Please try again."
      );
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, navigate, logCallStart]);

  const stopConversation = useCallback(async () => {
    // Log call end before stopping
    if (currentCallLogId) {
      await logCallEnd(currentCallLogId);
      setCurrentCallLogId(null);
    }
    await conversation.endSession();
  }, [conversation, currentCallLogId, logCallEnd]);

  const isConnected = conversation.status === "connected";

  // Render immediately — don't wait for auth check (prevents blank/invisible widget).
  // The button itself swaps to "Login to speak" once we know the user isn't authenticated.

  // Minimized state - small phone icon button (no pulse, no text)
  if (isMinimized) {
    return (
      <button
        onClick={handleRestore}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-[#EFE6D6] hover:bg-[#EFE6D6]-light text-[#1A1A1A]-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center"
        aria-label="Show voice concierge"
      >
        <Phone className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Pulse ring - only when not connected and not minimized */}
      {!isConnected && (
        <>
          <span className="absolute inset-0 rounded-full bg-[#EFE6D6]/40 animate-ping" />
          <span className="absolute inset-0 rounded-full bg-[#EFE6D6]/20 animate-pulse" />
        </>
      )}
      
      {/* Speaking indicator ring */}
      {conversation.isSpeaking && (
        <span className="absolute inset-0 rounded-full bg-[#EFE6D6]/60 animate-pulse" />
      )}
      
      {/* Close/minimize button - clicking X turns it into phone icon */}
      <button
        onClick={handleMinimize}
        className="absolute -top-2 -right-2 w-6 h-6 bg-[#1A1A1A] hover:bg-[#1A1A1A] text-white/70 hover:text-white rounded-full shadow-md flex items-center justify-center transition-colors z-10"
        aria-label="Minimize voice concierge"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      
      {/* Main button - shows login prompt for unauthenticated users */}
      {!isAuthenticated ? (
        <button
          onClick={handleLoginRedirect}
          className="relative flex items-center gap-2 bg-[#EFE6D6] hover:bg-[#EFE6D6]-light text-[#1A1A1A]-foreground px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
          aria-label="Login to use voice concierge"
        >
          <LogIn className="w-5 h-5" />
          <span className="font-medium text-sm">
            Login to speak
          </span>
        </button>
      ) : !isConnected ? (
        <button
          onClick={startConversation}
          disabled={isConnecting}
          className="relative flex items-center gap-2 bg-[#EFE6D6] hover:bg-[#EFE6D6]-light text-[#1A1A1A]-foreground px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group disabled:opacity-70 disabled:cursor-not-allowed"
          aria-label="Start voice call with concierge"
        >
          {isConnecting ? (
            <>
              <div className="w-6 h-6 border-2 border-[#B89555]-foreground/30 border-t-gold-foreground rounded-full animate-spin" />
              <span className="font-medium text-sm">
                Connecting...
              </span>
            </>
          ) : (
            <>
              <Phone className="w-6 h-6" />
              <span className="font-medium text-sm">
                Speak with us
              </span>
            </>
          )}
        </button>
      ) : (
        <div className="relative flex items-center gap-2 bg-[#EFE6D6] text-[#1A1A1A]-foreground pl-4 pr-2 py-2 rounded-full shadow-lg">
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
