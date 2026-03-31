import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  MessageSquare,
  Trash2,
  MoreVertical,
  CheckSquare,
  X,
  Clock,
  Eraser,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { type ChatSession } from '@/hooks/useFounderChatSessions';
import { formatDistanceToNow } from 'date-fns';

interface ChatSessionSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onClearAll: () => void;
}

export function ChatSessionSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onBulkDelete,
  onClearAll,
}: ChatSessionSidebarProps) {
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = () => {
    if (selected.size > 0) {
      onBulkDelete(Array.from(selected));
      setSelected(new Set());
      setSelectMode(false);
    }
  };

  return (
    <div className="w-64 border-r-2 border-[#B89555]/20 bg-gradient-to-b from-[#FDFBF7] to-[#F7F2EA] flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-[#B89555]/20">
        <Button
          onClick={onNewChat}
          className="w-full bg-gradient-to-r from-[#B89555] to-[#A68444] text-white hover:from-[#A68444] hover:to-[#B89555] shadow-md"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Actions bar */}
      <div className="px-3 py-2 flex items-center justify-between border-b border-[#B89555]/10">
        <span className="text-[10px] text-gray-600 uppercase tracking-wider font-medium">
          History ({sessions.length})
        </span>
        <div className="flex items-center gap-1">
          {selectMode ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-red-500 hover:bg-red-50"
                onClick={handleBulkDelete}
                disabled={selected.size === 0}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-gray-600 hover:bg-gray-100"
                onClick={() => { setSelectMode(false); setSelected(new Set()); }}
              >
                <X className="w-3 h-3" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-gray-600 hover:text-[#B89555] hover:bg-[#B89555]/10"
                onClick={() => setSelectMode(true)}
                title="Select chats"
              >
                <CheckSquare className="w-3 h-3" />
              </Button>
              {sessions.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-gray-600 hover:text-red-500 hover:bg-red-50"
                  onClick={onClearAll}
                  title="Clear all chats"
                >
                  <Eraser className="w-3 h-3" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Session list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-8 h-8 text-[#B89555]/30 mx-auto mb-2" />
              <p className="text-xs text-gray-600">No chats yet</p>
              <p className="text-[10px] text-gray-600">Start a new conversation</p>
            </div>
          ) : (
            sessions.map((session) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                  activeSessionId === session.id
                    ? 'bg-gradient-to-r from-[#B89555]/15 to-[#B89555]/5 border border-[#B89555]/30'
                    : 'hover:bg-white/60 border border-transparent'
                }`}
                onClick={() => {
                  if (selectMode) {
                    toggleSelect(session.id);
                  } else {
                    onSelectSession(session.id);
                  }
                }}
              >
                {selectMode && (
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    selected.has(session.id) ? 'bg-[#B89555] border-[#B89555]' : 'border-gray-300'
                  }`}>
                    {selected.has(session.id) && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                )}
                <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${
                  activeSessionId === session.id ? 'text-[#B89555]' : 'text-gray-600'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate ${
                    activeSessionId === session.id ? 'text-black' : 'text-gray-700'
                  }`}>
                    {session.title}
                  </p>
                  <p className="text-[10px] text-gray-600 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {formatDistanceToNow(new Date(session.updated_at), { addSuffix: true })}
                  </p>
                </div>
                {!selectMode && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-gray-600"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem
                        onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                        className="text-red-600 text-xs"
                      >
                        <Trash2 className="w-3 h-3 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </motion.div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
