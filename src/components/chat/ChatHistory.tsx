import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { History, Plus, Clock, Search, X, MessageCircle, Loader2 } from 'lucide-react';
import { ChatHistoryItem, SERVICES, getTimeAgo, AGENT } from './types';
import { CONTACT_INFO } from '@/constants/stats';

interface ChatHistoryProps {
  userFirstName: string;
  chatHistory: ChatHistoryItem[];
  isLoading: boolean;
  onNewConversation: () => void;
  onContinueConversation: (conversation: ChatHistoryItem) => void;
}

// Highlight matching text in search results
const HighlightText = ({ text, search }: { text: string; search: string }) => {
  if (!search.trim()) {
    return <>{text}</>;
  }
  
  const regex = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return (
    <>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <span key={i} className="bg-gold/40 text-gold font-medium rounded px-0.5">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};

const ChatHistory = ({ 
  userFirstName, 
  chatHistory, 
  isLoading, 
  onNewConversation, 
  onContinueConversation 
}: ChatHistoryProps) => {
  const [historySearch, setHistorySearch] = useState('');

  const filteredHistory = chatHistory.filter((conv) => {
    if (!historySearch.trim()) return true;
    const search = historySearch.toLowerCase();
    const serviceName = SERVICES.find(s => s.id === conv.service_type)?.label || 'General';
    const matchesService = serviceName.toLowerCase().includes(search);
    const matchesStatus = conv.status.toLowerCase().includes(search);
    const matchesMessages = conv.messages?.some(msg => 
      msg.content.toLowerCase().includes(search)
    );
    return matchesService || matchesStatus || matchesMessages;
  });

  return (
    <div className="flex-1 p-4 overflow-y-auto">
      <div className="text-center mb-4">
        <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-r from-gold/20 to-gold/10 flex items-center justify-center">
          <History className="w-7 h-7 text-gold" />
        </div>
        <h4 className="text-white text-lg font-semibold mb-1">Welcome back, {userFirstName}!</h4>
        <p className="text-zinc-400 text-sm">Continue a conversation or start fresh</p>
      </div>

      {/* New Conversation Button */}
      <button
        onClick={onNewConversation}
        className="w-full p-4 mb-4 bg-gradient-to-r from-gold/10 to-gold/5 hover:from-gold/20 hover:to-gold/10 border border-gold/30 hover:border-gold/50 rounded-xl text-left transition-all duration-300 group flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
          <Plus className="w-5 h-5 text-gold" />
        </div>
        <div>
          <h5 className="text-white text-sm font-semibold">Start New Conversation</h5>
          <p className="text-gold text-xs">Ask me anything about properties & services</p>
        </div>
      </button>

      {/* WhatsApp Quick Access */}
      <a
        href={`https://wa.me/${CONTACT_INFO.whatsappNumber}?text=${encodeURIComponent(`Hi, I'm ${userFirstName}. I'd like to chat about my property inquiry.`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full p-3 mb-4 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 hover:border-green-500/50 rounded-xl transition-all duration-300 flex items-center gap-3"
      >
        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
          <MessageCircle className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <h5 className="text-white text-sm font-medium">Chat on WhatsApp</h5>
          <p className="text-green-400 text-xs">Direct access • Instant response</p>
        </div>
      </a>

      {/* Search Bar */}
      {chatHistory.length > 0 && !isLoading && (
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            type="text"
            value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)}
            placeholder="Search conversations..."
            className="pl-9 bg-white/5 border-zinc-700 text-white placeholder:text-zinc-500 h-9 text-sm"
          />
          {historySearch && (
            <button
              onClick={() => setHistorySearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Previous Conversations */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-gold animate-spin" />
        </div>
      ) : chatHistory.length > 0 ? (
        <div className="space-y-2">
          <p className="text-zinc-500 text-xs font-medium mb-2 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Previous Conversations
            {historySearch && ` (filtered)`}
          </p>
          {filteredHistory.map((conv) => {
            const serviceName = SERVICES.find(s => s.id === conv.service_type)?.label || 'General';
            const ServiceIcon = SERVICES.find(s => s.id === conv.service_type)?.icon || MessageCircle;
            const lastMessage = conv.messages?.[conv.messages.length - 1]?.content || 'No messages';
            const preview = lastMessage.length > 60 ? lastMessage.slice(0, 60) + '...' : lastMessage;
            const updatedAt = new Date(conv.updated_at);
            
            return (
              <button
                key={conv.id}
                onClick={() => onContinueConversation(conv)}
                className="w-full p-3 bg-white/5 hover:bg-white/10 border border-zinc-700 hover:border-gold/30 rounded-lg text-left transition-all duration-200 group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ServiceIcon className="w-4 h-4 text-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h6 className="text-white text-sm font-medium truncate">
                        <HighlightText text={serviceName} search={historySearch} />
                      </h6>
                      <span className="text-zinc-500 text-xs flex-shrink-0 ml-2">{getTimeAgo(updatedAt)}</span>
                    </div>
                    <p className="text-zinc-400 text-xs line-clamp-2">
                      <HighlightText text={preview} search={historySearch} />
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        conv.status === 'active' 
                          ? 'bg-green-500/20 text-green-400' 
                          : conv.status === 'submitted_to_team'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-zinc-700 text-zinc-400'
                      }`}>
                        {conv.status === 'submitted_to_team' ? 'With Team' : conv.status}
                      </span>
                      <span className="text-zinc-600 text-[10px]">
                        {conv.messages?.length || 0} messages
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
          {historySearch && filteredHistory.length === 0 && (
            <p className="text-zinc-500 text-sm text-center py-4">No conversations match "{historySearch}"</p>
          )}
        </div>
      ) : (
        <div className="text-center py-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-800 flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-zinc-600" />
          </div>
          <p className="text-zinc-500 text-sm">No previous conversations</p>
          <p className="text-zinc-600 text-xs mt-1">Start a new chat above!</p>
        </div>
      )}
    </div>
  );
};

export default ChatHistory;
