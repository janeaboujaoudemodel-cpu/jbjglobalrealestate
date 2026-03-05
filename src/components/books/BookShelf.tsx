import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Clock, ChevronRight, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { BookCoverFace } from '@/components/books/BookCoverFace';
import type { BookData } from '@/types/books';
export type { BookData, BookTOCItem } from '@/types/books';

interface BookShelfProps {
  books: BookData[];
  title?: string;
}

export function BookShelf({ books, title = 'Books, Guides & Intelligence' }: BookShelfProps) {
  const [selectedBook, setSelectedBook] = useState<BookData | null>(null);
  const navigate = useNavigate();

  return (
    <>
      <div>
        <h2 className="text-xl font-bold text-black mb-6 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-gold" />
          {title}
        </h2>
        {/* No card background — books float directly on the layer */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-8">
          {books.map((book) => (
            <motion.button
              key={book.title}
              onClick={() => setSelectedBook(book)}
              className="group flex flex-col items-center gap-3 w-28 md:w-36"
              whileHover={{ y: -8 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              {/* 3D Book with spine, pages edge, and perspective */}
              <div className="relative flex-shrink-0" style={{ perspective: '1200px' }}>
                <div className="absolute -bottom-2 left-2 right-2 h-4 bg-black/20 blur-lg rounded-full" />
                <div
                  className="relative w-24 h-36 md:w-32 md:h-44 transition-transform duration-500 group-hover:[transform:rotateY(-8deg)]"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Front cover */}
                  <div
                    className="relative rounded-r-lg overflow-hidden ring-1 ring-gold/50 bg-black"
                    style={{
                      transform: 'translateZ(1px)',
                      backfaceVisibility: 'hidden',
                      boxShadow: '0 8px 25px rgba(200,167,102,0.3), 0 4px 12px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.2)',
                    }}
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/40 via-black/20 to-transparent z-10" />
                    <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white/15 to-transparent z-10" />
                    <BookCoverFace book={book} bare />
                  </div>
                  {/* 3D Spine */}
                  <div
                    className="absolute top-0 left-0 w-3 h-full bg-gradient-to-r from-zinc-800 to-zinc-700 origin-left"
                    style={{ transform: 'rotateY(-90deg) translateX(-6px)' }}
                  />
                  {/* 3D pages edge removed to prevent white divider cutting the cover art */}
                </div>
              </div>
              <p className="text-xs text-black/70 text-center font-medium group-hover:text-gold transition-colors leading-tight">
                {book.title}
              </p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* TOC Modal — Gold Champagne Theme */}
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
                <BookCoverFace book={selectedBook} size="modal" />
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

            {/* Table of Contents */}
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
    </>
  );
}