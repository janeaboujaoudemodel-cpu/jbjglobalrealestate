import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function BrokerEmptyState({ icon, title, description, action, className }: Props) {
  return (
    <div
      className={cn(
        "rounded-xl bg-[#FDFBF7] border border-dashed border-[#B89555]/35 px-6 py-10 text-center",
        className,
      )}
    >
      {icon && (
        <div className="mx-auto mb-3 grid place-items-center h-10 w-10 rounded-full bg-[#EFE6D6] border border-[#B89555]/30 text-[#1A1A1A]">
          {icon}
        </div>
      )}
      <div className="text-sm font-semibold text-[#1A1A1A]">{title}</div>
      {description && (
        <p className="mt-1.5 text-xs text-[#1A1A1A]/65 max-w-md mx-auto leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
