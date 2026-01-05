import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  Scale, 
  Palette, 
  Plane, 
  Car, 
  Gem, 
  ArrowUpRight,
  Calculator,
  Home,
  FileSearch,
  Briefcase,
  Shield,
  Users
} from "lucide-react";
import luxuryVillaHero from "@/assets/luxury-villa-hero.jpeg";
import coupleYachtDubai from "@/assets/couple-yacht-dubai.png";
import founderJetInterior from "@/assets/founder-jet-interior.jpeg";
import luxuryVilla1 from "@/assets/luxury-villa-1.jpeg";

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

const services = [
  {
    id: "real-estate",
    title: "Real Estate Investment",
    description: "Premier off-plan and ready property investments across UAE's most sought-after locations.",
    icon: Building2,
    image: luxuryVillaHero,
    link: "/properties",
    features: ["Off-Plan Projects", "Ready Properties", "Investment Advisory", "Portfolio Management"]
  },
  {
    id: "law-firm",
    title: "Legal Services",
    description: "Comprehensive legal support for property transactions, contracts, and corporate matters.",
    icon: Scale,
    image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80",
    link: "/services/law-firm",
    features: ["Property Conveyancing", "Contract Review", "Corporate Law", "Visa Services"]
  },
  {
    id: "design-build",
    title: "Design & Build",
    description: "Bespoke architecture, interior design, and turnkey construction solutions.",
    icon: Palette,
    image: luxuryVilla1,
    link: "/services/design-build",
    features: ["Architecture", "Interior Design", "Fit-Out Services", "Project Management"]
  },
  {
    id: "concierge",
    title: "Luxury Concierge",
    description: "White-glove lifestyle management including jets, yachts, and exclusive experiences.",
    icon: Gem,
    image: coupleYachtDubai,
    link: "/concierge",
    features: ["Private Jets", "Yacht Charters", "Luxury Cars", "VIP Access"]
  },
  {
    id: "mortgage",
    title: "Mortgage Advisory",
    description: "Tailored financing solutions with exclusive rates from leading UAE banks.",
    icon: Calculator,
    image: founderJetInterior,
    link: "/mortgage-advisory",
    features: ["Bank Negotiations", "Pre-Approval", "Rate Comparison", "Financial Planning"]
  },
  {
    id: "property-management",
    title: "Property Management",
    description: "End-to-end management of your investment properties for maximum returns.",
    icon: Home,
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
    link: "/contact",
    features: ["Tenant Sourcing", "Rent Collection", "Maintenance", "Reporting"]
  }
];

const divisions = [
  {
    name: "Maison Jane",
    description: "Luxury Interior Design & Architecture",
    url: "https://maisonjane.ae",
    color: "from-pink-500 to-rose-500"
  },
  {
    name: "JJ Media Group",
    description: "Premium Media & Marketing",
    url: "https://jjmediagroup.ae",
    color: "from-blue-500 to-cyan-500"
  },
  {
    name: "JJ Fashion House",
    description: "Haute Couture & Fashion",
    url: "https://jjfashionhouse.com",
    color: "from-purple-500 to-fuchsia-500"
  }
];

const Services = () => {
  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={luxuryVillaHero} 
            alt="Luxury Services" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black" />
        </div>
        
        <motion.div 
          className="relative z-10 text-center px-4 max-w-4xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.span 
            className="inline-block text-gold text-xs uppercase tracking-[0.4em] mb-6"
            variants={fadeInUp}
          >
            Our Divisions
          </motion.span>
          <motion.h1 
            className="text-white text-4xl md:text-6xl lg:text-7xl font-bold mb-6"
            style={{ fontFamily: "Poppins, sans-serif" }}
            variants={fadeInUp}
          >
            Premium Services
          </motion.h1>
          <motion.p 
            className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto"
            variants={fadeInUp}
          >
            A comprehensive suite of luxury services designed for discerning clients and investors
          </motion.p>
        </motion.div>
      </section>

      {/* Services Grid */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            {services.map((service) => (
              <motion.div
                key={service.id}
                variants={fadeInUp}
                className="group relative overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-gold/50 transition-all duration-500"
              >
                {/* Image */}
                <div className="aspect-[4/3] overflow-hidden">
                  <img 
                    src={service.image} 
                    alt={service.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                </div>
                
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center">
                      <service.icon className="w-6 h-6 text-black" />
                    </div>
                    <h3 className="text-white text-xl font-bold">{service.title}</h3>
                  </div>
                  
                  <p className="text-zinc-400 text-sm mb-4 line-clamp-2">
                    {service.description}
                  </p>
                  
                  {/* Features */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {service.features.slice(0, 3).map((feature) => (
                      <span 
                        key={feature}
                        className="text-xs text-gold/80 bg-gold/10 px-2 py-1 rounded-full border border-gold/20"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                  
                  <Link to={service.link}>
                    <Button 
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 hover:border-gold/50 transition-all"
                    >
                      Explore
                      <ArrowUpRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* AI Tools Section */}
      <section className="py-20 bg-gradient-to-b from-zinc-900/50 to-black">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">Innovation</span>
            <h2 
              className="text-white text-3xl md:text-5xl font-bold mb-4"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              AI-Powered Tools
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Cutting-edge technology to enhance your investment decisions
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "AI Property Comparison", icon: FileSearch, link: "/compare", color: "from-purple-500 to-fuchsia-500" },
              { name: "AI Interior Design", icon: Palette, link: "/interior-design-ai", color: "from-fuchsia-500 to-pink-500" },
              { name: "AI Measurement", icon: Building2, link: "/property-measurement", color: "from-teal-500 to-cyan-500" },
              { name: "Mortgage Advisory", icon: Calculator, link: "/mortgage-advisory", color: "from-blue-500 to-cyan-500" }
            ].map((tool) => (
              <Link key={tool.name} to={tool.link}>
                <motion.div 
                  className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-white/30 transition-all duration-300 group cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4`}>
                    <tool.icon className="w-7 h-7 text-white" />
                  </div>
                  <h4 className="text-white font-semibold mb-2 group-hover:text-gold transition-colors">
                    {tool.name}
                  </h4>
                  <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-gold group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* JJ Holding Group Divisions */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">JJ Holding Group</span>
            <h2 
              className="text-white text-3xl md:text-5xl font-bold mb-4"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Our Divisions
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Explore the full ecosystem of JJ Holding Group brands
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {divisions.map((division) => (
              <motion.a
                key={division.name}
                href={division.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 p-8 hover:border-white/30 transition-all duration-300"
                whileHover={{ scale: 1.02 }}
              >
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${division.color}`} />
                <h3 className="text-white text-2xl font-bold mb-2 group-hover:text-gold transition-colors">
                  {division.name}
                </h3>
                <p className="text-zinc-400 mb-4">{division.description}</p>
                <div className="flex items-center gap-2 text-gold">
                  <span className="text-sm">Visit Website</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-b from-zinc-900/50 to-black">
        <div className="container mx-auto px-4">
          <motion.div 
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 
              className="text-white text-3xl md:text-5xl font-bold mb-6"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Ready to Get Started?
            </h2>
            <p className="text-zinc-400 text-lg mb-8 max-w-2xl mx-auto">
              Connect with our team for personalized guidance on any of our services
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/contact">
                <Button className="bg-gradient-to-r from-gold to-gold-dark text-black font-bold px-8 py-6 text-base hover:opacity-90 transition-opacity">
                  Contact Us
                  <ArrowUpRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/properties">
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-base">
                  Browse Properties
                  <ArrowUpRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Services;