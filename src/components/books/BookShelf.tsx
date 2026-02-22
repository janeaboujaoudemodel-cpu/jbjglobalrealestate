import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Clock, ChevronRight, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export interface BookTOCItem {
  title: string;
  duration?: string;
}

export interface BookData {
  title: string;
  cover: string;
  href: string;
  category: 'guide' | 'faq' | 'education' | 'report';
  tableOfContents: BookTOCItem[];
}

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
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-400" />
          {title}
        </h2>
        <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-[#C8A766]/40 overflow-hidden shadow-[0_0_30px_rgba(200,167,102,0.15)]">
          <CardContent className="p-8">
            <div className="flex flex-wrap justify-center gap-8">
              {books.map((book) => (
                <motion.button
                  key={book.title}
                  onClick={() => setSelectedBook(book)}
                  className="group flex flex-col items-center gap-3 w-36"
                  whileHover={{ y: -8 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className="relative w-32 h-44 rounded-r-md overflow-hidden border border-[#C8A766]/40 shadow-[4px_4px_20px_rgba(0,0,0,0.25)] group-hover:shadow-[6px_6px_30px_rgba(200,167,102,0.4)] transition-shadow">
                    <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/30 to-transparent z-10" />
                    <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-xs text-black/70 text-center font-medium group-hover:text-[#C8A766] transition-colors leading-tight">
                    {book.title}
                  </p>
                </motion.button>
              ))}
            </div>
            <div className="mt-6 h-1 bg-gradient-to-r from-transparent via-[#C8A766]/50 to-transparent rounded-full" />
          </CardContent>
        </Card>
      </div>

      {/* TOC Modal */}
      {selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setSelectedBook(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-zinc-900 border border-amber-500/30 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start gap-5 p-6 border-b border-zinc-800">
              <div className="relative w-24 h-32 rounded-r-md overflow-hidden shadow-lg flex-shrink-0">
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-black/40 to-transparent z-10" />
                <img src={selectedBook.cover} alt={selectedBook.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-white mb-1">{selectedBook.title}</h3>
                <p className="text-amber-400 text-sm capitalize">{selectedBook.category}</p>
                <p className="text-zinc-500 text-xs mt-2">
                  {selectedBook.tableOfContents.length} chapters
                </p>
              </div>
              <button onClick={() => setSelectedBook(null)} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Table of Contents */}
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              <h4 className="text-sm font-semibold text-amber-400 uppercase tracking-wider mb-4">Table of Contents</h4>
              <div className="space-y-1">
                {selectedBook.tableOfContents.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors group"
                  >
                    <span className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-sm font-medium flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-zinc-300 text-sm flex-1">{item.title}</span>
                    {item.duration && (
                      <span className="flex items-center gap-1 text-zinc-500 text-xs flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        {item.duration}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-amber-400 transition-colors flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-zinc-800">
              <Button
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium"
                onClick={() => {
                  setSelectedBook(null);
                  navigate(selectedBook.href);
                }}
              >
                Open Full Book <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
