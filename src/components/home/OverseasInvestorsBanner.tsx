import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Globe, Shield, TrendingUp, BadgeCheck, ArrowRight, Building2, Users, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { INVESTOR_BOOKS, companyProfileBook } from "@/data/bookCollections";
import { CompanyProfileBrochure } from "@/components/books/CompanyProfileBrochure";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, ChevronRight, X } from "lucide-react";
import type { BookData } from "@/components/books/BookShelf";

const highlights = [
  { icon: Shield, label: "0% Income Tax", desc: "No personal income or capital gains tax in the UAE" },
  { icon: TrendingUp, label: "10–20 Year ROI", desc: "Proven appreciation with 6–10% average rental yields" },
  { icon: BadgeCheck, label: "Golden Visa Eligible", desc: "AED 2M+ property investments qualify for 10-year residency" },
  { icon: Building2, label: "Full Foreign Ownership", desc: "100% freehold ownership in designated zones" },
  { icon: Users, label: "End-to-End Support", desc: "From property selection to handover — we manage every step" },
  { icon: Globe, label: "Remote Purchase Ready", desc: "Buy from anywhere — virtual viewings, digital signing, full coordination" },
];

// Select key guide books (exclude company profile — shown separately)
const homepageGuideBooks = INVESTOR_BOOKS.filter(b => 
  ['guide', 'education', 'report'].includes(b.category) && b.title !== 'Company Profile'
);

const OverseasInvestorsBanner = () => {
  const [selectedBook, setSelectedBook] = useState<BookData | null>(null);
  const navigate = useNavigate();

  return (
    <section className="bg-black">
      <div className="jj-layer-2">
        {/* Badge */}
        <div className="text-center mb-6 md:mb-8">
          <span className="inline-flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-1.5 md:py-2 bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold rounded-full text-[10px] md:text-xs uppercase tracking-[0.15em] md:tracking-[0.2em] font-semibold shadow-md">
            <Globe className="w-3 h-3 md:w-3.5 md:h-3.5 text-gold" />
            <span className="text-black">International Investors</span>
          </span>
        </div>

        {/* Hero content */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center mb-8 md:mb-12"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            <span className="text-gold">Invest in Dubai</span>{" "}
            <span className="text-black">From Anywhere in the World</span>
          </h2>
          <p className="text-black/60 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Whether you're in Europe, Asia, the Americas, or CIS markets — Dubai offers the world's most investor-friendly environment. 
            Zero income tax, world-class infrastructure, and a 10-year Golden Visa make it the ideal destination for wealth preservation and growth.
          </p>
        </motion.div>

        {/* Highlights Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 max-w-5xl mx-auto mb-8 md:mb-10">
          {highlights.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 rounded-2xl p-4 md:p-5 text-center hover:border-gold hover:shadow-[0_8px_30px_rgba(200,167,102,0.3)] transition-all duration-300"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 mx-auto rounded-xl bg-gradient-to-br from-gold/20 to-gold/10 border-2 border-gold/40 flex items-center justify-center mb-3">
                <item.icon className="w-5 h-5 md:w-6 md:h-6 text-gold" />
              </div>
              <h4 className="text-black text-xs md:text-sm font-bold mb-1">{item.label}</h4>
              <p className="text-black/50 text-[10px] md:text-xs leading-tight">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Reassurance text */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center mb-8"
        >
          <p className="text-black/50 text-xs md:text-sm italic leading-relaxed">
            "From your first inquiry to key collection — our multilingual team guides international investors through every step. 
            Property selection, legal structuring, visa processing, and ongoing asset management. You don't need to be in Dubai. We are."
          </p>
        </motion.div>

        {/* CTA Buttons - Bigger, 3D, Premium */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-12 md:mb-16">
          <Link to="/guides/golden-visa-uae">
            <Button 
              className="bg-gradient-to-r from-[#C9A84C] to-[#B8973F] hover:from-[#B8973F] hover:to-[#A7862E] text-black font-bold px-8 md:px-10 py-4 md:py-5 rounded-2xl text-base md:text-lg border-2 border-gold/60"
              style={{
                boxShadow: `
                  0 10px 30px rgba(200,167,102,0.4),
                  0 6px 15px rgba(0,0,0,0.2),
                  inset 0 2px 4px rgba(255,255,255,0.5),
                  inset 0 -2px 4px rgba(200,167,102,0.3)
                `,
              }}
            >
              <Shield className="w-5 h-5 mr-2" />
              Golden Visa for Investors
            </Button>
          </Link>
          <Link to="/investor-hub">
            <Button 
              className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] text-black font-bold px-8 md:px-10 py-4 md:py-5 rounded-2xl text-base md:text-lg border-2 border-gold/60 hover:border-gold"
              style={{
                boxShadow: `
                  0 10px 30px rgba(200,167,102,0.35),
                  0 6px 15px rgba(0,0,0,0.15),
                  inset 0 2px 4px rgba(255,255,255,0.8),
                  inset 0 -2px 4px rgba(200,167,102,0.2)
                `,
              }}
            >
              <TrendingUp className="w-5 h-5 mr-2" />
              Explore Investment Options
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>

        {/* Guides Section — No background, floating books */}
        <div className="pt-6 border-t border-gold/20">
          <h2 className="text-xl font-bold text-black mb-8 flex items-center justify-center gap-2">
            <BookOpen className="w-5 h-5 text-gold" />
            Explore Our Guides & Reports
          </h2>

          {/* Books — No card background, straight layout */}
          <div className="flex flex-wrap justify-center gap-8 mb-10">
            {homepageGuideBooks.map((book) => (
              <motion.button
                key={book.title}
                onClick={() => setSelectedBook(book)}
                className="group flex flex-col items-center gap-3 w-32 md:w-36"
                whileHover={{ y: -8 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="relative w-28 h-40 md:w-32 md:h-44 rounded-md overflow-hidden border border-gold/40 shadow-[4px_4px_20px_rgba(0,0,0,0.25)] group-hover:shadow-[6px_6px_30px_rgba(200,167,102,0.4)] transition-shadow">
                  <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs text-black/70 text-center font-medium group-hover:text-gold transition-colors leading-tight">
                  {book.title}
                </p>
              </motion.button>
            ))}
          </div>

          {/* Company Profile — Premium standalone row */}
          <div className="border-t border-gold/20 pt-8">
            <CompanyProfileBrochure />
          </div>
        </div>
      </div>

      {/* TOC Modal — Gold Champagne, not touching header */}
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
            <div className="flex items-start gap-5 p-6 border-b border-gold/20">
              <div className="relative w-24 h-32 rounded-md overflow-hidden shadow-lg flex-shrink-0 border border-gold/40">
                <img src={selectedBook.cover} alt={selectedBook.title} className="w-full h-full object-cover" />
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

            <div className="p-6 overflow-y-auto max-h-[45vh]">
              <h4 className="text-sm font-semibold text-gold uppercase tracking-wider mb-4">Table of Contents</h4>
              <div className="space-y-1">
                {selectedBook.tableOfContents.map((item, index) => (
                  <button
                    key={index}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gold/10 transition-colors group text-left"
                    onClick={() => {
                      setSelectedBook(null);
                      navigate(`${selectedBook.href}#chapter-${index + 1}`);
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
    </section>
  );
};

export default OverseasInvestorsBanner;
