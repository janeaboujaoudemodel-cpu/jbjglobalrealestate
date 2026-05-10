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

type SelectableMode = UserMode | 'visitor' | 'developer';

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

  const isLoggedIn = !!user;

  // The modal no longer auto-opens. Users pick their category from the
  // home page "Tell us who you are" section (CategorySelectorSection).
  // The modal stays available for explicit `requestToShow()` callers only.

  // Don't render if user has already made their initial selection
  if (hasMadeInitialSelection) return null;
  // Don't render at all for anonymous users — login is required first.
  if (!isLoggedIn) return null;

  // Modal is always dismissable now — no forced lockdown.
  const isForcedOpen = false;

  const handleSelectMode = async () => {
    if (!selectedMode) return;
    
    setIsSubmitting(true);
    try {
      if (isLoggedIn) {
        const actualMode: UserMode = selectedMode === 'visitor' ? 'investor' : selectedMode as UserMode;
        await setMode(actualMode);
        dismiss();
        toast.success(
          <div className="flex flex-col gap-1">
            <span className="font-semibold">Mode selected!</span>
            <span className="text-sm text-[#1A1A1A]/70">
              You can change your mode anytime from your profile menu →
            </span>
          </div>,
          {
            duration: 8000,
            icon: <CheckCircle2 className="w-5 h-5 text-[#1A1A1A]" />,
            position: 'bottom-center',
            className: 'bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border border-[#B89555]/30 text-[#1A1A1A] shadow-xl rounded-xl',
          }
        );
      } else {
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

  // When forced open for logged-in users, prevent any close action
  const handleOpenChange = (open: boolean) => {
    if (!open && isForcedOpen) {
      // Do NOT allow closing — user must select a mode
      return;
    }
    if (!open) {
      dismiss();
    }
  };

  return (
    <Dialog open={isVisible} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "w-[calc(100vw-2rem)] max-w-lg sm:max-w-xl p-0 overflow-hidden border-2 border-[#B89555]/40 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]",
          isForcedOpen && "[&>button]:hidden" // Hide the X close button when forced
        )}
        onPointerDownOutside={isForcedOpen ? (e) => e.preventDefault() : undefined}
        onEscapeKeyDown={isForcedOpen ? (e) => e.preventDefault() : undefined}
      >
        <DialogHeader className="p-6 pb-4 border-b border-[#B89555]/20">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-center text-[#1A1A1A]">
            Welcome to JBJ Global
          </DialogTitle>
          <p className="text-center text-[#1A1A1A]/70 text-sm mt-2">
            {isLoggedIn
              ? 'Please select your role to continue. You can change this anytime.'
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
                    ? "bg-[#EFE6D6]/10 border-[#B89555] shadow-md"
                    : "bg-[#FDFBF7]/80 backdrop-blur-sm border-[#B89555]/20 hover:border-[#B89555]/50"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border",
                    isSelected
                      ? "bg-[#EFE6D6]/20 border-[#B89555]"
                      : "bg-[#EFE6D6]/5 border-[#B89555]/20"
                  )}>
                    <Icon className={cn("w-6 h-6", isSelected ? "text-[#1A1A1A]" : "text-[#1A1A1A]/70")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={cn(
                        "font-bold text-base",
                        isSelected ? "text-[#1A1A1A]" : "text-[#1A1A1A]"
                      )}>
                        {option.label}
                      </h3>
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-[#1A1A1A]" />
                      )}
                    </div>
                    <p className="text-sm text-[#1A1A1A]/70 mt-1">
                      {option.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-6 pt-2 border-t border-[#B89555]/20 bg-gradient-to-r from-gold/5 to-transparent">
          <Button
            onClick={handleSelectMode}
            disabled={!selectedMode || isSubmitting}
            className="w-full h-12 bg-gradient-to-r from-gold via-gold to-gold/90 hover:from-gold/90 hover:to-gold text-[#1A1A1A] font-bold rounded-xl shadow-lg disabled:opacity-50"
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
            <p className="text-center text-[#1A1A1A]/70 text-xs mt-3">
              Already have an account?{' '}
              <button
                onClick={() => { dismiss(); navigate('/auth'); }}
                className="text-[#1A1A1A] font-semibold hover:underline"
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
