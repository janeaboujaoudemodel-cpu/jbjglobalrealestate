import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, ArrowUpRight, Compass, Building2, Users, Home, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { AREA_GUIDES } from "@/constants/areaGuides";
import { GuideNavigation, GUIDE_LINKS, GuideHero, GuideCTA } from "@/components/guides";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 }
  }
};

const AreaGuides = () => {
  const highlights = [
    { icon: Building2, value: "50+", label: "Communities" },
    { icon: Users, value: "200+", label: "Nationalities" },
    { icon: Home, value: "1M+", label: "Properties" },
    { icon: TrendingUp, value: "15%", label: "Avg. Yield" },
  ];

  return (
    <div className="min-h-screen bg-black">
      <SEOHead 
        title="Dubai Communities & Area Guides | Expert Local Insights | JBJ"
        description="Explore Dubai's most desirable neighborhoods with expert local insights. Comprehensive area guides for Downtown Dubai, Dubai Marina, Business Bay, and more premium communities."
        keywords="Dubai area guides, Dubai neighborhoods, Dubai communities, where to live in Dubai, Downtown Dubai guide, Dubai Marina guide, Business Bay guide, Palm Jumeirah"
        canonicalPath="/areas"
      />

      {/* Premium Hero Section */}
      <GuideHero
        badge="Dubai Community Guides"
        badgeIcon={Compass}
        title={
          <>
            Discover Dubai's Premier <br className="hidden md:block" />
            <span className="text-gold">Communities & Neighborhoods</span>
          </>
        }
        description="Expert insights into Dubai's most sought-after residential areas. From waterfront living to urban luxury, find the community that matches your lifestyle."
        backgroundImage="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=2000&q=80"
        actions={
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              variant="outline"
              className="border-gold/50 text-gold hover:bg-gold/10 px-6"
              onClick={() => document.getElementById('area-grid')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Explore All Areas
            </Button>
            <Link to="/properties">
              <Button variant="primary" className="px-6">
                <Building2 className="w-4 h-4 mr-2" />
                View Properties
              </Button>
            </Link>
          </div>
        }
      />

      {/* Stats Bar */}
      <section className="py-8 bg-zinc-900/50 border-y border-zinc-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {highlights.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-black border border-gold rounded-xl mb-3">
                  <item.icon className="w-6 h-6 text-gold" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-white">{item.value}</div>
                <div className="text-sm text-zinc-400">{item.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Area Cards Grid */}
      <section id="area-grid" className="py-20 relative scroll-mt-20">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
              Featured Communities
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Each area offers a unique lifestyle. Click to explore detailed guides with pricing, amenities, and local insights.
            </p>
          </motion.div>

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
                  className="group block relative overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-gold/40 transition-all duration-500 hover:shadow-xl hover:shadow-gold/5"
                >
                  {/* Image */}
                  <div className="relative h-64 overflow-hidden">
                    <img 
                      src={area.heroImage} 
                      alt={area.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                    
                    {/* Hover Arrow */}
                    <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                      <ArrowUpRight className="w-5 h-5 text-gold" />
                    </div>

                    {/* Price Range Badge */}
                    <div className="absolute bottom-4 left-4">
                      <span className="px-3 py-1 bg-black/70 backdrop-blur-sm border border-zinc-700 rounded-full text-xs text-zinc-300">
                        Premium Community
                      </span>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="w-4 h-4 text-gold" />
                      <span className="text-gold text-sm uppercase tracking-wider font-medium">Dubai, UAE</span>
                    </div>
                    
                    <h3 className="text-white text-2xl font-bold mb-3 group-hover:text-gold transition-colors">
                      {area.name}
                    </h3>
                    
                    <p className="text-zinc-400 text-sm leading-relaxed line-clamp-2 mb-4">
                      {area.shortDescription}
                    </p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                      <span className="text-gold text-sm font-medium flex items-center gap-2 group-hover:gap-3 transition-all">
                        Read Full Guide
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full">
              <span className="w-2 h-2 bg-gold rounded-full animate-pulse" />
              <p className="text-zinc-400 text-sm">
                More guides coming soon — Palm Jumeirah, JVC, Dubai Hills Estate, and more.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <GuideCTA
            title="Ready to Find Your Perfect Community?"
            description="Our team specializes in matching homeowners with their ideal Dubai neighborhood. Get personalized recommendations based on your lifestyle and requirements."
            icon={Home}
            primaryAction={{
              label: "Browse Properties",
              href: "/properties",
              icon: Building2
            }}
          />
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
