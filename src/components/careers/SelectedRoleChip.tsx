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
      <div className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#B89555]/55 bg-[#FDFBF7] px-4 py-3 text-sm font-semibold text-[#102540]/80">
        <Briefcase className="h-4 w-4" />
        Select a role above to begin — your application will auto-sync here
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-[#B89555] bg-gradient-to-r from-[#102540] via-[#1a3d63] to-[#102540] p-[1px] shadow-[0_10px_30px_-12px_rgba(184,149,85,0.45)]">
      <div className="flex items-center gap-3 rounded-[15px] bg-gradient-to-br from-[#FDFBF7] to-[#F7F2EA] px-5 py-3.5">
        <div className="relative shrink-0">
          <div className="absolute inset-0 rounded-xl bg-emerald-500/20 blur-lg" />
          <div className="relative grid h-10 w-10 place-items-center rounded-xl bg-[#102540] border border-[#B89555]">
            <CheckCircle2 className="h-5 w-5 text-emerald-300" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#102540]/70">
              Applying for
            </p>
            <Sparkles className="h-3 w-3 text-[#B89555]" />
          </div>
          <p className="truncate text-base font-bold text-[#1A1A1A] leading-tight">{label}</p>
          {(department || isBrokerRole) && (
            <p className="mt-0.5 truncate text-xs font-semibold text-[#102540]/75">
              {department}
              {isBrokerRole && department && " · "}
              {isBrokerRole && "Commission-based"}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClear}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#102540]/30 text-[#102540] transition hover:bg-[#102540] hover:text-[#FDFBF7]"
          aria-label="Clear selected role"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default SelectedRoleChip;
