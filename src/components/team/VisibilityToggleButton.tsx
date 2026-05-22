import React from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTeamVisibility } from '@/hooks/useTeamVisibility';

interface Props {
  memberId: string;
  label?: string;
}

const VisibilityToggleButton: React.FC<Props> = ({ memberId, label }) => {
  const { isMemberVisible, setVisibility } = useTeamVisibility();
  const visible = isMemberVisible(memberId);
  const [busy, setBusy] = React.useState(false);

  const who = label || 'team member';
  const accessibleLabel = visible
    ? `Hide ${who} from the public team page`
    : `Show ${who} on the public team page`;

  const handleToggle = async () => {
    if (busy) return;
    try {
      setBusy(true);
      await setVisibility(memberId, !visible);
      toast.success(`${label || 'Member'} ${!visible ? 'shown' : 'hidden'} on /team`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update visibility');
    } finally {
      setBusy(false);
    }
  };

  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    handleToggle();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    // Native button handles Enter / Space already, but prevent the card
    // (which may be a Link) from also reacting to the keystroke.
    if (e.key === 'Enter' || e.key === ' ') {
      e.stopPropagation();
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      onKeyDown={onKeyDown}
      disabled={busy}
      aria-pressed={!visible}
      aria-busy={busy}
      aria-label={accessibleLabel}
      title={accessibleLabel}
      data-visible={visible ? 'true' : 'false'}
      className={[
        'absolute top-2 right-2 z-10 inline-flex items-center justify-center',
        'min-w-11 min-h-11 w-11 h-11 rounded-full',
        'border bg-[#FDFBF7]/95 backdrop-blur text-[#1A1A1A] shadow-sm transition',
        'hover:bg-[#EFE6D6] disabled:opacity-50 disabled:cursor-not-allowed',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B89555] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FDFBF7]',
        visible
          ? 'border-[#B89555]/55'
          : 'border-[#1A1A1A]/50 bg-[#EFE6D6]',
      ].join(' ')}
    >
      {busy ? (
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
      ) : visible ? (
        <Eye className="w-4 h-4" aria-hidden="true" />
      ) : (
        <EyeOff className="w-4 h-4" aria-hidden="true" />
      )}
      <span className="sr-only" aria-live="polite">
        {visible ? 'Currently visible on /team' : 'Currently hidden from /team'}
      </span>
    </button>
  );
};

export default VisibilityToggleButton;
