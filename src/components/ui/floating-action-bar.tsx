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
  Mic,
  FileText,
  TrendingUp,
  Brain
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ActionItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
}

interface FloatingActionBarProps {
  className?: string;
}

export const FloatingActionBar: React.FC<FloatingActionBarProps> = ({ className }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const handleVoiceCommand = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Voice recognition not supported in this browser');
      return;
    }
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onstart = () => { setIsListening(true); toast.info('Listening... Speak now'); };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      setIsListening(false);
      if (transcript.includes('new lead') || transcript.includes('add lead')) { navigate('/crm?action=new-lead'); toast.success('Opening new lead form'); }
      else if (transcript.includes('calendar') || transcript.includes('schedule')) { navigate('/crm/calendar'); toast.success('Opening calendar'); }
      else if (transcript.includes('task') || transcript.includes('tasks')) { navigate('/crm/tasks'); toast.success('Opening tasks'); }
      else if (transcript.includes('note') || transcript.includes('notes')) { navigate('/crm/notes'); toast.success('Opening notes'); }
      else if (transcript.includes('analytics') || transcript.includes('dashboard')) { navigate('/jbj-analytics'); toast.success('Opening analytics'); }
      else if (transcript.includes('search')) { window.dispatchEvent(new Event('jj:open-command-palette')); toast.success('Opening search'); }
      else { toast.info(`Heard: "${transcript}". Try "new lead", "calendar", "tasks", or "notes"`); }
    };
    recognition.onerror = () => { setIsListening(false); toast.error('Voice recognition failed'); };
    recognition.onend = () => { setIsListening(false); };
    recognition.start();
  };

  const getContextualActions = (): ActionItem[] => {
    const path = location.pathname;
    const baseActions: ActionItem[] = [
      { id: 'search', label: 'Search', icon: <Search className="w-4 h-4" />, action: () => window.dispatchEvent(new Event('jj:open-command-palette')) },
    ];
    if (path.includes('/crm') || path.includes('/leads')) {
      return [...baseActions,
        { id: 'new-lead', label: 'New Lead', icon: <UserPlus className="w-4 h-4" />, action: () => navigate('/crm?action=new-lead') },
        { id: 'call', label: 'Call', icon: <Phone className="w-4 h-4" />, action: () => { toast.info('Select a lead to call from the CRM'); navigate('/crm'); } },
        { id: 'task', label: 'Task', icon: <ClipboardList className="w-4 h-4" />, action: () => navigate('/crm/tasks') },
      ];
    }
    if (path.includes('/hr') || path.includes('/employee')) {
      return [...baseActions,
        { id: 'review', label: 'Review', icon: <FileText className="w-4 h-4" />, action: () => navigate('/employee-management') },
        { id: 'calendar', label: 'Schedule', icon: <Calendar className="w-4 h-4" />, action: () => navigate('/crm/calendar') },
      ];
    }
    if (path.includes('/admin') || path.includes('/founder')) {
      return [...baseActions,
        { id: 'analytics', label: 'Analytics', icon: <TrendingUp className="w-4 h-4" />, action: () => navigate('/jbj-analytics') },
        { id: 'ai', label: 'AI Tools', icon: <Sparkles className="w-4 h-4" />, action: () => navigate('/ai-hub') },
      ];
    }
    return [...baseActions,
      { id: 'new-lead', label: 'New Lead', icon: <UserPlus className="w-4 h-4" />, action: () => navigate('/crm?action=new-lead') },
      { id: 'message', label: 'Message', icon: <MessageSquare className="w-4 h-4" />, action: () => navigate('/jbj-broker-messages') },
      { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-4 h-4" />, action: () => navigate('/crm/calendar') },
    ];
  };

  const actions = getContextualActions();

  return (
    <div className={cn('fixed bottom-6 left-1/2 -translate-x-1/2 z-50 opacity-60 hover:opacity-95 transition-opacity duration-300', className)} style={{ transform: 'translateX(-50%) scale(0.72)' }}>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative"
      >
        {/* Main Bar — clean white */}
        <div className="flex items-center gap-1 p-1.5 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-sm">
          <AnimatePresence mode="popLayout">
            {actions.map((action, index) => (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.05 }}
                onClick={action.action}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium text-sm transition-all duration-200 bg-gray-50 text-black border border-gray-200 hover:bg-gray-100 hover:shadow-sm active:translate-y-0"
              >
                <span className="text-gray-600">{action.icon}</span>
                <span className="hidden sm:inline">{action.label}</span>
              </motion.button>
            ))}
          </AnimatePresence>

          <div className="w-px h-7 bg-gray-200 mx-0.5" />

          <button
            onClick={handleVoiceCommand}
            className={cn(
              'p-2 rounded-xl transition-all duration-200',
              isListening
                ? 'bg-black text-white animate-pulse'
                : 'text-gray-500 hover:bg-gray-100 hover:text-black'
            )}
            title="Voice Command"
          >
            <Mic className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              'p-2 rounded-xl transition-all duration-200',
              isExpanded
                ? 'bg-black text-white rotate-45'
                : 'text-gray-500 hover:bg-gray-100 hover:text-black'
            )}
          >
            <Plus className="w-4 h-4 transition-transform" />
          </button>
        </div>

        {/* Expanded AI Actions */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-full mb-3 right-0 min-w-[200px] bg-white border border-gray-200 rounded-xl shadow-xl p-2"
            >
              <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold px-3 py-2">
                AI Quick Actions
              </div>
              {[
                { icon: <Brain className="w-4 h-4" />, label: 'AI Summary', action: () => navigate('/crm/assistant') },
                { icon: <MessageSquare className="w-4 h-4" />, label: 'Draft Message', action: () => navigate('/crm/notes') },
                { icon: <TrendingUp className="w-4 h-4" />, label: 'Deal Insights', action: () => navigate('/crm') },
                { icon: <FileText className="w-4 h-4" />, label: 'Generate Report', action: () => navigate('/jbj-broker-reports') },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => { item.action(); setIsExpanded(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-black hover:bg-gray-100 transition-colors"
                >
                  <span className="text-gray-500">{item.icon}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default FloatingActionBar;
