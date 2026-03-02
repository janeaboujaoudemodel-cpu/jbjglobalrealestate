import { motion } from "framer-motion";
import { Quote, MessageCircle, ArrowRight, ShieldCheck, Building2, Sparkles } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { CONTACT_INFO, getWhatsAppUrl } from "@/constants/stats";
import { FeatureReviewPrompt } from "@/components/reviews/FeatureReviewPrompt";

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
  const [searchParams] = useSearchParams();
  const source = searchParams.get("source") || "website";

  const testimonials = [
    {
      name: "Ahmed Khalifa",
      category: "Buyer",
      area: "Downtown Dubai",
      text: "The team gave me a clear shortlisting strategy and handled negotiation with full transparency. I always knew what was happening at every step."
    },
    {
      name: "Sarah Morgan",
      category: "Seller",
      area: "Dubai Marina",
      text: "Our listing campaign was precise and data-backed. Qualified viewings started quickly and we closed with clean documentation."
    },
    {
      name: "Anita Joseph",
      category: "Landlord",
      area: "JVC",
      text: "Tenant screening quality was excellent and communication stayed consistent. The management process is reliable and professional."
    },
    {
      name: "Paolo Leone",
      category: "Investor",
      area: "Business Bay",
      text: "Their market reports and risk framing helped me avoid emotional decisions and focus on long-term portfolio quality."
    },
    {
      name: "Rania Haddad",
      category: "Buyer",
      area: "Palm Jumeirah",
      text: "From first call to transfer day, timelines and documents were controlled properly. Very structured execution."
    },
    {
      name: "Tariq Mansoor",
      category: "Landlord",
      area: "Dubai Hills",
      text: "I appreciate the operational follow-through. Nothing felt improvised; everything had a process and clear ownership."
    }
  ];

  const caseStudies = [
    {
      title: "Downtown Apartment Sale",
      objective: "Quick sale with high-quality buyer pipeline",
      assetType: "2BR Apartment, Downtown Dubai",
      approach: "Professional media, segmented portal strategy, and buyer pre-qualification before viewings.",
      outcome: "Closed in 6 weeks with complete transfer support and minimal negotiation friction."
    },
    {
      title: "4-Unit Portfolio Leasing",
      objective: "Stabilize occupancy and reduce vacancy gaps",
      assetType: "Portfolio across JVC and Business Bay",
      approach: "Centralized screening, synchronized marketing, and staggered lease planning.",
      outcome: "All units occupied within 8 weeks with improved rental consistency."
    },
    {
      title: "Off-Plan Investment Entry",
      objective: "Secure premium unit under efficient payment structure",
      assetType: "1BR Off-Plan, Emaar Beachfront",
      approach: "Developer comparison, payment-plan modeling, and reservation timing optimization.",
      outcome: "Client secured preferred unit configuration with strong long-term upside."
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

      <main className="min-h-screen bg-background">
        <section className="relative pt-28 pb-16 border-b border-border">
          <div className="container mx-auto px-4">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="max-w-5xl mx-auto text-center"
            >
              <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card mb-5">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Verified Reviews & Case Studies</span>
              </motion.div>

              <motion.h1 variants={fadeInUp} className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-5">
                Real Outcomes, Real Process
              </motion.h1>

              <motion.p variants={fadeInUp} className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                A transparent view of how we support buying, selling, renting, and investing journeys across Dubai.
              </motion.p>

              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="font-semibold">
                  <a href={getWhatsAppUrl("Hello, I'd like to speak with your team.")} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Speak to Our Team
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline" className="font-semibold">
                  <Link to="/contact">
                    Contact Us
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section className="py-14">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8 text-center">
              <p className="text-sm text-muted-foreground mb-2">Share your own experience</p>
              <p className="text-foreground font-medium mb-5">Your review helps us keep improving service quality.</p>
              <FeatureReviewPrompt
                featureKey={`reviews-page-${source}`}
                featureLabel="JBJ Client Experience"
                question="How was your experience with JBJ Global Real Estate?"
                trigger={
                  <Button size="lg" className="font-semibold">
                    <Sparkles className="mr-2 h-5 w-5" />
                    Leave a Review
                  </Button>
                }
              />
            </div>
          </div>
        </section>

        <section className="py-16 border-t border-border">
          <div className="container mx-auto px-4">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
              <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-foreground mb-10 text-center">
                Testimonials
              </motion.h2>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {testimonials.map((testimonial, index) => (
                  <motion.div key={index} variants={fadeInUp} className="rounded-2xl border border-border bg-card p-6">
                    <Quote className="w-8 h-8 text-primary mb-4" />
                    <p className="text-foreground mb-6 leading-relaxed">“{testimonial.text}”</p>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-foreground font-semibold">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.area}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full border border-border text-sm font-medium text-foreground bg-background">
                        {testimonial.category}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-16 border-t border-border">
          <div className="container mx-auto px-4">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
              <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-foreground mb-10 text-center">
                Case Studies
              </motion.h2>

              <div className="space-y-6 max-w-4xl mx-auto">
                {caseStudies.map((study, index) => (
                  <motion.div key={index} variants={fadeInUp} className="rounded-2xl border border-border bg-card p-8">
                    <h3 className="text-xl font-semibold text-foreground mb-5 flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      {study.title}
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Objective</p>
                        <p className="text-foreground mb-4">{study.objective}</p>
                        <p className="text-sm text-muted-foreground mb-1">Asset Type & Location</p>
                        <p className="text-foreground">{study.assetType}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Approach</p>
                        <p className="text-foreground mb-4">{study.approach}</p>
                        <p className="text-sm text-muted-foreground mb-1">Outcome</p>
                        <p className="text-foreground font-medium">{study.outcome}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-16 border-t border-border">
          <div className="container mx-auto px-4">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="max-w-3xl mx-auto text-center">
              <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Ready to Get Started?
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-lg text-muted-foreground mb-8">
                Speak with our team and get a tailored next-step plan for your property goals.
              </motion.p>
              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="font-semibold">
                  <Link to="/contact">
                    Contact Us
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="font-semibold">
                  <a href={getWhatsAppUrl("Hello, I'd like to discuss my real estate needs.")} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    WhatsApp Us
                  </a>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section className="py-8 border-t border-border">
          <div className="container mx-auto px-4">
            <p className="text-center text-sm text-muted-foreground max-w-2xl mx-auto">
              Client stories reflect individual experiences and do not guarantee outcomes.
            </p>
          </div>
        </section>
      </main>
    </>
  );
};

export default Reviews;
