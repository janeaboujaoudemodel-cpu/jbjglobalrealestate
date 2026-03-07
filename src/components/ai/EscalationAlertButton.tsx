/**
 * Escalation Alert Button
 * Real-time alert button for critical escalations in the header
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Eye, CheckCircle, Clock, AlertTriangle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useSmartEscalation } from '@/hooks/useSmartEscalation';
import { type EscalationEvent } from '@/services/smart-escalation-service';
import { formatDistanceToNow } from 'date-fns';

interface EscalationAlertButtonProps {
  onViewAll?: () => void;
  onEscalationClick?: (event: EscalationEvent) => void;
}

/** Returns a Lucide icon instead of emojis */
function getUrgencyIcon(urgency: string) {
  switch (urgency) {
    case 'critical':
      return <AlertCircle className="h-5 w-5 text-red-600" />;
    case 'high':
      return <AlertTriangle className="h-5 w-5 text-amber-600" />;
    default:
      return <Zap className="h-5 w-5 text-[#C9A84C]" />;
  }
}

export function EscalationAlertButton({
  onViewAll,
  onEscalationClick,
}: EscalationAlertButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    escalationQueue,
    acknowledgeEscalation,
  } = useSmartEscalation();

  // Only use real escalations — no demo data
  const pendingEscalations = escalationQueue.filter(e => e.status === 'pending');
  const criticalEscalations = pendingEscalations.filter(e => e.emotionAnalysis.urgency === 'critical');

  const handleAcknowledge = (eventId: string) => {
    acknowledgeEscalation(eventId, 'founder');
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`relative p-2 rounded-full transition-all ${
            criticalEscalations.length > 0
              ? 'bg-red-100 border border-red-400/50 animate-pulse hover:bg-red-200'
              : pendingEscalations.length > 0
              ? 'bg-amber-100 border border-amber-400/50 hover:bg-amber-200'
              : 'bg-white border-2 border-[#C9A84C]/30 hover:border-[#C9A84C]/50'
          }`}
        >
          <Zap className={`h-5 w-5 ${
            criticalEscalations.length > 0 ? 'text-red-600' :
            pendingEscalations.length > 0 ? 'text-amber-600' : 'text-[#C9A84C]'
          }`} />
          {pendingEscalations.length > 0 && (
            <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold ${
              criticalEscalations.length > 0 ? 'bg-red-500' : 'bg-amber-500'
            }`}>
              {pendingEscalations.length > 9 ? '9+' : pendingEscalations.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent 
        className="w-96 p-0 bg-white border-2 border-[#C9A84C]/30 shadow-[0_8px_30px_rgba(200,167,102,0.15)]"
        align="end"
        sideOffset={16}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#C9A84C]/20 flex items-center justify-between bg-gradient-to-r from-[#FDFBF7] to-[#F5F0E6] rounded-t-md">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-[#C9A84C]" />
            <span className="font-semibold text-black">Escalations</span>
            {pendingEscalations.length > 0 && (
              <Badge 
                className={`${criticalEscalations.length > 0 ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'} border-0`}
              >
                {pendingEscalations.length} pending
              </Badge>
            )}
          </div>
        </div>

        {/* Escalation List */}
        <ScrollArea className="max-h-[400px]">
          {pendingEscalations.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-500/40 mx-auto mb-3" />
              <p className="text-zinc-600 font-medium">No pending escalations</p>
              <p className="text-sm text-zinc-400">All systems running smoothly</p>
            </div>
          ) : (
            <div className="divide-y divide-[#C9A84C]/10">
              {pendingEscalations.slice(0, 5).map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 hover:bg-[#C9A84C]/5 transition-colors cursor-pointer ${
                    event.emotionAnalysis.urgency === 'critical' ? 'bg-red-50' : ''
                  }`}
                  onClick={() => onEscalationClick?.(event)}
                >
                  <div className="flex items-start gap-3">
                    {/* Urgency Icon (no emojis) */}
                    <div className="mt-0.5">
                      {getUrgencyIcon(event.emotionAnalysis.urgency)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-black truncate">
                          {event.senderName}
                        </span>
                        <Badge className="bg-[#C9A84C]/10 text-[#C9A84C] border-[#C9A84C]/30 text-[10px]">
                          {event.emotionAnalysis.emotion}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-zinc-500 line-clamp-2 mb-2">
                        "{event.originalMessage}"
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(event.triggeredAt, { addSuffix: true })}
                        </span>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAcknowledge(event.id);
                          }}
                          className="h-6 text-xs text-[#C9A84C] hover:bg-[#C9A84C]/10"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Acknowledge
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {pendingEscalations.length > 0 && (
          <div className="p-3 border-t border-[#C9A84C]/20 bg-[#FDFBF7] rounded-b-md">
            <Button
              variant="ghost"
              className="w-full text-[#C9A84C] hover:bg-[#C9A84C]/10"
              onClick={() => {
                setIsOpen(false);
                onViewAll?.();
              }}
            >
              View all escalations
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default EscalationAlertButton;
