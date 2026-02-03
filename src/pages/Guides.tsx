import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  BookOpen, ArrowRight, HelpCircle
} from "lucide-react";
import Footer from "@/components/Footer";
import DirectContactCTA from "@/components/DirectContactCTA";
import { SEOHead } from "@/components/SEOHead";
import { PremiumHeroButton } from "@/components/ui/premium-hero-button";

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
        description="Explore structured guides designed to answer real questions — with clear steps, fees, and process."
        keywords="Dubai real estate guides, buyer guide, seller guide, landlord guide, tenant guide, golden visa guide"
        canonicalPath="/guides"
      />

      {/* Hero Section */}
      <section className="jj-hero-fullscreen relative flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/60 via-black/80 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold/10 via-transparent to-transparent" />
        
        {/* Decorative books in background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-32 h-48 bg-gold/20 rounded-lg transform -rotate-12" />
          <div className="absolute top-40 right-20 w-28 h-44 bg-gold/15 rounded-lg transform rotate-6" />
          <div className="absolute bottom-32 left-1/4 w-24 h-36 bg-gold/10 rounded-lg transform rotate-3" />
        </div>
        
        <motion.div 
          className="relative z-10 container mx-auto px-4 py-32 text-center max-w-4xl"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div 
            className="flex items-center justify-center gap-2 mb-6"
            variants={fadeInUp}
          >
            <BookOpen className="w-6 h-6 text-gold" />
            <span className="text-gold text-sm uppercase tracking-[0.3em]">
              Guides
            </span>
          </motion.div>

          <motion.h1 
            className="text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-4"
            style={{ fontFamily: "Poppins, sans-serif" }}
            variants={fadeInUp}
          >
            Guides Library
          </motion.h1>

          <motion.p 
            className="text-zinc-300 text-base md:text-lg max-w-3xl mx-auto mb-10"
            variants={fadeInUp}
          >
            Explore structured guides designed to answer real questions — with clear steps, fees, and process.
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4">
            <PremiumHeroButton href="#guides-library" icon={BookOpen}>
              Browse Guides
            </PremiumHeroButton>
            <Link 
              to="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 border-2 border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
              Ask a Question
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Book Shelf Grid */}
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
              <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">
                Our Collection
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black" style={{ fontFamily: "Poppins, sans-serif" }}>
                Premium Guide Collection
              </h2>
              <p className="text-black/70 max-w-2xl mx-auto">
                Each guide is crafted to provide actionable insights and clear processes for your real estate journey.
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

      {/* CTA Section */}
      <section className="py-16 bg-black">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center w-full px-4 sm:px-6 lg:px-8"
          >
            <div className="max-w-2xl mx-auto p-8 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30">
              <BookOpen className="w-12 h-12 text-gold mx-auto mb-4" />
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black" style={{ fontFamily: "Poppins, sans-serif" }}>
                Can't Find What You're Looking For?
              </h2>
              <p className="text-black/70 mb-6">
                Our team is ready to answer your specific questions and provide personalized guidance.
              </p>
              <Link 
                to="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-gold/90 transition-colors"
              >
                <HelpCircle className="w-5 h-5" />
                Ask a Question
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Standardized Direct Contact CTA */}
      <DirectContactCTA />

      <Footer />
    </div>
  );
};

export default Guides;