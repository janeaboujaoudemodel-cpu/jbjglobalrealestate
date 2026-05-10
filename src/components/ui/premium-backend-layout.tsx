import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, Sparkles, TrendingUp, TrendingDown, Minus, Command, Search } from 'lucide-react';

/**
 * Premium Backend Design System v2.0
 * White/Gold/Champagne theme for all backend interfaces
 * CRM, Admin, Employee Hub, HR, Founder Assistant, IT Department
 */

// Section contrast variants for visual hierarchy
type SectionVariant = 'white' | 'champagne' | 'cream' | 'ivory' | 'pearl';

const sectionVariants: Record<SectionVariant, string> = {
  white: 'bg-[#FDFBF7]',
  champagne: 'bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]',
  cream: 'bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]',
  ivory: 'bg-gradient-to-r from-[#FFFEF9] to-[#FBF9F3]',
  pearl: 'bg-gradient-to-br from-[#F8F6F0] via-[#FDFBF7] to-[#F7F2EA]',
};

// Main layout wrapper for backend pages
interface PremiumBackendLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const PremiumBackendLayout: React.FC<PremiumBackendLayoutProps> = ({ 
  children, 
  className 
}) => {
  return (
    <div className={cn(
      "min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]",
      className
    )}>
      {children}
    </div>
  );
};

// Premium Section with contrast variants
interface PremiumSectionProps {
  children: React.ReactNode;
  variant?: SectionVariant;
  className?: string;
  withBorder?: boolean;
  noPadding?: boolean;
}

export const PremiumSection: React.FC<PremiumSectionProps> = ({ 
  children, 
  variant = 'white',
  className,
  withBorder = false,
  noPadding = false
}) => {
  return (
    <section className={cn(
      sectionVariants[variant],
      withBorder && 'border-b border-[#B89555]/10',
      !noPadding && 'py-6 px-4 md:px-6',
      'transition-colors duration-300',
      className
    )}>
      {children}
    </section>
  );
};

// Premium Card with gold accents
interface PremiumCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'glass' | 'stat';
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
}

export const PremiumCard: React.FC<PremiumCardProps> = ({ 
  children, 
  className,
  variant = 'default',
  hover = true,
  glow = false,
  onClick
}) => {
  const variants = {
    default: 'bg-[#FDFBF7] border-2 border-[#B89555]/20 shadow-[0_4px_20px_rgba(200,167,102,0.08)]',
    elevated: 'bg-[#FDFBF7] border-2 border-[#B89555]/20 shadow-lg shadow-gold/10',
    outlined: 'bg-transparent border-2 border-[#B89555]/30',
    glass: 'bg-[#FDFBF7]/90 backdrop-blur-xl border border-[#B89555]/20',
    stat: 'bg-gradient-to-br from-white to-[#FDFBF7] border-2 border-[#B89555]/25 shadow-[0_4px_20px_rgba(200,167,102,0.1)]',
  };

  return (
    <div 
      className={cn(
        'rounded-2xl p-6 transition-all duration-300',
        variants[variant],
        hover && 'hover:border-[#B89555]/50 hover:shadow-[0_8px_30px_rgba(200,167,102,0.15)]',
        glow && 'shadow-[0_0_30px_rgba(200,167,102,0.2)]',
        onClick && 'cursor-pointer active:scale-[0.98]',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

// Premium Stat Card with AI insights
interface PremiumStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  accentColor?: 'gold' | 'green' | 'blue' | 'purple' | 'orange' | 'red';
  onClick?: () => void;
  className?: string;
}

const accentColors = {
  gold: {
    bg: 'bg-gradient-to-br from-gold/20 to-gold/5',
    border: 'border-[#B89555]/30',
    icon: 'text-[#1A1A1A]',
    text: 'text-[#1A1A1A]',
    iconBg: 'bg-[#EFE6D6]/10',
  },
  green: {
    bg: 'bg-gradient-to-br from-emerald-500/15 to-emerald-500/5',
    border: 'border-emerald-500/30',
    icon: 'text-emerald-600',
    text: 'text-emerald-600',
    iconBg: 'bg-emerald-500/10',
  },
  blue: {
    bg: 'bg-gradient-to-br from-blue-500/15 to-blue-500/5',
    border: 'border-blue-500/30',
    icon: 'text-blue-600',
    text: 'text-blue-600',
    iconBg: 'bg-blue-500/10',
  },
  purple: {
    bg: 'bg-gradient-to-br from-purple-500/15 to-purple-500/5',
    border: 'border-purple-500/30',
    icon: 'text-purple-600',
    text: 'text-purple-600',
    iconBg: 'bg-purple-500/10',
  },
  orange: {
    bg: 'bg-gradient-to-br from-orange-500/15 to-orange-500/5',
    border: 'border-orange-500/30',
    icon: 'text-orange-600',
    text: 'text-orange-600',
    iconBg: 'bg-orange-500/10',
  },
  red: {
    bg: 'bg-gradient-to-br from-red-500/15 to-red-500/5',
    border: 'border-red-500/30',
    icon: 'text-red-600',
    text: 'text-red-600',
    iconBg: 'bg-red-500/10',
  },
};

export const PremiumStatCard: React.FC<PremiumStatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  accentColor = 'gold',
  onClick,
  className
}) => {
  const colors = accentColors[accentColor];
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  
  return (
    <div 
      onClick={onClick}
      className={cn(
        'rounded-2xl p-5 border-2 transition-all duration-300',
        colors.bg,
        colors.border,
        'hover:shadow-lg hover:scale-[1.02]',
        onClick && 'cursor-pointer active:scale-[0.98]',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-[#1A1A1A]/70 mb-1">{title}</p>
          <p className={cn('text-3xl font-bold', colors.text)}>{value}</p>
          {subtitle && (
            <p className="text-xs text-[#1A1A1A]/70 mt-1">{subtitle}</p>
          )}
          {trend && trendValue && (
            <div className={cn(
              'flex items-center gap-1 mt-2 text-xs font-medium',
              trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-500' : 'text-[#1A1A1A]/70'
            )}>
              <TrendIcon className="w-3 h-3" />
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center',
            colors.iconBg
          )}>
            <Icon className={cn('w-6 h-6', colors.icon)} />
          </div>
        )}
      </div>
    </div>
  );
};

// Premium heading with gold accent option
interface PremiumHeadingProps {
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4;
  className?: string;
  accent?: boolean;
}

export const PremiumHeading: React.FC<PremiumHeadingProps> = ({ 
  children, 
  level = 2,
  className,
  accent = false
}) => {
  const sizes = {
    1: 'text-3xl md:text-4xl font-bold',
    2: 'text-2xl md:text-3xl font-semibold',
    3: 'text-xl md:text-2xl font-semibold',
    4: 'text-lg md:text-xl font-medium',
  };

  const Tag = `h${level}` as keyof JSX.IntrinsicElements;

  return (
    <Tag className={cn(
      sizes[level],
      'tracking-tight',
      accent ? 'text-[#1A1A1A]' : 'text-[#1A1A1A]',
      className
    )}>
      {children}
    </Tag>
  );
};

// Premium text with gold styling option
interface PremiumTextProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'muted' | 'gold' | 'label';
}

export const PremiumText: React.FC<PremiumTextProps> = ({ 
  children, 
  className,
  variant = 'default'
}) => {
  const variants = {
    default: 'text-[#1A1A1A]',
    muted: 'text-[#1A1A1A]/70',
    gold: 'text-[#1A1A1A] font-medium',
    label: 'text-xs uppercase tracking-wider text-[#1A1A1A] font-semibold',
  };

  return (
    <p className={cn(variants[variant], className)}>
      {children}
    </p>
  );
};

// Premium stat for dashboards (legacy support)
interface PremiumStatProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  className?: string;
}

export const PremiumStat: React.FC<PremiumStatProps> = ({
  label,
  value,
  change,
  changeType = 'neutral',
  icon,
  className
}) => {
  const changeColors = {
    positive: 'text-emerald-600',
    negative: 'text-red-500',
    neutral: 'text-[#1A1A1A]/70',
  };

  return (
    <PremiumCard variant="stat" className={cn('relative overflow-hidden', className)}>
      <div className="flex items-start justify-between">
        <div>
          <PremiumText variant="label">{label}</PremiumText>
          <p className="text-3xl font-bold text-[#1A1A1A] mt-2">{value}</p>
          {change && (
            <p className={cn('text-sm mt-1', changeColors[changeType])}>
              {change}
            </p>
          )}
        </div>
        {icon && (
          <div className="p-3 bg-gradient-to-br from-gold/15 to-gold/5 rounded-xl text-[#1A1A1A] border border-[#B89555]/20">
            {icon}
          </div>
        )}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
    </PremiumCard>
  );
};

// Premium badge/tag
interface PremiumBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'gold' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
  className?: string;
}

export const PremiumBadge: React.FC<PremiumBadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  glow = false,
  className
}) => {
  const variants = {
    default: 'bg-[#F7F2EA] text-[#1A1A1A]/70 border-[#B89555]/30',
    gold: 'bg-gradient-to-r from-gold/20 to-gold/10 text-[#1A1A1A] border-[#B89555]/30',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    error: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full font-medium border',
      variants[variant],
      sizes[size],
      glow && variant === 'gold' && 'shadow-[0_0_10px_rgba(200,167,102,0.3)]',
      className
    )}>
      {children}
    </span>
  );
};

// Premium divider with gold accent
interface PremiumDividerProps {
  className?: string;
  label?: string;
  gold?: boolean;
}

export const PremiumDivider: React.FC<PremiumDividerProps> = ({ 
  className,
  label,
  gold = true
}) => {
  if (label) {
    return (
      <div className={cn('flex items-center gap-4', className)}>
        <div className={cn('flex-1 h-px', gold ? 'bg-gradient-to-r from-transparent via-gold/30 to-transparent' : 'bg-[#EFE6D6]')} />
        <span className="text-xs uppercase tracking-wider text-[#1A1A1A] font-medium">{label}</span>
        <div className={cn('flex-1 h-px', gold ? 'bg-gradient-to-r from-transparent via-gold/30 to-transparent' : 'bg-[#EFE6D6]')} />
      </div>
    );
  }

  return (
    <div className={cn(
      'h-px',
      gold ? 'bg-gradient-to-r from-transparent via-gold/30 to-transparent' : 'bg-[#EFE6D6]',
      className
    )} />
  );
};

// Premium container with max-width
interface PremiumContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const PremiumContainer: React.FC<PremiumContainerProps> = ({
  children,
  className,
  size = 'xl'
}) => {
  const sizes = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-[1600px]',
  };

  return (
    <div className={cn(
      'mx-auto px-4 sm:px-6 lg:px-8',
      sizes[size],
      className
    )}>
      {children}
    </div>
  );
};

// Premium grid layout
interface PremiumGridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PremiumGrid: React.FC<PremiumGridProps> = ({
  children,
  cols = 3,
  gap = 'md',
  className
}) => {
  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
  };

  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-5',
    lg: 'gap-6',
  };

  return (
    <div className={cn(
      'grid',
      colClasses[cols],
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  );
};

// AI Indicator Badge
export const AIIndicator: React.FC<{ active?: boolean; className?: string }> = ({
  active = true,
  className
}) => {
  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full',
      'bg-gradient-to-r from-gold/15 to-gold/5 border border-[#B89555]/30',
      className
    )}>
      <Sparkles className={cn('w-3.5 h-3.5 text-[#1A1A1A]', active && 'animate-pulse')} />
      <span className="text-xs font-semibold text-[#1A1A1A]">AI Active</span>
    </div>
  );
};

// Premium Quick Action Button
interface QuickActionButtonProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  icon: Icon,
  label,
  onClick,
  variant = 'secondary',
  size = 'md',
  className
}) => {
  const variants = {
    primary: 'bg-gradient-to-r from-gold to-gold/80 text-[#1A1A1A] hover:brightness-110 shadow-lg shadow-gold/20 border-0',
    secondary: 'bg-[#FDFBF7] border-2 border-[#B89555]/30 text-[#1A1A1A] hover:border-[#B89555]/50 hover:bg-[#EFE6D6]/5',
    ghost: 'bg-transparent text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:bg-[#EFE6D6]/10 border-0',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-5 py-3 text-base gap-2.5',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center rounded-xl font-medium transition-all duration-200',
        variants[variant],
        sizes[size],
        className
      )}
    >
      <Icon className={iconSizes[size]} />
      <span>{label}</span>
    </button>
  );
};

// Premium Header for backend pages
interface PremiumPageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  badge?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const PremiumPageHeader: React.FC<PremiumPageHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  badge,
  actions,
  className
}) => {
  return (
    <header className={cn(
      'sticky top-0 z-40 bg-[#FDFBF7]/95 backdrop-blur-xl border-b border-[#B89555]/15',
      className
    )}>
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {Icon && (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border border-[#B89555]/30 flex items-center justify-center">
                <Icon className="w-6 h-6 text-[#1A1A1A]" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-[#1A1A1A]">{title}</h1>
                {badge && (
                  <PremiumBadge variant="gold" glow>{badge}</PremiumBadge>
                )}
              </div>
              {subtitle && (
                <p className="text-sm text-[#1A1A1A]/70 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          {actions && (
            <div className="flex items-center gap-3">
              {actions}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

// Premium Section Header
interface PremiumSectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
}

export const PremiumSectionHeader: React.FC<PremiumSectionHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  action,
  className
}) => {
  return (
    <div className={cn('flex items-center justify-between mb-6', className)}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border border-[#B89555]/30 flex items-center justify-center">
            <Icon className="w-5 h-5 text-[#1A1A1A]" />
          </div>
        )}
        <div>
          <h2 className="text-xl font-bold text-[#1A1A1A]">{title}</h2>
          {subtitle && (
            <p className="text-sm text-[#1A1A1A]/70">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

// Premium Search Box
interface PremiumSearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showCommand?: boolean;
}

export const PremiumSearchBox: React.FC<PremiumSearchBoxProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  className,
  showCommand = true
}) => {
  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]/70" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full pl-10 pr-12 py-2.5 rounded-xl',
          'bg-[#FDFBF7] border-2 border-[#B89555]/20',
          'text-[#1A1A1A] placeholder:text-[#1A1A1A]/70',
          'focus:outline-none focus:border-[#B89555]/40 focus:ring-2 focus:ring-gold/10',
          'transition-all duration-200'
        )}
      />
      {showCommand && (
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:inline-flex items-center gap-0.5 px-2 py-1 bg-[#F7F2EA] rounded text-xs font-medium text-[#1A1A1A]/70">
          <Command className="w-3 h-3" />K
        </kbd>
      )}
    </div>
  );
};

export default PremiumBackendLayout;
