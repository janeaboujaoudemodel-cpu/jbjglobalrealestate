import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Crown, Star, Zap, Award, Trophy } from "lucide-react";

interface TierBadgeProps {
  tierName: string;
  tierType?: 'broker' | 'client';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const TIER_CONFIGS: Record<string, { icon: typeof Crown; color: string; bgClass: string }> = {
  // Broker tiers
  'Starter': { icon: Star, color: '#064E3B', bgClass: 'jj-emerald-soft' },
  'Rising': { icon: Zap, color: '#064E3B', bgClass: 'jj-emerald-solid' },
  'Performer': { icon: Award, color: '#064E3B', bgClass: 'jj-emerald-solid' },
  'Elite': { icon: Crown, color: '#064E3B', bgClass: 'jj-emerald-solid' },
  'Legend': { icon: Trophy, color: '#064E3B', bgClass: 'jj-emerald-solid' },
  // Client tiers
  'Explorer': { icon: Star, color: '#064E3B', bgClass: 'jj-emerald-soft' },
  'Seeker': { icon: Zap, color: '#064E3B', bgClass: 'jj-emerald-solid' },
  'Investor': { icon: Award, color: '#064E3B', bgClass: 'jj-emerald-solid' },
  'Premium': { icon: Crown, color: '#064E3B', bgClass: 'jj-emerald-solid' },
};

export function TierBadge({ tierName, tierType = 'broker', size = 'md', showIcon = true, className }: TierBadgeProps) {
  const config = TIER_CONFIGS[tierName] || TIER_CONFIGS['Starter'];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-semibold inline-flex items-center gap-1.5 border',
        config.bgClass,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon size={iconSizes[size]} />}
      {tierName}
    </Badge>
  );
}

// Export tier color helper
export function getTierColor(tierName: string): string {
  return TIER_CONFIGS[tierName]?.color || '#6B7280';
}

// Export tier icon helper
export function getTierIcon(tierName: string) {
  return TIER_CONFIGS[tierName]?.icon || Star;
}
