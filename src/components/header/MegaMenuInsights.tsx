import React from 'react';
import { 
  Newspaper, BarChart3, FileText, TrendingUp, 
  BookOpen, Calendar, Globe, Target,
  Briefcase, Building2, Users, Calculator, Scale, Award, 
  Phone, Heart, Shield, Sparkles, MapPin,
  UserCircle, GraduationCap, FolderOpen, ClipboardCheck, Layers
} from 'lucide-react';
import {
  MegaMenuIconLink,
  MegaMenuShell,
  MegaMenuSectionTitle,
} from '@/components/header/mega-menu-primitives';
import { useFounderVisibility } from '@/contexts/FounderVisibilityContext';

interface MegaMenuInsightsProps {
  onClose: () => void;
}

const MegaMenuInsights = React.forwardRef<HTMLDivElement, MegaMenuInsightsProps>(({ onClose }, ref) => {
  const { isFounderVisible } = useFounderVisibility();

  // Column 1: News & Updates
  const newsLinks = [
    { label: 'Latest News', href: '/news', icon: Newspaper },
    { label: 'Market Updates', href: '/news?category=market', icon: TrendingUp },
    { label: 'Company News', href: '/news?category=company', icon: Globe },
    { label: 'Press Releases', href: '/press-kit', icon: FileText },
  ];

  // Column 2: Market Intelligence
  const intelligenceLinks = [
    { label: 'Market Overview', href: '/market-intelligence/overview', icon: BarChart3 },
    { label: 'Area Intelligence', href: '/market-intelligence/areas', icon: Target },
    { label: 'Market Reports', href: '/market-intelligence/reports', icon: FileText },
    { label: 'Methodology', href: '/market-intelligence/methodology', icon: BookOpen },
  ];

  // Column 3: Guides & Education
  const guidesLinks = [
    { label: 'Guides Library', href: '/guides', icon: BookOpen },
    { label: 'Buyer Guide', href: '/buyer-guide', icon: FileText },
    { label: 'Seller Guide', href: '/seller-guide', icon: FileText },
    { label: 'Investor Education', href: '/investor-education', icon: TrendingUp },
  ];

  // Column 4: Events & Resources
  const eventsLinks = [
    { label: 'Events Calendar', href: '/events', icon: Calendar },
    { label: 'Webinars', href: '/webinars', icon: Globe },
    { label: 'FAQ', href: '/faq', icon: FileText },
  ];

  // Column 5: Services (absorbed from More menu)
  const servicesLinks = [
    { label: 'Our Services', href: '/services', icon: Briefcase },
    { label: 'Property Management', href: '/services/property-management', icon: Building2 },
    { label: 'Golden Visa', href: '/guides/golden-visa-uae', icon: Award },
    { label: 'Mortgage Advisory', href: '/partners/mortgage', icon: Calculator },
    { label: 'Valuation', href: '/sell/valuation', icon: BarChart3 },
    { label: 'Sell Your Property', href: '/seller-listing', icon: ClipboardCheck },
  ];

  // Column 6: Toolkit (absorbed from More menu)
  const toolkitLinks = [
    { label: 'All Tools', href: '/toolkit', icon: Sparkles },
    { label: 'Creative Suite', href: '/studio', icon: Sparkles },
    { label: 'ROI Calculator', href: '/calculator/roi', icon: Calculator },
    { label: 'Mortgage Calculator', href: '/mortgage-calculator', icon: Calculator },
    { label: 'Compare Properties', href: '/compare', icon: Layers },
    { label: 'Property Map', href: '/map', icon: MapPin },
  ];

  // Column 7: Company (absorbed from More menu)
  const companyLinks = [
    { label: 'About JBJ', href: '/about', icon: Building2 },
    ...(isFounderVisible ? [{ label: 'Founder & Leadership', href: '/founder', icon: UserCircle }] : []),
    { label: 'Meet the Team', href: '/team', icon: Users },
    { label: 'Contact Us', href: '/contact', icon: Phone },
    { label: 'Careers', href: '/join', icon: Briefcase },
  ];

  // Legal & Trust (always visible)
  const legalLinks = [
    { label: 'Terms of Service', href: '/terms', icon: FileText },
    { label: 'Privacy Policy', href: '/privacy', icon: Shield },
    { label: 'Cookie Policy', href: '/cookies', icon: FileText },
    { label: 'Disclaimers', href: '/disclaimers', icon: FileText },
    { label: 'Intellectual Property', href: '/intellectual-property', icon: Shield },
    { label: 'Trust & Audit Center', href: '/trust-and-audit-center', icon: Shield },
  ];

  return (
    <MegaMenuShell ref={ref} noScroll>
      <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-4 lg:py-5">
        {/* 7 Columns - Insights content + absorbed More content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
          {/* Column 1: News & Updates */}
          <div className="relative">
            <MegaMenuSectionTitle icon={Newspaper} title="News & Updates" />
            <div className="space-y-0">
              {newsLinks.map((item) => (
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
            <div className="hidden lg:block absolute top-0 -right-2 h-full w-px bg-gradient-to-b from-transparent via-gold/40 to-transparent" />
          </div>

          {/* Column 2: Market Intelligence */}
          <div className="relative">
            <MegaMenuSectionTitle icon={BarChart3} title="Market Intel" />
            <div className="space-y-0">
              {intelligenceLinks.map((item) => (
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
            <div className="hidden lg:block absolute top-0 -right-2 h-full w-px bg-gradient-to-b from-transparent via-gold/40 to-transparent" />
          </div>

          {/* Column 3: Guides & Education */}
          <div className="relative">
            <MegaMenuSectionTitle icon={BookOpen} title="Guides" />
            <div className="space-y-0">
              {guidesLinks.map((item) => (
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
            <div className="hidden lg:block absolute top-0 -right-2 h-full w-px bg-gradient-to-b from-transparent via-gold/40 to-transparent" />
          </div>

          {/* Column 4: Events & Resources */}
          <div className="relative">
            <MegaMenuSectionTitle icon={Calendar} title="Events" />
            <div className="space-y-0">
              {eventsLinks.map((item) => (
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
            <div className="hidden lg:block absolute top-0 -right-2 h-full w-px bg-gradient-to-b from-transparent via-gold/40 to-transparent" />
          </div>

          {/* Column 5: Services */}
          <div className="relative">
            <MegaMenuSectionTitle icon={Briefcase} title="Services" />
            <div className="space-y-0">
              {servicesLinks.map((item) => (
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
            <div className="hidden lg:block absolute top-0 -right-2 h-full w-px bg-gradient-to-b from-transparent via-gold/40 to-transparent" />
          </div>

          {/* Column 6: Toolkit */}
          <div className="relative">
            <MegaMenuSectionTitle icon={Sparkles} title="Toolkit" />
            <div className="space-y-0">
              {toolkitLinks.map((item) => (
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
            <div className="hidden lg:block absolute top-0 -right-2 h-full w-px bg-gradient-to-b from-transparent via-gold/40 to-transparent" />
          </div>

          {/* Column 7: Company + Legal */}
          <div>
            <MegaMenuSectionTitle icon={Building2} title="Company" />
            <div className="space-y-0">
              {companyLinks.map((item) => (
                <MegaMenuIconLink
                  key={item.href}
                  to={item.href}
                  onClick={onClose}
                  icon={item.icon}
                  title={item.label}
                  compact
                />
              ))}
              {/* Divider before legal */}
              <div className="h-px bg-gold/20 my-2" />
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

MegaMenuInsights.displayName = 'MegaMenuInsights';

export default MegaMenuInsights;
