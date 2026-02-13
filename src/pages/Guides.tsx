import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  BookOpen, ArrowRight, HelpCircle, FileText, DollarSign, Shield, BarChart3, CheckCircle, MessageCircle
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { PremiumHeroButton } from "@/components/ui/premium-hero-button";
import { Card, CardContent } from "@/components/ui/card";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

// Premium 3D book cards linking to existing guides
const guides = [
  {
    title: "Buyer Guide",
    description: "Complete guide to purchasing property in Dubai",
    href: "/buyer-guide",
    color: "from-amber-600 to-amber-800",
    spineColor: "bg-amber-900"
  },
  {
    title: "Seller Guide",
    description: "Steps and strategies for selling your property",
    href: "/seller-guide",
    color: "from-emerald-600 to-emerald-800",
    spineColor: "bg-emerald-900"
  },
  {
    title: "Landlord Guide",
    description: "Managing and leasing your investment property",
    href: "/landlord-guide",
    color: "from-blue-600 to-blue-800",
    spineColor: "bg-blue-900"
  },
  {
    title: "Tenant Guide",
    description: "Finding and renting your ideal home",
    href: "/tenant-guide",
    color: "from-purple-600 to-purple-800",
    spineColor: "bg-purple-900"
  },
  {
    title: "Area Guides",
    description: "Explore Dubai's prime locations and communities",
    href: "/areas",
    color: "from-cyan-600 to-cyan-800",
    spineColor: "bg-cyan-900"
  },
  {
    title: "Investor Education",
    description: "Real estate investment strategies and insights",
    href: "/investor-education",
    color: "from-gold to-amber-700",
    spineColor: "bg-amber-950"
  },
  {
    title: "General FAQ",
    description: "Common questions about Dubai real estate",
    href: "/faq",
    color: "from-slate-600 to-slate-800",
    spineColor: "bg-slate-900"
  },
  {
    title: "Investor FAQ",
    description: "Investment-specific questions answered",
    href: "/investor-faq",
    color: "from-rose-600 to-rose-800",
    spineColor: "bg-rose-900"
  },
  {
    title: "Broker FAQ",
    description: "For real estate professionals",
    href: "/broker-faq",
    color: "from-indigo-600 to-indigo-800",
    spineColor: "bg-indigo-900"
  },
  {
    title: "Golden Visa Guide",
    description: "UAE residency through property investment",
    href: "/guides/golden-visa-uae",
    color: "from-yellow-500 to-yellow-700",
    spineColor: "bg-yellow-900"
  }
];

// What You'll Learn items
const learningTopics = [
  {
    icon: FileText,
    title: "Transaction structure and roles",
    description: "Understand the step-by-step process and who does what"
  },
  {
    icon: CheckCircle,
    title: "Common documents and checkpoints",
    description: "Know what paperwork is required and when"
  },
  {
    icon: DollarSign,
    title: "Fee clarity and what is paid when",
    description: "Transparent breakdown of all costs involved"
  },
  {
    icon: Shield,
    title: "Risk controls and readiness checklists",
    description: "Protect yourself with proper due diligence"
  },
  {
    icon: BarChart3,
    title: "Market intelligence reading basics",
    description: "Understand data and trends where relevant"
  },
  {
    icon: CheckCircle,
    title: "Payment plan structures and milestones",
    description: "How installment schedules work in off-plan purchases"
  }
];

// 3D Book Card Component
const BookCard = ({ guide, index }: { guide: typeof guides[0]; index: number }) => {
  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ 
        rotateY: -15,
        translateX: 10,
        translateZ: 20,
        transition: { duration: 0.3 }
      }}
      className="perspective-1000"
    >
      <Link 
        to={guide.href}
        className="block group"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="relative h-[280px] w-[200px] mx-auto" style={{ transformStyle: 'preserve-3d' }}>
          {/* Book spine */}
          <div 
            className={`absolute left-0 top-0 w-[20px] h-full ${guide.spineColor} rounded-l-sm shadow-inner`}
            style={{ 
              transform: 'rotateY(-90deg) translateX(-10px)',
              transformOrigin: 'right center'
            }}
          />
          
          {/* Book cover */}
          <div 
            className={`absolute inset-0 bg-gradient-to-br ${guide.color} rounded-r-lg rounded-l-sm shadow-xl group-hover:shadow-2xl transition-shadow`}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Cover content */}
            <div className="absolute inset-0 p-6 flex flex-col justify-between">
              {/* Top decoration */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-1 bg-white/30 rounded-full" />
                <div className="w-4 h-1 bg-white/20 rounded-full" />
              </div>
              
              {/* Title */}
              <div className="flex-1 flex flex-col justify-center">
                <BookOpen className="w-8 h-8 text-white/80 mb-3" />
                <h3 className="text-white font-bold text-lg leading-tight mb-2">
                  {guide.title}
                </h3>
                <p className="text-white/70 text-xs line-clamp-2">
                  {guide.description}
                </p>
              </div>
              
              {/* Bottom decoration */}
              <div className="flex items-center justify-between">
                <span className="text-white/50 text-xs">JBJ Global</span>
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <ArrowRight className="w-3 h-3 text-white" />
                </div>
              </div>
            </div>
            
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-r-lg rounded-l-sm" />
            
            {/* Page edges */}
            <div className="absolute right-0 top-2 bottom-2 w-[3px] bg-gradient-to-r from-white/40 to-white/20 rounded-r" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

const Guides = () => {
  return (
    <div className="min-h-screen bg-black">
      <SEOHead 
        title="Guides Library | JBJ Global Real Estate"
        description="Structured guides built to answer real questions—fees, steps, timelines, and best-practice workflows across buying, selling, renting, and investing."
        keywords="Dubai real estate guides, buyer guide, seller guide, landlord guide, tenant guide, golden visa guide"
        canonicalPath="/guides"
      />

      {/* Hero Section */}
      <section className="jj-hero-fullscreen relative flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-black">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="https://videos.pexels.com/video-files/3629519/3629519-uhd_2560_1440_25fps.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold/10 via-transparent to-transparent" />
        </div>
        
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-gold/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-gold/15 rounded-full blur-[120px] pointer-events-none" />

        <motion.div 
          className="relative z-10 container mx-auto px-4 py-32 text-center max-w-4xl"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div 
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-6 border border-gold/40 bg-black/30 backdrop-blur-md"
            variants={fadeInUp}
          >
            <BookOpen className="w-4 h-4 text-gold" />
            <span className="text-gold font-semibold text-xs uppercase tracking-[0.2em]">
              Guides
            </span>
          </motion.div>

          <motion.h1 
            className="text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-[-0.02em]"
            style={{ fontFamily: "Poppins, sans-serif" }}
            variants={fadeInUp}
          >
            Guides Library
          </motion.h1>

          <motion.p 
            className="text-zinc-300 text-base md:text-lg max-w-3xl mx-auto mb-10 leading-relaxed"
            variants={fadeInUp}
          >
            Structured guides built to answer real questions—fees, steps, timelines, and best-practice workflows across buying, selling, renting, and investing.
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4">
            <PremiumHeroButton href="#guides-library">
              Browse Guides
            </PremiumHeroButton>
            <PremiumHeroButton href="/contact">
              Ask a Question
            </PremiumHeroButton>
          </motion.div>
        </motion.div>
        
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <span className="text-gold/60 text-xs tracking-widest uppercase">Explore</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-gold/60 to-transparent" />
        </motion.div>
      </section>

      {/* How This Library Works */}
      <section className="bg-black py-20">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-black mb-6"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              How This Library Works
            </motion.h2>
            <motion.div variants={fadeInUp} className="jj-card-inner max-w-3xl mx-auto">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-black flex items-center justify-center shrink-0">
                  <BookOpen className="w-7 h-7 text-gold" />
                </div>
                <div className="text-left">
                  <p className="text-zinc-700 leading-relaxed">
                    Choose a guide like a book. Each guide follows the same structure so you can scan quickly and act confidently.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Guide Books Grid */}
      <section id="guides-library" className="py-20 bg-black">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="w-full px-4 sm:px-6 lg:px-8"
          >
            <motion.div className="text-center mb-16" variants={fadeInUp}>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black" style={{ fontFamily: "Playfair Display, serif" }}>
                Explore Guides
              </h2>
              <p className="text-zinc-600 max-w-2xl mx-auto">
                Select a guide to open the full page.
              </p>
            </motion.div>

            {/* 3D Book Shelf */}
            <div 
              className="max-w-6xl mx-auto"
              style={{ perspective: '1500px' }}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8 justify-items-center">
                {guides.map((guide, index) => (
                  <BookCard key={guide.href} guide={guide} index={index} />
                ))}
              </div>
            </div>

            {/* Shelf decoration */}
            <div className="max-w-5xl mx-auto mt-12">
              <div className="h-3 bg-gradient-to-r from-amber-800 via-amber-700 to-amber-800 rounded-lg shadow-lg" />
              <div className="h-1 bg-amber-900/50 rounded-b-lg mx-4" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* What You'll Learn */}
      <section className="bg-black py-20">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-black text-center mb-12"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              What You'll Learn
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {learningTopics.map((topic, index) => {
                const Icon = topic.icon;
                return (
                  <motion.div key={index} variants={fadeInUp}>
                    <Card className="jj-card-inner h-full">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center shrink-0">
                            <Icon className="w-6 h-6 text-gold" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-black mb-1">{topic.title}</h3>
                            <p className="text-sm text-zinc-600">{topic.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Block */}
      <section className="py-20 bg-black">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center w-full px-4 sm:px-6 lg:px-8"
          >
            <div className="max-w-5xl mx-auto jj-card-inner border-2 border-gold/30">
              <HelpCircle className="w-12 h-12 text-gold mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black" style={{ fontFamily: "Playfair Display, serif" }}>
                Not sure where to start?
              </h2>
              <p className="text-zinc-600 mb-8 max-w-xl mx-auto">
                Tell us your goal (buy, sell, rent, invest) and we'll route you to the right guide.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <PremiumHeroButton href="/contact" variant="light-bg">
                  Ask a Question
                </PremiumHeroButton>
                <PremiumHeroButton href="/contact?type=support" variant="light-bg">
                  Contact Support
                </PremiumHeroButton>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Guides;
