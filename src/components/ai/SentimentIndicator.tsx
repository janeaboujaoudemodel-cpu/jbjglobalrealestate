/**
 * Sentiment Indicator Component
 * Visual indicator showing emotion detection status for leads/messages
 */

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  getEmotionIcon,
  getUrgencyColor,
  getUrgencyLabel,
  type EmotionType,
  type UrgencyLevel,
} from '@/config/emotion-detection-engine';

interface SentimentIndicatorProps {
  emotion: EmotionType;
  confidence: number;
  urgency?: UrgencyLevel;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  actionTaken?: string;
  resolutionETA?: string;
}

export function SentimentIndicator({
  emotion,
  confidence,
  urgency = 'normal',
  showLabel = false,
  size = 'md',
  actionTaken,
  resolutionETA,
}: SentimentIndicatorProps) {
  const icon = getEmotionIcon(emotion);
  const urgencyLabel = getUrgencyLabel(urgency);
  
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };
  
  const emotionLabels: Record<EmotionType, string> = {
    angry: 'Angry',
    frustrated: 'Concerned',
    urgent: 'Urgent',
    positive: 'Positive',
    excited: 'Excited',
    sad: 'Sad',
    disappointed: 'Disappointed',
    confused: 'Confused',
    neutral: 'Neutral',
    happy: 'Happy',
    satisfied: 'Satisfied',
  };
  
  const tooltipContent = (
    <div className="space-y-1 text-sm">
      <p className="font-medium">Detected emotion: {emotionLabels[emotion]}</p>
      <p>Confidence: {confidence}%</p>
      {urgency && <p>Urgency: {urgencyLabel}</p>}
      {actionTaken && <p>Action: {actionTaken}</p>}
      {resolutionETA && <p>Resolution ETA: {resolutionETA}</p>}
    </div>
  );
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`inline-flex items-center gap-1 cursor-help ${sizeClasses[size]}`}>
            <span role="img" aria-label={emotionLabels[emotion]}>
              {icon}
            </span>
            {showLabel && (
              <Badge
                variant="outline"
                className="text-xs"
                style={{
                  borderColor: getUrgencyColor(urgency),
                  color: getUrgencyColor(urgency),
                }}
              >
                {emotionLabels[emotion]}
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================
// SENTIMENT BADGE VARIANT
// ============================================

interface SentimentBadgeProps {
  emotion: EmotionType;
  confidence: number;
  compact?: boolean;
}

export function SentimentBadge({ emotion, confidence, compact = false }: SentimentBadgeProps) {
  const icon = getEmotionIcon(emotion);
  
  const emotionColors: Record<EmotionType, string> = {
    angry: 'bg-red-100 text-red-800 border-red-200',
    frustrated: 'bg-orange-100 text-orange-800 border-orange-200',
    urgent: 'bg-amber-100 text-amber-800 border-amber-200',
    positive: 'bg-green-100 text-green-800 border-green-200',
    excited: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    sad: 'bg-blue-100 text-blue-800 border-blue-200',
    disappointed: 'bg-[#F7F2EA] text-[#1A1A1A] border-[#B89555]/30',
    confused: 'bg-purple-100 text-purple-800 border-purple-200',
    neutral: 'bg-[#F7F2EA] text-[#1A1A1A] border-[#B89555]/30',
    happy: 'bg-green-100 text-green-800 border-green-200',
    satisfied: 'bg-teal-100 text-teal-800 border-teal-200',
  };
  
  const emotionLabels: Record<EmotionType, string> = {
    angry: 'Angry',
    frustrated: 'Frustrated',
    urgent: 'Urgent',
    positive: 'Positive',
    excited: 'Excited',
    sad: 'Sad',
    disappointed: 'Disappointed',
    confused: 'Confused',
    neutral: 'Neutral',
    happy: 'Happy',
    satisfied: 'Satisfied',
  };
  
  if (compact) {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${emotionColors[emotion]}`}>
        {icon}
      </span>
    );
  }
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${emotionColors[emotion]}`}>
      {icon} {emotionLabels[emotion]} ({confidence}%)
    </span>
  );
}

// ============================================
// URGENCY INDICATOR
// ============================================

interface UrgencyIndicatorProps {
  urgency: UrgencyLevel;
  deadline?: Date;
  showCountdown?: boolean;
}

export function UrgencyIndicator({ urgency, deadline, showCountdown = false }: UrgencyIndicatorProps) {
  const urgencyStyles: Record<UrgencyLevel, string> = {
    critical: 'bg-red-500 text-white animate-pulse',
    high: 'bg-orange-500 text-white',
    normal: 'bg-green-500 text-white',
    low: 'bg-[#B89555] text-white',
  };
  
  const getCountdown = () => {
    if (!deadline) return null;
    const diff = deadline.getTime() - Date.now();
    if (diff <= 0) return 'Overdue';
    
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m`;
    
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };
  
  return (
    <div className="flex items-center gap-2">
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${urgencyStyles[urgency]}`}>
        {getUrgencyLabel(urgency)}
      </span>
      {showCountdown && deadline && (
        <span className="text-xs text-muted-foreground">
          {getCountdown()}
        </span>
      )}
    </div>
  );
}

export default SentimentIndicator;
