import { useState } from 'react';
import { User, Briefcase, Users, ArrowRight, CheckCircle2, Handshake, Building2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useUserModeContext, UserMode } from '@/contexts/UserModeContext';
import { usePopupVisibility } from '@/contexts/PopupCoordinatorContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type SelectableMode = UserMode | 'visitor';

interface ModeOption {
  mode: SelectableMode;
  label: string;
  description: string;
  icon: typeof User;
}

const MODE_OPTIONS: ModeOption[] = [
  {
    mode: 'investor',
    label: 'Investor',
    description: 'Browse properties, track investments, and access market insights',
    icon: User,
  },
  {
    mode: 'broker',
    label: 'Broker',
    description: 'Access broker tools, CRM dashboard, and professional resources',
    icon: Briefcase,
  },
  {
    mode: 'developer',
    label: 'Developer',
    description: 'Submit projects, upload marketing materials, and manage launches',
    icon: Building2,
  },
  {
    mode: 'visitor',
    label: 'Visitor / Partnership',
    description: 'Explore the platform and discover partnership opportunities',
    icon: Handshake,
  },
];

export const ModeSelectionModal = () => {
  const { setMode, hasMadeInitialSelection } = useUserModeContext();
  const { isVisible, dismiss } = usePopupVisibility('mode-selection-modal');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState<SelectableMode | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Don't render if user has already made their initial selection
  if (hasMadeInitialSelection) return null;

  const isLoggedIn = !!user;

  const handleSelectMode = async () => {
    if (!selectedMode) return;
    
    setIsSubmitting(true);
    try {
      if (isLoggedIn) {
        // Logged in: set mode directly (visitor maps to investor)
        const actualMode: UserMode = selectedMode === 'visitor' ? 'investor' : selectedMode;
        await setMode(actualMode);
        dismiss();
        toast.success(
          <div className="flex flex-col gap-1">
            <span className="font-semibold">Mode selected!</span>
            <span className="text-sm text-zinc-600">
              You can change your mode anytime from your profile menu →
            </span>
          </div>,
          {
            duration: 5000,
            icon: <CheckCircle2 className="w-5 h-5 text-gold" />,
          }
        );
      } else {
        // Not logged in: redirect to auth with mode
        dismiss();
        navigate(`/auth?mode_select=${selectedMode}`);
      }
    } catch (error) {
      console.error('Failed to set mode:', error);
      toast.error('Failed to set mode. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isVisible} onOpenChange={(open) => !open && dismiss()}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-lg sm:max-w-xl p-0 overflow-hidden border-2 border-gold/40 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
        <DialogHeader className="p-6 pb-4 border-b border-gold/20">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-center text-black">
            Welcome to JBJ Global
          </DialogTitle>
          <p className="text-center text-zinc-600 text-sm mt-2">
            {isLoggedIn
              ? 'Choose how you want to use the platform. You can change this anytime.'
              : 'Select your role to get started. Register for full access.'}
          </p>
        </DialogHeader>

        <div className="p-6 space-y-3">
          {MODE_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedMode === option.mode;
            
            return (
              <button
                key={option.mode}
                onClick={() => setSelectedMode(option.mode)}
                className={cn(
                  "w-full p-4 rounded-xl border-2 transition-all duration-300 text-left",
                  "hover:shadow-lg hover:scale-[1.01]",
                  isSelected
                    ? "bg-gold/10 border-gold shadow-md"
                    : "bg-white/80 backdrop-blur-sm border-gold/20 hover:border-gold/50"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border",
                    isSelected
                      ? "bg-gold/20 border-gold"
                      : "bg-gold/5 border-gold/20"
                  )}>
                    <Icon className={cn("w-6 h-6", isSelected ? "text-gold" : "text-gold/60")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={cn(
                        "font-bold text-base",
                        isSelected ? "text-gold" : "text-black"
                      )}>
                        {option.label}
                      </h3>
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-gold" />
                      )}
                    </div>
                    <p className="text-sm text-zinc-600 mt-1">
                      {option.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-6 pt-2 border-t border-gold/20 bg-gradient-to-r from-gold/5 to-transparent">
          <Button
            onClick={handleSelectMode}
            disabled={!selectedMode || isSubmitting}
            className="w-full h-12 bg-gradient-to-r from-gold via-gold to-gold/90 hover:from-gold/90 hover:to-gold text-black font-bold rounded-xl shadow-lg disabled:opacity-50"
          >
            {isSubmitting ? (
              'Setting up...'
            ) : isLoggedIn ? (
              <>
                Continue
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            ) : (
              <>
                Register Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
          {!isLoggedIn && (
            <p className="text-center text-zinc-500 text-xs mt-3">
              Already have an account?{' '}
              <button
                onClick={() => { dismiss(); navigate('/auth'); }}
                className="text-gold font-semibold hover:underline"
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModeSelectionModal;
