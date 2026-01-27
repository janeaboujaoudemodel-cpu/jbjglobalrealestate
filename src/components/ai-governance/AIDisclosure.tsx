/**
 * AI Disclosure Component
 * Mandatory disclosure for all AI interfaces
 */

import React from 'react';
import { Bot, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIDisclosureProps {
  variant?: 'inline' | 'banner' | 'compact';
  mode?: 'public' | 'client' | 'internal';
  className?: string;
}

const AIDisclosure: React.FC<AIDisclosureProps> = ({
  variant = 'inline',
  mode = 'client',
  className
}) => {
  const disclosureText = "This assistant supports information and operational workflows within JBJ Global Real Estate. Final decisions and execution are confirmed through official documentation and processes.";
  
  const modeLabels = {
    public: 'Public Information Mode',
    client: 'Client Advisory Mode',
    internal: 'Internal Operations Mode'
  };

  if (variant === 'compact') {
    return (
      <div className={cn(
        "flex items-center gap-1.5 text-xs text-muted-foreground",
        className
      )}>
        <Bot className="h-3 w-3" />
        <span>AI-Assisted</span>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={cn(
        "bg-muted/50 border-b px-4 py-2 flex items-center gap-3",
        className
      )}>
        <Bot className="h-4 w-4 text-muted-foreground shrink-0" />
        <p className="text-xs text-muted-foreground">{disclosureText}</p>
        <span className="ml-auto text-xs font-medium text-muted-foreground">
          {modeLabels[mode]}
        </span>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-border/50",
      className
    )}>
      <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">{disclosureText}</p>
        <span className="text-xs font-medium text-muted-foreground">
          Mode: {modeLabels[mode]}
        </span>
      </div>
    </div>
  );
};

export default AIDisclosure;
