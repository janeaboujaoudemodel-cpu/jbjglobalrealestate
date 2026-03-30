import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemedIconProps {
  icon: LucideIcon;
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

/**
 * ThemedIcon — Monochrome design system
 * On dark backgrounds (variant="dark"): White circle with black icon
 * On light backgrounds (variant="light"): Black circle with white icon
 */
export function ThemedIcon({ 
  icon: Icon, 
  variant = "light", 
  size = "md",
  className 
}: ThemedIconProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  const iconSizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
    xl: "w-8 h-8",
  };

  const bgClass = variant === "dark" ? "bg-white" : "bg-[#1A1A1A]";
  const iconColor = variant === "dark" ? "text-black" : "text-white";

  return (
    <div 
      className={cn(
        sizeClasses[size],
        bgClass,
        "rounded-full flex items-center justify-center flex-shrink-0",
        className
      )}
    >
      <Icon className={cn(iconSizeClasses[size], iconColor)} />
    </div>
  );
}
