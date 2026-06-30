import { SectionEyebrow } from "@/components/ui/SectionEyebrow";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Palette, Sofa, Lightbulb, Layers, Sparkles,
  ChevronLeft, ArrowRight, CheckCircle
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
    icon: Palette,
    title: "Concept Development",
    description: "Create cohesive design concepts that reflect your personal style and lifestyle needs.",
    features: ["Mood Boards", "Color Schemes", "Material Selection", "Style Direction"]
  },
  {
    icon: Sofa,
    title: "Space Planning",
    description: "Optimize your space for functionality, flow, and aesthetic appeal.",
    features: ["Layout Design", "Furniture Planning", "Traffic Flow", "Zoning"]
  },
  {
    icon: Lightbulb,
    title: "Lighting Design",
    description: "Create ambiance and functionality with expert lighting solutions.",
    features: ["Natural Light", "Ambient Lighting", "Task Lighting", "Accent Lighting"]
  },
  {
    icon: Layers,
    title: "FF&E Selection",
    description: "Curated furniture, fixtures, and equipment selection for every space.",
    features: ["Furniture Sourcing", "Custom Pieces", "Art Curation", "Accessories"]
  }
];

const portfolio = [
  {
    title: "Penthouse Suite",
    style: "Contemporary Luxury",
    image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80"
  },
  {
    title: "Family Villa",
    style: "Modern Arabic",
    image: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&q=80"
  },
  {
    title: "Executive Office",
    style: "Minimalist",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80"
  }
];

const process = [
  { step: "01", title: "Consultation", description: "Understand your vision and requirements" },
  { step: "02", title: "Concept Design", description: "Develop design concepts and mood boards" },
  { step: "03", title: "Development", description: "Detailed design and specifications" },
  { step: "04", title: "Implementation", description: "Procurement and installation" }
];

const InteriorDesign = () => {
  return (
    <div data-marketing-page className="min-h-screen bg-gradient-to-br from-[hsl(32,28%,13%)] via-[hsl(33,27%,15%)] to-[hsl(33,28%,11%)]">
      <SEOHead 
        title="Interior Design Services Dubai | Luxury Interiors | JBJ GLOBAL REAL ESTATE"
        description="Premium interior design services in Dubai. Concept development, space planning, lighting design, and FF&E selection. Transform your space with expert designers."
        keywords="Dubai interior design, luxury interiors, home design Dubai, interior decorator, residential interior design"
        canonicalPath="/services/interior-design"
      />

      {/* Hero Section */}
      <section className="jj-hero-fullscreen jj-hero-compact relative flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80" 
            alt="Interior Design"
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
            <Palette className="w-6 h-6 text-[#1A1A1A]" />
            <span className="text-[#1A1A1A] text-sm uppercase tracking-[0.3em]">
              Partner Network
            </span>
          </motion.div>

          <motion.h1 
            className="text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-6 max-w-4xl"
            variants={fadeInUp}
          >
            Interior Design
          </motion.h1>

          <motion.p 
            className="text-white/70 text-lg md:text-xl max-w-2xl mb-8"
            variants={fadeInUp}
          >
            Transform your space into a reflection of your lifestyle. 
            Premium interior design by licensed professionals.
          </motion.p>

          <motion.div variants={fadeInUp}>
            <Button variant="primary" size="lg" asChild>
              <a href={CONTACT_INFO.inquiryFormUrl} target="_blank" rel="noopener noreferrer">
                <span className="text-[#1A1A1A]">Book a</span><span className="text-[#1A1A1A]"> Consultation</span>
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
                <SplitTitle text="Design Services" />
              </h2>
              <p className="text-[#1A1A1A]/70 max-w-2xl mx-auto">
                Comprehensive interior design services for residential and commercial spaces.
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
                <SplitTitle text="Our Work" />
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {portfolio.map((project, index) => (
                <motion.div key={project.title} variants={fadeInUp}>
                  <Card className="jj-card-inner overflow-hidden group h-full">
                    <div className="relative h-64 overflow-hidden">
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
                      <p className="text-[#1A1A1A] text-sm">
                        {project.style}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Process - 3-Layer System */}
      <section className="py-16 bg-[#1A1A1A]">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div className="text-center mb-12" variants={fadeInUp}>
              <SectionEyebrow className="mb-4">How We Work</SectionEyebrow>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                <SplitTitle text="Our Process" />
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-4 gap-6">
              {process.map((item, index) => (
                <motion.div key={item.step} variants={fadeInUp}>
                  <Card className="jj-card-inner h-full">
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl font-bold text-[#1A1A1A] mb-4">
                        {item.step}
                      </div>
                      <h3 className="text-[#1A1A1A] font-semibold text-lg mb-2">
                        {item.title}
                      </h3>
                      <p className="text-[#1A1A1A]/70 text-sm">
                        {item.description}
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
              <div className="flex items-center justify-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-[#1A1A1A]" />
                <span className="text-[#1A1A1A] text-sm uppercase tracking-wider">Try AI First</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                <SplitTitle text="Visualize Your Space" />
              </h2>
              <p className="text-[#1A1A1A]/70 mb-8 max-w-xl mx-auto">
                Try our AI Interior Designer to visualize concepts, 
                then connect with our partner designers for full implementation.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button variant="primary" size="lg" asChild>
                  <Link to="/tools/interior-ai">
                    <Sparkles className="w-5 h-5 mr-2" />
                    <span className="text-[#1A1A1A]">Try AI</span><span className="text-[#1A1A1A]"> Designer</span>
                  </Link>
                </Button>
                <Button variant="secondary" size="lg" asChild>
                  <a href={CONTACT_INFO.inquiryFormUrl} target="_blank" rel="noopener noreferrer">
                    Book Consultation
                  </a>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default InteriorDesign;
