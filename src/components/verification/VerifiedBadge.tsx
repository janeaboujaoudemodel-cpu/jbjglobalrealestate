import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  showLabel?: boolean;
}

const sizeMap = {
  sm: "w-3.5 h-3.5",
  md: "w-4.5 h-4.5",
  lg: "w-5 h-5",
};

const VerifiedBadge = ({ size = "sm", className, showLabel = false }: VerifiedBadgeProps) => {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-emerald-500",
        className
      )}
      title="Verified User"
    >
      <ShieldCheck className={cn(sizeMap[size], "flex-shrink-0")} />
      {showLabel && (
        <span className="text-xs font-medium text-emerald-600">Verified</span>
      )}
    </span>
  );
};

export default VerifiedBadge;
