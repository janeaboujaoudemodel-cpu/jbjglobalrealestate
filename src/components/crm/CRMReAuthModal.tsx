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
import { ShieldAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CRMReAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionLabel: string;
  onSuccess: () => void;
}

export default function CRMReAuthModal({ open, onOpenChange, actionLabel, onSuccess }: CRMReAuthModalProps) {
  const { user } = useAuth();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
      return;
    }

    // Log successful re-auth
    await supabase.from("crm_security_events").insert({
      user_id: user.id,
      event_type: "reauth_success",
      details: { action: actionLabel },
      user_agent: navigator.userAgent,
    });

    setPassword("");
    setLoading(false);
    onOpenChange(false);
    onSuccess();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-amber-700" />
            </div>
            <AlertDialogTitle className="text-foreground text-xl">
              Re-Authentication Required
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-muted-foreground text-base">
            <strong className="text-foreground">"{actionLabel}"</strong> is a sensitive action.
            Please confirm your password to proceed.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4">
          <Input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleReAuth()}
            className="border-gold/30 focus:border-gold"
            autoFocus
          />
        </div>

        <AlertDialogFooter className="gap-3">
          <AlertDialogCancel className="bg-background border-2 border-gold/30 text-foreground hover:bg-gold/10">
            Cancel
          </AlertDialogCancel>
          <Button onClick={handleReAuth} disabled={loading || !password} className="bg-gold text-black hover:bg-gold/90">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Confirm & Proceed
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
