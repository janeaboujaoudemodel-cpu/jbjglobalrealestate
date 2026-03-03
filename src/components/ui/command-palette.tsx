import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  Users, 
  LayoutDashboard, 
  FileText, 
  Calendar, 
  Phone, 
  MessageSquare,
  Plus,
  Settings,
  TrendingUp,
  Building2,
  UserPlus,
  ClipboardList,
  Sparkles,
  Mic,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Command Palette (⌘K) - Premium Quick Access System
 * AI-powered search and navigation for backend interfaces
 */

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
  category: string;
  keywords?: string[];
  shortcut?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Command items
  const commands: CommandItem[] = [
    // Quick Actions
    { id: 'new-lead', title: 'Create New Lead', subtitle: 'Add a new lead to CRM', icon: <UserPlus className="w-4 h-4" />, action: () => { navigate('/crm?action=new-lead'); onClose(); }, category: 'Quick Actions', keywords: ['add', 'create', 'lead', 'new'], shortcut: '⌘N' },
    { id: 'new-task', title: 'Create Task', subtitle: 'Add a new task', icon: <ClipboardList className="w-4 h-4" />, action: () => { navigate('/crm/tasks?action=new'); onClose(); }, category: 'Quick Actions', keywords: ['task', 'todo', 'reminder'], shortcut: '⌘T' },
    { id: 'schedule-call', title: 'Schedule Call', subtitle: 'Book a call with a lead', icon: <Phone className="w-4 h-4" />, action: () => { navigate('/crm/calendar'); onClose(); }, category: 'Quick Actions', keywords: ['call', 'schedule', 'phone'] },
    { id: 'send-message', title: 'Send Message', subtitle: 'Message a lead or team member', icon: <MessageSquare className="w-4 h-4" />, action: () => { navigate('/crm/notes'); onClose(); }, category: 'Quick Actions', keywords: ['message', 'chat', 'notes'] },
    
    // Navigation
    { id: 'crm', title: 'CRM Dashboard', subtitle: 'Leads, deals, and pipeline', icon: <LayoutDashboard className="w-4 h-4" />, action: () => { navigate('/crm'); onClose(); }, category: 'Navigation', keywords: ['crm', 'dashboard', 'sales'] },
    { id: 'employee-hub', title: 'Employee Hub', subtitle: 'Team directory and wall of fame', icon: <Users className="w-4 h-4" />, action: () => { navigate('/employee-hub'); onClose(); }, category: 'Navigation', keywords: ['employees', 'team', 'staff'] },
    { id: 'hr-dashboard', title: 'HR Dashboard', subtitle: 'Applications and performance', icon: <Users className="w-4 h-4" />, action: () => { navigate('/hr-dashboard'); onClose(); }, category: 'Navigation', keywords: ['hr', 'human resources', 'hiring'] },
    { id: 'owner-panel', title: 'Owner Panel', subtitle: 'System settings and configuration', icon: <Settings className="w-4 h-4" />, action: () => { navigate('/admin'); onClose(); }, category: 'Navigation', keywords: ['owner', 'settings', 'system'] },
    { id: 'founder-assistant', title: "Founder's Assistant", subtitle: 'Executive dashboard', icon: <Sparkles className="w-4 h-4" />, action: () => { navigate('/founders-assistant'); onClose(); }, category: 'Navigation', keywords: ['founder', 'ceo', 'executive'] },
    { id: 'analytics', title: 'Analytics Dashboard', subtitle: 'Performance metrics', icon: <TrendingUp className="w-4 h-4" />, action: () => { navigate('/jbj-analytics'); onClose(); }, category: 'Navigation', keywords: ['analytics', 'metrics', 'stats'] },
    { id: 'listing-admin', title: 'Listing Admin', subtitle: 'Property management', icon: <Building2 className="w-4 h-4" />, action: () => { navigate('/listing-admin'); onClose(); }, category: 'Navigation', keywords: ['listings', 'properties', 'real estate'] },
    { id: 'calendar', title: 'Calendar', subtitle: 'Schedule and events', icon: <Calendar className="w-4 h-4" />, action: () => { navigate('/crm/calendar'); onClose(); }, category: 'Navigation', keywords: ['calendar', 'schedule', 'events'] },
    { id: 'notes', title: 'Notes', subtitle: 'View and manage notes', icon: <FileText className="w-4 h-4" />, action: () => { navigate('/crm/notes'); onClose(); }, category: 'Navigation', keywords: ['notes', 'memos', 'documents'] },
    { id: 'inquiries', title: 'Inquiry Management Hub', subtitle: 'Track property inquiries', icon: <MessageSquare className="w-4 h-4" />, action: () => { navigate('/admin/inquiries'); onClose(); }, category: 'Navigation', keywords: ['inquiries', 'inquiry', 'requests', 'property', 'contact'] },
    
    // AI Tools
    { id: 'ai-hub', title: 'AI Hub', subtitle: 'All AI tools in one place', icon: <Sparkles className="w-4 h-4" />, action: () => { navigate('/ai-hub'); onClose(); }, category: 'AI Tools', keywords: ['ai', 'tools', 'automation'] },
    { id: 'design-studio', title: 'Design Studio', subtitle: 'Create marketing materials', icon: <FileText className="w-4 h-4" />, action: () => { navigate('/jbj-design-studio'); onClose(); }, category: 'AI Tools', keywords: ['design', 'marketing', 'creative'] },
    { id: 'business-card-scanner', title: 'Business Card Scanner', subtitle: 'AI-powered OCR scanning', icon: <ClipboardList className="w-4 h-4" />, action: () => { navigate('/business-card-scanner'); onClose(); }, category: 'AI Tools', keywords: ['business', 'card', 'scanner', 'ocr', 'contact', 'scan'] },
    { id: 'property-evaluator', title: 'Property Evaluator', subtitle: 'AI property valuation', icon: <Building2 className="w-4 h-4" />, action: () => { navigate('/property-evaluator'); onClose(); }, category: 'AI Tools', keywords: ['property', 'evaluator', 'valuation', 'value', 'price'] },
    { id: 'rental-index', title: 'Dubai Rental Index', subtitle: 'Official rental rates', icon: <TrendingUp className="w-4 h-4" />, action: () => { navigate('/dubai-rental-index'); onClose(); }, category: 'AI Tools', keywords: ['rental', 'index', 'dubai', 'rent', 'rera'] },
    { id: 'mortgage-calculator', title: 'Mortgage Calculator', subtitle: 'Calculate monthly payments', icon: <FileText className="w-4 h-4" />, action: () => { navigate('/mortgage-calculator'); onClose(); }, category: 'AI Tools', keywords: ['mortgage', 'calculator', 'payment', 'loan', 'finance'] },
  ];

  // Filter commands based on search
  const filteredCommands = search.trim() === '' 
    ? commands 
    : commands.filter(cmd => 
        cmd.title.toLowerCase().includes(search.toLowerCase()) ||
        cmd.subtitle?.toLowerCase().includes(search.toLowerCase()) ||
        cmd.keywords?.some(k => k.toLowerCase().includes(search.toLowerCase()))
      );

  // Group by category
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  let flatIndex = 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 bg-white border border-gold/20 shadow-2xl shadow-gold/10">
        {/* Search Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gold/10 bg-gradient-to-r from-white to-[#FDFBF7]">
          <Search className="w-5 h-5 text-gold" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search commands, pages, or type a query..."
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 text-black placeholder:text-zinc-400 text-lg"
            autoFocus
          />
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-gold/10 border border-gold/20">
            <Mic className="w-3.5 h-3.5 text-gold" />
            <span className="text-xs text-gold font-medium">Voice</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded bg-zinc-100 text-zinc-500 text-xs font-medium">
            ESC
          </kbd>
        </div>

        {/* Command List */}
        <ScrollArea className="max-h-[60vh]">
          <div className="p-2">
            {Object.entries(groupedCommands).map(([category, items]) => (
              <div key={category} className="mb-4">
                <div className="px-3 py-2">
                  <span className="text-xs uppercase tracking-wider text-gold font-semibold">
                    {category}
                  </span>
                </div>
                {items.map((item) => {
                  const currentIndex = flatIndex++;
                  const isSelected = currentIndex === selectedIndex;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={item.action}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                        isSelected 
                          ? 'bg-gradient-to-r from-gold/10 to-gold/5 text-black' 
                          : 'hover:bg-gold/5 text-zinc-700'
                      )}
                    >
                      <div className={cn(
                        'p-2 rounded-lg transition-colors',
                        isSelected ? 'bg-gold/20 text-gold' : 'bg-zinc-100 text-zinc-600'
                      )}>
                        {item.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium">{item.title}</div>
                        {item.subtitle && (
                          <div className="text-sm text-zinc-500">{item.subtitle}</div>
                        )}
                      </div>
                      {item.shortcut && (
                        <kbd className="px-2 py-1 rounded bg-zinc-100 text-zinc-500 text-xs font-medium">
                          {item.shortcut}
                        </kbd>
                      )}
                      <ChevronRight className={cn(
                        'w-4 h-4 transition-colors',
                        isSelected ? 'text-gold' : 'text-zinc-300'
                      )} />
                    </button>
                  );
                })}
              </div>
            ))}

            {filteredCommands.length === 0 && (
              <div className="py-12 text-center">
                <Sparkles className="w-12 h-12 mx-auto text-gold/30 mb-4" />
                <p className="text-zinc-500">No commands found</p>
                <p className="text-sm text-zinc-400 mt-1">Try a different search term</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-gold/10 bg-gradient-to-r from-[#FDFBF7] to-white text-xs text-zinc-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 font-medium">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-100 font-medium">↵</kbd>
              Select
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-gold">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="font-medium">AI-Powered</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Hook to control command palette
export const useCommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev),
  };
};

export default CommandPalette;
