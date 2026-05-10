import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  Users,
  DollarSign,
  ChevronRight,
  RefreshCw,
  Brain,
  Target,
  Lightbulb,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PremiumCard, PremiumText, PremiumBadge } from './premium-backend-layout';
import { Button } from './button';

/**
 * AI Insights Panel - Smart Predictions & Recommendations
 * Shows AI-generated insights, predictions, and suggested actions
 */

interface Insight {
  id: string;
  type: 'prediction' | 'alert' | 'recommendation' | 'achievement';
  title: string;
  description: string;
  confidence?: number;
  trend?: 'up' | 'down' | 'neutral';
  action?: {
    label: string;
    onClick: () => void;
  };
  timestamp?: string;
}

interface AIInsightsPanelProps {
  insights?: Insight[];
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const defaultInsights: Insight[] = [];

export const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({
  insights = defaultInsights,
  isLoading = false,
  onRefresh,
  className,
  collapsed = false,
  onToggleCollapse,
}) => {
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);

  const getInsightIcon = (type: Insight['type']) => {
    switch (type) {
      case 'prediction':
        return <Brain className="w-4 h-4" />;
      case 'alert':
        return <AlertCircle className="w-4 h-4" />;
      case 'recommendation':
        return <Lightbulb className="w-4 h-4" />;
      case 'achievement':
        return <CheckCircle2 className="w-4 h-4" />;
    }
  };

  const getInsightColor = (type: Insight['type']) => {
    switch (type) {
      case 'prediction':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'alert':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'recommendation':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'achievement':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    }
  };

  if (collapsed) {
    return (
      <motion.button
        onClick={onToggleCollapse}
        className={cn(
          'fixed right-4 top-1/2 -translate-y-1/2 z-40',
          'flex items-center justify-center w-12 h-12',
          'bg-[#FDFBF7] border border-[#B89555]/20 rounded-xl shadow-lg',
          'hover:shadow-xl hover:border-[#B89555]/40 transition-all',
          className
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Sparkles className="w-5 h-5 text-[#1A1A1A]" />
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 100, opacity: 0 }}
      className={cn(
        'w-full h-full overflow-hidden flex flex-col bg-transparent',
        className
      )}
    >
      {/* Header - Champagne gradient */}
      <div className="p-4 border-b-2 border-[#B89555]/30 bg-gradient-to-r from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] hover:bg-[#1A1A1A] hover:text-white hover:[&_svg]:text-[#B89555] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(184,149,85,0.35)] transition-all duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] rounded-lg border border-[#B89555]/30">
              <Sparkles className="w-5 h-5 text-[#1A1A1A]" />
            </div>
            <div>
              <h3 className="font-semibold text-[#1A1A1A]">AI Insights</h3>
              <p className="text-xs text-[#1A1A1A]/70">Real-time intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onRefresh}
              className={cn(
                'p-2 rounded-lg text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:bg-[#EFE6D6]/10 transition-colors',
                isLoading && 'animate-spin'
              )}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-2 rounded-lg text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:bg-[#EFE6D6]/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Stats - Champagne cards with gold borders */}
      <div className="grid grid-cols-3 gap-2 p-4 border-b-2 border-[#B89555]/20 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]">
        {[
          { label: 'Score', value: '0%', icon: <Target className="w-3 h-3" />, color: 'text-emerald-600' },
          { label: 'Tasks', value: '0', icon: <Clock className="w-3 h-3" />, color: 'text-[#1A1A1A]' },
          { label: 'Leads', value: '0', icon: <Users className="w-3 h-3" />, color: 'text-blue-600' },
        ].map((stat, i) => (
          <div key={i} className="text-center p-2 rounded-lg bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border border-[#B89555]/30 shadow-sm">
            <div className={cn('flex items-center justify-center gap-1 text-lg font-bold', stat.color)}>
              {stat.icon}
              {stat.value}
            </div>
            <div className="text-[10px] text-[#1A1A1A]/70 uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Insights List - With champagne background */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]">
        <AnimatePresence mode="popLayout">
          {insights.map((insight, index) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'p-3 rounded-xl border cursor-pointer transition-all',
                getInsightColor(insight.type),
                expandedInsight === insight.id ? 'ring-2 ring-gold/20' : 'hover:shadow-md'
              )}
              onClick={() => setExpandedInsight(expandedInsight === insight.id ? null : insight.id)}
            >
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-[#FDFBF7]/80">
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-medium text-sm truncate">{insight.title}</h4>
                    {insight.trend && (
                      insight.trend === 'up' 
                        ? <TrendingUp className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        : insight.trend === 'down'
                        ? <TrendingDown className="w-4 h-4 text-red-500 flex-shrink-0" />
                        : null
                    )}
                  </div>
                  
                  <AnimatePresence>
                    {expandedInsight === insight.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="text-xs mt-2 opacity-80">{insight.description}</p>
                        
                        {insight.confidence && (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex-1 h-1.5 bg-[#FDFBF7]/50 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${insight.confidence}%` }}
                                className="h-full bg-current rounded-full"
                              />
                            </div>
                            <span className="text-xs font-medium">{insight.confidence}%</span>
                          </div>
                        )}
                        
                        {insight.action && (
                          <button
                            onClick={(e) => { e.stopPropagation(); insight.action?.onClick(); }}
                            className="mt-3 flex items-center gap-1 text-xs font-medium hover:underline"
                          >
                            {insight.action.label}
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer - Premium champagne */}
      <div className="p-4 border-t-2 border-[#B89555]/30 bg-gradient-to-r from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] hover:bg-[#1A1A1A] hover:text-white hover:[&_svg]:text-[#B89555] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(184,149,85,0.35)] transition-all duration-300">
        <Button variant="primary" className="w-full" onClick={() => {}}>
          <Sparkles className="w-4 h-4 mr-2" />
          View All Insights
        </Button>
      </div>
    </motion.div>
  );
};

export default AIInsightsPanel;
