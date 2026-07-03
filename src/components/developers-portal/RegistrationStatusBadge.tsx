import { cn } from "@/lib/utils";

type Status = "registered" | "pending" | "not_registered" | "active" | "inactive" | string | null | undefined;

const MAP: Record<string, { label: string; cls: string }> = {
  registered:     { label: "Registered",     cls: "jj-pill-emerald-metallic allow-white text-white border-0" },
  active:         { label: "Active",         cls: "jj-pill-emerald-metallic allow-white text-white border-0" },
  pending:        { label: "Pending",        cls: "jj-pill-emerald-metallic allow-white text-white border-0" },
  not_registered: { label: "Not Registered", cls: "jj-pill-emerald-metallic allow-white text-white border-0" },
  inactive:       { label: "Inactive",       cls: "jj-pill-emerald-metallic allow-white text-white border-0" },
};

export default function RegistrationStatusBadge({ status, className }: { status: Status; className?: string }) {
  const key = (status || "not_registered").toString().toLowerCase();
  const entry = MAP[key] ?? MAP.not_registered;
  return (
    <span
      data-label-emerald-only
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-extrabold uppercase tracking-[0.12em] border-0",
        entry.cls,
        className
      )}
    >
      {entry.label}
    </span>
  );
}
