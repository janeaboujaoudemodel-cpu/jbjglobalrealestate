import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { motion } from "framer-motion";
import {
  ArrowUpRight, BookOpen, CheckCircle, Check, Download, FileText,
  Shield, Sparkles, Star, TrendingUp, Unlock, Printer, X,
} from "lucide-react";
import MarketReportCTAModal from "@/components/broker/MarketReportCTAModal";
import { FounderContent } from "@/components/FounderContent";
import luxuryVilla1 from "@/assets/luxury-villa-1.jpeg";
import founderCompanyProfile from "@/assets/founder-company-profile.jpg";
import { useMarketReport } from "./useMarketReport";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";

/**
 * Market Report — Champagne contract rebuild.
 *
 * Brand rules applied (per mem://index.md):
 *  - Page = champagne #FDFBF7 with ink #1A1A1A text. No navy/neon shell.
 *  - Cards match the homepage "Compare Your Property" panel: surface #F7F2EA,
 *    gold #B89555 1px hairline, rounded-3xl, soft elevation, generous padding.
 *  - CTAs use .jj-pill-emerald-metallic with WHITE foreground (no black).
 *  - Feature/check tiles = emerald square with WHITE glyph + ink label.
 *  - Founder portrait sits inside an emerald ring (no quality loss — same
 *    object-fit, ring is a separate layer).
 *  - All titles, subtitles, quote, signatures = ink. No more white-on-cream.
 */
const MarketReport = () => {
  const {
    countries, languages, form, setForm,
    isSubmitting, isGeneratingPdf, showThankYou,
    bookHtml, setBookHtml, showBookPreview, setShowBookPreview,
    showCTAModal, setShowCTAModal, bookFrameRef,
    isValid, canDirectDownload, leadData, isFounderVisible: _isFounderVisible,
    handleSubmit, handleDirectDownload,
  } = useMarketReport();

  // Shared classnames so every card on the page reads identically to the
  // homepage Compare Your Property card.
  const CARD_BASE =
    "bg-[#F7F2EA] border border-[#B89555]/35 rounded-3xl shadow-[0_8px_28px_rgba(26,26,26,0.06)]";

  return (
    <div
      data-insights-page
      data-marketing-page
      className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A]"
    >
      {/* Thank You Modal — champagne card, ink text, emerald tick */}
      {showThankYou && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A1A]/55 backdrop-blur-sm px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${CARD_BASE} p-10 max-w-md w-full text-center`}
          >
            <div
              className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center shadow-[0_8px_22px_rgba(6,78,59,0.28)]"
              style={{ backgroundImage: "var(--jj-emerald-ombre)" }}
              data-no-contrast-guard
            >
              <Check className="w-10 h-10" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} strokeWidth={3} />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-[#1A1A1A]">Thank You!</h2>
            <p className="text-[#1A1A1A] text-base font-semibold mb-2">From JBJ Global Real Estate</p>
            <p className="text-[#1A1A1A]/75 mb-6 text-sm">
              You have successfully unlocked your Market Intelligence Book. Opening now…
            </p>
            <div className="flex items-center justify-center gap-2 text-[#1A1A1A]/80">
              <div className="w-5 h-5 border-2 border-[#0B5132]/30 border-t-[#0B5132] rounded-full animate-spin" />
              <span className="text-sm">Preparing your book…</span>
            </div>
          </motion.div>
        </div>
      )}

      {/* In-page Book Viewer */}
      {showBookPreview && bookHtml && (
        <div className="fixed inset-0 z-[60] bg-[#1A1A1A]/70 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6 h-full flex items-center justify-center">
            <div className={`${CARD_BASE} w-full max-w-6xl h-[88vh] overflow-hidden`}>
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#B89555]/30 bg-[#FDFBF7]">
                <div className="min-w-0">
                  <p className="text-xs text-[#1A1A1A]/65">JBJ Global Real Estate</p>
                  <h2 className="text-[#1A1A1A] font-semibold truncate">
                    UAE Real Estate Market Intelligence 2026
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => bookFrameRef.current?.contentWindow?.print()}
                    className="border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]"
                  >
                    <Printer className="w-4 h-4 mr-2" />Save as PDF
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => { setShowBookPreview(false); setBookHtml(null); }}
                    className="jj-pill-emerald-metallic"
                  >
                    <X className="w-4 h-4 mr-2" />Close
                  </Button>
                </div>
              </div>
              <iframe
                ref={bookFrameRef}
                title="UAE Real Estate Market Intelligence 2026"
                srcDoc={bookHtml}
                className="w-full h-[calc(88vh-52px)] bg-[#FDFBF7]"
                sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox"
              />
            </div>
          </div>
        </div>
      )}

      {/* ============== HERO ============== */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 bg-[#FDFBF7]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1240px]">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Book Visual — image fills the full cover */}
            <motion.div
              initial={{ opacity: 0, x: -30, rotateY: -15 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div
                className="relative mx-auto w-[280px] md:w-[340px] group"
                style={{ perspective: "1200px" }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const centerX = rect.width / 2;
                  const rotateY = x < centerX ? 18 : -18;
                  e.currentTarget
                    .querySelector<HTMLDivElement>(".book-inner")
                    ?.style.setProperty(
                      "transform",
                      `rotateY(${rotateY}deg) rotateX(3deg) translateZ(40px) scale(1.04)`
                    );
                }}
                onMouseLeave={(e) => {
                  e.currentTarget
                    .querySelector<HTMLDivElement>(".book-inner")
                    ?.style.setProperty("transform", "rotateY(-10deg) rotateX(4deg)");
                }}
              >
                <div
                  className="book-inner relative transition-transform duration-500 ease-out aspect-[3/4]"
                  style={{
                    transformStyle: "preserve-3d",
                    transform: "rotateY(-10deg) rotateX(4deg)",
                  }}
                >
                  {/* Book body — no gold/emerald border, photo fills edge-to-edge */}
                  <div
                    className="relative w-full h-full rounded-md overflow-hidden"
                    style={{
                      boxShadow:
                        "18px 22px 50px rgba(0,0,0,0.28), -3px -3px 14px rgba(184,149,85,0.10)",
                    }}
                  >
                    {/* Full-bleed cover image */}
                    <img
                      src={luxuryVilla1}
                      alt="UAE Luxury Real Estate"
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                    {/* Bottom-only gradient so title is legible without darkening the photo */}
                    <div
                      className="absolute inset-x-0 bottom-0 h-2/3"
                      style={{
                        background:
                          "linear-gradient(180deg, rgba(4,30,20,0) 0%, rgba(4,30,20,0.55) 55%, rgba(2,18,12,0.95) 100%)",
                      }}
                    />


                    {/* Cover content */}
                    <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-7">
                      <div
                        className="inline-flex self-start items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.18em] mb-3"
                        style={{
                          backgroundImage: "var(--jj-emerald-ombre)",
                          color: "#FFFFFF",
                          WebkitTextFillColor: "#FFFFFF",
                        }}
                        data-no-contrast-guard
                      >
                        <Sparkles className="w-3 h-3" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
                        Latest Edition 2026
                      </div>
                      <h3
                        className="text-xl md:text-2xl font-bold leading-tight"
                        style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
                        data-no-contrast-guard
                      >
                        UAE Real Estate
                        <span className="block">Market Intelligence</span>
                      </h3>
                      <FounderContent fallback={null}>
                        <p
                          className="text-[11px] mt-3 opacity-90"
                          style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
                          data-no-contrast-guard
                        >
                          By Founder &amp; CEO Jane Bou Jaoude
                        </p>
                      </FounderContent>
                      <div className="mt-4 pt-3 border-t border-white/25">
                        <p
                          className="text-[9px] tracking-[0.3em] uppercase"
                          style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF", opacity: 0.85 }}
                          data-no-contrast-guard
                        >
                          JBJ Global Real Estate
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Drop shadow under the book */}
                  <div className="absolute -bottom-4 left-6 right-6 h-6 bg-[#1A1A1A]/35 blur-2xl rounded-full" />
                </div>
              </div>

              {/* Free-download pill — emerald (was smoke black) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="absolute -bottom-2 right-2 md:right-8 px-3.5 py-1.5 rounded-full shadow-[0_6px_18px_rgba(6,78,59,0.35)]"
                style={{
                  backgroundImage: "var(--jj-emerald-ombre)",
                  color: "#FFFFFF",
                  WebkitTextFillColor: "#FFFFFF",
                }}
                data-no-contrast-guard
              >
                <span
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
                >
                  Free Download
                </span>
              </motion.div>
            </motion.div>

            {/* Right: Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center lg:text-left"
            >
              <SectionEyebrow icon={FileText} className="mb-6">
                Exclusive Market Report
              </SectionEyebrow>
              <h1 className="text-[#1A1A1A] text-3xl md:text-5xl lg:text-[3.4rem] font-bold leading-[1.05] mb-6 tracking-tight">
                Unlock Your<span className="block">Investment Edge</span>
              </h1>
              <p className="text-[#1A1A1A]/75 text-base md:text-lg leading-relaxed mb-8 max-w-xl lg:max-w-none">
                An educational, founder-led overview designed around government-led sources and
                structured decision frameworks — created exclusively for clients of JBJ Global
                Real Estate.
              </p>

              {/* Feature tiles — emerald icon, white glyph, ink label */}
              <div className="grid grid-cols-2 gap-3 mb-8 max-w-xl mx-auto lg:mx-0">
                {[
                  { icon: TrendingUp, text: "Market Analysis" },
                  { icon: Shield, text: "Due Diligence" },
                  { icon: Star, text: "AI Matchmaker Access" },
                  { icon: BookOpen, text: "Expert Insights" },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-[#F7F2EA] border border-[#B89555]/30"
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(6,78,59,0.25)]"
                        style={{ backgroundImage: "var(--jj-emerald-ombre)" }}
                        data-no-contrast-guard
                      >
                        <Icon className="w-[18px] h-[18px]" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
                      </div>
                      <span className="text-[#1A1A1A] text-sm font-semibold">{item.text}</span>
                    </div>
                  );
                })}
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={() =>
                  document
                    .getElementById("unlock-form")
                    ?.scrollIntoView({ behavior: "smooth", block: "center" })
                }
                className="jj-pill-emerald-metallic h-14 px-7"
              >
                <Download className="w-5 h-5 mr-2" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
                <span style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>
                  Download Your Free Book Now
                </span>
                <ArrowUpRight className="w-5 h-5 ml-2" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============== FOUNDER QUOTE ============== */}
      <FounderContent fallback={null}>
        <section className="py-14 md:py-20 bg-[#FDFBF7]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1240px]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className={`${CARD_BASE} max-w-4xl mx-auto text-center px-6 md:px-12 py-12 md:py-14`}
            >
              {/* Emerald-framed portrait */}
              <div className="relative w-28 h-28 md:w-32 md:h-32 mx-auto mb-6">
                <div
                  className="absolute inset-0 rounded-full p-[3px]"
                  style={{ backgroundImage: "var(--jj-emerald-ombre)" }}
                  aria-hidden="true"
                />
                <div className="absolute inset-[3px] rounded-full overflow-hidden bg-[#FDFBF7]">
                  <img
                    src={founderCompanyProfile}
                    alt="Jane Bou Jaoude, Founder & CEO of JBJ GLOBAL REAL ESTATE"
                    className="w-full h-full object-cover"
                    style={{ objectPosition: "center top" }}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>

              <blockquote className="text-[#1A1A1A] text-lg md:text-2xl font-light leading-relaxed mb-6 italic">
                &ldquo;This book represents years of experience in UAE real estate, distilled into
                actionable frameworks. I created it so investors can make informed decisions with
                confidence.&rdquo;
              </blockquote>
              <div>
                <p className="text-[#1A1A1A] font-semibold text-lg tracking-wide">Jane Bou Jaoude</p>
                <p className="text-[#1A1A1A]/80 text-sm font-medium mt-1">Founder &amp; CEO</p>
                <p className="text-[#1A1A1A]/65 text-sm mt-0.5">JBJ Global Real Estate</p>
              </div>
            </motion.div>
          </div>
        </section>
      </FounderContent>

      {/* ============== DOWNLOAD / FORM ============== */}
      <section className="py-12 md:py-20 bg-[#FDFBF7]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1240px]">
          <div className="grid lg:grid-cols-5 gap-8 lg:gap-10 items-start">
            {/* Form / Welcome card */}
            <motion.section
              id="unlock-form"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className={`${CARD_BASE} lg:col-span-3 p-8 md:p-10`}
            >
              {canDirectDownload ? (
                <div className="text-center py-6">
                  <div
                    className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center shadow-[0_10px_28px_rgba(6,78,59,0.30)]"
                    style={{ backgroundImage: "var(--jj-emerald-ombre)" }}
                    data-no-contrast-guard
                  >
                    <Check
                      className="w-10 h-10"
                      style={{ color: "#FFFFFF", stroke: "#FFFFFF" }}
                      strokeWidth={3}
                    />
                  </div>
                  <h2 className="text-[#1A1A1A] text-2xl md:text-3xl font-bold mb-2">
                    Welcome back,{" "}
                    <span className="text-[#1A1A1A]">
                      {leadData?.fullName || leadData?.email}
                    </span>
                  </h2>
                  <p className="text-[#1A1A1A]/70 text-sm mb-8">
                    Click below to instantly access your Market Intelligence book.
                  </p>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleDirectDownload}
                    disabled={isGeneratingPdf}
                    className="jj-pill-emerald-metallic w-full h-14 text-base"
                  >
                    <Download className="w-5 h-5 mr-2" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
                    <span style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>
                      {isGeneratingPdf
                        ? "Downloading UAE Market Intelligence 2026..."
                        : "Download UAE Market Intelligence 2026"}
                    </span>
                    <ArrowUpRight className="w-5 h-5 ml-2" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-4 mb-8">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-[0_8px_22px_rgba(6,78,59,0.28)]"
                      style={{ backgroundImage: "var(--jj-emerald-ombre)" }}
                      data-no-contrast-guard
                    >
                      <Unlock className="w-6 h-6" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
                    </div>
                    <div>
                      <h2 className="text-[#1A1A1A] text-2xl font-bold">Unlock Your Book</h2>
                      <p className="text-[#1A1A1A]/70 mt-1">
                        Complete the form below to unlock instant access to the UAE Market
                        Intelligence book.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <Label className="text-[#1A1A1A] text-sm font-medium">Full Name *</Label>
                      <Input
                        value={form.fullName}
                        onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                        placeholder="Enter your full name"
                        className="mt-2 bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A] h-12 rounded-xl focus:border-[#0B5132]/60 focus:ring-[#0B5132]/20"
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-[#1A1A1A] text-sm font-medium">Email *</Label>
                        <Input
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                          placeholder="your@email.com"
                          className="mt-2 bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 h-12 rounded-xl focus:border-[#0B5132]/60 focus:ring-[#0B5132]/20"
                        />
                      </div>
                      <div>
                        <Label className="text-[#1A1A1A] text-sm font-medium">Phone *</Label>
                        <Input
                          type="tel"
                          value={form.phone}
                          onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                          placeholder="+971 50 123 4567"
                          className="mt-2 bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 h-12 rounded-xl focus:border-[#0B5132]/60 focus:ring-[#0B5132]/20"
                        />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-[#1A1A1A] text-sm font-medium">Nationality *</Label>
                        <div className="mt-2">
                          <SearchableSelect
                            value={form.nationality}
                            onChange={(v) => setForm((p) => ({ ...p, nationality: v }))}
                            options={countries}
                            placeholder="Select nationality"
                            searchPlaceholder="Search countries..."
                            priorityItem="United Arab Emirates"
                            flagType="country"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-[#1A1A1A] text-sm font-medium">
                          Preferred Language *
                        </Label>
                        <div className="mt-2">
                          <SearchableSelect
                            value={form.language}
                            onChange={(v) => setForm((p) => ({ ...p, language: v }))}
                            options={languages}
                            placeholder="Select language"
                            searchPlaceholder="Search languages..."
                            priorityItem="English"
                            flagType="language"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="pt-6">
                    <Button
                      onClick={handleSubmit}
                      disabled={!isValid || isSubmitting || isGeneratingPdf}
                      variant="primary"
                      size="lg"
                      className="jj-pill-emerald-metallic w-full h-14"
                    >
                      {isSubmitting || isGeneratingPdf ? (
                        <>
                          <div className="w-5 h-5 mr-2 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          <span style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>
                            {isGeneratingPdf
                              ? "Downloading UAE Market Intelligence 2026..."
                              : "Processing..."}
                          </span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-5 h-5 mr-2" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
                          <span style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>
                            Unlock &amp; Download Now
                          </span>
                          <ArrowUpRight className="w-5 h-5 ml-2" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-[#1A1A1A]/60 text-xs leading-relaxed text-center mt-4">
                    By downloading, you agree your details may be used to contact you about UAE
                    real estate opportunities.
                  </p>
                </>
              )}
            </motion.section>

            {/* Sidebar */}
            <motion.aside
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="lg:col-span-2 space-y-6"
            >
              {/* What You'll Receive — champagne card, emerald tick tiles, ink text */}
              <div className={`${CARD_BASE} p-8`}>
                <h2 className="text-[#1A1A1A] text-xl md:text-2xl font-bold mb-6">
                  What You&apos;ll Receive
                </h2>
                <ul className="space-y-4">
                  {[
                    "Structured market overview (educational)",
                    "Developer & community comparison frameworks",
                    "Investment due diligence checklist",
                    "Complimentary AI Home Finder access",
                    "Expert insights from the founder",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 shadow-[0_3px_10px_rgba(6,78,59,0.25)]"
                        style={{ backgroundImage: "var(--jj-emerald-ombre)" }}
                        data-no-contrast-guard
                      >
                        <Check
                          className="w-4 h-4"
                          style={{ color: "#FFFFFF", stroke: "#FFFFFF" }}
                          strokeWidth={3}
                        />
                      </div>
                      <span className="text-[#1A1A1A] text-sm leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Brand attribution — emerald metallic to match the download button */}
              <div
                className="jj-pill-emerald-metallic rounded-2xl p-6 text-center"
                data-no-contrast-guard
                style={{ backgroundImage: "var(--jj-emerald-ombre)" }}
              >
                <p
                  className="text-[12px] mb-1"
                  style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF", opacity: 0.9 }}
                >
                  Created by{" "}
                  <span
                    className="font-semibold"
                    style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
                  >
                    JBJ Global Real Estate
                  </span>
                </p>
                <p
                  className="text-sm"
                  style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF", opacity: 0.95 }}
                >
                  Exclusive for{" "}
                  <a
                    href="/about"
                    className="font-semibold underline-offset-4 hover:underline"
                    style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
                  >
                    JBJ Global Real Estate
                  </a>
                </p>
                <p
                  className="text-[10px] mt-3 uppercase tracking-[0.22em]"
                  style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF", opacity: 0.8 }}
                >
                  Real Estate Brokerage • Dubai, UAE
                </p>
              </div>
            </motion.aside>
          </div>
        </div>
      </section>

      <MarketReportCTAModal
        open={showCTAModal}
        onOpenChange={setShowCTAModal}
        userName={form.fullName || leadData?.fullName}
      />
    </div>
  );
};

export default MarketReport;
