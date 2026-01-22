import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Paintbrush, Sofa, Lamp, Frame, Palette, Sparkles } from "lucide-react";
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
    icon: Sofa,
    title: "Luxury Residential",
    description: "Transform your home into a sanctuary of style with bespoke interior design tailored to your lifestyle.",
  },
  {
    icon: Lamp,
    title: "Hospitality Design",
    description: "Create memorable guest experiences through innovative hotel and restaurant interior concepts.",
  },
  {
    icon: Frame,
    title: "Art Consultation",
    description: "Curate exceptional art collections that complement your space and express your personal aesthetic.",
  },
  {
    icon: Palette,
    title: "Furniture Curation",
    description: "Source and customize premium furniture pieces from the world's finest artisans and manufacturers.",
  },
];

const portfolio = [
  {
    title: "Penthouse Suite",
    style: "Contemporary Minimalist",
    image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&q=80",
  },
  {
    title: "Villa Living Room",
    style: "Modern Arabic Fusion",
    image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80",
  },
  {
    title: "Master Bedroom",
    style: "Luxury Contemporary",
    image: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&q=80",
  },
  {
    title: "Dining Experience",
    style: "Elegant Traditional",
    image: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&q=80",
  },
];

const InteriorDesign = () => {
  return (
    <section className="relative w-full min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1920&q=80"
            alt="Interior Design"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40" />
        </div>

        <motion.div 
          className="relative z-10 text-center px-4 max-w-4xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp}>
            <Link to="/services/design-build" className="inline-flex items-center gap-2 text-zinc-400 text-xs uppercase tracking-[0.2em] mb-4 hover:text-gold transition-colors">
              ← Back to Design & Build
            </Link>
          </motion.div>

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
              <span className="w-2 h-2 bg-gold rounded-full animate-pulse" />
              <span className="text-gold font-semibold text-[10px] md:text-xs uppercase tracking-[0.2em]">Interior Design Services</span>
            </button>
          </motion.div>

          <motion.h1 
            className="text-white text-4xl md:text-6xl lg:text-7xl font-bold tracking-wide mb-6"
            variants={fadeInUp}
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Curated{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-gold-light">
              Interiors
            </span>
          </motion.h1>

          <motion.p 
            className="text-zinc-300 text-lg md:text-xl max-w-2xl mx-auto mb-8"
            variants={fadeInUp}
          >
            Where artistry meets functionality to create spaces that inspire and delight.
          </motion.p>

          <motion.div variants={fadeInUp}>
            <a href={CONTACT_INFO.inquiryFormUrl} target="_blank" rel="noopener noreferrer">
              <button 
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-5 text-base font-bold rounded-xl transition-all duration-300 bg-transparent"
                style={{
                  border: '2px solid rgba(255,255,255,0.8)',
                  boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -1px 2px rgba(0,0,0,0.3), 0 4px 15px rgba(0,0,0,0.4)',
                }}
              >
                <span className="text-white group-hover:text-black transition-colors">Book a Consultation</span>
                <ArrowUpRight className="w-5 h-5 text-gold transition-colors" style={{ filter: 'drop-shadow(0 0 6px rgba(200,167,102,0.8))' }} />
                {/* Hover fill overlay */}
                <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" style={{ border: '2px solid rgba(200,167,102,0.6)' }} />
              </button>
            </a>
          </motion.div>
        </motion.div>
      </div>

      {/* Services Grid */}
      <section className="py-20 bg-gradient-to-b from-black to-zinc-950">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">Our Expertise</span>
            <h2 
              className="text-white text-3xl md:text-4xl font-bold"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Design Services
            </h2>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {services.map((service, idx) => (
              <motion.div
                key={idx}
                className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-gold/30 transition-all"
                variants={fadeInUp}
              >
                <div className="w-14 h-14 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-4">
                  <service.icon className="w-7 h-7 text-gold" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{service.title}</h3>
                <p className="text-zinc-400 text-sm">{service.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Portfolio Gallery */}
      <section className="py-20 bg-zinc-950">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">Portfolio</span>
            <h2 
              className="text-white text-3xl md:text-4xl font-bold"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Our Work
            </h2>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {portfolio.map((item, idx) => (
              <motion.div
                key={idx}
                className="group relative overflow-hidden rounded-2xl aspect-[16/10]"
                variants={fadeInUp}
              >
                <img 
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-white font-bold text-xl mb-1">{item.title}</h3>
                  <p className="text-gold text-sm">{item.style}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">Our Process</span>
            <h2 
              className="text-white text-3xl md:text-4xl font-bold"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              How We Work
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {["Discovery", "Concept", "Design", "Delivery"].map((step, idx) => (
              <div key={step} className="text-center">
                <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-4">
                  <span className="text-gold text-2xl font-bold">{idx + 1}</span>
                </div>
                <h3 className="text-white font-semibold mb-2">{step}</h3>
                <p className="text-zinc-500 text-sm">
                  {idx === 0 && "Understanding your vision and requirements"}
                  {idx === 1 && "Creating mood boards and initial concepts"}
                  {idx === 2 && "Detailed design development and sourcing"}
                  {idx === 3 && "Implementation and final styling"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-b from-black to-zinc-950">
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
              Transform Your Space
            </h2>
            <p className="text-zinc-400 mb-8">
              Let our award-winning designers create an interior that reflects your unique style and elevates your everyday life.
            </p>
            <a href={CONTACT_INFO.inquiryFormUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="primary" className="px-8 py-6 text-base">
                Start Your Design Journey
                <ArrowUpRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
          </motion.div>
        </div>
      </section>

      <Footer />
    </section>
  );
};

export default InteriorDesign;
