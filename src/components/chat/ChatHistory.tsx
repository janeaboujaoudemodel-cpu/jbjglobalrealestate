import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { History, Plus, Clock, Search, X, MessageCircle, Loader2 } from 'lucide-react';
import { ChatHistoryItem, SERVICES, getTimeAgo, AGENT } from './types';
import { CONTACT_INFO } from '@/constants/stats';
import { T } from '@/components/ui/T';

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
          <span key={i} className="bg-[#EFE6D6]/40 text-[#1A1A1A] font-medium rounded px-0.5">{part}</span>
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
          <History className="w-7 h-7 text-[#1A1A1A]" />
        </div>
        <h4 className="text-white text-lg font-semibold mb-1"><T>{`Welcome back, ${userFirstName}!`}</T></h4>
        <p className="text-[#1A1A1A]/70 text-sm"><T>Continue a conversation or start fresh</T></p>
      </div>

      {/* New Conversation Button */}
      <button
        onClick={onNewConversation}
        className="w-full p-4 mb-4 bg-gradient-to-r from-gold/10 to-gold/5 hover:from-gold/20 hover:to-gold/10 border border-[#B89555]/30 hover:border-[#B89555]/50 rounded-xl text-left transition-all duration-300 group flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-full bg-[#EFE6D6]/20 flex items-center justify-center">
          <Plus className="w-5 h-5 text-[#1A1A1A]" />
        </div>
        <div>
          <h5 className="text-white text-sm font-semibold"><T>Start New Conversation</T></h5>
          <p className="text-[#1A1A1A] text-xs"><T>Ask me anything about properties & services</T></p>
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
          <h5 className="text-white text-sm font-medium"><T>Chat on WhatsApp</T></h5>
          <p className="text-green-400 text-xs"><T>Direct access • Instant response</T></p>
        </div>
      </a>

      {/* Search Bar */}
      {chatHistory.length > 0 && !isLoading && (
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]/70" />
          <Input
            type="text"
            value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)}
            placeholder="Search conversations..."
            className="pl-9 bg-[#FDFBF7]/5 border-[#1A1A1A] text-white placeholder:text-[#1A1A1A]/70 h-9 text-sm"
          />
          {historySearch && (
            <button
              onClick={() => setHistorySearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1A1A1A]/70 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Previous Conversations */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-[#1A1A1A] animate-spin" />
        </div>
      ) : chatHistory.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[#1A1A1A]/70 text-xs font-medium mb-2 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <T>Previous Conversations</T>
            {historySearch && <T>{` (filtered)`}</T>}
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
                className="w-full p-3 bg-[#FDFBF7]/5 hover:bg-[#FDFBF7]/10 border border-[#1A1A1A] hover:border-[#B89555]/30 rounded-lg text-left transition-all duration-200 group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#EFE6D6]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ServiceIcon className="w-4 h-4 text-[#1A1A1A]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h6 className="text-white text-sm font-medium truncate">
                        <HighlightText text={serviceName} search={historySearch} />
                      </h6>
                      <span className="text-[#1A1A1A]/70 text-xs flex-shrink-0 ml-2">{getTimeAgo(updatedAt)}</span>
                    </div>
                    <p className="text-[#1A1A1A]/70 text-xs line-clamp-2">
                      <HighlightText text={preview} search={historySearch} />
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        conv.status === 'active' 
                          ? 'bg-green-500/20 text-green-400' 
                          : conv.status === 'submitted_to_team'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-[#1A1A1A] text-[#1A1A1A]/70'
                      }`}>
                        {conv.status === 'submitted_to_team' ? <T>With Team</T> : <T>{conv.status}</T>}
                      </span>
                      <span className="text-[#1A1A1A]/70 text-[10px]">
                        {conv.messages?.length || 0} <T>messages</T>
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
          {historySearch && filteredHistory.length === 0 && (
            <p className="text-[#1A1A1A]/70 text-sm text-center py-4"><T>{`No conversations match "${historySearch}"`}</T></p>
          )}
        </div>
      ) : (
        <div className="text-center py-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#1A1A1A] flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-[#1A1A1A]/70" />
          </div>
          <p className="text-[#1A1A1A]/70 text-sm"><T>No previous conversations</T></p>
          <p className="text-[#1A1A1A]/70 text-xs mt-1"><T>Start a new chat above!</T></p>
        </div>
      )}
    </div>
  );
};

export default ChatHistory;
