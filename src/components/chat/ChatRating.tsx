import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Star, X, ThumbsUp, ThumbsDown, Sparkles, MessageCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ChatRatingProps {
  onSubmitRating: (rating: number, feedback: string, additionalData?: {
    wasHelpful: boolean | null;
    whatImprove: string;
    howHeardAboutUs: string;
    agentBehavior: number;
    responseSpeed: number;
    whatDidntWork: string;
  }) => void;
  onSkip: () => void;
}

const ChatRating = ({ onSubmitRating, onSkip }: ChatRatingProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [wasHelpful, setWasHelpful] = useState<boolean | null>(null);
  const [whatImprove, setWhatImprove] = useState('');
  const [howHeardAboutUs, setHowHeardAboutUs] = useState('');
  const [agentBehavior, setAgentBehavior] = useState(0);
  const [hoveredAgentBehavior, setHoveredAgentBehavior] = useState(0);
  const [responseSpeed, setResponseSpeed] = useState(0);
  const [hoveredResponseSpeed, setHoveredResponseSpeed] = useState(0);
  const [whatDidntWork, setWhatDidntWork] = useState('');
  const [step, setStep] = useState<'main' | 'details'>('main');

  const handleSubmit = () => {
    onSubmitRating(rating, feedback, {
      wasHelpful,
      whatImprove,
      howHeardAboutUs,
      agentBehavior,
      responseSpeed,
      whatDidntWork,
    });
  };

  const ratingLabels = ['😢 Horrible', '😕 Poor', '😐 Okay', '😊 Good', '🤩 Perfect'];

  return (
    <div className="flex-1 p-4 flex flex-col overflow-y-auto">
      <div className="w-14 h-14 rounded-full bg-gradient-to-r from-gold/20 to-gold/10 flex items-center justify-center mb-3 mx-auto">
        <Star className="w-7 h-7 text-[#1A1A1A]" />
      </div>
      
      {step === 'main' ? (
        <>
          <h4 className="text-white text-base font-semibold mb-1 text-center">How was your experience?</h4>
          <p className="text-[#1A1A1A]/70 text-xs text-center mb-4">Your feedback helps us improve</p>

          {/* Overall Rating */}
          <div className="flex gap-2 mb-2 justify-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-6 h-6 ${
                    star <= (hoveredRating || rating)
                      ? 'text-[#1A1A1A] fill-gold'
                      : 'text-[#1A1A1A]/70'
                  }`}
                />
              </button>
            ))}
          </div>
          {(hoveredRating || rating) > 0 && (
            <p className="text-[#1A1A1A] text-xs text-center mb-4">{ratingLabels[(hoveredRating || rating) - 1]}</p>
          )}

          {/* Was it helpful */}
          <div className="mb-4">
            <p className="text-[#1A1A1A]/70 text-xs mb-2 text-center">Did this chat answer your questions?</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setWasHelpful(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                  wasHelpful === true
                    ? 'border-green-500 bg-green-500/20 text-green-400'
                    : 'border-[#1A1A1A] text-[#1A1A1A]/70 hover:border-green-500/50'
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
                <span className="text-xs">Yes</span>
              </button>
              <button
                onClick={() => setWasHelpful(false)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                  wasHelpful === false
                    ? 'border-red-500 bg-red-500/20 text-red-400'
                    : 'border-[#1A1A1A] text-[#1A1A1A]/70 hover:border-red-500/50'
                }`}
              >
                <ThumbsDown className="w-4 h-4" />
                <span className="text-xs">No</span>
              </button>
            </div>
          </div>

          {/* How did you hear about us */}
          <div className="mb-4">
            <p className="text-[#1A1A1A]/70 text-xs mb-2 text-center">How did you hear about us?</p>
            <Select value={howHeardAboutUs} onValueChange={setHowHeardAboutUs}>
              <SelectTrigger className="bg-[#FDFBF7]/10 border-[#B89555]/20 text-white text-xs h-9">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="google">Google Search</SelectItem>
                <SelectItem value="social_media">Social Media</SelectItem>
                <SelectItem value="friend_referral">Friend/Family Referral</SelectItem>
                <SelectItem value="agent_referral">Agent Referral</SelectItem>
                <SelectItem value="advertisement">Advertisement</SelectItem>
                <SelectItem value="property_portal">Property Portal</SelectItem>
                <SelectItem value="event">Event/Exhibition</SelectItem>
                <SelectItem value="news_article">News Article</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 mt-auto">
            <Button
              variant="outline"
              onClick={onSkip}
              size="sm"
              className="flex-1 border-[#1A1A1A] text-white/85 hover:bg-[#1A1A1A]"
            >
              <X className="w-3 h-3 mr-1" />
              Skip
            </Button>
            <Button
              onClick={() => setStep('details')}
              disabled={rating === 0}
              size="sm"
              className="flex-1 bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A]"
            >
              Continue
            </Button>
          </div>
        </>
      ) : (
        <>
          <h4 className="text-white text-sm font-semibold mb-3 text-center">Tell us more</h4>

          {/* Agent Behavior Rating */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[#1A1A1A]/70 text-xs flex items-center gap-1">
                <MessageCircle className="w-3 h-3 text-[#1A1A1A]" />
                Assistant behavior
              </p>
            </div>
            <div className="flex gap-1 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setAgentBehavior(star)}
                  onMouseEnter={() => setHoveredAgentBehavior(star)}
                  onMouseLeave={() => setHoveredAgentBehavior(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-5 h-5 ${
                      star <= (hoveredAgentBehavior || agentBehavior)
                        ? 'text-[#1A1A1A] fill-gold'
                        : 'text-[#1A1A1A]/70'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Response Speed Rating */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[#1A1A1A]/70 text-xs flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#1A1A1A]" />
                Response speed
              </p>
            </div>
            <div className="flex gap-1 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setResponseSpeed(star)}
                  onMouseEnter={() => setHoveredResponseSpeed(star)}
                  onMouseLeave={() => setHoveredResponseSpeed(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-5 h-5 ${
                      star <= (hoveredResponseSpeed || responseSpeed)
                        ? 'text-[#1A1A1A] fill-gold'
                        : 'text-[#1A1A1A]/70'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* What didn't work (if rating < 4) */}
          {rating < 4 && (
            <div className="mb-3">
              <p className="text-[#1A1A1A]/70 text-xs mb-1">What didn't work for you?</p>
              <Textarea
                value={whatDidntWork}
                onChange={(e) => setWhatDidntWork(e.target.value)}
                placeholder="Tell us what went wrong..."
                className="bg-[#FDFBF7]/10 border-[#B89555]/20 text-white placeholder:text-white/85 text-xs h-16 resize-none"
              />
            </div>
          )}

          {/* What can we improve */}
          <div className="mb-3">
            <p className="text-[#1A1A1A]/70 text-xs mb-1">What can we improve?</p>
            <Textarea
              value={whatImprove}
              onChange={(e) => setWhatImprove(e.target.value)}
              placeholder="Your suggestions help us get better..."
              className="bg-[#FDFBF7]/10 border-[#B89555]/20 text-white placeholder:text-white/85 text-xs h-16 resize-none"
            />
          </div>

          {/* Additional feedback */}
          <Input
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Any additional comments? (optional)"
            className="bg-[#FDFBF7]/10 border-[#B89555]/20 text-white placeholder:text-white/85 mb-3 text-xs h-9"
          />

          <div className="flex gap-3 mt-auto">
            <Button
              variant="outline"
              onClick={() => setStep('main')}
              size="sm"
              className="flex-1 border-[#1A1A1A] text-white/85 hover:bg-[#1A1A1A]"
            >
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              size="sm"
              className="flex-1 bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A]"
            >
              Submit Feedback
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatRating;
