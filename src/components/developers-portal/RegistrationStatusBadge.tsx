import { cn } from "@/lib/utils";

type Status = "registered" | "pending" | "not_registered" | "active" | "inactive" | string | null | undefined;

const MAP: Record<string, { label: string; cls: string }> = {
  registered:     { label: "Registered",     cls: "bg-emerald-50 text-emerald-900 border-emerald-300" },
  active:         { label: "Active",         cls: "bg-emerald-50 text-emerald-900 border-emerald-300" },
  pending:        { label: "Pending",        cls: "bg-amber-50 text-amber-900 border-amber-300" },
  not_registered: { label: "Not Registered", cls: "bg-[#F7F2EA] text-[#1A1A1A] border-[#B89555]/40" },
  inactive:       { label: "Inactive",       cls: "bg-red-50 text-red-900 border-red-300" },
};

export default function RegistrationStatusBadge({ status, className }: { status: Status; className?: string }) {
  const key = (status || "not_registered").toString().toLowerCase();
  const entry = MAP[key] ?? MAP.not_registered;
  return (
    <span
      data-no-contrast-guard
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-extrabold uppercase tracking-[0.12em] border",
        entry.cls,
        className
      )}
    >
      {entry.label}
    </span>
  );
}
