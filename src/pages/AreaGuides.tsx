import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, ArrowUpRight, Compass } from "lucide-react";
import Footer from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { AREA_GUIDES } from "@/constants/areaGuides";
import { GuideNavigation, GUIDE_LINKS } from "@/components/guides/GuideNavigation";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 }
  }
};

const AreaGuides = () => {
  return (
    <div className="min-h-screen bg-black">
      <SEOHead 
        title="Dubai Communities & Area Guides"
        description="Explore Dubai's most desirable neighborhoods with expert local insights. Comprehensive area guides for Downtown Dubai, Dubai Marina, Business Bay, and more."
        keywords="Dubai area guides, Dubai neighborhoods, Dubai communities, where to live in Dubai, Downtown Dubai guide, Dubai Marina guide, Business Bay guide"
        canonicalPath="/areas"
      />

      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/80 via-black/90 to-black" />
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(ellipse 80% 50% at 50% 0%, hsl(40 30% 50% / 0.15) 0%, transparent 50%)`
          }}
        />
        
        <motion.div 
          className="relative z-10 text-center px-4 max-w-4xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div 
            className="flex items-center justify-center gap-3 mb-6"
            variants={fadeInUp}
          >
            <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
              <Compass className="w-6 h-6 text-gold" />
            </div>
          </motion.div>
          
          <motion.h1 
            className="text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
            style={{ fontFamily: "Poppins, sans-serif" }}
            variants={fadeInUp}
          >
            Dubai Communities<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-gold-light">
              & Area Guides
            </span>
          </motion.h1>
          
          <motion.p 
            className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
            variants={fadeInUp}
          >
            Explore Dubai's most desirable neighborhoods with expert local insights. 
            Discover the lifestyle, amenities, and character that define each community.
          </motion.p>
        </motion.div>
      </section>

      {/* Area Cards Grid */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {AREA_GUIDES.map((area) => (
              <motion.div key={area.slug} variants={fadeInUp}>
                <Link 
                  to={`/area/${area.slug}`}
                  className="group block relative overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-gold/30 transition-all duration-500"
                >
                  {/* Image */}
                  <div className="relative h-64 overflow-hidden">
                    <img 
                      src={area.heroImage} 
                      alt={area.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    
                    {/* Hover Arrow */}
                    <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <ArrowUpRight className="w-5 h-5 text-gold" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="w-4 h-4 text-gold" />
                      <span className="text-gold text-sm uppercase tracking-wider">Dubai, UAE</span>
                    </div>
                    
                    <h3 
                      className="text-white text-2xl font-bold mb-3 group-hover:text-gold transition-colors"
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      {area.name}
                    </h3>
                    
                    <p className="text-zinc-400 text-sm leading-relaxed line-clamp-2">
                      {area.shortDescription}
                    </p>
                    
                    <div className="mt-4 pt-4 border-t border-zinc-800">
                      <span className="text-gold text-sm font-medium flex items-center gap-2 group-hover:gap-3 transition-all">
                        Explore Area Guide
                        <ArrowUpRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* Coming Soon Note */}
          <motion.div 
            className="text-center mt-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-zinc-500 text-sm">
              More area guides coming soon — Palm Jumeirah, JVC, Dubai Hills Estate, and more.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Internal Links Section */}
      <section className="py-16 bg-gradient-to-b from-zinc-900/30 to-black">
        <div className="container mx-auto px-4">
          <motion.div 
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 
              className="text-white text-2xl md:text-3xl font-bold mb-4"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Ready to Explore Properties?
            </h2>
            <p className="text-zinc-400 mb-8">
              Browse our collection of premium properties across Dubai's finest communities.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link 
                to="/properties"
                className="px-6 py-3 bg-gradient-to-r from-gold to-gold-dark text-black font-semibold rounded-lg hover:opacity-90 transition-opacity"
              >
                View All Properties
              </Link>
              <Link 
                to="/contact"
                className="px-6 py-3 border border-zinc-700 text-white rounded-lg hover:border-gold/50 hover:bg-zinc-900 transition-all"
              >
                Speak With Our Team
              </Link>
            </div>
        </motion.div>
        </div>
      </section>

      {/* Guide Navigation */}
      <section className="py-8 border-t border-zinc-800">
        <div className="container mx-auto px-4">
          <GuideNavigation current="/areas" guides={GUIDE_LINKS} showStartHere />
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AreaGuides;
