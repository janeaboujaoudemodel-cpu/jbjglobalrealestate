import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { SEOHead, pagesSEO } from "@/components/SEOHead";
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
  Table2,
  Video,
  CreditCard,
  Camera,
  Film,
  Megaphone,
  GraduationCap,
  Briefcase,
  UserCheck,
  CheckCircle2,
  Gift,
  Home,
  Image,
  Share2,
  Award,
  User,
  Target,
  Headphones,
  LogIn,
  FolderOpen
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

// Category 1: FREE AI TOOLS (for everyone)
const freeAITools = [
  {
    id: "ai-home-finder",
    title: "JBJ AI Home Finder",
    description: "Match buyers to listings with AI-powered filters.",
    icon: Home,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    link: "/quiz",
  },
  {
    id: "property-evaluator",
    title: "JBJ Property Evaluator",
    description: "AI-driven valuation based on live market data.",
    icon: Calculator,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    link: "/property-evaluator",
  },
  {
    id: "property-comparison",
    title: "JBJ Property Comparison",
    description: "Compare properties side-by-side with AI insights.",
    icon: BarChart3,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30",
    link: "/compare",
  },
  {
    id: "mortgage-calculator",
    title: "JBJ Mortgage Calculator",
    description: "Estimate monthly payments and financing options.",
    icon: Calculator,
    color: "text-teal-400",
    bgColor: "bg-teal-500/10",
    borderColor: "border-teal-500/30",
    link: "/mortgage-calculator",
  },
  {
    id: "rental-index",
    title: "JBJ Rental Index Evaluator",
    description: "AI-powered rental estimates with market trends.",
    icon: Layers,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    link: "/rental-index",
  },
  {
    id: "interior-design",
    title: "JBJ AI Interior Design",
    description: "Visualize spaces with AI-generated designs.",
    icon: Image,
    color: "text-fuchsia-400",
    bgColor: "bg-fuchsia-500/10",
    borderColor: "border-fuchsia-500/30",
    link: "/interior-design-ai",
  },
  {
    id: "business-card-scanner",
    title: "JBJ Business Card Scanner",
    description: "Scan and save business cards into your CRM.",
    icon: CreditCard,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    link: "/business-card-scanner",
  },
];

// Category 2: BROKER OPERATIONS (Human Support)
const brokerOperations = [
  {
    id: "listing-admin",
    title: "Listing Admin (Sarah)",
    subtitle: "Property Administration",
    description: "Smart property listing, document parsing, auto-categorization by developer.",
    icon: FolderOpen,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    link: "/listing-admin",
  },
  {
    id: "admin-support",
    title: "Olivia — Executive Admin",
    subtitle: "Founder Support",
    description: "Scheduling, follow-ups, coordination, and admin workflows.",
    icon: User,
    color: "text-gold",
    bgColor: "bg-gold/10",
    borderColor: "border-gold/30",
    link: "/executive-assistant",
  },
  {
    id: "hr-manager",
    title: "HR Manager",
    subtitle: "Dedicated (Jessica)",
    description: "Hiring pipeline, performance tracking, team structure, HR policies.",
    icon: Users,
    color: "text-pink-400",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/30",
    link: "/hr-agent",
  },
  {
    id: "hr-assistant",
    title: "HR Assistant",
    subtitle: "Support Staff",
    description: "Contracts support, onboarding checklists, document coordination.",
    icon: UserCheck,
    color: "text-violet-400",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/30",
    link: "/crm",
  },
  {
    id: "property-coach",
    title: "Property Coach",
    subtitle: "Broker Coaching",
    description: "Scripts, objections, roleplay, deal strategy, accountability.",
    icon: Target,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    link: "/broker-toolkit",
  },
];

// Category 3: CREATIVE & MARKETING SUITE
const creativeMarketing = [
  {
    id: "graphic-designer",
    title: "JBJ Graphic Designer",
    description: "Create brochures, ads, and marketing materials.",
    icon: Palette,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    link: "/design-studio",
  },
  {
    id: "videographer",
    title: "JBJ Videographer",
    description: "HD walkthroughs, marketing videos, social clips.",
    icon: Film,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    link: "/video-builder",
  },
  {
    id: "photographer",
    title: "JBJ Photographer",
    description: "Auto-enhance listing photos with AI filters.",
    icon: Camera,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    link: "/interior-design-ai",
  },
  {
    id: "digital-marketing",
    title: "JBJ Digital Marketing",
    description: "Automate ads, campaigns, and analytics.",
    icon: Megaphone,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    link: "/jbj-hub",
  },
  {
    id: "social-workshop",
    title: "JBJ Social Media Workshop",
    description: "Tutorials and training to grow your brand.",
    icon: Share2,
    color: "text-pink-400",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/30",
    link: "/broker-toolkit",
  },
  {
    id: "content-tools",
    title: "JBJ Documents & Spreadsheets",
    description: "Rich text editor and Excel-like tools.",
    icon: FileText,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    link: "/documents",
  },
];

// Category 4: EDUCATION & CERTIFICATIONS
const educationCerts = [
  {
    id: "academy",
    title: "JBJ Academy",
    description: "Video tutorials and broker certifications.",
    icon: GraduationCap,
    color: "text-gold",
    bgColor: "bg-gold/10",
    borderColor: "border-gold/30",
    link: "/broker-toolkit",
  },
  {
    id: "employment-hub",
    title: "JBJ Employment Hub",
    description: "Hire or get hired in Real Estate.",
    icon: Briefcase,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30",
    link: "/crm",
  },
  {
    id: "referral-program",
    title: "JBJ Referral Program",
    description: "Earn 5% commission on successful referrals.",
    icon: Award,
    color: "text-lime-400",
    bgColor: "bg-lime-500/10",
    borderColor: "border-lime-500/30",
    link: "/referral-onboarding",
  },
];

// Category 5: PRODUCTIVITY TOOLS
const productivityTools = [
  {
    id: "video-meeting",
    title: "JBJ Video Meet",
    description: "Free unlimited video meetings with recording.",
    icon: Video,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    link: "/video-meeting",
  },
  {
    id: "calendar",
    title: "JBJ Calendar & Notes",
    description: "Smart scheduling and reminders.",
    icon: Calendar,
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/30",
    link: "/ai-calendar",
  },
  {
    id: "scan-sign",
    title: "JBJ Scan & Sign",
    description: "Digital document signing and scanning.",
    icon: FileText,
    color: "text-sky-400",
    bgColor: "bg-sky-500/10",
    borderColor: "border-sky-500/30",
    link: "/documents",
  },
];

const allHubTools = [
  ...freeAITools,
  ...brokerOperations,
  ...creativeMarketing,
  ...educationCerts,
  ...productivityTools,
];

const hubBenefits = [
  "20+ property tools & assistants",
  "Executive admin support (24/7)",
  "HR Manager & HR Assistant",
  "Property coach for deal strategy",
  "Creative & marketing suite",
  "Free courses and certifications"
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

  // Get glow color class based on tool color
  const getGlowClass = (color: string) => {
    if (color.includes('emerald')) return 'shadow-emerald-500/20 hover:shadow-gold/30';
    if (color.includes('blue')) return 'shadow-blue-500/20 hover:shadow-gold/30';
    if (color.includes('purple')) return 'shadow-purple-500/20 hover:shadow-gold/30';
    if (color.includes('green')) return 'shadow-green-500/20 hover:shadow-gold/30';
    if (color.includes('fuchsia')) return 'shadow-fuchsia-500/20 hover:shadow-gold/30';
    if (color.includes('zinc')) return 'shadow-zinc-500/20 hover:shadow-gold/30';
    if (color.includes('lime')) return 'shadow-lime-500/20 hover:shadow-gold/30';
    if (color.includes('pink')) return 'shadow-pink-500/20 hover:shadow-gold/30';
    if (color.includes('violet')) return 'shadow-violet-500/20 hover:shadow-gold/30';
    if (color.includes('amber')) return 'shadow-amber-500/20 hover:shadow-gold/30';
    if (color.includes('gold')) return 'shadow-gold/20 hover:shadow-gold/30';
    if (color.includes('red')) return 'shadow-red-500/20 hover:shadow-gold/30';
    if (color.includes('cyan')) return 'shadow-cyan-500/20 hover:shadow-gold/30';
    if (color.includes('indigo')) return 'shadow-indigo-500/20 hover:shadow-gold/30';
    return 'shadow-zinc-500/20 hover:shadow-gold/30';
  };

  const renderToolCard = (tool: typeof freeAITools[0], showFree = true) => (
    <motion.div key={tool.id} variants={fadeInUp}>
      <Link to={tool.link} className="block group h-full">
        <Card className={`bg-gradient-to-br from-zinc-900/90 to-zinc-950 border ${tool.borderColor} hover:border-gold shadow-lg ${getGlowClass(tool.color)} hover:shadow-xl transition-all duration-300 h-full group-hover:scale-[1.02] backdrop-blur-sm`}>
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 ${tool.bgColor} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                <tool.icon className={`w-6 h-6 ${tool.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-1 flex-wrap">
                  <h3 className="text-white font-semibold text-sm leading-tight">{tool.title}</h3>
                  {showFree && (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0 flex-shrink-0">
                      FREE
                    </Badge>
                  )}
                </div>
                <p className="text-zinc-400 text-sm line-clamp-2">{tool.description}</p>
              </div>
              <ArrowUpRight className={`w-5 h-5 ${tool.color} opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0`} />
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );

  const renderOperationCard = (item: typeof brokerOperations[0]) => (
    <motion.div key={item.id} variants={fadeInUp}>
      <Link to={item.link} className="block group h-full">
        <Card className={`bg-gradient-to-br from-zinc-900/90 to-zinc-950 border ${item.borderColor} hover:border-gold shadow-lg ${getGlowClass(item.color)} hover:shadow-xl transition-all duration-300 h-full backdrop-blur-sm group-hover:scale-[1.02]`}>
          <CardContent className="p-5">
            <div className={`w-12 h-12 ${item.bgColor} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <item.icon className={`w-6 h-6 ${item.color}`} />
            </div>
            <h3 className="text-white font-semibold mb-1">{item.title}</h3>
            <p className={`${item.color} text-sm mb-2`}>{item.subtitle}</p>
            <p className="text-zinc-400 text-sm">{item.description}</p>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );

  return (
    <>
      <SEOHead 
        title="JBJ Broker Hub"
        description="Access free AI tools, broker training, operations support, and coaching — all in one place. Your complete broker command center at JBJ Global Real Estate."
        keywords="JBJ Broker Hub, broker tools, Real Estate AI, property tools Dubai, broker support, JBJ Global Real Estate"
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
            {/* Dark overlay for better text readability */}
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
                  Free for All Brokers
                </Badge>
              </motion.div>

              {/* Main Title - Clean JBJ Broker Hub */}
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
                  Broker Hub
                </span>
              </motion.h1>

              {/* Subtitle - Clear Value */}
              <motion.p 
                className="text-white text-lg md:text-xl max-w-2xl mx-auto mb-4 leading-relaxed"
                variants={fadeInUp}
              >
                Your Broker Command Center
              </motion.p>

              <motion.p 
                className="text-zinc-400 text-base max-w-xl mx-auto mb-8"
                variants={fadeInUp}
              >
                Free AI tools • Broker training • Operations support • Coaching
              </motion.p>

              {/* Gold divider */}
              <motion.div 
                variants={fadeInUp}
                className="w-24 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mb-8"
              />

              {/* Two CTAs */}
              <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4 mb-8">
                {!user ? (
                  <Button 
                    onClick={() => navigate("/auth?redirect=/ai-hub")}
                    className="bg-gradient-to-r from-gold to-gold-dark text-black font-bold px-8 py-6 text-base shadow-lg hover:brightness-110 transition-all"
                    style={{ boxShadow: "0 0 25px rgba(203, 166, 75, 0.35)" }}
                  >
                    <LogIn className="w-5 h-5 mr-2" />
                    Sign In / Create Account
                    <ArrowUpRight className="w-5 h-5 ml-2" />
                  </Button>
                ) : (
                  <Button 
                    onClick={() => navigate("/my-account")}
                    className="bg-gradient-to-r from-gold to-gold-dark text-black font-bold px-8 py-6 text-base shadow-lg hover:brightness-110 transition-all"
                    style={{ boxShadow: "0 0 25px rgba(203, 166, 75, 0.35)" }}
                  >
                    <User className="w-5 h-5 mr-2" />
                    Go to My Dashboard
                    <ArrowUpRight className="w-5 h-5 ml-2" />
                  </Button>
                )}
                <Button 
                  variant="outline"
                  onClick={() => document.getElementById('free-tools')?.scrollIntoView({ behavior: 'smooth' })}
                  className="border-2 border-gold/40 text-gold hover:bg-gold/10 hover:border-gold px-8 py-6 text-base font-semibold"
                >
                  Explore Free Tools
                </Button>
              </motion.div>

            </motion.div>
          </div>
        </div>

        {/* Gold Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

        {/* Quick Benefits Strip - WHITE BACKGROUND */}
        <section className="py-12 bg-white">
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

        {/* CATEGORY 1: FREE AI TOOLS */}
        <section id="free-tools" className="py-16 md:py-20 bg-[#0D0D0D]">
          <div className="container mx-auto px-4">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 mb-4">
                <Sparkles className="w-3 h-3 mr-1" />
                Tools Shortcuts
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                All Tools — Quick Access
              </h2>
              <p className="text-zinc-400 max-w-2xl mx-auto">
                Quick shortcuts to every tool. Full categories are listed below.
              </p>
            </motion.div>

            <motion.div 
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              {allHubTools.map((tool) => renderToolCard(tool, false))}
            </motion.div>
          </div>
        </section>

        {/* Gold Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

        {/* CATEGORY 2: BROKER OPERATIONS SUPPORT */}
        <section className="py-16 md:py-20 bg-zinc-950">
          <div className="container mx-auto px-4">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/30 mb-4">
                <Users className="w-3 h-3 mr-1" />
                Broker Operations
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Broker Operations Support
              </h2>
              <p className="text-zinc-400 max-w-lg mx-auto">
                Dedicated operations support to help you succeed.
              </p>
            </motion.div>

            <motion.div 
              className="grid md:grid-cols-2 lg:grid-cols-4 gap-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              {brokerOperations.map((item) => renderOperationCard(item))}
            </motion.div>
          </div>
        </section>

        {/* Gold Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

        {/* CATEGORY 3: CREATIVE & MARKETING SUITE */}
        <section className="py-16 md:py-20 bg-[#0D0D0D]">
          <div className="container mx-auto px-4">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 mb-4">
                <Palette className="w-3 h-3 mr-1" />
                Creative & Marketing
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Creative & Marketing Suite
              </h2>
              <p className="text-zinc-400 max-w-lg mx-auto">
                Design, video, and marketing tools to grow your brand.
              </p>
            </motion.div>

            <motion.div 
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              {creativeMarketing.map((tool) => renderToolCard(tool, false))}
            </motion.div>
          </div>
        </section>

        {/* Gold Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

        {/* CATEGORY 4: EDUCATION & CERTIFICATIONS */}
        <section className="py-16 md:py-20 bg-zinc-950">
          <div className="container mx-auto px-4">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Badge className="bg-gold/20 text-gold border-gold/30 mb-4">
                <GraduationCap className="w-3 h-3 mr-1" />
                Education & Certifications
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Education & Certifications
              </h2>
              <p className="text-zinc-400 max-w-lg mx-auto">
                Learn, grow, and get certified with JBJ Academy.
              </p>
            </motion.div>

            <motion.div 
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              {educationCerts.map((tool) => renderToolCard(tool, false))}
            </motion.div>
          </div>
        </section>

        {/* Gold Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

        {/* CATEGORY 5: PRODUCTIVITY TOOLS */}
        <section className="py-16 md:py-20 bg-[#0D0D0D]">
          <div className="container mx-auto px-4">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30 mb-4">
                <Calendar className="w-3 h-3 mr-1" />
                Productivity Tools
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Productivity Tools
              </h2>
              <p className="text-zinc-400 max-w-lg mx-auto">
                Video meetings, calendar, and document tools to stay organized.
              </p>
            </motion.div>

            <motion.div 
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              {productivityTools.map((tool) => renderToolCard(tool, false))}
            </motion.div>
          </div>
        </section>

        {/* Gold Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

        {/* JOIN SECTION - WHITE BACKGROUND */}
        <section className="py-16 md:py-20 bg-white">
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
                  <>Join the <span className="text-gold">JBJ Broker Circle</span></>
                )}
              </h2>

              {/* Features list */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 max-w-2xl mx-auto mb-10">
                {hubBenefits.map((feature, idx) => (
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
                <Button 
                  onClick={() => navigate("/my-account")}
                  variant="dark"
                  className="px-10 py-6 text-base shadow-lg"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Access All Tools
                  <ArrowUpRight className="w-5 h-5 ml-2" />
                </Button>
              ) : (
                <div className="space-y-4">
                  <Button 
                    onClick={() => navigate("/auth?redirect=/ai-hub")}
                    variant="dark"
                    className="px-10 py-6 text-base shadow-lg"
                  >
                    <Gift className="w-5 h-5 mr-2" />
                    Sign In / Create Account
                    <ArrowUpRight className="w-5 h-5 ml-2" />
                  </Button>
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
