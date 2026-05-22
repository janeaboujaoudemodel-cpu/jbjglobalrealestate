import React, { useState } from 'react';
import { Eye, EyeOff, Sparkles, Lock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useTeamVisibility, PAGE_KEY, HIDE_AI_KEY } from '@/hooks/useTeamVisibility';

interface Props {
  totalMembers: number;
  hiddenMembers: number;
  aiCount: number;
}

const TeamVisibilityBar: React.FC<Props> = ({ totalMembers, hiddenMembers, aiCount }) => {
  const { map, setVisibility } = useTeamVisibility();
  const [busy, setBusy] = useState<string | null>(null);

  const pageVisible = map[PAGE_KEY] !== false;
  const aiVisible = map[HIDE_AI_KEY] !== false; // when false → AI hidden

  const toggle = async (key: string, next: boolean, label: string) => {
    try {
      setBusy(key);
      await setVisibility(key, next);
      toast.success(`${label} ${next ? 'enabled' : 'disabled'}`);
    } catch (e: any) {
      toast.error(e?.message || `Failed to update ${label}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="sticky top-[88px] z-30 mx-auto max-w-7xl px-4 pt-4">
      <div className="rounded-2xl border border-[#B89555]/40 bg-[#FDFBF7]/95 backdrop-blur shadow-[0_8px_24px_-12px_rgba(184,149,85,0.35)] p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <Lock className="w-4 h-4 text-[#B89555]" />
          <span className="text-xs uppercase tracking-[0.15em] text-[#1A1A1A]/70 font-semibold">
            Owner Controls — Team Visibility
          </span>
          <Badge variant="outline" className="ml-auto border-[#B89555]/40 text-[#1A1A1A] bg-[#EFE6D6]/40">
            {totalMembers - hiddenMembers}/{totalMembers} visible
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Master page switch */}
          <div className="flex items-center justify-between rounded-xl border border-[#B89555]/30 bg-[#F7F2EA] px-4 py-3">
            <div className="flex items-center gap-3">
              {pageVisible ? (
                <Eye className="w-5 h-5 text-[#1A1A1A]" />
              ) : (
                <EyeOff className="w-5 h-5 text-[#1A1A1A]" />
              )}
              <div>
                <p className="text-sm font-semibold text-[#1A1A1A]">Show the entire /team page</p>
                <p className="text-xs text-[#1A1A1A]/60">
                  Off = visitors get 404. You (owner) can still see it.
                </p>
              </div>
            </div>
            <Switch
              checked={pageVisible}
              disabled={busy === PAGE_KEY}
              onCheckedChange={(v) => toggle(PAGE_KEY, v, 'Public team page')}
            />
          </div>

          {/* AI personas master toggle */}
          <div className="flex items-center justify-between rounded-xl border border-[#B89555]/30 bg-[#F7F2EA] px-4 py-3">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-[#1A1A1A]" />
              <div>
                <p className="text-sm font-semibold text-[#1A1A1A]">Show AI personas ({aiCount})</p>
                <p className="text-xs text-[#1A1A1A]/60">
                  Off = hides every team member flagged as AI in one click.
                </p>
              </div>
            </div>
            <Switch
              checked={aiVisible}
              disabled={busy === HIDE_AI_KEY}
              onCheckedChange={(v) => toggle(HIDE_AI_KEY, v, 'AI personas')}
            />
          </div>
        </div>

        <p className="mt-3 text-[11px] text-[#1A1A1A]/60">
          Tip: use the eye icon on any card to hide/show that specific person.
        </p>
      </div>
    </div>
  );
};

export default TeamVisibilityBar;
