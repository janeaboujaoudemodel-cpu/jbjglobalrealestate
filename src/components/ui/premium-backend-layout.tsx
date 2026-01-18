import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Premium Backend Layout System
 * White/Gold/Champagne theme for all backend interfaces
 * CRM, Admin, Employee Hub, HR, Founder Assistant
 */

interface PremiumBackendLayoutProps {
  children: React.ReactNode;
  className?: string;
}

// Main layout wrapper for backend pages
export const PremiumBackendLayout: React.FC<PremiumBackendLayoutProps> = ({ 
  children, 
  className 
}) => {
  return (
    <div className={cn(
      "min-h-screen bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6]",
      className
    )}>
      {children}
    </div>
  );
};

// Alternating section backgrounds for visual contrast
interface PremiumSectionProps {
  children: React.ReactNode;
  variant?: 'white' | 'champagne' | 'cream' | 'ivory';
  className?: string;
  withBorder?: boolean;
}

export const PremiumSection: React.FC<PremiumSectionProps> = ({ 
  children, 
  variant = 'white',
  className,
  withBorder = false
}) => {
  const variants = {
    white: 'bg-white',
    champagne: 'bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]',
    cream: 'bg-gradient-to-br from-[#FAF8F5] to-[#F5F0E6]',
    ivory: 'bg-[#FFFEF9]',
  };

  return (
    <section className={cn(
      variants[variant],
      withBorder && 'border-b border-gold/10',
      'transition-colors duration-300',
      className
    )}>
      {children}
    </section>
  );
};

// Premium card with gold accents
interface PremiumCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  hover?: boolean;
  onClick?: () => void;
}

export const PremiumCard: React.FC<PremiumCardProps> = ({ 
  children, 
  className,
  variant = 'default',
  hover = true,
  onClick
}) => {
  const variants = {
    default: 'bg-white border border-gold/20 shadow-sm',
    elevated: 'bg-white border border-gold/20 shadow-lg shadow-gold/5',
    outlined: 'bg-transparent border-2 border-gold/30',
    glass: 'bg-white/80 backdrop-blur-sm border border-gold/20',
  };

  return (
    <div 
      className={cn(
        'rounded-xl p-6 transition-all duration-300',
        variants[variant],
        hover && 'hover:border-gold/50 hover:shadow-lg hover:shadow-gold/10',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
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
      accent ? 'text-gold' : 'text-black',
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
    default: 'text-black',
    muted: 'text-zinc-600',
    gold: 'text-gold font-medium',
    label: 'text-xs uppercase tracking-wider text-gold font-semibold',
  };

  return (
    <p className={cn(variants[variant], className)}>
      {children}
    </p>
  );
};

// Premium stat card for dashboards
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
    neutral: 'text-zinc-500',
  };

  return (
    <PremiumCard className={cn('relative overflow-hidden', className)}>
      <div className="flex items-start justify-between">
        <div>
          <PremiumText variant="label">{label}</PremiumText>
          <p className="text-3xl font-bold text-black mt-2">{value}</p>
          {change && (
            <p className={cn('text-sm mt-1', changeColors[changeType])}>
              {change}
            </p>
          )}
        </div>
        {icon && (
          <div className="p-3 bg-gradient-to-br from-gold/10 to-gold/5 rounded-xl text-gold">
            {icon}
          </div>
        )}
      </div>
      {/* Decorative gold accent */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
    </PremiumCard>
  );
};

// Premium badge/tag
interface PremiumBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'gold' | 'success' | 'warning' | 'error';
  className?: string;
}

export const PremiumBadge: React.FC<PremiumBadgeProps> = ({
  children,
  variant = 'default',
  className
}) => {
  const variants = {
    default: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    gold: 'bg-gold/10 text-gold border-gold/30',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    error: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
      variants[variant],
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
}

export const PremiumDivider: React.FC<PremiumDividerProps> = ({ 
  className,
  label 
}) => {
  if (label) {
    return (
      <div className={cn('flex items-center gap-4', className)}>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
        <span className="text-xs uppercase tracking-wider text-gold font-medium">{label}</span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      </div>
    );
  }

  return (
    <div className={cn(
      'h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent',
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
    full: 'max-w-full',
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
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-6',
  };

  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
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
