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
  Heart,
  Sparkles,
  Search,
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import {
  MegaMenuIconLink,
  MegaMenuSectionDivider,
  MegaMenuSectionTitle,
  MegaMenuShell,
} from '@/components/header/mega-menu-primitives';
import { Input } from '@/components/ui/input';
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
    { href: '/guides/golden-visa-uae', label: 'Golden Visa Guide', icon: Globe },
    { href: '/mortgage-calculator', label: 'Mortgage Calculator', icon: Calculator },
  ];

  type ContactIcon = React.ComponentType<{ className?: string }>;
  const contactLinks: Array<{
    href: string;
    label: string;
    icon: ContactIcon;
    iconClassName?: string;
    external?: boolean;
  }> = [
    { href: getCallUrl(), label: 'Call Now', icon: Phone, iconClassName: 'text-gold', external: true },
    {
      href: getWhatsAppUrl('Hi, I have a question.'),
      label: 'WhatsApp',
      icon: FaWhatsapp,
      iconClassName: 'text-[#25D366]',
      external: true,
    },
    {
      href: `mailto:${CONTACT_INFO.email}`,
      label: 'Email',
      icon: Mail,
      iconClassName: 'text-black',
      external: true,
    },
    { href: '/contact', label: 'Contact Form', icon: FileText, iconClassName: 'text-gold' },
  ];

  const navigationLinks = [
    { href: '/about', label: 'About Us', icon: Building2 },
    { href: '/team', label: 'Meet the Team', icon: Users },
    { href: '/brokers', label: 'Our Brokers', icon: Users },
    { href: '/areas', label: 'Area Guides', icon: MapPin },
    { href: '/developers', label: 'Developers', icon: Building2 },
    { href: '/buyer-guide', label: 'Buyer Guide', icon: GraduationCap },
    { href: '/seller-guide', label: 'Seller Guide', icon: GraduationCap },
    { href: '/join', label: 'Careers', icon: Users },
    { href: '/favorites', label: 'My Favorites', icon: Heart },
    { href: '/ai-hub', label: 'AI Tools', icon: Sparkles },
    { href: '/map', label: 'Property Map', icon: MapPin },
    { href: '/compare', label: 'Compare Properties', icon: ClipboardCheck },
    { href: '/quiz', label: 'AI Home Finder', icon: Sparkles },
  ];

  return (
    <MegaMenuShell ref={ref} className={cn("overflow-hidden")}
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-6 lg:py-7">
        <MegaMenuSectionTitle icon={Search} title="Search & Shortcuts" />

        {/* Search bar (opens the global search modal) */}
        <div className="mt-4 flex items-center gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') openGlobalSearch();
            }}
            placeholder="Search pages, tools, or anything…"
            className="h-11 rounded-xl"
            aria-label="Search"
          />
          <button
            type="button"
            onClick={openGlobalSearch}
            className="h-11 px-4 rounded-xl border border-gold/40 bg-black/10 hover:bg-black/15 text-black text-sm font-semibold transition-colors"
          >
            Search
          </button>
        </div>

        <MegaMenuSectionDivider />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          {/* Services */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gold font-medium mb-3">Services</p>
            <div className="space-y-1">
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

          {/* Quick Links */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gold font-medium mb-3">Quick Links</p>
            <div className="space-y-1">
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
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gold font-medium mb-3">Contact</p>
            <div className="grid grid-cols-2 gap-2">
              {contactLinks.map((link) =>
                link.external ? (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      onClose();
                      window.location.href = link.href;
                    }}
                    className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-black/10 border border-gold/30 hover:border-gold/60 hover:bg-black/15 transition-colors"
                  >
                    <link.icon className={cn("w-4 h-4", link.iconClassName ?? "text-black")} />
                    <span className="text-black text-xs font-semibold">{link.label}</span>
                  </a>
                ) : (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={onClose}
                    className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-black/10 border border-gold/30 hover:border-gold/60 hover:bg-black/15 transition-colors"
                  >
                    <link.icon className={cn("w-4 h-4", link.iconClassName ?? "text-black")} />
                    <span className="text-black text-xs font-semibold">{link.label}</span>
                  </Link>
                )
              )}
            </div>
            <p className="mt-3 text-[11px] text-black/70">
              {CONTACT_INFO.email}
            </p>
          </div>
        </div>
      </div>
    </MegaMenuShell>
  );
});

MegaMenuSearch.displayName = 'MegaMenuSearch';

export default MegaMenuSearch;
