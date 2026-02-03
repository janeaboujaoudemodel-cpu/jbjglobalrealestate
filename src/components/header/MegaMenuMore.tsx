import React from 'react';
import { 
  BookOpen, BarChart3, Building2, Users, Briefcase, Award, 
  Phone, ClipboardCheck, Heart, MessageCircle, FileText,
  Newspaper, Scale, Sparkles, MapPin, Calculator,
  Shield, Map, Compass, Brain, Layers, GraduationCap
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
  // Column 1: About & Company
  const aboutLinks = [
    { label: 'About Us', href: '/about', icon: Building2 },
    { label: 'Meet the Team', href: '/team', icon: Users },
    { label: 'Our Brokers', href: '/brokers', icon: Users },
    { label: 'Careers', href: '/join', icon: Briefcase },
    { label: 'Our Awards', href: '/awards', icon: Award },
    { label: 'Press Kit', href: '/press-kit', icon: Newspaper },
    { label: 'Company Profile', href: '/company-profile', icon: FileText },
    { label: 'Contact Us', href: '/contact', icon: Phone },
    { label: 'Testimonials', href: '/services/testimonials', icon: MessageCircle },
  ];

  // Column 2: Hubs & Libraries (consolidated entry points)
  const hubsLinks = [
    { label: 'Guides Library', href: '/guides', icon: BookOpen },
    { label: 'Market Intelligence', href: '/market-intelligence', icon: BarChart3 },
    { label: 'AI Hub', href: '/ai-hub', icon: Brain },
    { label: 'Investor Hub', href: '/investor-education', icon: Layers },
    { label: 'Broker Hub', href: '/broker-toolkit', icon: GraduationCap },
    { label: 'News & Insights', href: '/news', icon: Newspaper },
    { label: 'Sitemap', href: '/sitemap', icon: Map },
  ];

  // Column 3: Partners & Tools
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

  // Column 4: Legal & Trust
  const legalLinks = [
    { label: 'Terms of Service', href: '/terms', icon: FileText },
    { label: 'Privacy Policy', href: '/privacy', icon: Shield },
    { label: 'Cookies Policy', href: '/cookies', icon: FileText },
    { label: 'Trust & Audit Center', href: '/trust-and-audit-center', icon: Shield },
    { label: 'Intellectual Property', href: '/intellectual-property', icon: Shield },
    { label: 'Complaint Procedure', href: '/services/complaint-procedures', icon: ClipboardCheck },
    { label: 'Landlord Portal', href: '/landlord-portal', icon: Building2 },
    { label: 'Philanthropy', href: '/philanthropy', icon: Heart },
  ];

  return (
    <MegaMenuShell ref={ref} noScroll>
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-4 lg:py-5">
        {/* 4 Equal Columns - Hub-Based Organization */}
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

          {/* Column 2: Hubs & Libraries */}
          <div className="relative">
            <MegaMenuSectionTitle icon={Compass} title="Hubs & Libraries" />
            <div className="space-y-0">
              {hubsLinks.map((item) => (
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
