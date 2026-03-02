import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Minus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SquareChatIcon } from '@/components/ui/SquareChatIcon';
import { useIsMobile } from '@/hooks/use-mobile';

interface CollapsedChatButtonProps {
  onToggle: () => void;
  onMinimize?: () => void;
  showAttentionPulse?: boolean;
}

const CollapsedChatButton = ({ onToggle, onMinimize, showAttentionPulse = false }: CollapsedChatButtonProps) => {
  const { isRTL, t } = useLanguage();
  const isMobile = useIsMobile();

  // Drag-to-move state
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, startOffX: 0, startOffY: 0, moved: false });
  const buttonRef = useRef<HTMLDivElement>(null);

  function onPointerDown(e: React.PointerEvent) {
    // Only drag on left click / touch
    if (e.button !== undefined && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const curOff = dragOffset ?? { x: 0, y: 0 };
    dragRef.current = { startX: e.clientX, startY: e.clientY, startOffX: curOff.x, startOffY: curOff.y, moved: false };
    setIsDragging(true);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      dragRef.current.moved = true;
    }
    if (dragRef.current.moved) {
      setDragOffset({ x: dragRef.current.startOffX + dx, y: dragRef.current.startOffY + dy });
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    setIsDragging(false);
    if (!dragRef.current.moved) {
      // Treat as click
      onToggle();
      return;
    }
    // Smart overlap detection: if covering a button/input, nudge up
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const els = document.elementsFromPoint(cx, cy);
      const blocked = els.some(el => {
        if (el === buttonRef.current || buttonRef.current?.contains(el)) return false;
        const tag = el.tagName.toLowerCase();
        return tag === 'button' || tag === 'input' || tag === 'a' || tag === 'select';
      });
      if (blocked) {
        setDragOffset(prev => prev ? { x: prev.x, y: prev.y - 80 } : null);
      }
    }
  }

  const handleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMinimize?.();
  };

  const transform = dragOffset ? `translate(${dragOffset.x}px, ${dragOffset.y}px)` : undefined;

  return (
    <div
      ref={buttonRef}
      className={`fixed bottom-6 ${isRTL ? 'left-4' : 'right-4'} z-[10050]`}
      style={{ transform, transition: isDragging ? 'none' : 'transform 0.2s ease', cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {showAttentionPulse ? (
        <div className="relative">
          <div
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            className="relative flex items-center gap-2 sm:gap-3 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold rounded-xl px-3 sm:px-5 py-2.5 sm:py-3.5 shadow-2xl shadow-gold/20 hover:shadow-[0_8px_30px_rgba(200,167,102,0.4)] transition-shadow duration-300 group select-none max-w-[240px] sm:max-w-none"
            aria-label={t('chat.openChat', 'Open chat support')}
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold flex items-center justify-center flex-shrink-0 shadow-md shadow-gold/20">
              <SquareChatIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gold" size={20} />
            </div>
            <div className="flex flex-col items-start min-w-0">
              <span className="text-black text-xs sm:text-sm font-bold truncate">{t('chat.title', 'JBJ Support')}</span>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gold animate-pulse flex-shrink-0" />
                <span className="text-gold text-[10px] sm:text-xs font-medium truncate">{t('chat.available247', 'Available 24/7')}</span>
              </div>
            </div>
            {isRTL ? (
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gold hidden sm:block flex-shrink-0" />
            ) : (
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gold hidden sm:block flex-shrink-0" />
            )}
          </div>
          {onMinimize && (
            <button
              onClick={handleMinimize}
              aria-label={t('chat.minimize', 'Minimize chat')}
              className="absolute -top-2 -right-2 w-7 h-7 bg-white border-2 border-gold rounded-full flex items-center justify-center shadow-lg hover:bg-gold/10 transition-colors z-10"
            >
              <Minus className="w-4 h-4 text-gold" />
            </button>
          )}
        </div>
      ) : (
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          aria-label={t('chat.openChat', 'Open chat support')}
          className="relative flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold shadow-2xl shadow-gold/20 hover:shadow-[0_8px_30px_rgba(200,167,102,0.4)] transition-shadow duration-300 select-none"
        >
          <SquareChatIcon className="w-6 h-6 text-gold" size={24} />
        </div>
      )}
    </div>
  );
};

export default CollapsedChatButton;
