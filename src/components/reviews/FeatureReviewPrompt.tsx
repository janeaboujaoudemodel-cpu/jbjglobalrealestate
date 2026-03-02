import { useEffect, useState } from "react";
import { Star, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface FeatureReviewPromptProps {
  featureKey: string;
  featureLabel: string;
  question?: string;
  trigger?: React.ReactNode;
  initialTitle?: string;
  initialReview?: string;
}

export function FeatureReviewPrompt({
  featureKey,
  featureLabel,
  question,
  trigger,
  initialTitle,
  initialReview,
}: FeatureReviewPromptProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState(initialTitle || "");
  const [improveText, setImproveText] = useState("");
  const [reviewText, setReviewText] = useState(initialReview || "");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [publishRequested, setPublishRequested] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setReviewTitle(initialTitle || "");
  }, [initialTitle]);

  useEffect(() => {
    setReviewText(initialReview || "");
  }, [initialReview]);

  const handleSubmit = async () => {
    if (!rating) {
      toast.error("Please select a star rating");
      return;
    }

    setSubmitting(true);
    try {
      let fullName = "Anonymous";
      const email = user?.email || "";

      if (user?.id) {
        const { data: profile } = await supabase
          .from("crm_users_profile")
          .select("display_name")
          .eq("user_id", user.id)
          .single();
        if (profile?.display_name) fullName = profile.display_name;
      }

      const title = reviewTitle.trim() || `${featureLabel} Feedback`;
      const body = reviewText.trim() || `Rated ${featureLabel} ${rating}/5 stars`;
      const composedReview = `${title}\n\n${body}`;

      const { error } = await supabase.from("customer_reviews").insert({
        user_id: user?.id || null,
        full_name: isAnonymous ? "Anonymous" : fullName,
        email,
        rating,
        review_text: composedReview,
        improve_text: improveText || null,
        feature_key: featureKey,
        service_type: featureLabel,
        would_recommend: rating >= 4 ? "Yes" : rating >= 3 ? "Maybe" : "No",
        is_anonymous: isAnonymous,
        publish_requested: publishRequested,
        status: "pending_approval",
      });

      if (error) throw error;

      toast.success("Thank you! Your review has been submitted for approval.");
      setOpen(false);
      setRating(0);
      setImproveText("");
      setReviewTitle(initialTitle || "");
      setReviewText(initialReview || "");
    } catch (err: any) {
      console.error("Review submit error:", err);
      toast.error("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2 border-gold/30 text-gold hover:bg-gold/10">
            <Star className="h-4 w-4 fill-gold" />
            Rate
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md bg-white border-2 border-gold/30">
        <DialogHeader>
          <DialogTitle className="text-black flex items-center gap-2">
            <Star className="h-5 w-5 text-gold fill-gold" />
            Rate {featureLabel}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <p className="text-sm text-zinc-600">{question || `How would you rate your experience with ${featureLabel}?`}</p>

          <div className="flex gap-2 justify-center py-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-125"
              >
                <Star
                  className={`h-10 w-10 transition-colors ${
                    star <= (hoverRating || rating) ? "fill-gold text-gold" : "text-zinc-300"
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-center text-sm font-medium text-gold">
              {rating === 5 ? "Excellent!" : rating === 4 ? "Great!" : rating === 3 ? "Good" : rating === 2 ? "Fair" : "Poor"}
            </p>
          )}

          <div>
            <Label className="text-zinc-700 text-sm">Review title</Label>
            <Input
              value={reviewTitle}
              onChange={(e) => setReviewTitle(e.target.value)}
              placeholder="Review title"
              className="mt-1 bg-zinc-50 border-zinc-200"
            />
          </div>

          <div>
            <Label className="text-zinc-700 text-sm">Your review (optional)</Label>
            <Textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience..."
              className="mt-1 bg-zinc-50 border-zinc-200"
              rows={3}
            />
          </div>

          <div>
            <Label className="text-zinc-700 text-sm">What can we improve?</Label>
            <Textarea
              value={improveText}
              onChange={(e) => setImproveText(e.target.value)}
              placeholder="Any suggestions for improvement..."
              className="mt-1 bg-zinc-50 border-zinc-200"
              rows={2}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-zinc-600">Publish anonymously</Label>
              <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm text-zinc-600">Allow publishing on website</Label>
              <Switch checked={publishRequested} onCheckedChange={setPublishRequested} />
            </div>
          </div>

          <p className="text-xs text-zinc-400">Reviews are moderated before publishing. You earn 2 points when your review is approved.</p>

          <Button onClick={handleSubmit} disabled={submitting || !rating} className="w-full bg-gold hover:bg-gold/90 text-black font-bold">
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Submit Review
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
