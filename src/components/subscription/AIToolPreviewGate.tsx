/**
 * AI Tool Preview Gate
 * Renders the tool UI visibly (preview) but blocks interaction with a
 * premium emerald overlay + Upgrade CTA when the user has no active
 * subscription that grants access to this tool. Owners/admins bypass.
 */
import { useNavigate } from "react-router-dom";
import { Lock, Crown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription, FREE_TOOLS } from "@/hooks/useSubscription";

interface Props {
  children: React.ReactNode;
  toolId: string;
  toolName?: string;
}

export function AIToolPreviewGate({ children, toolId, toolName }: Props) {
  const navigate = useNavigate();
  const { user, isOwner, loading: authLoading } = useAuth();
  const { hasToolAccess, isLoading, currentTier, tiers } = useSubscription();

  // Loading — render children behind spinner to avoid layout jump
  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#064E3B]" />
      </div>
    );
  }

  // Owners/admins & free tools & entitled subscribers → full access
  const bypass =
    isOwner ||
    FREE_TOOLS.includes(toolId) ||
    (user && hasToolAccess(toolId));

  if (bypass) return <>{children}</>;

  const requiredTier = tiers?.find((t) => t.tool_access.includes(toolId));

  return (
    <div className="relative">
      {/* Preview (non-interactive) */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none blur-[2px] opacity-60"
      >
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 z-40 flex items-start justify-center pt-[10vh] px-4 pb-10 bg-gradient-to-b from-white/60 via-white/85 to-white/95 backdrop-blur-sm">
        <div className="max-w-lg w-full bg-white border border-[#064E3B]/15 shadow-2xl rounded-none p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#064E3B]/10 flex items-center justify-center mb-5">
            {user ? (
              <Crown className="w-8 h-8 text-[#064E3B]" />
            ) : (
              <Lock className="w-8 h-8 text-[#064E3B]" />
            )}
          </div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#064E3B]/70 mb-2">
            Premium AI Tool
          </p>
          <h2 className="font-cormorant text-3xl text-[#0F172A] mb-3">
            {user ? "Subscription Required" : "Sign In to Continue"}
          </h2>
          <p className="text-sm text-[#0F172A]/70 mb-6 leading-relaxed">
            {user
              ? `${toolName || "This AI tool"} is available with the ${
                  requiredTier?.name || "Premium"
                } plan. Preview the interface below — upgrade to unlock full access.`
              : `Please sign in and subscribe to use ${
                  toolName || "this AI tool"
                }.`}
          </p>
          {user && currentTier && (
            <p className="text-xs text-[#0F172A]/60 mb-4">
              Current plan: <span className="font-medium">{currentTier.name}</span>
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            {!user ? (
              <Button
                size="lg"
                className="flex-1 bg-[#064E3B] hover:bg-[#053d2e] text-white rounded-none"
                onClick={() => navigate("/auth")}
              >
                Sign In / Create Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button
                  size="lg"
                  className="flex-1 bg-[#064E3B] hover:bg-[#053d2e] text-white rounded-none"
                  onClick={() => navigate("/pricing")}
                >
                  Upgrade to Unlock
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-none border-[#064E3B]/30 text-[#064E3B]"
                  onClick={() => navigate("/ai-hub")}
                >
                  Free Tools
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIToolPreviewGate;
