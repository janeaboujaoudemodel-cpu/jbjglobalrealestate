import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useContentSecurity } from "./ContentSecurityProvider";
import { useAuth } from "@/contexts/AuthContext";
import { Lock, Shield, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ProtectedContentProps {
  children: React.ReactNode;
  contentId: string;
  contentType: "video" | "pdf" | "document" | "lesson";
  showWatermark?: boolean;
  className?: string;
}

export default function ProtectedContent({
  children,
  contentId,
  contentType,
  showWatermark = true,
  className = "",
}: ProtectedContentProps) {
  const { user } = useAuth();
  const { 
    isSessionValid, 
    watermarkId, 
    generateWatermark, 
    logContentAccess,
    validateSession 
  } = useContentSecurity();
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [currentWatermark, setCurrentWatermark] = useState<string>("");

  useEffect(() => {
    checkAuthorization();
  }, [user, isSessionValid]);

  const checkAuthorization = async () => {
    if (!user) {
      setIsAuthorized(false);
      return;
    }

    const sessionValid = await validateSession();
    if (!sessionValid) {
      setIsAuthorized(false);
      return;
    }

    // Generate watermark for this content
    const watermark = await generateWatermark(contentId, contentType);
    setCurrentWatermark(watermark);
    setIsAuthorized(true);

    // Log the access
    await logContentAccess(contentId, contentType);
  };

  if (!user) {
    return (
      <div className={`relative ${className}`}>
        <div className="absolute inset-0 backdrop-blur-lg bg-zinc-900/80 flex flex-col items-center justify-center p-8 text-center rounded-xl border border-gray-700">
          <Lock className="w-12 h-12 text-gold mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Sign In Required</h3>
          <p className="text-white/70 mb-6 max-w-md">
            Please sign in to access this protected content. Your progress will be saved to your account.
          </p>
          <Button
            variant="primary"
            onClick={() => navigate("/auth?redirect=/broker-toolkit/dashboard")}
          >
            Sign In to Continue
          </Button>
        </div>
        <div className="opacity-20 pointer-events-none select-none" aria-hidden="true">
          {children}
        </div>
      </div>
    );
  }

  if (!isSessionValid || !isAuthorized) {
    return (
      <div className={`relative ${className}`}>
        <div className="absolute inset-0 backdrop-blur-lg bg-zinc-900/80 flex flex-col items-center justify-center p-8 text-center rounded-xl border border-amber-500/30">
          <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Session Issue</h3>
          <p className="text-white/70 mb-6 max-w-md">
            Your session has expired or this content is being accessed from another device. 
            Each subscription is limited to one active device for security.
          </p>
          <Button
            variant="primary"
            onClick={checkAuthorization}
          >
            Refresh Session
          </Button>
        </div>
        <div className="opacity-10 pointer-events-none select-none" aria-hidden="true">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div 
      data-protected="true"
      className={`relative select-none ${className}`}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      style={{ WebkitUserSelect: "none", userSelect: "none" }}
    >
      {/* Dynamic watermark overlay */}
      {showWatermark && (
        <div 
          className="absolute inset-0 pointer-events-none z-10 overflow-hidden"
          style={{ mixBlendMode: "soft-light" }}
        >
          <div 
            className="absolute inset-0 flex items-center justify-center"
            style={{
              backgroundImage: `repeating-linear-gradient(
                -45deg,
                transparent,
                transparent 100px,
                rgba(168, 146, 90, 0.03) 100px,
                rgba(168, 146, 90, 0.03) 200px
              )`,
            }}
          >
            <div className="text-center opacity-[0.08] transform rotate-[-15deg]">
              <p className="text-4xl font-bold text-gold whitespace-nowrap">
                {currentWatermark || watermarkId}
              </p>
              <p className="text-lg text-gold">
                Licensed to: {user.email}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Protected content */}
      <div className="relative">
        {children}
      </div>

      {/* Security badge */}
      <div className="absolute bottom-2 right-2 flex items-center gap-1 text-xs text-white/60 bg-zinc-900/80 px-2 py-1 rounded">
        <Shield className="w-3 h-3" />
        Protected Content
      </div>
    </div>
  );
}
