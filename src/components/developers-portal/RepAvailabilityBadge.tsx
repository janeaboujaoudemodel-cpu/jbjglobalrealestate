import { cn } from "@/lib/utils";

export default function RepAvailabilityBadge({ status, className }: { status?: string | null; className?: string }) {
  const s = (status || "available").toLowerCase();
  const map: Record<string, { label: string; dot: string; cls: string }> = {
    available: { label: "Available", dot: "bg-white", cls: "jj-pill-emerald-metallic allow-white text-white border-0" },
    busy:      { label: "Busy",      dot: "bg-white", cls: "jj-pill-emerald-metallic allow-white text-white border-0" },
    off:       { label: "Off",       dot: "bg-white", cls: "jj-pill-emerald-metallic allow-white text-white border-0" },
  };
  const e = map[s] ?? map.available;
  return (
    <span data-label-emerald-only className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border-0 text-[11px] font-semibold", e.cls, className)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", e.dot)} />
      {e.label}
    </span>
  );
}
