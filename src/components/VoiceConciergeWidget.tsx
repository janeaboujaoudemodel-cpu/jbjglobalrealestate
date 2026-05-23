import { useState, useCallback, useEffect, useRef } from "react";
import { useConversation } from "@elevenlabs/react";
import { Phone, PhoneOff, X, Mic, Volume2, Sparkles, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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

type WidgetStatus = "idle" | "initializing" | "connected";

const VoiceConciergeWidget = () => {
  const [isMinimized, setIsMinimized] = useState(getInitialMinimized);
  const [isConnecting, setIsConnecting] = useState(false);
  const [currentCallLogId, setCurrentCallLogId] = useState<string | null>(null);
  const [widgetStatus, setWidgetStatus] = useState<WidgetStatus>("idle");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [choiceOpen, setChoiceOpen] = useState(false);
  const [showJoined, setShowJoined] = useState(false);
  const [supportSuppressed, setSupportSuppressed] = useState(false);
  const leadIdRef = useRef<string | null>(getStoredLeadId());
  const hasShownUnavailableToastRef = useRef(false);
  const callStartTimeRef = useRef<Date | null>(null);



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
      setWidgetStatus("idle");
      setStatusMessage("");
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

  useEffect(() => {
    const checkSuppression = () => {
      const conciergeOpen = document.body.getAttribute("data-jbj-concierge-open") === "true";
      const chatOpen = document.body.getAttribute("data-jbj-chat-open") === "true";
      const supportOpen = document.body.getAttribute("data-jbj-support-open") === "true";
      setSupportSuppressed(conciergeOpen || chatOpen || supportOpen);
    };
    checkSuppression();
    const obs = new MutationObserver(checkSuppression);
    obs.observe(document.body, { attributes: true, attributeFilter: ["data-jbj-concierge-open", "data-jbj-chat-open", "data-jbj-support-open"] });
    return () => obs.disconnect();
  }, []);

  // Any "close" action on the popover (X, outside click, toggle-off) collapses
  // the widget to the small phone icon and arms the 24h restore timer.
  const closeAndMinimize = useCallback(() => {
    setChoiceOpen(false);
    setIsMinimized(true);
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      // Silent fail
    }
  }, []);


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


      if (!data?.token && !data?.agentId) {
        throw new Error(data?.error || "Failed to prepare voice concierge");
      }

      // Start the conversation with WebRTC
      await conversation.startSession(
        data?.token
          ? { conversationToken: data.token, connectionType: "webrtc" }
          : { agentId: data.agentId, connectionType: "webrtc" }
      );

      // Log the call start
      const callLogId = await logCallStart(data.conversationId);
      if (callLogId) {
        setCurrentCallLogId(callLogId);
      }
    } catch (error) {
      console.error("Failed to start conversation:", error);
      setWidgetStatus("idle");
      setStatusMessage("");
      if (!hasShownUnavailableToastRef.current) {
        toast.info("Couldn't start the call. Please try again.");
        hasShownUnavailableToastRef.current = true;
      }
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, logCallStart]);

  const handleLauncherClick = useCallback(() => {
    setChoiceOpen((v) => {
      // Toggling open → just open. Toggling closed → minimize to phone icon.
      if (v) {
        setIsMinimized(true);
        try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch { /* noop */ }
        return false;
      }
      return true;
    });
  }, []);

  // Outside-click: collapse popover AND minimize to phone icon (24h).
  useEffect(() => {
    if (!choiceOpen) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (t.closest('[data-voice-popover="1"]')) return;
      if (t.closest('[data-floating-launcher="voice-concierge"]')) return;
      if (t.closest('[data-floating-launcher="voice-concierge-mobile"]')) return;
      closeAndMinimize();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown, { passive: true });
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, [choiceOpen, closeAndMinimize]);


  const handleStartVoice = useCallback(() => {
    setChoiceOpen(false);
    const existing = leadIdRef.current ?? getStoredLeadId();
    if (existing) {
      leadIdRef.current = existing;
      startConversation(existing);
    } else {
      openIntake();
    }
  }, [startConversation]);

  const handleOpenWhatsApp = useCallback(() => {
    setChoiceOpen(false);
    window.open(WHATSAPP_URL, "_blank", "noopener,noreferrer");
  }, []);

  const handleIntakeSuccess = useCallback((leadId: string) => {
    leadIdRef.current = leadId;
    setIntakeOpen(false);
    startConversation(leadId);
  }, [startConversation]);


  const stopConversation = useCallback(async () => {
    // Log call end before stopping
    if (currentCallLogId) {
      await logCallEnd(currentCallLogId);
      setCurrentCallLogId(null);
    }
    await conversation.endSession();
  }, [conversation, currentCallLogId, logCallEnd]);

  const isConnected = conversation.status === "connected";

  if (supportSuppressed && !isConnected && !intakeOpen) return null;

  // Render immediately — don't wait for auth check (prevents blank/invisible widget).
  // The button itself swaps to "Login to speak" once we know the user isn't authenticated.

  // Shared mother-of-pearl surface (used by launcher + minimized FAB + popover icons).
  // Iridescent champagne with pearl-white highlight, inset rim for 3D, gold halo on hover.
  const pearlBg =
    "radial-gradient(ellipse at 28% 18%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 55%)," +
    "radial-gradient(ellipse at 78% 82%, rgba(184,149,85,0.22) 0%, rgba(184,149,85,0) 60%)," +
    "linear-gradient(135deg, #FDFBF7 0%, #F5EBD9 38%, #E8D9BC 68%, #F2E6CE 100%)";
  const pearlShadow =
    "inset 0 1px 0 rgba(255,255,255,0.95)," +
    "inset 0 -1px 0 rgba(184,149,85,0.20)," +
    "0 10px 28px -12px rgba(26,26,26,0.32)," +
    "0 2px 6px -2px rgba(184,149,85,0.22)";
  const pearlShadowHover =
    "inset 0 1px 0 rgba(255,255,255,0.98)," +
    "inset 0 -1px 0 rgba(184,149,85,0.28)," +
    "0 0 0 1px rgba(184,149,85,0.55)," +
    "0 16px 40px -10px rgba(184,149,85,0.45)," +
    "0 4px 10px -2px rgba(26,26,26,0.25)";

  // Minimized state - small phone icon button (mother-of-pearl, lowered to corner)
  // Also used as the permanent mobile launcher (mobile = always icon-only).
  if (isMinimized) {
    return (
      <button
        onClick={handleRestore}
        data-floating-launcher="voice-concierge"
        className="group fixed bottom-6 right-6 z-[10060] w-12 h-12 rounded-full flex items-center justify-center border border-[#B89555]/60 text-[#1A1A1A] transition-all duration-300 hover:scale-[1.06]"
        style={{ background: pearlBg, boxShadow: pearlShadow }}
        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = pearlShadowHover; }}
        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = pearlShadow; }}
        aria-label="Show voice concierge"
      >
        <Phone className="w-[18px] h-[18px] text-[#1A1A1A]" strokeWidth={2} />
      </button>
    );
  }


  const showStatusPill = widgetStatus === "initializing";
  const pillTone = "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/40";

  return (
    <>
      {/* MOBILE: always icon-only launcher (no "Speak to concierge" label, no X) */}
      <button
        onClick={handleLauncherClick}
        data-floating-launcher="voice-concierge-mobile"
        className="sm:hidden fixed bottom-6 right-6 z-[10060] w-12 h-12 rounded-full flex items-center justify-center border border-[#B89555]/60 text-[#1A1A1A] transition-all duration-300 hover:scale-[1.06]"
        style={{ background: pearlBg, boxShadow: pearlShadow }}
        aria-label="Speak to concierge"
        aria-expanded={choiceOpen}
      >
        {isConnecting ? (
          <span className="w-4 h-4 border-2 border-[#1A1A1A]/20 border-t-[#1A1A1A] rounded-full animate-spin" />
        ) : (
          <Phone className="w-[18px] h-[18px] text-[#1A1A1A]" strokeWidth={2} />
        )}
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
      </button>

      {/* Shared Choice popover: voice or WhatsApp — anchored above launcher for mobile & desktop */}
      {choiceOpen && !isConnected && (
        <div
          data-voice-popover="1"
          className="fixed bottom-[84px] right-6 z-[10061] w-64 rounded-2xl border border-[#B89555]/45 overflow-hidden text-[#1A1A1A]"
          style={{ background: pearlBg, boxShadow: pearlShadow }}
        >
          <div className="px-3 py-2 border-b border-[#B89555]/20 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/65">Concierge · Complimentary</span>
            <button onClick={closeAndMinimize} aria-label="Close" className="text-[#1A1A1A]/50 hover:text-[#1A1A1A]">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleStartVoice}
            className="w-full flex items-center gap-3 px-3 py-3 hover:bg-white/40 transition-colors text-left"
          >
            <span
              className="flex items-center justify-center w-9 h-9 rounded-full border border-[#B89555]/55 text-[#1A1A1A]"
              style={{ background: pearlBg, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(184,149,85,0.18)" }}
            >
              <Phone className="w-4 h-4" strokeWidth={2} />
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-semibold">Live agent call</span>
              <span className="text-[11px] text-[#1A1A1A]/65">Voice line, instant pickup</span>
            </span>
          </button>
          <div className="h-px bg-[#B89555]/15" />
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleOpenWhatsApp}
            className="w-full flex items-center gap-3 px-3 py-3 hover:bg-white/40 transition-colors text-left"
          >
            <span
              className="flex items-center justify-center w-9 h-9 rounded-full border border-[#B89555]/55 text-[#1A1A1A]"
              style={{ background: pearlBg, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(184,149,85,0.18)" }}
            >
              <MessageCircle className="w-4 h-4" strokeWidth={2} />
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-semibold">WhatsApp us</span>
              <span className="text-[11px] text-[#1A1A1A]/65">{COMPANY_NAP.phoneDisplay}</span>
            </span>
          </a>
        </div>
      )}


      {/* TABLET / DESKTOP: full pill with label + X-to-minimize */}
      <div data-floating-launcher="voice-concierge" className="hidden sm:flex fixed bottom-6 right-6 z-[10060] flex-col items-end gap-2">

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
          <span>{statusMessage || "Initializing…"}</span>
        </div>
      )}

      {/* Choice popover moved to top-level fragment so it shows for both mobile + desktop launchers */}


      <div className="relative">


      {/* Speaking indicator ring */}
      {conversation.isSpeaking && (
        <span className="absolute inset-0 rounded-full bg-[#EFE6D6]/60 animate-pulse" />
      )}

      {/* Close/minimize button - clicking X turns it into phone icon */}
      <button
        onClick={closeAndMinimize}
        className="absolute -top-2 -right-2 w-6 h-6 bg-[#EFE6D6] hover:bg-[#F7F2EA] text-[#1A1A1A]/70 hover:text-[#1A1A1A] rounded-full shadow-md flex items-center justify-center transition-colors z-10"
        aria-label="Minimize voice concierge"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Main launcher: mother-of-pearl premium pill — no "Free" text (kept in popover header) */}
      {!isConnected ? (
        <button
          onClick={handleLauncherClick}
          disabled={isConnecting}
          className="group relative flex items-center gap-2.5 pl-2 pr-4 py-1.5 rounded-full border border-[#B89555]/55 text-[#1A1A1A] disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 hover:-translate-y-0.5"
          style={{ background: pearlBg, boxShadow: pearlShadow }}
          onMouseEnter={(e) => { if (!isConnecting) e.currentTarget.style.boxShadow = pearlShadowHover; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = pearlShadow; }}
          aria-label="Complimentary live call with our agent"
          aria-expanded={choiceOpen}
        >
          <span
            className="relative flex items-center justify-center w-7 h-7 rounded-full border border-[#B89555]/55"
            style={{ background: pearlBg, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(184,149,85,0.18)" }}
          >
            {isConnecting ? (
              <span className="w-3 h-3 border-2 border-[#1A1A1A]/20 border-t-[#1A1A1A] rounded-full animate-spin" />
            ) : (
              <Phone className="w-3.5 h-3.5 text-[#1A1A1A]" strokeWidth={2.1} />
            )}
            {/* live dot — quiet pearl-edge badge */}
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
          </span>
          <span className="inline-flex items-center leading-none">
            <span className="text-[13px] font-semibold tracking-tight text-[#1A1A1A]">
              {isConnecting ? "Connecting…" : "Speak to concierge"}
            </span>
          </span>
        </button>

      ) : (
        <div className="relative flex items-center gap-2 text-[#1A1A1A] pl-4 pr-2 py-2 rounded-full border border-[#B89555]/55"
             style={{ background: pearlBg, boxShadow: pearlShadow }}>
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

      </div>

      {/* Shared intake modal (works for both mobile icon launcher and desktop pill) */}
      <VoiceConciergeIntakeModal
        open={intakeOpen}
        onOpenChange={setIntakeOpen}
        onSuccess={handleIntakeSuccess}
      />
    </>
  );
};


export default VoiceConciergeWidget;
