import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { BookCard, BookDetailModal } from "@/components/broker-education";
import GlobalHeader from "@/components/GlobalHeader";
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

const LEARNING_PATHS = [
  { name: 'Foundations', books: [1, 2], color: 'bg-blue-500' },
  { name: 'Buyer & Investor Advisory', books: [3, 4], color: 'bg-emerald-500' },
  { name: 'Seller & Landlord Advisory', books: [5, 6], color: 'bg-amber-500' },
  { name: 'Market Intelligence', books: [7, 8], color: 'bg-purple-500' },
  { name: 'Advanced (Restricted)', books: [9], color: 'bg-red-500' },
];

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

  // Group books by learning path
  const groupedBooks = LEARNING_PATHS.map(path => ({
    ...path,
    bookData: books.filter(b => path.books.includes(b.book_number)),
  }));

  return (
    <div className="min-h-screen bg-black">
      <SEOHead 
        title="Broker Education | Internal Training Library | JBJ GLOBAL REAL ESTATE"
        description="Internal professional training library for JBJ Global Real Estate brokers. 9 comprehensive books covering UAE real estate fundamentals, advisory skills, and market intelligence."
      />
      
      <GlobalHeader />

      {/* Hero Section */}
      <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-zinc-900 via-black to-black">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?auto=format&fit=crop&w=2000&q=80)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black" />
        
        <motion.div 
          className="container mx-auto px-4 relative z-10"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <div className="max-w-4xl mx-auto text-center">
            <motion.div 
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-6"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(200,167,102,0.08) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1.5px solid rgba(200,167,102,0.6)',
              }}
              variants={fadeInUp}
            >
              <GraduationCap className="w-4 h-4 text-gold" />
              <span className="text-gold font-semibold text-xs uppercase tracking-widest">Broker Education</span>
            </motion.div>
            
            <motion.h1 
              className="text-4xl md:text-5xl font-light text-white mb-4 leading-tight"
              variants={fadeInUp}
            >
              Internal Training <span className="text-gold">Library</span>
            </motion.h1>
            
            <motion.p 
              className="text-lg text-zinc-300 font-light max-w-2xl mx-auto mb-8"
              variants={fadeInUp}
            >
              9 comprehensive books designed to align brokers with JBJ standards. 
              Internal, proprietary, non-certifying — for the JBJ broker network only.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4">
              <button 
                onClick={() => document.getElementById('library')?.scrollIntoView({ behavior: 'smooth' })}
                className="group inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-lg transition-all duration-300 bg-gold/10 border border-gold/30 hover:bg-gold/20 text-gold"
              >
                <ArrowDown className="w-4 h-4" />
                Explore Library
              </button>
              <Link to="/broker-dashboard">
                <Button variant="secondary">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Page Intro Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <Card className="bg-gradient-to-br from-zinc-900/90 via-zinc-900/80 to-black border border-gold/20">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gold/10 border border-gold/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Info className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-3">About This Program</h2>
                    <ul className="space-y-2 text-zinc-300">
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

      {/* Education Library Section */}
      <section id="library" className="py-12 md:py-16 scroll-mt-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <div className="text-center mb-12">
              <Badge className="bg-gold/20 text-gold border-gold/30 mb-4">
                <BookOpen className="w-3 h-3 mr-1" />
                9 Books • 5 Learning Paths
              </Badge>
              <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
                Education <span className="text-gold">Library</span>
              </h2>
              <p className="text-zinc-400 max-w-2xl mx-auto">
                Structured learning paths covering every aspect of professional real estate brokerage in the UAE.
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="space-y-12">
                {groupedBooks.map((path, pathIndex) => (
                  <motion.div 
                    key={path.name}
                    variants={fadeInUp}
                    className="space-y-4"
                  >
                    {/* Learning Path Header */}
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`w-3 h-8 ${path.color} rounded-full`} />
                      <div>
                        <h3 className="text-xl font-semibold text-white">{path.name}</h3>
                        <p className="text-zinc-500 text-sm">{path.bookData.length} Book{path.bookData.length > 1 ? 's' : ''}</p>
                      </div>
                    </div>

                    {/* Books Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {path.bookData.map((book, bookIndex) => (
                        <BookCard
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
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Progress & Recognition Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <Card className="bg-gradient-to-br from-zinc-900/90 via-zinc-900/80 to-black border border-gold/20">
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gold/10 border border-gold/30 rounded-xl flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-gold" />
                      </div>
                      <h3 className="text-xl font-semibold text-white">Progress & Recognition</h3>
                    </div>
                    <ul className="space-y-2 text-zinc-300 text-sm">
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
                      <div className="w-10 h-10 bg-gold/10 border border-gold/30 rounded-xl flex items-center justify-center">
                        <Shield className="w-5 h-5 text-gold" />
                      </div>
                      <h3 className="text-xl font-semibold text-white">Access Rules</h3>
                    </div>
                    <ul className="space-y-2 text-zinc-300 text-sm">
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

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-light text-white mb-6">
              Ready to <span className="text-gold">Get Started?</span>
            </h2>
            <p className="text-lg text-zinc-400 mb-10">
              Begin your professional development journey with the JBJ broker education library.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/broker-dashboard">
                <Button variant="primary" size="lg">
                  <Briefcase className="w-5 h-5 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <Link to="/broker-toolkit">
                <Button variant="secondary" size="lg">
                  <ArrowRight className="w-5 h-5 mr-2" />
                  Broker Tools
                </Button>
              </Link>
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
