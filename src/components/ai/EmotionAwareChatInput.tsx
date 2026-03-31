/**
 * Emotion-Aware Chat Input Component
 * Input component that shows real-time emotion analysis
 */

import { useState, useCallback, useEffect } from 'react';
import { Send, AlertTriangle, Smile, Frown, Meh, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  analyzeMessage,
  getEmotionIcon,
  getUrgencyLabel,
  type EmotionAnalysis,
  type EmotionType,
} from '@/config/emotion-detection-engine';

interface EmotionAwareChatInputProps {
  onSend: (message: string, analysis: EmotionAnalysis) => void;
  placeholder?: string;
  disabled?: boolean;
  showEmotionPreview?: boolean;
}

export function EmotionAwareChatInput({
  onSend,
  placeholder = 'Type your message...',
  disabled = false,
  showEmotionPreview = true,
}: EmotionAwareChatInputProps) {
  const [message, setMessage] = useState('');
  const [analysis, setAnalysis] = useState<EmotionAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Debounced analysis
  useEffect(() => {
    if (!message.trim() || !showEmotionPreview) {
      setAnalysis(null);
      return;
    }
    
    const timer = setTimeout(() => {
      setIsAnalyzing(true);
      const result = analyzeMessage(message);
      setAnalysis(result);
      setIsAnalyzing(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [message, showEmotionPreview]);
  
  const handleSend = useCallback(() => {
    if (!message.trim()) return;
    
    const finalAnalysis = analysis || analyzeMessage(message);
    onSend(message, finalAnalysis);
    setMessage('');
    setAnalysis(null);
  }, [message, analysis, onSend]);
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const getEmotionStyles = (emotion: EmotionType): { icon: React.ReactNode; color: string } => {
    const negativeEmotions: EmotionType[] = ['angry', 'frustrated', 'sad', 'disappointed'];
    const positiveEmotions: EmotionType[] = ['positive', 'excited', 'happy', 'satisfied'];
    
    if (negativeEmotions.includes(emotion)) {
      return { icon: <Frown className="h-4 w-4" />, color: 'text-orange-500' };
    }
    if (positiveEmotions.includes(emotion)) {
      return { icon: <Smile className="h-4 w-4" />, color: 'text-green-500' };
    }
    if (emotion === 'urgent') {
      return { icon: <Zap className="h-4 w-4" />, color: 'text-red-500' };
    }
    return { icon: <Meh className="h-4 w-4" />, color: 'text-gray-600' };
  };
  
  return (
    <div className="space-y-2">
      {/* Emotion Preview */}
      {showEmotionPreview && analysis && analysis.emotion !== 'neutral' && (
        <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg text-sm">
          <span className="text-lg">{getEmotionIcon(analysis.emotion)}</span>
          <span className="text-muted-foreground">
            Detected tone: <strong className="text-foreground">{analysis.emotion}</strong>
            <span className="ml-1 opacity-70">({analysis.confidence}% confidence)</span>
          </span>
          {analysis.shouldEscalate && (
            <Badge variant="destructive" className="ml-auto text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              May trigger escalation
            </Badge>
          )}
          {analysis.urgency !== 'normal' && (
            <Badge variant="outline" className="text-xs">
              {getUrgencyLabel(analysis.urgency)}
            </Badge>
          )}
        </div>
      )}
      
      {/* Input Area */}
      <div className="flex items-end gap-2">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="min-h-[60px] max-h-[200px] resize-none"
          rows={2}
        />
        <Button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          size="icon"
          className="h-[60px] w-[60px] flex-shrink-0"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

export default EmotionAwareChatInput;
