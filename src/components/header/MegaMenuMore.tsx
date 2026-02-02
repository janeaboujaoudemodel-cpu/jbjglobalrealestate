import React from 'react';
import { 
  BookOpen, BarChart3, Building2, Users, Briefcase, Award, 
  Phone, ClipboardCheck, Heart, MessageCircle, FileText,
  Newspaper, Scale, Layers, Sparkles, MapPin, Calculator,
  GraduationCap, Shield, HelpCircle
} from 'lucide-react';
import {
  MegaMenuIconLink,
  MegaMenuShell,
  MegaMenuSectionTitle,
} from '@/components/header/mega-menu-primitives';

interface MegaMenuMoreProps {
  onClose: () => void;
}

const MegaMenuMore = React.forwardRef<HTMLDivElement, MegaMenuMoreProps>(({ onClose }, ref) => {
  // Column 1: About & Company (10 items - balanced)
  const aboutLinks = [
    { label: 'About Us', href: '/about', icon: Building2 },
    { label: 'Meet the Team', href: '/team', icon: Users },
    { label: 'Our Brokers', href: '/brokers', icon: Users },
    { label: 'Careers', href: '/join', icon: Briefcase },
    { label: 'Our Awards', href: '/awards', icon: Award },
    { label: 'Press Kit', href: '/press-kit', icon: Newspaper },
    { label: 'Company Profile', href: '/company-profile', icon: FileText },
    { label: 'Contact Us', href: '/contact', icon: Phone },
    { label: 'Complaint Procedure', href: '/complaint', icon: ClipboardCheck },
    { label: 'Testimonials', href: '/testimonials', icon: MessageCircle },
  ];

  // Column 2: Resources & Guides (10 items - balanced)
  const resourceLinks = [
    { label: 'Guides Library', href: '/guides', icon: BookOpen },
    { label: 'Market Intelligence', href: '/market-intelligence', icon: BarChart3 },
    { label: 'News & Insights', href: '/news', icon: Newspaper },
    { label: 'FAQ', href: '/faq', icon: HelpCircle },
    { label: 'Buyer Guide', href: '/buyer-guide', icon: GraduationCap },
    { label: 'Seller Guide', href: '/seller-guide', icon: GraduationCap },
    { label: 'Rent Guide', href: '/rent-guide', icon: BookOpen },
    { label: 'Tenant Guide', href: '/tenant-guide', icon: BookOpen },
    { label: 'Landlord Guide', href: '/landlord-guide', icon: BookOpen },
    { label: 'Golden Visa Guide', href: '/guides/golden-visa-uae', icon: Award },
  ];

  // Column 3: Partners & Tools (10 items - balanced)
  const partnerLinks = [
    { label: 'Partners Hub', href: '/partners', icon: Users },
    { label: 'Mortgage Partners', href: '/partners/mortgage', icon: Calculator },
    { label: 'Legal Partners', href: '/partners/legal', icon: Scale },
    { label: 'Company Setup', href: '/partners/company-setup', icon: Building2 },
    { label: 'Visa Services', href: '/partners/visa-services', icon: Award },
    { label: 'Referral Partner', href: '/referral-partner', icon: Users },
    { label: 'AI Home Finder', href: '/quiz', icon: Sparkles },
    { label: 'Property Map', href: '/map', icon: MapPin },
    { label: 'Compare Properties', href: '/compare', icon: Layers },
    { label: 'Sell Your Property', href: '/seller-listing', icon: ClipboardCheck },
  ];

  // Column 4: Legal & Trust (9 items - includes moved items to balance)
  const legalLinks = [
    { label: 'Terms of Service', href: '/terms', icon: FileText },
    { label: 'Privacy Policy', href: '/privacy', icon: Shield },
    { label: 'Cookies Policy', href: '/cookies', icon: FileText },
    { label: 'Trust & Audit Center', href: '/trust-and-audit-center', icon: Shield },
    { label: 'Intellectual Property', href: '/intellectual-property', icon: Shield },
    { label: 'Investor FAQ', href: '/investor-faq', icon: HelpCircle },
    { label: 'Broker FAQ', href: '/broker-faq', icon: HelpCircle },
    { label: 'Investor Education', href: '/investor-education', icon: GraduationCap },
    { label: 'Landlord Portal', href: '/landlord-portal', icon: Building2 },
    { label: 'Philanthropy', href: '/philanthropy', icon: Heart },
  ];

  return (
    <MegaMenuShell ref={ref} noScroll>
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-4 lg:py-5">
        {/* 4 Equal Columns - No Photo, No Scrollers - Compact padding */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Column 1: About & Company */}
          <div className="relative">
            <MegaMenuSectionTitle icon={Building2} title="About & Company" />
            <div className="space-y-0">
              {aboutLinks.map((item) => (
                <MegaMenuIconLink
                  key={item.href}
                  to={item.href}
                  onClick={onClose}
                  icon={item.icon}
                  title={item.label}
                  compact
                />
              ))}
            </div>
            {/* Vertical divider */}
            <div className="hidden lg:block absolute top-0 -right-2 h-full w-px bg-gradient-to-b from-transparent via-gold/40 to-transparent" />
          </div>

          {/* Column 2: Resources & Guides */}
          <div className="relative">
            <MegaMenuSectionTitle icon={BookOpen} title="Resources & Guides" />
            <div className="space-y-0">
              {resourceLinks.map((item) => (
                <MegaMenuIconLink
                  key={item.href}
                  to={item.href}
                  onClick={onClose}
                  icon={item.icon}
                  title={item.label}
                  compact
                />
              ))}
            </div>
            {/* Vertical divider */}
            <div className="hidden lg:block absolute top-0 -right-2 h-full w-px bg-gradient-to-b from-transparent via-gold/40 to-transparent" />
          </div>

          {/* Column 3: Partners & Tools */}
          <div className="relative">
            <MegaMenuSectionTitle icon={Users} title="Partners & Tools" />
            <div className="space-y-0">
              {partnerLinks.map((item) => (
                <MegaMenuIconLink
                  key={item.href}
                  to={item.href}
                  onClick={onClose}
                  icon={item.icon}
                  title={item.label}
                  compact
                />
              ))}
            </div>
            {/* Vertical divider */}
            <div className="hidden lg:block absolute top-0 -right-2 h-full w-px bg-gradient-to-b from-transparent via-gold/40 to-transparent" />
          </div>

          {/* Column 4: Legal & Trust */}
          <div>
            <MegaMenuSectionTitle icon={Shield} title="Legal & Trust" />
            <div className="space-y-0">
              {legalLinks.map((item) => (
                <MegaMenuIconLink
                  key={item.href}
                  to={item.href}
                  onClick={onClose}
                  icon={item.icon}
                  title={item.label}
                  compact
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </MegaMenuShell>
  );
});

MegaMenuMore.displayName = 'MegaMenuMore';

export default MegaMenuMore;
