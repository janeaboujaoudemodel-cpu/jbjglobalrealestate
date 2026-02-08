import { motion } from "framer-motion";
import { Star, Quote, MessageCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { CONTACT_INFO, getWhatsAppUrl } from "@/constants/stats";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const Reviews = () => {
  const testimonials = [
    {
      name: "M.K.",
      category: "Buyer",
      area: "Downtown Dubai",
      text: "The team provided clear guidance throughout the buying process. From shortlisting to handover, every step was explained and documented."
    },
    {
      name: "S.R.",
      category: "Seller",
      area: "Dubai Marina",
      text: "Professional approach to pricing and marketing. The sale was completed within our expected timeline with qualified buyers."
    },
    {
      name: "A.J.",
      category: "Landlord",
      area: "JVC",
      text: "Property management has been hassle-free. Tenant screening was thorough and all renewals handled smoothly."
    },
    {
      name: "P.L.",
      category: "Investor",
      area: "Business Bay",
      text: "The market intelligence reports helped me understand area dynamics before making my investment decision."
    },
    {
      name: "R.H.",
      category: "Buyer",
      area: "Palm Jumeirah",
      text: "Found exactly what we were looking for. The viewing process was efficient and the transfer was coordinated professionally."
    },
    {
      name: "T.M.",
      category: "Landlord",
      area: "Dubai Hills",
      text: "Regular updates on property status and rental market conditions. Transparent fee structure and clear communication."
    }
  ];

  const caseStudies = [
    {
      title: "Downtown Apartment Sale",
      objective: "Quick sale with maximum market exposure",
      assetType: "2BR Apartment, Downtown Dubai",
      approach: "Professional photography, targeted marketing across portals and qualified buyer database, structured viewing schedule.",
      outcome: "Sold within 6 weeks to qualified buyer. Full documentation and transfer coordinated."
    },
    {
      title: "Portfolio Tenant Placement",
      objective: "Tenant placement for 4-unit portfolio",
      assetType: "Mixed portfolio across JVC, Business Bay",
      approach: "Consolidated marketing approach, standardized tenant screening criteria, coordinated viewings.",
      outcome: "All units tenanted within 8 weeks. Staggered lease dates for easier portfolio management."
    },
    {
      title: "Off-Plan Investment Strategy",
      objective: "Entry into off-plan market with structured payment plan",
      assetType: "1BR Off-Plan, Emaar Beachfront",
      approach: "Developer comparison, payment plan analysis, reservation coordination.",
      outcome: "Secured unit with preferred floor and view. Payment schedule aligned with client's cash flow."
    }
  ];

  return (
    <>
      <SEOHead
        title="Reviews & Client Stories | JBJ Global Real Estate"
        description="Real outcomes and client experiences across buying, selling, renting, and investing in Dubai real estate."
        keywords="jbj real estate reviews, dubai real estate testimonials, client stories"
        canonicalPath="/reviews"
      />
      
      <main className="min-h-screen bg-black">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-gold/5 via-transparent to-transparent" />
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="max-w-4xl mx-auto text-center"
            >
              <motion.span
                variants={fadeInUp}
                className="inline-block px-4 py-2 bg-gold/10 border border-gold/30 rounded-full text-gold text-sm font-medium mb-6"
              >
                Reviews & Case Studies
              </motion.span>
              
              <motion.h1
                variants={fadeInUp}
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
              >
                Real Outcomes, Real Process
              </motion.h1>
              
              <motion.p
                variants={fadeInUp}
                className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto"
              >
                A selection of client feedback and transaction stories across buying, selling, renting, and investing.
              </motion.p>
              
              <motion.div
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Button asChild size="lg" className="bg-gold hover:bg-gold/90 text-black font-semibold">
                  <a href={getWhatsAppUrl("Hello, I'd like to speak with your team.")} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Speak to Our Team
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  <Link to="/properties">
                    View Properties
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Testimonials Grid */}
        <section className="py-20 border-t border-zinc-800">
          <div className="container mx-auto px-4">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.h2
                variants={fadeInUp}
                className="text-3xl md:text-4xl font-bold text-white mb-12 text-center"
              >
                Testimonials
              </motion.h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {testimonials.map((testimonial, index) => (
                  <motion.div
                    key={index}
                    variants={fadeInUp}
                    className="jj-card-inner p-6"
                  >
                    <Quote className="w-8 h-8 text-gold/30 mb-4" />
                    <p className="text-zinc-300 mb-6 leading-relaxed">
                      "{testimonial.text}"
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{testimonial.name}</p>
                        <p className="text-zinc-500 text-sm">{testimonial.area}</p>
                      </div>
                      <span className="px-3 py-1 bg-gold/10 border border-gold/30 rounded-full text-gold text-xs">
                        {testimonial.category}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Case Studies */}
        <section className="py-20 border-t border-zinc-800">
          <div className="container mx-auto px-4">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.h2
                variants={fadeInUp}
                className="text-3xl md:text-4xl font-bold text-white mb-12 text-center"
              >
                Case Studies
              </motion.h2>
              
              <div className="space-y-8 max-w-4xl mx-auto">
                {caseStudies.map((study, index) => (
                  <motion.div
                    key={index}
                    variants={fadeInUp}
                    className="jj-card-inner p-8"
                  >
                    <h3 className="text-xl font-semibold text-white mb-6">{study.title}</h3>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-zinc-500 text-sm mb-1">Objective</p>
                        <p className="text-zinc-300 mb-4">{study.objective}</p>
                        
                        <p className="text-zinc-500 text-sm mb-1">Asset Type & Location</p>
                        <p className="text-zinc-300">{study.assetType}</p>
                      </div>
                      
                      <div>
                        <p className="text-zinc-500 text-sm mb-1">Approach</p>
                        <p className="text-zinc-300 mb-4">{study.approach}</p>
                        
                        <p className="text-zinc-500 text-sm mb-1">Outcome</p>
                        <p className="text-gold">{study.outcome}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA Block */}
        <section className="py-20 border-t border-zinc-800">
          <div className="container mx-auto px-4">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="max-w-3xl mx-auto text-center"
            >
              <motion.h2
                variants={fadeInUp}
                className="text-3xl md:text-4xl font-bold text-white mb-4"
              >
                Ready to Start Your Journey?
              </motion.h2>
              
              <motion.p
                variants={fadeInUp}
                className="text-lg text-zinc-400 mb-8"
              >
                Speak to our team about your buying, selling, renting, or investment goals.
              </motion.p>
              
              <motion.div
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Button asChild size="lg" className="bg-gold hover:bg-gold/90 text-black font-semibold">
                  <Link to="/contact">
                    Contact Us
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  <a href={getWhatsAppUrl("Hello, I'd like to discuss my real estate needs.")} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    WhatsApp Us
                  </a>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Footer Notice */}
        <section className="py-8 border-t border-zinc-800">
          <div className="container mx-auto px-4">
            <p className="text-center text-sm text-zinc-500 max-w-2xl mx-auto">
              Client stories reflect individual experiences and do not guarantee outcomes.
            </p>
          </div>
        </section>
      </main>
    </>
  );
};

export default Reviews;
