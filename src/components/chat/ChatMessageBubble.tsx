/**
 * Shared ChatMessageBubble Component
 * Provides consistent styling, copy functionality, and text selection across all chats
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ChatMessageBubbleProps {
  content: string;
  role: 'user' | 'assistant';
  timestamp?: Date | string;
  className?: string;
  showCopyIcon?: boolean;
  variant?: 'default' | 'dark';
  userAvatar?: React.ReactNode;
  assistantAvatar?: React.ReactNode;
  isTyping?: boolean;
  messageType?: 'text' | 'processing' | 'success';
}

const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  content,
  role,
  timestamp,
  className,
  showCopyIcon = true,
  variant = 'default',
  userAvatar,
  assistantAvatar,
  isTyping = false,
  messageType = 'text',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success('Message copied');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  const formattedTime = timestamp
    ? (timestamp instanceof Date ? timestamp : new Date(timestamp)).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    : null;

  // User message styles - Active Champagne gradient
  const userStyles = variant === 'dark'
    ? 'bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] text-[#1A1A1A] border border-[#B89555]/30 shadow-md'
    : 'bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] text-[#1A1A1A] border border-[#B89555]/30 shadow-md';

  // Assistant message styles - Premium Champagne (lighter, more subtle)
  const getAssistantStyles = () => {
    if (messageType === 'processing') {
      return 'bg-amber-50 text-[#1A1A1A] border border-amber-200';
    }
    if (messageType === 'success') {
      return 'bg-green-50 text-[#1A1A1A] border border-green-200';
    }
    // Premium champagne for assistant - Locked Champagne Layer 3
    return variant === 'dark'
      ? 'bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/20 shadow-sm'
      : 'bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/20 shadow-sm';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex gap-3',
        role === 'user' ? 'flex-row-reverse' : 'flex-row',
        className
      )}
    >
      {/* Avatar */}
      {role === 'assistant' && assistantAvatar}
      {role === 'user' && userAvatar}

      {/* Message Bubble */}
      <div className="flex flex-col max-w-[80%] group">
        <div
          className={cn(
            'rounded-2xl px-4 py-3 select-text cursor-text',
            role === 'user' ? userStyles : getAssistantStyles(),
            role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'
          )}
        >
          {isTyping ? (
            <div className="flex gap-1 py-1">
              <span className="w-2 h-2 bg-[#EFE6D6] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-[#EFE6D6] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-[#EFE6D6] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          ) : (
            <>
              <p className="text-sm leading-relaxed whitespace-pre-wrap select-text">{content}</p>
              {formattedTime && (
                <p className="text-[10px] mt-1.5 opacity-60 select-none">{formattedTime}</p>
              )}
            </>
          )}
        </div>

        {/* Copy Button - shown below message */}
        {showCopyIcon && !isTyping && content && (
          <button
            onClick={handleCopy}
            className={cn(
              'flex items-center gap-1 mt-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100',
              role === 'user' ? 'self-end mr-1' : 'self-start ml-1'
            )}
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-green-500" />
                <span className="text-green-500">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default ChatMessageBubble;
