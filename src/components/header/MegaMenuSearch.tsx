import React from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Calculator,
  FileText,
  Globe,
  GraduationCap,
  Home,
  MapPin,
  MessageCircle,
  Phone,
  Users,
  Building2,
  ClipboardCheck,
  Heart,
  Sparkles,
} from 'lucide-react';
import { MegaMenuSectionTitle } from '@/components/header/mega-menu-primitives';
import { cn } from '@/lib/utils';
import { CONTACT_INFO, getCallUrl, getWhatsAppUrl } from '@/constants/stats';

interface MegaMenuSearchProps {
  onClose: () => void;
}

const MegaMenuSearch = React.forwardRef<HTMLDivElement, MegaMenuSearchProps>(({ onClose }, ref) => {
  const servicesLinks = [
    { href: '/services/buying-advisory', label: 'Buying Advisory', icon: Home },
    { href: '/services/selling-advisory', label: 'Selling Advisory', icon: ClipboardCheck },
    { href: '/services/rental-advisory', label: 'Rental Advisory', icon: Building2 },
    { href: '/services/investment-advisory', label: 'Investment Advisory', icon: Briefcase },
    { href: '/services/property-management', label: 'Property Management', icon: Building2 },
    { href: '/guides/golden-visa-uae', label: 'Golden Visa', icon: Globe },
    { href: '/mortgage-calculator', label: 'Mortgage Calculator', icon: Calculator },
  ];

  const contactLinks = [
    { href: getCallUrl(), label: 'Call Now', icon: Phone, external: true },
    { href: getWhatsAppUrl('Hi, I have a question.'), label: 'WhatsApp', icon: MessageCircle, external: true },
    { href: '/contact', label: 'Contact Form', icon: FileText },
  ];

  const navigationLinks = [
    { href: '/about', label: 'About Us', icon: Building2 },
    { href: '/areas', label: 'Area Guides', icon: MapPin },
    { href: '/developers', label: 'Developers', icon: Building2 },
    { href: '/guides', label: 'Buyer/Seller Guides', icon: GraduationCap },
    { href: '/join', label: 'Careers', icon: Users },
    { href: '/favorites', label: 'My Favorites', icon: Heart },
    { href: '/ai-hub', label: 'AI Tools', icon: Sparkles },
  ];

  return (
    <div
      ref={ref}
      className={cn(
        "z-[9999] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)] rounded-xl overflow-hidden w-[560px]",
      )}
      style={{
        background: 'linear-gradient(135deg, #F5EBD7 0%, #E8DCC8 50%, #D4C4A8 100%)',
      }}
    >
      {/* Gold border */}
      <div className="absolute inset-0 rounded-xl border-2 border-gold/40 pointer-events-none" />
      
      <div className="px-6 py-6">
        <MegaMenuSectionTitle icon={Briefcase} title="Services & Shortcuts" />
        
        <div className="grid grid-cols-2 gap-6 mt-4">
          {/* Services Column */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gold font-medium mb-3">Our Services</p>
            <div className="space-y-1">
              {servicesLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={onClose}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg transition-all duration-300 hover:bg-gradient-to-r hover:from-[#F5EBD7] hover:to-[#E8DCC8] group"
                >
                  <div className="w-7 h-7 rounded-lg bg-black border border-gold/30 flex items-center justify-center group-hover:border-gold transition-colors">
                    <link.icon className="w-3.5 h-3.5 text-gold" />
                  </div>
                  <span className="text-black font-medium text-sm group-hover:text-gold transition-colors">{link.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Navigation & Contact Column */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gold font-medium mb-3">Quick Links</p>
            <div className="space-y-1">
              {navigationLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={onClose}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg transition-all duration-300 hover:bg-gradient-to-r hover:from-[#F5EBD7] hover:to-[#E8DCC8] group"
                >
                  <div className="w-7 h-7 rounded-lg bg-black border border-gold/30 flex items-center justify-center group-hover:border-gold transition-colors">
                    <link.icon className="w-3.5 h-3.5 text-gold" />
                  </div>
                  <span className="text-black font-medium text-sm group-hover:text-gold transition-colors">{link.label}</span>
                </Link>
              ))}
            </div>

            {/* Contact Shortcuts */}
            <div className="h-[1px] bg-gradient-to-r from-transparent via-gold/40 to-transparent my-4" />
            <p className="text-[10px] uppercase tracking-wider text-gold font-medium mb-3">Contact</p>
            <div className="flex gap-2">
              {contactLinks.map((link) => (
                link.external ? (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={onClose}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-black border border-gold/30 hover:border-gold transition-colors group"
                  >
                    <link.icon className="w-4 h-4 text-gold" />
                    <span className="text-gold text-xs font-medium">{link.label}</span>
                  </a>
                ) : (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={onClose}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-black border border-gold/30 hover:border-gold transition-colors group"
                  >
                    <link.icon className="w-4 h-4 text-gold" />
                    <span className="text-gold text-xs font-medium">{link.label}</span>
                  </Link>
                )
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom gold accent */}
      <div className="h-1 bg-gradient-to-r from-gold/50 via-gold to-gold/50" />
    </div>
  );
});

MegaMenuSearch.displayName = 'MegaMenuSearch';

export default MegaMenuSearch;
