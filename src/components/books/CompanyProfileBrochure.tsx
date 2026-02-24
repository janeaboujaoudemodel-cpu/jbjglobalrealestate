import { motion } from 'framer-motion';
import { ArrowRight, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { companyProfileBook } from '@/data/bookCollections';

interface CompanyProfileBrochureProps {
  /** Show download overlay on hover (for Company Profile page) */
  showDownload?: boolean;
  onDownload?: () => void;
  isGenerating?: boolean;
  /** Compact mode for sidebars or smaller placements */
  compact?: boolean;
}

/**
 * Unified premium Company Profile brochure component.
 * Renders the same 3D book + description across all pages.
 */
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
      className={`group mx-auto flex ${compact ? 'flex-col items-center gap-4' : 'flex-col sm:flex-row items-center gap-6'} max-w-lg`}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      {/* 3D Brochure Cover */}
      <div className="relative" style={{ perspective: '1200px' }}>
        <div className="absolute -bottom-3 left-3 right-3 h-6 bg-black/20 blur-xl rounded-full" />
        <div
          className={`relative ${compact ? 'w-32 h-44' : 'w-36 h-48 md:w-40 md:h-52'} transition-transform duration-500 group-hover:[transform:rotateY(-8deg)]`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front cover */}
          <div className="relative rounded-r-lg overflow-hidden border-2 border-gold/60"
            style={{
              boxShadow: '0 12px 35px rgba(200,167,102,0.4), 0 8px 20px rgba(0,0,0,0.2), inset 0 1px 3px rgba(255,255,255,0.3)',
            }}
          >
            <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/40 via-black/20 to-transparent z-10" />
            <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-white/15 to-transparent z-10" />
            <img src={companyProfileBook.cover} alt="Company Profile" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
            <div className="absolute bottom-0 left-0 right-0 p-3 text-center z-20">
              <p className="text-gold text-[10px] uppercase tracking-[0.2em] font-semibold">JBJ Global Real Estate</p>
              <p className="text-white text-xs font-bold mt-0.5">Company Profile</p>
            </div>
          </div>

          {/* 3D Spine */}
          <div
            className="absolute top-0 left-0 w-3 h-full bg-gradient-to-r from-zinc-800 to-zinc-700 origin-left"
            style={{ transform: 'rotateY(-90deg) translateX(-6px)' }}
          />
          {/* 3D Pages edge */}
          <div
            className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-b from-[#f5f0e0] to-[#e8dcc8]"
            style={{ transform: 'rotateX(90deg) translateY(4px)', transformOrigin: 'bottom' }}
          />
        </div>

        {/* Download overlay */}
        {showDownload && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg z-30">
            {isGenerating ? (
              <div className="w-10 h-10 border-3 border-gold/30 border-t-gold rounded-full animate-spin" />
            ) : (
              <div className="text-center">
                <Download className="w-10 h-10 text-gold mx-auto mb-1" />
                <p className="text-white text-xs font-semibold">Download PDF</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Text description */}
      {!compact && (
        <div className="text-center sm:text-left">
          <p className="text-gold text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">Corporate Dossier</p>
          <h3 className="text-lg md:text-xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            JBJ Global Real Estate
          </h3>
          <p className="text-black/50 text-xs leading-relaxed mb-3">
            Our comprehensive company profile — vision, leadership, portfolio, awards, and investment track record.
          </p>
          <span className="inline-flex items-center gap-1.5 text-gold text-xs font-semibold group-hover:gap-2 transition-all">
            {showDownload ? 'Download Profile' : 'View Company Profile'} <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      )}
    </motion.button>
  );
}
