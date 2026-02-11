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
  Mail,
  Phone,
  Users,
  Building2,
  ClipboardCheck,
  Sparkles,
  Search,
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import {
  MegaMenuIconLink,
  MegaMenuSectionDivider,
  MegaMenuSectionTitle,
} from '@/components/header/mega-menu-primitives';
import { cn } from '@/lib/utils';
import { CONTACT_INFO, getCallUrl, getWhatsAppUrl } from '@/constants/stats';

interface MegaMenuSearchProps {
  onClose: () => void;
  /** Opens the global search modal (optional) */
  onOpenSearch?: (query: string) => void;
}

const MegaMenuSearch = React.forwardRef<HTMLDivElement, MegaMenuSearchProps>(({ onClose, onOpenSearch }, ref) => {
  const [query, setQuery] = React.useState('');

  const openGlobalSearch = () => {
    onClose();
    onOpenSearch?.(query.trim());
  };

  const servicesLinks = [
    { href: '/services/buying-advisory', label: 'Buying Advisory', icon: Home },
    { href: '/services/selling-advisory', label: 'Selling Advisory', icon: ClipboardCheck },
    { href: '/seller-listing', label: 'Sell Your Property Now', icon: ClipboardCheck },
    { href: '/services/rental-advisory', label: 'Rental Advisory', icon: Building2 },
    { href: '/services/investment-advisory', label: 'Investment Advisory', icon: Briefcase },
    { href: '/services/fit-out', label: 'Fit-Out Services', icon: Building2 },
    { href: '/services/snagging', label: 'Snagging Inspection', icon: ClipboardCheck },
    { href: '/guides/golden-visa-uae', label: 'Golden Visa Guide', icon: Globe },
    { href: '/mortgage-calculator', label: 'Mortgage Calculator', icon: Calculator },
  ];

  type ContactIcon = React.ComponentType<{ className?: string }>;
  const contactLinks: Array<{
    href: string;
    label: string;
    icon: ContactIcon;
    iconClassName?: string;
    borderClassName?: string;
    external?: boolean;
  }> = [
    { href: getCallUrl(), label: 'Call Now', icon: Phone, iconClassName: 'text-blue-500', borderClassName: 'border-blue-500/40 hover:border-blue-500', external: true },
    {
      href: getWhatsAppUrl('Hi, I have a question.'),
      label: 'WhatsApp',
      icon: FaWhatsapp,
      iconClassName: 'text-[#25D366]',
      borderClassName: 'border-emerald-500/40 hover:border-emerald-500',
      external: true,
    },
    {
      href: `mailto:${CONTACT_INFO.email}`,
      label: 'Email',
      icon: Mail,
      iconClassName: 'text-black',
      borderClassName: 'border-black/40 hover:border-black',
      external: true,
    },
    { href: '/contact', label: 'Contact Form', icon: FileText, iconClassName: 'text-gold', borderClassName: 'border-gold/40 hover:border-gold' },
  ];

  // Quick Links with Guides Library and Market Intelligence
  const navigationLinks = [
    { href: '/about', label: 'About Us', icon: Building2 },
    { href: '/team', label: 'Meet the Team', icon: Users },
    { href: '/brokers', label: 'Our Brokers', icon: Users },
    { href: '/areas', label: 'Area Guides', icon: MapPin },
    { href: '/guides', label: 'Guides Library', icon: GraduationCap },
    { href: '/market-intelligence', label: 'Market Intelligence', icon: FileText },
    { href: '/developers', label: 'Developers', icon: Building2 },
    { href: '/join', label: 'Careers', icon: Users },
    { href: '/quiz', label: 'AI Home Finder', icon: Sparkles },
  ];

  return (
    <div
      ref={ref}
      className={cn(
        "absolute right-0 top-full mt-2 w-[min(95vw,900px)] rounded-xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)] z-[9999] overflow-hidden"
      )}
      style={{
        background: 'linear-gradient(135deg, #F5EBD7 0%, #E8DCC8 50%, #D4C4A8 100%)',
      }}
    >
      {/* Gold border overlay (matches Language dropdown) */}
      <div className="absolute inset-0 rounded-xl border-2 border-gold/40 pointer-events-none" />

      <div className="px-5 lg:px-8 py-4 lg:py-5">
        <MegaMenuSectionTitle icon={Search} title="Search & Shortcuts" />

        {/* Search bar */}
        <div className="mt-3 flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') openGlobalSearch();
            }}
            placeholder="Search pages, tools & guides"
            className="flex-1 h-12 rounded-xl px-4 text-base text-black placeholder:text-black/40 bg-white/80 border border-gold/30 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all duration-200"
            aria-label="Search"
          />
          <button
            type="button"
            onClick={openGlobalSearch}
            className="h-12 px-6 rounded-xl border-2 border-gold bg-transparent text-black text-base font-bold transition-all duration-300 hover:text-gold hover:shadow-[0_4px_15px_rgba(200,167,102,0.4)] hover:-translate-y-0.5"
          >
            Search
          </button>
        </div>

        <MegaMenuSectionDivider />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
          {/* Services */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gold font-medium mb-2">Services</p>
            <div className="space-y-0">
              {servicesLinks.map((link) => (
                <MegaMenuIconLink
                  key={link.href}
                  to={link.href}
                  onClick={onClose}
                  icon={link.icon}
                  title={link.label}
                  compact
                />
              ))}
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="hidden md:flex items-stretch justify-center">
            <div className="w-px bg-gradient-to-b from-transparent via-gold/40 to-transparent" />
          </div>

          {/* Quick Links */}
          <div className="md:col-start-2 md:col-end-3">
            <p className="text-[10px] uppercase tracking-wider text-gold font-medium mb-2">Quick Links</p>
            <div className="space-y-0">
              {navigationLinks.map((link) => (
                <MegaMenuIconLink
                  key={link.href}
                  to={link.href}
                  onClick={onClose}
                  icon={link.icon}
                  title={link.label}
                  compact
                />
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="flex flex-col md:col-start-3">
            <p className="text-[10px] uppercase tracking-wider text-gold font-medium mb-3">Contact</p>
            <div className="grid grid-cols-2 gap-3 flex-1">
              {contactLinks.map((link) =>
                link.external ? (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      onClose();
                      setTimeout(() => {
                        window.open(link.href, '_blank', 'noopener,noreferrer');
                      }, 100);
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 py-4 px-4 rounded-xl bg-gradient-to-br from-black/10 to-black/5 border-2 hover:bg-black/15 hover:shadow-[0_4px_15px_rgba(200,167,102,0.3)] transition-all duration-300",
                      link.borderClassName ?? "border-gold/40 hover:border-gold"
                    )}
                  >
                    <link.icon className={cn("w-6 h-6", link.iconClassName ?? "text-black")} />
                    <span className="text-black text-sm font-bold">{link.label}</span>
                  </a>
                ) : (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={onClose}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 py-4 px-4 rounded-xl bg-gradient-to-br from-black/10 to-black/5 border-2 hover:bg-black/15 hover:shadow-[0_4px_15px_rgba(200,167,102,0.3)] transition-all duration-300",
                      link.borderClassName ?? "border-gold/40 hover:border-gold"
                    )}
                  >
                    <link.icon className={cn("w-6 h-6", link.iconClassName ?? "text-black")} />
                    <span className="text-black text-sm font-bold">{link.label}</span>
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gold accent bar (matches Language dropdown) */}
      <div className="h-1 bg-gradient-to-r from-gold/50 via-gold to-gold/50" />
    </div>
  );
});

MegaMenuSearch.displayName = 'MegaMenuSearch';

export default MegaMenuSearch;
