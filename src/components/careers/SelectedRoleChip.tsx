import { Briefcase, X, Sparkles, CheckCircle2 } from "lucide-react";

interface SelectedRoleChipProps {
  label: string | null;
  department?: string;
  isBrokerRole?: boolean;
  onClear: () => void;
}

export function SelectedRoleChip({
  label,
  department,
  isBrokerRole,
  onClear,
}: SelectedRoleChipProps) {
  if (!label) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#B89555]/55 bg-[#FDFBF7] px-4 py-3 text-sm font-semibold text-[#0A0A0A]/80">
        <Briefcase className="h-4 w-4" />
        Select a role above to begin — your application will auto-sync here
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-[#B89555] bg-gradient-to-r from-[#0A0A0A] via-[#1F1F1F] to-[#0A0A0A] p-[1px] shadow-[0_10px_30px_-12px_rgba(184,149,85,0.45)]">
      <div className="flex items-center gap-3 rounded-[15px] bg-gradient-to-br from-[#FDFBF7] to-[#F7F2EA] px-5 py-3.5">
        <div className="relative shrink-0">
          <div className="absolute inset-0 rounded-xl jj-surface-emerald-soft blur-lg" />
          <div className="relative grid h-10 w-10 place-items-center rounded-xl bg-[image:var(--jj-emerald-ombre)] border border-white/20">
            <CheckCircle2 className="h-5 w-5 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0A0A0A]/70">
              Applying for
            </p>
            <Sparkles className="h-3 w-3 text-[#B89555]" />
          </div>
          <p className="truncate text-base font-bold text-[#1A1A1A] leading-tight">{label}</p>
          {(department || isBrokerRole) && (
            <p className="mt-0.5 truncate text-xs font-semibold text-[#0A0A0A]/75">
              {department}
              {isBrokerRole && department && " · "}
              {isBrokerRole && "Commission-based"}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClear}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#B89555]/55 text-[#0A0A0A] transition hover:bg-[#0A0A0A] hover:text-[#FDFBF7] hover:border-[#B89555]"
          aria-label="Clear selected role"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default SelectedRoleChip;
