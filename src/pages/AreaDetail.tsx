import { useParams, Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  MapPin, ArrowUpRight, Building2, Users, Train, 
  Utensils, ShoppingBag, Palmtree, Heart, ChevronRight,
  Phone, Info
} from "lucide-react";
import Footer from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { getAreaBySlug, AREA_GUIDES } from "@/constants/areaGuides";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const AreaDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const area = slug ? getAreaBySlug(slug) : undefined;

  if (!area) {
    return <Navigate to="/areas" replace />;
  }

  const otherAreas = AREA_GUIDES.filter(a => a.slug !== slug).slice(0, 2);

  return (
    <div className="min-h-screen bg-black">
      <SEOHead 
        title={area.seo.title}
        description={area.seo.description}
        keywords={area.seo.keywords}
        canonicalPath={`/area/${area.slug}`}
      />

      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={area.heroImage} 
            alt={area.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
        </div>
        
        <motion.div 
          className="relative z-10 container mx-auto px-4 pb-16 pt-40"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {/* Breadcrumb */}
          <motion.nav 
            className="flex items-center gap-2 text-sm mb-6"
            variants={fadeInUp}
          >
            <Link to="/" className="text-zinc-400 hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4 text-zinc-600" />
            <Link to="/areas" className="text-zinc-400 hover:text-white transition-colors">Area Guides</Link>
            <ChevronRight className="w-4 h-4 text-zinc-600" />
            <span className="text-gold">{area.name}</span>
          </motion.nav>

          <motion.div 
            className="flex items-center gap-2 mb-4"
            variants={fadeInUp}
          >
            <MapPin className="w-5 h-5 text-gold" />
            <span className="text-gold text-sm uppercase tracking-wider">Dubai, UAE</span>
          </motion.div>
          
          <motion.h1 
            className="text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-6 max-w-3xl"
            style={{ fontFamily: "Poppins, sans-serif" }}
            variants={fadeInUp}
          >
            {area.name}
          </motion.h1>
          
          <motion.p 
            className="text-zinc-300 text-lg md:text-xl max-w-2xl leading-relaxed"
            variants={fadeInUp}
          >
            {area.shortDescription}
          </motion.p>
        </motion.div>
      </section>

      {/* Overview Section - White/Gold Theme */}
      <section className="py-20 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
        <div className="container mx-auto px-4">
          <motion.div 
            className="max-w-4xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.span 
              className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block"
              variants={fadeInUp}
            >
              Overview
            </motion.span>
            <motion.h2 
              className="text-black text-3xl md:text-4xl font-bold mb-8"
              style={{ fontFamily: "Poppins, sans-serif" }}
              variants={fadeInUp}
            >
              About {area.name}
            </motion.h2>
            <motion.div 
              className="bg-white rounded-2xl p-8 border border-gold/30 shadow-lg"
              variants={fadeInUp}
            >
              {area.overview.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className="text-zinc-700 leading-relaxed mb-4 last:mb-0">
                  {paragraph}
                </p>
              ))}
            </motion.div>
            
            {/* Lifestyle */}
            <motion.div 
              className="mt-8 p-8 bg-white border border-gold/30 rounded-2xl shadow-lg"
              variants={fadeInUp}
            >
              <h3 className="text-black text-xl font-bold mb-4 flex items-center gap-3">
                <Heart className="w-5 h-5 text-gold" />
                <span className="text-gold">Lifestyle & Atmosphere</span>
              </h3>
              <p className="text-zinc-700 leading-relaxed">
                {area.lifestyle}
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Location & Connectivity - Black Background with White Cards */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.span 
              className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block"
              variants={fadeInUp}
            >
              Location
            </motion.span>
            <motion.h2 
              className="text-white text-3xl md:text-4xl font-bold mb-12"
              style={{ fontFamily: "Poppins, sans-serif" }}
              variants={fadeInUp}
            >
              Location & Connectivity
            </motion.h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Landmarks - White Card */}
              <motion.div 
                className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/30 rounded-2xl p-8 shadow-lg"
                variants={fadeInUp}
              >
                <h3 className="text-black text-xl font-bold mb-6 flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gold" />
                  <span className="text-gold">Key Landmarks</span>
                </h3>
                <ul className="space-y-4">
                  {area.location.landmarks.map((landmark, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-gold mt-2 flex-shrink-0" />
                      <span className="text-zinc-700">{landmark}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Connectivity - White Card */}
              <motion.div 
                className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/30 rounded-2xl p-8 shadow-lg"
                variants={fadeInUp}
              >
                <h3 className="text-black text-xl font-bold mb-6 flex items-center gap-3">
                  <Train className="w-5 h-5 text-gold" />
                  <span className="text-gold">Connectivity</span>
                </h3>
                <ul className="space-y-4">
                  {area.location.connectivity.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-gold mt-2 flex-shrink-0" />
                      <span className="text-zinc-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Lifestyle & Amenities - White/Champagne Theme */}
      <section className="py-20 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.span 
              className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block"
              variants={fadeInUp}
            >
              Amenities
            </motion.span>
            <motion.h2 
              className="text-black text-3xl md:text-4xl font-bold mb-12"
              style={{ fontFamily: "Poppins, sans-serif" }}
              variants={fadeInUp}
            >
              Lifestyle & Amenities
            </motion.h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {[
                { icon: Utensils, title: "Dining", content: area.amenities.dining },
                { icon: ShoppingBag, title: "Retail & Shopping", content: area.amenities.retail },
                { icon: Palmtree, title: "Leisure & Entertainment", content: area.amenities.leisure },
                { icon: Heart, title: "Wellness & Fitness", content: area.amenities.wellness },
              ].map((amenity, idx) => (
                <motion.div 
                  key={amenity.title}
                  className="bg-white border border-gold/30 rounded-2xl p-8 hover:border-gold hover:shadow-xl transition-all shadow-lg"
                  variants={fadeInUp}
                >
                  <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center mb-4">
                    <amenity.icon className="w-6 h-6 text-gold" />
                  </div>
                  <h3 className="text-gold text-xl font-bold mb-3">{amenity.title}</h3>
                  <p className="text-zinc-700 leading-relaxed">{amenity.content}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Property Types - Black Background with White Cards */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.span 
              className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block"
              variants={fadeInUp}
            >
              Property
            </motion.span>
            <motion.h2 
              className="text-white text-3xl md:text-4xl font-bold mb-12"
              style={{ fontFamily: "Poppins, sans-serif" }}
              variants={fadeInUp}
            >
              Property Types Available
            </motion.h2>
            
            <motion.div 
              className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
              variants={fadeInUp}
            >
              {area.propertyTypes.map((type, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-3 p-4 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/30 rounded-xl shadow-md hover:border-gold hover:shadow-lg transition-all"
                >
                  <Building2 className="w-5 h-5 text-gold flex-shrink-0" />
                  <span className="text-black font-medium">{type}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Who Lives Here - White/Champagne Theme */}
      <section className="py-20 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.span 
              className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block"
              variants={fadeInUp}
            >
              Community
            </motion.span>
            <motion.h2 
              className="text-black text-3xl md:text-4xl font-bold mb-12"
              style={{ fontFamily: "Poppins, sans-serif" }}
              variants={fadeInUp}
            >
              Who Lives Here
            </motion.h2>
            
            <motion.div 
              className="grid sm:grid-cols-2 gap-4 max-w-3xl"
              variants={fadeInUp}
            >
              {area.residents.map((resident, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-3 p-4 bg-white border border-gold/30 rounded-xl shadow-md hover:border-gold hover:shadow-lg transition-all"
                >
                  <Users className="w-5 h-5 text-gold flex-shrink-0" />
                  <span className="text-black font-medium">{resident}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
        <div className="container mx-auto px-4">
          <motion.div 
            className="max-w-4xl mx-auto text-center bg-white rounded-3xl p-12 border border-zinc-200 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 
              className="text-black text-3xl md:text-4xl font-bold mb-4"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Explore Properties in {area.name}
            </h2>
            <p className="text-zinc-600 text-lg mb-8 max-w-2xl mx-auto">
              Browse our collection of premium properties in this neighborhood or speak with our team for personalized guidance.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/properties">
                <Button variant="dark" className="px-8 py-6 text-base">
                  Explore Properties in This Area
                  <ArrowUpRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="secondary" className="border-black text-black hover:bg-black hover:text-white px-8 py-6 text-base">
                  <Phone className="w-5 h-5 mr-2" />
                  Speak With Our Team
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Other Areas - Black Background with White Cards */}
      {otherAreas.length > 0 && (
        <section className="py-20 bg-black">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 
                className="text-white text-2xl md:text-3xl font-bold mb-8 text-center"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Explore Other Areas
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {otherAreas.map((otherArea) => (
                  <Link 
                    key={otherArea.slug}
                    to={`/area/${otherArea.slug}`}
                    className="group block relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/30 hover:border-gold hover:shadow-xl transition-all shadow-lg"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={otherArea.heroImage} 
                        alt={otherArea.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#FDFBF7] via-[#F5F0E6]/40 to-transparent" />
                    </div>
                    <div className="p-6">
                      <h3 className="text-black text-xl font-bold mb-2 group-hover:text-gold transition-colors">
                        {otherArea.name}
                      </h3>
                      <p className="text-zinc-600 text-sm line-clamp-2">{otherArea.shortDescription}</p>
                    </div>
                  </Link>
                ))}
              </div>
              
              <div className="text-center mt-8">
                <Link 
                  to="/areas"
                  className="text-gold hover:text-gold-light transition-colors inline-flex items-center gap-2"
                >
                  View All Area Guides
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Legal Disclaimer */}
      <section className="py-8 border-t border-zinc-900">
        <div className="container mx-auto px-4">
          <div className="flex items-start gap-3 max-w-3xl mx-auto">
            <Info className="w-4 h-4 text-zinc-600 flex-shrink-0 mt-0.5" />
            <p className="text-zinc-600 text-xs leading-relaxed">
              Information provided is for general guidance only and does not constitute legal, financial, or professional advice. 
              Property availability, specifications, and community features are subject to change. 
              Please verify all information independently before making any decisions.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AreaDetail;
