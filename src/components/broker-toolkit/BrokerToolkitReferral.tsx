import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import jbjMonogramDarkBg from "@/assets/jbj-monogram-dark-bg.png";
import {
  DollarSign, GraduationCap, Briefcase, Award, Globe,
  Handshake, ArrowRight, ArrowUpRight, Sparkles
} from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

export function BrokerToolkitReferral() {
  return (
    <section className="py-8 md:py-10 bg-black">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/30 rounded-2xl p-6 md:p-10">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-2 px-5 py-2 bg-black border-2 border-gold/50 rounded-full shadow-lg mb-4">
              <DollarSign className="w-3.5 h-3.5 text-gold" />
              <span className="text-white text-xs uppercase tracking-wider font-medium">Earn With Us</span>
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-black mb-2">
              Make Money by Joining <span className="text-gold">JBJ Global Real Estate Circle</span>
            </h2>
            <p className="text-zinc-600 max-w-3xl mx-auto">
              From anywhere in the world, you can become a broker with us, or you can become a referral partner and start earning commission on every successful deal.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 hover:border-gold shadow-lg hover:shadow-[0_0_30px_rgba(200,167,102,0.3)] transition-all duration-300 h-full flex flex-col">
                <CardContent className="p-6 flex flex-col flex-1">
                  <div className="w-14 h-14 rounded-xl bg-transparent border-2 border-gold/40 flex items-center justify-center mb-4">
                    <GraduationCap className="w-7 h-7 text-gold" />
                  </div>
                  <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30 mb-3 w-fit">For JBJ Employees</Badge>
                  <h3 className="text-black text-xl font-bold mb-2">JBJ Academy</h3>
                  <p className="text-zinc-600 mb-4 flex-1">Professional training, video tutorials, and internal certifications for JBJ Global Real Estate employees.</p>
                  <Link to="/broker-toolkit" className="inline-flex items-center gap-2 text-gold font-semibold hover:gap-3 transition-all mt-auto">
                    Access Academy <ArrowRight className="w-4 h-4" />
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 hover:border-gold shadow-lg hover:shadow-[0_0_30px_rgba(200,167,102,0.3)] transition-all duration-300 h-full flex flex-col">
                <CardContent className="p-6 flex flex-col flex-1">
                  <div className="w-14 h-14 rounded-xl bg-transparent border-2 border-gold/40 flex items-center justify-center mb-4">
                    <Briefcase className="w-7 h-7 text-gold" />
                  </div>
                  <Badge className="bg-purple-500/20 text-purple-600 border-purple-500/30 mb-3 w-fit">For Job Seekers</Badge>
                  <h3 className="text-black text-xl font-bold mb-2">JBJ Employment Hub</h3>
                  <p className="text-zinc-600 mb-4 flex-1">Join our team as a licensed broker. We provide training, tools, leads, and support to help you succeed.</p>
                  <Link to="/join" className="inline-flex items-center gap-2 text-gold font-semibold hover:gap-3 transition-all mt-auto">
                    Apply Now <ArrowRight className="w-4 h-4" />
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
              <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 hover:border-gold shadow-lg hover:shadow-[0_0_30px_rgba(200,167,102,0.3)] transition-all duration-300 h-full flex flex-col">
                <CardContent className="p-6 flex flex-col flex-1">
                  <div className="w-14 h-14 rounded-xl bg-transparent border-2 border-gold/40 flex items-center justify-center mb-4">
                    <Award className="w-7 h-7 text-gold" />
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 mb-3 w-fit">
                    <Globe className="w-3 h-3 mr-1" /> Open to Everyone Worldwide
                  </Badge>
                  <h3 className="text-black text-xl font-bold mb-2">JBJ Referral Program</h3>
                  <p className="text-zinc-600 mb-4 flex-1">Earn 5% or 2.5% commission on successful referrals. No license required — anyone from any country can join!</p>
                  <Link to="/referral-onboarding" className="inline-flex items-center gap-2 text-gold font-semibold hover:gap-3 transition-all mt-auto">
                    Start Earning <ArrowRight className="w-4 h-4" />
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Referral Program Details */}
          <motion.div className="max-w-4xl mx-auto" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Card className="bg-gradient-to-br from-black via-zinc-900 to-black border-2 border-gold/50 shadow-[0_0_40px_rgba(200,167,102,0.2)]">
              <CardContent className="p-8">
                <div className="text-center mb-10">
                  <div className="flex flex-col items-center justify-center mb-8">
                    <img src={jbjMonogramDarkBg} alt="JBJ Global Real Estate" className="w-28 h-28 md:w-32 md:h-32 object-contain mb-3" />
                    <span className="text-white font-semibold text-lg md:text-xl tracking-[0.12em] uppercase" style={{ fontFamily: "Poppins, sans-serif" }}>
                      JBJ GLOBAL REAL ESTATE
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/50 rounded-full shadow-lg mb-4">
                    <Handshake className="w-3.5 h-3.5 text-black" />
                    <span className="text-black text-xs uppercase tracking-wider font-medium">How Referral Works</span>
                  </span>
                  <h3 className="text-2xl md:text-3xl font-bold mb-2">
                    <span className="text-gold">Join the Referral Circle</span>
                  </h3>
                  <p className="text-gold font-semibold text-lg">Earn 5% or 2.5% Commission</p>
                </div>

                <div className="grid md:grid-cols-4 gap-6 mb-10">
                  {[
                    { step: 1, title: "Submit Documents", desc: "Send us your ID and basic information" },
                    { step: 2, title: "Receive Contract", desc: "We'll send you a referral partnership agreement" },
                    { step: 3, title: "Sign & Activate", desc: "Sign digitally and your account is active" },
                    { step: 4, title: "Start Referring", desc: "Refer clients and earn commission on deals" },
                  ].map((item, idx) => (
                    <div key={item.step} className="text-center">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 50%, #F5F0E6 100%)', border: '2px solid rgba(200,167,102,0.6)' }}>
                        <span className={`font-bold text-lg ${idx % 2 === 0 ? 'text-black' : 'text-gold'}`}>{item.step}</span>
                      </div>
                      <h4 className="text-white font-semibold mb-1">{item.title}</h4>
                      <p className="text-zinc-400 text-sm">{item.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-xl p-6">
                    <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30 mb-3">Passive Referral — 2.5%</Badge>
                    <h4 className="text-black font-bold text-lg mb-2">Share Contact Details Only</h4>
                    <p className="text-zinc-600 text-sm">Simply provide us with your contact's details. We'll reach out discreetly without mentioning your name.</p>
                  </div>
                  <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-xl p-6">
                    <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 mb-3">Active Referral — 5%</Badge>
                    <h4 className="text-black font-bold text-lg mb-2">Facilitate the Introduction</h4>
                    <p className="text-zinc-600 text-sm">Introduce your contact directly to us. Help convince them to invest — earn double!</p>
                  </div>
                </div>

                <div className="text-center">
                  <Link to="/referral-onboarding">
                    <button className="group relative inline-flex items-center justify-center gap-2 px-10 py-5 text-base font-bold rounded-xl transition-all duration-300 overflow-hidden" style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 50%, #F5F0E6 100%)', border: '2px solid rgba(200,167,102,0.5)', boxShadow: '0 10px 30px rgba(200,167,102,0.4), 0 6px 15px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.9), inset 0 -2px 4px rgba(200,167,102,0.2), 0 0 20px rgba(200,167,102,0.3)' }}>
                      <span className="relative flex items-center justify-center gap-2">
                        <DollarSign className="w-5 h-5 text-gold" />
                        <span className="text-gold">Become</span>
                        <span className="text-black">a Referral Partner Now</span>
                        <ArrowUpRight className="w-5 h-5 text-black" />
                      </span>
                    </button>
                  </Link>
                  <p className="text-zinc-400 text-sm mt-4">Available worldwide — No license required</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
