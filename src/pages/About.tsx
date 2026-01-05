import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Award, Users, Building2, Globe, Target, Shield, ArrowUpRight, Sparkles, CheckCircle } from "lucide-react";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useCountUp } from "@/hooks/useCountUp";
import { COMPANY_STATS } from "@/constants/stats";
import founderProfessional from "@/assets/founder-professional.jpeg";
import luxuryVillaHero from "@/assets/luxury-villa-hero.jpeg";
import coupleYachtDubai from "@/assets/couple-yacht-dubai.png";

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

const CounterStat = ({ end, suffix, prefix, label }: { end: number; suffix: string; prefix: string; label: string }) => {
  const { ref, formattedValue } = useCountUp({ end, suffix, prefix, duration: 2500 });

  return (
    <div ref={ref} className="text-center p-8 bg-zinc-900/50 rounded-2xl border border-zinc-800">
      <p 
        className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-gold-light to-gold text-4xl md:text-5xl font-bold mb-3" 
        style={{ fontFamily: "Poppins, sans-serif" }}
      >
        {formattedValue}
      </p>
      <p className="text-zinc-400 text-sm uppercase tracking-wider">{label}</p>
    </div>
  );
};

const About = () => {
  const stats = [
    COMPANY_STATS.portfolioValue,
    COMPANY_STATS.yearsExperience,
    COMPANY_STATS.propertiesSold,
    COMPANY_STATS.propertiesManaged,
  ];

  const values = [
    {
      icon: Shield,
      title: "Trust & Integrity",
      description: "We build lasting relationships founded on transparency, honesty, and unwavering commitment to our clients' best interests.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Target,
      title: "Excellence",
      description: "Every transaction is handled with meticulous attention to detail, ensuring exceptional outcomes for our distinguished clientele.",
      color: "from-purple-500 to-fuchsia-500"
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Our international network connects investors worldwide to the UAE's most exclusive opportunities.",
      color: "from-gold to-gold-dark"
    },
  ];

  const milestones = [
    { year: "2018", event: "JJ Global Capital Founded in Dubai" },
    { year: "2019", event: "Expanded to Abu Dhabi Market" },
    { year: "2020", event: "Launched Concierge Division" },
    { year: "2021", event: "Reached $500M in Portfolio Value" },
    { year: "2022", event: "Opened International Offices" },
    { year: "2023", event: "Launched AI-Powered Investment Tools" },
    { year: "2024", event: "Celebrated 1,000+ Properties Sold" },
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={luxuryVillaHero} 
            alt="About JJ Global Capital" 
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
            About Us
          </motion.span>
          <motion.h1 
            className="text-white text-4xl md:text-6xl lg:text-7xl font-bold mb-6"
            style={{ fontFamily: "Poppins, sans-serif" }}
            variants={fadeInUp}
          >
            Redefining Luxury<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-gold-light">
              Investment in the UAE
            </span>
          </motion.h1>
          <motion.p 
            className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto"
            variants={fadeInUp}
          >
            JJ Global Capital stands as the UAE's premier investment advisory, trusted by discerning investors 
            worldwide to navigate the region's most lucrative opportunities.
          </motion.p>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-20 relative overflow-hidden">
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, hsl(40 32% 51% / 0.08) 0%, transparent 60%)",
          }}
        />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="grid grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {stats.map((stat) => (
              <motion.div key={stat.label} variants={fadeInUp}>
                <CounterStat {...stat} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">Our Story</span>
              <h2 
                className="text-white text-3xl md:text-5xl font-bold mb-6"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Built on Vision,<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-gold-light">
                  Driven by Results
                </span>
              </h2>
              <div className="space-y-5 text-zinc-400 leading-relaxed">
                <p>
                  Founded in the heart of Dubai, JJ Global Capital emerged from a singular vision: to provide 
                  ultra-high-net-worth individuals with unparalleled access to the UAE's most exclusive investment opportunities.
                </p>
                <p>
                  Our team of seasoned professionals brings together decades of experience in real estate, 
                  finance, and luxury services, creating a holistic approach to wealth management that 
                  transcends traditional boundaries.
                </p>
                <p>
                  Today, we are proud to be recognized as the region's most trusted investment advisory, 
                  serving clients from over 92 countries who entrust us with their most significant financial decisions.
                </p>
              </div>
              
              <Link to="/founder">
                <Button className="mt-8 bg-gradient-to-r from-gold to-gold-dark text-black font-semibold hover:opacity-90">
                  Meet Our Founder
                  <ArrowUpRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="aspect-[4/5] rounded-2xl overflow-hidden">
                <img 
                  src={founderProfessional} 
                  alt="Jane Abou Jaoude - Founder" 
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-zinc-900 border border-gold/30 rounded-xl p-6 max-w-xs">
                <p className="text-gold font-semibold mb-1">Jane Abou Jaoude</p>
                <p className="text-zinc-400 text-sm">Founder & CEO, JJ Global Capital</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gradient-to-b from-zinc-900/50 to-black">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">Our Values</span>
            <h2 
              className="text-white text-3xl md:text-5xl font-bold"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              The Pillars of Our Success
            </h2>
          </motion.div>
          
          <motion.div 
            className="grid md:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {values.map((value) => (
              <motion.div 
                key={value.title}
                className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 hover:border-gold/30 transition-all duration-300 group"
                variants={fadeInUp}
              >
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${value.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <value.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-white text-xl font-bold mb-3">{value.title}</h3>
                <p className="text-zinc-400 leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">Our Journey</span>
            <h2 
              className="text-white text-3xl md:text-5xl font-bold"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Milestones & Achievements
            </h2>
          </motion.div>
          
          <motion.div 
            className="max-w-3xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {milestones.map((milestone, index) => (
              <motion.div 
                key={milestone.year}
                className="flex items-start gap-6 mb-8"
                variants={fadeInUp}
              >
                <div className="flex-shrink-0 w-20 text-right">
                  <span className="text-gold font-bold text-lg">{milestone.year}</span>
                </div>
                <div className="relative flex-shrink-0">
                  <div className="w-4 h-4 rounded-full bg-gold" />
                  {index < milestones.length - 1 && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-px h-12 bg-gold/30" />
                  )}
                </div>
                <div className="flex-1 pb-8">
                  <p className="text-white font-medium">{milestone.event}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-20 bg-gradient-to-b from-zinc-900/50 to-black">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="aspect-video rounded-2xl overflow-hidden">
                <img 
                  src={coupleYachtDubai} 
                  alt="Luxury Lifestyle" 
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">What We Offer</span>
              <h2 
                className="text-white text-3xl md:text-4xl font-bold mb-6"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Comprehensive Services
              </h2>
              
              <div className="space-y-4 mb-8">
                {[
                  "Premium Real Estate Investment Advisory",
                  "Luxury Concierge & Lifestyle Management",
                  "Legal Services & Property Conveyancing",
                  "Interior Design & Architecture",
                  "Mortgage & Financial Advisory"
                ].map((service) => (
                  <div key={service} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0" />
                    <span className="text-zinc-300">{service}</span>
                  </div>
                ))}
              </div>
              
              <Link to="/services">
                <Button className="bg-gradient-to-r from-gold to-gold-dark text-black font-semibold hover:opacity-90">
                  Explore Our Services
                  <ArrowUpRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div 
            className="max-w-4xl mx-auto text-center bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-3xl p-12 border border-gold/20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Sparkles className="w-12 h-12 text-gold mx-auto mb-6" />
            <h2 
              className="text-white text-3xl md:text-4xl font-bold mb-4"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Ready to Start Your Investment Journey?
            </h2>
            <p className="text-zinc-400 text-lg mb-8 max-w-2xl mx-auto">
              Connect with our expert team for personalized guidance on UAE real estate investments
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/contact">
                <Button className="bg-gradient-to-r from-gold to-gold-dark text-black font-bold px-8 py-6 text-base hover:opacity-90">
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

export default About;