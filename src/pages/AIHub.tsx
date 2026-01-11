import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";
import AIAccessGate from "@/components/AIAccessGate";
import FreeAccessBadge from "@/components/FreeAccessBadge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { 
  ArrowUpRight, 
  Sparkles, 
  Calculator, 
  FileText, 
  Layers, 
  BarChart3, 
  Calendar,
  Wallet,
  ShoppingBag,
  Ruler,
  Palette,
  Brain,
  Zap,
  Shield,
  Clock,
  PenTool,
  Users,
  Table2,
  Video,
  CreditCard,
  Camera,
  Film,
  Megaphone,
  GraduationCap,
  Briefcase,
  UserCheck,
  MessageSquare,
  Bot,
  Star,
  Crown,
  CheckCircle2,
  Gift,
  Home,
  Search,
  Building2,
  Headphones,
  Image,
  Share2,
  Globe,
  Award
} from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

// All AI Tools & Services
const allTools = [
  // Featured Tools
  {
    id: "ai-home-finder",
    title: "JBJ AI Home Finder",
    description: "Instantly match buyers to listings with AI-powered location, budget, and preference filters.",
    icon: Home,
    gradient: "from-emerald-500 to-green-600",
    borderColor: "border-emerald-500/40",
    textColor: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    glowColor: "rgba(16, 185, 129, 0.3)",
    link: "/quiz",
    tag: "FREE",
    audience: ["Buyers"]
  },
  {
    id: "business-card-scanner",
    title: "JBJ Business Card Scanner",
    description: "Scan and save business cards automatically into your CRM and contact lists.",
    icon: CreditCard,
    gradient: "from-zinc-400 to-zinc-500",
    borderColor: "border-zinc-400/40",
    textColor: "text-zinc-300",
    bgColor: "bg-zinc-500/10",
    glowColor: "rgba(161, 161, 170, 0.3)",
    link: "/business-card-scanner",
    tag: "FREE",
    audience: ["Brokers"]
  },
  {
    id: "property-evaluator",
    title: "JBJ Property Evaluator",
    description: "Get AI-driven valuation for any property based on live market data.",
    icon: Calculator,
    gradient: "from-blue-500 to-cyan-500",
    borderColor: "border-blue-500/40",
    textColor: "text-blue-400",
    bgColor: "bg-blue-500/10",
    glowColor: "rgba(59, 130, 246, 0.3)",
    link: "/property-evaluator",
    tag: "FREE",
    audience: ["Sellers", "Investors"]
  },
  {
    id: "property-comparison",
    title: "JBJ Property Comparison",
    description: "Compare multiple properties and evaluate key investment metrics side-by-side.",
    icon: BarChart3,
    gradient: "from-purple-500 to-violet-500",
    borderColor: "border-purple-500/40",
    textColor: "text-purple-400",
    bgColor: "bg-purple-500/10",
    glowColor: "rgba(168, 85, 247, 0.3)",
    link: "/compare",
    tag: "FREE",
    audience: ["Buyers", "Brokers"]
  },
  {
    id: "personal-assistant",
    title: "JBJ Personal Assistant",
    description: "Get daily task assistance, reminders, scheduling, and smart alerts tailored for brokers and property managers.",
    icon: Bot,
    gradient: "from-gold to-amber-500",
    borderColor: "border-gold/40",
    textColor: "text-gold",
    bgColor: "bg-gold/10",
    glowColor: "rgba(203, 166, 75, 0.3)",
    link: "/executive-assistant",
    tag: "FREE",
    audience: ["Brokers", "Buyers"]
  },
  {
    id: "graphic-designer",
    title: "JBJ Graphic Designer",
    description: "Create property brochures, ads, and marketing materials using AI-enhanced templates.",
    icon: Palette,
    gradient: "from-purple-500 to-pink-500",
    borderColor: "border-purple-500/40",
    textColor: "text-purple-400",
    bgColor: "bg-purple-500/10",
    glowColor: "rgba(168, 85, 247, 0.3)",
    link: "/design-studio",
    tag: "FREE",
    audience: ["Brokers", "Sellers"]
  },
  {
    id: "videographer",
    title: "JBJ Videographer",
    description: "Generate HD property walkthroughs, marketing videos, and social clips using AI.",
    icon: Film,
    gradient: "from-red-500 to-rose-600",
    borderColor: "border-red-500/40",
    textColor: "text-red-400",
    bgColor: "bg-red-500/10",
    glowColor: "rgba(239, 68, 68, 0.3)",
    link: "/video-builder",
    tag: "FREE",
    audience: ["Brokers", "Developers"]
  },
  {
    id: "photographer",
    title: "JBJ Photographer",
    description: "Auto-enhance and edit listing photos using professional-grade AI filters.",
    icon: Camera,
    gradient: "from-blue-500 to-cyan-600",
    borderColor: "border-blue-500/40",
    textColor: "text-blue-400",
    bgColor: "bg-blue-500/10",
    glowColor: "rgba(59, 130, 246, 0.3)",
    link: "/interior-design-ai",
    tag: "FREE",
    audience: ["Sellers", "Agents"]
  },
  {
    id: "digital-marketing",
    title: "JBJ Digital Marketing Manager",
    description: "Automate property ads, social media campaigns, and performance analytics.",
    icon: Megaphone,
    gradient: "from-emerald-500 to-green-600",
    borderColor: "border-emerald-500/40",
    textColor: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    glowColor: "rgba(16, 185, 129, 0.3)",
    link: "/jbj-hub",
    tag: "FREE",
    audience: ["Brokers", "Agents"]
  },
  {
    id: "social-workshop",
    title: "JBJ Social Media Workshop",
    description: "Access tutorials and live training to grow your brand and attract clients.",
    icon: Share2,
    gradient: "from-pink-500 to-rose-500",
    borderColor: "border-pink-500/40",
    textColor: "text-pink-400",
    bgColor: "bg-pink-500/10",
    glowColor: "rgba(236, 72, 153, 0.3)",
    link: "/broker-toolkit",
    tag: "FREE",
    audience: ["Brokers", "Freelancers"]
  },
  {
    id: "academy",
    title: "JBJ Academy",
    description: "Learn from video tutorials and obtain broker certifications directly through JBJ.",
    icon: GraduationCap,
    gradient: "from-gold to-amber-600",
    borderColor: "border-gold/40",
    textColor: "text-gold",
    bgColor: "bg-gold/10",
    glowColor: "rgba(203, 166, 75, 0.3)",
    link: "/broker-toolkit",
    tag: "FREE",
    audience: ["Everyone"]
  },
  {
    id: "employment-hub",
    title: "JBJ Employment Hub",
    description: "Hire or get hired in real estate — manage recruitment, applications, and career development.",
    icon: Briefcase,
    gradient: "from-cyan-500 to-teal-600",
    borderColor: "border-cyan-500/40",
    textColor: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    glowColor: "rgba(6, 182, 212, 0.3)",
    link: "/crm",
    tag: "FREE",
    audience: ["HR", "Admins"]
  },
  {
    id: "hr-manager",
    title: "JBJ HR",
    description: "Manage your team's profiles, issue tasks, and track performance metrics.",
    icon: Users,
    gradient: "from-white to-zinc-300",
    borderColor: "border-white/40",
    textColor: "text-white",
    bgColor: "bg-white/10",
    glowColor: "rgba(255, 255, 255, 0.2)",
    link: "/hr-agent",
    tag: "FREE",
    audience: ["Employers", "Team Leads"]
  },
  {
    id: "property-coach",
    title: "JBJ Property Coach",
    description: "Get direct coaching from experts on negotiation, client management, and property analysis.",
    icon: UserCheck,
    gradient: "from-amber-500 to-orange-600",
    borderColor: "border-amber-500/40",
    textColor: "text-amber-400",
    bgColor: "bg-amber-500/10",
    glowColor: "rgba(245, 158, 11, 0.3)",
    link: "/broker-toolkit",
    tag: "FREE",
    audience: ["Brokers", "Buyers"]
  },
  {
    id: "admin-center",
    title: "JBJ Admin",
    description: "Your 24/7 assistant to handle data organization, reports, and property insights.",
    icon: Bot,
    gradient: "from-gold to-amber-500",
    borderColor: "border-gold/40",
    textColor: "text-gold",
    bgColor: "bg-gold/10",
    glowColor: "rgba(203, 166, 75, 0.3)",
    link: "/executive-assistant",
    tag: "FREE",
    audience: ["All Users"]
  },
  {
    id: "video-meeting",
    title: "JBJ Video Meet",
    description: "Free unlimited video meetings with screen sharing, recording, and real-time collaboration.",
    icon: Video,
    gradient: "from-red-500 to-rose-500",
    borderColor: "border-red-500/40",
    textColor: "text-red-400",
    bgColor: "bg-red-500/10",
    glowColor: "rgba(239, 68, 68, 0.3)",
    link: "/video-meeting",
    tag: "FREE",
    audience: ["Brokers", "Buyers"]
  },
  {
    id: "documents",
    title: "JBJ Documents",
    description: "A Google Docs-style document editor with rich text formatting and export options.",
    icon: FileText,
    gradient: "from-blue-500 to-indigo-500",
    borderColor: "border-blue-500/40",
    textColor: "text-blue-400",
    bgColor: "bg-blue-500/10",
    glowColor: "rgba(59, 130, 246, 0.3)",
    link: "/documents",
    tag: "FREE",
    audience: ["Brokers"]
  },
  {
    id: "spreadsheet",
    title: "JBJ Spreadsheet",
    description: "A powerful Excel-like spreadsheet tool with formulas, formatting, and import/export.",
    icon: Table2,
    gradient: "from-green-500 to-teal-500",
    borderColor: "border-green-500/40",
    textColor: "text-green-400",
    bgColor: "bg-green-500/10",
    glowColor: "rgba(34, 197, 94, 0.3)",
    link: "/spreadsheet",
    tag: "FREE",
    audience: ["Brokers"]
  },
  {
    id: "calendar",
    title: "JBJ Calendar & Notes",
    description: "Manage your meetings, events and notes with smart scheduling and reminders.",
    icon: Calendar,
    gradient: "from-indigo-500 to-blue-500",
    borderColor: "border-indigo-500/40",
    textColor: "text-indigo-400",
    bgColor: "bg-indigo-500/10",
    glowColor: "rgba(99, 102, 241, 0.3)",
    link: "/ai-calendar",
    tag: "FREE",
    audience: ["Brokers"]
  },
  {
    id: "interior-design",
    title: "JBJ AI Interior Design",
    description: "Visualize your dream space with AI-generated interior designs in luxury styles.",
    icon: Image,
    gradient: "from-fuchsia-500 to-pink-500",
    borderColor: "border-fuchsia-500/40",
    textColor: "text-fuchsia-400",
    bgColor: "bg-fuchsia-500/10",
    glowColor: "rgba(217, 70, 239, 0.3)",
    link: "/interior-design-ai",
    tag: "FREE",
    audience: ["Buyers", "Brokers"]
  },
  {
    id: "mortgage-calculator",
    title: "JBJ Mortgage Calculator",
    description: "Estimate monthly payments and explore financing options with licensed partners.",
    icon: Calculator,
    gradient: "from-emerald-500 to-green-500",
    borderColor: "border-emerald-500/40",
    textColor: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    glowColor: "rgba(16, 185, 129, 0.3)",
    link: "/mortgage-calculator",
    tag: "FREE",
    audience: ["Buyers"]
  },
  {
    id: "rental-index",
    title: "JBJ Rental Index Evaluator",
    description: "Get AI-powered rental estimates for any Dubai property with market trends.",
    icon: Layers,
    gradient: "from-emerald-500 to-green-500",
    borderColor: "border-emerald-500/40",
    textColor: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    glowColor: "rgba(16, 185, 129, 0.3)",
    link: "/rental-index",
    tag: "FREE",
    audience: ["Landlords", "Brokers"]
  },
  {
    id: "referral-program",
    title: "JBJ Referral Program",
    description: "Join our referral network and earn 5% commission on successful deals.",
    icon: Award,
    gradient: "from-lime-500 to-green-500",
    borderColor: "border-lime-500/40",
    textColor: "text-lime-400",
    bgColor: "bg-lime-500/10",
    glowColor: "rgba(132, 204, 22, 0.3)",
    link: "/referral-onboarding",
    tag: "FREE",
    audience: ["Partners", "Brokers"]
  },
  {
    id: "personal-shopper",
    title: "JBJ AI Personal Shopper",
    description: "Our AI personal shopper curates perfect property selections tailored just for you.",
    icon: ShoppingBag,
    gradient: "from-rose-500 to-red-500",
    borderColor: "border-rose-500/40",
    textColor: "text-rose-400",
    bgColor: "bg-rose-500/10",
    glowColor: "rgba(244, 63, 94, 0.3)",
    link: "/ai-personal-shopper",
    tag: "FREE",
    audience: ["Buyers"]
  },
];

const circleFeatures = [
  "20+ property tools & assistants",
  "Dedicated HR and personal assistants",
  "Property coach, designer, photographer, and marketing tools",
  "Free courses and certifications",
  "24/7 Admin support",
  "Full CRM access"
];

const benefits = [
  {
    icon: Brain,
    title: "Intelligent Analysis",
    description: "AI processes thousands of data points for accurate recommendations."
  },
  {
    icon: Zap,
    title: "Instant Results",
    description: "Get real-time insights without waiting."
  },
  {
    icon: Shield,
    title: "Data Security",
    description: "Industry-standard encryption and protection."
  },
  {
    icon: Clock,
    title: "Save Time",
    description: "Automate tedious tasks and focus on results."
  }
];

const AIHub = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <AIAccessGate toolName="JBJ Hub">
      <section className="relative w-full min-h-screen bg-[#0D0D0D]">
        {/* Hero Section */}
        <div className="relative py-20 md:py-28 overflow-hidden">
          {/* Animated gradient orbs */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gold/15 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px]" />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="text-center max-w-4xl mx-auto"
            >
              <motion.div variants={fadeInUp} className="flex flex-col items-center gap-4 mb-8">
                <FreeAccessBadge />
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/30 rounded-full text-gold text-sm font-medium">
                  <Sparkles className="w-4 h-4" />
                  All-in-One Platform
                </span>
              </motion.div>

              <motion.h1 
                className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
                variants={fadeInUp}
                style={{ 
                  fontFamily: "Poppins, sans-serif",
                  background: "linear-gradient(135deg, #CBA64B 0%, #E8D5A3 50%, #CBA64B 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  textShadow: "0 0 60px rgba(203, 166, 75, 0.4)"
                }}
              >
                JBJ Hub
              </motion.h1>

              <motion.p 
                className="text-white text-lg md:text-xl max-w-2xl mx-auto mb-4 leading-relaxed"
                variants={fadeInUp}
              >
                Get free access to all JBJ AI tools, assistants, HR admin, property coach, and creative suite — all in one place.
              </motion.p>

              {/* Gold divider */}
              <motion.div 
                variants={fadeInUp}
                className="w-24 h-1 bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mb-8"
              />

              {/* AI Disclaimer */}
              <motion.div
                variants={fadeInUp}
                className="max-w-2xl mx-auto mb-10 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl"
              >
                <p className="text-amber-200 text-sm text-center">
                  <strong>Disclaimer:</strong> AI outputs are informational estimates only and not legal, mortgage, financial, or investment advice.
                </p>
              </motion.div>

              <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4">
                <Link to="/quiz">
                  <Button 
                    className="bg-gradient-to-r from-gold via-gold-dark to-gold text-black font-bold px-8 py-6 text-base shadow-xl hover:brightness-110 transition-all"
                    style={{ boxShadow: "0 0 30px rgba(203, 166, 75, 0.4)" }}
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Start JBJ AI Home Finder
                    <ArrowUpRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/properties">
                  <Button 
                    variant="outline"
                    className="border-2 border-gold/50 text-gold hover:bg-gold/10 hover:border-gold px-8 py-6 text-base"
                  >
                    Browse Properties
                  </Button>
                </Link>
              </motion.div>

              <motion.p 
                className="text-zinc-500 text-sm mt-8"
                variants={fadeInUp}
              >
                Developed by Founder Jane Abou Jaoude • Powered by JBJ Global Real Estate
              </motion.p>
            </motion.div>
          </div>
        </div>

        {/* Gold Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

        {/* Join JBJ Circle Section */}
        <section className="py-20 bg-[#0D0D0D] relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              className="max-w-4xl mx-auto text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <motion.h2 
                className="text-3xl md:text-5xl font-bold mb-6"
                style={{ 
                  fontFamily: "Poppins, sans-serif",
                  background: "linear-gradient(135deg, #CBA64B 0%, #E8D5A3 50%, #CBA64B 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  textShadow: "0 0 40px rgba(203, 166, 75, 0.3)"
                }}
              >
                Join JBJ Global Real Estate Circle
              </motion.h2>

              <p className="text-white text-lg md:text-xl mb-4 leading-relaxed">
                Get free access to all JBJ AI tools, assistants, HR admin, property coach, and creative suite — all in one place.
              </p>

              {/* Gold divider */}
              <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mb-8" />

              {/* Features list */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto mb-10">
                {circleFeatures.map((feature, idx) => (
                  <motion.div
                    key={idx}
                    className="flex items-center gap-3 p-4 rounded-xl border border-gold/30 bg-gold/5"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    style={{ boxShadow: "0 0 20px rgba(203, 166, 75, 0.1)" }}
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <span className="text-white text-left text-sm">{feature}</span>
                  </motion.div>
                ))}
              </div>

              {/* CTA Section */}
              {user ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <p className="text-gold text-lg font-medium">
                    Welcome back! Your premium access is now active.
                  </p>
                  <Button 
                    onClick={() => navigate("/jbj-hub")}
                    className="bg-gradient-to-r from-gold via-gold-dark to-gold text-black font-bold px-10 py-6 text-base shadow-xl shadow-gold/30 hover:brightness-110 transition-all"
                    style={{ boxShadow: "0 0 30px rgba(203, 166, 75, 0.4)" }}
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Access All Tools
                    <ArrowUpRight className="w-5 h-5 ml-2" />
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button 
                      onClick={() => navigate("/auth?redirect=/ai-hub")}
                      className="bg-gradient-to-r from-gold via-gold-dark to-gold text-black font-bold px-12 py-7 text-lg shadow-xl hover:brightness-110 transition-all animate-gold-glow"
                      style={{
                        boxShadow: "0 0 40px rgba(203, 166, 75, 0.5)",
                        border: "2px solid rgba(203, 166, 75, 0.6)"
                      }}
                    >
                      <Gift className="w-6 h-6 mr-2" />
                      Sign In / Create Account
                      <ArrowUpRight className="w-6 h-6 ml-2" />
                    </Button>
                  </motion.div>

                  <p className="text-gold/80 text-sm font-medium">
                    100% Free — No Credit Card Required
                  </p>
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Gold Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

        {/* Benefits Section */}
        <section className="py-16 bg-[#0A0A0A]">
          <div className="container mx-auto px-4">
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              {benefits.map((benefit, idx) => (
                <motion.div
                  key={idx}
                  className="text-center p-6"
                  variants={fadeInUp}
                >
                  <div className="w-14 h-14 rounded-2xl bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-4"
                    style={{ boxShadow: "0 0 20px rgba(203, 166, 75, 0.2)" }}
                  >
                    <benefit.icon className="w-7 h-7 text-gold" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{benefit.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Gold Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

        {/* ALL TOOLS SECTION */}
        <section className="py-20 bg-[#0D0D0D]">
          <div className="container mx-auto px-4">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/30 rounded-full text-gold text-xs uppercase tracking-wider mb-4">
                <Crown className="w-3 h-3" />
                All Tools & Services
              </span>
              <h2 
                className="text-3xl md:text-5xl font-bold mb-6"
                style={{ 
                  fontFamily: "Poppins, sans-serif",
                  background: "linear-gradient(135deg, #CBA64B 0%, #E8D5A3 50%, #CBA64B 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent"
                }}
              >
                JBJ AI Tools & Assistants
              </h2>
              <p className="text-zinc-400 max-w-2xl mx-auto">
                Access dedicated professionals and AI assistants for every aspect of your real estate journey.
              </p>
              
              {/* Gold divider */}
              <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mt-6" />
            </motion.div>

            <motion.div 
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              {allTools.map((tool) => (
                <motion.div key={tool.id} variants={fadeInUp}>
                  <Link to={tool.link} className="block group h-full">
                    <div 
                      className="relative overflow-hidden rounded-2xl bg-zinc-900/80 border p-6 h-full transition-all duration-300 hover:scale-[1.02]"
                      style={{
                        borderColor: tool.glowColor,
                        boxShadow: `0 0 25px ${tool.glowColor}`
                      }}
                    >
                      {/* Glow effect on hover */}
                      <div 
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{ background: `radial-gradient(circle at center, ${tool.glowColor} 0%, transparent 70%)` }}
                      />
                      
                      <div className="relative z-10">
                        {/* Header */}
                        <div className="flex items-start gap-4 mb-4">
                          <div 
                            className={`w-14 h-14 rounded-xl ${tool.bgColor} border ${tool.borderColor} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}
                            style={{ boxShadow: `0 0 15px ${tool.glowColor}` }}
                          >
                            <tool.icon className={`w-7 h-7 ${tool.textColor}`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-white text-lg font-bold mb-1" style={{ fontFamily: "Poppins, sans-serif" }}>
                              {tool.title}
                            </h3>
                            <div className="inline-flex items-center gap-1 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                              {tool.tag}
                            </div>
                          </div>
                          <ArrowUpRight className={`w-5 h-5 ${tool.textColor} opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all`} />
                        </div>

                        {/* Description */}
                        <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                          {tool.description}
                        </p>

                        {/* Audience Tags */}
                        <div className="flex flex-wrap gap-2">
                          {tool.audience.map((aud, idx) => (
                            <span 
                              key={idx} 
                              className={`px-2 py-1 ${tool.bgColor} border ${tool.borderColor} rounded-full ${tool.textColor} text-xs`}
                            >
                              {aud}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Gold Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

        {/* Bottom CTA Section */}
        <section className="py-20 bg-[#0D0D0D]">
          <div className="container mx-auto px-4">
            <motion.div
              className="max-w-3xl mx-auto text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 
                className="text-3xl md:text-4xl font-bold mb-6"
                style={{ 
                  fontFamily: "Poppins, sans-serif",
                  background: "linear-gradient(135deg, #CBA64B 0%, #E8D5A3 50%, #CBA64B 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent"
                }}
              >
                Ready to Get Started?
              </h2>
              <p className="text-zinc-400 text-lg mb-8">
                Join thousands of real estate professionals using JBJ AI tools.
              </p>
              
              {user ? (
                <Button 
                  onClick={() => navigate("/jbj-hub")}
                  className="bg-gradient-to-r from-gold via-gold-dark to-gold text-black font-bold px-10 py-6 text-base shadow-xl hover:brightness-110 transition-all"
                  style={{ boxShadow: "0 0 30px rgba(203, 166, 75, 0.4)" }}
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Access All Tools
                  <ArrowUpRight className="w-5 h-5 ml-2" />
                </Button>
              ) : (
                <Button 
                  onClick={() => navigate("/auth?redirect=/ai-hub")}
                  className="bg-gradient-to-r from-gold via-gold-dark to-gold text-black font-bold px-12 py-7 text-lg shadow-xl hover:brightness-110 transition-all animate-gold-glow"
                  style={{
                    boxShadow: "0 0 40px rgba(203, 166, 75, 0.5)",
                    border: "2px solid rgba(203, 166, 75, 0.6)"
                  }}
                >
                  <Gift className="w-6 h-6 mr-2" />
                  Sign In / Create Account
                  <ArrowUpRight className="w-6 h-6 ml-2" />
                </Button>
              )}
            </motion.div>
          </div>
        </section>

        <Footer />
      </section>
    </AIAccessGate>
  );
};

export default AIHub;
