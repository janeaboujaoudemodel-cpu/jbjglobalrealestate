import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
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

  const onClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
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

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      title={visible ? 'Hide from public /team' : 'Show on public /team'}
      aria-label={visible ? 'Hide member' : 'Show member'}
      className="absolute top-2 right-2 z-10 inline-flex items-center justify-center w-8 h-8 rounded-full border border-[#B89555]/55 bg-[#FDFBF7]/95 backdrop-blur text-[#1A1A1A] shadow-sm hover:bg-[#EFE6D6] transition disabled:opacity-50"
    >
      {visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
    </button>
  );
};

export default VisibilityToggleButton;
