/**
 * AI Risk Filter Component
 * Displays when AI output has been filtered for compliance
 */

import React from 'react';
import { AlertTriangle, ShieldAlert, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface AIRiskFilterProps {
  filterReason: 'prediction' | 'returns' | 'recommendation' | 'comparison' | 'certainty';
  originalIntent?: string;
  showDetails?: boolean;
}

const filterMessages = {
  prediction: {
    title: 'Content Filtered',
    description: 'Price predictions are not provided as they may be misleading.',
    alternative: 'View historical trends and market context instead.'
  },
  returns: {
    title: 'Content Filtered',
    description: 'Return promises or projections cannot be displayed.',
    alternative: 'Consult a licensed financial advisor for investment guidance.'
  },
  recommendation: {
    title: 'Content Filtered',
    description: 'Direct recommendations are outside our advisory scope.',
    alternative: 'Review the market data and consult with our licensed brokers.'
  },
  comparison: {
    title: 'Content Filtered',
    description: 'Best investment comparisons are not provided.',
    alternative: 'Each opportunity has unique characteristics to consider.'
  },
  certainty: {
    title: 'Content Filtered',
    description: 'Certainty language has been moderated for accuracy.',
    alternative: 'Market conditions are subject to change.'
  }
};

const AIRiskFilter: React.FC<AIRiskFilterProps> = ({
  filterReason,
  originalIntent,
  showDetails = false
}) => {
  const message = filterMessages[filterReason];

  return (
    <Alert variant="default" className="border-amber-500/50 bg-amber-500/5">
      <ShieldAlert className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-700">{message.title}</AlertTitle>
      <AlertDescription className="space-y-2">
        <p className="text-muted-foreground">{message.description}</p>
        <p className="text-sm font-medium">{message.alternative}</p>
        {showDetails && originalIntent && (
          <details className="mt-2">
            <summary className="text-xs text-muted-foreground cursor-pointer">
              Technical Details
            </summary>
            <p className="text-xs text-muted-foreground mt-1 p-2 bg-muted rounded">
              Filter triggered for: {filterReason}
            </p>
          </details>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default AIRiskFilter;
