import React, { useState, useRef, useEffect } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MegaMenuSectionTitle } from '@/components/header/mega-menu-primitives';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface MegaMenuSearchProps {
  onClose: () => void;
}

const MegaMenuSearch = React.forwardRef<HTMLDivElement, MegaMenuSearchProps>(({ onClose }, ref) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Auto-focus input when menu opens
  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/properties?search=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  const quickLinks = [
    { label: 'Properties for Sale', href: '/properties?transaction=buy' },
    { label: 'Properties for Rent', href: '/properties?transaction=rent' },
    { label: 'Off-Plan Projects', href: '/properties?status=off-plan' },
    { label: 'Dubai Marina', href: '/area/dubai-marina' },
    { label: 'Palm Jumeirah', href: '/area/palm-jumeirah' },
    { label: 'Downtown Dubai', href: '/area/downtown-dubai' },
  ];

  const handleQuickLink = (href: string) => {
    navigate(href);
    onClose();
  };

  return (
    <div
      ref={ref}
      className={cn(
        "z-[9999] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)] rounded-xl overflow-hidden w-[420px]",
      )}
      style={{
        background: 'linear-gradient(135deg, #F5EBD7 0%, #E8DCC8 50%, #D4C4A8 100%)',
      }}
    >
      {/* Gold border */}
      <div className="absolute inset-0 rounded-xl border-2 border-gold/40 pointer-events-none" />
      
      <div className="px-6 py-6">
        <MegaMenuSectionTitle icon={Search} title="Search Properties" />
        
        {/* Search Input */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search by location, project, or developer..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-12 pr-12 py-4 text-base border-2 border-gold/40 focus:border-gold bg-white/50 rounded-xl"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-black rounded-lg flex items-center justify-center hover:bg-gold transition-colors group"
            >
              <ArrowRight className="w-4 h-4 text-gold group-hover:text-black transition-colors" />
            </button>
          </div>
        </form>
        
        {/* Quick Links */}
        <div className="h-[1px] bg-gradient-to-r from-transparent via-gold/40 to-transparent mb-4" />
        <p className="text-[10px] uppercase tracking-wider text-gold font-medium mb-3">Quick Links</p>
        <div className="grid grid-cols-2 gap-2">
          {quickLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => handleQuickLink(link.href)}
              className="text-left py-2 px-3 rounded-lg transition-all duration-300 hover:bg-gradient-to-r hover:from-[#F5EBD7] hover:to-[#E8DCC8] text-sm text-black hover:text-gold font-medium"
            >
              {link.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Bottom gold accent */}
      <div className="h-1 bg-gradient-to-r from-gold/50 via-gold to-gold/50" />
    </div>
  );
});

MegaMenuSearch.displayName = 'MegaMenuSearch';

export default MegaMenuSearch;
