import React from 'react';
import { 
  Newspaper, BarChart3, FileText, TrendingUp, 
  BookOpen, Calendar, Globe, Target, HelpCircle,
  Briefcase, Building2, Users, Calculator, Award, 
  Phone, Shield, Sparkles, MapPin,
  UserCircle, GraduationCap, FolderOpen, ClipboardCheck, Layers, LayoutDashboard
} from 'lucide-react';
import {
  MegaMenuIconLink,
  MegaMenuShell,
  MegaMenuSectionTitle,
} from '@/components/header/mega-menu-primitives';
import { useFounderVisibility } from '@/contexts/FounderVisibilityContext';
import { useUserModeContext } from '@/contexts/UserModeContext';

interface MegaMenuInsightsProps {
  onClose: () => void;
}

const MegaMenuInsights = React.forwardRef<HTMLDivElement, MegaMenuInsightsProps>(({ onClose }, ref) => {
  const { isFounderVisible } = useFounderVisibility();
  const { isInvestorMode, isBrokerMode } = useUserModeContext();

  // Column 1: News & Updates
  const newsLinks = [
    { label: 'Latest News', href: '/news', icon: Newspaper },
    { label: 'Market Updates', href: '/news?category=market', icon: TrendingUp },
    { label: 'Company News', href: '/news?category=company', icon: Globe },
    { label: 'Press Releases', href: '/press-kit', icon: FileText },
  ];

  // Column 2: Market Intelligence (FULL TEXT)
  const intelligenceLinks = [
    { label: 'Market Overview', href: '/market-intelligence/overview', icon: BarChart3 },
    { label: 'Area Intelligence', href: '/market-intelligence/areas', icon: Target },
    { label: 'Market Reports', href: '/market-intelligence/reports', icon: FileText },
    { label: 'Methodology', href: '/market-intelligence/methodology', icon: BookOpen },
  ];

  // Column 3: Guides & Education (EXPANDED)
  const guidesLinks = [
    { label: 'Guides Library', href: '/guides', icon: BookOpen },
    { label: 'Buyer Guide', href: '/buyer-guide', icon: FileText },
    { label: 'Seller Guide', href: '/seller-guide', icon: FileText },
    { label: 'Landlord Guide', href: '/landlord-guide', icon: FileText },
    { label: 'Tenant Guide', href: '/tenant-guide', icon: FileText },
    { label: 'Rent Guide', href: '/rent-guide', icon: FileText },
    { label: 'Golden Visa', href: '/guides/golden-visa-uae', icon: Award },
    { label: 'FAQ', href: '/faq', icon: HelpCircle },
  ];

  // Column 4: Services
  const servicesLinks = [
    { label: 'Our Services', href: '/services', icon: Briefcase },
    { label: 'Property Management', href: '/services/property-management', icon: Building2 },
    { label: 'Mortgage Advisory', href: '/partners/mortgage', icon: Calculator },
    { label: 'Valuation', href: '/sell/valuation', icon: BarChart3 },
    { label: 'Sell Your Property', href: '/seller-listing', icon: ClipboardCheck },
  ];

  // Column 5: Toolkit
  const toolkitLinks = [
    { label: 'All Tools', href: '/toolkit', icon: Sparkles },
    { label: 'Creative Suite', href: '/studio', icon: Sparkles },
    { label: 'ROI Calculator', href: '/calculator/roi', icon: Calculator },
    { label: 'Mortgage Calculator', href: '/mortgage-calculator', icon: Calculator },
    { label: 'Compare Properties', href: '/compare', icon: Layers },
    { label: 'Property Map', href: '/map', icon: MapPin },
  ];

  // Column 6: Mode-Conditional (Investor OR Broker OR Both)
  const investorLinks = [
    { label: 'Investor Dashboard', href: '/investor-dashboard', icon: LayoutDashboard },
    { label: 'Investor Education', href: '/investor-education', icon: GraduationCap },
    { label: 'Investor FAQ', href: '/investor-faq', icon: HelpCircle },
    { label: 'Investor Services', href: '/investor-services', icon: Briefcase },
  ];

  const brokerLinks = [
    { label: 'Broker Dashboard', href: '/broker-dashboard', icon: LayoutDashboard },
    { label: 'Broker Hub', href: '/broker-toolkit', icon: Briefcase },
    { label: 'Broker Training', href: '/broker-education', icon: GraduationCap },
    { label: 'Certifications', href: '/verify-certificate', icon: Award },
    { label: 'Broker FAQ', href: '/broker-faq', icon: HelpCircle },
    { label: 'Broker Resources', href: '/broker-resources', icon: FolderOpen },
  ];

  // Column 7: Company + Legal
  const companyLinks = [
    { label: 'About JBJ', href: '/about', icon: Building2 },
    ...(isFounderVisible ? [{ label: 'Founder & Leadership', href: '/founder', icon: UserCircle }] : []),
    { label: 'Meet the Team', href: '/team', icon: Users },
    { label: 'Contact Us', href: '/contact', icon: Phone },
  ];

  const careersLinks = [
    { label: 'Careers', href: '/join', icon: Briefcase },
    { label: 'Apply Now', href: '/join-application', icon: FileText },
  ];

  const legalLinks = [
    { label: 'Terms of Service', href: '/terms', icon: FileText },
    { label: 'Privacy Policy', href: '/privacy', icon: Shield },
    { label: 'Cookie Policy', href: '/cookies', icon: FileText },
    { label: 'Disclaimers', href: '/disclaimers', icon: FileText },
    { label: 'Intellectual Property', href: '/intellectual-property', icon: Shield },
    { label: 'Trust & Audit Center', href: '/trust-and-audit-center', icon: Shield },
  ];

  // Determine mode-conditional links to display
  const getModeLinks = () => {
    if (isInvestorMode && isBrokerMode) {
      // Combined mode: show both
      return [...investorLinks, ...brokerLinks];
    } else if (isBrokerMode) {
      return brokerLinks;
    } else {
      return investorLinks;
    }
  };

  const getModeTitle = () => {
    if (isInvestorMode && isBrokerMode) {
      return 'For You';
    } else if (isBrokerMode) {
      return 'Broker Tools';
    } else {
      return 'Investor Tools';
    }
  };

  const modeLinks = getModeLinks();

  return (
    <MegaMenuShell ref={ref} noScroll>
      <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-4 lg:py-5">
        {/* 7 Columns */}
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

          {/* Column 2: Market Intelligence (FULL TEXT) */}
          <div className="relative">
            <MegaMenuSectionTitle icon={BarChart3} title="Market Intelligence" />
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

          {/* Column 3: Guides & Education (EXPANDED) */}
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

          {/* Column 4: Services */}
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

          {/* Column 5: Toolkit */}
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

          {/* Column 6: Mode-Conditional (Investor/Broker/Both) */}
          <div className="relative">
            <MegaMenuSectionTitle icon={LayoutDashboard} title={getModeTitle()} />
            <div className="space-y-0 max-h-[320px] overflow-y-auto">
              {modeLinks.map((item) => (
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

          {/* Column 7: Company + Careers + Legal */}
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
              {/* Careers section */}
              <div className="h-px bg-gold/20 my-2" />
              {careersLinks.map((item) => (
                <MegaMenuIconLink
                  key={item.href}
                  to={item.href}
                  onClick={onClose}
                  icon={item.icon}
                  title={item.label}
                  compact
                />
              ))}
              {/* Legal section */}
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
