import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowUpRight, 
  Ruler, 
  Paintbrush, 
  Home, 
  Building2, 
  Layers, 
  Hammer,
  Users,
  Sparkles,
  Camera,
  Calendar,
  Phone,
  MessageCircle
} from "lucide-react";
import { CONTACT_INFO } from "@/constants/stats";

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

const services = [
  {
    slug: "architecture",
    title: "Architecture",
    description: "Bespoke architectural design for luxury residences and commercial spaces",
    icon: Ruler,
    image: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=800&q=80",
    features: ["Custom Villa Design", "Commercial Architecture", "Master Planning", "Sustainable Design"],
  },
  {
    slug: "interior-design",
    title: "Interior Design",
    description: "Curated interiors that reflect sophistication and personal style",
    icon: Paintbrush,
    image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&q=80",
    features: ["Luxury Residential", "Hospitality Design", "Furniture Curation", "Art Consultation"],
  },
  {
    slug: "fit-out",
    title: "Fit-Out & Renovation",
    description: "Complete turnkey solutions for transforming spaces into masterpieces",
    icon: Hammer,
    image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80",
    features: ["Full Renovations", "Kitchen & Bath", "Smart Home Integration", "Project Management"],
  },
];

const aiTools = [
  {
    id: "interior-designer",
    title: "AI Interior Designer",
    description: "Design your space with AI-powered visualization and style recommendations",
    icon: Paintbrush,
    link: "/interior-design-ai",
    badge: "AI-Powered",
    cta: "Start Designing with AI",
  },
  {
    id: "property-measurement",
    title: "AI Property Measurement",
    description: "Measure your property accurately with intelligent room analysis",
    icon: Ruler,
    link: "/property-measurement",
    badge: "Precision Tool",
    cta: "Measure Your Property",
  },
];

const DesignBuild = () => {
  return (
    <section data-marketing-page className="relative w-full min-h-screen bg-[#FDFBF7]">
      {/* Hero Section - Premium Video Background */}
      <div className="jj-hero-fullscreen jj-hero-compact relative flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="w-full h-full object-cover"
            poster="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80"
          >
            <source 
              src="https://videos.pexels.com/video-files/3129671/3129671-uhd_2560_1440_30fps.mp4" 
              type="video/mp4" 
            />
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
        </div>

        <motion.div 
          className="relative z-10 text-center px-4 max-w-4xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp}>
            <button 
              className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-6 cursor-default"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(200,167,102,0.08) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1.5px solid rgba(200,167,102,0.6)',
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1), inset 0 -1px 2px rgba(0,0,0,0.2), 0 4px 20px rgba(0,0,0,0.3)',
              }}
            >
              <span className="text-[#B89555] font-semibold text-[10px] md:text-xs uppercase tracking-[0.2em]">Through Our Licensed Partners</span>
            </button>
          </motion.div>

          <motion.h1 
            className="text-white text-4xl md:text-6xl lg:text-7xl font-bold tracking-wide mb-6"
            variants={fadeInUp}
          >
            Creating{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-gold-light">
              Exceptional Spaces
            </span>
          </motion.h1>

          <motion.p 
            className="text-white/85 text-lg md:text-xl max-w-2xl mx-auto mb-8"
            variants={fadeInUp}
          >
            From concept to completion, our licensed partners deliver architectural excellence, interior sophistication, and premium fit-out solutions.
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-wrap gap-4 justify-center">
            <a href={CONTACT_INFO.inquiryFormUrl} target="_blank" rel="noopener noreferrer">
              <button 
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-5 text-base font-bold rounded-xl transition-all duration-300 bg-transparent"
                style={{
                  border: '2px solid rgba(255,255,255,0.8)',
                  boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -1px 2px rgba(0,0,0,0.3), 0 4px 15px rgba(0,0,0,0.4)',
                }}
              >
                <Calendar className="w-5 h-5 text-[#1A1A1A] transition-colors" style={{ filter: 'drop-shadow(0 0 6px rgba(200,167,102,0.8))' }} />
                <span className="text-white group-hover:text-[#1A1A1A] transition-colors">Book a Consultation</span>
                <ArrowUpRight className="w-5 h-5 text-[#1A1A1A] transition-colors" style={{ filter: 'drop-shadow(0 0 6px rgba(200,167,102,0.8))' }} />
                {/* Hover fill overlay */}
                <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 hover:bg-[#1A1A1A] hover:text-white hover:[&_svg]:text-[#B89555] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(184,149,85,0.35)] transition-all duration-300" style={{ border: '2px solid rgba(200,167,102,0.6)' }} />
              </button>
            </a>
          </motion.div>
        </motion.div>
      </div>

      {/* Partner Badge Section */}
      <section className="py-8 bg-gradient-to-r from-gold/10 via-gold/5 to-gold/10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-6 flex-wrap">
            <div className="flex items-center gap-2 text-[#1A1A1A]">
              <Users className="w-5 h-5" />
              <span className="text-sm font-medium uppercase tracking-wider">Through Our Licensed Partners</span>
            </div>
            <div className="h-4 w-px bg-[#EFE6D6]/30 hidden md:block" />
            <span className="text-white/70 text-sm">Architecture • Interior Design • Fit-Out & Renovation</span>
          </div>
        </div>
      </section>

      {/* Services Grid - White Pearl/Champagne Gold Cards */}
      <section className="py-20 bg-[#1A1A1A]">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-[#1A1A1A] text-xs uppercase tracking-[0.3em] mb-4 block">Our Services</span>
            <h2 
              className="text-white text-3xl md:text-4xl font-bold mb-4"
            >
              Comprehensive Design Solutions
            </h2>
            <p className="text-white/70 max-w-2xl mx-auto">
              Through our network of licensed partners, access world-class design and construction services
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {services.map((service) => (
              <motion.div
                key={service.slug}
                className="group"
                variants={fadeInUp}
              >
                <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border border-[#B89555]/30 hover:border-[#B89555] hover:shadow-[0_0_30px_rgba(200,167,102,0.3)] transition-all duration-500 overflow-hidden h-full">
                  {/* Image */}
                  <div className="relative h-56 overflow-hidden">
                    <img 
                      src={service.image}
                      alt={service.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                     loading="lazy" decoding="async" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    <div className="absolute top-4 left-4 w-12 h-12 rounded-xl bg-[#1A1A1A] flex items-center justify-center border border-[#B89555]/30">
                      <service.icon className="w-6 h-6 text-[#1A1A1A]" />
                    </div>

                    <Badge className="absolute top-4 right-4 bg-[#EFE6D6]/20 text-[#1A1A1A] border-[#B89555]/40 backdrop-blur-sm">
                      <Users className="w-3 h-3 mr-1" />
                      Partner Service
                    </Badge>
                  </div>

                  {/* Content */}
                  <CardContent className="p-6">
                    <h3 
                      className="text-[#1A1A1A] text-2xl font-bold mb-3 group-hover:text-[#1A1A1A] transition-colors"
                    >
                      {service.title}
                    </h3>
                    <p className="text-[#1A1A1A]/70 text-sm mb-6">
                      {service.description}
                    </p>

                    <ul className="space-y-2 mb-6">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-[#1A1A1A]/70 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#EFE6D6]" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <Link to={`/services/${service.slug}`}>
                      <Button className="w-full bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] text-[#1A1A1A] border-2 border-[#B89555]/60 shadow-[0_8px_30px_rgba(200,167,102,0.3),0_4px_15px_rgba(0,0,0,0.1)] hover:bg-[#1A1A1A] hover:text-[#1A1A1A] hover:border-[#B89555] hover:shadow-[0_8px_40px_rgba(200,167,102,0.5)] font-semibold transition-all duration-300">
                        Explore {service.title}
                        <ArrowUpRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* AI Tools Section - Go Premium Alone */}
      <section className="py-20 bg-gradient-to-b from-black via-zinc-950 to-black border-t border-[#B89555]/20">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/40 mb-4">
              <Sparkles className="w-3 h-3 mr-1" />
              AI-Powered Tools
            </Badge>
            <h2 
              className="text-white text-3xl md:text-4xl font-bold mb-4"
            >
              Go Premium <span className="text-[#1A1A1A]">On Your Own</span>
            </h2>
            <p className="text-white/70 max-w-2xl mx-auto">
              Design and measure your space with AI before consulting with our partners
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {aiTools.map((tool) => (
              <motion.div key={tool.id} variants={fadeInUp}>
                <Link to={tool.link} className="block group">
                  <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border border-[#B89555]/30 hover:border-[#B89555] hover:shadow-[0_0_40px_rgba(200,167,102,0.4)] transition-all duration-300 h-full">
                    <CardContent className="p-8">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-14 h-14 rounded-xl bg-[#1A1A1A] flex items-center justify-center border border-[#B89555]/30 group-hover:scale-110 transition-transform">
                          <tool.icon className="w-7 h-7 text-[#1A1A1A]" />
                        </div>
                        <div className="flex-1">
                          <Badge className="bg-purple-500/20 text-purple-600 border-purple-400/40 mb-2">
                            {tool.badge}
                          </Badge>
                          <h3 className="text-[#1A1A1A] text-xl font-bold group-hover:text-[#1A1A1A] transition-colors">
                            {tool.title}
                          </h3>
                        </div>
                      </div>
                      <p className="text-[#1A1A1A]/70 mb-6">{tool.description}</p>
                      <Button className="w-full bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] text-[#1A1A1A] border-2 border-[#B89555]/60 shadow-[0_8px_30px_rgba(200,167,102,0.3),0_4px_15px_rgba(0,0,0,0.1)] hover:bg-[#1A1A1A] hover:text-[#1A1A1A] hover:border-[#B89555] hover:shadow-[0_8px_40px_rgba(200,167,102,0.5)] font-semibold transition-all duration-300">
                        {tool.cta}
                        <ArrowUpRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section - 3-Layer System */}
      <section className="py-16 md:py-20 bg-[#1A1A1A]">
        <div className="container mx-auto px-4">
          <div className="max-w-[1100px] mx-auto">
            {/* OUTER CARD (Active Champagne) */}
            <div className="bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border border-[#B89555]/30 rounded-2xl sm:rounded-3xl p-2 sm:p-3">
              {/* INNER CARD (Champagne) */}
              <motion.div
                className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40 rounded-xl sm:rounded-2xl p-8 md:p-12 shadow-[0_0_30px_rgba(200,167,102,0.25)] text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Badge className="bg-[#EFE6D6]/20 text-[#1A1A1A] border-[#B89555]/40 mb-4">
                  <Users className="w-3 h-3 mr-1" />
                  Through Our Partners
                </Badge>
                <h2 
                  className="text-[#1A1A1A] text-2xl md:text-3xl font-bold mb-4"
                >
                  Ready to Transform <span className="text-[#1A1A1A]">Your Space?</span>
                </h2>
                <p className="text-[#1A1A1A]/70 mb-8 max-w-xl mx-auto">
                  Book a consultation with our licensed partners now. Our expert network is ready to bring your vision to life.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <a href={CONTACT_INFO.inquiryFormUrl} target="_blank" rel="noopener noreferrer">
                    <button 
                      className="relative inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold rounded-xl transition-all duration-300 hover:scale-[1.02] group"
                      style={{
                        background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 25%, #F7F2EA 50%, #E8DFD0 75%, #B89555 100%)',
                        boxShadow: `
                          0 10px 30px rgba(200,167,102,0.4),
                          0 6px 15px rgba(0,0,0,0.2),
                          inset 0 2px 4px rgba(255,255,255,0.9),
                          inset 0 -2px 4px rgba(200,167,102,0.2),
                          0 0 20px rgba(200,167,102,0.3)
                        `,
                      }}
                    >
                      <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/80 to-transparent pointer-events-none" />
                      <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: '0 0 40px rgba(200,167,102,0.6), inset 0 0 20px rgba(200,167,102,0.1)' }} />
                      <span className="relative flex items-center gap-1">
                        <Calendar className="w-5 h-5 text-[#1A1A1A] group-hover:text-[#1A1A1A] transition-colors" />
                        <span className="text-[#1A1A1A] group-hover:text-[#1A1A1A] transition-colors">Book a</span>
                        <span className="text-[#1A1A1A] group-hover:text-[#1A1A1A] transition-colors">Consultation</span>
                        <ArrowUpRight className="w-5 h-5 text-[#1A1A1A] group-hover:text-[#1A1A1A] transition-colors" />
                      </span>
                    </button>
                  </a>
                  <a href={`https://wa.me/${CONTACT_INFO.phone.replace(/\D/g, '')}?text=Hello, I'm interested in Design & Build services.`} target="_blank" rel="noopener noreferrer">
                    <button className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold rounded-xl transition-all duration-300 bg-transparent border-2 border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white">
                      <MessageCircle className="w-5 h-5" />
                      WhatsApp Us
                    </button>
                  </a>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Global CTA handled by MainLayout */}
    </section>
  );
};

export default DesignBuild;
