import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ContentSecurityContextType {
  sessionToken: string | null;
  deviceFingerprint: string | null;
  isSessionValid: boolean;
  watermarkId: string | null;
  generateWatermark: (contentId: string, contentType: string) => Promise<string>;
  logContentAccess: (contentId: string, contentType: string) => Promise<void>;
  validateSession: () => Promise<boolean>;
  terminateSession: () => Promise<void>;
}

const ContentSecurityContext = createContext<ContentSecurityContextType | undefined>(undefined);

// Generate a unique device fingerprint based on browser characteristics
const generateDeviceFingerprint = (): string => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.fillText("fingerprint", 2, 2);
  }
  const canvasHash = canvas.toDataURL();
  
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 0,
    canvasHash.slice(-50),
  ];
  
  // Simple hash function
  const str = components.join("|");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, "0");
};

// Generate unique watermark ID for content tracking
const generateWatermarkId = (userId: string, contentId: string): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  const userHash = userId.slice(-8);
  return `WM-${userHash}-${timestamp}-${random}`.toUpperCase();
};

// Generate session token
const generateSessionToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, "0")).join("");
};

export function ContentSecurityProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [deviceFingerprint, setDeviceFingerprint] = useState<string | null>(null);
  const [isSessionValid, setIsSessionValid] = useState(false);

  useEffect(() => {
    if (user) {
      initializeSession();
    } else {
      setSessionToken(null);
      setIsSessionValid(false);
    }
  }, [user]);

  // Prevent right-click and keyboard shortcuts for copying
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-protected]")) {
        e.preventDefault();
        toast.warning("Content is protected. Copying is not allowed.");
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-protected]")) {
        // Prevent Ctrl+C, Ctrl+S, Ctrl+P, PrtScn
        if ((e.ctrlKey || e.metaKey) && ["c", "s", "p"].includes(e.key.toLowerCase())) {
          e.preventDefault();
          toast.warning("Content is protected. This action is not allowed.");
        }
        if (e.key === "PrintScreen") {
          e.preventDefault();
          toast.warning("Screenshots are not allowed for protected content.");
        }
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const initializeSession = async () => {
    if (!user) return;

    const fingerprint = generateDeviceFingerprint();
    setDeviceFingerprint(fingerprint);

    // Check for existing active session
    const { data: existingSessions } = await supabase
      .from("course_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1);

    if (existingSessions && existingSessions.length > 0) {
      const session = existingSessions[0];
      
      // Check if device fingerprint matches
      if (session.device_fingerprint !== fingerprint) {
        // Different device detected - flag as suspicious
        await supabase
          .from("course_sessions")
          .update({ 
            suspicious_activity: true,
            suspicious_reason: "Access attempt from different device"
          })
          .eq("id", session.id);
        
        toast.error(
          "Access denied. Your account is being accessed from a different device. " +
          "For security, each account is limited to one active device."
        );
        setIsSessionValid(false);
        return;
      }

      // Session is valid
      setSessionToken(session.session_token);
      setIsSessionValid(true);

      // Update last activity
      await supabase
        .from("course_sessions")
        .update({ last_activity_at: new Date().toISOString() })
        .eq("id", session.id);
    } else {
      // Create new session
      const newToken = generateSessionToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24-hour session

      const { error } = await supabase
        .from("course_sessions")
        .insert({
          user_id: user.id,
          device_fingerprint: fingerprint,
          session_token: newToken,
          expires_at: expiresAt.toISOString(),
        });

      if (!error) {
        setSessionToken(newToken);
        setIsSessionValid(true);
      }
    }
  };

  const validateSession = async (): Promise<boolean> => {
    if (!user || !sessionToken) return false;

    const { data } = await supabase
      .from("course_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("session_token", sessionToken)
      .eq("is_active", true)
      .single();

    if (!data) {
      setIsSessionValid(false);
      return false;
    }

    // Check if session has expired
    if (new Date(data.expires_at) < new Date()) {
      await terminateSession();
      return false;
    }

    // Update activity timestamp
    await supabase
      .from("course_sessions")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("id", data.id);

    return true;
  };

  const generateWatermark = async (contentId: string, contentType: string): Promise<string> => {
    if (!user) return "";
    
    const watermarkId = generateWatermarkId(user.id, contentId);
    
    // Log the access
    await logContentAccess(contentId, contentType);
    
    return watermarkId;
  };

  const logContentAccess = async (contentId: string, contentType: string) => {
    if (!user || !sessionToken) return;

    const watermarkId = generateWatermarkId(user.id, contentId);

    try {
      await supabase.from("content_access_logs").insert({
        user_id: user.id,
        content_id: contentId,
        content_type: contentType,
        watermark_id: watermarkId,
        device_fingerprint: deviceFingerprint,
      });
    } catch (error) {
      // Watermark ID might already exist, which is fine
      console.log("Content access logged");
    }
  };

  const terminateSession = async () => {
    if (!user || !sessionToken) return;

    await supabase
      .from("course_sessions")
      .update({ is_active: false })
      .eq("user_id", user.id)
      .eq("session_token", sessionToken);

    setSessionToken(null);
    setIsSessionValid(false);
  };

  return (
    <ContentSecurityContext.Provider
      value={{
        sessionToken,
        deviceFingerprint,
        isSessionValid,
        watermarkId: user ? `WM-${user.id.slice(-8)}` : null,
        generateWatermark,
        logContentAccess,
        validateSession,
        terminateSession,
      }}
    >
      {children}
    </ContentSecurityContext.Provider>
  );
}

export function useContentSecurity() {
  const context = useContext(ContentSecurityContext);
  if (context === undefined) {
    throw new Error("useContentSecurity must be used within a ContentSecurityProvider");
  }
  return context;
}
