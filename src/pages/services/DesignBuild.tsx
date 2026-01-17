import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Ruler, Paintbrush, Home, Building2, Layers, Hammer } from "lucide-react";
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

const DesignBuild = () => {
  return (
    <section className="relative w-full min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative h-[60vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80"
            alt="Design & Build"
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
            <span className="inline-flex items-center gap-2 text-gold text-xs md:text-sm uppercase tracking-[0.4em] mb-6">
              <Layers className="w-4 h-4" />
              Design & Build Division
            </span>
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
            className="text-zinc-300 text-lg md:text-xl max-w-2xl mx-auto"
            variants={fadeInUp}
          >
            From concept to completion, we deliver architectural excellence and interior sophistication.
          </motion.p>
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
              Comprehensive Design Solutions
            </h2>
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
                className="group relative overflow-hidden rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-gold/30 transition-all duration-500"
                variants={fadeInUp}
              >
                {/* Image */}
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                  
                  <div className="absolute top-4 left-4 w-12 h-12 rounded-xl bg-gold/20 backdrop-blur-sm border border-gold/30 flex items-center justify-center">
                    <service.icon className="w-6 h-6 text-gold" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 
                    className="text-white text-2xl font-bold mb-3 group-hover:text-gold transition-colors"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    {service.title}
                  </h3>
                  <p className="text-zinc-400 text-sm mb-6">
                    {service.description}
                  </p>

                  <ul className="space-y-2 mb-6">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-zinc-300 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Link to={`/services/${service.slug}`}>
                    <Button variant="primary" className="w-full">
                      Explore {service.title}
                      <ArrowUpRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">Start Your Project</span>
            <h2 
              className="text-white text-3xl md:text-4xl font-bold mb-6"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Ready to Transform Your Space?
            </h2>
            <p className="text-zinc-400 mb-8">
              Our design experts are ready to bring your vision to life. Schedule a consultation today.
            </p>
            <a href={CONTACT_INFO.inquiryFormUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="primary" className="px-8 py-6 text-base">
                Request Consultation
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

export default DesignBuild;
