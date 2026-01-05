import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Footer from "@/components/Footer";
import BrokerPaymentModal from "@/components/broker/BrokerPaymentModal";
import { 
  Crown, 
  FileText, 
  GraduationCap, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  Users,
  TrendingUp,
  Target,
  BookOpen,
  Video,
  Award,
  Zap,
  Shield,
  Phone,
  Mail,
  Bot,
  FileSpreadsheet,
  Palette,
  Download,
  Star
} from "lucide-react";

const TIERS = [
  {
    id: "starter",
    name: "Starter",
    price: 49,
    priceAed: 180,
    period: "month",
    yearlyPrice: 399,
    yearlyPriceAed: 1465,
    description: "Perfect for new brokers starting their journey",
    trialDays: 7,
    features: [
      { text: "5 AI Property Reports / month", included: true },
      { text: "Basic PDF Generator (JJ Branding)", included: true },
      { text: "Access to Video Course Library", included: true },
      { text: "Closing Techniques Module", included: true },
      { text: "Email Support", included: true },
      { text: "Custom Branding on PDFs", included: false },
      { text: "AI Comparison Reports", included: false },
      { text: "Live Training Sessions", included: false },
      { text: "1-on-1 Mentorship", included: false },
    ],
    aiCredits: 5,
    popular: false,
    color: "from-zinc-600 to-zinc-800",
  },
  {
    id: "professional",
    name: "Professional",
    price: 149,
    priceAed: 547,
    period: "month",
    yearlyPrice: 1199,
    yearlyPriceAed: 4403,
    description: "For serious brokers ready to scale",
    trialDays: 7,
    features: [
      { text: "50 AI Property Reports / month", included: true },
      { text: "Custom Branded PDFs", included: true },
      { text: "Full Course Library Access", included: true },
      { text: "AI Comparison & Recommendations", included: true },
      { text: "Objection Handling Masterclass", included: true },
      { text: "Lead Generation Strategies", included: true },
      { text: "Priority Email & Chat Support", included: true },
      { text: "Monthly Live Q&A Sessions", included: true },
      { text: "1-on-1 Mentorship", included: false },
    ],
    aiCredits: 50,
    popular: true,
    color: "from-gold to-gold-dark",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 399,
    priceAed: 1465,
    period: "month",
    yearlyPrice: 3199,
    yearlyPriceAed: 11747,
    description: "Unlimited power for top performers",
    trialDays: 7,
    features: [
      { text: "Unlimited AI Property Reports", included: true },
      { text: "White-Label PDF Exports", included: true },
      { text: "All Courses + New Releases", included: true },
      { text: "Unlimited AI Analysis & Comparison", included: true },
      { text: "Advanced Lead Management System", included: true },
      { text: "Prospecting & CRM Integration", included: true },
      { text: "24/7 Priority Support", included: true },
      { text: "Weekly Live Training", included: true },
      { text: "Monthly 1-on-1 Mentorship Calls", included: true },
    ],
    aiCredits: -1, // unlimited
    popular: false,
    color: "from-purple-600 to-purple-900",
  },
];

const COURSE_MODULES = [
  {
    icon: Target,
    title: "Closing Techniques",
    lessons: 12,
    duration: "4 hours",
    description: "Master the art of closing deals with proven techniques",
  },
  {
    icon: Users,
    title: "Objection Handling",
    lessons: 8,
    duration: "3 hours",
    description: "Turn objections into opportunities",
  },
  {
    icon: TrendingUp,
    title: "Lead Generation",
    lessons: 10,
    duration: "5 hours",
    description: "Build a consistent pipeline of qualified leads",
  },
  {
    icon: BookOpen,
    title: "Lead Management System",
    lessons: 6,
    duration: "2.5 hours",
    description: "Organize and nurture leads effectively",
  },
  {
    icon: Zap,
    title: "Prospecting Mastery",
    lessons: 8,
    duration: "3.5 hours",
    description: "Find and qualify potential clients",
  },
  {
    icon: Award,
    title: "Market Expertise",
    lessons: 10,
    duration: "4 hours",
    description: "Deep dive into UAE real estate market",
  },
];

const TOOLS = [
  {
    icon: FileText,
    title: "PDF Property Report Generator",
    description: "Create stunning property presentations with your branding",
  },
  {
    icon: Bot,
    title: "AI Property Comparison",
    description: "Generate detailed comparison tables for multiple properties",
  },
  {
    icon: Sparkles,
    title: "AI Recommendation Engine",
    description: "Let AI recommend the best property for your client",
  },
  {
    icon: Palette,
    title: "Custom Branding Editor",
    description: "Add your logo, photo, and contact details to exports",
  },
  {
    icon: FileSpreadsheet,
    title: "Excel Data Export",
    description: "Export property data to Excel for detailed analysis",
  },
  {
    icon: Download,
    title: "Bulk Download Manager",
    description: "Download multiple property materials at once",
  },
];

export default function BrokerToolkit() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("yearly");
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const handleSelectTier = (tierId: string) => {
    if (!user) {
      navigate("/auth?redirect=/broker-toolkit");
      return;
    }
    setSelectedTier(tierId);
    setPaymentModalOpen(true);
  };

  const selectedTierData = TIERS.find(t => t.id === selectedTier);

  return (
    <div className="min-h-screen bg-[hsl(var(--premium-bg))]">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gold/5 via-transparent to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <Badge className="bg-gold/20 text-gold border-gold/30 mb-6">
              <GraduationCap className="w-3 h-3 mr-1" />
              Exclusive for Real Estate Professionals
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Broker <span className="text-gold">Toolkit</span>
            </h1>
            <p className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
              Everything you need to close more deals: AI-powered tools, professional 
              training courses, and customizable property marketing materials.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-gold to-gold-dark text-black hover:brightness-110"
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <Crown className="w-5 h-5 mr-2" />
                Start 7-Day Free Trial
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-zinc-700 text-white hover:bg-zinc-800"
                onClick={() => document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <Video className="w-5 h-5 mr-2" />
                Preview Courses
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-zinc-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "2,800+", label: "Brokers Trained" },
              { value: "50+", label: "Course Lessons" },
              { value: "95%", label: "Success Rate" },
              { value: "24/7", label: "AI Assistance" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="text-3xl md:text-4xl font-bold text-gold mb-2">{stat.value}</div>
                <div className="text-zinc-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 mb-4">
              <Sparkles className="w-3 h-3 mr-1" />
              AI-Powered Tools
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Professional Tools for Modern Brokers
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Generate stunning property presentations, AI comparisons, and custom-branded 
              materials in seconds.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TOOLS.map((tool, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-gold/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center mb-4">
                  <tool.icon className="w-6 h-6 text-gold" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{tool.title}</h3>
                <p className="text-zinc-400 text-sm">{tool.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section id="courses" className="py-20 bg-zinc-900/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 mb-4">
              <GraduationCap className="w-3 h-3 mr-1" />
              Training Academy
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Master Real Estate Sales
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Comprehensive courses designed by industry experts with over 20 years of experience.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {COURSE_MODULES.map((module, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 hover:border-purple-500/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 flex items-center justify-center flex-shrink-0">
                    <module.icon className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">{module.title}</h3>
                    <p className="text-zinc-400 text-sm mb-3">{module.description}</p>
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {module.lessons} Lessons
                      </span>
                      <span className="flex items-center gap-1">
                        <Video className="w-3 h-3" />
                        {module.duration}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="bg-gold/20 text-gold border-gold/30 mb-4">
              <Crown className="w-3 h-3 mr-1" />
              Pricing Plans
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Choose Your Plan
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto mb-8">
              All plans include a 7-day free trial. No charges until the trial ends.
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-full p-1">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  billingPeriod === "monthly" 
                    ? "bg-gold text-black" 
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod("yearly")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  billingPeriod === "yearly" 
                    ? "bg-gold text-black" 
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Yearly
                <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                  Save 33%
                </span>
              </button>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {TIERS.map((tier, i) => (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className={`relative bg-zinc-900/80 border rounded-2xl p-6 ${
                  tier.popular 
                    ? "border-gold shadow-lg shadow-gold/20" 
                    : "border-zinc-800"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gold text-black">
                      <Star className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">{tier.name}</h3>
                  <p className="text-zinc-400 text-sm mb-4">{tier.description}</p>
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-white">
                      ${billingPeriod === "yearly" ? tier.yearlyPrice : tier.price}
                    </span>
                    <span className="text-zinc-400">
                      /{billingPeriod === "yearly" ? "year" : "month"}
                    </span>
                  </div>
                  <div className="text-sm text-zinc-500">
                    AED {billingPeriod === "yearly" ? tier.yearlyPriceAed : tier.priceAed}
                    /{billingPeriod === "yearly" ? "year" : "month"}
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm">
                      {feature.included ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-zinc-700 mt-0.5 flex-shrink-0" />
                      )}
                      <span className={feature.included ? "text-zinc-300" : "text-zinc-600"}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSelectTier(tier.id)}
                  className={`w-full ${
                    tier.popular
                      ? "bg-gradient-to-r from-gold to-gold-dark text-black hover:brightness-110"
                      : "bg-zinc-800 text-white hover:bg-zinc-700"
                  }`}
                >
                  Start {tier.trialDays}-Day Free Trial
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                <p className="text-xs text-zinc-500 text-center mt-3">
                  Cancel anytime during trial
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-b from-zinc-900/50 to-transparent">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center bg-gradient-to-br from-gold/10 via-gold/5 to-transparent border border-gold/30 rounded-2xl p-8 md:p-12"
          >
            <Shield className="w-12 h-12 text-gold mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Questions? Need a Custom Plan?
            </h2>
            <p className="text-zinc-400 mb-6">
              Contact us for enterprise solutions, team plans, or any questions about the Broker Toolkit.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://wa.me/971565911000?text=Hi%2C%20I%27m%20interested%20in%20the%20Broker%20Toolkit"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gold hover:text-gold-light transition-colors"
              >
                <Phone className="w-5 h-5" />
                +971 56 591 1000
              </a>
              <span className="text-zinc-600 hidden sm:block">|</span>
              <a
                href="mailto:invest@JJGlobalCapital.com"
                className="flex items-center gap-2 text-gold hover:text-gold-light transition-colors"
              >
                <Mail className="w-5 h-5" />
                invest@JJGlobalCapital.com
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />

      {selectedTierData && (
        <BrokerPaymentModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          tier={selectedTierData}
          billingPeriod={billingPeriod}
          onSuccess={() => {
            setPaymentModalOpen(false);
            navigate("/broker-toolkit/dashboard");
          }}
        />
      )}
    </div>
  );
}
