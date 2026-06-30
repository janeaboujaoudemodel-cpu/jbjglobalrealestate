import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  PenTool, Building2, Compass, Layers, Award,
  ChevronLeft, ArrowRight, CheckCircle, MapPin
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CONTACT_INFO } from "@/constants/stats";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

// Split title helper
const SplitTitle = ({ text }: { text: string }) => {
  const words = text.split(' ');
  const firstWord = words[0];
  const restWords = words.slice(1).join(' ');
  
  return (
    <span className="jj-title-split">
      <span>{firstWord}</span>{restWords && <span> {restWords}</span>}
    </span>
  );
};

const services = [
  {
    icon: Compass,
    title: "Concept Design",
    description: "Transform your vision into architectural concepts that inspire and innovate.",
    features: ["Site Analysis", "Feasibility Studies", "Initial Sketches", "3D Visualization"]
  },
  {
    icon: Layers,
    title: "Technical Design",
    description: "Detailed technical drawings and specifications for construction.",
    features: ["Construction Drawings", "Structural Planning", "MEP Coordination", "Material Selection"]
  },
  {
    icon: Building2,
    title: "Project Management",
    description: "End-to-end project oversight ensuring quality and timely delivery.",
    features: ["Timeline Management", "Quality Control", "Contractor Coordination", "Budget Oversight"]
  },
  {
    icon: Award,
    title: "Sustainability",
    description: "Eco-friendly design solutions for a sustainable future.",
    features: ["Green Building", "Energy Efficiency", "LEED Certification", "Sustainable Materials"]
  }
];

const portfolio = [
  {
    title: "Marina Residence",
    location: "Dubai Marina",
    size: "15,000 sqft",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80"
  },
  {
    title: "Palm Villa",
    location: "Palm Jumeirah",
    size: "12,000 sqft",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80"
  },
  {
    title: "Downtown Tower",
    location: "Downtown Dubai",
    size: "50,000 sqft",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80"
  }
];

const Architecture = () => {
  return (
    <div data-marketing-page className="min-h-screen bg-gradient-to-br from-[hsl(32,28%,13%)] via-[hsl(33,27%,15%)] to-[hsl(33,28%,11%)]">
      <SEOHead 
        title="Architecture Services Dubai | Design & Build | JBJ GLOBAL REAL ESTATE"
        description="Visionary architecture services in Dubai. Concept design, technical drawings, project management, and sustainable building solutions. Partner with licensed architects."
        keywords="Dubai architecture, architectural design Dubai, building design, sustainable architecture, villa design Dubai"
        canonicalPath="/services/architecture"
      />

      {/* Hero Section */}
      <section className="jj-hero-fullscreen jj-hero-compact relative flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&q=80" 
            alt="Architecture"
            className="w-full h-full object-cover opacity-30"
           loading="lazy" decoding="async" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/80 to-black" />
        </div>
        
        <motion.div 
          className="relative z-10 container mx-auto px-4 py-32"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp}>
            <Link 
              to="/services/design-build" 
              className="inline-flex items-center gap-2 text-[#1A1A1A] hover:text-white transition-colors mb-6"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Design & Build
            </Link>
          </motion.div>

          <motion.div 
            className="flex items-center gap-2 mb-6"
            variants={fadeInUp}
          >
            <PenTool className="w-6 h-6 text-[#1A1A1A]" />
            <span className="text-[#1A1A1A] text-sm uppercase tracking-[0.3em]">
              Partner Network
            </span>
          </motion.div>

          <motion.h1 
            className="text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-6 max-w-4xl"
            variants={fadeInUp}
          >
            Visionary Architecture
          </motion.h1>

          <motion.p 
            className="text-white/70 text-lg md:text-xl max-w-2xl mb-8"
            variants={fadeInUp}
          >
            Partner with licensed architects to bring your vision to life. 
            From concept to completion.
          </motion.p>

          <motion.div variants={fadeInUp}>
            <Button variant="primary" size="lg" asChild>
              <a href={CONTACT_INFO.inquiryFormUrl} target="_blank" rel="noopener noreferrer">
                <span className="text-[#1A1A1A]">Start Your</span><span className="text-[#1A1A1A]"> Project</span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </a>
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Services - 3-Layer System */}
      <section className="py-16 bg-[#1A1A1A]">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div className="text-center mb-12" variants={fadeInUp}>
              <SectionEyebrow className="mb-4">Our Services</SectionEyebrow>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                <SplitTitle text="Architectural Excellence" />
              </h2>
              <p className="text-[#1A1A1A]/70 max-w-2xl mx-auto">
                Comprehensive architectural services for residential and commercial projects.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {services.map((service, index) => (
                <motion.div key={service.title} variants={fadeInUp}>
                  <Card className="jj-card-inner hover:border-white transition-all group h-full">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-xl bg-[#1A1A1A] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <service.icon className="w-7 h-7 text-[#1A1A1A]" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-[#1A1A1A] font-semibold text-xl mb-2 group-hover:text-[#1A1A1A] transition-colors">
                            {service.title}
                          </h3>
                          <p className="text-[#1A1A1A]/70 text-sm mb-4">
                            {service.description}
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {service.features.map((feature) => (
                              <div key={feature} className="flex items-center gap-2 text-xs text-[#1A1A1A]/60">
                                <CheckCircle className="w-3 h-3 text-[#1A1A1A]" />
                                {feature}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Portfolio - 3-Layer System */}
      <section className="py-16 bg-[#1A1A1A]">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div className="text-center mb-12" variants={fadeInUp}>
              <SectionEyebrow className="mb-4">Portfolio</SectionEyebrow>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                <SplitTitle text="Featured Projects" />
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {portfolio.map((project, index) => (
                <motion.div key={project.title} variants={fadeInUp}>
                  <Card className="jj-card-inner overflow-hidden group h-full">
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={project.image} 
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                       loading="lazy" decoding="async" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="text-[#1A1A1A] font-semibold text-lg mb-1">
                        {project.title}
                      </h3>
                      <div className="flex items-center gap-1 text-[#1A1A1A]/60 text-sm mb-1">
                        <MapPin className="w-3 h-3" />
                        {project.location}
                      </div>
                      <p className="text-[#1A1A1A] text-sm font-medium">
                        {project.size}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section - 3-Layer System */}
      <section className="py-16 bg-[#1A1A1A]">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center"
          >
            <div className="jj-card-inner rounded-2xl p-8 md:p-12 max-w-3xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                <SplitTitle text="Let's Build Your Vision" />
              </h2>
              <p className="text-[#1A1A1A]/70 mb-8 max-w-xl mx-auto">
                Ready to transform your architectural vision into reality? 
                Connect with our partner architects today.
              </p>
              <Button variant="primary" size="lg" asChild>
                <a href={CONTACT_INFO.inquiryFormUrl} target="_blank" rel="noopener noreferrer">
                  <span className="text-[#1A1A1A]">Schedule</span><span className="text-[#1A1A1A]"> Consultation</span>
                  <ArrowRight className="w-5 h-5 ml-2" />
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Global CTA handled by MainLayout */}
    </div>
  );
};

export default Architecture;
