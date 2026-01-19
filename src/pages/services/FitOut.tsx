import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Hammer, Home, Wrench, Cpu, ClipboardCheck, HardHat } from "lucide-react";
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
    title: "Full Renovations",
    description: "Complete transformation of residential and commercial spaces from concept to completion.",
  },
  {
    icon: Wrench,
    title: "Kitchen & Bath",
    description: "Luxury kitchen and bathroom renovations with premium fixtures and finishes.",
  },
  {
    icon: Cpu,
    title: "Smart Home Integration",
    description: "Cutting-edge home automation systems seamlessly integrated into your space.",
  },
  {
    icon: ClipboardCheck,
    title: "Project Management",
    description: "End-to-end project oversight ensuring quality, timeline, and budget compliance.",
  },
];

const FitOut = () => {
  return (
    <section className="relative w-full min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1920&q=80"
            alt="Fit-Out & Renovation"
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
              <span className="text-gold font-semibold text-[10px] md:text-xs uppercase tracking-[0.2em]">Fit-Out & Renovation</span>
            </button>
          </motion.div>

          <motion.h1 
            className="text-white text-4xl md:text-6xl lg:text-7xl font-bold tracking-wide mb-6"
            variants={fadeInUp}
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Precision{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-gold-light">
              Craftsmanship
            </span>
          </motion.h1>

          <motion.p 
            className="text-zinc-300 text-lg md:text-xl max-w-2xl mx-auto mb-8"
            variants={fadeInUp}
          >
            Turnkey solutions that transform spaces with uncompromising quality and attention to detail.
          </motion.p>

          <motion.div variants={fadeInUp}>
            <a href={CONTACT_INFO.inquiryFormUrl} target="_blank" rel="noopener noreferrer">
              <Button className="bg-gold hover:bg-gold-light text-black font-semibold px-8 py-6 text-base">
                Get a Quote
                <ArrowUpRight className="w-5 h-5 ml-2" />
              </Button>
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
            <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">Our Services</span>
            <h2 
              className="text-white text-3xl md:text-4xl font-bold"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Complete Renovation Solutions
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

      {/* Why Choose Us */}
      <section className="py-20 bg-zinc-950">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">Why Choose Us</span>
              <h2 
                className="text-white text-3xl md:text-4xl font-bold mb-6"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Excellence in Every Detail
              </h2>
              <div className="space-y-4">
                {[
                  { title: "Licensed Contractors", desc: "Fully certified and insured professionals" },
                  { title: "Premium Materials", desc: "Only the finest quality materials and finishes" },
                  { title: "On-Time Delivery", desc: "Strict adherence to project timelines" },
                  { title: "Transparent Pricing", desc: "No hidden costs or surprise expenses" },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-zinc-900/30 border border-zinc-800">
                    <div className="w-2 h-2 rounded-full bg-gold mt-2" />
                    <div>
                      <h3 className="text-white font-semibold">{item.title}</h3>
                      <p className="text-zinc-400 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80"
                alt="Quality Fit-Out"
                className="rounded-2xl w-full aspect-[4/3] object-cover"
              />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/50 to-transparent" />
            </div>
          </div>
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
            <HardHat className="w-12 h-12 text-gold mx-auto mb-6" />
            <h2 
              className="text-white text-3xl md:text-4xl font-bold mb-6"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Ready to Renovate?
            </h2>
            <p className="text-zinc-400 mb-8">
              From minor updates to complete transformations, our team delivers exceptional results every time.
            </p>
            <a href={CONTACT_INFO.inquiryFormUrl} target="_blank" rel="noopener noreferrer">
              <Button className="bg-gold hover:bg-gold-light text-black font-semibold px-8 py-6 text-base">
                Request Free Consultation
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

export default FitOut;
