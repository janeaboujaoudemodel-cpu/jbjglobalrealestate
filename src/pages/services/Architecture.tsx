import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Ruler, Building2, Home, TreePine, Compass, Award } from "lucide-react";
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
    icon: Home,
    title: "Luxury Villa Design",
    description: "Bespoke residential architecture that combines elegance with functionality, creating homes that are both stunning and livable.",
  },
  {
    icon: Building2,
    title: "Commercial Architecture",
    description: "Innovative commercial spaces designed to inspire, from boutique offices to landmark towers.",
  },
  {
    icon: TreePine,
    title: "Sustainable Design",
    description: "Eco-conscious architecture that minimizes environmental impact while maximizing beauty and efficiency.",
  },
  {
    icon: Compass,
    title: "Master Planning",
    description: "Comprehensive urban and community planning that creates cohesive, thriving environments.",
  },
];

const projects = [
  {
    title: "Palm Jumeirah Villa",
    location: "Dubai, UAE",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
    size: "15,000 sq ft",
  },
  {
    title: "Business Bay Tower",
    location: "Dubai, UAE",
    image: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80",
    size: "250,000 sq ft",
  },
  {
    title: "Emirates Hills Estate",
    location: "Dubai, UAE",
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80",
    size: "22,000 sq ft",
  },
];

const Architecture = () => {
  return (
    <section className="relative w-full min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1920&q=80"
            alt="Architecture"
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
              <span className="text-gold font-semibold text-[10px] md:text-xs uppercase tracking-[0.2em]">Architecture Services</span>
            </button>
          </motion.div>

          <motion.h1 
            className="text-white text-4xl md:text-6xl lg:text-7xl font-bold tracking-wide mb-6"
            variants={fadeInUp}
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Visionary{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-gold-light">
              Architecture
            </span>
          </motion.h1>

          <motion.p 
            className="text-zinc-300 text-lg md:text-xl max-w-2xl mx-auto mb-8"
            variants={fadeInUp}
          >
            Creating iconic structures that define skylines and inspire generations.
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
                <span className="text-white group-hover:text-black transition-colors">Start Your Project</span>
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
            <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">What We Offer</span>
            <h2 
              className="text-white text-3xl md:text-4xl font-bold"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Architectural Excellence
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

      {/* Portfolio */}
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
              Featured Projects
            </h2>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {projects.map((project, idx) => (
              <motion.div
                key={idx}
                className="group relative overflow-hidden rounded-2xl aspect-[4/3]"
                variants={fadeInUp}
              >
                <img 
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-white font-bold text-xl mb-1">{project.title}</h3>
                  <p className="text-zinc-400 text-sm">{project.location} • {project.size}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Award className="w-12 h-12 text-gold mx-auto mb-6" />
            <h2 
              className="text-white text-3xl md:text-4xl font-bold mb-6"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Let's Build Your Vision
            </h2>
            <p className="text-zinc-400 mb-8">
              From concept sketches to completed masterpieces, our architects bring your dreams to life.
            </p>
            <a href={CONTACT_INFO.inquiryFormUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="media" className="px-8 py-6 text-base">
                Schedule Consultation
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

export default Architecture;
