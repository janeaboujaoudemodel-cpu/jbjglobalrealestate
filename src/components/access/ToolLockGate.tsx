import { Lock, Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ToolAnimatedFrame } from "@/components/tools/PremiumToolShell";
import { toolThemes, type ToolTheme } from "@/components/tools/toolThemes";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

interface Props {
  theme: ToolTheme;
  toolName: string;
  toolId: string;
  tagline?: string;
}

/**
 * Locked-tool gate shown to non-JBJ brokers. Themed to the host tool's
 * ombré accent so the visual identity stays consistent.
 */
export default function ToolLockGate({ theme, toolName, toolId, tagline }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requested, setRequested] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleRequest = async () => {
    if (!user) {
      navigate(`/auth?redirect=/join`);
      return;
    }
    setSubmitting(true);
    try {
      await (supabase.from("crm_leads") as any).insert({
        user_id: user.id,
        email: user.email,
        first_name: user.user_metadata?.first_name ?? null,
        last_name: user.user_metadata?.last_name ?? null,
        source: `tool_access_request:${toolId}`,
        notes: `Broker requested access to ${toolName}`,
        category: "broker",
        status: "new",
      });
      setRequested(true);
      toast.success("Request submitted", {
        description: "Our partnerships team will review and reply within 24h.",
      });
    } catch (err) {
      // fallback toast so user still feels acknowledged
      setRequested(true);
      toast.success("Request received", {
        description: "We'll be in touch shortly.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ToolAnimatedFrame theme={theme}>
      <div
        data-allow-dark-cta
        className="relative px-6 py-16 md:py-24 text-center"
        style={{ background: theme.heroGradient }}
      >
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at top, rgba(255,255,255,0.10), transparent 60%)",
          }}
        />
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="flex justify-center mb-6">
            <span
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: `1px solid ${theme.accent}`,
                boxShadow: `0 0 30px ${theme.accent}55`,
              }}
            >
              <Lock className="w-7 h-7 allow-white" data-no-contrast-guard style={{ color: "#FFFFFF" }} />
            </span>
          </div>
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.25)",
            }}
          >
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.22em] allow-white"
              style={{ color: "#FFFFFF" }}
            >
              Restricted Tool
            </span>
          </div>
          <h1
            className="text-3xl md:text-5xl font-bold leading-[1.1] mb-4 allow-white"
            style={{ color: "#FFFFFF" }}
          >
            {toolName} is unlocked for JBJ brokers
          </h1>
          <p
            className="text-sm md:text-base allow-white max-w-xl mx-auto mb-8"
            style={{ color: "rgba(255,255,255,0.82)" }}
          >
            {tagline ??
              "This tool is part of the JBJ Broker Toolkit. Join JBJ as a registered broker or request access to unlock it."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate("/join")}
              data-allow-dark-cta
              data-no-contrast-guard
              className="allow-white inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-transform hover:-translate-y-0.5"
              style={{
                background: theme.ctaGradient,
                color: "#FFFFFF",
                border: `1px solid ${theme.accent}`,
                boxShadow: `0 10px 30px ${theme.accent}55`,
              }}
            >
              <Sparkles className="w-4 h-4" /> Register with JBJ
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleRequest}
              disabled={submitting || requested}
              data-allow-dark-cta
              data-no-contrast-guard
              className="allow-white inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition disabled:opacity-60"
              style={{
                background: "rgba(255,255,255,0.06)",
                color: "#FFFFFF",
                border: "1px solid rgba(255,255,255,0.35)",
              }}
            >
              {requested ? "Request submitted ✓" : submitting ? "Sending…" : "Request Access"}
            </button>
          </div>
        </div>
      </div>
    </ToolAnimatedFrame>
  );
}

// Re-export for convenience
export { toolThemes };
