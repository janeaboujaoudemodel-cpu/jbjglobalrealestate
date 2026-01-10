import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";
import AIAccessGate from "@/components/AIAccessGate";
import FreeAccessBadge from "@/components/FreeAccessBadge";
import { Button } from "@/components/ui/button";
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
  CreditCard
} from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

// Free AI Tools - Available to all users
const freeTools = [
  {
    id: "ai-home-finder",
    title: "JBJ AI Home Finder",
    description: "Answer a few questions about your preferences and let our AI match you with the perfect properties based on budget, location, lifestyle, and property goals.",
    icon: Sparkles,
    gradient: "from-purple-500 to-fuchsia-500",
    borderColor: "border-purple-500/30",
    textColor: "text-purple-400",
    bgColor: "bg-purple-500/10",
    link: "/quiz",
    features: ["Personalized Matching", "Budget Analysis", "Lifestyle Fit", "Property Scoring"],
    featured: true,
    audience: ["Buyers", "Visitors", "Brokers"]
  },
  {
    id: "property-comparison",
    title: "JBJ AI Property Comparison",
    description: "Compare 2-5 properties side by side with AI-powered analysis. Get detailed insights on value, location, developer reputation, and potential.",
    icon: BarChart3,
    gradient: "from-violet-500 to-purple-500",
    borderColor: "border-violet-500/30",
    textColor: "text-violet-400",
    bgColor: "bg-violet-500/10",
    link: "/compare",
    features: ["Side-by-Side View", "AI Scoring", "Potential Analysis", "Recommendations"],
    audience: ["Buyers", "Brokers"]
  },
  {
    id: "property-evaluator",
    title: "JBJ Property Evaluator",
    description: "Get an AI-powered valuation for any property based on market data and comparable sales. Understand fair market value and appreciation.",
    icon: Calculator,
    gradient: "from-blue-500 to-cyan-500",
    borderColor: "border-blue-500/30",
    textColor: "text-blue-400",
    bgColor: "bg-blue-500/10",
    link: "/property-evaluator",
    features: ["Instant Valuation", "Market Comparables", "Price Trends"],
    audience: ["Buyers", "Sellers", "Brokers"]
  },
  {
    id: "mortgage-calculator",
    title: "JBJ Mortgage Calculator",
    description: "Estimate your monthly payments and explore financing options. Get connected with licensed mortgage partners for professional guidance.",
    icon: Calculator,
    gradient: "from-emerald-500 to-green-500",
    borderColor: "border-emerald-500/30",
    textColor: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    link: "/mortgage-calculator",
    features: ["Payment Estimates", "Rate Comparison", "Partner Intros"],
    audience: ["Buyers", "Visitors"]
  },
  {
    id: "document-scanner",
    title: "JBJ Scan & Sign Documents",
    description: "Scan, crop, design signatures, and digitally sign real estate contracts. Add auto-fill fields, export as PDF, and streamline your paperwork.",
    icon: FileText,
    gradient: "from-green-500 to-emerald-500",
    borderColor: "border-green-500/30",
    textColor: "text-green-400",
    bgColor: "bg-green-500/10",
    link: "/document-scanner",
    features: ["Smart Scanning", "Signature Design", "e-Signature", "PDF Export"],
    audience: ["Buyers", "Sellers", "Brokers"]
  },
  {
    id: "spreadsheet",
    title: "JBJ Spreadsheet",
    description: "A powerful Excel-like spreadsheet tool with formulas, formatting, import/export CSV, and real-time calculations for property analysis.",
    icon: Table2,
    gradient: "from-green-500 to-teal-500",
    borderColor: "border-green-500/30",
    textColor: "text-green-400",
    bgColor: "bg-green-500/10",
    link: "/spreadsheet",
    features: ["Formulas", "CSV Import/Export", "Formatting"],
    audience: ["Brokers", "Visitors"]
  },
  {
    id: "documents",
    title: "JBJ Documents",
    description: "A Google Docs-style document editor with rich text formatting, headings, lists, links, and export options for professional documents.",
    icon: FileText,
    gradient: "from-blue-500 to-indigo-500",
    borderColor: "border-blue-500/30",
    textColor: "text-blue-400",
    bgColor: "bg-blue-500/10",
    link: "/documents",
    features: ["Rich Text", "Formatting", "Export HTML/TXT"],
    audience: ["Brokers", "Visitors"]
  },
  {
    id: "video-meeting",
    title: "JBJ Video Meet",
    description: "Free unlimited video meetings with screen sharing, recording, and real-time collaboration. Perfect for property consultations and client meetings.",
    icon: Video,
    gradient: "from-red-500 to-rose-500",
    borderColor: "border-red-500/30",
    textColor: "text-red-400",
    bgColor: "bg-red-500/10",
    link: "/video-meeting",
    features: ["Unlimited Time", "Screen Share", "Recording"],
    audience: ["Brokers", "Buyers", "Visitors"]
  },
  {
    id: "business-card-scanner",
    title: "JBJ AI Business Card Scanner",
    description: "Scan multiple business cards with AI-powered OCR. Extract contacts instantly and import directly to your CRM. End-to-end encrypted for privacy.",
    icon: CreditCard,
    gradient: "from-gold to-amber-500",
    borderColor: "border-gold/30",
    textColor: "text-gold",
    bgColor: "bg-gold/10",
    link: "/business-card-scanner",
    features: ["Multi-Card Scan", "AI OCR", "CRM Import", "Encrypted"],
    featured: true,
    audience: ["Brokers", "Visitors"]
  },
];

// Advanced Broker Tools - Premium features for registered brokers
const advancedTools = [
  {
    id: "ai-interior-design",
    title: "JBJ AI Interior Design Studio",
    description: "Visualize your dream space with AI-generated interior designs. Upload a room photo and see it transformed in different luxury styles.",
    icon: Palette,
    gradient: "from-fuchsia-500 to-pink-500",
    borderColor: "border-fuchsia-500/30",
    textColor: "text-fuchsia-400",
    bgColor: "bg-fuchsia-500/10",
    link: "/interior-design-ai",
    features: ["Style Visualization", "AI Rendering", "Before/After", "Multiple Styles"],
    audience: ["Brokers", "Buyers"]
  },
  {
    id: "ai-budget-planner",
    title: "JBJ AI Budget Planner",
    description: "Budget analysis and property affordability insights (property-only). Informational only—not financial or mortgage advice.",
    icon: Wallet,
    gradient: "from-amber-500 to-orange-500",
    borderColor: "border-amber-500/30",
    textColor: "text-amber-400",
    bgColor: "bg-amber-500/10",
    link: "/ai-budget-planner",
    features: ["Budget Analysis", "Affordability Insights", "Property Matching"],
    audience: ["Buyers"]
  },
  {
    id: "ai-personal-shopper",
    title: "JBJ AI Personal Shopper",
    description: "Tell us your lifestyle, preferences and property goals. Our AI personal shopper curates perfect property selections tailored just for you.",
    icon: ShoppingBag,
    gradient: "from-rose-500 to-red-500",
    borderColor: "border-rose-500/30",
    textColor: "text-rose-400",
    bgColor: "bg-rose-500/10",
    link: "/ai-personal-shopper",
    features: ["Lifestyle Matching", "Curated Selections", "AI Recommendations"],
    audience: ["Buyers"]
  },
  {
    id: "ai-calendar",
    title: "JBJ AI Calendar & Notes",
    description: "Manage your meetings, events and notes with AI-powered scheduling. Get email and phone reminders for important consultation meetings.",
    icon: Calendar,
    gradient: "from-indigo-500 to-blue-500",
    borderColor: "border-indigo-500/30",
    textColor: "text-indigo-400",
    bgColor: "bg-indigo-500/10",
    link: "/ai-calendar",
    features: ["Event Scheduling", "Meeting Reminders", "AI Notes"],
    audience: ["Brokers"]
  },
  {
    id: "rental-index",
    title: "JBJ Rental Index Evaluator",
    description: "Get AI-powered rental estimates for any Dubai property. Understand market rates, trends, and demand levels.",
    icon: Layers,
    gradient: "from-emerald-500 to-green-500",
    borderColor: "border-emerald-500/30",
    textColor: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    link: "/rental-index",
    features: ["Rent Estimates", "Market Trends", "Area Comparison"],
    audience: ["Brokers", "Landlords"]
  },
  {
    id: "property-measurement",
    title: "JBJ Property Measurement",
    description: "Calculate property dimensions, areas and layouts with precision. Get accurate measurements for floor plans and space planning.",
    icon: Ruler,
    gradient: "from-teal-500 to-cyan-500",
    borderColor: "border-teal-500/30",
    textColor: "text-teal-400",
    bgColor: "bg-teal-500/10",
    link: "/property-measurement",
    features: ["Area Calculator", "Room Dimensions", "Floor Plans"],
    audience: ["Brokers"]
  },
  {
    id: "referral-program",
    title: "JBJ Referral Program",
    description: "Join our referral network and earn 5% commission on successful deals. Upload documents, sign contracts, and track your referral earnings.",
    icon: Users,
    gradient: "from-lime-500 to-green-500",
    borderColor: "border-lime-500/30",
    textColor: "text-lime-400",
    bgColor: "bg-lime-500/10",
    link: "/referral-onboarding",
    features: ["5% Commission", "Easy Onboarding", "Track Earnings"],
    audience: ["Brokers", "Partners"]
  },
];

const benefits = [
  {
    icon: Brain,
    title: "Intelligent Analysis",
    description: "Our AI processes thousands of data points to provide accurate, personalized recommendations."
  },
  {
    icon: Zap,
    title: "Instant Results",
    description: "Get real-time insights and analysis without waiting. Make faster, smarter real estate decisions."
  },
  {
    icon: Shield,
    title: "Data Security",
    description: "Your information is encrypted and protected with industry-standard security measures."
  },
  {
    icon: Clock,
    title: "Save Time",
    description: "Automate tedious research tasks and focus on what matters—finding your perfect property."
  }
];

const AIHub = () => {
  return (
    <AIAccessGate toolName="JBJ Hub">
    <section className="relative w-full min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative py-24 md:py-32 overflow-hidden ai-hero-bg">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-ai-purple/20 rounded-full blur-[100px] animate-pulse-glow"
          />
          <div 
            className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-ai-fuchsia/15 rounded-full blur-[80px] animate-pulse"
            style={{ animationDuration: '6s', animationDelay: '2s' }}
          />
          <div 
            className="absolute top-1/3 right-1/3 w-[300px] h-[300px] bg-ai-cyan/10 rounded-full blur-[60px] animate-float"
          />
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
              <span className="ai-tag inline-flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                All-in-One Platform
              </span>
            </motion.div>

            <motion.h1 
              className="text-white text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-8"
              variants={fadeInUp}
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              <span className="ai-gradient-text">
                JBJ Hub
              </span>
            </motion.h1>

            <motion.p 
              className="text-zinc-300 text-lg md:text-xl max-w-2xl mx-auto mb-6 leading-relaxed"
              variants={fadeInUp}
            >
              Your centralized dashboard for AI-powered real estate tools, business productivity, and professional communication.
            </motion.p>

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
                <Button className="ai-button-primary text-white px-8 py-6 text-base">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Start JBJ AI Home Finder
                  <ArrowUpRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/properties">
                <Button 
                  variant="outline"
                  className="border-ai-purple/50 text-ai-purple hover:bg-ai-purple/10 hover:border-ai-purple px-8 py-6 text-base"
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

      {/* Benefits Section */}
      <section className="py-16 bg-zinc-950/50">
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
                <div className="w-14 h-14 rounded-2xl bg-ai-purple/10 border border-ai-purple/20 flex items-center justify-center mx-auto mb-4 ai-icon-glow">
                  <benefit.icon className="w-7 h-7 text-ai-purple" />
                </div>
                <h3 className="text-white font-semibold mb-2">{benefit.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{benefit.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Tool - AI Home Finder */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <Link to="/quiz" className="block group">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900/50 via-fuchsia-900/50 to-purple-900/50 border border-purple-500/30 p-8 md:p-12 hover:border-purple-400/50 transition-all duration-500">
                {/* Animated glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-fuchsia-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-500 shadow-2xl shadow-purple-500/30">
                    <Sparkles className="w-12 h-12 md:w-16 md:h-16 text-white" />
                  </div>
                  
                  <div className="text-center md:text-left flex-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-xs uppercase tracking-wider mb-4">
                      <Sparkles className="w-3 h-3" />
                      Most Popular
                    </div>
                    <h2 className="text-white text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                      JBJ AI Home Finder
                    </h2>
                    <p className="text-zinc-300 text-lg mb-6 max-w-2xl">
                      Answer a few simple questions about your preferences, budget, and lifestyle. Our AI analyzes thousands of properties to find your perfect match in seconds.
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                      {["Personalized Matching", "Property Scoring", "Lifestyle Analysis", "Instant Results"].map((feature, idx) => (
                        <span key={idx} className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-sm">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <ArrowUpRight className="w-8 h-8 text-purple-400 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform flex-shrink-0" />
                </div>
              </div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Featured Tool - AI Business Card Scanner */}
      <section className="py-12 bg-black">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <Link to="/business-card-scanner" className="block group">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-900/50 via-gold/30 to-amber-900/50 border border-gold/30 p-8 md:p-12 hover:border-gold/50 transition-all duration-500">
                {/* Animated glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-gold/10 via-amber-500/10 to-gold/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-gradient-to-br from-gold to-amber-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-500 shadow-2xl shadow-gold/30">
                    <CreditCard className="w-12 h-12 md:w-16 md:h-16 text-black" />
                  </div>
                  
                  <div className="text-center md:text-left flex-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold/20 border border-gold/30 rounded-full text-gold text-xs uppercase tracking-wider mb-4">
                      <Shield className="w-3 h-3" />
                      Privacy First • AI Powered
                    </div>
                    <h2 className="text-white text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                      JBJ AI Business Card Scanner
                    </h2>
                    <p className="text-zinc-300 text-lg mb-6 max-w-2xl">
                      Scan multiple business cards at once with AI OCR. Extract name, email, phone, company, and more. Data is encrypted end-to-end and directly importable to your CRM.
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                      {["Multi-Card Scan", "AI OCR", "CRM Import", "End-to-End Encrypted"].map((feature, idx) => (
                        <span key={idx} className="px-4 py-2 bg-gold/10 border border-gold/20 rounded-full text-gold text-sm">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <ArrowUpRight className="w-8 h-8 text-gold group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform flex-shrink-0" />
                </div>
              </div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* FREE AI TOOLS SECTION */}
      <section className="py-20 bg-gradient-to-b from-black to-zinc-950">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-xs uppercase tracking-wider mb-4">
              <Sparkles className="w-3 h-3" />
              Free for Everyone
            </span>
            <h2 
              className="text-white text-3xl md:text-5xl font-bold mb-6"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              ✅ Free AI Tools
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Available to all visitors — buyers, sellers, and real estate professionals.
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {freeTools.filter(t => !t.featured).map((tool) => (
              <motion.div key={tool.id} variants={fadeInUp}>
                <Link to={tool.link} className="block group h-full">
                  <div className="ai-card p-6 h-full">
                    <div className="relative z-10">
                      {/* Header */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`w-14 h-14 rounded-xl ${tool.bgColor} border ${tool.borderColor} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                          <tool.icon className={`w-7 h-7 ${tool.textColor}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white text-lg font-bold mb-1" style={{ fontFamily: "Poppins, sans-serif" }}>
                            {tool.title}
                          </h3>
                          <div className="inline-flex items-center gap-1 text-emerald-400 text-xs font-medium uppercase tracking-wider">
                            <span className="w-2 h-2 bg-emerald-400 rounded-full" />
                            Free
                          </div>
                        </div>
                        <ArrowUpRight className={`w-5 h-5 ${tool.textColor} opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all`} />
                      </div>

                      {/* Description */}
                      <p className="text-zinc-400 text-sm mb-4 leading-relaxed line-clamp-2">
                        {tool.description}
                      </p>

                      {/* Audience Tags */}
                      <div className="flex flex-wrap gap-2">
                        {tool.audience.map((aud, idx) => (
                          <span key={idx} className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded-full text-zinc-400 text-xs">
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

      {/* ADVANCED BROKER TOOLS SECTION */}
      <section className="py-20 bg-gradient-to-b from-zinc-950 to-black">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/30 rounded-full text-gold text-xs uppercase tracking-wider mb-4">
              <Zap className="w-3 h-3" />
              Broker Circle Members
            </span>
            <h2 
              className="text-white text-3xl md:text-5xl font-bold mb-6"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              🔒 Advanced Broker Tools
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Premium features for registered JBJ Broker Circle members. Join free to unlock.
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {advancedTools.map((tool) => (
              <motion.div key={tool.id} variants={fadeInUp}>
                <Link to={tool.link} className="block group h-full">
                  <div className="ai-card p-6 h-full border-gold/20 hover:border-gold/40">
                    <div className="relative z-10">
                      {/* Header */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`w-14 h-14 rounded-xl ${tool.bgColor} border ${tool.borderColor} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                          <tool.icon className={`w-7 h-7 ${tool.textColor}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white text-lg font-bold mb-1" style={{ fontFamily: "Poppins, sans-serif" }}>
                            {tool.title}
                          </h3>
                          <div className="inline-flex items-center gap-1 text-gold text-xs font-medium uppercase tracking-wider">
                            <Zap className="w-3 h-3" />
                            Broker Circle
                          </div>
                        </div>
                        <ArrowUpRight className={`w-5 h-5 ${tool.textColor} opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all`} />
                      </div>

                      {/* Description */}
                      <p className="text-zinc-400 text-sm mb-4 leading-relaxed line-clamp-2">
                        {tool.description}
                      </p>

                      {/* Audience Tags */}
                      <div className="flex flex-wrap gap-2">
                        {tool.audience.map((aud, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gold/10 border border-gold/20 rounded-full text-gold/80 text-xs">
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

      {/* CTA Section */}
      <section className="py-24 bg-black relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-950/30 via-transparent to-fuchsia-950/30" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-gold to-gold-light flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-gold/30">
              <Sparkles className="w-10 h-10 text-black" />
            </div>
            <h2 
              className="text-white text-3xl md:text-5xl font-bold mb-6"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Ready to Start Your Property Search?
            </h2>
            <p className="text-zinc-400 text-lg mb-10">
              Use our AI-powered tools to make smarter, data-driven real estate decisions.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/quiz">
                <Button className="bg-gold hover:bg-gold-light text-black font-semibold px-10 py-6 text-base shadow-xl shadow-gold/30">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Get Started Free
                  <ArrowUpRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button 
                  variant="outline"
                  className="border-gold/50 text-gold hover:bg-gold/10 hover:border-gold px-10 py-6 text-base"
                >
                  Contact Our Team
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </section>
    </AIAccessGate>
  );
};

export default AIHub;