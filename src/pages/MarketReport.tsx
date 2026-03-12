import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { motion } from "framer-motion";
import {
  ArrowUpRight, BookOpen, CheckCircle, Download, FileText,
  Lock, Shield, Sparkles, Star, TrendingUp, Unlock, Printer, X,
} from "lucide-react";
import MarketReportCTAModal from "@/components/broker/MarketReportCTAModal";
import { FounderContent } from "@/components/FounderContent";
import luxuryVilla1 from "@/assets/luxury-villa-1.jpeg";
import founderCompanyProfile from "@/assets/founder-company-profile.jpg";
import { useMarketReport } from "./useMarketReport";

const MarketReport = () => {
  const {
    countries, languages, form, setForm,
    isSubmitting, isGeneratingPdf, showThankYou,
    bookHtml, setBookHtml, showBookPreview, setShowBookPreview,
    showCTAModal, setShowCTAModal, bookFrameRef,
    isValid, canDirectDownload, leadData, isFounderVisible,
    handleSubmit, handleDirectDownload,
  } = useMarketReport();

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Thank You Modal */}
      {showThankYou && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-zinc-900 to-black border border-gold/30 rounded-3xl p-10 max-w-md mx-4 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-gold" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Thank You!</h2>
            <p className="text-gold text-lg font-semibold mb-2">From JBJ Global Real Estate</p>
            <p className="text-zinc-400 mb-6">You have successfully unlocked your Market Intelligence Book. Opening now...</p>
            <div className="flex items-center justify-center gap-2 text-zinc-500">
              <div className="w-5 h-5 border-2 border-gold/50 border-t-gold rounded-full animate-spin" />
              <span className="text-sm">Preparing your book...</span>
            </div>
          </motion.div>
        </div>
      )}

      {/* In-page Book Viewer */}
      {showBookPreview && bookHtml && (
        <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6 h-full flex items-center justify-center">
            <div className="w-full max-w-6xl h-[88vh] bg-zinc-950 border border-gold/30 rounded-2xl overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-zinc-800">
                <div className="min-w-0">
                  <p className="text-xs text-zinc-400">JBJ Global Real Estate</p>
                  <h2 className="text-white font-semibold truncate">UAE Real Estate Market Intelligence 2026</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => bookFrameRef.current?.contentWindow?.print()} className="border-gold/30 text-gold hover:bg-gold/10">
                    <Printer className="w-4 h-4 mr-2" />Save as PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setShowBookPreview(false); setBookHtml(null); }} className="border-zinc-700 text-zinc-200 hover:bg-zinc-900">
                    <X className="w-4 h-4 mr-2" />Close
                  </Button>
                </div>
              </div>
              <iframe ref={bookFrameRef} title="UAE Real Estate Market Intelligence 2026" srcDoc={bookHtml} className="w-full h-[calc(88vh-52px)] bg-white" sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox" />
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="jj-hero-fullscreen relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden bg-black">
        <div className="absolute inset-x-0 bottom-0 top-20 md:top-24 mx-0.5 md:mx-2 lg:mx-4 xl:mx-6 2xl:mx-8 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] rounded-2xl md:rounded-3xl" />
        <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-gold/15 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gold/10 rounded-full blur-[100px]" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Book Visual */}
            <motion.div initial={{ opacity: 0, x: -30, rotateY: -15 }} animate={{ opacity: 1, x: 0, rotateY: 0 }} transition={{ duration: 0.8 }} className="relative perspective-1000">
              <div className="relative mx-auto w-[280px] md:w-[320px] transform-gpu group" style={{ perspective: '1200px' }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const centerX = rect.width / 2;
                  const rotateY = x < centerX ? 25 : -25;
                  e.currentTarget.querySelector<HTMLDivElement>('.book-inner')?.style.setProperty('transform', `rotateY(${rotateY}deg) rotateX(3deg) translateZ(50px) scale(1.05)`);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.querySelector<HTMLDivElement>('.book-inner')?.style.setProperty('transform', 'rotateY(-12deg) rotateX(5deg)');
                }}
              >
                <div className="book-inner relative transform-gpu transition-transform duration-500 ease-out" style={{ transformStyle: 'preserve-3d', transform: 'rotateY(-12deg) rotateX(5deg)' }}>
                  <div className="relative bg-gradient-to-br from-zinc-900 via-black to-zinc-900 rounded-lg overflow-hidden shadow-2xl border border-gold/30" style={{ boxShadow: '20px 20px 60px rgba(0,0,0,0.8), -5px -5px 20px rgba(168, 146, 90, 0.1)' }}>
                    <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-900 border-r border-gold/30" style={{ transformStyle: 'preserve-3d', transform: 'rotateY(-90deg) translateX(-16px)', transformOrigin: 'left center' }}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-gold text-[9px] font-bold tracking-[0.15em] uppercase whitespace-nowrap" style={{ transform: 'rotate(-90deg)', textShadow: '0 0 10px rgba(200,167,102,0.5)' }}>JBJ Global Real Estate 2026</span>
                      </div>
                    </div>
                    <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-gold/40 via-gold/20 to-transparent" />
                    <img src={luxuryVilla1} alt="UAE Luxury Real Estate" className="w-full h-48 md:h-56 object-cover opacity-60" />
                    <div className="p-6 md:p-8 relative">
                      <div className="w-16 h-1 bg-gradient-to-r from-gold to-gold-dark mb-4" />
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/30 text-gold text-[10px] uppercase tracking-[0.2em] mb-4">
                        <Sparkles className="w-3 h-3" />Latest Edition 2026
                      </div>
                      <h3 className="text-white text-xl md:text-2xl font-bold leading-tight mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>
                        UAE Real Estate<span className="block text-gold">Market Intelligence</span>
                      </h3>
                      <FounderContent fallback={null}><p className="text-zinc-500 text-xs mt-4">By Founder & CEO Jane Bou Jaoude</p></FounderContent>
                      <div className="mt-6 pt-4 border-t border-zinc-800"><p className="text-zinc-400 text-[10px] tracking-[0.3em] uppercase">JBJ Global Real Estate</p></div>
                    </div>
                    <div className="absolute right-0 top-0 bottom-0 w-3">
                      <div className="h-full bg-gradient-to-l from-zinc-100/10 via-zinc-200/15 to-transparent" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 95%, 0 5%)' }} />
                      <div className="absolute right-0 top-[5%] bottom-[5%] w-[2px] bg-zinc-300/20" />
                      <div className="absolute right-[3px] top-[6%] bottom-[6%] w-[1px] bg-zinc-300/15" />
                      <div className="absolute right-[5px] top-[7%] bottom-[7%] w-[1px] bg-zinc-300/10" />
                    </div>
                  </div>
                  <div className="absolute -bottom-4 left-4 right-4 h-8 bg-black/60 blur-xl rounded-full transition-all duration-500 group-hover:blur-2xl group-hover:h-10" />
                </div>
              </div>
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.4 }} className="absolute -bottom-2 -right-4 md:right-8 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] text-black px-4 py-2 rounded-full shadow-lg border border-gold/50">
                <span className="text-xs font-bold uppercase tracking-wider">Free Download</span>
              </motion.div>
            </motion.div>

            {/* Right: Content */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs uppercase tracking-[0.25em] mb-6">
                <FileText className="w-4 h-4" />Exclusive Market Report
              </div>
              <h1 className="text-black text-3xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6" style={{ fontFamily: "Poppins, sans-serif" }}>
                Unlock Your<span className="block text-gold">Investment Edge</span>
              </h1>
              <p className="text-black text-lg md:text-xl leading-relaxed mb-8">
                An educational, founder-led overview designed around government-led sources and structured decision frameworks—created exclusively for clients of JBJ Global Real Estate.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { icon: TrendingUp, text: "Market Analysis" },
                  { icon: Shield, text: "Due Diligence" },
                  { icon: Star, text: "AI Matchmaker Access" },
                  { icon: BookOpen, text: "Expert Insights" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-zinc-700 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-gold/20 border border-gold/30 flex items-center justify-center">
                      <item.icon className="w-4 h-4 text-gold" />
                    </div>
                    <span className="text-black">{item.text}</span>
                  </div>
                ))}
              </div>
              <Button variant="primary" size="lg" onClick={() => document.getElementById('unlock-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' })} className="shadow-[0_10px_30px_rgba(200,167,102,0.4)] hover:shadow-[0_15px_40px_rgba(200,167,102,0.5)] transition-all">
                <Download className="w-5 h-5 mr-2" />Download Your Free Book Now<ArrowUpRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      <FounderContent fallback={null}>
        <section className="py-16 border-y border-zinc-800/50 bg-gradient-to-r from-gold/5 via-transparent to-gold/5">
          <div className="container mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="max-w-4xl mx-auto text-center">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-2 border-gold/50 mx-auto mb-6 bg-white">
                <img src={founderCompanyProfile} alt="Jane Bou Jaoude, Founder & CEO of JBJ GLOBAL REAL ESTATE" className="w-full h-full" style={{ objectFit: 'contain', objectPosition: 'center top', transform: 'scaleX(1.08)' }} />
              </div>
              <blockquote className="text-white text-xl md:text-2xl lg:text-3xl font-light leading-relaxed mb-6 italic" style={{ fontFamily: "Poppins, sans-serif" }}>
                "This book represents years of experience in UAE real estate, distilled into actionable frameworks. I created it so investors can make informed decisions with confidence."
              </blockquote>
              <div>
                <p className="text-white font-semibold text-lg tracking-wide">Jane Bou Jaoude</p>
                <p className="text-gold text-sm font-medium mt-1">Founder & CEO</p>
                <p className="text-zinc-400 text-sm mt-0.5">JBJ Global Real Estate</p>
              </div>
            </motion.div>
          </div>
        </section>
      </FounderContent>

      {/* Download Book Section */}
      <section className="py-12 md:py-16 bg-black">
        <div className="jj-layer-2">
          <div className="grid lg:grid-cols-5 gap-10 items-start">
            <motion.section id="unlock-form" initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }} className="lg:col-span-3 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/30 rounded-3xl p-8 md:p-10 shadow-xl">
              {canDirectDownload ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-gold" />
                  </div>
                  <h2 className="text-black text-2xl font-bold mb-2">Welcome back, <span className="text-gold">{leadData?.fullName || leadData?.email}</span></h2>
                  <p className="text-zinc-500 text-sm mb-8">Click below to instantly access your Market Intelligence book.</p>
                  <Button variant="primary" size="lg" onClick={handleDirectDownload} disabled={isGeneratingPdf} className="w-full h-14 text-base shadow-[0_10px_30px_rgba(200,167,102,0.4)] hover:shadow-[0_15px_40px_rgba(200,167,102,0.5)] transition-all">
                    <Download className="w-5 h-5 mr-2" />{isGeneratingPdf ? "Downloading UAE Market Intelligence 2026..." : "Download UAE Market Intelligence 2026"}<ArrowUpRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-4 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 flex items-center justify-center flex-shrink-0">
                      <Unlock className="w-6 h-6 text-gold" />
                    </div>
                    <div>
                      <h2 className="text-black text-2xl font-bold">Unlock Your Book</h2>
                      <p className="text-zinc-600 mt-1">Complete the form below to unlock instant access to the UAE Market Intelligence book.</p>
                    </div>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <Label className="text-zinc-700 text-sm font-medium">Full Name *</Label>
                      <Input value={form.fullName} onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} placeholder="Enter your full name" className="mt-2 bg-zinc-50 border-zinc-300 text-black h-12 rounded-xl focus:border-gold/50 focus:ring-gold/20" />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-black text-sm font-medium">Email <span className="text-gold">*</span></Label>
                        <Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="your@email.com" className="mt-2 bg-zinc-50 border-zinc-300 text-black placeholder:text-gold h-12 rounded-xl focus:border-gold/50 focus:ring-gold/20" />
                      </div>
                      <div>
                        <Label className="text-black text-sm font-medium">Phone <span className="text-gold">*</span></Label>
                        <Input type="tel" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="+971 50 123 4567" className="mt-2 bg-zinc-50 border-zinc-300 text-black placeholder:text-gold h-12 rounded-xl focus:border-gold/50 focus:ring-gold/20" />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-black text-sm font-medium">Nationality <span className="text-gold">*</span></Label>
                        <div className="mt-2">
                          <SearchableSelect value={form.nationality} onChange={(v) => setForm((p) => ({ ...p, nationality: v }))} options={countries} placeholder="Select nationality" searchPlaceholder="Search countries..." priorityItem="United Arab Emirates" flagType="country" />
                        </div>
                      </div>
                      <div>
                        <Label className="text-black text-sm font-medium">Preferred Language <span className="text-gold">*</span></Label>
                        <div className="mt-2">
                          <SearchableSelect value={form.language} onChange={(v) => setForm((p) => ({ ...p, language: v }))} options={languages} placeholder="Select language" searchPlaceholder="Search languages..." priorityItem="English" flagType="language" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="pt-6">
                    <Button onClick={handleSubmit} disabled={!isValid || isSubmitting || isGeneratingPdf} variant="primary" size="lg" className="w-full h-14">
                      {isSubmitting || isGeneratingPdf ? (
                        <><div className="w-5 h-5 mr-2 border-2 border-black/30 border-t-black rounded-full animate-spin" />{isGeneratingPdf ? "Downloading UAE Market Intelligence 2026..." : "Processing..."}</>
                      ) : (
                        <><Unlock className="w-5 h-5 mr-2" />Unlock & Download Now<ArrowUpRight className="w-5 h-5 ml-2" /></>
                      )}
                    </Button>
                  </div>
                  <p className="text-zinc-600 text-xs leading-relaxed text-center mt-4">
                    By downloading, you agree your details may be used to contact you about UAE real estate opportunities.
                  </p>
                </>
              )}
            </motion.section>

            {/* Sidebar */}
            <motion.aside initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="lg:col-span-2 space-y-6">
              <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/30 rounded-3xl p-8 shadow-lg">
                <h2 className="text-black text-xl font-bold mb-6">What You'll Receive</h2>
                <ul className="space-y-4">
                  {["Structured market overview (educational)", "Developer & community comparison frameworks", "Investment due diligence checklist", "Complimentary AI Home Finder access", "Expert insights from the founder"].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                      <span className="text-zinc-700 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/30 rounded-2xl p-6 text-center shadow-lg">
                <p className="text-zinc-600 text-xs mb-1">Created by <span className="text-black font-semibold">JBJ Global Real Estate</span></p>
                <p className="text-zinc-700 text-sm">Exclusive for <a href="/about" className="text-gold font-semibold hover:underline">JBJ Global Real Estate</a></p>
                <p className="text-zinc-500 text-[10px] mt-2 uppercase tracking-widest">Real Estate Brokerage • Dubai, UAE</p>
              </div>
            </motion.aside>
          </div>
        </div>
      </section>

      <MarketReportCTAModal open={showCTAModal} onOpenChange={setShowCTAModal} userName={form.fullName || leadData?.fullName} />
    </div>
  );
};

export default MarketReport;
