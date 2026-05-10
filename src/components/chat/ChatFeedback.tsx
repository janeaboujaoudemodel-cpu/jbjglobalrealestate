import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ThumbsUp, ThumbsDown, Minus, Star, CheckCircle } from 'lucide-react';
import { T } from '@/components/ui/T';

export type FeedbackType = 'positive' | 'neutral' | 'negative';

interface ChatFeedbackProps {
  onSubmitFeedback: (feedback: {
    type: FeedbackType;
    rating: number;
    comment: string;
  }) => void;
  onSkip: () => void;
}

const ChatFeedback = ({ onSubmitFeedback, onSkip }: ChatFeedbackProps) => {
  const [feedbackType, setFeedbackType] = useState<FeedbackType | null>(null);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [step, setStep] = useState<'type' | 'details' | 'submitted'>('type');

  const handleSelectType = (type: FeedbackType) => {
    setFeedbackType(type);
    // Auto-set rating based on feedback type
    if (type === 'positive') setRating(5);
    else if (type === 'neutral') setRating(3);
    else setRating(1);
    setStep('details');
  };

  const handleSubmit = () => {
    if (feedbackType) {
      onSubmitFeedback({
        type: feedbackType,
        rating,
        comment
      });
      setStep('submitted');
    }
  };

  if (step === 'submitted') {
    return (
      <div className="flex-1 p-4 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h4 className="text-[#1A1A1A] text-lg font-semibold mb-2">
          <T>Thank You!</T>
        </h4>
        <p className="text-[#1A1A1A]/70 text-sm mb-4">
          <T>Your feedback helps us improve our service</T>
        </p>
        <Button
          onClick={onSkip}
          className="bg-[#EFE6D6] hover:bg-[#EFE6D6]-light text-[#1A1A1A]"
        >
          <T>Close</T>
        </Button>
      </div>
    );
  }

  if (step === 'type') {
    return (
      <div className="flex-1 p-4 flex flex-col items-center justify-center">
        <div className="w-14 h-14 rounded-full bg-gradient-to-r from-gold/20 to-gold/10 flex items-center justify-center mb-4">
          <Star className="w-7 h-7 text-[#1A1A1A]" />
        </div>
        
        <h4 className="text-[#1A1A1A] text-lg font-semibold mb-2 text-center">
          <T>How was your chat experience?</T>
        </h4>
        <p className="text-[#1A1A1A]/70 text-sm text-center mb-6">
          <T>Your feedback helps us serve you better</T>
        </p>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => handleSelectType('positive')}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-green-200 hover:border-green-500 hover:bg-green-50 transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <ThumbsUp className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm font-medium text-green-700"><T>Positive</T></span>
          </button>

          <button
            onClick={() => handleSelectType('neutral')}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-[#B89555]/30 hover:border-[#B89555]/30 hover:bg-[#F7F2EA] transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-[#F7F2EA] flex items-center justify-center">
              <Minus className="w-6 h-6 text-[#1A1A1A]/70" />
            </div>
            <span className="text-sm font-medium text-[#1A1A1A]/70"><T>Neutral</T></span>
          </button>

          <button
            onClick={() => handleSelectType('negative')}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-red-200 hover:border-red-500 hover:bg-red-50 transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <ThumbsDown className="w-6 h-6 text-red-600" />
            </div>
            <span className="text-sm font-medium text-red-700"><T>Negative</T></span>
          </button>
        </div>

        <button
          onClick={onSkip}
          className="text-[#1A1A1A]/70 text-sm hover:text-[#1A1A1A] transition-colors"
        >
          <T>Skip feedback</T>
        </button>
      </div>
    );
  }

  // Details step
  return (
    <div className="flex-1 p-4 flex flex-col">
      <div className="text-center mb-4">
        <h4 className="text-[#1A1A1A] text-lg font-semibold mb-2">
          <T>Tell us more</T>
        </h4>
        <p className="text-[#1A1A1A]/70 text-sm">
          <T>Rate your experience</T>
        </p>
      </div>

      {/* Star rating */}
      <div className="flex justify-center gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`w-8 h-8 ${
                star <= (hoveredRating || rating)
                  ? 'text-[#1A1A1A] fill-gold'
                  : 'text-[#1A1A1A]/70'
              }`}
            />
          </button>
        ))}
      </div>

      {/* Comment */}
      <div className="mb-4">
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your thoughts with us... (optional)"
          className="bg-[#FDFBF7] border-2 border-[#B89555]/40 text-[#1A1A1A] placeholder:text-[#1A1A1A]/70 resize-none h-24"
        />
      </div>

      <div className="mt-auto flex gap-3">
        <Button
          variant="outline"
          onClick={() => setStep('type')}
          className="flex-1 border-[#B89555]/50 text-[#1A1A1A]"
        >
          <T>Back</T>
        </Button>
        <Button
          onClick={handleSubmit}
          className="flex-1 bg-[#EFE6D6] hover:bg-[#EFE6D6]-light text-[#1A1A1A]"
        >
          <T>Submit</T>
        </Button>
      </div>
    </div>
  );
};

export default ChatFeedback;
