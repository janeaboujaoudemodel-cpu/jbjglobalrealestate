import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldAlert, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

export type ReAuthSeverity = "normal" | "critical";

interface ReAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionLabel: string;
  severity?: ReAuthSeverity;
  onSuccess: () => void;
}

export default function ReAuthModal({
  open,
  onOpenChange,
  actionLabel,
  severity = "normal",
  onSuccess,
}: ReAuthModalProps) {
  const { user } = useAuth();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const isCritical = severity === "critical";

  const handleReAuth = async () => {
    if (!user?.email || !password) return;
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });

    if (error) {
      toast.error("Authentication failed. Please try again.");
      setLoading(false);

      // Log failed re-auth attempt
      try {
        await supabase.from("api_security_events").insert({
          event_type: "reauth_failure",
          function_name: "step-up-auth",
          severity: isCritical ? "high" : "medium",
          user_id: user.id,
          details: {
            action: actionLabel,
            severity,
            user_agent: navigator.userAgent,
          } as any,
        });
      } catch {}

      return;
    }

    // Log successful re-auth
    try {
      await supabase.from("api_security_events").insert({
        event_type: "reauth_success",
        function_name: "step-up-auth",
        severity: "low",
        user_id: user.id,
        details: {
          action: actionLabel,
          severity,
          user_agent: navigator.userAgent,
        } as any,
      });
    } catch {}

    setPassword("");
    setLoading(false);
    onOpenChange(false);
    onSuccess();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40 max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                isCritical
                  ? "bg-red-100 border-red-300"
                  : "bg-amber-100 border-amber-300"
              }`}
            >
              {isCritical ? (
                <ShieldAlert className="w-6 h-6 text-red-700" />
              ) : (
                <ShieldCheck className="w-6 h-6 text-amber-700" />
              )}
            </div>
            <AlertDialogTitle className="text-foreground text-xl">
              {isCritical
                ? "Critical Action — Re-Authentication Required"
                : "Re-Authentication Required"}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-muted-foreground text-base">
            <strong className="text-foreground">"{actionLabel}"</strong> is a{" "}
            {isCritical ? "critical" : "sensitive"} action. Please confirm your
            password to proceed.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4">
          <Input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleReAuth()}
            className="border-[#B89555]/30 focus:border-[#B89555]"
            autoFocus
          />
          {isCritical && (
            <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" />
              This action cannot be undone. Proceed with caution.
            </p>
          )}
        </div>

        <AlertDialogFooter className="gap-3">
          <AlertDialogCancel className="bg-background border-2 border-[#B89555]/30 text-foreground hover:bg-[#EFE6D6]/10">
            Cancel
          </AlertDialogCancel>
          <Button
            onClick={handleReAuth}
            disabled={loading || !password}
            className={
              isCritical
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-[#EFE6D6] text-[#1A1A1A] hover:bg-[#EFE6D6]/90"
            }
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            {isCritical ? "Authenticate & Execute" : "Confirm & Proceed"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
