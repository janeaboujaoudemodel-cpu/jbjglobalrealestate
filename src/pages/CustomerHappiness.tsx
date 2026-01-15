import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
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
const SupportTicketForm = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    subject: "",
    category: "",
    priority: "medium",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: "Ticket Submitted Successfully! 🎫",
      description: "Your support ticket has been created. We'll get back to you within 24 hours.",
    });

    setFormData({
      fullName: "",
      email: "",
      phone: "",
      subject: "",
      category: "",
      priority: "medium",
      description: "",
    });
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fullName" className="text-zinc-300">Full Name *</Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            required
            className="bg-zinc-900 border-zinc-700 text-white"
            placeholder="John Smith"
          />
        </div>
        <div>
          <Label htmlFor="email" className="text-zinc-300">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="bg-zinc-900 border-zinc-700 text-white"
            placeholder="john@example.com"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone" className="text-zinc-300">Phone Number</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="bg-zinc-900 border-zinc-700 text-white"
            placeholder="+971 50 123 4567"
          />
        </div>
        <div>
          <Label htmlFor="category" className="text-zinc-300">Category *</Label>
          <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
            <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="property-inquiry">Property Inquiry</SelectItem>
              <SelectItem value="account-issue">Account Issue</SelectItem>
              <SelectItem value="payment-billing">Payment & Billing</SelectItem>
              <SelectItem value="technical-support">Technical Support</SelectItem>
              <SelectItem value="general-question">General Question</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="subject" className="text-zinc-300">Subject *</Label>
        <Input
          id="subject"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          required
          className="bg-zinc-900 border-zinc-700 text-white"
          placeholder="Brief description of your inquiry"
        />
      </div>
      <div>
        <Label htmlFor="priority" className="text-zinc-300">Priority</Label>
        <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
          <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low - General inquiry</SelectItem>
            <SelectItem value="medium">Medium - Need assistance soon</SelectItem>
            <SelectItem value="high">High - Urgent matter</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="description" className="text-zinc-300">Detailed Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
          rows={5}
          className="bg-zinc-900 border-zinc-700 text-white"
          placeholder="Please describe your inquiry in detail..."
        />
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full bg-gold hover:bg-gold-dark text-black font-semibold">
        {isSubmitting ? "Submitting..." : "Submit Support Ticket"}
        <Send className="w-4 h-4 ml-2" />
      </Button>
    </form>
  );
};

// Feedback/Review Form
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
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: "Review Submitted! ⭐",
      description: "Thank you for your feedback! Your review will be reviewed by our team before being published.",
    });

    setFormData({ fullName: "", email: "", serviceType: "", review: "", wouldRecommend: "" });
    setRating(0);
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="reviewName" className="text-zinc-300">Your Name *</Label>
          <Input
            id="reviewName"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            required
            className="bg-zinc-900 border-zinc-700 text-white"
          />
        </div>
        <div>
          <Label htmlFor="reviewEmail" className="text-zinc-300">Email *</Label>
          <Input
            id="reviewEmail"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="bg-zinc-900 border-zinc-700 text-white"
          />
        </div>
      </div>
      
      <div>
        <Label className="text-zinc-300">Your Rating *</Label>
        <div className="flex gap-2 mt-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`w-8 h-8 ${star <= rating ? "fill-gold text-gold" : "text-zinc-600"}`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="serviceType" className="text-zinc-300">Service Used *</Label>
        <Select value={formData.serviceType} onValueChange={(v) => setFormData({ ...formData, serviceType: v })}>
          <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
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
        <Label htmlFor="review" className="text-zinc-300">Your Review *</Label>
        <Textarea
          id="review"
          value={formData.review}
          onChange={(e) => setFormData({ ...formData, review: e.target.value })}
          required
          rows={5}
          className="bg-zinc-900 border-zinc-700 text-white"
          placeholder="Share your experience with JBJ Global Real Estate..."
        />
      </div>

      <div>
        <Label htmlFor="recommend" className="text-zinc-300">Would you recommend us?</Label>
        <Select value={formData.wouldRecommend} onValueChange={(v) => setFormData({ ...formData, wouldRecommend: v })}>
          <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
            <SelectValue placeholder="Select option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="definitely">Definitely Yes!</SelectItem>
            <SelectItem value="probably">Probably</SelectItem>
            <SelectItem value="maybe">Maybe</SelectItem>
            <SelectItem value="no">No</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full bg-gold hover:bg-gold-dark text-black font-semibold">
        {isSubmitting ? "Submitting..." : "Submit Review"}
        <MessageSquareHeart className="w-4 h-4 ml-2" />
      </Button>
      <p className="text-xs text-zinc-500 text-center">
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
          <Label htmlFor="issueName" className="text-zinc-300">Full Name *</Label>
          <Input
            id="issueName"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            required
            className="bg-zinc-900 border-zinc-700 text-white"
          />
        </div>
        <div>
          <Label htmlFor="issueEmail" className="text-zinc-300">Email *</Label>
          <Input
            id="issueEmail"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="bg-zinc-900 border-zinc-700 text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="issuePhone" className="text-zinc-300">Phone Number</Label>
          <Input
            id="issuePhone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="bg-zinc-900 border-zinc-700 text-white"
          />
        </div>
        <div>
          <Label htmlFor="browser" className="text-zinc-300">Browser *</Label>
          <Select value={formData.browser} onValueChange={(v) => setFormData({ ...formData, browser: v })}>
            <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
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
          <Label htmlFor="device" className="text-zinc-300">Device *</Label>
          <Select value={formData.device} onValueChange={(v) => setFormData({ ...formData, device: v })}>
            <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
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
          <Label htmlFor="pageUrl" className="text-zinc-300">Page URL *</Label>
          <Input
            id="pageUrl"
            value={formData.pageUrl}
            onChange={(e) => setFormData({ ...formData, pageUrl: e.target.value })}
            required
            className="bg-zinc-900 border-zinc-700 text-white"
            placeholder="https://jbjglobalrealestate.lovable.app/..."
          />
        </div>
      </div>

      <div>
        <Label htmlFor="errorMessage" className="text-zinc-300">Error Message (if any)</Label>
        <Input
          id="errorMessage"
          value={formData.errorMessage}
          onChange={(e) => setFormData({ ...formData, errorMessage: e.target.value })}
          className="bg-zinc-900 border-zinc-700 text-white"
          placeholder="Copy and paste any error message you see"
        />
      </div>

      <div>
        <Label htmlFor="description" className="text-zinc-300">Issue Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
          rows={4}
          className="bg-zinc-900 border-zinc-700 text-white"
          placeholder="Describe what's not working..."
        />
      </div>

      <div>
        <Label htmlFor="steps" className="text-zinc-300">Steps to Reproduce</Label>
        <Textarea
          id="steps"
          value={formData.stepsToReproduce}
          onChange={(e) => setFormData({ ...formData, stepsToReproduce: e.target.value })}
          rows={3}
          className="bg-zinc-900 border-zinc-700 text-white"
          placeholder="1. Go to page X&#10;2. Click on Y&#10;3. Error appears"
        />
      </div>

      <div>
        <Label className="text-zinc-300">Screenshot (optional)</Label>
        <div className="mt-2 border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center hover:border-gold/50 transition-colors">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="screenshot-upload"
          />
          <label htmlFor="screenshot-upload" className="cursor-pointer">
            <Upload className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
            <p className="text-zinc-400 text-sm">
              {screenshot ? screenshot.name : "Click to upload a screenshot"}
            </p>
          </label>
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold">
        {isSubmitting ? "Submitting..." : "Report Issue"}
        <AlertCircle className="w-4 h-4 ml-2" />
      </Button>
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
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: "Idea Submitted! 💡",
      description: "Thank you for sharing your creativity! You've been entered into the monthly draw for electronics and our best idea prize!",
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
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Prize Banner */}
      <div className="bg-gradient-to-r from-purple-900/50 to-gold/20 border border-gold/30 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="w-6 h-6 text-gold" />
          <h3 className="text-white font-semibold">Double Reward Opportunity!</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <Gift className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-medium">Monthly Draw</p>
              <p className="text-zinc-400">Win an iPad or iPhone 17 Pro Max! Draw date announced monthly.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Sparkles className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-medium">Best Idea Prize</p>
              <p className="text-zinc-400">The most creative idea wins a special cash gift or premium reward!</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="ideaName" className="text-zinc-300">Full Name *</Label>
          <Input
            id="ideaName"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            required
            className="bg-zinc-900 border-zinc-700 text-white"
          />
        </div>
        <div>
          <Label htmlFor="ideaEmail" className="text-zinc-300">Email *</Label>
          <Input
            id="ideaEmail"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="bg-zinc-900 border-zinc-700 text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="ideaPhone" className="text-zinc-300">Phone Number</Label>
          <Input
            id="ideaPhone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="bg-zinc-900 border-zinc-700 text-white"
          />
        </div>
        <div>
          <Label htmlFor="ideaCategory" className="text-zinc-300">Idea Category *</Label>
          <Select value={formData.ideaCategory} onValueChange={(v) => setFormData({ ...formData, ideaCategory: v })}>
            <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
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
        <Label htmlFor="ideaTitle" className="text-zinc-300">Idea Title *</Label>
        <Input
          id="ideaTitle"
          value={formData.ideaTitle}
          onChange={(e) => setFormData({ ...formData, ideaTitle: e.target.value })}
          required
          className="bg-zinc-900 border-zinc-700 text-white"
          placeholder="Give your idea a catchy title"
        />
      </div>

      <div>
        <Label htmlFor="ideaDescription" className="text-zinc-300">Your Idea *</Label>
        <Textarea
          id="ideaDescription"
          value={formData.ideaDescription}
          onChange={(e) => setFormData({ ...formData, ideaDescription: e.target.value })}
          required
          rows={5}
          className="bg-zinc-900 border-zinc-700 text-white"
          placeholder="Describe your creative idea in detail. Be as specific as possible!"
        />
      </div>

      <div>
        <Label htmlFor="expectedBenefit" className="text-zinc-300">Expected Benefit</Label>
        <Textarea
          id="expectedBenefit"
          value={formData.expectedBenefit}
          onChange={(e) => setFormData({ ...formData, expectedBenefit: e.target.value })}
          rows={2}
          className="bg-zinc-900 border-zinc-700 text-white"
          placeholder="How would this idea benefit JBJ Global Real Estate or our clients?"
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-purple-600 to-gold hover:opacity-90 text-white font-semibold">
        {isSubmitting ? "Submitting..." : "Submit Idea & Enter Draw"}
        <Lightbulb className="w-4 h-4 ml-2" />
      </Button>
      <p className="text-xs text-zinc-500 text-center">
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

      <div className="min-h-screen bg-[#0D0D0D]">
        {/* Hero Section */}
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

        {/* Main Content */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <Tabs defaultValue="support" className="max-w-4xl mx-auto">
              <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-zinc-900/50 p-2 rounded-xl mb-8 h-auto">
                <TabsTrigger value="support" className="flex items-center gap-2 data-[state=active]:bg-gold data-[state=active]:text-black py-3">
                  <TicketCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">Support</span> Ticket
                </TabsTrigger>
                <TabsTrigger value="feedback" className="flex items-center gap-2 data-[state=active]:bg-gold data-[state=active]:text-black py-3">
                  <MessageSquareHeart className="w-4 h-4" />
                  <span className="hidden sm:inline">Write a</span> Review
                </TabsTrigger>
                <TabsTrigger value="issue" className="flex items-center gap-2 data-[state=active]:bg-gold data-[state=active]:text-black py-3">
                  <AlertCircle className="w-4 h-4" />
                  Report <span className="hidden sm:inline">Issue</span>
                </TabsTrigger>
                <TabsTrigger value="idea" className="flex items-center gap-2 data-[state=active]:bg-gold data-[state=active]:text-black py-3">
                  <Lightbulb className="w-4 h-4" />
                  Idea <span className="hidden sm:inline">Box</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="support">
                <Card className="bg-zinc-900/60 border-zinc-800">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                        <TicketCheck className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <CardTitle className="text-white">Create Support Ticket</CardTitle>
                        <CardDescription className="text-zinc-400">
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
                <Card className="bg-zinc-900/60 border-zinc-800">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center">
                        <MessageSquareHeart className="w-6 h-6 text-pink-400" />
                      </div>
                      <div>
                        <CardTitle className="text-white">Write a Review</CardTitle>
                        <CardDescription className="text-zinc-400">
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
                <Card className="bg-zinc-900/60 border-zinc-800">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-red-400" />
                      </div>
                      <div>
                        <CardTitle className="text-white">Report an Issue</CardTitle>
                        <CardDescription className="text-zinc-400">
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
                <Card className="bg-zinc-900/60 border-zinc-800">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                        <Lightbulb className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <CardTitle className="text-white">Idea Box — We Value Your Creativity!</CardTitle>
                        <CardDescription className="text-zinc-400">
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
          </div>
        </section>

        {/* Quick Contact */}
        <section className="py-16 border-t border-zinc-800">
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
                <Card className="bg-zinc-900/60 border-zinc-800 hover:border-gold/30 transition-colors">
                  <CardContent className="p-6 text-center">
                    <Phone className="w-8 h-8 text-gold mx-auto mb-3" />
                    <p className="text-white font-medium mb-1">Call Us</p>
                    <a href="tel:+97156591100" className="text-zinc-400 hover:text-gold">
                      +971 56 591 1000
                    </a>
                  </CardContent>
                </Card>
                <Card className="bg-zinc-900/60 border-zinc-800 hover:border-gold/30 transition-colors">
                  <CardContent className="p-6 text-center">
                    <Mail className="w-8 h-8 text-gold mx-auto mb-3" />
                    <p className="text-white font-medium mb-1">Email Us</p>
                    <a href="mailto:support@jbj.ae" className="text-zinc-400 hover:text-gold">
                      support@jbj.ae
                    </a>
                  </CardContent>
                </Card>
                <Card className="bg-zinc-900/60 border-zinc-800 hover:border-gold/30 transition-colors">
                  <CardContent className="p-6 text-center">
                    <Calendar className="w-8 h-8 text-gold mx-auto mb-3" />
                    <p className="text-white font-medium mb-1">Office Hours</p>
                    <p className="text-zinc-400">Sun-Thu: 9AM-6PM</p>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default CustomerHappiness;
