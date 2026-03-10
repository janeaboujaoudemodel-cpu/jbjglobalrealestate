import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Star, Send, CheckCircle, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";

const ratingLabels = ["Poor", "Fair", "Good", "Very Good", "Excellent"];

type SurveyContextKey = "ticket" | "listing" | "job" | "inquiry" | "password_change" | "general";

const contextQuestions: Record<SurveyContextKey, { title: string; badge: string; questions: [string, string, string, string, string] }> = {
  ticket: {
    title: "Rate Your Support Experience",
    badge: "Support Ticket",
    questions: [
      "Overall support experience *",
      "How easy was it to submit your support request?",
      "How fast was our response?",
      "How satisfied are you with the resolution?",
      "How intuitive was your support journey on our website?",
    ],
  },
  listing: {
    title: "Rate Your Listing Experience",
    badge: "Listing",
    questions: [
      "Overall listing experience *",
      "How easy was it to submit your listing?",
      "How clear were listing requirements and steps?",
      "How satisfied are you with listing support quality?",
      "How intuitive was the listing workflow on our website?",
    ],
  },
  job: {
    title: "Rate Your Job Application Experience",
    badge: "Career",
    questions: [
      "Overall application experience *",
      "How easy was it to submit your application?",
      "How clear were the role details and requirements?",
      "How satisfied are you with communication quality?",
      "How intuitive was the careers workflow on our website?",
    ],
  },
  inquiry: {
    title: "Rate Your Inquiry Experience",
    badge: "Inquiry",
    questions: [
      "Overall inquiry experience *",
      "How easy was it to submit your inquiry?",
      "How quickly did we respond to your inquiry?",
      "How helpful was the response you received?",
      "How intuitive was the inquiry journey on our website?",
    ],
  },
  password_change: {
    title: "Rate Your Security Support Experience",
    badge: "Security",
    questions: [
      "Overall security experience *",
      "How easy was the password/security flow?",
      "How clear was the security communication?",
      "How confident do you feel in your account security now?",
      "How intuitive was the account security journey on our website?",
    ],
  },
  general: {
    title: "Rate Your Experience",
    badge: "General",
    questions: [
      "Overall experience *",
      "How easy was the process?",
      "How fast was our response?",
      "How satisfied are you with the quality of service?",
      "How intuitive is our website experience?",
    ],
  },
};

const normalizeContext = (raw: string): SurveyContextKey => {
  const key = raw.toLowerCase();
  if (["ticket", "support", "support_ticket"].includes(key)) return "ticket";
  if (["listing", "property", "sell", "seller_listing"].includes(key)) return "listing";
  if (["job", "career", "cv", "application", "job_application"].includes(key)) return "job";
  if (["inquiry", "enquiry", "contact", "lead"].includes(key)) return "inquiry";
  if (["password-change", "password_change", "security"].includes(key)) return "password_change";
  return "general";
};

const StarRating = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) => (
  <div className="space-y-2">
    <Label className="text-sm font-semibold text-black">{label}</Label>
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" onClick={() => onChange(star)} className="transition-transform hover:scale-110">
          <Star className={`w-8 h-8 ${star <= value ? "fill-[#C8A766] text-[#C8A766]" : "text-zinc-300"}`} />
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
  const sourceParam = searchParams.get("source") || searchParams.get("context") || "general";
  const contextId = searchParams.get("ref") || searchParams.get("id") || ticketNumber || "";
  const ratingParam = parseInt(searchParams.get("rating") || "0");

  const surveyContext = useMemo(() => normalizeContext(sourceParam), [sourceParam]);
  const surveyCopy = contextQuestions[surveyContext];

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
    document.title = `${surveyCopy.badge} Survey | JBJ Global Real Estate`;
  }, [surveyCopy.badge]);

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
          source: sourceParam,
          contextType: surveyContext,
          contextId,
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
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gold/30 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#C8A766] to-[#B8956E] flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-black mb-2">Thank You!</h2>
          <p className="text-zinc-600 mb-4">Your feedback helps us improve our service.</p>
          <div className="bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6] rounded-xl p-4 border border-[#C8A766]">
            <Gift className="w-6 h-6 text-[#C8A766] mx-auto mb-2" />
            <p className="text-lg font-bold text-[#C8A766]">+{pointsAwarded} Points Earned!</p>
            <p className="text-xs text-zinc-500">Thank you for your feedback</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5EBD7] via-[#FDFBF7] to-[#F5F0E6] py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-black mb-2">{surveyCopy.title}</h1>
          <p className="text-zinc-600">
            Context: <span className="font-semibold text-[#C8A766]">{surveyCopy.badge}</span>
            {ticketNumber ? <span> · Ticket: <span className="font-mono text-[#C8A766] font-bold">{ticketNumber}</span></span> : null}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border-2 border-[#C8A766] p-6 space-y-6">
          <StarRating value={overallRating} onChange={setOverallRating} label={`1. ${surveyCopy.questions[0]}`} />
          <StarRating value={easeOfSubmission} onChange={setEaseOfSubmission} label={`2. ${surveyCopy.questions[1]}`} />
          <StarRating value={responseSpeed} onChange={setResponseSpeed} label={`3. ${surveyCopy.questions[2]}`} />
          <StarRating value={resolutionQuality} onChange={setResolutionQuality} label={`4. ${surveyCopy.questions[3]}`} />
          <StarRating value={websiteSmartness} onChange={setWebsiteSmartness} label={`5. ${surveyCopy.questions[4]}`} />

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

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-black">7. Suggestions, complaints, or remarks</Label>
            <Textarea
              value={suggestions}
              onChange={(e) => setSuggestions(e.target.value)}
              placeholder="Share your thoughts..."
              className="min-h-[100px]"
            />
          </div>

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
                Submit Survey
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TicketSurvey;
