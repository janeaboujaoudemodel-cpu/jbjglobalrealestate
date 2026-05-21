import { useState, useCallback, useEffect, useRef } from "react";
import { useConversation } from "@elevenlabs/react";
import { Phone, PhoneOff, X, Mic, Volume2, Sparkles, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import VoiceConciergeIntakeModal from "@/components/voice-concierge/VoiceConciergeIntakeModal";
import { COMPANY_NAP } from "@/config/companyNAP";

const LEAD_STORAGE_KEY = "voice_concierge_lead";
const LEAD_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const WHATSAPP_URL = `https://wa.me/${COMPANY_NAP.phoneE164.replace(/[^0-9]/g, "")}?text=${encodeURIComponent("Hi JBJ — I'd like to speak with the concierge.")}`;


function getStoredLeadId(): string | null {
  try {
    const raw = localStorage.getItem(LEAD_STORAGE_KEY);
    if (!raw) return null;
    const { id, at } = JSON.parse(raw);
    if (!id || !at) return null;
    if (Date.now() - at > LEAD_TTL_MS) {
      localStorage.removeItem(LEAD_STORAGE_KEY);
      return null;
    }
    return id;
  } catch { return null; }
}


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
  const [currentCallLogId, setCurrentCallLogId] = useState<string | null>(null);
  const [widgetStatus, setWidgetStatus] = useState<WidgetStatus>("idle");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [choiceOpen, setChoiceOpen] = useState(false);
  const [showJoined, setShowJoined] = useState(false);
  const leadIdRef = useRef<string | null>(getStoredLeadId());
  const hasShownUnavailableToastRef = useRef(false);
  const callStartTimeRef = useRef<Date | null>(null);
  const navigate = useNavigate();



  // (Auth no longer required to use the voice concierge; intake form is the gate.)


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
      setWidgetStatus("connected");
      setStatusMessage("");
      hasShownUnavailableToastRef.current = false;
      setShowJoined(true);
      window.setTimeout(() => setShowJoined(false), 4500);
      toast.success("Your concierge has joined — premium line connected");
    },

    onDisconnect: () => {
      console.log("Disconnected from concierge");
      setWidgetStatus("idle");
      setStatusMessage("");
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
      setWidgetStatus("unavailable");
      setStatusMessage("Connection error");
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

  const openIntake = () => setIntakeOpen(true);

  const startConversation = useCallback(async (leadId: string) => {
    setIsConnecting(true);
    setWidgetStatus("initializing");
    setStatusMessage("Opening private line…");
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const { data, error } = await supabase.functions.invoke(
        "elevenlabs-conversation-token",
        { body: { lead_id: leadId } }
      );

      if (error) {
        throw new Error(error.message || "Failed to get conversation token");
      }


      // Graceful fallback when the edge function returned a 200 with `fallback: true`
      if (data?.fallback || !data?.token) {
        console.warn("[VoiceConcierge] unavailable:", data?.error || "no token");
        setWidgetStatus("unavailable");
        setStatusMessage("Unavailable");
        if (!hasShownUnavailableToastRef.current) {
          toast.info("Voice concierge is unavailable right now. Please try again shortly.");
          hasShownUnavailableToastRef.current = true;
        }
        return;
      }

      // Start the conversation with WebRTC
      const sessionResult = await conversation.startSession({
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
      const msg = error instanceof Error ? error.message : "";
      const isInfra = /api[\s_-]?key|elevenlabs|unauthor|quota|invalid|expired|token/i.test(msg);
      setWidgetStatus("unavailable");
      setStatusMessage("Unavailable");
      if (!hasShownUnavailableToastRef.current) {
        toast.info(
          isInfra
            ? "Voice concierge is unavailable right now. Please try again shortly."
            : "Couldn't start the call. Please try again."
        );
        hasShownUnavailableToastRef.current = true;
      }
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, navigate, logCallStart]);

  const handleStartClick = useCallback(() => {
    const existing = leadIdRef.current ?? getStoredLeadId();
    if (existing) {
      leadIdRef.current = existing;
      startConversation(existing);
    } else {
      openIntake();
    }
  }, [startConversation]);

  const handleIntakeSuccess = useCallback((leadId: string) => {
    leadIdRef.current = leadId;
    setIntakeOpen(false);
    startConversation(leadId);
  }, [startConversation]);

  const retryConnection = useCallback(() => {
    setWidgetStatus("idle");
    setStatusMessage("");
    hasShownUnavailableToastRef.current = false;
    handleStartClick();
  }, [handleStartClick]);


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

  const showStatusPill = widgetStatus === "initializing" || widgetStatus === "unavailable";
  const pillTone =
    widgetStatus === "unavailable"
      ? "bg-[#FEE2E2] text-[#7F1D1D] border-red-300"
      : "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/40";

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Visible status pill */}
      {showStatusPill && (
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold shadow-md ${pillTone}`}
          role="status"
          aria-live="polite"
        >
          {widgetStatus === "initializing" && (
            <span className="w-2 h-2 rounded-full bg-[#B89555] animate-pulse" />
          )}
          {widgetStatus === "unavailable" && (
            <span className="w-2 h-2 rounded-full bg-red-500" />
          )}
          <span>{statusMessage || (widgetStatus === "initializing" ? "Initializing…" : "Unavailable")}</span>
          {widgetStatus === "unavailable" && (
            <button
              type="button"
              onClick={retryConnection}
              className="ml-1 px-2 py-0.5 rounded-full bg-[#1A1A1A] text-white text-[10px] font-semibold hover:bg-[#1A1A1A]/85"
            >
              Try again
            </button>
          )}
        </div>
      )}

      <div className="relative">

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
      
      {/* Main button: opens intake form (gate) or connects directly if returning */}
      {!isConnected ? (
        <button
          onClick={handleStartClick}
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

      {showJoined && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-[#1A1A1A] text-white text-xs font-medium shadow-xl border border-[#B89555]/40 whitespace-nowrap">
          <Sparkles className="w-3.5 h-3.5 text-[#B89555]" />
          Your concierge has joined — premium line connected
          <span className="w-1.5 h-1.5 rounded-full bg-[#B89555] animate-pulse ml-1" />
        </div>
      )}


      <VoiceConciergeIntakeModal
        open={intakeOpen}
        onOpenChange={setIntakeOpen}
        onSuccess={handleIntakeSuccess}
      />
    </div>
  );
};


export default VoiceConciergeWidget;
