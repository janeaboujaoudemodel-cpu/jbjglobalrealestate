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

const defaultInsights: Insight[] = [
  {
    id: '1',
    type: 'prediction',
    title: '3 leads likely to convert this week',
    description: 'Based on engagement patterns and lead scoring, Ahmed K., Sarah M., and John D. show high conversion probability.',
    confidence: 87,
    trend: 'up',
    action: { label: 'View Leads', onClick: () => {} },
  },
  {
    id: '2',
    type: 'alert',
    title: '5 follow-ups overdue',
    description: 'These leads haven\'t been contacted in over 48 hours and may need immediate attention.',
    trend: 'down',
    action: { label: 'Review Now', onClick: () => {} },
  },
  {
    id: '3',
    type: 'recommendation',
    title: 'Best time to call: 10 AM - 12 PM',
    description: 'AI analysis shows your leads respond 40% better during mid-morning hours.',
    confidence: 92,
    trend: 'up',
  },
  {
    id: '4',
    type: 'achievement',
    title: 'Response time improved by 23%',
    description: 'Your average response time this week is 2.3 hours, beating your target of 3 hours.',
    trend: 'up',
  },
];

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
          'bg-white border border-gold/20 rounded-xl shadow-lg',
          'hover:shadow-xl hover:border-gold/40 transition-all',
          className
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Sparkles className="w-5 h-5 text-gold" />
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 100, opacity: 0 }}
      className={cn(
        'w-80 bg-white border-l border-gold/10 h-full overflow-hidden flex flex-col',
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-gold/10 bg-gradient-to-r from-white to-[#FDFBF7]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-gold/10 to-gold/5 rounded-lg">
              <Sparkles className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h3 className="font-semibold text-black">AI Insights</h3>
              <p className="text-xs text-zinc-500">Real-time intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onRefresh}
              className={cn(
                'p-2 rounded-lg text-zinc-400 hover:text-gold hover:bg-gold/5 transition-colors',
                isLoading && 'animate-spin'
              )}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-2 rounded-lg text-zinc-400 hover:text-gold hover:bg-gold/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2 p-4 border-b border-gold/10">
        {[
          { label: 'Score', value: '87%', icon: <Target className="w-3 h-3" />, color: 'text-emerald-600' },
          { label: 'Tasks', value: '12', icon: <Clock className="w-3 h-3" />, color: 'text-amber-600' },
          { label: 'Leads', value: '24', icon: <Users className="w-3 h-3" />, color: 'text-blue-600' },
        ].map((stat, i) => (
          <div key={i} className="text-center p-2 rounded-lg bg-zinc-50">
            <div className={cn('flex items-center justify-center gap-1 text-lg font-bold', stat.color)}>
              {stat.icon}
              {stat.value}
            </div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Insights List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
                <div className="p-1.5 rounded-lg bg-white/80">
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
                            <div className="flex-1 h-1.5 bg-white/50 rounded-full overflow-hidden">
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

      {/* Footer */}
      <div className="p-4 border-t border-gold/10 bg-gradient-to-r from-[#FDFBF7] to-white">
        <Button
          variant="outline"
          className="w-full border-gold/30 text-gold hover:bg-gold/5"
          onClick={() => {/* TODO: Open full insights view */}}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          View All Insights
        </Button>
      </div>
    </motion.div>
  );
};

export default AIInsightsPanel;
