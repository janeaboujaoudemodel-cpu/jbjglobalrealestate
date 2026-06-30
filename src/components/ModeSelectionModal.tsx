import { useEffect, useState } from 'react';
import { User, Briefcase, ArrowRight, CheckCircle2, Building2, Sparkles, X, Crown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useUserModeContext, UserMode } from '@/contexts/UserModeContext';
import { usePopupVisibility } from '@/contexts/PopupCoordinatorContext';
import { useAuth } from '@/contexts/AuthContext';
import { isOwnerBackendEmail } from '@/config/ownerEmails';
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

const OWNER_MODE_OPTION: ModeOption = {
  mode: 'owner',
  label: 'Owner',
  description: 'Open the private owner command center and executive controls',
  icon: Crown,
};

export const ModeSelectionModal = () => {
  const { setMode, hasMadeInitialSelection } = useUserModeContext();
  const { isVisible, requestToShow, dismiss: rawDismiss } = usePopupVisibility('mode-selection-modal');
  const { user } = useAuth();
  const [selectedMode, setSelectedMode] = useState<UserMode | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const visibleModeOptions = isOwnerBackendEmail(user?.email)
    ? [...MODE_OPTIONS, OWNER_MODE_OPTION]
    : MODE_OPTIONS;

  // First-visit greeter: shown once per session if the user hasn't picked a
  // category yet. Fully dismissable — browsing is free. The mode picker stays
  // available in the header so users can choose later at any time.
  const DISMISS_KEY = 'jj_mode_modal_dismissed';

  const dismiss = () => {
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch {}
    rawDismiss();
  };

  useEffect(() => {
    if (hasMadeInitialSelection) return;
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === '1') return;
    } catch {}
    requestToShow();
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
    <Dialog open={isVisible} onOpenChange={(open) => { if (!open) dismiss(); }}>
      <DialogContent
        className={cn(
          'w-[calc(100vw-1.5rem)] max-w-lg sm:max-w-xl p-0 overflow-hidden border-2 border-[#B89555]/40 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]',
          'max-h-[calc(100svh-2rem)] flex flex-col',
          '[&>button]:hidden'
        )}
      >
        <button
          type="button"
          onClick={() => dismiss()}
          aria-label="Skip and explore first"
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center text-[#1A1A1A]/60 hover:text-[#1A1A1A] hover:bg-[#EFE6D6] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Scrollable region: header + mode cards */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-[#B89555]/20">
            <DialogTitle className="text-lg sm:text-2xl font-bold text-center text-[#1A1A1A]">
              Welcome to JBJ Global Real Estate
            </DialogTitle>
            <p className="text-center text-[#1A1A1A]/70 text-[13px] sm:text-sm mt-2">
              Tell us who you are so we can tailor the platform — the home page,
              tools, and recommendations all adapt to your category.
            </p>
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-[#B89555]/25 bg-[#FDFBF7]/70 p-2.5 sm:p-3 text-left">
              <Sparkles className="w-4 h-4 text-[#B89555] mt-0.5 shrink-0" />
              <p className="text-[12px] leading-relaxed text-[#1A1A1A]/75">
                Browsing properties is always free — no login required. You can
                also skip this for now and change your category anytime from the
                mode picker in the header.
              </p>
            </div>
          </DialogHeader>

          <div className="p-4 sm:p-6 space-y-2.5 sm:space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {visibleModeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedMode === option.mode;
              return (
                <button
                  key={option.mode}
                  onClick={() => setSelectedMode(option.mode)}
                  aria-pressed={isSelected}
                  className={cn(
                    'w-full h-full min-h-[128px] p-3 sm:p-4 rounded-xl border-2 transition-all duration-300 text-left',
                    'hover:shadow-lg hover:scale-[1.01]',
                    isSelected
                      ? 'bg-[#EFE6D6]/40 border-[#B89555] shadow-md'
                      : 'bg-[#FDFBF7]/80 backdrop-blur-sm border-[#B89555]/20 hover:border-[#B89555]/50'
                  )}
                >
                  <div className="flex h-full items-start gap-3 sm:gap-4">
                    <div
                      data-emerald-action="true"
                      data-no-contrast-guard
                      className="jj-emerald-metallic allow-white w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{ boxShadow: '0 6px 16px rgba(4,44,28,0.35)' }}
                    >
                      <Icon
                        className="w-5 h-5 sm:w-6 sm:h-6 allow-white"
                        style={{ color: '#FFFFFF', stroke: '#FFFFFF' }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-[15px] sm:text-base text-[#1A1A1A]">{option.label}</h3>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-[#1A1A1A]" />}
                      </div>
                      <p className="text-[13px] sm:text-sm text-[#1A1A1A]/70 mt-1">{option.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
            </div>
          </div>
        </div>

        {/* Pinned footer — always visible, respects iOS safe area */}
        <div
          className="shrink-0 p-4 sm:p-6 pt-2 sm:pt-2 border-t border-[#B89555]/20 bg-[#FDFBF7]/85 backdrop-blur-sm"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          <Button
            onClick={handleSelectMode}
            disabled={!selectedMode || isSubmitting}
            className="w-full h-12 font-bold rounded-xl shadow-lg disabled:opacity-50"
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
          <button
            type="button"
            onClick={() => dismiss()}
            className="w-full mt-2 h-10 text-[13px] font-medium text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:bg-[#EFE6D6]/40 rounded-lg transition-colors"
          >
            Skip for now — just let me explore
          </button>
          {!user && (
            <p className="text-center text-[#1A1A1A]/60 text-[11px] mt-2">
              You can browse properties freely. Sign-in is only needed when you
              save, contact, or use a tool.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModeSelectionModal;
