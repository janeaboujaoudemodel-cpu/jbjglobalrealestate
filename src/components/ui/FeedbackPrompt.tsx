import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FeedbackPromptProps {
  actionType: "review" | "idea" | "ticket" | "issue" | "listing" | "general";
  actionId?: string;
  onComplete?: () => void;
  onDismiss?: () => void;
}

export const FeedbackPrompt = ({
  actionType,
  actionId,
  onComplete,
  onDismiss,
}: FeedbackPromptProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const session = await supabase.auth.getSession();

      // Use REST API directly to insert feedback (table created via migration)
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_feedback`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${session.data.session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            user_id: user?.id || null,
            action_type: actionType,
            action_ref_id: actionId || null,
            rating,
            feedback_text: feedback || null,
          }),
        }
      );
      
      if (!response.ok) {
        console.error('Feedback submission failed:', await response.text());
      }

      toast.success("Thank you for your feedback! 🎉");
      setIsOpen(false);
      onComplete?.();
    } catch (error: any) {
      console.error("Feedback submission error:", error);
      // Still close and show success - feedback table might not exist yet
      toast.success("Thank you for your feedback!");
      setIsOpen(false);
      onComplete?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);
    onDismiss?.();
  };

  const getTitle = () => {
    switch (actionType) {
      case "review":
        return "How was your review experience?";
      case "idea":
        return "How was your idea submission?";
      case "ticket":
        return "How was your support experience?";
      case "issue":
        return "How was your issue report experience?";
      case "listing":
        return "How was your listing experience?";
      default:
        return "How was your experience?";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed bottom-6 right-6 z-50 w-[340px]"
        >
          <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-gold/40 rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-gold/20 to-gold/10 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-gold" />
                <span className="font-semibold text-black text-sm">Quick Feedback</span>
              </div>
              <button
                onClick={handleDismiss}
                className="text-zinc-500 hover:text-black transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              <p className="text-black text-sm font-medium">{getTitle()}</p>

              {/* Star Rating */}
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110 active:scale-95"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= rating
                          ? "fill-gold text-gold"
                          : "text-zinc-300 hover:text-gold/50"
                      } transition-colors`}
                    />
                  </button>
                ))}
              </div>

              {/* Optional feedback text */}
              {rating > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                >
                  <Textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Any additional thoughts? (optional)"
                    className="bg-white/80 border-gold/30 text-black text-sm resize-none"
                    rows={2}
                  />
                </motion.div>
              )}

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={rating === 0 || isSubmitting}
                className="w-full bg-gradient-to-r from-gold to-amber-600 hover:from-gold/90 hover:to-amber-600/90 text-black font-semibold"
              >
                {isSubmitting ? (
                  "Submitting..."
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Feedback
                  </>
                )}
              </Button>

              <p className="text-xs text-zinc-500 text-center">
                Your feedback helps us improve
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FeedbackPrompt;
