import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { 
  ArrowRight, ArrowDown, FileText, Camera, Globe, Calendar, Handshake, MessageCircle, 
  Phone, CheckCircle, Building, TrendingUp, Shield, Sparkles, Search, MapPin,
  Home, Users, Award, Clock, ChevronRight, Star, Briefcase, Info
} from "lucide-react";
import { Link } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LegalDisclaimer from "@/components/LegalDisclaimer";
import { CONTACT_INFO, getWhatsAppUrl } from "@/constants/stats";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLeadCapture } from "@/hooks/useLeadCapture";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } }
};

const SellWithUs = () => {
  const valuationRef = useRef<HTMLDivElement>(null);
  const listingRef = useRef<HTMLDivElement>(null);
  const { captureLead } = useLeadCapture();

  // Quick valuation state
  const [valCommunity, setValCommunity] = useState('');
  const [valType, setValType] = useState('apartment');
  const [valSize, setValSize] = useState('');
  const [valBedrooms, setValBedrooms] = useState('2');
  const [isValuating, setIsValuating] = useState(false);
  const [valResult, setValResult] = useState<any>(null);

  // Quick listing state
  const [listType, setListType] = useState('');
  const [listCommunity, setListCommunity] = useState('');
  const [listPhone, setListPhone] = useState('');
  const [listName, setListName] = useState('');
  const [listEmail, setListEmail] = useState('');
  const [listSubmitted, setListSubmitted] = useState(false);

  const scrollTo = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleQuickValuation = async () => {
    if (!valCommunity || !valSize) {
      toast.error("Please enter community and property size");
      return;
    }
    setIsValuating(true);
    try {
      const { data, error } = await supabase.functions.invoke('property-evaluation', {
        body: {
          property: {
            community: valCommunity,
            propertyType: valType,
            sizeInternal: parseInt(valSize),
            bedrooms: parseInt(valBedrooms),
            buildingName: valCommunity,
            views: [],
            floor: 0,
            developer: '',
            furnishedStatus: 'unfurnished',
            renovationCost: 0,
          }
        }
      });
      if (error) throw error;
      setValResult(data);
      toast.success("Valuation complete!");
    } catch (err) {
      console.error(err);
      toast.error("Valuation failed. Please sign in or try again.");
    } finally {
      setIsValuating(false);
    }
  };

  const handleListingSubmit = async () => {
    if (!listPhone || !listCommunity || !listType) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      await captureLead({
        email: listEmail || `${listPhone.replace(/\D/g, '')}@listing-lead.jbj.ae`,
        fullName: listName,
        phone: listPhone,
      }, 'sell-page-listing', 'client');
      setListSubmitted(true);
      toast.success("Listing request submitted! Our team will contact you shortly.");
    } catch {
      toast.error("Submission failed. Please try again.");
    }
  };

  const sellerCards = [
    { title: "End-Users Selling Their Home", description: "Clear pricing guidance and buyer screening to reduce wasted viewings.", icon: Home },
    { title: "Investors Exiting a Unit", description: "Strategy-driven positioning and timeline planning aligned with your exit goal.", icon: TrendingUp },
    { title: "Off-Plan Resale", description: "Assignment/resale handling aligned with developer requirements.", icon: Briefcase },
  ];

  const sellingSteps = [
    { step: 1, title: "Discovery & Document Check", description: "Title deed / Oqood, owner details, mortgage status, and unit specifics.", icon: FileText },
    { step: 2, title: "Market Pricing Strategy", description: "Comparable evidence, positioning, and price corridor — not inflated promises.", icon: TrendingUp },
    { step: 3, title: "Listing & Exposure", description: "Portals + qualified broker network + buyer database outreach.", icon: Camera },
    { step: 4, title: "Enquiries & Viewings", description: "Screening, scheduling, feedback loop, and offer readiness checks.", icon: Globe },
    { step: 5, title: "Negotiation & Offer Management", description: "Offer validation, terms alignment, and buyer credibility verification.", icon: Calendar },
    { step: 6, title: "Transfer Coordination", description: "NOC, trustee transfer support, mortgage settlement coordination.", icon: Handshake },
  ];

  const documentChecklist = [
    "Title Deed (or Oqood for off-plan)",
    "Owner passport / Emirates ID",
    "Unit details (size, view, parking, upgrades)",
    "Service charge status (if available)",
    "Mortgage details (if applicable)"
  ];

  return (
    <>
      <SEOHead
        title="Sell Your Property in Dubai | JBJ Global Real Estate"
        description="Sell your Dubai property with confidence. Get instant AI valuation, qualified buyers, and structured execution from a licensed brokerage team."
        keywords="sell property dubai, sell home dubai, property valuation dubai, sell apartment dubai"
        canonicalPath="/sell"
      />
      
      <main className="min-h-screen bg-[#FDFBF7]">
        {/* ═══ HERO — Cinematic Full-Bleed ═══ */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&q=80')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-zinc-950" />
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-4xl mx-auto text-center">
              <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 bg-[#FDFBF7]/5 backdrop-blur-md border border-white/10 rounded-full px-5 py-2.5 mb-8">
                <Shield className="w-4 h-4 text-white/70" />
                <span className="text-white/80 text-sm font-medium tracking-wide">DLD Licensed · RERA Certified · 2,700+ Properties</span>
              </motion.div>
              
              <motion.h1 variants={fadeInUp} className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1]">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-white">
                  Sell Your Property
                </span>
                <br />
                <span className="text-white/85 text-4xl md:text-5xl lg:text-6xl">with Confidence</span>
              </motion.h1>
              
              <motion.p variants={fadeInUp} className="text-lg md:text-xl text-[#1A1A1A]/70 mb-10 max-w-2xl mx-auto leading-relaxed">
                Pricing accuracy, qualified demand, and structured execution — handled by a licensed brokerage team in Dubai.
              </motion.p>
              
              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  onClick={() => scrollTo(valuationRef)}
                  className="bg-[#FDFBF7] text-[#1A1A1A] hover:bg-[#F7F2EA] font-semibold px-8 py-6 text-base rounded-xl shadow-[0_0_40px_rgba(255,255,255,0.1)]"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Get Instant AI Valuation
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => scrollTo(listingRef)}
                  className="border-white/20 text-white hover:bg-[#FDFBF7]/5 font-medium px-8 py-6 text-base rounded-xl backdrop-blur-sm"
                >
                  List Your Property
                  <ArrowDown className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ═══ CLARITY SECTION ═══ */}
        <section className="py-24 border-t border-white/5">
          <div className="container mx-auto px-4">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="max-w-4xl mx-auto text-center">
              <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-white mb-6">
                A Selling Process Built for Clarity
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-lg text-[#1A1A1A]/70 leading-relaxed">
                Selling isn't only about listing a property — it's about pricing correctly, positioning the asset, 
                qualifying buyers, and coordinating from offer to transfer. Our role is to manage the process 
                professionally and transparently.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* ═══ WHO WE SUPPORT — Glass Cards ═══ */}
        <section className="py-20 border-t border-white/5">
          <div className="container mx-auto px-4">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
              <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-white mb-14 text-center">
                Who We Support
              </motion.h2>
              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {sellerCards.map((card, index) => (
                  <motion.div
                    key={index}
                    variants={fadeInUp}
                    className="group p-8 rounded-2xl backdrop-blur-xl bg-[#FDFBF7]/[0.03] border border-white/[0.08] hover:border-white/20 hover:bg-[#FDFBF7]/[0.06] hover:scale-[1.02] hover:shadow-[0_20px_60px_-15px_rgba(255,255,255,0.05)] transition-all duration-500"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#FDFBF7]/5 border border-white/10 flex items-center justify-center mb-5 group-hover:bg-[#FDFBF7]/10 transition-colors">
                      <card.icon className="w-6 h-6 text-white/90 group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">{card.title}</h3>
                    <p className="text-[#1A1A1A]/70 leading-relaxed">{card.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══ THE 6-STEP TIMELINE ═══ */}
        <section className="py-20 border-t border-white/5">
          <div className="container mx-auto px-4">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
              <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-white mb-14 text-center">
                Our Selling Framework
              </motion.h2>
              <div className="max-w-3xl mx-auto space-y-0">
                {sellingSteps.map((step, index) => (
                  <motion.div key={step.step} variants={fadeInUp} className="relative flex gap-6">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/20 flex items-center justify-center z-10 shrink-0">
                        <span className="text-white font-bold text-sm">{step.step}</span>
                      </div>
                      {index < sellingSteps.length - 1 && (
                        <div className="w-px h-full bg-gradient-to-b from-white/20 to-transparent min-h-[40px]" />
                      )}
                    </div>
                    {/* Content */}
                    <div className="pb-10">
                      <div className="p-5 rounded-xl backdrop-blur-xl bg-[#FDFBF7]/[0.03] border border-white/[0.08] hover:border-white/20 hover:shadow-[0_0_30px_rgba(255,255,255,0.03)] transition-all duration-300">
                        <div className="flex items-center gap-3 mb-2">
                          <step.icon className="w-5 h-5 text-white/90" />
                          <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                        </div>
                        <p className="text-[#1A1A1A]/70 text-sm leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══ INTEGRATED AI VALUATION ═══ */}
        <section ref={valuationRef} className="py-20 border-t border-white/5 scroll-mt-20">
          <div className="container mx-auto px-4">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="max-w-3xl mx-auto">
              <motion.div variants={fadeInUp} className="text-center mb-10">
                <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-4 py-2 mb-5">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span className="text-blue-300 text-sm font-medium">AI-Powered</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Instant Property Valuation</h2>
                <p className="text-[#1A1A1A]/70">Get an estimated market value based on DLD data and comparable transactions</p>
              </motion.div>

              <motion.div variants={fadeInUp} className="p-8 rounded-2xl backdrop-blur-xl bg-[#FDFBF7]/[0.03] border border-white/[0.08]">
                {!valResult ? (
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-[#1A1A1A]/70 text-sm mb-1.5 block">Community *</Label>
                        <Input value={valCommunity} onChange={(e) => setValCommunity(e.target.value)} placeholder="e.g., Dubai Marina" className="bg-[#FDFBF7]/50 border-white/10 text-white placeholder:text-[#1A1A1A]/70 focus:border-blue-400" />
                      </div>
                      <div>
                        <Label className="text-[#1A1A1A]/70 text-sm mb-1.5 block">Property Type</Label>
                        <Select value={valType} onValueChange={setValType}>
                          <SelectTrigger className="bg-[#FDFBF7]/50 border-white/10 text-white"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-[#FDFBF7] border-[#1A1A1A]">
                            <SelectItem value="studio" className="text-white">Studio</SelectItem>
                            <SelectItem value="apartment" className="text-white">Apartment</SelectItem>
                            <SelectItem value="penthouse" className="text-white">Penthouse</SelectItem>
                            <SelectItem value="townhouse" className="text-white">Townhouse</SelectItem>
                            <SelectItem value="villa" className="text-white">Villa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-[#1A1A1A]/70 text-sm mb-1.5 block">Size (sq ft) *</Label>
                        <Input type="number" value={valSize} onChange={(e) => setValSize(e.target.value)} placeholder="e.g., 1200" className="bg-[#FDFBF7]/50 border-white/10 text-white placeholder:text-[#1A1A1A]/70 focus:border-blue-400" />
                      </div>
                      <div>
                        <Label className="text-[#1A1A1A]/70 text-sm mb-1.5 block">Bedrooms</Label>
                        <Select value={valBedrooms} onValueChange={setValBedrooms}>
                          <SelectTrigger className="bg-[#FDFBF7]/50 border-white/10 text-white"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-[#FDFBF7] border-[#1A1A1A]">
                            {['0', '1', '2', '3', '4', '5'].map(b => (
                              <SelectItem key={b} value={b} className="text-white">{b === '0' ? 'Studio' : `${b} BR`}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button onClick={handleQuickValuation} disabled={isValuating} className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-6 rounded-xl">
                      {isValuating ? <><Sparkles className="w-4 h-4 mr-2 animate-pulse" />Analyzing...</> : <><Search className="w-4 h-4 mr-2" />Get Instant Valuation</>}
                    </Button>
                    <p className="text-xs text-[#1A1A1A]/70 text-center">Sources: DLD Public Records · RERA · JBJ Analysis Framework</p>
                  </div>
                ) : (
                  <div className="text-center space-y-5">
                    <p className="text-blue-400 text-sm uppercase tracking-wider">Estimated Market Value</p>
                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-3">
                        <span className="text-xl text-[#1A1A1A]/70">AED {valResult.estimatedValue?.low?.toLocaleString()}</span>
                        <span className="text-[#1A1A1A]/70">—</span>
                        <span className="text-4xl font-bold text-white">AED {valResult.estimatedValue?.mid?.toLocaleString()}</span>
                        <span className="text-[#1A1A1A]/70">—</span>
                        <span className="text-xl text-[#1A1A1A]/70">AED {valResult.estimatedValue?.high?.toLocaleString()}</span>
                      </div>
                      <p className="text-[#1A1A1A]/70 text-sm">AED {valResult.estimatedValue?.pricePerSqFt?.toLocaleString()} per sq ft</p>
                    </div>
                    <p className="text-sm text-[#1A1A1A]/70 leading-relaxed max-w-lg mx-auto">{valResult.marketInsights}</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                      <Button asChild className="bg-[#FDFBF7] text-[#1A1A1A] hover:bg-[#F7F2EA] font-medium rounded-xl">
                        <Link to="/property-evaluator">
                          Get Detailed Report <ChevronRight className="w-4 h-4 ml-1" />
                        </Link>
                      </Button>
                      <Button variant="outline" onClick={() => setValResult(null)} className="border-white/20 text-white hover:bg-[#FDFBF7]/5 rounded-xl">
                        Try Another Property
                      </Button>
                    </div>
                    {valResult.sources && <p className="text-xs text-[#1A1A1A]/70">{valResult.sources}</p>}
                  </div>
                )}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ═══ INTEGRATED LISTING SUBMISSION ═══ */}
        <section ref={listingRef} className="py-20 border-t border-white/5 scroll-mt-20">
          <div className="container mx-auto px-4">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="max-w-3xl mx-auto">
              <motion.div variants={fadeInUp} className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">List Your Property</h2>
                <p className="text-[#1A1A1A]/70">Submit your details and our team will handle the rest</p>
              </motion.div>

              <motion.div variants={fadeInUp} className="p-8 rounded-2xl backdrop-blur-xl bg-[#FDFBF7]/[0.03] border border-white/[0.08]">
                {!listSubmitted ? (
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-[#1A1A1A]/70 text-sm mb-1.5 block">Full Name</Label>
                        <Input value={listName} onChange={(e) => setListName(e.target.value)} placeholder="Your name" className="bg-[#FDFBF7]/50 border-white/10 text-white placeholder:text-[#1A1A1A]/70" />
                      </div>
                      <div>
                        <Label className="text-[#1A1A1A]/70 text-sm mb-1.5 block">Phone Number *</Label>
                        <Input value={listPhone} onChange={(e) => setListPhone(e.target.value)} placeholder="+971 50 123 4567" className="bg-[#FDFBF7]/50 border-white/10 text-white placeholder:text-[#1A1A1A]/70" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-[#1A1A1A]/70 text-sm mb-1.5 block">Property Type *</Label>
                        <Select value={listType} onValueChange={setListType}>
                          <SelectTrigger className="bg-[#FDFBF7]/50 border-white/10 text-white"><SelectValue placeholder="Select type" /></SelectTrigger>
                          <SelectContent className="bg-[#FDFBF7] border-[#1A1A1A]">
                            <SelectItem value="apartment" className="text-white">Apartment</SelectItem>
                            <SelectItem value="villa" className="text-white">Villa</SelectItem>
                            <SelectItem value="townhouse" className="text-white">Townhouse</SelectItem>
                            <SelectItem value="penthouse" className="text-white">Penthouse</SelectItem>
                            <SelectItem value="studio" className="text-white">Studio</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[#1A1A1A]/70 text-sm mb-1.5 block">Community *</Label>
                        <Input value={listCommunity} onChange={(e) => setListCommunity(e.target.value)} placeholder="e.g., Dubai Marina" className="bg-[#FDFBF7]/50 border-white/10 text-white placeholder:text-[#1A1A1A]/70" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-[#1A1A1A]/70 text-sm mb-1.5 block">Email (optional)</Label>
                      <Input type="email" value={listEmail} onChange={(e) => setListEmail(e.target.value)} placeholder="your@email.com" className="bg-[#FDFBF7]/50 border-white/10 text-white placeholder:text-[#1A1A1A]/70" />
                    </div>
                    <Button onClick={handleListingSubmit} className="w-full bg-[#FDFBF7] text-[#1A1A1A] hover:bg-[#F7F2EA] font-semibold py-6 rounded-xl">
                      Submit Listing Request <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    <p className="text-xs text-[#1A1A1A]/70 text-center">
                      Want to add photos and full details? <Link to="/listing-portal" className="text-white/70 hover:text-white underline">Go to Full Listing Portal</Link>
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
                      <CheckCircle className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Request Submitted</h3>
                    <p className="text-[#1A1A1A]/70 max-w-md mx-auto">
                      Our selling advisor will contact you within 24 hours to discuss your property and next steps.
                    </p>
                    <div className="flex gap-3 justify-center pt-2">
                      <Button asChild variant="outline" className="border-white/20 text-white hover:bg-[#FDFBF7]/5 rounded-xl">
                        <a href={getWhatsAppUrl("Hi, I just submitted a listing request on your website.")} target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp Us Now
                        </a>
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ═══ DOCUMENT CHECKLIST ═══ */}
        <section className="py-20 border-t border-white/5">
          <div className="container mx-auto px-4">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="max-w-3xl mx-auto">
              <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-white mb-8 text-center">
                What We'll Ask You For
              </motion.h2>
              <motion.div variants={fadeInUp} className="p-8 rounded-2xl backdrop-blur-xl bg-[#FDFBF7]/[0.03] border border-white/[0.08]">
                <ul className="space-y-4">
                  {documentChecklist.map((item, index) => (
                    <li key={index} className="flex items-center gap-4 group">
                      <div className="w-8 h-8 rounded-lg bg-[#FDFBF7]/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-[#FDFBF7]/10 transition-colors">
                        <CheckCircle className="w-4 h-4 text-white/90 group-hover:text-white transition-colors" />
                      </div>
                      <span className="text-[#1A1A1A]/70 group-hover:text-white transition-colors">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ═══ CTA BLOCK — Split ═══ */}
        <section className="py-20 border-t border-white/5">
          <div className="container mx-auto px-4">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-6">
                <motion.div variants={fadeInUp} className="p-8 rounded-2xl backdrop-blur-xl bg-[#FDFBF7]/[0.03] border border-white/[0.08] text-center">
                  <MessageCircle className="w-10 h-10 text-white/85 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Speak to a Selling Advisor</h3>
                  <p className="text-[#1A1A1A]/70 text-sm mb-6">Get personalized guidance from our licensed team</p>
                  <Button asChild className="bg-[#FDFBF7] text-[#1A1A1A] hover:bg-[#F7F2EA] font-medium rounded-xl w-full">
                    <a href={getWhatsAppUrl("Hello, I'd like to speak with a Selling Advisor.")} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp Us
                    </a>
                  </Button>
                </motion.div>
                <motion.div variants={fadeInUp} className="p-8 rounded-2xl backdrop-blur-xl bg-[#FDFBF7]/[0.03] border border-white/[0.08] text-center">
                  <Sparkles className="w-10 h-10 text-white/85 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Get Started Now</h3>
                  <p className="text-[#1A1A1A]/70 text-sm mb-6">Use our AI tools to get an instant valuation</p>
                  <Button onClick={() => scrollTo(valuationRef)} className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium rounded-xl w-full">
                    <Sparkles className="mr-2 h-4 w-4" /> AI Valuation
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer Notice */}
        <section className="py-8 border-t border-white/5">
          <div className="container mx-auto px-4">
            <LegalDisclaimer variant="brokerage" className="max-w-3xl mx-auto" />
          </div>
        </section>
      </main>
    </>
  );
};

export default SellWithUs;
