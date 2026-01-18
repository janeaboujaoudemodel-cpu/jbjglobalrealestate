import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Book3D from "@/components/Book3D";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const MarketReportCTA = () => {
  const benefits = [
    "Structured market overview (educational)",
    "Developer & community comparison frameworks",
    "Investment due diligence checklist",
    "Complimentary AI Home Finder access",
    "Expert insights from the founder",
  ];

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={fadeInUp}
      className="relative"
    >
      {/* Premium White Frame Container */}
      <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl shadow-black/50">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left: Enhanced 3D Book Component */}
          <div className="flex items-center justify-center lg:justify-start">
            <div className="relative">
              {/* Ambient glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-gold/30 via-gold/10 to-transparent blur-3xl rounded-full scale-150 -z-10" />
              
              {/* Enhanced 3D Book with dramatic flip */}
              <Book3D size="lg" />
              
              {/* Free Download Badge */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="absolute -bottom-3 -right-2 md:right-4 bg-gradient-to-br from-gold to-gold-dark text-black px-5 py-2.5 rounded-full shadow-xl shadow-gold/30"
              >
                <span className="text-xs font-bold uppercase tracking-wider">Free Download</span>
              </motion.div>
            </div>
          </div>

          {/* Right: What You'll Receive */}
          <div className="space-y-6">
            {/* What You'll Receive Card */}
            <div className="bg-zinc-100 rounded-2xl p-6 md:p-8">
              <h3 
                className="text-zinc-900 text-2xl md:text-3xl font-bold mb-6"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                What You'll Receive
              </h3>
              
              <ul className="space-y-4">
                {benefits.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                    <span className="text-zinc-700 text-base md:text-lg">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Download Button */}
            <Link to="/market-report" className="block">
              <Button 
                variant="dark"
                className="w-full px-8 py-7 text-lg"
              >
                Download Your Free Book Now
                <ArrowUpRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            
            {/* Powered by - Creative Dubai branding */}
            <div className="text-center pt-4 border-t border-zinc-200">
              <p className="text-zinc-600 text-sm mb-1">
                Created by <span className="text-gold font-semibold">The Founder & CEO</span>, <span className="text-zinc-900 font-semibold">Jane Abou Jaoude</span>
              </p>
              <p className="text-zinc-500 text-xs mb-2">
                Exclusive for <span className="text-gold font-semibold">JBJ Global Real Estate</span>
              </p>
              <p className="text-zinc-400 text-[10px] uppercase tracking-widest">
                Real Estate Brokerage • Dubai, UAE
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MarketReportCTA;