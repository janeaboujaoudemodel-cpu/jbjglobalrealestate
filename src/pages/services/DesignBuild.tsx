import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";
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
    link: "/interior-design-studio",
    badge: "AI-Powered",
  },
  {
    id: "property-measurement",
    title: "AI Property Measurement",
    description: "Measure your property accurately with intelligent room analysis",
    icon: Ruler,
    link: "/property-measurement",
    badge: "Precision Tool",
  },
];

const DesignBuild = () => {
  return (
    <section className="relative w-full min-h-screen bg-black">
      {/* Hero Section - Premium Video Background */}
      <div className="relative h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden">
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
            <Badge className="bg-gold/20 text-gold border-gold/40 mb-6">
              <Users className="w-3 h-3 mr-1" />
              Through Our Licensed Partners
            </Badge>
          </motion.div>

          <motion.h1 
            className="text-white text-4xl md:text-6xl lg:text-7xl font-bold tracking-wide mb-6"
            variants={fadeInUp}
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Creating{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-gold-light">
              Exceptional Spaces
            </span>
          </motion.h1>

          <motion.p 
            className="text-zinc-300 text-lg md:text-xl max-w-2xl mx-auto mb-8"
            variants={fadeInUp}
          >
            From concept to completion, our licensed partners deliver architectural excellence, interior sophistication, and premium fit-out solutions.
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-wrap gap-4 justify-center">
            <a href={CONTACT_INFO.inquiryFormUrl} target="_blank" rel="noopener noreferrer">
              <Button className="bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] text-black border-2 border-gold/60 shadow-[0_8px_30px_rgba(200,167,102,0.4),0_4px_15px_rgba(0,0,0,0.2)] hover:bg-black hover:text-gold hover:border-gold hover:shadow-[0_8px_40px_rgba(200,167,102,0.6)] px-8 py-6 text-base font-semibold transition-all duration-300">
                <Calendar className="w-5 h-5 mr-2" />
                Book a Consultation
                <ArrowUpRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
          </motion.div>
        </motion.div>
      </div>

      {/* Partner Badge Section */}
      <section className="py-8 bg-gradient-to-r from-gold/10 via-gold/5 to-gold/10 border-y border-gold/20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-6 flex-wrap">
            <div className="flex items-center gap-2 text-gold">
              <Users className="w-5 h-5" />
              <span className="text-sm font-medium uppercase tracking-wider">Through Our Licensed Partners</span>
            </div>
            <div className="h-4 w-px bg-gold/30 hidden md:block" />
            <span className="text-zinc-400 text-sm">Architecture • Interior Design • Fit-Out & Renovation</span>
          </div>
        </div>
      </section>

      {/* Services Grid - White Pearl/Champagne Gold Cards */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">Our Services</span>
            <h2 
              className="text-white text-3xl md:text-4xl font-bold mb-4"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Comprehensive Design Solutions
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
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
                <Card className="bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] border border-gold/30 hover:border-gold hover:shadow-[0_0_30px_rgba(200,167,102,0.3)] transition-all duration-500 overflow-hidden h-full">
                  {/* Image */}
                  <div className="relative h-56 overflow-hidden">
                    <img 
                      src={service.image}
                      alt={service.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    <div className="absolute top-4 left-4 w-12 h-12 rounded-xl bg-black flex items-center justify-center border border-gold/30">
                      <service.icon className="w-6 h-6 text-gold" />
                    </div>

                    <Badge className="absolute top-4 right-4 bg-gold/20 text-gold border-gold/40 backdrop-blur-sm">
                      <Users className="w-3 h-3 mr-1" />
                      Partner Service
                    </Badge>
                  </div>

                  {/* Content */}
                  <CardContent className="p-6">
                    <h3 
                      className="text-black text-2xl font-bold mb-3 group-hover:text-gold transition-colors"
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      {service.title}
                    </h3>
                    <p className="text-zinc-600 text-sm mb-6">
                      {service.description}
                    </p>

                    <ul className="space-y-2 mb-6">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-zinc-700 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <Link to={`/services/${service.slug}`}>
                      <Button className="w-full bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] text-black border-2 border-gold/60 shadow-[0_8px_30px_rgba(200,167,102,0.3),0_4px_15px_rgba(0,0,0,0.1)] hover:bg-black hover:text-gold hover:border-gold hover:shadow-[0_8px_40px_rgba(200,167,102,0.5)] font-semibold transition-all duration-300">
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
      <section className="py-20 bg-gradient-to-b from-black via-zinc-950 to-black border-t border-gold/20">
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
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Go Premium <span className="text-gold">On Your Own</span>
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
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
                  <Card className="bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] border border-gold/30 hover:border-gold hover:shadow-[0_0_40px_rgba(200,167,102,0.4)] transition-all duration-300 h-full">
                    <CardContent className="p-8">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-14 h-14 rounded-xl bg-black flex items-center justify-center border border-gold/30 group-hover:scale-110 transition-transform">
                          <tool.icon className="w-7 h-7 text-gold" />
                        </div>
                        <div className="flex-1">
                          <Badge className="bg-purple-500/20 text-purple-600 border-purple-400/40 mb-2">
                            {tool.badge}
                          </Badge>
                          <h3 className="text-black text-xl font-bold group-hover:text-gold transition-colors">
                            {tool.title}
                          </h3>
                        </div>
                      </div>
                      <p className="text-zinc-600 mb-6">{tool.description}</p>
                      <Button className="w-full bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] text-black border-2 border-gold/60 shadow-[0_8px_30px_rgba(200,167,102,0.3),0_4px_15px_rgba(0,0,0,0.1)] hover:bg-black hover:text-gold hover:border-gold hover:shadow-[0_8px_40px_rgba(200,167,102,0.5)] font-semibold transition-all duration-300">
                        {tool.id === "interior-designer" ? "Design Your Space with AI" : "Measure Your Property with AI"}
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

      {/* CTA Section - Book Consultation with Licensed Partners */}
      <section className="py-20 bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6]">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge className="bg-gold/20 text-gold border-gold/40 mb-4">
              <Users className="w-3 h-3 mr-1" />
              Through Our Partners
            </Badge>
            <h2 
              className="text-black text-3xl md:text-4xl font-bold mb-6"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Ready to Transform Your Space?
            </h2>
            <p className="text-zinc-600 mb-8">
              Book a consultation with our licensed partners now. Our expert network is ready to bring your vision to life.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href={CONTACT_INFO.inquiryFormUrl} target="_blank" rel="noopener noreferrer">
                <Button className="bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] text-black border-2 border-gold/60 shadow-[0_8px_30px_rgba(200,167,102,0.4),0_4px_15px_rgba(0,0,0,0.2)] hover:bg-black hover:text-gold hover:border-gold hover:shadow-[0_8px_40px_rgba(200,167,102,0.6)] px-8 py-6 text-base font-semibold transition-all duration-300">
                  <Calendar className="w-5 h-5 mr-2" />
                  Book a Consultation
                  <ArrowUpRight className="w-5 h-5 ml-2" />
                </Button>
              </a>
              <a href={`https://wa.me/${CONTACT_INFO.phone.replace(/\D/g, '')}?text=Hello, I'm interested in Design & Build services.`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="border-2 border-black text-black hover:bg-black hover:text-white px-8 py-6 text-base font-semibold transition-all duration-300">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  WhatsApp Us
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </section>
  );
};

export default DesignBuild;
