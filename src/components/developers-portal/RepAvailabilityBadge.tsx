import { cn } from "@/lib/utils";

export default function RepAvailabilityBadge({ status, className }: { status?: string | null; className?: string }) {
  const s = (status || "available").toLowerCase();
  const map: Record<string, { label: string; dot: string; cls: string }> = {
    available: { label: "Available", dot: "bg-emerald-500", cls: "bg-emerald-50 text-emerald-900 border-emerald-300" },
    busy:      { label: "Busy",      dot: "bg-amber-500",   cls: "bg-amber-50 text-amber-900 border-amber-300" },
    off:       { label: "Off",       dot: "bg-[#1A1A1A]/40",cls: "bg-[#F7F2EA] text-[#1A1A1A] border-[#B89555]/40" },
  };
  const e = map[s] ?? map.available;
  return (
    <span data-no-contrast-guard className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-semibold", e.cls, className)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", e.dot)} />
      {e.label}
    </span>
  );
}
