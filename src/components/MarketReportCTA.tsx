import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, ArrowUpRight } from "lucide-react";
import MarketReportHeroBook from "@/components/MarketReportHeroBook";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
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
          {/* Left: Market Report Book (matches /market-report hero book) */}
          <div className="flex items-center justify-center lg:justify-start">
            <div className="relative">
              {/* Ambient glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-gold/30 via-gold/10 to-transparent blur-3xl rounded-full scale-150 -z-10" />

              <MarketReportHeroBook />
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

            {/* Download Button - Premium 3D Champagne Button */}
            <Link to="/market-report" className="block">
              <button
                className="relative inline-flex items-center justify-center gap-2 px-8 py-6 text-lg font-bold rounded-xl transition-all duration-300 bg-gradient-to-r from-white via-[#FDFBF7] to-[#F5F0E6] border-2 border-gold/50 hover:scale-[1.02] transform active:scale-95 group w-full"
                style={{
                  boxShadow: `
                    0 10px 30px rgba(200,167,102,0.4),
                    0 6px 15px rgba(0,0,0,0.2),
                    inset 0 2px 4px rgba(255,255,255,0.9),
                    inset 0 -2px 4px rgba(200,167,102,0.2),
                    0 0 20px rgba(200,167,102,0.3)
                  `,
                }}
              >
                <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/80 to-transparent pointer-events-none" />
                <span className="absolute inset-x-0 bottom-0 h-1/3 rounded-b-xl bg-gradient-to-t from-gold/10 to-transparent pointer-events-none" />
                <span
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    boxShadow: "0 0 40px rgba(200,167,102,0.6), inset 0 0 20px rgba(200,167,102,0.1)",
                  }}
                />
                <span className="relative flex items-center justify-center gap-2">
                  <span className="text-gold">Download Your Free</span>
                  <span className="text-black">Book Now</span>
                  <ArrowUpRight className="w-5 h-5 text-black" />
                </span>
              </button>
            </Link>

            {/* Powered by - JBJ Global Real Estate links to About */}
            <div className="text-center pt-4 border-t border-zinc-200">
              <p className="text-zinc-600 text-sm mb-1">
                Created by <span className="text-gold font-semibold">The Founder & CEO</span>,{" "}
                <span className="text-zinc-900 font-semibold">Jane Abou Jaoude</span>
              </p>
              <p className="text-zinc-500 text-xs mb-2">
                Exclusive for{" "}
                <Link to="/about" className="text-gold font-semibold hover:underline">
                  JBJ Global Real Estate
                </Link>
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
