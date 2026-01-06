import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Star, X } from 'lucide-react';

interface ChatRatingProps {
  onSubmitRating: (rating: number, feedback: string) => void;
  onSkip: () => void;
}

const ChatRating = ({ onSubmitRating, onSkip }: ChatRatingProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  return (
    <div className="flex-1 p-6 flex flex-col items-center justify-center">
      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-gold/20 to-gold/10 flex items-center justify-center mb-4">
        <Star className="w-8 h-8 text-gold" />
      </div>
      <h4 className="text-white text-lg font-semibold mb-2">How was your experience?</h4>
      <p className="text-zinc-400 text-sm text-center mb-6">Your feedback helps us improve</p>

      <div className="flex gap-2 mb-6">
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
                  ? 'text-gold fill-gold'
                  : 'text-zinc-600'
              }`}
            />
          </button>
        ))}
      </div>

      <Input
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Any additional feedback? (optional)"
        className="bg-white/10 border-gold/20 text-white placeholder:text-white/40 mb-4 w-full max-w-xs"
      />

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onSkip}
          className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
        >
          <X className="w-4 h-4 mr-2" />
          Skip
        </Button>
        <Button
          onClick={() => onSubmitRating(rating, feedback)}
          disabled={rating === 0}
          className="bg-gold hover:bg-gold/90 text-black"
        >
          Submit Feedback
        </Button>
      </div>
    </div>
  );
};

export default ChatRating;
