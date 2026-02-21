import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Star, Send, CheckCircle, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const ratingLabels = ["Poor", "Fair", "Good", "Very Good", "Excellent"];

const StarRating = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) => (
  <div className="space-y-2">
    <Label className="text-sm font-semibold text-black">{label}</Label>
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`w-8 h-8 ${star <= value ? "fill-[#C8A766] text-[#C8A766]" : "text-zinc-300"}`}
          />
        </button>
      ))}
      {value > 0 && <span className="ml-2 text-sm text-zinc-500 self-center">{ratingLabels[value - 1]}</span>}
    </div>
  </div>
);

const TicketSurvey = () => {
  const [searchParams] = useSearchParams();
  const ticketNumber = searchParams.get("ticket") || "";
  const emailParam = searchParams.get("email") || "";
  const ratingParam = parseInt(searchParams.get("rating") || "0");

  const [overallRating, setOverallRating] = useState(ratingParam > 0 && ratingParam <= 5 ? ratingParam : 0);
  const [easeOfSubmission, setEaseOfSubmission] = useState(0);
  const [responseSpeed, setResponseSpeed] = useState(0);
  const [resolutionQuality, setResolutionQuality] = useState(0);
  const [websiteSmartness, setWebsiteSmartness] = useState(0);
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [suggestions, setSuggestions] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pointsAwarded, setPointsAwarded] = useState(0);

  useEffect(() => {
    document.title = "Ticket Survey | JBJ Global Real Estate";
  }, []);

  const handleSubmit = async () => {
    if (overallRating === 0) {
      toast.error("Please rate your overall experience");
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("submit-ticket-survey", {
        body: {
          ticketNumber,
          email: emailParam,
          fullName: "",
          phone: "",
          overallRating,
          easeOfSubmission: easeOfSubmission || overallRating,
          responseSpeed: responseSpeed || overallRating,
          resolutionQuality: resolutionQuality || overallRating,
          websiteSmartness: websiteSmartness || overallRating,
          wouldRecommend: wouldRecommend ?? true,
          suggestions,
        },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setPointsAwarded(data?.pointsAwarded || 50);
      setSubmitted(true);
    } catch (err: any) {
      console.error("Survey submit error:", err);
      toast.error(err.message || "Failed to submit survey");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5EBD7] via-[#FDFBF7] to-[#F5F0E6] flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-xl border-2 border-[#C8A766] p-8 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#C8A766] to-[#B8956E] flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-black mb-2">Thank You!</h2>
          <p className="text-zinc-600 mb-4">Your feedback helps us improve our service.</p>
          <div className="bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6] rounded-xl p-4 border border-[#C8A766]">
            <Gift className="w-6 h-6 text-[#C8A766] mx-auto mb-2" />
            <p className="text-lg font-bold text-[#C8A766]">+{pointsAwarded} Points Earned!</p>
            <p className="text-xs text-zinc-500">Points have been added to your account</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5EBD7] via-[#FDFBF7] to-[#F5F0E6] py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-black mb-2">Rate Your Experience</h1>
          <p className="text-zinc-600">
            Ticket: <span className="font-mono text-[#C8A766] font-bold">{ticketNumber}</span>
          </p>
        </div>

        {/* Survey Form */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-[#C8A766] p-6 space-y-6">
          <StarRating value={overallRating} onChange={setOverallRating} label="1. Overall Experience *" />
          <StarRating value={easeOfSubmission} onChange={setEaseOfSubmission} label="2. How easy was it to submit your ticket?" />
          <StarRating value={responseSpeed} onChange={setResponseSpeed} label="3. How fast was our response?" />
          <StarRating value={resolutionQuality} onChange={setResolutionQuality} label="4. How satisfied are you with the resolution?" />
          <StarRating value={websiteSmartness} onChange={setWebsiteSmartness} label="5. How smart/intuitive is the website?" />

          {/* Would Recommend */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-black">6. Would you recommend JBJ to others?</Label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setWouldRecommend(true)}
                className={`flex-1 py-3 rounded-xl border-2 font-semibold transition-all ${
                  wouldRecommend === true
                    ? "bg-gradient-to-br from-[#C8A766] to-[#B8956E] text-white border-[#C8A766]"
                    : "bg-white text-black border-zinc-200 hover:border-[#C8A766]"
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setWouldRecommend(false)}
                className={`flex-1 py-3 rounded-xl border-2 font-semibold transition-all ${
                  wouldRecommend === false
                    ? "bg-zinc-800 text-white border-zinc-800"
                    : "bg-white text-black border-zinc-200 hover:border-zinc-400"
                }`}
              >
                No
              </button>
            </div>
          </div>

          {/* Suggestions */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-black">7. Suggestions, complaints, or remarks</Label>
            <Textarea
              value={suggestions}
              onChange={(e) => setSuggestions(e.target.value)}
              placeholder="Share your thoughts..."
              className="min-h-[100px]"
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={submitting || overallRating === 0}
            className="w-full py-6 text-lg font-bold bg-gradient-to-r from-[#C8A766] to-[#B8956E] hover:from-[#B8956E] hover:to-[#A07D4A] text-white rounded-xl"
          >
            {submitting ? (
              <span className="animate-pulse">Submitting...</span>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Submit Survey & Earn 50 Points
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TicketSurvey;
