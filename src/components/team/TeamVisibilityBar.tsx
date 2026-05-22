import React, { useId, useState } from 'react';
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

  const pageId = useId();
  const pageDescId = `${pageId}-desc`;
  const aiId = useId();
  const aiDescId = `${aiId}-desc`;

  const pageVisible = map[PAGE_KEY] !== false;
  const aiVisible = map[HIDE_AI_KEY] !== false; // when false → AI hidden
  const visibleCount = totalMembers - hiddenMembers;

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
    <section
      aria-label="Owner controls: team page visibility"
      className="sticky top-[88px] z-30 mx-auto max-w-7xl px-4 pt-4"
    >
      <div
        role="group"
        aria-labelledby={`${pageId}-heading`}
        className="rounded-2xl border border-[#B89555]/40 bg-[#FDFBF7]/95 backdrop-blur shadow-[0_8px_24px_-12px_rgba(184,149,85,0.35)] p-4 sm:p-5"
      >
        <div className="flex items-center gap-2 mb-3">
          <Lock className="w-4 h-4 text-[#B89555]" aria-hidden="true" />
          <h2
            id={`${pageId}-heading`}
            className="text-xs uppercase tracking-[0.15em] text-[#1A1A1A]/70 font-semibold m-0"
          >
            Owner Controls — Team Visibility
          </h2>
          <Badge
            variant="outline"
            className="ml-auto border-[#B89555]/40 text-[#1A1A1A] bg-[#EFE6D6]/40"
            aria-label={`${visibleCount} of ${totalMembers} members are visible to the public`}
          >
            <span aria-hidden="true">{visibleCount}/{totalMembers} visible</span>
          </Badge>
        </div>

        {/* Live region so screen-reader users hear toggle results. */}
        <div className="sr-only" role="status" aria-live="polite">
          Page is {pageVisible ? 'public' : 'hidden from the public'}.
          AI personas are {aiVisible ? 'shown' : 'hidden'}.
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Master page switch */}
          <label
            htmlFor={pageId}
            data-active={pageVisible ? 'true' : 'false'}
            className="flex items-center justify-between gap-3 rounded-xl border bg-[#F7F2EA] px-4 py-3 cursor-pointer transition
              border-[#B89555]/30 hover:border-[#B89555]/60
              data-[active=true]:border-[#1A1A1A]/60 data-[active=true]:bg-[#EFE6D6]
              focus-within:ring-2 focus-within:ring-[#B89555] focus-within:ring-offset-2 focus-within:ring-offset-[#FDFBF7]"
          >
            <div className="flex items-center gap-3 min-w-0">
              {pageVisible ? (
                <Eye className="w-5 h-5 text-[#1A1A1A] shrink-0" aria-hidden="true" />
              ) : (
                <EyeOff className="w-5 h-5 text-[#1A1A1A] shrink-0" aria-hidden="true" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#1A1A1A]">Show the entire /team page</p>
                <p id={pageDescId} className="text-xs text-[#1A1A1A]/70">
                  Hidden by default — visitors get 404. Turn on to publish publicly. You (owner) always see it.
                </p>
              </div>
            </div>
            <Switch
              id={pageId}
              checked={pageVisible}
              disabled={busy === PAGE_KEY}
              onCheckedChange={(v) => toggle(PAGE_KEY, v, 'Public team page')}
              aria-label="Show the entire team page to the public"
              aria-describedby={pageDescId}
            />
          </label>

          {/* AI personas master toggle */}
          <label
            htmlFor={aiId}
            data-active={aiVisible ? 'true' : 'false'}
            className="flex items-center justify-between gap-3 rounded-xl border bg-[#F7F2EA] px-4 py-3 cursor-pointer transition
              border-[#B89555]/30 hover:border-[#B89555]/60
              data-[active=true]:border-[#1A1A1A]/60 data-[active=true]:bg-[#EFE6D6]
              focus-within:ring-2 focus-within:ring-[#B89555] focus-within:ring-offset-2 focus-within:ring-offset-[#FDFBF7]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Sparkles className="w-5 h-5 text-[#1A1A1A] shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#1A1A1A]">
                  Show AI personas <span className="text-[#1A1A1A]/70">({aiCount})</span>
                </p>
                <p id={aiDescId} className="text-xs text-[#1A1A1A]/70">
                  Off = hides every team member flagged as AI in one click.
                </p>
              </div>
            </div>
            <Switch
              id={aiId}
              checked={aiVisible}
              disabled={busy === HIDE_AI_KEY}
              onCheckedChange={(v) => toggle(HIDE_AI_KEY, v, 'AI personas')}
              aria-label={`Show all ${aiCount} AI personas on the team page`}
              aria-describedby={aiDescId}
            />
          </label>
        </div>

        <p className="mt-3 text-[11px] text-[#1A1A1A]/70">
          Tip: use the eye icon on any card to hide or show that specific person. Each icon is keyboard-focusable — press Enter or Space to toggle.
        </p>
      </div>
    </section>
  );
};

export default TeamVisibilityBar;
