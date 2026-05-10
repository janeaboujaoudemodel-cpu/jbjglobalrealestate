import { useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight, MessageCircle, Home } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { getWhatsAppUrl } from "@/constants/stats";

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

interface ConfirmationContent {
  title: string;
  message: string;
  nextSteps: string[];
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}

const getConfirmationContent = (type: string | null): ConfirmationContent => {
  switch (type) {
    case "valuation":
      return {
        title: "Valuation Request Received",
        message: "Your valuation request has been received. We'll review your details and contact you with next steps.",
        nextSteps: [
          "Our team will review the property details",
          "We'll confirm any additional documents needed",
          "You'll receive a valuation range and recommended positioning approach"
        ],
        primaryCta: { label: "Back to Home", href: "/" },
        secondaryCta: { label: "Explore Properties", href: "/properties" }
      };
    case "landlord":
      return {
        title: "Rental Listing Request Received",
        message: "Your rental listing request has been received. We'll review your details and coordinate the next steps.",
        nextSteps: [
          "Our team will review the property details",
          "We'll validate rental positioning and target tenant profile",
          "You'll be contacted to confirm listing activation"
        ],
        primaryCta: { label: "Back to Home", href: "/" },
        secondaryCta: { label: "View Property Management", href: "/services/property-management" }
      };
    case "investor":
      return {
        title: "Investor Profile Received",
        message: "Your investor profile has been received. We'll review it and activate access accordingly.",
        nextSteps: [
          "Your profile will be reviewed by our investment team",
          "We'll match you with suitable opportunities",
          "You'll receive access to investor tools and reports"
        ],
        primaryCta: { label: "Back to Home", href: "/" },
        secondaryCta: { label: "Explore Market Intelligence", href: "/market-intelligence" }
      };
    case "viewing":
      return {
        title: "Viewing Request Received",
        message: "Your viewing request has been submitted. Our team will contact you to confirm the schedule.",
        nextSteps: [
          "We'll check availability with the property owner",
          "You'll receive a confirmation with viewing details",
          "Our agent will meet you at the property"
        ],
        primaryCta: { label: "Browse More Properties", href: "/properties" },
        secondaryCta: { label: "Contact Us", href: "/contact" }
      };
    case "contact":
      return {
        title: "Message Received",
        message: "Thank you for reaching out. Our team will review your message and respond shortly.",
        nextSteps: [
          "Your inquiry has been logged in our system",
          "A team member will be assigned to assist you",
          "You'll receive a response within 24 hours"
        ],
        primaryCta: { label: "Back to Home", href: "/" },
        secondaryCta: { label: "Explore Services", href: "/services" }
      };
    case "buyer-inquiry":
      return {
        title: "Inquiry Received",
        message: "Your property inquiry has been received. Our team will contact you with tailored options.",
        nextSteps: [
          "We'll review your requirements",
          "A curated shortlist will be prepared",
          "You'll receive viewing recommendations"
        ],
        primaryCta: { label: "Browse Properties", href: "/properties" },
        secondaryCta: { label: "Contact Us", href: "/contact" }
      };
    default:
      return {
        title: "Thank You",
        message: "Your submission has been received. Our team will review it and get back to you shortly.",
        nextSteps: [
          "Your request has been logged",
          "A team member will review your submission",
          "You'll be contacted via your preferred method"
        ],
        primaryCta: { label: "Back to Home", href: "/" },
        secondaryCta: { label: "Contact Us", href: "/contact" }
      };
  }
};

const ThankYou = () => {
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") || searchParams.get("source");
  const content = getConfirmationContent(type);

  // Track thank you page view
  useEffect(() => {
    // Analytics event could be fired here
    console.log("thank_you_view", { type });
  }, [type]);

  return (
    <>
      <SEOHead
        title="Thank You | JBJ Global Real Estate"
        description="Thank you for your submission. Our team will review and respond shortly."
        canonicalPath="/thank-you"
        noIndex={true}
      />
      
      <main className="min-h-screen bg-gradient-to-br from-[hsl(32,28%,13%)] via-[hsl(33,27%,15%)] to-[hsl(33,28%,11%)] flex items-center">
        <section className="w-full py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="max-w-2xl mx-auto text-center"
            >
              {/* Success Icon */}
              <motion.div
                variants={fadeInUp}
                className="mb-8"
              >
                <div className="w-20 h-20 bg-green-500/10 border-2 border-green-500/30 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
              </motion.div>

              {/* Title */}
              <motion.h1
                variants={fadeInUp}
                className="text-3xl md:text-4xl font-bold text-white mb-4"
              >
                {content.title}
              </motion.h1>

              {/* Message */}
              <motion.p
                variants={fadeInUp}
                className="text-lg text-[#1A1A1A]/70 mb-8"
              >
                {content.message}
              </motion.p>

              {/* Next Steps */}
              <motion.div
                variants={fadeInUp}
                className="jj-card-inner p-6 mb-8 text-left"
              >
                <h2 className="text-lg font-semibold text-white mb-4">What Happens Next</h2>
                <ul className="space-y-3">
                  {content.nextSteps.map((step, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-[#EFE6D6]/10 border border-[#B89555]/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[#1A1A1A] text-xs font-bold">{index + 1}</span>
                      </div>
                      <span className="text-[#1A1A1A]/70">{step}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* CTAs */}
              <motion.div
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Button asChild size="lg" className="bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A] font-semibold">
                  <Link to={content.primaryCta.href}>
                    <Home className="mr-2 h-5 w-5" />
                    {content.primaryCta.label}
                  </Link>
                </Button>
                
                {content.secondaryCta && (
                  <Button asChild size="lg" variant="outline" className="border-white/20 text-white hover:bg-[#FDFBF7]/10">
                    <Link to={content.secondaryCta.href}>
                      {content.secondaryCta.label}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                )}
              </motion.div>

              {/* WhatsApp CTA */}
              <motion.div
                variants={fadeInUp}
                className="mt-8"
              >
                <a
                  href={getWhatsAppUrl("Hello, I just submitted a request and have a question.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Need immediate assistance? WhatsApp us</span>
                </a>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  );
};

export default ThankYou;
