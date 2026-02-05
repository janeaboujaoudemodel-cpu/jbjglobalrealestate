import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import brokerEducationHeroVideo from "@/assets/videos/broker-education-hero.mp4";
import { 
  GraduationCap, 
  BookOpen, 
  Shield, 
  ArrowDown, 
  ArrowRight,
  Lock,
  Info,
  Briefcase,
} from "lucide-react";
import { useBrokerEducation, EducationBook } from "@/hooks/useBrokerEducation";
import { Book3DCard, BookDetailModal } from "@/components/broker-education";
import Footer from "@/components/Footer";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const LEARNING_PATH_ORDER = [
  "Foundations",
  "Buyer & Investor Advisory",
  "Seller & Landlord Advisory",
  "Market Intelligence",
  "Advanced (Restricted)",
] as const;

const BrokerEducation = () => {
  const { books, loading, progressMap } = useBrokerEducation();
  const [selectedBook, setSelectedBook] = useState<EducationBook | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenBook = (book: EducationBook) => {
    if (!book.is_restricted) {
      setSelectedBook(book);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBook(null);
  };

  // Group books by learning path (do not rely on book_number mapping)
  const groupedBooks = useMemo(() => {
    const byPath = new Map<string, EducationBook[]>();
    for (const b of books) {
      const key = b.learning_path || "Other";
      const existing = byPath.get(key) ?? [];
      existing.push(b);
      byPath.set(key, existing);
    }

    for (const [k, arr] of byPath.entries()) {
      arr.sort((a, b) => {
        const sa = a.sort_order ?? 0;
        const sb = b.sort_order ?? 0;
        if (sa !== sb) return sa - sb;
        return (a.book_number ?? 0) - (b.book_number ?? 0);
      });
      byPath.set(k, arr);
    }

    const keys = Array.from(byPath.keys()).sort((a, b) => {
      const ai = LEARNING_PATH_ORDER.indexOf(a as any);
      const bi = LEARNING_PATH_ORDER.indexOf(b as any);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });

    return keys.map((name) => ({
      name,
      isRestricted: name.toLowerCase().includes("restricted"),
      bookData: byPath.get(name) ?? [],
    }));
  }, [books]);

  return (
    <div className="min-h-screen bg-premium-bg">
      <SEOHead 
        title="Broker Education | Internal Training Library | JBJ GLOBAL REAL ESTATE"
        description="Internal professional training library for JBJ Global Real Estate brokers. 9 comprehensive books covering UAE real estate fundamentals, advisory skills, and market intelligence."
      />

      {/* Hero Section - Unique Video Background (page-specific) */}
      <section className="jj-hero-fullscreen relative flex items-center justify-center overflow-hidden">
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        >
          <source src={brokerEducationHeroVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black" />
        
        <motion.div 
          className="container mx-auto px-4 relative z-10"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge - outside the title (approved pattern) */}
            <motion.div 
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-6"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(200,167,102,0.08) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1.5px solid rgba(200,167,102,0.6)',
              }}
              variants={fadeInUp}
            >
              <span className="w-2 h-2 bg-gold rounded-full animate-pulse" />
              <GraduationCap className="w-4 h-4 text-gold" />
              <span className="text-gold font-semibold text-xs uppercase tracking-widest">Broker Education</span>
            </motion.div>
            
            <motion.h1 
              className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight"
              style={{ fontFamily: "Poppins, sans-serif" }}
              variants={fadeInUp}
            >
              Internal Training <span className="text-gold">Library</span>
            </motion.h1>
            
            <motion.p 
              className="text-lg text-white/80 font-light max-w-2xl mx-auto mb-8"
              variants={fadeInUp}
            >
              9 comprehensive books designed to align brokers with JBJ standards. 
              Internal, proprietary, non-certifying — for the JBJ broker network only.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4">
              <Button 
                variant="hero"
                onClick={() => document.getElementById('library')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <ArrowDown className="w-4 h-4 mr-2" />
                Explore Library
              </Button>
              <Button variant="hero" asChild>
                <Link to="/broker-dashboard">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Page Intro Section - Layer 2 Active Champagne */}
      <section className="py-12 md:py-16">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <Card className="jj-card-inner">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="jj-icon-box-active w-12 h-12 rounded-xl flex-shrink-0">
                    <Info className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-black mb-3">About This Program</h2>
                    <ul className="space-y-2 text-black/70">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-gold rounded-full mt-2 flex-shrink-0" />
                        <span>Internal training program by JBJ Global Real Estate</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-gold rounded-full mt-2 flex-shrink-0" />
                        <span>Designed to align brokers with JBJ professional standards</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-gold rounded-full mt-2 flex-shrink-0" />
                        <span>No external certification rights — internal recognition only</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-gold rounded-full mt-2 flex-shrink-0" />
                        <span>Content is proprietary and access can be modified or revoked</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Education Library Section - Layer 2 Active Champagne */}
      <section id="library" className="py-12 md:py-16 scroll-mt-20">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <div className="text-center mb-12">
              <Badge className="bg-gold/20 text-gold border-gold/30 mb-4">
                <BookOpen className="w-3 h-3 mr-1" />
                  {loading ? "Loading…" : `${books.length} Books • ${groupedBooks.length} Learning Paths`}
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-black mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                Education <span className="text-gold">Library</span>
              </h2>
              <p className="text-black/70 max-w-2xl mx-auto">
                Structured learning paths covering every aspect of professional real estate brokerage in the UAE.
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="space-y-12">
                {groupedBooks.map((path) => (
                  <motion.div 
                    key={path.name}
                    variants={fadeInUp}
                    className="space-y-4"
                  >
                    {/* Learning Path Header */}
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-2.5 h-10 bg-gold/60 rounded-full" />
                      <div>
                        <h3 className="text-xl font-semibold text-black flex items-center gap-2">
                          {path.name}
                          {path.isRestricted && <Lock className="w-4 h-4 text-gold" />}
                        </h3>
                        <p className="text-black/50 text-sm">{path.bookData.length} Book{path.bookData.length > 1 ? 's' : ''}</p>
                      </div>
                    </div>

                    {/* Books Grid - 3D Cards */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                      {path.bookData.map((book, bookIndex) => (
                        <Book3DCard
                          key={book.id}
                          book={book}
                          progress={progressMap[book.id]}
                          onOpen={handleOpenBook}
                          index={bookIndex}
                        />
                      ))}
                    </div>
                  </motion.div>
                ))}

                {!loading && books.length === 0 && (
                  <div className="text-center py-10">
                    <p className="text-black/70">No books are available yet.</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Progress & Recognition Section - Layer 2 Active Champagne */}
      <section className="py-12 md:py-16">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <Card className="jj-card-inner">
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="jj-icon-box-active w-10 h-10 rounded-xl">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <h3 className="text-xl font-semibold text-black">Progress & Recognition</h3>
                    </div>
                    <ul className="space-y-2 text-black/70 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-gold rounded-full mt-2 flex-shrink-0" />
                        <span>Progress tracked internally within the platform</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-gold rounded-full mt-2 flex-shrink-0" />
                        <span>Completion badges are for internal recognition only</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-gold rounded-full mt-2 flex-shrink-0" />
                        <span>Certificates state: "Internal Recognition — JBJ Global Real Estate"</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-gold rounded-full mt-2 flex-shrink-0" />
                        <span>No public sharing or external certification claims</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="jj-icon-box-active w-10 h-10 rounded-xl">
                        <Shield className="w-5 h-5" />
                      </div>
                      <h3 className="text-xl font-semibold text-black">Access Rules</h3>
                    </div>
                    <ul className="space-y-2 text-black/70 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-gold rounded-full mt-2 flex-shrink-0" />
                        <span>This program is proprietary to JBJ Global Real Estate</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-gold rounded-full mt-2 flex-shrink-0" />
                        <span>All content is owned by JBJ Global Real Estate</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-gold rounded-full mt-2 flex-shrink-0" />
                        <span>Access can be modified or revoked at any time</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-gold rounded-full mt-2 flex-shrink-0" />
                        <span>Book 9 (Advanced) requires special access approval</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* CTA Section - Layer 2 Active Champagne */}
      <section className="py-16 md:py-24">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-6" style={{ fontFamily: "Poppins, sans-serif" }}>
              Ready to <span className="text-gold">Get Started?</span>
            </h2>
            <p className="text-lg text-black/70 mb-10">
              Begin your professional development journey with the JBJ broker education library.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="primary" size="lg" asChild>
                <Link to="/broker-dashboard">
                  <Briefcase className="w-5 h-5 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <Button variant="secondary" size="lg" asChild>
                <Link to="/broker-toolkit">
                  <ArrowRight className="w-5 h-5 mr-2" />
                  Broker Tools
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Book Detail Modal */}
      <BookDetailModal
        book={selectedBook}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      <Footer />
    </div>
  );
};

export default BrokerEducation;
