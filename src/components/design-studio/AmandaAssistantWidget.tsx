import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  X, 
  Send, 
  Sparkles,
  NotebookPen,
  ChevronUp,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Import Amanda's photo
import amandaClarkePhoto from '@/assets/team/amanda-clarke-executive-assistant.png';

interface AmandaAssistantWidgetProps {
  toolName: string;
  projectContext?: {
    id?: string;
    name?: string;
    type?: string;
  };
}

interface Note {
  id: string;
  content: string;
  timestamp: Date;
  type: 'observation' | 'suggestion' | 'task';
}

export const AmandaAssistantWidget: React.FC<AmandaAssistantWidgetProps> = ({
  toolName,
  projectContext,
}) => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [message, setMessage] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [isSending, setIsSending] = useState(false);

  // Load existing notes on mount
  useEffect(() => {
    if (user?.id) {
      loadNotes();
    }
  }, [user?.id, projectContext?.id]);

  const loadNotes = async () => {
    // In a real implementation, load notes from the database
    // For now, we'll add a welcome note
    setNotes([
      {
        id: '1',
        content: `I'm taking notes on your ${toolName} session. I'll learn your preferences to assist you better next time.`,
        timestamp: new Date(),
        type: 'observation',
      },
    ]);
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    setIsSending(true);
    
    try {
      // Add the note
      const newNote: Note = {
        id: Date.now().toString(),
        content: message,
        timestamp: new Date(),
        type: 'task',
      };
      
      setNotes(prev => [...prev, newNote]);
      
      // Save to database
      if (user?.id) {
        await supabase.from('ai_notes').insert({
          user_id: user.id,
          title: `${toolName} Note`,
          content: message,
          source_type: toolName.toLowerCase().replace(/\s+/g, '-'),
          tags: ['assistant-note', toolName.toLowerCase()],
        });
      }
      
      // Add Amanda's response
      setTimeout(() => {
        setNotes(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          content: "Noted! I've saved this for your records. I'll use this to better assist you in future sessions.",
          timestamp: new Date(),
          type: 'observation',
        }]);
      }, 500);
      
      setMessage('');
      toast.success('Note saved');
    } catch (error) {
      console.error('Failed to save note:', error);
      toast.error('Failed to save note');
    } finally {
      setIsSending(false);
    }
  };

  if (isMinimized) {
    return (
      <motion.button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-gold to-gold-dark text-[#1A1A1A] rounded-full shadow-xl shadow-gold/30 hover:shadow-2xl hover:shadow-gold/40 transition-all"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Avatar className="h-10 w-10 border-2 border-white">
          <AvatarImage src={amandaClarkePhoto} alt="Amanda Clarke" className="object-cover object-top" />
          <AvatarFallback className="bg-[#FDFBF7] text-[#1A1A1A] font-bold">AC</AvatarFallback>
        </Avatar>
        <div className="text-left">
          <p className="font-semibold text-sm">Amanda is here</p>
          <p className="text-xs opacity-80">Taking notes...</p>
        </div>
        <NotebookPen className="w-5 h-5 animate-pulse" />
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 100, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 100, scale: 0.9 }}
      className="fixed bottom-6 right-6 z-50 w-80 max-w-[calc(100vw-3rem)]"
    >
      <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] rounded-2xl shadow-2xl shadow-gold/20 border border-[#B89555]/30 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gold to-gold-dark p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-white shadow-lg">
              <AvatarImage src={amandaClarkePhoto} alt="Amanda Clarke" className="object-cover object-top" />
              <AvatarFallback className="bg-[#FDFBF7] text-[#1A1A1A] font-bold">AC</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-bold text-[#1A1A1A] text-sm">Amanda Clarke</h3>
              <p className="text-xs text-[#1A1A1A]/70">Executive Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:bg-[#1A1A1A]/10"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsMinimized(true)}
              className="h-8 w-8 text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:bg-[#1A1A1A]/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 border-b border-[#B89555]/10">
                <div className="flex items-center gap-2 text-sm text-[#1A1A1A]/70">
                  <Sparkles className="w-4 h-4 text-[#1A1A1A]" />
                  <span>Currently monitoring: <strong className="text-[#1A1A1A]">{toolName}</strong></span>
                </div>
                {projectContext?.name && (
                  <Badge className="mt-2 bg-[#EFE6D6]/10 text-[#1A1A1A] border-[#B89555]/30">
                    Project: {projectContext.name}
                  </Badge>
                )}
              </div>

              {/* Notes */}
              <ScrollArea className="h-48 p-4">
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className={`p-3 rounded-lg text-sm ${
                        note.type === 'task' 
                          ? 'bg-blue-50 border border-blue-100 text-blue-800' 
                          : 'bg-[#F7F2EA] border border-[#B89555]/30 text-[#1A1A1A]/70'
                      }`}
                    >
                      <p>{note.content}</p>
                      <p className="text-xs opacity-60 mt-1">
                        {note.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-4 bg-[#F7F2EA]/50 border-t border-[#B89555]/10">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Leave a note for Amanda..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[60px] bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A] text-sm resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isSending || !message.trim()}
                    className="bg-[#EFE6D6] hover:bg-[#EFE6D6]-dark text-[#1A1A1A] self-end"
                  >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick status bar when collapsed */}
        {!isExpanded && (
          <div className="px-4 py-3 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-[#1A1A1A]/70">
              <NotebookPen className="w-4 h-4 text-[#1A1A1A]" />
              <span>Notes: {notes.length}</span>
            </div>
            <Badge className="bg-green-100 text-green-700 border-0 text-xs">
              Active
            </Badge>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AmandaAssistantWidget;
