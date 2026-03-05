import { Link } from "react-router-dom";
import VideoBackground from "@/components/VideoBackground";
import { useState } from "react";
import { motion } from "framer-motion";
import { 
  BookOpen, ArrowRight, HelpCircle, FileText, DollarSign, Shield, BarChart3, CheckCircle, Clock, ChevronRight, X
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { PremiumHeroButton } from "@/components/ui/premium-hero-button";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { SectionDivider } from "@/components/ui/section-divider";
import { INVESTOR_BOOKS } from "@/data/bookCollections";
import { BookCoverFace } from "@/components/books/BookCoverFace";
import type { BookData } from "@/types/books";

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

// All guide books from the collections (guides + FAQs) — exclude Guides Library itself
const allGuideBooks = INVESTOR_BOOKS.filter(b => b.title !== 'Guides Library');

// What You'll Learn items
const learningTopics = [
  {
    icon: FileText,
    title: "Transaction structure and roles",
    description: "Understand the step-by-step process and who does what"
  },
  {
    icon: CheckCircle,
    title: "Common documents and checkpoints",
    description: "Know what paperwork is required and when"
  },
  {
    icon: DollarSign,
    title: "Fee clarity and what is paid when",
    description: "Transparent breakdown of all costs involved"
  },
  {
    icon: Shield,
    title: "Risk controls and readiness checklists",
    description: "Protect yourself with proper due diligence"
  },
  {
    icon: BarChart3,
    title: "Market intelligence reading basics",
    description: "Understand data and trends where relevant"
  },
  {
    icon: CheckCircle,
    title: "Payment plan structures and milestones",
    description: "How installment schedules work in off-plan purchases"
  }
];

const Guides = () => {
  const [selectedBook, setSelectedBook] = useState<BookData | null>(null);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black">
      <SEOHead 
        title="Guides Library | JBJ Global Real Estate"
        description="Structured guides built to answer real questions—fees, steps, timelines, and best-practice workflows across buying, selling, renting, and investing."
        keywords="Dubai real estate guides, buyer guide, seller guide, landlord guide, tenant guide, golden visa guide"
        canonicalPath="/guides"
      />

      {/* Hero Section */}
      <section className="jj-hero-fullscreen relative flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-black">
          <VideoBackground 
            src="https://videos.pexels.com/video-files/3629519/3629519-uhd_2560_1440_25fps.mp4"
            poster="https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1920&q=80"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold/10 via-transparent to-transparent" />
        </div>

        <motion.div 
          className="relative z-10 container mx-auto px-4 py-32 text-center max-w-4xl"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div 
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-6 border border-gold/40 bg-black/30 backdrop-blur-md"
            variants={fadeInUp}
          >
            <BookOpen className="w-4 h-4 text-gold" />
            <span className="text-gold font-semibold text-xs uppercase tracking-[0.2em]">
              Guides
            </span>
          </motion.div>

          <motion.h1 
            className="text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-[-0.02em]"
            style={{ fontFamily: "Poppins, sans-serif" }}
            variants={fadeInUp}
          >
            Guides Library
          </motion.h1>

          <motion.p 
            className="text-white/70 text-base md:text-lg max-w-3xl mx-auto mb-10 leading-relaxed"
            variants={fadeInUp}
          >
            Structured guides built to answer real questions—fees, steps, timelines, and best-practice workflows across buying, selling, renting, and investing.
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4">
            <PremiumHeroButton href="#guides-library">
              Browse Guides
            </PremiumHeroButton>
            <PremiumHeroButton href="/contact">
              Ask a Question
            </PremiumHeroButton>
          </motion.div>
        </motion.div>
        
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <span className="text-gold/60 text-xs tracking-widest uppercase">Explore</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-gold/60 to-transparent" />
        </motion.div>
      </section>

      {/* How This Library Works */}
      <section className="bg-black py-10 md:py-12">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-black mb-6"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              How This Library Works
            </motion.h2>
            <motion.div variants={fadeInUp} className="jj-card-inner max-w-3xl mx-auto">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-black flex items-center justify-center shrink-0">
                  <BookOpen className="w-7 h-7 text-gold" />
                </div>
                <div className="text-left">
                  <p className="text-black/70 leading-relaxed">
                    Choose a guide like a book. Each guide follows the same structure so you can scan quickly and act confidently.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <SectionDivider />

      {/* Guide Books Grid — Floating books on black, no card background */}
      <section id="guides-library" className="py-10 md:py-12 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div className="text-center mb-10" variants={fadeInUp}>
              <h2 className="text-3xl md:text-4xl font-bold mb-3 text-white" style={{ fontFamily: "Playfair Display, serif" }}>
                Explore Guides
              </h2>
              <p className="text-white/60 max-w-2xl mx-auto text-sm">
                Select a guide to view the table of contents and open the full page.
              </p>
            </motion.div>

            {/* Books — No card bg, straight, with proper spacing */}
            <div className="flex flex-wrap justify-center gap-6 md:gap-8 max-w-6xl mx-auto">
              {allGuideBooks.map((book) => (
                <motion.button
                  key={book.title}
                  variants={fadeInUp}
                  onClick={() => setSelectedBook(book)}
                  className="group flex flex-col items-center gap-3 w-28 md:w-36"
                  whileHover={{ y: -8 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className="relative w-24 h-36 md:w-32 md:h-44 rounded-md overflow-hidden border border-gold/40 shadow-[4px_4px_20px_rgba(0,0,0,0.25)] group-hover:shadow-[6px_6px_30px_rgba(200,167,102,0.4)] transition-shadow">
                    <BookCoverFace book={book} bare />
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-xs text-white/70 text-center font-medium group-hover:text-gold transition-colors leading-tight">
                    {book.title}
                  </p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <SectionDivider />

      {/* What You'll Learn */}
      <section className="bg-black py-10 md:py-12">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-black text-center mb-10"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              What You'll Learn
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
              {learningTopics.map((topic, index) => {
                const Icon = topic.icon;
                return (
                  <motion.div key={index} variants={fadeInUp}>
                    <Card className="jj-card-inner h-full">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center shrink-0">
                            <Icon className="w-6 h-6 text-gold" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-black mb-1">{topic.title}</h3>
                            <p className="text-sm text-black/60">{topic.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      <SectionDivider />

      {/* CTA Block */}
      <section className="py-10 md:py-12 bg-black">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center"
          >
            <div className="max-w-5xl mx-auto jj-card-inner border-2 border-gold/30">
              <HelpCircle className="w-12 h-12 text-gold mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black" style={{ fontFamily: "Playfair Display, serif" }}>
                Not sure where to start?
              </h2>
              <p className="text-black/60 mb-8 max-w-xl mx-auto">
                Tell us your goal (buy, sell, rent, invest) and we'll route you to the right guide.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <PremiumHeroButton href="/contact" variant="light-bg">
                  Ask a Question
                </PremiumHeroButton>
                <PremiumHeroButton href="/contact?type=support" variant="light-bg">
                  Contact Support
                </PremiumHeroButton>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* TOC Modal — Gold Champagne Theme, not touching header */}
      {selectedBook && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-20"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={() => setSelectedBook(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            style={{
              boxShadow: '0 20px 60px rgba(200,167,102,0.3), 0 10px 30px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start gap-5 p-6 border-b border-gold/20">
              <div className="relative w-24 h-32 rounded-md overflow-hidden shadow-lg flex-shrink-0 border border-gold/40">
                <img src={selectedBook.cover} alt={selectedBook.title} className="w-full h-full object-cover" loading="eager" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-black mb-1">{selectedBook.title}</h3>
                <p className="text-gold text-sm capitalize font-semibold">{selectedBook.category}</p>
                <p className="text-black/40 text-xs mt-2">
                  {selectedBook.tableOfContents.length} chapters
                </p>
              </div>
              <button onClick={() => setSelectedBook(null)} className="text-gold hover:text-black transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Table of Contents — Clickable sections */}
            <div className="p-6 overflow-y-auto max-h-[45vh]">
              <h4 className="text-sm font-semibold text-gold uppercase tracking-wider mb-4">Table of Contents</h4>
              <div className="space-y-1">
                {selectedBook.tableOfContents.map((item, index) => (
                  <button
                    key={index}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gold/10 transition-colors group text-left"
                    onClick={() => {
                      const directHref = selectedBook._chapterHrefs?.[index];
                      setSelectedBook(null);
                      navigate(directHref || `${selectedBook.href}#chapter-${index + 1}`);
                    }}
                  >
                    <span className="w-8 h-8 rounded-lg bg-black border border-gold/30 flex items-center justify-center text-gold text-sm font-medium flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-black/80 text-sm flex-1">{item.title}</span>
                    {item.duration && (
                      <span className="flex items-center gap-1 text-black/40 text-xs flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        {item.duration}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-black/20 group-hover:text-gold transition-colors flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gold/20">
              <Button
                className="w-full bg-gradient-to-r from-[#C9A84C] to-[#B8973F] hover:from-[#B8973F] hover:to-[#A7862E] text-black font-bold py-3 rounded-xl"
                style={{
                  boxShadow: '0 6px 20px rgba(200,167,102,0.3), inset 0 1px 3px rgba(255,255,255,0.5)',
                }}
                onClick={() => {
                  setSelectedBook(null);
                  navigate(selectedBook.href);
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
