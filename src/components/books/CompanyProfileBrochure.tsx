import { motion } from 'framer-motion';
import { ArrowRight, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { companyProfileBook } from '@/data/bookCollections';
import { BookCoverFace } from '@/components/books/BookCoverFace';

interface CompanyProfileBrochureProps {
  showDownload?: boolean;
  onDownload?: () => void;
  isGenerating?: boolean;
  compact?: boolean;
}

export function CompanyProfileBrochure({
  showDownload = false,
  onDownload,
  isGenerating = false,
  compact = false,
}: CompanyProfileBrochureProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (showDownload && onDownload) {
      onDownload();
    } else {
      navigate('/company-profile');
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      className={`group flex ${compact ? 'flex-col items-center gap-4 mx-auto' : 'flex-col items-center gap-6'} max-w-2xl mx-auto`}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      {/* 3D Brochure Cover */}
      <div className="relative flex-shrink-0" style={{ perspective: '1200px' }}>
        {/* Removed bottom shadow div that created a visible line under the book */}
        <div
          className={`relative ${compact ? 'w-32 h-44' : 'w-36 h-48 md:w-40 md:h-52'} transition-transform duration-500 group-hover:[transform:rotateY(-8deg)]`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front cover */}
          <div
            className="relative rounded-r-lg overflow-hidden ring-1 ring-gold/50 bg-[#1A1A1A]"
            style={{
              transform: 'translateZ(1px)',
              backfaceVisibility: 'hidden',
              boxShadow:
                '0 16px 45px rgba(200,167,102,0.5), 0 10px 25px rgba(0,0,0,0.3), 0 0 80px rgba(200,167,102,0.15), inset 0 1px 3px rgba(255,255,255,0.3)',
            }}
          >
            {/* Spine shadow */}
            <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/40 via-black/20 to-transparent z-10" />
            {/* Gold foil shine line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold/60 to-transparent z-10" />
            <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-white/15 to-transparent z-10" />
            <BookCoverFace book={companyProfileBook} bare />
          </div>

          {/* 3D Spine — richer dark gold gradient */}
          <div
            className="absolute top-0 left-0 w-3 h-full origin-left"
            style={{
              transform: 'rotateY(-90deg) translateX(-6px)',
              background: 'linear-gradient(to right, #1a1a1a, #2a2318, #1a1a1a)',
              boxShadow: 'inset 0 0 4px rgba(200,167,102,0.2)',
            }}
          />
        </div>

        {/* Download overlay */}
        {showDownload && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1A1A1A]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg z-30">
            {isGenerating ? (
              <div className="w-10 h-10 border-3 border-[#B89555]/30 border-t-gold rounded-full animate-spin" />
            ) : (
              <div className="text-center">
                <Download className="w-10 h-10 text-[#1A1A1A] mx-auto mb-1" />
                <p className="text-white text-xs font-semibold">Download PDF</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Text description */}
      {!compact && (
        <div className="text-center">
          <h3 className="text-[#1A1A1A] text-lg md:text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
            JBJ Global Real Estate
          </h3>
          <p className="text-[#ECE2D2] text-sm font-semibold mb-2">Company Profile</p>
          <p className="text-white/70 text-xs leading-relaxed mb-3 max-w-xs mx-auto">
            Our comprehensive company profile — vision, leadership, portfolio, awards, and investment track record.
          </p>
          <span className="inline-flex items-center gap-1.5 text-[#1A1A1A] text-xs font-semibold group-hover:gap-2 transition-all">
            {showDownload ? 'Download Profile' : 'View Company Profile'} <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      )}
    </motion.button>
  );
}
