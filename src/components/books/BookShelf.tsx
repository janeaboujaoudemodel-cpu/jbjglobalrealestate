import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Clock, ChevronRight, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { BookCoverFace } from '@/components/books/BookCoverFace';
import { BookCard } from '@/components/books/BookCard';
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
        <h2 className="text-xl font-bold text-[#1A1A1A] mb-6 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#1A1A1A]" />
          {title}
        </h2>
        {/* Canonical BookCard grid — no caption beneath, title is engraved on the cover */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-8">
          {books.map((book) => (
            <BookCard
              key={book.title}
              book={book}
              size="sm"
              onClick={() => setSelectedBook(book)}
            />
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
            className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            style={{
              boxShadow: '0 20px 60px rgba(200,167,102,0.3), 0 10px 30px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start gap-5 p-6 border-b border-[#B89555]/20">
              <div className="relative w-24 h-32 rounded-md overflow-hidden shadow-lg flex-shrink-0 border border-[#B89555]/40">
                <BookCoverFace book={selectedBook} size="modal" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-[#1A1A1A] mb-1">{selectedBook.title}</h3>
                <p className="text-[#1A1A1A] text-sm capitalize font-semibold">{selectedBook.category}</p>
                <p className="text-[#1A1A1A]/40 text-xs mt-2">
                  {selectedBook.tableOfContents.length} chapters
                </p>
              </div>
              <button onClick={() => setSelectedBook(null)} className="text-[#1A1A1A] hover:text-[#1A1A1A] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Table of Contents */}
            <div className="p-6 overflow-y-auto max-h-[45vh]">
              <h4 className="text-sm font-semibold text-[#1A1A1A] uppercase tracking-wider mb-4">Table of Contents</h4>
              <div className="space-y-1">
                {selectedBook.tableOfContents.map((item, index) => (
                  <button
                    key={index}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#EFE6D6]/10 transition-colors group text-left"
                    onClick={() => {
                      const directHref = selectedBook._chapterHrefs?.[index];
                      setSelectedBook(null);
                      navigate(directHref || `${selectedBook.href}#chapter-${index + 1}`);
                    }}
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

            {/* Footer */}
            <div className="p-6 border-t border-[#B89555]/20">
              <Button
                className="w-full bg-gradient-to-r from-[#B89555] to-[#A68444] hover:from-[#A68444] hover:to-[#A7862E] text-[#1A1A1A] font-bold py-3 rounded-xl"
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