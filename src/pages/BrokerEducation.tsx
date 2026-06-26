import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import brokerEducationHeroVideoAsset from "@/assets/videos/broker-education-hero.mp4.asset.json";
const brokerEducationHeroVideo = brokerEducationHeroVideoAsset.url;
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
import { Book3DCard, BookDetailModal, BookLanguageFilter } from "@/components/broker-education";
import { cn } from "@/lib/utils";
import { CertificationSection } from "@/components/certification";
import { useAccessControl } from "@/hooks/useAccessControl";
import { useAuth } from "@/contexts/AuthContext";


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
  const { canAccessCourses, isLoading: accessLoading, isJBJEmployee } = useAccessControl();
  const { user } = useAuth();
  const [selectedBook, setSelectedBook] = useState<EducationBook | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookLanguage, setBookLanguage] = useState('en');

  // Courses are locked for non-JBJ Broker Circle members
  const isLocked = !accessLoading && !canAccessCourses;

  const handleOpenBook = (book: EducationBook) => {
    // Allow opening for preview even when locked (modal will show locks on modules)
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
    <div data-marketing-page className="min-h-screen bg-premium-bg">
      <SEOHead 
        title="Broker Education | Internal Training Library | JBJ GLOBAL REAL ESTATE"
        description="Internal professional training library for JBJ Global Real Estate brokers. 9 comprehensive books covering UAE real estate fundamentals, advisory skills, and market intelligence."
      />

      {/* Hero Section - Unique Video Background (page-specific) */}
      <section className="jj-hero-fullscreen jj-hero-compact relative flex items-center justify-center overflow-hidden">
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
              <GraduationCap className="w-4 h-4 text-[#B89555]" />
              <span className="text-[#B89555] font-semibold text-xs uppercase tracking-widest">Broker Education</span>
            </motion.div>
            
            <motion.h1 
              className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight"
              variants={fadeInUp}
            >
              Internal Training <span className="text-[#1A1A1A]">Library</span>
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
                className="border-2 border-white/90 hover:border-[#B89555]"
                onClick={() => document.getElementById('library')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <ArrowDown className="w-4 h-4 mr-2" />
                Explore Library
              </Button>
              <Button variant="hero" className="border-2 border-white/90 hover:border-[#B89555]" asChild>
                <Link to="/broker-dashboard">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Locked Banner for Non-JBJ Broker Circle Members */}
      {isLocked && (
        <section className="py-8">
          <div className="max-w-4xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="jj-card-inner border-2 border-[#B89555]/40 overflow-hidden">
                <CardContent className="p-6 md:p-8 flex flex-col sm:flex-row items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-[#1A1A1A] flex items-center justify-center flex-shrink-0">
                    <Lock className="w-8 h-8 text-[#1A1A1A]" />
                  </div>
                  <div className="text-center sm:text-left flex-1">
                    <h2 className="text-xl md:text-2xl font-bold text-[#1A1A1A] mb-2">
                      Training is <span className="text-[#1A1A1A]">Locked</span>
                    </h2>
                    <p className="text-[#1A1A1A]/60 text-sm mb-0">
                      You can preview all content below, but access is locked until you join the JBJ Broker Circle.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
                    <Button variant="primary" size="sm" asChild>
                      <Link to="/careers">
                        <ArrowRight className="w-4 h-4 mr-2" />
                        {user ? 'Apply Now' : 'Register & Apply'}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>
      )}

      {/* Page Intro + Education Library - Always Visible */}
      <section className="py-8 md:py-10">
        <div className="jj-layer-2">
          {/* About This Program */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="mb-8"
          >
            <Card className="jj-card-inner">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="jj-icon-box-active w-12 h-12 rounded-xl flex-shrink-0">
                    <Info className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-[#1A1A1A] mb-3">Step 1: About This Program</h2>
                    <ul className="space-y-2 text-[#1A1A1A]/70">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-[#EFE6D6] rounded-full mt-2 flex-shrink-0" />
                        <span>Internal training program by JBJ Global Real Estate</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-[#EFE6D6] rounded-full mt-2 flex-shrink-0" />
                        <span>Designed to align brokers with JBJ professional standards</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-[#EFE6D6] rounded-full mt-2 flex-shrink-0" />
                        <span>No external certification rights — internal recognition only</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-[#EFE6D6] rounded-full mt-2 flex-shrink-0" />
                        <span>Content is proprietary and access can be modified or revoked</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Bridge Connector */}
          <div className="flex items-center justify-center gap-3 py-4 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/40 to-gold/60" />
            <div className="flex items-center gap-2 px-4 py-2 bg-[#EFE6D6]/10 border border-[#B89555]/30 rounded-full">
              <ArrowDown className="w-4 h-4 text-[#1A1A1A]" />
              <span className="text-sm text-[#1A1A1A] font-medium uppercase tracking-wider">Now explore your resources</span>
              <ArrowDown className="w-4 h-4 text-[#1A1A1A]" />
            </div>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent via-gold/40 to-gold/60" />
          </div>

          {/* Education Library Content */}
          <motion.div
            id="library"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="scroll-mt-20"
          >
            <div className="text-center mb-12">
              <Badge className="bg-[#EFE6D6]/20 text-[#1A1A1A] border-[#B89555]/30 mb-4">
                <BookOpen className="w-3 h-3 mr-1" />
                  {loading ? "Loading…" : `${books.length} Books • ${groupedBooks.length} Learning Paths`}
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-4">
                Step 2: Education <span className="text-[#1A1A1A]">Library</span>
              </h2>
              <p className="text-[#1A1A1A]/70 max-w-2xl mx-auto mb-6">
                Structured learning paths covering every aspect of professional real estate brokerage in the UAE.
              </p>
              {/* Book Language Filter */}
              <div className="flex justify-center">
                <BookLanguageFilter 
                  value={bookLanguage} 
                  onChange={setBookLanguage} 
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin w-8 h-8 border-2 border-[#B89555] border-t-transparent rounded-full" />
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
                      <div className="w-2.5 h-10 bg-[#EFE6D6]/60 rounded-full" />
                      <div>
                        <h3 className="text-xl font-semibold text-[#1A1A1A] flex items-center gap-2">
                          {path.name}
                          {path.isRestricted && <Lock className="w-4 h-4 text-[#1A1A1A]" />}
                        </h3>
                        <p className="text-[#1A1A1A]/50 text-sm">{path.bookData.length} Book{path.bookData.length > 1 ? 's' : ''}</p>
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
                          isLocked={isLocked}
                        />
                      ))}
                    </div>
                  </motion.div>
                ))}

                {!loading && books.length === 0 && (
                  <div className="text-center py-10">
                    <p className="text-[#1A1A1A]/70">No books are available yet.</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Progress & Recognition Section - Layer 2 Active Champagne */}
      <section className="py-8 md:py-10">
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
                      <h3 className="text-xl font-semibold text-[#1A1A1A]">Progress & Recognition</h3>
                    </div>
                    <ul className="space-y-2 text-[#1A1A1A]/70 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-[#EFE6D6] rounded-full mt-2 flex-shrink-0" />
                        <span>Progress tracked internally within the platform</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-[#EFE6D6] rounded-full mt-2 flex-shrink-0" />
                        <span>Completion badges are for internal recognition only</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-[#EFE6D6] rounded-full mt-2 flex-shrink-0" />
                        <span>Certificates state: "Internal Recognition — JBJ Global Real Estate"</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-[#EFE6D6] rounded-full mt-2 flex-shrink-0" />
                        <span>No public sharing or external certification claims</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="jj-icon-box-active w-10 h-10 rounded-xl">
                        <Shield className="w-5 h-5" />
                      </div>
                      <h3 className="text-xl font-semibold text-[#1A1A1A]">Access Rules</h3>
                    </div>
                    <ul className="space-y-2 text-[#1A1A1A]/70 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-[#EFE6D6] rounded-full mt-2 flex-shrink-0" />
                        <span>This program is proprietary to JBJ Global Real Estate</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-[#EFE6D6] rounded-full mt-2 flex-shrink-0" />
                        <span>All content is owned by JBJ Global Real Estate</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-[#EFE6D6] rounded-full mt-2 flex-shrink-0" />
                        <span>Access can be modified or revoked at any time</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-[#EFE6D6] rounded-full mt-2 flex-shrink-0" />
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

      {/* JBJ Employee Benefits Section */}
      <section className="py-8 md:py-10">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <div className="text-center mb-10">
              <Badge className="bg-[#EFE6D6]/20 text-[#1A1A1A] border-[#B89555]/30 mb-4">
                <Shield className="w-3 h-3 mr-1" />
                JBJ Employee Benefits
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-4">
                What JBJ Brokers <span className="text-[#1A1A1A]">Receive</span>
              </h2>
              <p className="text-[#1A1A1A]/70 max-w-2xl mx-auto">
                Registered JBJ employees get full access to training, tools, and dedicated support.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { icon: Briefcase, title: "AI Tools Access", desc: "Full access to every AI broker tool — lead scoring, market reports, neighborhood intel, and more.", featured: true },
                { icon: Shield, title: "24/7 Support", desc: "Dedicated help via chat, call, or email — anytime." },
                { icon: BookOpen, title: "Continuous Education", desc: "New books and learning paths added every month." },
                { icon: GraduationCap, title: "Events & Networking", desc: "Exclusive broker events, workshops, and circles." },
                { icon: Shield, title: "Admin Support", desc: "A personal assistant to handle your coordination." },
                { icon: Briefcase, title: "Operations Support", desc: "CRM and listing management to keep your pipeline clean." },
                { icon: GraduationCap, title: "Marketing Team", desc: "Dedicated marketing for listings, social, and campaigns." },
                { icon: BookOpen, title: "Personal Admin", desc: "Listings, operations, and client comms — handled." },
              ].map((benefit, i) => (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  className={cn(
                    "group",
                    benefit.featured && "sm:col-span-2 lg:col-span-2 lg:row-span-1",
                  )}
                >
                  <Card
                    className={cn(
                      "relative h-full overflow-hidden border bg-[#F7F2EA] transition-shadow duration-300",
                      "border-[#B89555]/30 shadow-[0_1px_0_0_rgba(184,149,85,0.10)_inset]",
                      "hover:shadow-[0_18px_40px_-22px_rgba(26,26,26,0.18),0_0_0_1px_rgba(184,149,85,0.55)_inset]",
                    )}
                  >
                    {benefit.featured && (
                      <>
                        {/* Animated gold shimmer sweep — featured tile only */}
                        <span
                          aria-hidden
                          className="pointer-events-none absolute inset-0 motion-safe:animate-[shimmerSweep_6s_ease-in-out_infinite]"
                          style={{
                            background:
                              "linear-gradient(115deg, transparent 38%, rgba(184,149,85,0.22) 50%, transparent 62%)",
                            backgroundSize: "220% 100%",
                          }}
                        />
                        {/* Soft gold orb */}
                        <span
                          aria-hidden
                          className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full motion-safe:animate-[pulseSlow_5s_ease-in-out_infinite]"
                          style={{
                            background:
                              "radial-gradient(circle, rgba(184,149,85,0.18) 0%, rgba(184,149,85,0) 70%)",
                          }}
                        />
                      </>
                    )}
                    <CardContent className={cn("relative p-6", benefit.featured && "lg:p-7")}>
                      <div
                        className={cn(
                          "mb-4 flex items-center justify-center rounded-xl border border-[#B89555]/35 bg-[#EFE6D6]",
                          benefit.featured
                            ? "h-14 w-14 motion-safe:animate-[pulseSlow_3.5s_ease-in-out_infinite]"
                            : "h-12 w-12",
                        )}
                        data-no-contrast-guard
                      >
                        <benefit.icon
                          className={cn("text-[#1A1A1A]", benefit.featured ? "h-7 w-7" : "h-6 w-6")}
                        />
                      </div>
                      <div className="flex items-baseline gap-2 mb-2">
                        <h3
                          className={cn(
                            "text-[#1A1A1A] font-semibold tracking-tight",
                            benefit.featured ? "text-xl" : "text-lg",
                          )}
                        >
                          {benefit.title}
                        </h3>
                        {benefit.featured && (
                          <span className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/70 border border-[#B89555]/45 rounded-full px-2 py-0.5">
                            Featured
                          </span>
                        )}
                      </div>
                      <p
                        className={cn(
                          "text-sm leading-relaxed text-[#1A1A1A]/70",
                          !benefit.featured && "line-clamp-2",
                        )}
                      >
                        {benefit.desc}
                      </p>
                      {/* Gold hairline accent at the bottom */}
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-[#B89555]/55 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Certification Section - After Books */}
      <section className="py-8 md:py-10">
        <div className="jj-layer-2">
          <CertificationSection isLocked={isLocked} />
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
            <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-6">
              Join the JBJ <span className="text-[#1A1A1A]">Broker Network</span>
            </h2>
            <p className="text-lg text-[#1A1A1A]/70 mb-10">
              Registered JBJ employees get full access to all books, AI tools, and 24/7 support. Start your journey today.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="primary" size="lg" asChild>
                <Link to="/careers">
                  <ArrowRight className="w-5 h-5 mr-2" />
                  Apply to Join JBJ
                </Link>
              </Button>
              <Button variant="secondary" size="lg" asChild>
                <Link to="/broker-dashboard">
                  <Briefcase className="w-5 h-5 mr-2" />
                  Back to Dashboard
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
        isLocked={isLocked}
      />
    </div>
  );
};

export default BrokerEducation;
