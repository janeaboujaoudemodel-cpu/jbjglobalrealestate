/**
 * Subscription Gate Component
 * Blocks access to premium tools for users without appropriate subscription
 */

import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Sparkles, Check, ArrowRight, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSubscription, FREE_TOOLS } from "@/hooks/useSubscription";
import { useAuth } from "@/contexts/AuthContext";

interface SubscriptionGateProps {
  children: React.ReactNode;
  toolId: string;
  toolName?: string;
}

export function SubscriptionGate({ children, toolId, toolName }: SubscriptionGateProps) {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { hasToolAccess, currentTier, isLoading, tiers } = useSubscription();

  // Show loading state
  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // Not logged in - redirect to auth
  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <Card className="max-w-lg w-full bg-gradient-to-br from-card to-muted/30 border-primary/20">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Sign In Required</h2>
              <p className="text-muted-foreground">
                Please sign in to access {toolName || "this tool"}.
              </p>
            </div>
            <Button 
              size="lg" 
              onClick={() => navigate("/auth")}
              className="w-full"
            >
              Sign In / Create Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Free tool or has access - show content
  if (FREE_TOOLS.includes(toolId) || hasToolAccess(toolId)) {
    return <>{children}</>;
  }

  // Find which tier provides access to this tool
  const requiredTier = tiers?.find(t => t.tool_access.includes(toolId));

  // No subscription or insufficient tier - show upgrade prompt
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-card via-card to-primary/5">
          <CardContent className="p-0">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary/20 to-primary/5 p-8 text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <Crown className="w-10 h-10 text-primary" />
              </div>
              <Badge variant="secondary" className="mb-3">
                <Sparkles className="w-3 h-3 mr-1" />
                Premium Feature
              </Badge>
              <h2 className="text-2xl font-bold mb-2">
                Upgrade to Access {toolName || "This Tool"}
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                This powerful AI tool is available with our {requiredTier?.name || "paid"} plan and above.
              </p>
            </div>

            {/* Current Status & Benefits */}
            <div className="p-8 space-y-6">
              {currentTier && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Current Plan</p>
                    <p className="font-semibold">{currentTier.name}</p>
                  </div>
                  <Badge variant="outline">Active</Badge>
                </div>
              )}

              {requiredTier && (
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    {requiredTier.name} Plan Includes:
                  </h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {(requiredTier.features as string[]).slice(0, 6).map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button 
                  size="lg" 
                  className="flex-1"
                  onClick={() => navigate("/pricing")}
                >
                  View Plans & Upgrade
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => navigate("/ai-hub")}
                >
                  Browse Free Tools
                </Button>
              </div>

              {/* Free tools note */}
              <p className="text-xs text-center text-muted-foreground pt-2">
                AI Home Finder, Business Card Scanner, and CRM are always free!
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default SubscriptionGate;
