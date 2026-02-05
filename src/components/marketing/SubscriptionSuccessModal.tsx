import { CheckCircle, Settings, ChevronRight, User, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface SubscriptionSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SubscriptionSuccessModal = ({ isOpen, onClose }: SubscriptionSuccessModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 max-w-md">
        <DialogHeader className="text-center space-y-4 pt-4">
          {/* Success Icon */}
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-gold/30 to-gold/10 border-2 border-gold/50 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-gold" />
          </div>
          
          <DialogTitle className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Poppins, sans-serif' }}>
            You're <span className="text-gold">in.</span>
          </DialogTitle>
          
          <DialogDescription className="text-muted-foreground text-base">
            Thank you for subscribing to JBJ Global Real Estate updates.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Notification Settings Hint */}
          <div className="p-4 rounded-xl border border-gold/30 bg-gold/5">
            <p className="text-sm text-foreground mb-3">
              You can manage notifications anytime from:
            </p>
            
            {/* Path Indicator */}
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/5 border border-gold/20">
                <User className="w-3.5 h-3.5 text-gold" />
                <span className="text-foreground font-medium">My Account</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/5 border border-gold/20">
                <span className="text-foreground font-medium">My Profile</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gold/20 border border-gold/40">
                <Settings className="w-3.5 h-3.5 text-gold" />
                <span className="text-gold font-medium">Settings</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button variant="primary" className="w-full" asChild>
              <Link to="/profile?tab=settings" onClick={onClose}>
                <Settings className="w-4 h-4 mr-2" />
                Manage Notification Settings
              </Link>
            </Button>
            
            <Button variant="outline" className="w-full border-gold/40 hover:border-gold" onClick={onClose}>
              Continue Browsing
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionSuccessModal;
