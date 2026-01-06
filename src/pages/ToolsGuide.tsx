import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { 
  ArrowUpRight, 
  Sparkles, 
  Calculator, 
  FileText, 
  Layers, 
  BarChart3, 
  Search,
  Heart,
  Building2,
  TrendingUp,
  Calendar,
  Wallet,
  ShoppingBag,
  Ruler,
  Palette
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

const tools = [
  {
    id: "ai-home-finder",
    title: "AI Home Finder",
    description: "Answer a few questions about your preferences and let our AI match you with the perfect properties. Get personalized recommendations based on budget, location, lifestyle, and investment goals.",
    icon: Sparkles,
    color: "purple",
    borderColor: "border-purple-500/30",
    textColor: "text-purple-400",
    bgColor: "bg-purple-500/10",
    hoverBg: "hover:bg-purple-500/20",
    shadowColor: "shadow-purple-500/10",
    link: "/quiz",
    features: ["Personalized Matching", "Budget Analysis", "Lifestyle Fit", "Investment Scoring"]
  },
  {
    id: "rental-index",
    title: "Rental Index Evaluator",
    description: "Get AI-powered rental estimates for any Dubai property. Understand current market rates, trends, demand levels, and ROI potential across all major communities.",
    icon: Layers,
    color: "violet",
    borderColor: "border-violet-500/30",
    textColor: "text-violet-400",
    bgColor: "bg-violet-500/10",
    hoverBg: "hover:bg-violet-500/20",
    shadowColor: "shadow-violet-500/10",
    link: "/rental-index",
    features: ["Rent Estimates", "Market Trends", "ROI Analysis", "Area Comparison"]
  },
  {
    id: "property-comparison",
    title: "AI Property Comparison",
    description: "Compare 2-5 properties side by side with AI-powered analysis. Get detailed insights on value, location ratings, developer reputation, and investment recommendations.",
    icon: BarChart3,
    color: "orange",
    borderColor: "border-orange-500/30",
    textColor: "text-orange-400",
    bgColor: "bg-orange-500/10",
    hoverBg: "hover:bg-orange-500/20",
    shadowColor: "shadow-orange-500/10",
    link: "/compare",
    features: ["Side-by-Side View", "AI Scoring", "ROI Projections", "Recommendation"]
  },
  {
    id: "mortgage-calculator",
    title: "Mortgage Calculator",
    description: "Calculate your mortgage payments, affordability, and explore different financing scenarios. Use this tool for estimation purposes.",
    icon: Calculator,
    color: "cyan",
    borderColor: "border-cyan-500/30",
    textColor: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    hoverBg: "hover:bg-cyan-500/20",
    shadowColor: "shadow-cyan-500/10",
    link: "/mortgage-advisory",
    features: ["Payment Calculator", "Affordability Check", "Rate Comparison", "Pre-Approval Guide"]
  },
  {
    id: "property-evaluator",
    title: "Property Evaluator",
    description: "Get an AI-powered valuation for any property based on market data and comparable sales. Understand fair market value and potential appreciation.",
    icon: Building2,
    color: "blue",
    borderColor: "border-blue-500/30",
    textColor: "text-blue-400",
    bgColor: "bg-blue-500/10",
    hoverBg: "hover:bg-blue-500/20",
    shadowColor: "shadow-blue-500/10",
    link: "/property-evaluator",
    features: ["Instant Valuation", "Market Comparables", "Price Trends", "Investment Score"]
  },
  {
    id: "document-scanner",
    title: "Document Scanner & e-Sign",
    description: "Scan, crop, and digitally sign real estate contracts and documents. Add auto-fill fields, export as PDF, and streamline your paperwork.",
    icon: FileText,
    color: "emerald",
    borderColor: "border-emerald-500/30",
    textColor: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    hoverBg: "hover:bg-emerald-500/20",
    shadowColor: "shadow-emerald-500/10",
    link: "/document-scanner",
    features: ["Smart Scanning", "e-Signature", "PDF Export", "Auto-Fill Fields"]
  },
  {
    id: "market-report",
    title: "Market Report",
    description: "Access comprehensive Dubai real estate market reports with data on prices, trends, best-performing areas, and investment opportunities.",
    icon: TrendingUp,
    color: "amber",
    borderColor: "border-amber-500/30",
    textColor: "text-amber-400",
    bgColor: "bg-amber-500/10",
    hoverBg: "hover:bg-amber-500/20",
    shadowColor: "shadow-amber-500/10",
    link: "/market-report",
    features: ["Price Trends", "Area Analysis", "Developer Rankings", "Investment Guide"]
  },
  {
    id: "favorites",
    title: "Favorites & Shortlist",
    description: "Save your favorite properties to a shortlist for easy comparison. Share your selections via email, WhatsApp, or download as an HTML report.",
    icon: Heart,
    color: "pink",
    borderColor: "border-pink-500/30",
    textColor: "text-pink-400",
    bgColor: "bg-pink-500/10",
    hoverBg: "hover:bg-pink-500/20",
    shadowColor: "shadow-pink-500/10",
    link: "/favorites",
    features: ["Save Properties", "Quick Compare", "Share List", "Export Report"]
  },
  {
    id: "ai-calendar",
    title: "AI Calendar & Notes",
    description: "Manage your meetings, events and notes with AI-powered scheduling. Get email and phone reminders for important investor meetings.",
    icon: Calendar,
    color: "indigo",
    borderColor: "border-indigo-500/30",
    textColor: "text-indigo-400",
    bgColor: "bg-indigo-500/10",
    hoverBg: "hover:bg-indigo-500/20",
    shadowColor: "shadow-indigo-500/10",
    link: "/ai-calendar",
    features: ["Event Scheduling", "Meeting Reminders", "AI Notes", "Project Saving"]
  },
  {
    id: "ai-budget-planner",
    title: "AI Budget Planner",
    description: "Budget analysis and property affordability insights (property-only). Informational only—not financial, mortgage, or investment advice.",
    icon: Wallet,
    color: "amber",
    borderColor: "border-amber-500/30",
    textColor: "text-amber-400",
    bgColor: "bg-amber-500/10",
    hoverBg: "hover:bg-amber-500/20",
    shadowColor: "shadow-amber-500/10",
    link: "/ai-financial-advisor",
    features: ["Budget Analysis", "Affordability Insights", "Property Matching", "Payment Plans"]
  },
  {
    id: "ai-personal-shopper",
    title: "AI Personal Shopper",
    description: "Tell us your lifestyle, preferences and goals. Our AI personal shopper will curate the perfect property selections tailored just for you.",
    icon: ShoppingBag,
    color: "rose",
    borderColor: "border-rose-500/30",
    textColor: "text-rose-400",
    bgColor: "bg-rose-500/10",
    hoverBg: "hover:bg-rose-500/20",
    shadowColor: "shadow-rose-500/10",
    link: "/ai-personal-shopper",
    features: ["Lifestyle Matching", "Curated Selections", "AI Recommendations", "Project Saving"]
  },
  {
    id: "property-measurement",
    title: "Property Measurement",
    description: "Calculate property dimensions, areas and layouts. Get accurate measurements for floor plans and space planning.",
    icon: Ruler,
    color: "teal",
    borderColor: "border-teal-500/30",
    textColor: "text-teal-400",
    bgColor: "bg-teal-500/10",
    hoverBg: "hover:bg-teal-500/20",
    shadowColor: "shadow-teal-500/10",
    link: "/property-measurement",
    features: ["Area Calculator", "Room Dimensions", "Floor Plans", "Export Options"]
  },
  {
    id: "interior-design-ai",
    title: "AI Interior Design Studio",
    description: "Visualize your dream space with AI-generated interior designs. Upload a room photo and see it transformed in different styles.",
    icon: Palette,
    color: "fuchsia",
    borderColor: "border-fuchsia-500/30",
    textColor: "text-fuchsia-400",
    bgColor: "bg-fuchsia-500/10",
    hoverBg: "hover:bg-fuchsia-500/20",
    shadowColor: "shadow-fuchsia-500/10",
    link: "/interior-design-ai",
    features: ["Style Visualization", "AI Rendering", "Before/After", "Style Options"]
  },
];

const ToolsGuide = () => {
  return (
    <section className="relative w-full min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative py-24 md:py-32 bg-gradient-to-b from-violet-950/50 via-zinc-950 to-black">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div variants={fadeInUp}>
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/30 rounded-full text-violet-400 text-xs md:text-sm uppercase tracking-[0.4em] mb-6">
                <Sparkles className="w-4 h-4" />
                Investor Tools
              </span>
            </motion.div>

            <motion.h1 
              className="text-white text-4xl md:text-5xl lg:text-6xl font-bold tracking-wide mb-6"
              variants={fadeInUp}
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              AI-Powered{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400">
                Investment Tools
              </span>
            </motion.h1>

            <motion.p 
              className="text-zinc-300 text-lg md:text-xl max-w-2xl mx-auto mb-8"
              variants={fadeInUp}
            >
              Discover our suite of AI-powered tools designed to help you make informed real estate investment decisions in Dubai.
            </motion.p>

            <motion.p 
              className="text-zinc-500 text-sm"
              variants={fadeInUp}
            >
              Developed by Founder Jane Abou Jaoude • Powered by JJ Global Capital
            </motion.p>
          </motion.div>
        </div>
      </div>

      {/* Tools Grid */}
      <section className="py-16 bg-black">
        <div className="container mx-auto px-4">
          <motion.div 
            className="grid md:grid-cols-2 gap-6 lg:gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {tools.map((tool) => (
              <motion.div
                key={tool.id}
                className={`relative p-8 rounded-3xl bg-zinc-900/50 border ${tool.borderColor} hover:border-opacity-70 transition-all duration-500 group overflow-hidden`}
                variants={fadeInUp}
              >
                {/* Glow effect */}
                <div className={`absolute inset-0 ${tool.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl`} />
                
                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-6">
                    <div className={`w-16 h-16 rounded-2xl ${tool.bgColor} border ${tool.borderColor} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                      <tool.icon className={`w-8 h-8 ${tool.textColor}`} />
                    </div>
                    <div>
                      <h3 className="text-white text-xl font-bold mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>
                        {tool.title}
                      </h3>
                      <div className={`inline-flex items-center gap-1 ${tool.textColor} text-xs font-medium uppercase tracking-wider`}>
                        <Sparkles className="w-3 h-3" />
                        AI Powered
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-zinc-400 mb-6 leading-relaxed">
                    {tool.description}
                  </p>

                  {/* Features */}
                  <div className="grid grid-cols-2 gap-2 mb-6">
                    {tool.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-zinc-300 text-sm">
                        <div className={`w-1.5 h-1.5 rounded-full ${tool.textColor.replace('text-', 'bg-')}`} />
                        {feature}
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <Link to={tool.link}>
                    <Button 
                      className={`w-full ${tool.bgColor} backdrop-blur-md border ${tool.borderColor} ${tool.textColor} ${tool.hoverBg} font-semibold py-5 transition-all duration-300`}
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Open {tool.title}
                      <ArrowUpRight className="w-4 h-4 ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-b from-black to-zinc-950">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">How It Works</span>
            <h2 
              className="text-white text-3xl md:text-4xl font-bold"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Invest Smarter with AI
            </h2>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {[
              { step: "1", title: "Choose Your Tool", desc: "Select the AI tool that matches your current need—whether it's finding properties, analyzing rentals, or comparing investments." },
              { step: "2", title: "Input Your Data", desc: "Provide the relevant details like location, budget, property type, or preferences. Our AI processes your inputs instantly." },
              { step: "3", title: "Get AI Insights", desc: "Receive data-driven recommendations, valuations, and insights to help you make confident investment decisions." },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                className="text-center p-8 rounded-2xl bg-zinc-900/30 border border-zinc-800/50"
                variants={fadeInUp}
              >
                <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-6">
                  <span className="text-gold text-2xl font-bold">{item.step}</span>
                </div>
                <h3 className="text-white font-semibold text-lg mb-3">{item.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Sparkles className="w-12 h-12 text-gold mx-auto mb-6" />
            <h2 
              className="text-white text-3xl md:text-4xl font-bold mb-6"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Ready to Start Investing?
            </h2>
            <p className="text-zinc-400 mb-8">
              Use our AI-powered tools to find the perfect property and make data-driven investment decisions.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/quiz">
                <Button className="bg-gold hover:bg-gold-light text-black font-semibold px-8 py-6 text-base">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Start AI Home Finder
                  <ArrowUpRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/properties">
                <Button 
                  variant="outline"
                  className="border-gold/50 text-gold hover:bg-gold/10 hover:border-gold px-8 py-6 text-base"
                >
                  Browse Properties
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </section>
  );
};

export default ToolsGuide;
