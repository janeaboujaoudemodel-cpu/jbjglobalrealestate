import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { BrandedLoaderInline } from "@/components/ui/BrandedLoader";
import { FeedbackPrompt } from "@/components/ui/FeedbackPrompt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Heart,
  TicketCheck,
  MessageSquareHeart,
  AlertCircle,
  Lightbulb,
  Upload,
  Gift,
  Trophy,
  Sparkles,
  Send,
  Star,
  ArrowRight,
  Phone,
  Mail,
  Monitor,
  Globe,
  Calendar,
} from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

// Support Ticket Form
const SUPPORT_SERVICE_CATEGORIES = [
  "Property Listings",
  "Account & Login Issues",
  "Payment & Transactions",
  "Broker Portal",
  "AI Tools & Features",
  "Website Navigation",
  "Mobile App",
  "Document Management",
  "Communication (Email/WhatsApp)",
  "Technical Bug (Website/App)",
  "Property Search Issues",
  "Viewing & Appointments",
  "Dashboard & Reports",
  "Notifications & Alerts",
  "Profile & Settings",
  "CRM Features",
  "Marketing Tools",
  "Analytics & Insights",
  "Integration Issues",
  "Performance & Speed",
  "Other",
];

const SUPPORT_PRIORITY_LEVELS = [
  { value: "low", label: "Low", description: "Minor issue, no urgency" },
  { value: "normal", label: "Normal", description: "Standard priority" },
  { value: "high", label: "High", description: "Significant impact" },
  { value: "critical", label: "Critical", description: "Blocking / urgent" },
] as const;

const SupportTicketForm = () => {
  const { toast } = useToast();
  const formTopRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    subject: "",
    serviceCategory: "",
    priority: "normal",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all required fields with inline error messages
    const errors: Record<string, string> = {};
    
    if (!formData.fullName) {
      errors.fullName = "Full name is required";
    }
    if (!formData.email) {
      errors.email = "Email is required";
    }
    if (!formData.serviceCategory) {
      errors.serviceCategory = "Please select a service category";
    }
    if (!formData.subject) {
      errors.subject = "Subject is required";
    }
    if (!formData.description) {
      errors.description = "Description is required";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("submit-support-ticket", {
        body: {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone || null,
          subject: formData.subject,
          serviceCategory: formData.serviceCategory,
          priority: formData.priority,
          description: formData.description,
        },
      });

      if (error) {
        console.error("Support ticket error:", error);
        toast({
          title: "Submission Failed",
          description: "Unable to submit your ticket. Please try again or contact us directly.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const ticketNumber = data?.ticketNumber || "pending";

      toast({
        title: "Ticket Submitted Successfully!",
        description: `Your support ticket #${ticketNumber} has been created. We'll get back to you within 24 hours.`,
      });
      setShowFeedback(true);
      // Auto-scroll to the top of the form so confirmation is visible
      setTimeout(() => {
        formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

      setFieldErrors({});
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        subject: "",
        serviceCategory: "",
        priority: "normal",
        description: "",
      });
    } catch (err) {
      console.error("Support ticket submission failed:", err);
      toast({
        title: "Submission Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div ref={formTopRef} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fullName" className="text-black">
            Full Name *
          </Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            required
            className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black placeholder:text-gold/70 focus:border-gold"
            placeholder="John Smith"
          />
        </div>
        <div>
          <Label htmlFor="email" className="text-black">
            Email *
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black placeholder:text-gold/70 focus:border-gold"
            placeholder="john@example.com"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone" className="text-black">
            Phone Number
          </Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black placeholder:text-gold/70 focus:border-gold"
            placeholder="+971 50 123 4567"
          />
        </div>
        <div>
          <Label htmlFor="serviceCategory" className="text-black">
            Service with Issue *
          </Label>
          <Select
            value={formData.serviceCategory}
            onValueChange={(v) => {
              setFormData({ ...formData, serviceCategory: v });
              if (fieldErrors.serviceCategory) {
                setFieldErrors(prev => ({ ...prev, serviceCategory: '' }));
              }
            }}
          >
            <SelectTrigger className={`bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 ${fieldErrors.serviceCategory ? 'border-red-500' : 'border-gold/40'} text-black`}>
              <SelectValue placeholder="Select service" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORT_SERVICE_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldErrors.serviceCategory && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.serviceCategory}</p>
          )}
        </div>
      </div>
      <div>
        <Label htmlFor="subject" className="text-black">
          Subject *
        </Label>
        <Input
          id="subject"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          required
          className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black placeholder:text-gold/70 focus:border-gold"
          placeholder="Brief description of your inquiry"
        />
      </div>
      <div>
        <Label htmlFor="priority" className="text-black">
          Priority
        </Label>
        <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
          <SelectTrigger className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black">
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            {SUPPORT_PRIORITY_LEVELS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label} - {p.description}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="description" className="text-black">
          Detailed Description *
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
          rows={5}
          className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black placeholder:text-gold/70 focus:border-gold"
          placeholder="Please describe your inquiry in detail..."
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="group relative w-full inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold rounded-xl transition-all duration-300 overflow-hidden disabled:opacity-50"
        style={{
          background: "linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 50%, #F5F0E6 100%)",
          border: "2px solid rgba(200,167,102,0.5)",
          boxShadow:
            "0 10px 30px rgba(200,167,102,0.4), 0 6px 15px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.9)",
        }}
      >
        {isSubmitting ? (
          <BrandedLoaderInline size={20} className="mr-2" />
        ) : (
          <Send className="w-4 h-4 text-gold group-hover:text-black transition-colors mr-1" />
        )}
        <span className="text-black group-hover:text-gold transition-colors">
          {isSubmitting ? "Submitting..." : "Submit Support Ticket"}
        </span>
      </button>
      {showFeedback && (
        <FeedbackPrompt 
          actionType="ticket" 
          onComplete={() => setShowFeedback(false)}
          onDismiss={() => setShowFeedback(false)}
        />
      )}
    </form>
  );
};

// Feedback/Review Form - Connected to Database
const FeedbackForm = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    serviceType: "",
    review: "",
    wouldRecommend: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast({ title: "Please select a rating", variant: "destructive" });
      return;
    }
    if (!formData.serviceType || !formData.review || !formData.wouldRecommend) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    try {
      // Get current user if logged in
      const { data: { user } } = await supabase.auth.getUser();

      // Check if user has already submitted 3 reviews (max limit)
      if (user) {
        const { count } = await supabase
          .from("customer_reviews")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);
        
        if (count && count >= 3) {
          toast({
            title: "Review Limit Reached",
            description: "You can only submit up to 3 reviews. You can edit your existing reviews from your dashboard.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
      }

      // Insert review into database
      const { error } = await supabase
        .from("customer_reviews")
        .insert({
          user_id: user?.id || null,
          full_name: formData.fullName,
          email: formData.email,
          rating: rating,
          service_type: formData.serviceType,
          review_text: formData.review,
          would_recommend: formData.wouldRecommend,
          status: "pending_approval",
          loyalty_points_awarded: 0, // Points awarded upon approval
        });

      if (error) throw error;

      toast({
        title: "Review Submitted!",
        description: "Thank you! Your review is pending approval. You'll receive 2 loyalty points once approved.",
      });

      setFormData({ fullName: "", email: "", serviceType: "", review: "", wouldRecommend: "" });
      setRating(0);
    } catch (error: any) {
      console.error("Review submission error:", error);
      toast({
        title: "Submission Failed",
        description: error.message || "Unable to submit your review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="reviewName" className="text-black">Your Name *</Label>
          <Input
            id="reviewName"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            required
            className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black"
          />
        </div>
        <div>
          <Label htmlFor="reviewEmail" className="text-black">Email *</Label>
          <Input
            id="reviewEmail"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black"
          />
        </div>
      </div>
      
      <div>
        <Label className="text-black">Your Rating *</Label>
        <div className="flex gap-2 mt-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`w-8 h-8 ${star <= rating ? "fill-gold text-gold" : "text-zinc-400"}`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="serviceType" className="text-black">Service Used *</Label>
        <Select value={formData.serviceType} onValueChange={(v) => setFormData({ ...formData, serviceType: v })}>
          <SelectTrigger className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black">
            <SelectValue placeholder="Select service" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="property-purchase">Property Purchase</SelectItem>
            <SelectItem value="property-rental">Property Rental</SelectItem>
            <SelectItem value="property-sale">Property Sale</SelectItem>
            <SelectItem value="mortgage-assistance">Mortgage Assistance</SelectItem>
            <SelectItem value="legal-services">Legal Services</SelectItem>
            <SelectItem value="consultation">Consultation</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="review" className="text-black">Your Review *</Label>
        <Textarea
          id="review"
          value={formData.review}
          onChange={(e) => setFormData({ ...formData, review: e.target.value })}
          required
          rows={5}
          className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black placeholder:text-gold/70"
          placeholder="Share your experience with JBJ Global Real Estate..."
        />
      </div>

      <div>
        <Label htmlFor="recommend" className="text-black">Would you recommend us?</Label>
        <Select value={formData.wouldRecommend} onValueChange={(v) => setFormData({ ...formData, wouldRecommend: v })}>
          <SelectTrigger className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black">
            <SelectValue placeholder="Select option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="absolutely">Absolutely, 100%!</SelectItem>
            <SelectItem value="definitely">Definitely!</SelectItem>
            <SelectItem value="most-likely">Most Likely</SelectItem>
            <SelectItem value="possibly">Possibly</SelectItem>
            <SelectItem value="not-sure">Not Sure</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <button 
        type="submit" 
        disabled={isSubmitting} 
        className="group relative w-full inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold rounded-xl transition-all duration-300 overflow-hidden disabled:opacity-50"
        style={{
          background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 50%, #F5F0E6 100%)',
          border: '2px solid rgba(200,167,102,0.5)',
          boxShadow: '0 10px 30px rgba(200,167,102,0.4), 0 6px 15px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.9)',
        }}
      >
        <MessageSquareHeart className="w-4 h-4 text-gold group-hover:text-black transition-colors" />
        <span className="text-black group-hover:text-gold transition-colors">{isSubmitting ? "Submitting..." : "Submit"}</span>
        <span className="text-gold group-hover:text-black transition-colors">Review</span>
      </button>
      <p className="text-xs text-zinc-600 text-center">
        Reviews are moderated before being published on our website.
      </p>
    </form>
  );
};

// Issue Report Form
const IssueReportForm = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    browser: "",
    device: "",
    pageUrl: "",
    errorMessage: "",
    description: "",
    stepsToReproduce: "",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setScreenshot(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: "Issue Reported! 🔧",
      description: "Thank you for reporting this issue. Our technical team will investigate and follow up with you.",
    });

    setFormData({
      fullName: "",
      email: "",
      phone: "",
      browser: "",
      device: "",
      pageUrl: "",
      errorMessage: "",
      description: "",
      stepsToReproduce: "",
    });
    setScreenshot(null);
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="issueName" className="text-black">Full Name *</Label>
          <Input
            id="issueName"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            required
            className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black"
          />
        </div>
        <div>
          <Label htmlFor="issueEmail" className="text-black">Email *</Label>
          <Input
            id="issueEmail"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="issuePhone" className="text-black">Phone Number</Label>
          <Input
            id="issuePhone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black"
          />
        </div>
        <div>
          <Label htmlFor="browser" className="text-black">Browser *</Label>
          <Select value={formData.browser} onValueChange={(v) => setFormData({ ...formData, browser: v })}>
            <SelectTrigger className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black">
              <SelectValue placeholder="Select browser" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="chrome">Google Chrome</SelectItem>
              <SelectItem value="safari">Safari</SelectItem>
              <SelectItem value="firefox">Firefox</SelectItem>
              <SelectItem value="edge">Microsoft Edge</SelectItem>
              <SelectItem value="opera">Opera</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="device" className="text-black">Device *</Label>
          <Select value={formData.device} onValueChange={(v) => setFormData({ ...formData, device: v })}>
            <SelectTrigger className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black">
              <SelectValue placeholder="Select device" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desktop-windows">Desktop (Windows)</SelectItem>
              <SelectItem value="desktop-mac">Desktop (Mac)</SelectItem>
              <SelectItem value="laptop">Laptop</SelectItem>
              <SelectItem value="tablet-ipad">Tablet (iPad)</SelectItem>
              <SelectItem value="tablet-android">Tablet (Android)</SelectItem>
              <SelectItem value="mobile-iphone">Mobile (iPhone)</SelectItem>
              <SelectItem value="mobile-android">Mobile (Android)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="pageUrl" className="text-black">Page URL *</Label>
          <Input
            id="pageUrl"
            value={formData.pageUrl}
            onChange={(e) => setFormData({ ...formData, pageUrl: e.target.value })}
            required
            className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black placeholder:text-gold/70"
            placeholder="https://jbjglobalrealestate.lovable.app/..."
          />
        </div>
      </div>

      <div>
        <Label htmlFor="errorMessage" className="text-black">Error Message (if any)</Label>
        <Input
          id="errorMessage"
          value={formData.errorMessage}
          onChange={(e) => setFormData({ ...formData, errorMessage: e.target.value })}
          className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black placeholder:text-gold/70"
          placeholder="Copy and paste any error message you see"
        />
      </div>

      <div>
        <Label htmlFor="description" className="text-black">Issue Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
          rows={4}
          className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black placeholder:text-gold/70"
          placeholder="Describe what's not working..."
        />
      </div>

      <div>
        <Label htmlFor="steps" className="text-black">Steps Taken (Optional)</Label>
        <Textarea
          id="steps"
          value={formData.stepsToReproduce}
          onChange={(e) => setFormData({ ...formData, stepsToReproduce: e.target.value })}
          rows={3}
          className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black placeholder:text-gold/70"
          placeholder="Optional: List the steps you took when the issue occurred"
        />
      </div>

      <div>
        <Label className="text-black">Screenshot (optional)</Label>
        <div className="mt-2 border-2 border-dashed border-gold/40 rounded-lg p-6 text-center hover:border-gold transition-colors bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="screenshot-upload"
          />
          <label htmlFor="screenshot-upload" className="cursor-pointer">
            <Upload className="w-8 h-8 text-gold mx-auto mb-2" />
            <p className="text-zinc-600 text-sm">
              {screenshot ? screenshot.name : "Click to upload a screenshot"}
            </p>
          </label>
        </div>
      </div>

      <button 
        type="submit" 
        disabled={isSubmitting} 
        className="group relative w-full inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold rounded-xl transition-all duration-300 overflow-hidden disabled:opacity-50"
        style={{
          background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 50%, #F5F0E6 100%)',
          border: '2px solid rgba(200,167,102,0.5)',
          boxShadow: '0 10px 30px rgba(200,167,102,0.4), 0 6px 15px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.9)',
        }}
      >
        <AlertCircle className="w-4 h-4 text-gold group-hover:text-black transition-colors" />
        <span className="text-black group-hover:text-gold transition-colors">{isSubmitting ? "Submitting..." : "Report"}</span>
        <span className="text-gold group-hover:text-black transition-colors">Issue</span>
      </button>
    </form>
  );
};

// Idea Box Form
const IdeaBoxForm = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    ideaTitle: "",
    ideaCategory: "",
    ideaDescription: "",
    expectedBenefit: "",
    enterDraw: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get current user if logged in
      const { data: { user } } = await supabase.auth.getUser();

      // Generate a draw ticket number
      const drawTicketNumber = `IDEA-${Date.now().toString(36).toUpperCase()}`;

      // Insert idea into database
      const { error } = await supabase
        .from("best_idea_submissions")
        .insert({
          user_id: user?.id || null,
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone || null,
          idea: formData.ideaDescription,
          idea_title: formData.ideaTitle,
          idea_category: formData.ideaCategory,
          expected_benefit: formData.expectedBenefit || null,
          enter_draw: formData.enterDraw,
          draw_ticket_number: formData.enterDraw ? drawTicketNumber : null,
          status: "pending",
          is_anonymous: false,
        });

      if (error) throw error;

      toast({
        title: "Idea Submitted! 💡",
        description: formData.enterDraw 
          ? `Thank you! Your ticket #${drawTicketNumber} has been entered into the monthly draw. You'll receive 100 points if your idea is approved!`
          : "Thank you for sharing your creativity! You'll receive 100 points if your idea is approved!",
      });

      setFormData({
        fullName: "",
        email: "",
        phone: "",
        ideaTitle: "",
        ideaCategory: "",
        ideaDescription: "",
        expectedBenefit: "",
        enterDraw: true,
      });
    } catch (error: any) {
      console.error("Idea submission error:", error);
      toast({
        title: "Submission Failed",
        description: error.message || "Unable to submit your idea. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Prize Banner - Premium Readable */}
      <div className="bg-gradient-to-r from-purple-900/80 to-gold/30 border-2 border-gold/50 rounded-xl p-5 mb-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-gold" />
          </div>
          <h3 className="text-white text-lg font-bold">Double Reward Opportunity!</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/30 flex items-center justify-center flex-shrink-0">
              <Gift className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <p className="text-white font-semibold text-base mb-1">Monthly Draw</p>
              <p className="text-white/80 text-sm leading-relaxed">Win an iPad Pro or iPhone 16 Pro Max! Draw date announced monthly.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-gold/30 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-gold" />
            </div>
            <div>
              <p className="text-white font-semibold text-base mb-1">Best Idea Prize</p>
              <p className="text-white/80 text-sm leading-relaxed">The most creative idea wins a special cash gift or premium reward!</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="ideaName" className="text-black">Full Name *</Label>
          <Input
            id="ideaName"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            required
            className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black"
          />
        </div>
        <div>
          <Label htmlFor="ideaEmail" className="text-black">Email *</Label>
          <Input
            id="ideaEmail"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="ideaPhone" className="text-black">Phone Number</Label>
          <Input
            id="ideaPhone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black"
          />
        </div>
        <div>
          <Label htmlFor="ideaCategory" className="text-black">Idea Category *</Label>
          <Select value={formData.ideaCategory} onValueChange={(v) => setFormData({ ...formData, ideaCategory: v })}>
            <SelectTrigger className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="website-improvement">Website Improvement</SelectItem>
              <SelectItem value="new-feature">New Feature</SelectItem>
              <SelectItem value="service-enhancement">Service Enhancement</SelectItem>
              <SelectItem value="customer-experience">Customer Experience</SelectItem>
              <SelectItem value="marketing-idea">Marketing Idea</SelectItem>
              <SelectItem value="technology">Technology</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="ideaTitle" className="text-black">Idea Title *</Label>
        <Input
          id="ideaTitle"
          value={formData.ideaTitle}
          onChange={(e) => setFormData({ ...formData, ideaTitle: e.target.value })}
          required
          className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black placeholder:text-gold/70"
          placeholder="Give your idea a catchy title"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ideaDescription" className="text-black">Your Idea *</Label>
        <Textarea
          id="ideaDescription"
          value={formData.ideaDescription}
          onChange={(e) => setFormData({ ...formData, ideaDescription: e.target.value })}
          required
          rows={5}
          className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black placeholder:text-gold/70"
          placeholder="Describe your creative idea in detail. Be as specific as possible!"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="expectedBenefit" className="text-black">Expected Benefit</Label>
        <Textarea
          id="expectedBenefit"
          value={formData.expectedBenefit}
          onChange={(e) => setFormData({ ...formData, expectedBenefit: e.target.value })}
          rows={2}
          className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black placeholder:text-gold/70"
          placeholder="How would this idea benefit JBJ Global Real Estate or our clients?"
        />
      </div>

      <button 
        type="submit" 
        disabled={isSubmitting} 
        className="group relative w-full inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold rounded-xl transition-all duration-300 overflow-hidden disabled:opacity-50"
        style={{
          background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 50%, #F5F0E6 100%)',
          border: '2px solid rgba(200,167,102,0.5)',
          boxShadow: '0 10px 30px rgba(200,167,102,0.4), 0 6px 15px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.9)',
        }}
      >
        <Lightbulb className="w-4 h-4 text-gold group-hover:text-black transition-colors" />
        <span className="text-black group-hover:text-gold transition-colors">{isSubmitting ? "Submitting..." : "Submit Idea &"}</span>
        <span className="text-gold group-hover:text-black transition-colors">Enter Draw</span>
      </button>
      <p className="text-xs text-zinc-600 text-center">
        By submitting, you agree to enter the monthly draw. Winners will be notified via email.
      </p>
    </form>
  );
};

const CustomerHappiness = () => {
  return (
    <>
      <SEOHead
        title="Customer Happiness | JBJ Global Real Estate"
        description="We're here to help! Submit support tickets, share feedback, report issues, or share your creative ideas with JBJ Global Real Estate."
        keywords="customer support, feedback, help desk, contact support, JBJ support"
        canonicalPath="/customer-happiness"
      />

      <div className="min-h-screen bg-black">
        {/* Hero Section - Premium Champagne */}
        <section className="relative py-20 md:py-28 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gold/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px]" />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="text-center max-w-4xl mx-auto"
            >
              <motion.div variants={fadeInUp} className="mb-6">
                <Badge className="bg-gold/15 text-gold border-gold/30 px-4 py-1.5">
                  <Heart className="w-3.5 h-3.5 mr-1.5" />
                  Customer Happiness
                </Badge>
              </motion.div>

              <motion.h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4"
                variants={fadeInUp}
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                <span className="text-white">We're Here to </span>
                <span
                  style={{
                    background: "linear-gradient(135deg, #CBA64B 0%, #E8D5A3 50%, #CBA64B 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Help
                </span>
              </motion.h1>

              <motion.p
                className="text-zinc-400 text-lg max-w-2xl mx-auto mb-8"
                variants={fadeInUp}
              >
                Your satisfaction is our priority. Whether you need support, want to share feedback, 
                report an issue, or have a brilliant idea — we're all ears!
              </motion.p>

              <motion.div
                variants={fadeInUp}
                className="w-24 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent mx-auto"
              />
            </motion.div>
          </div>
        </section>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

        {/* Main Content - Wrapped in Background Card */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            {/* Background Card Wrapper for Premium Look */}
            <Card className="max-w-4xl mx-auto bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 border-2 border-gold/30 backdrop-blur-sm shadow-[0_20px_60px_rgba(200,167,102,0.15)] overflow-hidden">
              <CardContent className="p-4 md:p-8">
                <Tabs defaultValue="support">
                  <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-1.5 md:gap-2 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 p-1.5 md:p-2 rounded-xl mb-8 h-auto">
                    <TabsTrigger value="support" className="flex items-center gap-2 data-[state=active]:bg-white/80 data-[state=active]:text-black data-[state=active]:border-gold data-[state=active]:border-2 text-black py-3">
                      <TicketCheck className="w-4 h-4" />
                      <span className="hidden sm:inline">Support</span> Ticket
                    </TabsTrigger>
                    <TabsTrigger value="feedback" className="flex items-center gap-2 data-[state=active]:bg-white/80 data-[state=active]:text-black data-[state=active]:border-gold data-[state=active]:border-2 text-black py-3">
                      <MessageSquareHeart className="w-4 h-4" />
                      <span className="hidden sm:inline">Write a</span> Review
                    </TabsTrigger>
                    <TabsTrigger value="issue" className="flex items-center gap-2 data-[state=active]:bg-white/80 data-[state=active]:text-black data-[state=active]:border-gold data-[state=active]:border-2 text-black py-3">
                      <AlertCircle className="w-4 h-4" />
                      Report <span className="hidden sm:inline">Issue</span>
                    </TabsTrigger>
                    <TabsTrigger value="idea" className="flex items-center gap-2 data-[state=active]:bg-white/80 data-[state=active]:text-black data-[state=active]:border-gold data-[state=active]:border-2 text-black py-3">
                      <Lightbulb className="w-4 h-4" />
                      Idea <span className="hidden sm:inline">Box</span>
                    </TabsTrigger>
                  </TabsList>

              <TabsContent value="support">
                <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 overflow-hidden">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/40">
                        <TicketCheck className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-black">Create Support Ticket</CardTitle>
                        <CardDescription className="text-zinc-600">
                          Need help? Our team typically responds within 24 hours.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <SupportTicketForm />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="feedback">
                <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 overflow-hidden">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center border border-pink-500/40">
                        <MessageSquareHeart className="w-6 h-6 text-pink-600" />
                      </div>
                      <div>
                        <CardTitle className="text-black">Write a Review</CardTitle>
                        <CardDescription className="text-zinc-600">
                          Share your experience! Approved reviews will be featured on our website.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <FeedbackForm />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="issue">
                <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 overflow-hidden">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center border border-red-500/40">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <CardTitle className="text-black">Report an Issue</CardTitle>
                        <CardDescription className="text-zinc-600">
                          Found a bug or something not working? Help us fix it!
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <IssueReportForm />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="idea">
                <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 overflow-hidden">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center border border-purple-500/40">
                        <Lightbulb className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <CardTitle className="text-black">Idea Box — We Value Your Creativity!</CardTitle>
                        <CardDescription className="text-zinc-600">
                          Share your innovative ideas and win amazing prizes!
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <IdeaBoxForm />
                  </CardContent>
                </Card>
              </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Quick Contact - Premium Color-Coded KPI Cards */}
        <section className="py-16 border-t border-gold/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center max-w-3xl mx-auto"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
                Need Immediate Assistance?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Call Us - Blue */}
                <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-blue-500 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 transform-gpu">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-blue-500/10 border-2 border-blue-500/40 flex items-center justify-center">
                      <Phone className="w-7 h-7 text-blue-500" />
                    </div>
                    <p className="text-black font-semibold mb-1">Call Us</p>
                    <a href="tel:+971565911000" className="text-zinc-600 hover:text-blue-500 transition-colors font-medium">
                      +971 56 591 1000
                    </a>
                  </CardContent>
                </Card>
                {/* Email Us - Purple */}
                <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-purple-500 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300 transform-gpu">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-purple-500/10 border-2 border-purple-500/40 flex items-center justify-center">
                      <Mail className="w-7 h-7 text-purple-500" />
                    </div>
                    <p className="text-black font-semibold mb-1">Email Us</p>
                    <a href="mailto:CONTACT@JBJ.AE" className="text-zinc-600 hover:text-purple-500 transition-colors font-medium">
                      CONTACT@JBJ.AE
                    </a>
                  </CardContent>
                </Card>
                {/* Office Hours - Gold */}
                <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold hover:shadow-lg hover:shadow-gold/20 transition-all duration-300 transform-gpu">
                  <CardContent className="p-6 text-center">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gold/10 border-2 border-gold/40 flex items-center justify-center">
                      <Calendar className="w-7 h-7 text-gold" />
                    </div>
                    <p className="text-black font-semibold mb-1">Office Hours</p>
                    <p className="text-zinc-600 font-medium">Mon–Sun: 9AM–9PM</p>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
};

export default CustomerHappiness;
