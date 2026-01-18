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

// INVESTOR HUB TOOLS - Available to all users
const investorTools = [
  {
    id: "ai-home-finder",
    title: "JBJ AI Home Finder",
    description: "Match buyers to listings with AI-powered filters.",
    icon: Home,
    link: "/quiz",
  },
  {
    id: "property-evaluator",
    title: "JBJ Property Evaluator",
    description: "AI-driven valuation based on live market data.",
    icon: Calculator,
    link: "/property-evaluator",
  },
  {
    id: "property-comparison",
    title: "JBJ Property Comparison",
    description: "Compare properties side-by-side with AI insights.",
    icon: BarChart3,
    link: "/compare",
  },
  {
    id: "mortgage-calculator",
    title: "JBJ Mortgage Calculator",
    description: "Estimate monthly payments and financing options.",
    icon: Calculator,
    link: "/mortgage-calculator",
  },
  {
    id: "rental-index",
    title: "JBJ Rental Index Evaluator",
    description: "AI-powered rental estimates with market trends.",
    icon: Layers,
    link: "/rental-index",
  },
  {
    id: "interior-design",
    title: "JBJ AI Interior Design",
    description: "Visualize spaces with AI-generated designs.",
    icon: Image,
    link: "/interior-design-ai",
  },
  {
    id: "business-card-scanner",
    title: "JBJ Business Card Scanner",
    description: "Scan and save business cards into your CRM.",
    icon: CreditCard,
    link: "/business-card-scanner",
  },
  {
    id: "property-coach",
    title: "JBJ Property Coach",
    description: "Scripts, objections, roleplay, deal strategy.",
    icon: Target,
    link: "/broker-toolkit",
  },
];

// PRODUCTIVITY TOOLS - Available to all users
const productivityTools = [
  {
    id: "content-tools",
    title: "JBJ Documents & Spreadsheets",
    description: "Rich text editor and Excel-like tools.",
    icon: FileText,
    link: "/documents",
  },
  {
    id: "video-meeting",
    title: "JBJ Video Meet",
    description: "Free unlimited video meetings with recording.",
    icon: Video,
    link: "/video-meeting",
  },
  {
    id: "calendar",
    title: "JBJ Calendar & Notes",
    description: "Smart scheduling and reminders.",
    icon: Calendar,
    link: "/ai-calendar",
  },
  {
    id: "scan-sign",
    title: "JBJ Scan & Sign",
    description: "Digital document signing and scanning.",
    icon: FileText,
    link: "/documents",
  },
];

// EDUCATION & CAREER - Separate section
const educationCareer = [
  {
    id: "academy",
    title: "JBJ Academy",
    description: "Video tutorials and broker certifications.",
    icon: GraduationCap,
    link: "/broker-toolkit",
  },
  {
    id: "employment-hub",
    title: "JBJ Employment Hub",
    description: "Hire or get hired in Real Estate.",
    icon: Briefcase,
    link: "/join",
  },
  {
    id: "referral-program",
    title: "JBJ Referral Program",
    description: "Earn 5% commission on successful referrals.",
    icon: Award,
    link: "/referral-onboarding",
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

  const renderToolCard = (tool: typeof investorTools[0]) => (
    <motion.div key={tool.id} variants={fadeInUp}>
      <Link to={tool.link} className="block group h-full">
        <Card className="bg-white border border-zinc-200 hover:border-gold shadow-lg shadow-zinc-200/50 hover:shadow-xl hover:shadow-gold/20 transition-all duration-300 h-full group-hover:scale-[1.02]">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <tool.icon className="w-6 h-6 text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-1 flex-wrap">
                  <h3 className="text-black font-semibold text-sm leading-tight">{tool.title}</h3>
                  <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 text-[10px] px-1.5 py-0 flex-shrink-0">
                    FREE
                  </Badge>
                </div>
                <p className="text-zinc-600 text-sm line-clamp-2">{tool.description}</p>
              </div>
              <ArrowUpRight className="w-5 h-5 text-gold opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );

  const renderLockedCard = (tool: typeof brokerOnlyTools[0]) => (
    <motion.div key={tool.id} variants={fadeInUp}>
      <div className="block group h-full cursor-not-allowed">
        <Card className="bg-zinc-900 border border-zinc-700 shadow-lg h-full relative overflow-hidden opacity-75">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/50 to-transparent" />
          <CardContent className="p-5 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center flex-shrink-0">
                <tool.icon className="w-6 h-6 text-zinc-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-1 flex-wrap">
                  <h3 className="text-zinc-400 font-semibold text-sm leading-tight">{tool.title}</h3>
                  <Badge className="bg-zinc-800 text-zinc-500 border-zinc-700 text-[10px] px-1.5 py-0 flex-shrink-0">
                    <Lock className="w-2.5 h-2.5 mr-1" />
                    BROKER ONLY
                  </Badge>
                </div>
                <p className="text-zinc-500 text-sm line-clamp-2">{tool.description}</p>
              </div>
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
                  onClick={() => document.getElementById('investor-tools')?.scrollIntoView({ behavior: 'smooth' })}
                  className="border-2 border-gold/40 text-gold hover:bg-gold/10 hover:border-gold px-8 py-6 text-base font-semibold"
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

        {/* SECTION 1: INVESTOR TOOLS */}
        <section id="investor-tools" className="py-16 md:py-20 bg-[#0D0D0D]">
          <div className="container mx-auto px-4">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 mb-4">
                <Sparkles className="w-3 h-3 mr-1" />
                Free AI Tools
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Investment & Property Tools
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
              <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30 mb-4">
                <Calendar className="w-3 h-3 mr-1" />
                Productivity Suite
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Productivity Tools
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
              <Badge className="bg-gold/20 text-gold border-gold/30 mb-4">
                <GraduationCap className="w-3 h-3 mr-1" />
                Education & Opportunities
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Learn, Earn & Grow
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
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 mb-4">
                <Lock className="w-3 h-3 mr-1" />
                JBJ Broker Hub Exclusive
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Unlock More with JBJ Broker Hub
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
                    <Button 
                      variant="dark"
                      className="px-8 py-6 text-base"
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      Become Part of JBJ Broker Hub
                      <ArrowUpRight className="w-5 h-5 ml-2" />
                    </Button>
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