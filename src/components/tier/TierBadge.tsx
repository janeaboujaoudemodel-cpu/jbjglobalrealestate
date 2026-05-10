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
  'Starter': { icon: Star, color: '#6B7280', bgClass: 'bg-[#B89555]/20 text-[#1A1A1A]/70 border-[#B89555]/30' },
  'Rising': { icon: Zap, color: '#059669', bgClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  'Performer': { icon: Award, color: '#3B82F6', bgClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  'Elite': { icon: Crown, color: '#8B5CF6', bgClass: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  'Legend': { icon: Trophy, color: '#D4AF37', bgClass: 'bg-[#EFE6D6]/20 text-[#1A1A1A] border-[#B89555]/30' },
  // Client tiers
  'Explorer': { icon: Star, color: '#6B7280', bgClass: 'bg-[#B89555]/20 text-[#1A1A1A]/70 border-[#B89555]/30' },
  'Seeker': { icon: Zap, color: '#059669', bgClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  'Investor': { icon: Award, color: '#3B82F6', bgClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  'Premium': { icon: Crown, color: '#8B5CF6', bgClass: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
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
