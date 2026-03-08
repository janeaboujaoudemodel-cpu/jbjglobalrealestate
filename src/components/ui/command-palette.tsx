import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, Users, LayoutDashboard, FileText, Calendar, Phone, MessageSquare,
  Plus, Settings, TrendingUp, Building2, UserPlus, ClipboardList, Sparkles,
  Mic, ChevronRight, Mail, Video, Briefcase, Shield, BookOpen, Heart,
  Globe, FileEdit, StickyNote, PenTool, Palette, BarChart3, Scale, Zap,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const [recentCommands, setRecentCommands] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('cmd_palette_recent') || '[]');
    } catch { return []; }
  });

  const go = (path: string, id?: string) => {
    if (id) {
      setRecentCommands(prev => {
        const updated = [id, ...prev.filter(r => r !== id)].slice(0, 8);
        localStorage.setItem('cmd_palette_recent', JSON.stringify(updated));
        return updated;
      });
    }
    navigate(path);
    onClose();
  };

  const commands: CommandItem[] = [
    // Quick Actions
    { id: 'new-lead', title: 'Create New Lead', subtitle: 'Add a new lead to CRM', icon: <UserPlus className="w-4 h-4" />, action: () => go('/crm?action=new-lead', 'new-lead'), category: 'Quick Actions', keywords: ['add', 'create', 'lead', 'new'], shortcut: '⌘N' },
    { id: 'new-task', title: 'Create Task', subtitle: 'Add a new task', icon: <ClipboardList className="w-4 h-4" />, action: () => go('/crm/tasks?action=new', 'new-task'), category: 'Quick Actions', keywords: ['task', 'todo', 'reminder'], shortcut: '⌘T' },
    { id: 'schedule-call', title: 'Schedule Call', subtitle: 'Book a call with a lead', icon: <Phone className="w-4 h-4" />, action: () => go('/crm/calendar', 'schedule-call'), category: 'Quick Actions', keywords: ['call', 'schedule', 'phone'] },
    { id: 'send-message', title: 'Send Message', subtitle: 'Message a lead or team member', icon: <MessageSquare className="w-4 h-4" />, action: () => go('/team-chat', 'send-message'), category: 'Quick Actions', keywords: ['message', 'chat', 'dm'] },
    { id: 'new-note', title: 'Create Note', subtitle: 'Quick note or voice memo', icon: <StickyNote className="w-4 h-4" />, action: () => go('/crm/notes', 'new-note'), category: 'Quick Actions', keywords: ['note', 'memo', 'write'] },
    { id: 'new-email', title: 'Compose Email', subtitle: 'Draft a new email', icon: <Mail className="w-4 h-4" />, action: () => go('/email-client', 'new-email'), category: 'Quick Actions', keywords: ['email', 'compose', 'send'] },
    { id: 'video-meeting', title: 'Start Video Meeting', subtitle: 'Launch a video call', icon: <Video className="w-4 h-4" />, action: () => go('/video-meeting', 'video-meeting'), category: 'Quick Actions', keywords: ['video', 'meeting', 'zoom', 'call'] },
    
    // Navigation — Core
    { id: 'crm', title: 'CRM Dashboard', subtitle: 'Leads, deals, and pipeline', icon: <LayoutDashboard className="w-4 h-4" />, action: () => go('/crm', 'crm'), category: 'Navigation', keywords: ['crm', 'dashboard', 'sales'] },
    { id: 'employee-hub', title: 'Employee Hub', subtitle: 'Team directory and wall of fame', icon: <Users className="w-4 h-4" />, action: () => go('/employee-hub', 'employee-hub'), category: 'Navigation', keywords: ['employees', 'team', 'staff'] },
    { id: 'hr-dashboard', title: 'HR Dashboard', subtitle: 'Applications and performance', icon: <Briefcase className="w-4 h-4" />, action: () => go('/hr-dashboard', 'hr-dashboard'), category: 'Navigation', keywords: ['hr', 'human resources', 'hiring'] },
    { id: 'owner-panel', title: 'Owner Panel', subtitle: 'System settings and configuration', icon: <Settings className="w-4 h-4" />, action: () => go('/admin', 'owner-panel'), category: 'Navigation', keywords: ['owner', 'settings', 'system', 'admin'] },
    { id: 'founder-assistant', title: "Founder's Assistant", subtitle: 'Amanda Clarke — Executive dashboard', icon: <Sparkles className="w-4 h-4" />, action: () => go('/owner/founder-assistant', 'founder-assistant'), category: 'Navigation', keywords: ['founder', 'ceo', 'executive', 'amanda'] },
    { id: 'analytics', title: 'Analytics Dashboard', subtitle: 'Performance metrics', icon: <BarChart3 className="w-4 h-4" />, action: () => go('/jbj-analytics', 'analytics'), category: 'Navigation', keywords: ['analytics', 'metrics', 'stats'] },
    { id: 'listing-admin', title: 'Listing Admin', subtitle: 'Property management', icon: <Building2 className="w-4 h-4" />, action: () => go('/listing-admin', 'listing-admin'), category: 'Navigation', keywords: ['listings', 'properties', 'real estate'] },
    { id: 'calendar', title: 'Calendar', subtitle: 'Schedule and events', icon: <Calendar className="w-4 h-4" />, action: () => go('/crm/calendar', 'calendar'), category: 'Navigation', keywords: ['calendar', 'schedule', 'events'] },
    { id: 'notes', title: 'Notes', subtitle: 'View and manage notes', icon: <FileText className="w-4 h-4" />, action: () => go('/crm/notes', 'notes'), category: 'Navigation', keywords: ['notes', 'memos', 'documents'] },
    { id: 'team-chat', title: 'Team Chat', subtitle: 'Team messaging & DMs', icon: <MessageSquare className="w-4 h-4" />, action: () => go('/team-chat', 'team-chat'), category: 'Navigation', keywords: ['chat', 'messaging', 'dm', 'team'] },
    { id: 'email-client', title: 'Email Client', subtitle: 'Manage emails', icon: <Mail className="w-4 h-4" />, action: () => go('/email-client', 'email-client'), category: 'Navigation', keywords: ['email', 'inbox', 'gmail'] },
    { id: 'documents', title: 'Documents', subtitle: 'Document editor & scanner', icon: <FileEdit className="w-4 h-4" />, action: () => go('/documents', 'documents'), category: 'Navigation', keywords: ['documents', 'editor', 'scanner'] },
    { id: 'inquiries', title: 'Inquiry Management', subtitle: 'Track property inquiries', icon: <MessageSquare className="w-4 h-4" />, action: () => go('/admin/inquiries', 'inquiries'), category: 'Navigation', keywords: ['inquiries', 'inquiry', 'requests'] },
    { id: 'kanban', title: 'Kanban Board', subtitle: 'Visual task management', icon: <ClipboardList className="w-4 h-4" />, action: () => go('/kanban', 'kanban'), category: 'Navigation', keywords: ['kanban', 'board', 'tasks', 'agile'] },
    { id: 'whiteboard', title: 'Whiteboard', subtitle: 'Collaborative sketching', icon: <PenTool className="w-4 h-4" />, action: () => go('/whiteboard', 'whiteboard'), category: 'Navigation', keywords: ['whiteboard', 'draw', 'sketch'] },
    { id: 'security', title: 'Security Console', subtitle: 'Trust & audit center', icon: <Shield className="w-4 h-4" />, action: () => go('/security-console', 'security'), category: 'Navigation', keywords: ['security', 'audit', 'compliance'] },
    { id: 'recommendations', title: 'AI Recommendations', subtitle: 'Global optimization insights', icon: <Zap className="w-4 h-4" />, action: () => go('/owner/recommendations', 'recommendations'), category: 'Navigation', keywords: ['recommendations', 'optimize', 'insights'] },
    
    // AI Tools
    { id: 'ai-hub', title: 'Royal Tools Hub', subtitle: 'All AI tools in one place', icon: <Sparkles className="w-4 h-4" />, action: () => go('/ai-hub', 'ai-hub'), category: 'AI Tools', keywords: ['ai', 'tools', 'automation', 'royal'] },
    { id: 'design-studio', title: 'Design Studio', subtitle: 'Create marketing materials', icon: <Palette className="w-4 h-4" />, action: () => go('/jbj-design-studio', 'design-studio'), category: 'AI Tools', keywords: ['design', 'marketing', 'creative'] },
    { id: 'creative-suite', title: 'Creative Suite', subtitle: 'Documents, stamps, QR codes', icon: <FileEdit className="w-4 h-4" />, action: () => go('/owner/creative-suite', 'creative-suite'), category: 'AI Tools', keywords: ['creative', 'suite', 'documents', 'qr'] },
    { id: 'studio', title: 'Studio', subtitle: 'Video, photo & PDF suites', icon: <Video className="w-4 h-4" />, action: () => go('/studio', 'studio'), category: 'AI Tools', keywords: ['studio', 'video', 'photo', 'pdf'] },
    { id: 'business-card-scanner', title: 'Business Card Scanner', subtitle: 'AI-powered OCR scanning', icon: <ClipboardList className="w-4 h-4" />, action: () => go('/business-card-scanner', 'business-card-scanner'), category: 'AI Tools', keywords: ['business', 'card', 'scanner', 'ocr'] },
    { id: 'property-evaluator', title: 'Property Evaluator', subtitle: 'AI property valuation', icon: <Building2 className="w-4 h-4" />, action: () => go('/property-evaluator', 'property-evaluator'), category: 'AI Tools', keywords: ['property', 'evaluator', 'valuation'] },
    { id: 'rental-index', title: 'Dubai Rental Index', subtitle: 'Official rental rates', icon: <TrendingUp className="w-4 h-4" />, action: () => go('/dubai-rental-index', 'rental-index'), category: 'AI Tools', keywords: ['rental', 'index', 'dubai', 'rera'] },
    { id: 'mortgage-calculator', title: 'Mortgage Calculator', subtitle: 'Calculate monthly payments', icon: <FileText className="w-4 h-4" />, action: () => go('/mortgage-calculator', 'mortgage-calculator'), category: 'AI Tools', keywords: ['mortgage', 'calculator', 'finance'] },
    { id: 'presentations', title: 'Presentations', subtitle: 'AI slide deck builder', icon: <FileText className="w-4 h-4" />, action: () => go('/presentations', 'presentations'), category: 'AI Tools', keywords: ['presentation', 'slides', 'deck'] },
    { id: 'spreadsheet', title: 'Spreadsheet', subtitle: 'Smart spreadsheet editor', icon: <FileText className="w-4 h-4" />, action: () => go('/spreadsheet', 'spreadsheet'), category: 'AI Tools', keywords: ['spreadsheet', 'excel', 'data'] },
    { id: 'qr-generator', title: 'QR Code Generator', subtitle: 'Generate custom QR codes', icon: <Globe className="w-4 h-4" />, action: () => go('/qr-generator', 'qr-generator'), category: 'AI Tools', keywords: ['qr', 'code', 'generator'] },
  ];

  // Sort recently used to the top when no search
  const sortedCommands = search.trim() === '' 
    ? [...commands].sort((a, b) => {
        const aRecent = recentCommands.indexOf(a.id);
        const bRecent = recentCommands.indexOf(b.id);
        if (aRecent >= 0 && bRecent >= 0) return aRecent - bRecent;
        if (aRecent >= 0) return -1;
        if (bRecent >= 0) return 1;
        return 0;
      })
    : commands;

  const filteredCommands = search.trim() === '' 
    ? sortedCommands
    : sortedCommands.filter(cmd => 
        cmd.title.toLowerCase().includes(search.toLowerCase()) ||
        cmd.subtitle?.toLowerCase().includes(search.toLowerCase()) ||
        cmd.keywords?.some(k => k.toLowerCase().includes(search.toLowerCase()))
      );

  // Add "Recent" category for recently used items
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    const isRecent = search.trim() === '' && recentCommands.includes(cmd.id);
    const cat = isRecent ? 'Recent' : cmd.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  // Reorder categories: Recent first
  const categoryOrder = ['Recent', 'Quick Actions', 'Navigation', 'AI Tools'];
  const orderedCategories = Object.keys(groupedCommands).sort((a, b) => {
    const ai = categoryOrder.indexOf(a);
    const bi = categoryOrder.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

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
        if (filteredCommands[selectedIndex]) filteredCommands[selectedIndex].action();
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

  useEffect(() => { setSelectedIndex(0); }, [search]);
  useEffect(() => { if (!isOpen) { setSearch(''); setSelectedIndex(0); } }, [isOpen]);

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
            {orderedCategories.map((category) => {
              const items = groupedCommands[category];
              if (!items?.length) return null;
              return (
                <div key={category} className="mb-4">
                  <div className="px-3 py-2 flex items-center gap-2">
                    {category === 'Recent' && <Clock className="w-3.5 h-3.5 text-gold/60" />}
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
              );
            })}

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
