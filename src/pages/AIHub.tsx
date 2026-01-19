import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { SEOHead } from "@/components/SEOHead";
import { 
  ArrowUpRight, 
  Sparkles, 
  Calculator, 
  FileText, 
  Layers, 
  BarChart3, 
  Calendar,
  Palette,
  Brain,
  Zap,
  Shield,
  Clock,
  Users,
  Video,
  CreditCard,
  Camera,
  Film,
  Megaphone,
  GraduationCap,
  Briefcase,
  Award,
  User,
  Target,
  Headphones,
  LogIn,
  FolderOpen,
  Home,
  Image,
  Share2,
  CheckCircle2,
  Gift,
  Lock
} from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 }
  }
};

// INVESTOR HUB TOOLS - Available to all users with theme colors
const investorTools = [
  {
    id: "ai-home-finder",
    title: "JBJ AI Home Finder",
    description: "Match buyers to listings with AI-powered filters.",
    icon: Home,
    link: "/quiz",
    themeColor: "purple", // Purple theme
  },
  {
    id: "property-evaluator",
    title: "JBJ Property Evaluator",
    description: "AI-driven valuation based on live market data.",
    icon: Calculator,
    link: "/property-evaluator",
    themeColor: "blue", // Blue theme
  },
  {
    id: "property-comparison",
    title: "JBJ Property Comparison",
    description: "Compare properties side-by-side with AI insights.",
    icon: BarChart3,
    link: "/compare",
    themeColor: "cyan", // Cyan theme
  },
  {
    id: "mortgage-calculator",
    title: "JBJ Mortgage Calculator",
    description: "Estimate monthly payments and financing options.",
    icon: Calculator,
    link: "/mortgage-calculator",
    themeColor: "emerald", // Emerald theme
  },
  {
    id: "rental-index",
    title: "JBJ Rental Index Evaluator",
    description: "AI-powered rental estimates with market trends.",
    icon: Layers,
    link: "/rental-index",
    themeColor: "teal", // Teal theme
  },
  {
    id: "interior-design",
    title: "JBJ AI Interior Design",
    description: "Visualize spaces with AI-generated designs.",
    icon: Image,
    link: "/interior-design-ai",
    themeColor: "pink", // Pink theme
  },
  {
    id: "business-card-scanner",
    title: "JBJ Business Card Scanner",
    description: "Scan and save business cards into your CRM.",
    icon: CreditCard,
    link: "/business-card-scanner",
    themeColor: "amber", // Amber theme
  },
  {
    id: "property-coach",
    title: "JBJ Property Coach",
    description: "Scripts, objections, roleplay, deal strategy.",
    icon: Target,
    link: "/broker-toolkit",
    themeColor: "indigo", // Indigo theme
  },
];

// PRODUCTIVITY TOOLS - With theme colors
const productivityTools = [
  {
    id: "content-tools",
    title: "JBJ Documents & Spreadsheets",
    description: "Rich text editor and Excel-like tools.",
    icon: FileText,
    link: "/documents",
    themeColor: "blue",
  },
  {
    id: "video-meeting",
    title: "JBJ Video Meet",
    description: "Free unlimited video meetings with recording.",
    icon: Video,
    link: "/video-meeting",
    themeColor: "cyan",
  },
  {
    id: "calendar",
    title: "JBJ Calendar & Notes",
    description: "Smart scheduling and reminders.",
    icon: Calendar,
    link: "/ai-calendar",
    themeColor: "indigo",
  },
  {
    id: "scan-sign",
    title: "JBJ Scan & Sign",
    description: "Digital document signing and scanning.",
    icon: FileText,
    link: "/documents",
    themeColor: "emerald",
  },
];

// EDUCATION & CAREER - With theme colors (silver/slate metallic theme for this section)
const educationCareer = [
  {
    id: "academy",
    title: "JBJ Academy",
    description: "Video tutorials and broker certifications.",
    icon: GraduationCap,
    link: "/broker-toolkit",
    themeColor: "slate",
  },
  {
    id: "employment-hub",
    title: "JBJ Employment Hub",
    description: "Hire or get hired in Real Estate.",
    icon: Briefcase,
    link: "/join",
    themeColor: "slate",
  },
  {
    id: "referral-program",
    title: "JBJ Referral Program",
    description: "Earn 5% commission on successful referrals.",
    icon: Award,
    link: "/referral-onboarding",
    themeColor: "slate",
  },
];

// BROKER-ONLY TOOLS (shown as preview to encourage joining)
const brokerOnlyTools = [
  {
    id: "listing-admin",
    title: "Listing Admin (Sarah)",
    description: "Smart property listing, document parsing, auto-categorization.",
    icon: FolderOpen,
  },
  {
    id: "broker-admin-support",
    title: "Leila — Broker Admin",
    description: "RERA compliance and broker operational support.",
    icon: User,
  },
  {
    id: "hr-manager",
    title: "HR Manager (Jessica)",
    description: "Hiring pipeline, performance tracking, HR policies.",
    icon: Users,
  },
  {
    id: "graphic-designer",
    title: "JBJ Graphic Designer",
    description: "Create brochures, ads, and marketing materials.",
    icon: Palette,
  },
  {
    id: "videographer",
    title: "JBJ Videographer",
    description: "HD walkthroughs, marketing videos, social clips.",
    icon: Film,
  },
  {
    id: "photographer",
    title: "JBJ Photographer",
    description: "Auto-enhance listing photos with AI filters.",
    icon: Camera,
  },
  {
    id: "digital-marketing",
    title: "JBJ Digital Marketing",
    description: "Automate ads, campaigns, and analytics.",
    icon: Megaphone,
  },
  {
    id: "social-workshop",
    title: "JBJ Social Media Workshop",
    description: "Tutorials and training to grow your brand.",
    icon: Share2,
  },
];

const quickBenefits = [
  { icon: Brain, title: "Intelligent Analysis", desc: "AI processes thousands of data points." },
  { icon: Zap, title: "Instant Results", desc: "Get real-time insights instantly." },
  { icon: Shield, title: "Data Security", desc: "Industry-standard encryption." },
  { icon: Clock, title: "Save Time", desc: "Automate tedious tasks." },
];

const AIHub = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Theme color mappings for cards - GLOW/BORDER ONLY (no filled backgrounds)
  // REVERSED GLOW LOGIC: Color glow on normal load, Gold glow on hover
  const getThemeClasses = (color: string) => {
    const themes: Record<string, { card: string; iconWrap: string; icon: string; border: string; arrow: string; glow: string }> = {
      purple: {
        card: "bg-black/40 backdrop-blur-sm border-2 border-purple-500/50 hover:border-gold shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(200,167,102,0.4)]",
        iconWrap: "bg-purple-500/20 border border-purple-500/30",
        icon: "text-purple-400",
        border: "border-purple-500/50",
        arrow: "text-purple-400 group-hover:text-gold",
        glow: "shadow-purple-500/30",
      },
      blue: {
        card: "bg-black/40 backdrop-blur-sm border-2 border-blue-500/50 hover:border-gold shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(200,167,102,0.4)]",
        iconWrap: "bg-blue-500/20 border border-blue-500/30",
        icon: "text-blue-400",
        border: "border-blue-500/50",
        arrow: "text-blue-400 group-hover:text-gold",
        glow: "shadow-blue-500/30",
      },
      cyan: {
        card: "bg-black/40 backdrop-blur-sm border-2 border-cyan-500/50 hover:border-gold shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(200,167,102,0.4)]",
        iconWrap: "bg-cyan-500/20 border border-cyan-500/30",
        icon: "text-cyan-400",
        border: "border-cyan-500/50",
        arrow: "text-cyan-400 group-hover:text-gold",
        glow: "shadow-cyan-500/30",
      },
      teal: {
        card: "bg-black/40 backdrop-blur-sm border-2 border-teal-500/50 hover:border-gold shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_30px_rgba(200,167,102,0.4)]",
        iconWrap: "bg-teal-500/20 border border-teal-500/30",
        icon: "text-teal-400",
        border: "border-teal-500/50",
        arrow: "text-teal-400 group-hover:text-gold",
        glow: "shadow-teal-500/30",
      },
      emerald: {
        card: "bg-black/40 backdrop-blur-sm border-2 border-emerald-500/50 hover:border-gold shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(200,167,102,0.4)]",
        iconWrap: "bg-emerald-500/20 border border-emerald-500/30",
        icon: "text-emerald-400",
        border: "border-emerald-500/50",
        arrow: "text-emerald-400 group-hover:text-gold",
        glow: "shadow-emerald-500/30",
      },
      amber: {
        card: "bg-black/40 backdrop-blur-sm border-2 border-blue-500/50 hover:border-gold shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(200,167,102,0.4)]",
        iconWrap: "bg-blue-500/20 border border-blue-500/30",
        icon: "text-blue-400",
        border: "border-blue-500/50",
        arrow: "text-blue-400 group-hover:text-gold",
        glow: "shadow-blue-500/30",
      },
      pink: {
        card: "bg-black/40 backdrop-blur-sm border-2 border-pink-500/50 hover:border-gold shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_30px_rgba(200,167,102,0.4)]",
        iconWrap: "bg-pink-500/20 border border-pink-500/30",
        icon: "text-pink-400",
        border: "border-pink-500/50",
        arrow: "text-pink-400 group-hover:text-gold",
        glow: "shadow-pink-500/30",
      },
      slate: {
        card: "bg-black/40 backdrop-blur-sm border-2 border-slate-400/50 hover:border-gold shadow-[0_0_20px_rgba(148,163,184,0.3)] hover:shadow-[0_0_30px_rgba(200,167,102,0.4)]",
        iconWrap: "bg-slate-500/20 border border-slate-400/30",
        icon: "text-slate-300",
        border: "border-slate-400/50",
        arrow: "text-slate-300 group-hover:text-gold",
        glow: "shadow-slate-400/30",
      },
      indigo: {
        card: "bg-black/40 backdrop-blur-sm border-2 border-indigo-500/50 hover:border-gold shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(200,167,102,0.4)]",
        iconWrap: "bg-indigo-500/20 border border-indigo-500/30",
        icon: "text-indigo-400",
        border: "border-indigo-500/50",
        arrow: "text-indigo-400 group-hover:text-gold",
        glow: "shadow-indigo-500/30",
      },
      gold: {
        card: "bg-black/40 backdrop-blur-sm border-2 border-gold/50 hover:border-gold shadow-[0_0_20px_rgba(200,167,102,0.3)] hover:shadow-[0_0_30px_rgba(200,167,102,0.5)]",
        iconWrap: "bg-gold/20 border border-gold/30",
        icon: "text-gold",
        border: "border-gold/50",
        arrow: "text-gold",
        glow: "shadow-gold/30",
      },
    };
    return themes[color] || themes.purple;
  };

  const renderToolCard = (tool: typeof investorTools[0]) => {
    const theme = getThemeClasses(tool.themeColor || "purple");
    
    return (
      <motion.div key={tool.id} variants={fadeInUp}>
        <Link to={tool.link} className="block group h-full">
          <Card className={`${theme.card} transition-all duration-300 h-full group-hover:scale-[1.02]`}>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 ${theme.iconWrap} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  <tool.icon className={`w-6 h-6 ${theme.icon}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-1 flex-wrap">
                    <h3 className={`font-semibold text-sm leading-tight ${theme.icon}`}>{tool.title}</h3>
                    <Badge className="bg-emerald-500/30 text-emerald-200 border-emerald-400/50 text-[10px] px-1.5 py-0 flex-shrink-0">
                      FREE
                    </Badge>
                  </div>
                  <p className="text-white/70 text-sm line-clamp-2">{tool.description}</p>
                </div>
                <ArrowUpRight className={`w-5 h-5 ${theme.arrow} opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0`} />
              </div>
            </CardContent>
          </Card>
        </Link>
      </motion.div>
    );
  };

  const renderLockedCard = (tool: typeof brokerOnlyTools[0]) => (
    <motion.div key={tool.id} variants={fadeInUp}>
      <div className="block group h-full cursor-pointer" onClick={() => navigate("/join")}>
        <Card className="bg-gradient-to-br from-purple-900/80 to-indigo-900/60 border border-purple-500/40 shadow-lg shadow-purple-500/20 h-full relative overflow-hidden hover:border-purple-400 hover:shadow-purple-400/30 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent" />
          <CardContent className="p-5 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-500/30 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <tool.icon className="w-6 h-6 text-purple-200" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-1 flex-wrap">
                  <h3 className="text-white font-semibold text-sm leading-tight">{tool.title}</h3>
                  <Badge className="bg-purple-500/30 text-purple-200 border-purple-400/50 text-[10px] px-1.5 py-0 flex-shrink-0">
                    <Lock className="w-2.5 h-2.5 mr-1" />
                    BROKER ONLY
                  </Badge>
                </div>
                <p className="text-purple-100/80 text-sm line-clamp-2">{tool.description}</p>
              </div>
              <ArrowUpRight className="w-5 h-5 text-purple-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );

  return (
    <>
      <SEOHead 
        title="JBJ Investor Hub | Free AI Tools for Investors & Brokers"
        description="Access free AI tools for property investment, comparison, mortgage calculation, and more. Your complete investor toolkit at JBJ Global Real Estate."
        keywords="JBJ Investor Hub, property tools, Real Estate AI, investment tools Dubai, property analysis, JBJ Global Real Estate"
        canonicalPath="/ai-hub"
      />
      
      <section className="relative w-full min-h-screen bg-[#0D0D0D]">
        {/* HERO SECTION - With Video Background */}
        <div className="relative py-16 md:py-24 overflow-hidden">
          {/* Video Background */}
          <div className="absolute inset-0 z-0">
            <video 
              autoPlay 
              loop 
              muted 
              playsInline
              className="w-full h-full object-cover opacity-40"
              poster="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&q=80"
            >
              <source 
                src="https://videos.pexels.com/video-files/3571264/3571264-uhd_2560_1440_30fps.mp4" 
                type="video/mp4" 
              />
            </video>
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-[#0D0D0D]" />
          </div>
          
          {/* Animated gradient orbs */}
          <div className="absolute inset-0 overflow-hidden z-[1]">
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gold/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px]" />
          </div>

          <div className="container mx-auto px-4 relative z-10 pt-8 md:pt-16">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="text-center max-w-4xl mx-auto"
            >
              {/* Clean Badge */}
              <motion.div variants={fadeInUp} className="mb-6">
                <Badge className="bg-gold/15 text-gold border-gold/30 px-4 py-1.5">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Free for All Users
                </Badge>
              </motion.div>

              {/* Main Title - Investor Hub */}
              <motion.h1 
                className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4"
                variants={fadeInUp}
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                <span className="text-white">JBJ </span>
                <span 
                  style={{ 
                    background: "linear-gradient(135deg, #CBA64B 0%, #E8D5A3 50%, #CBA64B 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Investor Hub
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p 
                className="text-white text-lg md:text-xl max-w-2xl mx-auto mb-4 leading-relaxed"
                variants={fadeInUp}
              >
                Your Investment Command Center
              </motion.p>

              <motion.p 
                className="text-zinc-400 text-base max-w-xl mx-auto mb-8"
                variants={fadeInUp}
              >
                Free AI tools • Property analysis • Investment calculators • Productivity suite
              </motion.p>

              {/* Gold divider */}
              <motion.div 
                variants={fadeInUp}
                className="w-24 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mb-8"
              />

              {/* Two CTAs - Premium 3D White/Gold Button Style */}
              <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4 mb-8">
                {!user ? (
                  <Button 
                    onClick={() => navigate("/auth?redirect=/ai-hub")}
                    className="relative bg-gradient-to-r from-white via-[#FDFBF7] to-[#F5F0E6] border border-gold/40 px-8 py-6 text-base shadow-[0_4px_20px_rgba(200,167,102,0.3),0_8px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_25px_rgba(200,167,102,0.5),0_10px_40px_rgba(0,0,0,0.2)] hover:scale-[1.02] transition-all duration-300"
                  >
                    <LogIn className="w-5 h-5 mr-2 text-black" />
                    <span className="text-gold font-semibold">Sign In / Create Account</span>
                    <ArrowUpRight className="w-5 h-5 ml-2 text-gold" />
                  </Button>
                ) : (
                  <Button 
                    onClick={() => navigate("/my-account")}
                    className="relative bg-gradient-to-r from-white via-[#FDFBF7] to-[#F5F0E6] border border-gold/40 px-8 py-6 text-base shadow-[0_4px_20px_rgba(200,167,102,0.3),0_8px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_25px_rgba(200,167,102,0.5),0_10px_40px_rgba(0,0,0,0.2)] hover:scale-[1.02] transition-all duration-300"
                  >
                    <User className="w-5 h-5 mr-2 text-black" />
                    <span className="text-gold font-semibold">Go to My Dashboard</span>
                    <ArrowUpRight className="w-5 h-5 ml-2 text-gold" />
                  </Button>
                )}
                <Button 
                  variant="secondary"
                  onClick={() => document.getElementById('investor-tools')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-8 py-6 text-base"
                >
                  Explore Free Tools
                  <ArrowUpRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>

            </motion.div>
          </div>
        </div>

        {/* Gold Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

        {/* Quick Benefits Strip */}
        <section className="py-12 bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6]">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {quickBenefits.map((benefit, idx) => (
                <motion.div
                  key={idx}
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <div className="w-14 h-14 rounded-xl bg-black flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <benefit.icon className="w-7 h-7 text-gold" />
                  </div>
                  <h3 className="text-black font-semibold text-base mb-1">{benefit.title}</h3>
                  <p className="text-zinc-600 text-sm">{benefit.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Gold Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

        {/* ALL TOOLS SECTION - Bulk view with individual theme colors */}
        <section className="py-16 md:py-20 bg-black">
          <div className="container mx-auto px-4">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Badge className="bg-gold/20 text-gold border-gold/30 mb-4">
                <Sparkles className="w-3 h-3 mr-1" />
                All Free Tools
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Discover All <span className="text-gold">Free AI Tools</span>
              </h2>
              <p className="text-zinc-400 max-w-2xl mx-auto">
                All tools in one place — each with its unique theme. Scroll down to see them organized by category.
              </p>
            </motion.div>

            <motion.div 
              className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              {[...investorTools, ...productivityTools, ...educationCareer].map((tool) => renderToolCard(tool))}
            </motion.div>
          </div>
        </section>

        {/* Gold Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

        {/* SECTION 1: INVESTOR TOOLS */}
        <section id="investor-tools" className="py-16 md:py-20 bg-[#0D0D0D]">
          <div className="container mx-auto px-4">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 mb-4">
                <Sparkles className="w-3 h-3 mr-1" />
                Free AI Tools
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                <span className="text-white">Investment &</span> <span className="text-purple-400">Property Tools</span>
              </h2>
              <p className="text-zinc-400 max-w-2xl mx-auto">
                Powerful AI tools for property analysis, valuation, and investment decisions.
              </p>
            </motion.div>

            <motion.div 
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              {investorTools.map((tool) => renderToolCard(tool))}
            </motion.div>
          </div>
        </section>

        {/* Gold Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

        {/* SECTION 2: PRODUCTIVITY TOOLS */}
        <section className="py-16 md:py-20 bg-[#0D0D0D]">
          <div className="container mx-auto px-4">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 mb-4">
                <Calendar className="w-3 h-3 mr-1" />
                Productivity Suite
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                <span className="text-white">Productivity</span> <span className="text-blue-400">Tools</span>
              </h2>
              <p className="text-zinc-400 max-w-lg mx-auto">
                Video meetings, documents, calendar, and signing tools.
              </p>
            </motion.div>

            <motion.div 
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              {productivityTools.map((tool) => renderToolCard(tool))}
            </motion.div>
          </div>
        </section>

        {/* Gold Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

        {/* SECTION 3: EDUCATION & CAREER */}
        <section className="py-16 md:py-20 bg-[#0D0D0D]">
          <div className="container mx-auto px-4">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Badge className="bg-slate-500/20 text-slate-300 border-slate-400/30 mb-4">
                <GraduationCap className="w-3 h-3 mr-1" />
                Education & Opportunities
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                <span className="text-white">Learn, Earn &</span> <span className="text-slate-300">Grow</span>
              </h2>
              <p className="text-zinc-400 max-w-lg mx-auto">
                Education, career opportunities, and referral rewards.
              </p>
            </motion.div>

            <motion.div 
              className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              {educationCareer.map((tool) => renderToolCard(tool))}
            </motion.div>
          </div>
        </section>

        {/* Gold Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

        {/* SECTION 4: BROKER HUB PREVIEW (What you get as a registered broker) */}
        <section className="py-16 md:py-20 bg-zinc-950">
          <div className="container mx-auto px-4">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Badge className="bg-green-500/20 text-green-300 border-green-400/30 mb-4">
                <Lock className="w-3 h-3 mr-1" />
                JBJ Broker Hub Exclusive
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                <span className="text-white">Unlock More with</span> <span className="text-green-300">JBJ Broker Hub</span>
              </h2>
              <p className="text-zinc-400 max-w-2xl mx-auto">
                Registered JBJ brokers get access to additional tools, operation support, creative suite, and marketing automation.
              </p>
            </motion.div>

            <motion.div 
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              {brokerOnlyTools.map((tool) => renderLockedCard(tool))}
            </motion.div>

            {/* CTA to Join Broker Hub */}
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex flex-col items-center gap-4 p-8 rounded-2xl bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/50 shadow-[0_0_40px_rgba(200,167,102,0.3)]">
                <h3 className="text-black text-xl font-bold">Want Access to All Tools?</h3>
                <p className="text-zinc-600 max-w-md">
                  Join JBJ Broker Hub and unlock operation support, creative & marketing suite, HR management, and exclusive training.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link to="/broker-toolkit">
                    <button className="relative inline-flex items-center gap-2 bg-gradient-to-r from-white via-[#FDFBF7] to-[#F5F0E6] border-2 border-gold/50 px-8 py-4 rounded-xl text-base font-semibold shadow-[0_8px_30px_rgba(200,167,102,0.4),0_4px_15px_rgba(0,0,0,0.1)] hover:bg-transparent hover:border-gold hover:shadow-[0_0_25px_rgba(200,167,102,0.6)] transition-all duration-300 group">
                      <Sparkles className="w-5 h-5 text-black group-hover:text-gold transition-colors" />
                      <span className="text-black group-hover:text-gold transition-colors">Become Part of JBJ Broker Hub</span>
                      <ArrowUpRight className="w-5 h-5 text-gold" />
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Gold Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

        {/* JOIN SECTION */}
        <section className="py-16 md:py-20 bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6]">
          <div className="container mx-auto px-4">
            <motion.div
              className="max-w-3xl mx-auto text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl md:text-3xl font-bold text-black mb-6">
                {user ? (
                  <>Welcome back, <span className="text-gold">{user.email?.split('@')[0]}</span>!</>
                ) : (
                  <>Start Your <span className="text-gold">Investment Journey</span></>
                )}
              </h2>

              {/* Features list */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 max-w-2xl mx-auto mb-10">
                {[
                  "12+ Free AI Tools",
                  "Property Analysis & Comparison",
                  "Mortgage Calculator",
                  "Rental Index Evaluator",
                  "Video Meetings",
                  "Documents & Spreadsheets"
                ].map((feature, idx) => (
                  <motion.div
                    key={idx}
                    className="flex items-center gap-2 p-3 rounded-lg border border-gold/30 bg-gradient-to-r from-[#F5F0E6] to-[#FBF8F3]"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.08 }}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-black text-left text-sm">{feature}</span>
                  </motion.div>
                ))}
              </div>

              {/* CTA */}
              {user ? (
                <button 
                  onClick={() => navigate("/my-account")}
                  className="relative inline-flex items-center gap-2 bg-gradient-to-r from-white via-[#FDFBF7] to-[#F5F0E6] border-2 border-gold/50 px-10 py-4 rounded-xl text-base font-semibold shadow-[0_8px_30px_rgba(200,167,102,0.4),0_4px_15px_rgba(0,0,0,0.1)] hover:bg-black hover:border-gold hover:shadow-[0_0_25px_rgba(200,167,102,0.6)] transition-all duration-300 group"
                >
                  <Sparkles className="w-5 h-5 text-black group-hover:text-gold transition-colors" />
                  <span className="text-black group-hover:text-gold transition-colors">Access All Tools</span>
                  <ArrowUpRight className="w-5 h-5 text-gold" />
                </button>
              ) : (
                <div className="space-y-4">
                  <button 
                    onClick={() => navigate("/auth?redirect=/ai-hub")}
                    className="relative inline-flex items-center gap-2 bg-gradient-to-r from-white via-[#FDFBF7] to-[#F5F0E6] border-2 border-gold/50 px-10 py-4 rounded-xl text-base font-semibold shadow-[0_8px_30px_rgba(200,167,102,0.4),0_4px_15px_rgba(0,0,0,0.1)] hover:bg-black hover:border-gold hover:shadow-[0_0_25px_rgba(200,167,102,0.6)] transition-all duration-300 group"
                  >
                    <Gift className="w-5 h-5 text-black group-hover:text-gold transition-colors" />
                    <span className="text-black group-hover:text-gold transition-colors">Sign In / Create Account</span>
                    <ArrowUpRight className="w-5 h-5 text-gold" />
                  </button>
                  <p className="text-gold text-sm">
                    100% Free — No Credit Card Required
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </section>

        <Footer />
      </section>
    </>
  );
};

export default AIHub;