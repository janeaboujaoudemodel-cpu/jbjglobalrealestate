import { useEffect, useState } from 'react';
import { User, Briefcase, ArrowRight, CheckCircle2, Building2, Sparkles, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useUserModeContext, UserMode } from '@/contexts/UserModeContext';
import { usePopupVisibility } from '@/contexts/PopupCoordinatorContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ModeOption {
  mode: UserMode;
  label: string;
  description: string;
  icon: typeof User;
}

// STRICTLY three categories. No "combined" mode, no "visitor / partnership"
// escape hatch. The choice the user makes here re-skins the rest of the site.
const MODE_OPTIONS: ModeOption[] = [
  {
    mode: 'investor',
    label: 'Investor',
    description: 'Browse properties, track investments, and unlock market intelligence',
    icon: User,
  },
  {
    mode: 'broker',
    label: 'Broker',
    description: 'Access broker tools, CRM, careers, and professional resources',
    icon: Briefcase,
  },
  {
    mode: 'developer',
    label: 'Developer',
    description: 'Submit projects, manage launches, and access the developer portal',
    icon: Building2,
  },
];

export const ModeSelectionModal = () => {
  const { setMode, hasMadeInitialSelection } = useUserModeContext();
  const { isVisible, requestToShow, dismiss } = usePopupVisibility('mode-selection-modal');
  const { user } = useAuth();
  const [selectedMode, setSelectedMode] = useState<UserMode | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forced on first visit — for both anonymous and logged-in users.
  // Selection is saved to localStorage immediately and synced to the
  // account on next login via register-mode-lead.
  useEffect(() => {
    if (!hasMadeInitialSelection) {
      requestToShow();
    }
  }, [hasMadeInitialSelection, requestToShow]);

  if (hasMadeInitialSelection) return null;

  const handleSelectMode = async () => {
    if (!selectedMode) return;
    setIsSubmitting(true);
    try {
      await setMode(selectedMode);
      dismiss();
      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-semibold">Welcome to JBJ Global Real Estate</span>
          <span className="text-sm text-[#1A1A1A]/70">
            You can change your mode anytime from the account menu.
          </span>
        </div>,
        {
          duration: 6000,
          icon: <CheckCircle2 className="w-5 h-5 text-[#1A1A1A]" />,
          position: 'bottom-center',
          className:
            'bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border border-[#B89555]/30 text-[#1A1A1A] shadow-xl rounded-xl',
        }
      );
    } catch (error) {
      console.error('Failed to set mode:', error);
      toast.error('Failed to set mode. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isVisible} onOpenChange={() => { /* non-dismissable */ }}>
      <DialogContent
        className={cn(
          'w-[calc(100vw-2rem)] max-w-lg sm:max-w-xl p-0 overflow-hidden border-2 border-[#B89555]/40 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]',
          // Hide built-in X close button — selection is required
          '[&>button]:hidden'
        )}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="p-6 pb-4 border-b border-[#B89555]/20">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-center text-[#1A1A1A]">
            Welcome to JBJ Global Real Estate
          </DialogTitle>
          <p className="text-center text-[#1A1A1A]/70 text-sm mt-2">
            Tell us who you are so we can tailor the platform to you.
            You can change this anytime.
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
                aria-pressed={isSelected}
                className={cn(
                  'w-full p-4 rounded-xl border-2 transition-all duration-300 text-left',
                  'hover:shadow-lg hover:scale-[1.01]',
                  isSelected
                    ? 'bg-[#EFE6D6]/40 border-[#B89555] shadow-md'
                    : 'bg-[#FDFBF7]/80 backdrop-blur-sm border-[#B89555]/20 hover:border-[#B89555]/50'
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border',
                      isSelected
                        ? 'bg-[#EFE6D6] border-[#B89555]'
                        : 'bg-[#EFE6D6]/40 border-[#B89555]/20'
                    )}
                  >
                    <Icon className="w-6 h-6 text-[#1A1A1A]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-[#1A1A1A]">{option.label}</h3>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-[#1A1A1A]" />}
                    </div>
                    <p className="text-sm text-[#1A1A1A]/70 mt-1">{option.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-6 pt-2 border-t border-[#B89555]/20">
          <Button
            onClick={handleSelectMode}
            disabled={!selectedMode || isSubmitting}
            className="w-full h-12 bg-[#1A1A1A] hover:bg-[#0A0A0A] text-white font-bold rounded-xl shadow-lg border border-[#B89555]/40 disabled:opacity-50"
          >
            {isSubmitting ? (
              'Setting up…'
            ) : (
              <>
                Continue
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
          {!user && (
            <p className="text-center text-[#1A1A1A]/60 text-[11px] mt-3">
              You'll be able to register or sign in after making your selection.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModeSelectionModal;
