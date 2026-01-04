import { useMemo, useState } from "react";
import Footer from "@/components/Footer";
import GlobalHeader from "@/components/GlobalHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CONTACT_INFO } from "@/constants/stats";
import { getCountryList, getLanguageList } from "@/constants/localeOptions";
import founderProfessional from "@/assets/founder-professional.jpeg";
import luxuryVilla1 from "@/assets/luxury-villa-1.jpeg";
import { motion } from "framer-motion";
import { ArrowUpRight, BookOpen, CheckCircle, Download, FileText, Lock, Shield, Sparkles, Star, TrendingUp, Unlock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MarketReport = () => {
  const countries = useMemo(() => getCountryList(), []);
  const languages = useMemo(() => getLanguageList(), []);
  const [downloaded, setDownloaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    nationality: "",
    language: "",
  });

  const isValid =
    form.fullName.trim().length > 1 &&
    form.email.trim().includes("@") &&
    form.phone.trim().length >= 6 &&
    form.nationality.trim().length > 0 &&
    form.language.trim().length > 0;

  const buildInquiryUrl = () => {
    const base = CONTACT_INFO.inquiryFormUrl;
    const params = new URLSearchParams();
    params.set("source", "market-report");
    if (form.fullName) params.set("name", form.fullName);
    if (form.email) params.set("email", form.email);
    if (form.phone) params.set("phone", form.phone);
    if (form.nationality) params.set("nationality", form.nationality);
    if (form.language) params.set("language", form.language);
    return `${base}?${params.toString()}`;
  };

  const downloadBook = () => {
    const websiteUrl = "https://jjglobalcapital.com";
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(websiteUrl)}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>JJ Global Capital — UAE Market Intelligence Book</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
  
  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  body { 
    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%);
    color: #fff;
    min-height: 100vh;
    padding: 40px 20px;
  }
  
  .container { max-width: 900px; margin: 0 auto; }
  
  .header {
    text-align: center;
    margin-bottom: 50px;
    padding-bottom: 40px;
    border-bottom: 1px solid rgba(168, 146, 90, 0.3);
  }
  
  .logo {
    font-size: 28px;
    font-weight: 700;
    letter-spacing: 0.1em;
    margin-bottom: 8px;
  }
  
  .logo span { color: #A8925A; }
  
  .subtitle {
    color: #888;
    font-size: 12px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }
  
  .hero {
    display: flex;
    align-items: center;
    gap: 30px;
    margin-bottom: 50px;
    padding: 40px;
    background: linear-gradient(145deg, rgba(168, 146, 90, 0.1) 0%, rgba(0,0,0,0.5) 100%);
    border: 1px solid rgba(168, 146, 90, 0.2);
    border-radius: 20px;
  }
  
  .founder-photo {
    width: 140px;
    height: 140px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid #A8925A;
    box-shadow: 0 10px 40px rgba(168, 146, 90, 0.3);
  }
  
  .hero-content h1 {
    font-size: 32px;
    font-weight: 600;
    margin-bottom: 10px;
    background: linear-gradient(135deg, #fff 0%, #A8925A 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .hero-content p {
    color: #aaa;
    font-size: 16px;
    line-height: 1.6;
  }
  
  .badge {
    display: inline-block;
    padding: 8px 16px;
    background: rgba(168, 146, 90, 0.15);
    border: 1px solid rgba(168, 146, 90, 0.4);
    border-radius: 50px;
    font-size: 11px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #A8925A;
    margin-bottom: 15px;
  }
  
  .section {
    margin-bottom: 40px;
    padding: 30px;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
  }
  
  .section h2 {
    font-size: 20px;
    font-weight: 600;
    color: #A8925A;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .section h2::before {
    content: '';
    width: 4px;
    height: 24px;
    background: linear-gradient(180deg, #A8925A, transparent);
    border-radius: 2px;
  }
  
  .section ul {
    list-style: none;
    padding: 0;
  }
  
  .section li {
    padding: 12px 0;
    padding-left: 30px;
    position: relative;
    color: #ccc;
    font-size: 15px;
    line-height: 1.6;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  
  .section li:last-child { border-bottom: none; }
  
  .section li::before {
    content: '✓';
    position: absolute;
    left: 0;
    color: #A8925A;
    font-weight: bold;
  }
  
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  
  @media (max-width: 700px) {
    .grid { grid-template-columns: 1fr; }
    .hero { flex-direction: column; text-align: center; }
  }
  
  .cta-box {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding: 30px;
    background: linear-gradient(135deg, rgba(168, 146, 90, 0.15) 0%, rgba(168, 146, 90, 0.05) 100%);
    border: 1px solid rgba(168, 146, 90, 0.3);
    border-radius: 16px;
    margin-top: 40px;
  }
  
  .cta-box .text h3 {
    font-size: 18px;
    margin-bottom: 5px;
  }
  
  .cta-box .text p {
    color: #888;
    font-size: 14px;
  }
  
  .qr-code {
    width: 120px;
    height: 120px;
    background: #fff;
    padding: 8px;
    border-radius: 12px;
  }
  
  .footer {
    margin-top: 50px;
    padding-top: 30px;
    border-top: 1px solid rgba(255,255,255,0.1);
    text-align: center;
    color: #666;
    font-size: 12px;
    line-height: 1.8;
  }
  
  .footer a { color: #A8925A; text-decoration: none; }
</style>
</head>
<body>
  <div class="container">
    <header class="header">
      <div class="logo">JJ <span>|</span> GLOBAL CAPITAL</div>
      <div class="subtitle">UAE Real Estate Intelligence</div>
    </header>
    
    <div class="hero">
      <img class="founder-photo" src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop&crop=face" alt="Jane Abou Jaoude" />
      <div class="hero-content">
        <div class="badge">Educational Market Book</div>
        <h1>UAE Real Estate Market Intelligence</h1>
        <p>Prepared for investors of JJ Global Capital by Jane Abou Jaoude, Founder & Chairwoman</p>
      </div>
    </div>
    
    <div class="grid">
      <div class="section">
        <h2>What This Book Covers</h2>
        <ul>
          <li>How to read official market indicators (transactions, supply, segments)</li>
          <li>Developer comparison framework (delivery, product, pricing logic)</li>
          <li>Community comparison framework (liquidity, rentability, long-term demand)</li>
          <li>Investment checklist for off-plan vs ready assets</li>
          <li>Risk controls, due diligence, and decision structure</li>
        </ul>
      </div>
      
      <div class="section">
        <h2>Official Data Sources</h2>
        <ul>
          <li>Dubai Land Department (DLD) publications & portals</li>
          <li>Dubai REST platform official data</li>
          <li>RERA-related guidance where applicable</li>
          <li>Other UAE government economic sources</li>
          <li>Property Monitor & DXB Interact analytics</li>
        </ul>
      </div>
    </div>
    
    <div class="section">
      <h2>AI Property Matchmaker (Complimentary)</h2>
      <p style="color: #aaa; line-height: 1.8;">
        Our AI Property Matchmaker was created and developed by our founder, Jane Abou Jaoude, 
        exclusively for JJ Global Capital investors—so you can shortlist opportunities faster 
        and with clearer structure. Take the complimentary assessment on our website.
      </p>
    </div>
    
    <div class="cta-box">
      <div class="text">
        <h3>Visit Our Website</h3>
        <p>Scan to explore and take the complimentary AI assessment</p>
        <p style="margin-top: 10px; color: #A8925A;">${websiteUrl}</p>
      </div>
      <img class="qr-code" src="${qrUrl}" alt="Website QR code" />
    </div>
    
    <footer class="footer">
      <p><strong>Disclaimer:</strong> This document is educational and does not constitute brokerage advice.</p>
      <p>For an official consultation, please contact JJ Global Capital.</p>
      <p style="margin-top: 15px;">
        Email: <a href="mailto:${CONTACT_INFO.email}">${CONTACT_INFO.emailCapitalized}</a> • 
        Phone: ${CONTACT_INFO.phone}
      </p>
      <p style="margin-top: 10px;">
        Part of <a href="${CONTACT_INFO.holdingGroupUrl}" target="_blank">JJ Holding Group</a>
      </p>
    </footer>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "JJ-Global-Capital-UAE-Market-Intelligence.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloaded(true);
  };

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Send email notifications via edge function
      const { error } = await supabase.functions.invoke('send-market-report-email', {
        body: {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          nationality: form.nationality,
          language: form.language,
        },
      });
      
      if (error) {
        console.error('Email error:', error);
      }
      
      // Download the book
      downloadBook();
      toast.success('Your book is downloading!');
    } catch (err) {
      console.error('Submit error:', err);
      // Still download the book even if email fails
      downloadBook();
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    { icon: TrendingUp, title: "Market Analysis", desc: "Official government data & trends" },
    { icon: Shield, title: "Due Diligence", desc: "Investment checklist framework" },
    { icon: Star, title: "AI Matchmaker", desc: "Complimentary property assessment" },
    { icon: BookOpen, title: "Educational", desc: "Founder-led expert insights" },
  ];

  return (
    <div className="min-h-screen bg-black">
      <GlobalHeader />
      
      {/* Hero Section with 3D Book Visual */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 via-black to-black" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Book Visual */}
            <motion.div 
              initial={{ opacity: 0, x: -30, rotateY: -15 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ duration: 0.8 }}
              className="relative perspective-1000"
            >
              {/* 3D Book Container */}
              <div className="relative mx-auto w-[280px] md:w-[320px] transform-gpu" style={{ perspective: '1000px' }}>
                <div 
                  className="relative transform-gpu transition-transform duration-500 hover:rotate-y-6"
                  style={{ transformStyle: 'preserve-3d', transform: 'rotateY(-12deg) rotateX(5deg)' }}
                >
                  {/* Book Cover */}
                  <div className="relative bg-gradient-to-br from-zinc-900 via-black to-zinc-900 rounded-lg overflow-hidden shadow-2xl border border-gold/30" style={{ boxShadow: '20px 20px 60px rgba(0,0,0,0.8), -5px -5px 20px rgba(168, 146, 90, 0.1)' }}>
                    {/* Book Spine Effect */}
                    <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-gold/30 via-gold/10 to-transparent" />
                    
                    {/* Cover Image */}
                    <img 
                      src={luxuryVilla1}
                      alt="UAE Luxury Real Estate"
                      className="w-full h-48 md:h-56 object-cover opacity-60"
                    />
                    
                    {/* Cover Content */}
                    <div className="p-6 md:p-8 relative">
                      {/* Gold Line */}
                      <div className="w-16 h-1 bg-gradient-to-r from-gold to-gold-dark mb-4" />
                      
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/30 text-gold text-[10px] uppercase tracking-[0.2em] mb-4">
                        <Sparkles className="w-3 h-3" />
                        2025-2026 Edition
                      </div>
                      
                      <h3 className="text-white text-xl md:text-2xl font-bold leading-tight mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>
                        UAE Real Estate
                        <span className="block text-gold">Market Intelligence</span>
                      </h3>
                      
                      <p className="text-zinc-500 text-xs mt-4">By Jane Abou Jaoude</p>
                      
                      {/* JJ Logo */}
                      <div className="mt-6 pt-4 border-t border-zinc-800">
                        <p className="text-zinc-400 text-[10px] tracking-[0.3em] uppercase">JJ Global Capital</p>
                      </div>
                    </div>
                    
                    {/* Book Pages Effect */}
                    <div className="absolute right-0 top-0 bottom-0 w-2">
                      <div className="h-full bg-gradient-to-l from-zinc-100/5 via-zinc-200/10 to-transparent" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 95%, 0 5%)' }} />
                    </div>
                  </div>
                  
                  {/* Shadow */}
                  <div className="absolute -bottom-4 left-4 right-4 h-8 bg-black/60 blur-xl rounded-full" />
                </div>
              </div>
              
              {/* Floating Badge */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="absolute -bottom-2 -right-4 md:right-8 bg-gradient-to-br from-gold to-gold-dark text-black px-4 py-2 rounded-full shadow-lg"
              >
                <span className="text-xs font-bold uppercase tracking-wider">Free Download</span>
              </motion.div>
            </motion.div>
            
            {/* Right: Content */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs uppercase tracking-[0.25em] mb-6">
                <FileText className="w-4 h-4" />
                Exclusive Market Report
              </div>
              
              <h1 className="text-white text-3xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6" style={{ fontFamily: "Poppins, sans-serif" }}>
                Unlock Your
                <span className="block text-gold">Investment Edge</span>
              </h1>
              
              <p className="text-zinc-400 text-lg md:text-xl leading-relaxed mb-8">
                An educational, founder-led overview designed around government-led sources and structured decision frameworks—created exclusively for investors of JJ Global Capital.
              </p>
              
              {/* What You Get */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { icon: TrendingUp, text: "Market Analysis" },
                  { icon: Shield, text: "Due Diligence" },
                  { icon: Star, text: "AI Matchmaker Access" },
                  { icon: BookOpen, text: "Expert Insights" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-zinc-300 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center">
                      <item.icon className="w-4 h-4 text-gold" />
                    </div>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
              
              {/* Scroll Indicator */}
              <a href="#unlock-form" className="inline-flex items-center gap-2 text-gold hover:text-gold-light transition-colors">
                <Lock className="w-5 h-5" />
                <span className="font-medium">Register to Unlock Your Copy</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Founder Quote Section */}
      <section className="py-16 border-y border-zinc-800/50 bg-gradient-to-r from-gold/5 via-transparent to-gold/5">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <img 
              src={founderProfessional} 
              alt="Jane Abou Jaoude"
              className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover object-top border-2 border-gold/50 mx-auto mb-6"
            />
            <blockquote className="text-white text-xl md:text-2xl lg:text-3xl font-light leading-relaxed mb-6 italic" style={{ fontFamily: "Poppins, sans-serif" }}>
              "This book represents years of experience in UAE real estate, distilled into actionable frameworks. I created it so investors can make informed decisions with confidence."
            </blockquote>
            <div>
              <p className="text-gold font-semibold text-lg">Jane Abou Jaoude</p>
              <p className="text-zinc-500 text-sm">Founder & Chairwoman, JJ Global Capital</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-5 gap-10 items-start">
          {/* Form Section */}
          <motion.section 
            id="unlock-form"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-3 bg-gradient-to-br from-zinc-900/80 to-zinc-950 border border-zinc-800 rounded-3xl p-8 md:p-10"
          >
            <div className="flex items-start gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 flex items-center justify-center flex-shrink-0">
                <Unlock className="w-6 h-6 text-gold" />
              </div>
              <div>
                <h2 className="text-white text-2xl font-bold">Unlock Your Book</h2>
                <p className="text-zinc-400 mt-1">
                  Complete the form below to unlock instant access to the UAE Market Intelligence book.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <Label className="text-zinc-300 text-sm font-medium">Full Name *</Label>
                <Input
                  value={form.fullName}
                  onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                  placeholder="Enter your full name"
                  className="mt-2 bg-zinc-900/50 border-zinc-700 text-white h-12 rounded-xl focus:border-gold/50 focus:ring-gold/20"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-zinc-300 text-sm font-medium">Email *</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="your@email.com"
                    className="mt-2 bg-zinc-900/50 border-zinc-700 text-white h-12 rounded-xl focus:border-gold/50 focus:ring-gold/20"
                  />
                </div>
                <div>
                  <Label className="text-zinc-300 text-sm font-medium">Phone *</Label>
                  <Input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="+971 50 123 4567"
                    className="mt-2 bg-zinc-900/50 border-zinc-700 text-white h-12 rounded-xl focus:border-gold/50 focus:ring-gold/20"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-zinc-300 text-sm font-medium">Nationality *</Label>
                  <Select
                    value={form.nationality}
                    onValueChange={(v) => setForm((p) => ({ ...p, nationality: v }))}
                  >
                    <SelectTrigger className="mt-2 bg-zinc-900/50 border-zinc-700 text-white h-12 rounded-xl">
                      <SelectValue placeholder="Select nationality" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700 max-h-72">
                      {countries.map((c) => (
                        <SelectItem key={c} value={c} className="text-white hover:bg-zinc-800">
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-zinc-300 text-sm font-medium">Preferred Language *</Label>
                  <Select
                    value={form.language}
                    onValueChange={(v) => setForm((p) => ({ ...p, language: v }))}
                  >
                    <SelectTrigger className="mt-2 bg-zinc-900/50 border-zinc-700 text-white h-12 rounded-xl">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700 max-h-72">
                      {languages.map((l) => (
                        <SelectItem key={l} value={l} className="text-white hover:bg-zinc-800">
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  onClick={handleSubmit}
                  disabled={!isValid || isSubmitting}
                  className="w-full h-14 bg-gradient-to-r from-gold to-gold-dark hover:from-gold-light hover:to-gold text-black font-semibold text-base rounded-xl transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 mr-2 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : downloaded ? (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Book Unlocked!
                    </>
                  ) : (
                    <>
                      <Unlock className="w-5 h-5 mr-2" />
                      Unlock & Download Now
                      <ArrowUpRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>

              <p className="text-zinc-600 text-xs leading-relaxed text-center">
                By downloading, you agree your details may be used to contact you about UAE real estate opportunities.
              </p>
            </div>
          </motion.section>

          {/* Sidebar */}
          <motion.aside 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* What You'll Receive */}
            <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-950 border border-zinc-800 rounded-3xl p-8">
              <h2 className="text-white text-xl font-bold mb-6">What You'll Receive</h2>
              <ul className="space-y-4">
                {[
                  "Structured market overview (educational)",
                  "Developer & community comparison frameworks",
                  "Investment due diligence checklist",
                  "Complimentary AI Home Finder access",
                  "Expert insights from our founder",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                    <span className="text-zinc-300 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Founder Card */}
            <div className="bg-gradient-to-br from-gold/10 to-zinc-950 border border-gold/20 rounded-3xl p-8">
              <div className="flex items-center gap-4 mb-4">
                <img 
                  src={founderProfessional} 
                  alt="Jane Abou Jaoude"
                  className="w-16 h-16 rounded-full object-cover object-top border-2 border-gold/50"
                />
                <div>
                  <h3 className="text-white font-semibold">Jane Abou Jaoude</h3>
                  <p className="text-gold text-sm">Founder & Chairwoman</p>
                </div>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                "This book represents years of experience in UAE real estate, distilled into actionable frameworks for investors."
              </p>
            </div>

            {/* Brand Box */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 text-center">
              <p className="text-zinc-400 text-sm">
                Powered by <span className="text-white font-semibold">JJ Global Capital</span>
              </p>
              <p className="text-zinc-500 text-xs mt-1">
                Part of{" "}
                <a
                  className="text-gold hover:underline"
                  href={CONTACT_INFO.holdingGroupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  JJ Holding Group
                </a>
              </p>
            </div>
          </motion.aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MarketReport;