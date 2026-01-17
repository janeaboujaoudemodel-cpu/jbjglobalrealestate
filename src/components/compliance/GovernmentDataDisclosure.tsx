/**
 * Government Data Disclosure Component
 * Displays mandatory disclosure language for government data references
 */

import React from 'react';
import { Info, ExternalLink, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GOVERNMENT_DISCLOSURES } from '@/config/government-cobranding';

interface GovernmentDataDisclosureProps {
  variant?: 'primary' | 'short' | 'ai' | 'report';
  showIcon?: boolean;
  lastUpdated?: string;
  sources?: string[];
  className?: string;
}

const GovernmentDataDisclosure: React.FC<GovernmentDataDisclosureProps> = ({
  variant = 'short',
  showIcon = true,
  lastUpdated,
  sources,
  className
}) => {
  const getDisclosureText = () => {
    switch (variant) {
      case 'primary':
        return GOVERNMENT_DISCLOSURES.PRIMARY;
      case 'short':
        return GOVERNMENT_DISCLOSURES.SHORT;
      case 'ai':
        return GOVERNMENT_DISCLOSURES.AI_COMBINED;
      case 'report':
        return GOVERNMENT_DISCLOSURES.REPORT;
      default:
        return GOVERNMENT_DISCLOSURES.SHORT;
    }
  };

  if (variant === 'short') {
    return (
      <div className={cn(
        "flex items-center gap-2 text-xs text-muted-foreground",
        className
      )}>
        {showIcon && <Info className="h-3 w-3 shrink-0" />}
        <span>{getDisclosureText()}</span>
        {lastUpdated && (
          <>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Updated: {lastUpdated}
            </span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      "p-4 rounded-lg border bg-muted/30",
      className
    )}>
      <div className="flex items-start gap-3">
        {showIcon && (
          <Info className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
        )}
        <div className="space-y-2 flex-1">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {getDisclosureText()}
          </p>
          
          {(sources || lastUpdated) && (
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border/50">
              {sources && sources.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="font-medium">Sources:</span>
                  <span>{sources.join(', ')}</span>
                </div>
              )}
              {lastUpdated && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>Data as of: {lastUpdated}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GovernmentDataDisclosure;
