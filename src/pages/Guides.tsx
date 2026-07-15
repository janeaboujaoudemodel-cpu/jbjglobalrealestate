import { Link } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import { 
  BookOpen, ArrowRight, HelpCircle, FileText, DollarSign, Shield, BarChart3, CheckCircle, Clock, ChevronRight, X
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { SectionDivider } from "@/components/ui/section-divider";
import { INVESTOR_BOOKS } from "@/data/bookCollections";
import { BookCard } from "@/components/books/BookCard";
import type { BookData } from "@/types/books"; // used for selectedBook state typing
import { GuideHero } from "@/components/guides/GuideHero";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const allGuideBooks = INVESTOR_BOOKS.filter(b => b.title !== 'Guides Library');

const learningTopics = [
  { icon: FileText, title: "Transaction structure and roles", description: "Understand the step-by-step process and who does what" },
  { icon: CheckCircle, title: "Common documents and checkpoints", description: "Know what paperwork is required and when" },
  { icon: DollarSign, title: "Fee clarity and what is paid when", description: "Transparent breakdown of all costs involved" },
  { icon: Shield, title: "Risk controls and readiness checklists", description: "Protect yourself with proper due diligence" },
  { icon: BarChart3, title: "Market intelligence reading basics", description: "Understand data and trends where relevant" },
  { icon: CheckCircle, title: "Payment plan structures and milestones", description: "How installment schedules work in off-plan purchases" }
];

// BookMarquee removed — the auto-scrolling strip lives on the homepage to promote this page.


const Guides = () => {
  const [selectedBook, setSelectedBook] = useState<BookData | null>(null);
  const navigate = useNavigate();

  const goToChapter = (book: BookData, index: number) => {
    const directHref = book._chapterHrefs?.[index];
    const target = directHref || `${book.href}#chapter-${index + 1}`;
    setSelectedBook(null);
    if (target.startsWith('/') && !target.includes('#')) {
      window.location.href = target;
    } else {
      navigate(target);
    }
  };

  return (
    <div data-guides-page className="min-h-screen bg-[#FDFBF7]">
      <SEOHead 
        title="Guides Library | JBJ Global Real Estate"
        description="Structured guides built to answer real questions—fees, steps, timelines, and best-practice workflows across buying, selling, renting, and investing."
        keywords="Dubai real estate guides, buyer guide, seller guide, landlord guide, tenant guide, golden visa guide"
        canonicalPath="/guides"
      />

      <GuideHero
        badge="Guides"
        badgeIcon={BookOpen}
        title="Guides Library"
        description="Structured guides built to answer real questions—fees, steps, timelines, and best-practice workflows across buying, selling, renting, and investing."
        actions={
          <>
            <a href="#guides-library" className="jj-mi-hero-cta jj-mi-hero-cta-emerald allow-white inline-flex items-center justify-center gap-2 px-7 py-3 rounded-lg font-semibold text-sm tracking-wide transition-all">
              Browse Guides
            </a>
            <Link to="/contact" className="jj-mi-hero-cta jj-mi-hero-cta-emerald allow-white inline-flex items-center justify-center gap-2 px-7 py-3 rounded-lg font-semibold text-sm tracking-wide transition-all">
              Ask a Question
            </Link>
          </>
        }
      />


      {/* How This Library Works — surface band */}
      <section className="jj-band jj-band--surface">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="max-w-4xl mx-auto text-center">
          <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-semibold text-[#1A1A1A] mb-4 tracking-[-0.02em]">
            How This Library Works
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-[#1A1A1A]/70 leading-relaxed max-w-2xl mx-auto">
            Choose a guide like a book. Each guide follows the same structure so you can scan quickly and act confidently.
          </motion.p>
        </motion.div>
      </section>

      {/* Explore Guides — raised champagne band (one notch warmer = the divider) */}
      <section id="guides-library" className="jj-band jj-band--raised">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
          <motion.div className="text-center mb-10" variants={fadeInUp}>
            <span className="inline-block text-[11px] font-semibold tracking-[0.24em] uppercase text-[#1A1A1A]/70 mb-3">The Library</span>
            <h2 className="text-3xl md:text-4xl font-semibold mb-3 text-[#1A1A1A] tracking-[-0.02em]">
              Explore Guides
            </h2>
            <p className="text-[#1A1A1A]/70 max-w-2xl mx-auto text-sm md:text-base">
              Select a guide to view the table of contents and open the full page.
            </p>
          </motion.div>

          {/* Books Grid — canonical BookCard, no caption (title is on cover) */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-8 max-w-6xl mx-auto">
            {allGuideBooks.filter(b => b.title !== 'Company Profile').map((book) => (
              <motion.div key={book.title} variants={fadeInUp}>
                <BookCard book={book} size="sm" onClick={() => setSelectedBook(book)} />
              </motion.div>
            ))}
          </div>

          {/* Company Profile — separate row, faded gold hairline */}
          {allGuideBooks.filter(b => b.title === 'Company Profile').map((book) => (
            <motion.div key={book.title} variants={fadeInUp} className="flex justify-center mt-10 pt-8" style={{ borderTop: "1px solid rgba(184,149,85,0.20)" }}>
              <BookCard book={book} size="sm" onClick={() => setSelectedBook(book)} />
            </motion.div>
          ))}
        </motion.div>
      </section>


      {/* What You'll Learn — premium 3-col IconTile grid on page tone */}
      <section className="jj-band jj-band--page">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
          <motion.div className="text-center mb-12" variants={fadeInUp}>
            <span className="inline-block text-[11px] font-semibold tracking-[0.24em] uppercase text-[#1A1A1A]/70 mb-3">Curriculum</span>
            <h2 className="text-3xl md:text-4xl font-semibold text-[#1A1A1A] tracking-[-0.02em] mb-3">
              What You'll Learn
            </h2>
            <p className="text-[#1A1A1A]/70 max-w-2xl mx-auto text-sm md:text-base">
              Six pillars covered consistently across every guide — from process to paperwork to risk.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 max-w-6xl mx-auto">
            {learningTopics.map((topic, index) => {
              const Icon = topic.icon;
              return (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="group rounded-2xl p-7 transition-all duration-300"
                  style={{
                    background: "#FDFBF7",
                    border: "1px solid rgba(184,149,85,0.30)",
                  }}
                  whileHover={{ y: -2 }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "#F7F2EA", border: "1px solid rgba(184,149,85,0.45)" }}
                    >
                      <Icon className="w-5 h-5" style={{ color: "#1A1A1A" }} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-[#1A1A1A] mb-1.5 text-base leading-snug">{topic.title}</h3>
                      <p className="text-sm text-[#1A1A1A]/70 leading-relaxed">{topic.description}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* CTA — canonical MIPreFooterCard (matches services / MI) */}
      <MIPreFooterCard
        title="Not sure where to start?"
        subtitle="Tell us your goal — buy, sell, rent, or invest — and we'll route you to the right guide."
        primaryLink="/contact"
        primaryText="Ask a Question"
        secondaryLink="/contact?type=support"
        secondaryText="Contact Support"
        maxWidthClass="max-w-6xl"
      />



      {/* TOC Modal */}
      {selectedBook && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-24 pb-8"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={() => setSelectedBook(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            style={{ boxShadow: '0 20px 60px rgba(200,167,102,0.3), 0 10px 30px rgba(0,0,0,0.2)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-5 p-6 border-b border-[#B89555]/20">
              <div className="relative w-24 h-32 rounded-md overflow-hidden shadow-lg flex-shrink-0 border border-[#B89555]/40">
                <img src={selectedBook.cover} alt={selectedBook.title} className="w-full h-full object-cover" loading="eager"  decoding="async" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-[#1A1A1A] mb-1">{selectedBook.title}</h3>
                <p className="text-[#1A1A1A] text-sm capitalize font-semibold">{selectedBook.category}</p>
                <p className="text-[#1A1A1A]/40 text-xs mt-2">{selectedBook.tableOfContents.length} chapters</p>
              </div>
              <button onClick={() => setSelectedBook(null)} className="text-[#1A1A1A] hover:text-[#1A1A1A] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[45vh]">
              <h4 className="text-sm font-semibold text-[#1A1A1A] uppercase tracking-wider mb-4">Table of Contents</h4>
              <div className="space-y-1">
                {selectedBook.tableOfContents.map((item, index) => (
                  <button
                    key={index}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#EFE6D6]/10 transition-colors group text-left"
                    onClick={() => goToChapter(selectedBook, index)}
                  >
                    <span className="w-8 h-8 rounded-lg bg-[#1A1A1A] border border-[#B89555]/30 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-[#1A1A1A]/80 text-sm flex-1">{item.title}</span>
                    {item.duration && (
                      <span className="flex items-center gap-1 text-[#1A1A1A]/40 text-xs flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        {item.duration}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-[#1A1A1A]/20 group-hover:text-[#1A1A1A] transition-colors flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-[#B89555]/20">
              <Button
                className="w-full bg-gradient-to-r from-[#B89555] to-[#A68444] hover:from-[#A68444] hover:to-[#A7862E] text-[#1A1A1A] font-bold py-3 rounded-xl"
                style={{ boxShadow: '0 6px 20px rgba(200,167,102,0.3), inset 0 1px 3px rgba(255,255,255,0.5)' }}
                onClick={() => {
                  setSelectedBook(null);
                  window.location.href = selectedBook.href;
                }}
              >
                Open Full Guide <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Guides;
