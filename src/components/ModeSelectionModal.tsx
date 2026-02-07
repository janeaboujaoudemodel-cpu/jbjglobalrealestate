import { useState } from 'react';
import { User, Briefcase, Users, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useUserModeContext, UserMode } from '@/contexts/UserModeContext';
import { usePopupVisibility } from '@/contexts/PopupCoordinatorContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ModeOption {
  mode: UserMode;
  label: string;
  description: string;
  icon: typeof User;
  color: string;
  bgColor: string;
  borderColor: string;
}

const MODE_OPTIONS: ModeOption[] = [
  {
    mode: 'investor',
    label: 'Investor Mode',
    description: 'Browse properties, track investments, and access market insights',
    icon: User,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/40',
  },
  {
    mode: 'broker',
    label: 'Broker Mode',
    description: 'Access broker tools, CRM dashboard, and professional resources',
    icon: Briefcase,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/40',
  },
  {
    mode: 'investor_broker',
    label: 'Investor + Broker',
    description: 'Full access to both investor and broker features',
    icon: Users,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/40',
  },
];

export const ModeSelectionModal = () => {
  const { setMode, hasMadeInitialSelection } = useUserModeContext();
  const { isVisible, dismiss } = usePopupVisibility('mode-selection-modal');
  const [selectedMode, setSelectedMode] = useState<UserMode | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Don't render if user has already made their initial selection
  if (hasMadeInitialSelection) return null;

  const handleSelectMode = async () => {
    if (!selectedMode) return;
    
    setIsSubmitting(true);
    try {
      await setMode(selectedMode);
      dismiss();
      
      // Show guidance toast with arrow pointing to profile
      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-semibold">Mode selected!</span>
          <span className="text-sm text-zinc-600">
            You can change your mode anytime from your profile menu →
          </span>
        </div>,
        {
          duration: 5000,
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
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
    <Dialog open={isVisible} onOpenChange={(open) => !open && dismiss()}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-lg sm:max-w-xl p-0 overflow-hidden border-2 border-gold/40 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
        <DialogHeader className="p-6 pb-4 border-b border-gold/20">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-center text-black">
            Welcome! Select Your Mode
          </DialogTitle>
          <p className="text-center text-zinc-600 text-sm mt-2">
            Choose how you want to use the platform. You can change this anytime.
          </p>
        </DialogHeader>

        <div className="p-6 space-y-4">
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
                    ? `${option.bgColor} ${option.borderColor} shadow-md`
                    : "bg-white/60 border-zinc-200/60 hover:border-gold/40"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                    option.bgColor,
                    "border",
                    option.borderColor
                  )}>
                    <Icon className={cn("w-6 h-6", option.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={cn(
                        "font-bold text-base",
                        isSelected ? option.color : "text-black"
                      )}>
                        {option.label}
                      </h3>
                      {isSelected && (
                        <CheckCircle2 className={cn("w-5 h-5", option.color)} />
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
            ) : (
              <>
                Continue
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModeSelectionModal;
