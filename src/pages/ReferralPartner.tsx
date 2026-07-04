import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Handshake, Users, Building2, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CONTACT_INFO } from "@/constants/stats";
import { SEOHead } from "@/components/SEOHead";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const ReferralPartner = () => {
  return (
    <>
      <SEOHead
        title="Dubai Real Estate Referral Partner Program | JBJ"
        description="Earn commission by referring buyers, sellers, and investors to JBJ Global Real Estate. Transparent payouts, RERA-licensed brokerage, dedicated partner support."
        canonicalPath="/referral-partner"
      />
    <div className="min-h-screen bg-gradient-to-br from-[hsl(32,28%,13%)] via-[hsl(33,27%,15%)] to-[hsl(33,28%,11%)]">
      {/* Hero Section */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 to-black" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#EFE6D6]/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="text-center max-w-4xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
          >
            <span className="inline-flex items-center gap-2 text-[#1A1A1A] text-xs uppercase tracking-[0.4em] mb-6">
              <Handshake className="w-4 h-4" />
              Partner Program
            </span>
            <h1 
              className="text-white text-4xl md:text-6xl font-bold mb-6"
            >
              Referral <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-gold-light">Partner Program</span>
            </h1>
            <p className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto mb-8">
              Collaborate with JBJ Global Real Estate by referring clients interested in UAE real estate.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Program Details */}
      <section className="py-16 bg-[#FDFBF7]">
        <div className="container mx-auto px-4">
          <motion.div 
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="bg-gradient-to-br from-zinc-900 to-black border border-[#1A1A1A] rounded-2xl p-8 md:p-12">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 bg-gradient-to-br from-gold/20 to-gold/5 rounded-xl flex items-center justify-center border border-[#B89555]/30">
                  <Users className="w-7 h-7 text-[#1A1A1A]" />
                </div>
                <div>
                  <h2 className="text-white text-2xl font-bold">How It Works</h2>
                  <p className="text-white/90">Simple and straightforward</p>
                </div>
              </div>

              <div className="space-y-6 mb-10">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-5 h-5 text-[#1A1A1A] mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-white font-semibold mb-1">Refer a Client</h3>
                    <p className="text-white/70">
                      Introduce us to individuals or companies interested in buying, selling, or renting property in the UAE.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-5 h-5 text-[#1A1A1A] mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-white font-semibold mb-1">We Handle the Transaction</h3>
                    <p className="text-white/70">
                      Our team manages the entire brokerage process with professionalism and discretion.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-5 h-5 text-[#1A1A1A] mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-white font-semibold mb-1">Referral Arrangement</h3>
                    <p className="text-white/70">
                      Referral fees may apply subject to a written agreement and compliance with applicable laws.
                    </p>
                  </div>
                </div>
              </div>

              {/* Compliance Notice */}
              <div className="bg-[#F7F2EA]/50 border border-[#1A1A1A] rounded-xl p-6 mb-8">
                <h4 className="text-[#1A1A1A] font-semibold text-sm uppercase tracking-wider mb-3">Important Notice</h4>
                <p className="text-white/70 text-sm leading-relaxed">
                  Partners are independent and responsible for compliance with regulations in their own jurisdictions. 
                  This program does not constitute an employment relationship. All arrangements are subject to a formal 
                  written agreement between parties.
                </p>
              </div>

              <div className="text-center">
                <a href={`mailto:${CONTACT_INFO.email}?subject=Referral Partner Inquiry`}>
                  <Button className="bg-gradient-to-r from-gold to-gold-dark text-[#1A1A1A] font-semibold px-8 py-6 text-base">
                    Inquire About Partnership
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </a>
                <p className="text-white/90 text-sm mt-4">
                  Contact us at {CONTACT_INFO.email}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default ReferralPartner;
