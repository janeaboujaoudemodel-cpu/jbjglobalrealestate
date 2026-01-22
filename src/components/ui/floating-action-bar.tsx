import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  UserPlus,
  Phone,
  ClipboardList,
  Calendar,
  MessageSquare,
  Search,
  Sparkles,
  X,
  Command,
  Mic,
  FileText,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Floating Action Bar - Premium Quick Actions
 * Fixed bottom bar with contextual actions for backend interfaces
 */

interface ActionItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  color?: string;
}

interface FloatingActionBarProps {
  className?: string;
}

export const FloatingActionBar: React.FC<FloatingActionBarProps> = ({ className }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);

  // Context-aware actions based on current page
  const getContextualActions = (): ActionItem[] => {
    const path = location.pathname;

    const baseActions: ActionItem[] = [
      {
        id: 'search',
        label: 'Search',
        icon: <Command className="w-4 h-4" />,
        action: () => window.dispatchEvent(new Event('jj:open-command-palette')),
        color: 'bg-gradient-to-br from-gold to-gold-dark'
      },
    ];

    // CRM-specific actions
    if (path.includes('/crm') || path.includes('/leads')) {
      return [
        ...baseActions,
        {
          id: 'new-lead',
          label: 'New Lead',
          icon: <UserPlus className="w-4 h-4" />,
          action: () => navigate('/crm?action=new-lead'),
          color: 'bg-gradient-to-br from-emerald-500 to-emerald-600'
        },
        {
          id: 'call',
          label: 'Call',
          icon: <Phone className="w-4 h-4" />,
          action: () => navigate('/crm/calendar'),
          color: 'bg-gradient-to-br from-blue-500 to-blue-600'
        },
        {
          id: 'task',
          label: 'Task',
          icon: <ClipboardList className="w-4 h-4" />,
          action: () => navigate('/crm/tasks'),
          color: 'bg-gradient-to-br from-purple-500 to-purple-600'
        },
      ];
    }

    // HR-specific actions
    if (path.includes('/hr') || path.includes('/employee')) {
      return [
        ...baseActions,
        {
          id: 'review',
          label: 'Review',
          icon: <FileText className="w-4 h-4" />,
          action: () => navigate('/hr-dashboard'),
          color: 'bg-gradient-to-br from-purple-500 to-purple-600'
        },
        {
          id: 'calendar',
          label: 'Schedule',
          icon: <Calendar className="w-4 h-4" />,
          action: () => navigate('/crm/calendar'),
          color: 'bg-gradient-to-br from-blue-500 to-blue-600'
        },
      ];
    }

    // Admin/Founder actions
    if (path.includes('/admin') || path.includes('/founder')) {
      return [
        ...baseActions,
        {
          id: 'analytics',
          label: 'Analytics',
          icon: <TrendingUp className="w-4 h-4" />,
          action: () => navigate('/jbj-analytics'),
          color: 'bg-gradient-to-br from-blue-500 to-blue-600'
        },
        {
          id: 'ai',
          label: 'AI Tools',
          icon: <Sparkles className="w-4 h-4" />,
          action: () => navigate('/ai-hub'),
          color: 'bg-gradient-to-br from-purple-500 to-purple-600'
        },
      ];
    }

    // Default actions
    return [
      ...baseActions,
      {
        id: 'new-lead',
        label: 'New Lead',
        icon: <UserPlus className="w-4 h-4" />,
        action: () => navigate('/crm?action=new-lead'),
        color: 'bg-gradient-to-br from-emerald-500 to-emerald-600'
      },
      {
        id: 'message',
        label: 'Message',
        icon: <MessageSquare className="w-4 h-4" />,
        action: () => navigate('/jbj-broker-messages'),
        color: 'bg-gradient-to-br from-blue-500 to-blue-600'
      },
      {
        id: 'calendar',
        label: 'Calendar',
        icon: <Calendar className="w-4 h-4" />,
        action: () => navigate('/crm/calendar'),
        color: 'bg-gradient-to-br from-purple-500 to-purple-600'
      },
    ];
  };

  const actions = getContextualActions();

  return (
    <>
      {/* Command Palette is managed globally */}
      
      {/* Floating Action Bar */}
      <div className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
        className
      )}>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative"
        >
          {/* Main Bar */}
          <div className="flex items-center gap-1 p-1.5 bg-white/95 backdrop-blur-xl border border-gold/20 rounded-2xl shadow-xl shadow-black/10">
            {/* Quick Action Buttons */}
            <AnimatePresence mode="popLayout">
              {actions.map((action, index) => (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={action.action}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium text-sm transition-all duration-200',
                    action.color || 'bg-gradient-to-br from-gold to-gold-dark',
                    'hover:shadow-lg hover:scale-105 active:scale-95'
                  )}
                >
                  {action.icon}
                  <span className="hidden sm:inline">{action.label}</span>
                </motion.button>
              ))}
            </AnimatePresence>

            {/* Divider */}
            <div className="w-px h-8 bg-gold/20 mx-1" />

            {/* Voice Command */}
            <button
              onClick={() => {/* TODO: Implement voice command */}}
              className="p-2.5 rounded-xl text-gold hover:bg-gold/10 transition-colors"
              title="Voice Command"
            >
              <Mic className="w-5 h-5" />
            </button>

            {/* AI Quick Actions */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(
                'p-2.5 rounded-xl transition-all duration-200',
                isExpanded 
                  ? 'bg-gold text-white rotate-45' 
                  : 'text-gold hover:bg-gold/10'
              )}
            >
              <Plus className="w-5 h-5 transition-transform" />
            </button>
          </div>

          {/* Expanded AI Actions */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-full mb-3 right-0 min-w-[200px] bg-white/95 backdrop-blur-xl border border-gold/20 rounded-xl shadow-xl shadow-black/10 p-2"
              >
                <div className="text-xs uppercase tracking-wider text-gold font-semibold px-3 py-2">
                  AI Quick Actions
                </div>
                {[
                  { icon: <Sparkles />, label: 'AI Summary', action: () => {} },
                  { icon: <MessageSquare />, label: 'Draft Message', action: () => {} },
                  { icon: <TrendingUp />, label: 'Predict Outcome', action: () => {} },
                  { icon: <FileText />, label: 'Generate Report', action: () => {} },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => { item.action(); setIsExpanded(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-700 hover:bg-gold/10 hover:text-gold transition-colors"
                  >
                    <span className="w-4 h-4">{item.icon}</span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  );
};

export default FloatingActionBar;
