/**
 * Escalation Alert Button
 * Real-time alert button for critical escalations in the header
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, Eye, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useSmartEscalation } from '@/hooks/useSmartEscalation';
import { SentimentBadge } from '@/components/ai/SentimentIndicator';
import { type EscalationEvent } from '@/services/smart-escalation-service';
import { formatDistanceToNow } from 'date-fns';
import { getEmotionIcon } from '@/config/emotion-detection-engine';

interface EscalationAlertButtonProps {
  onViewAll?: () => void;
  onEscalationClick?: (event: EscalationEvent) => void;
}

export function EscalationAlertButton({
  onViewAll,
  onEscalationClick,
}: EscalationAlertButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    escalationQueue,
    criticalCount,
    acknowledgeEscalation,
  } = useSmartEscalation();

  // Demo escalations for showcase
  const demoEscalations: EscalationEvent[] = [
    {
      id: 'demo-001',
      triggeredAt: new Date(Date.now() - 5 * 60 * 1000),
      sourceChannel: 'whatsapp',
      senderId: 'client-001',
      senderName: 'Ahmed Al-Rashid',
      senderType: 'client',
      originalMessage: "This is completely unacceptable! I've been waiting for days!",
      emotionAnalysis: {
        emotion: 'angry',
        confidence: 94,
        urgency: 'critical',
        sentiment: -0.85,
        keywords: ['unacceptable', 'waiting'],
        suggestedTone: { style: 'empathetic', prefix: '', suffix: '', responseDeadlineMinutes: 10 },
        shouldEscalate: true,
        escalationReason: 'Client expressed significant dissatisfaction',
      },
      escalatedTo: ['founder', 'hr'],
      status: 'pending',
      responseDeadline: new Date(Date.now() + 5 * 60 * 1000),
    },
  ];

  const allEscalations = [...demoEscalations, ...escalationQueue];
  const pendingEscalations = allEscalations.filter(e => e.status === 'pending');
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
              ? 'bg-red-500/20 border border-red-500/50 animate-pulse hover:bg-red-500/30'
              : pendingEscalations.length > 0
              ? 'bg-amber-500/20 border border-amber-500/50 hover:bg-amber-500/30'
              : 'bg-[#1A1A1A] border border-gold/20 hover:bg-gold/10'
          }`}
        >
          <Zap className={`h-5 w-5 ${
            criticalEscalations.length > 0 ? 'text-red-500' :
            pendingEscalations.length > 0 ? 'text-amber-500' : 'text-gold'
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
        className="w-96 p-0 bg-[#0E0E0E] border-gold/20"
        align="end"
        sideOffset={16}
      >
        {/* Header */}
        <div className="p-4 border-b border-gold/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-gold" />
            <span className="font-semibold text-white">AI Escalations</span>
            {pendingEscalations.length > 0 && (
              <Badge 
                variant="destructive" 
                className={criticalEscalations.length > 0 ? 'bg-red-500' : 'bg-amber-500'}
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
              <CheckCircle className="h-12 w-12 text-green-500/30 mx-auto mb-3" />
              <p className="text-gray-400">No pending escalations</p>
              <p className="text-sm text-gray-500">All systems running smoothly!</p>
            </div>
          ) : (
            <div className="divide-y divide-gold/10">
              {pendingEscalations.slice(0, 5).map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 hover:bg-gold/5 transition-colors cursor-pointer ${
                    event.emotionAnalysis.urgency === 'critical' ? 'bg-red-500/5' : ''
                  }`}
                  onClick={() => onEscalationClick?.(event)}
                >
                  <div className="flex items-start gap-3">
                    {/* Emotion Icon */}
                    <span className={`text-2xl ${
                      event.emotionAnalysis.urgency === 'critical' ? 'animate-pulse' : ''
                    }`}>
                      {getEmotionIcon(event.emotionAnalysis.emotion)}
                    </span>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white truncate">
                          {event.senderName}
                        </span>
                        <SentimentBadge
                          emotion={event.emotionAnalysis.emotion}
                          confidence={event.emotionAnalysis.confidence}
                          compact
                        />
                      </div>
                      
                      <p className="text-sm text-gray-400 line-clamp-2 mb-2">
                        "{event.originalMessage}"
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
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
                          className="h-6 text-xs text-gold hover:bg-gold/10"
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
          <div className="p-3 border-t border-gold/20">
            <Button
              variant="ghost"
              className="w-full text-gold hover:bg-gold/10"
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
