import React from 'react';
import { 
  Newspaper, BarChart3, FileText, TrendingUp, 
  BookOpen, Calendar, Globe, Target, HelpCircle,
  Briefcase, Building2, Users, Calculator, Award, 
  Phone, Shield, Sparkles, MapPin, Palette, Cpu, Wrench,
  UserCircle, GraduationCap, FolderOpen, ClipboardCheck, Layers, LayoutDashboard
} from 'lucide-react';
import {
  MegaMenuIconLink,
  MegaMenuShell,
  MegaMenuSection,
} from '@/components/header/mega-menu-primitives';
import { useFounderVisibility } from '@/contexts/FounderVisibilityContext';
import { useUserModeContext } from '@/contexts/UserModeContext';

interface MegaMenuInsightsProps {
  onClose: () => void;
}

const MegaMenuInsights = React.forwardRef<HTMLDivElement, MegaMenuInsightsProps>(({ onClose }, ref) => {
  const { isFounderVisible } = useFounderVisibility();
  const { isInvestorMode, isBrokerMode } = useUserModeContext();

  // Block 1: News & Updates
  const newsLinks = [
    { label: 'Latest News', href: '/news', icon: Newspaper },
    { label: 'Market Updates', href: '/news?category=market', icon: TrendingUp },
    { label: 'Company News', href: '/news?category=company', icon: Globe },
    { label: 'Press Releases', href: '/press-kit', icon: FileText },
  ];

  // Block 2: Market Intelligence
  const intelligenceLinks = [
    { label: 'Market Overview', href: '/market-intelligence/overview', icon: BarChart3 },
    { label: 'Area Intelligence', href: '/market-intelligence/areas', icon: Target },
    { label: 'Market Reports', href: '/market-intelligence/reports', icon: FileText },
    { label: 'Methodology', href: '/market-intelligence/methodology', icon: BookOpen },
  ];

  // Block 3: Guides & Education
  const guidesLinks = [
    { label: 'Guides Library', href: '/guides', icon: BookOpen },
    { label: 'Buyer Guide', href: '/buyer-guide', icon: FileText },
    { label: 'Seller Guide', href: '/seller-guide', icon: FileText },
    { label: 'Landlord Guide', href: '/landlord-guide', icon: FileText },
    { label: 'Tenant Guide', href: '/tenant-guide', icon: FileText },
    { label: 'Golden Visa', href: '/guides/golden-visa-uae', icon: Award },
    { label: 'FAQ', href: '/faq', icon: HelpCircle },
    { label: 'Buyer FAQ', href: '/buyer-faq', icon: HelpCircle },
    { label: 'Seller FAQ', href: '/seller-faq', icon: HelpCircle },
  ];

  // Block 4: Services
  const servicesLinks = [
    { label: 'Our Services', href: '/services', icon: Briefcase },
    { label: 'Property Management', href: '/services/property-management', icon: Building2 },
    { label: 'Mortgage Advisory', href: '/partners/mortgage', icon: Calculator },
    { label: 'Valuation', href: '/sell/valuation', icon: BarChart3 },
    { label: 'Rental Index', href: '/rental-index', icon: TrendingUp },
    { label: 'Short-term Rentals', href: '/services/short-term-rentals', icon: Calendar },
    { label: 'Snagging & Inspection', href: '/services/snagging', icon: ClipboardCheck },
    { label: 'Listing Portal', href: '/listing-portal', icon: ClipboardCheck },
    { label: 'Customer Happiness', href: '/customer-happiness', icon: Users },
  ];

  // Block 5: Business Suites (AI Tool Suites)
  const businessSuitesLinks = [
    { label: 'Real Estate Suite', href: '/business-suite/real-estate', icon: Building2 },
    { label: 'Broker Intelligence', href: '/business-suite/broker', icon: Cpu },
    { label: 'Creative Suite', href: '/business-suite/creative', icon: Palette },
    { label: 'Productivity Suite', href: '/business-suite/productivity', icon: Wrench },
    { label: 'All Tools', href: '/toolkit', icon: Sparkles },
  ];

  // Block 6: Mode-Conditional (Investor OR Broker OR Both)
  const investorLinks = [
    { label: 'Investor Dashboard', href: '/investor-dashboard', icon: LayoutDashboard },
    { label: 'Investor Education', href: '/investor-education', icon: GraduationCap },
    { label: 'Listing Portal', href: '/listing-portal', icon: ClipboardCheck },
    { label: 'Investor FAQ', href: '/investor-faq', icon: HelpCircle },
    { label: 'Landlord FAQ', href: '/landlord-faq', icon: HelpCircle },
  ];

  const brokerLinks = [
    { label: 'Broker Dashboard', href: '/broker-dashboard', icon: LayoutDashboard },
    { label: 'Broker Hub', href: '/broker-toolkit', icon: Briefcase },
    { label: 'Listing Portal', href: '/listing-portal', icon: ClipboardCheck },
    { label: 'Broker Training', href: '/broker-education', icon: GraduationCap },
    { label: 'Broker FAQ', href: '/broker-faq', icon: HelpCircle },
    { label: 'Tenant FAQ', href: '/tenant-faq', icon: HelpCircle },
  ];

  // Block 7: Company
  const companyLinks = [
    { label: 'About JBJ', href: '/about', icon: Building2 },
    ...(isFounderVisible ? [{ label: 'Founder & Leadership', href: '/founder', icon: UserCircle }] : []),
    { label: 'Company Profile', href: '/company-profile', icon: FileText },
    { label: 'Meet the Team', href: '/team', icon: Users },
    { label: 'Awards', href: '/awards', icon: Award },
    { label: 'Philanthropy', href: '/philanthropy', icon: Globe },
    { label: 'Press Kit', href: '/press-kit', icon: Newspaper },
    { label: 'Contact Us', href: '/contact', icon: Phone },
    { label: 'Careers', href: '/join', icon: Briefcase },
    { label: 'Reviews', href: '/reviews', icon: Target },
  ];

  // Block 8: Legal & Compliance
  const legalLinks = [
    { label: 'Terms of Service', href: '/terms', icon: FileText },
    { label: 'Privacy Policy', href: '/privacy', icon: Shield },
    { label: 'Cookie Policy', href: '/cookies', icon: FileText },
    { label: 'Disclaimers', href: '/disclaimers', icon: FileText },
    { label: 'AML & KYC Policy', href: '/aml-kyc', icon: Shield },
    { label: 'Accessibility', href: '/accessibility', icon: FileText },
    { label: 'Intellectual Property', href: '/intellectual-property', icon: Shield },
    
    { label: 'Trust & Audit', href: '/trust-and-audit-center', icon: Shield },
  ];

  // Determine mode-conditional links to display
  const getModeLinks = () => {
    if (isInvestorMode && isBrokerMode) {
      return [...investorLinks.slice(0, 2), ...brokerLinks.slice(0, 2)];
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
        <div className="max-w-[1400px] mx-auto px-3 lg:px-5 py-1.5 lg:py-2">
          {/* 4 + 4 Grid Layout — connected sections with dividers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0">
            {/* Row 1 */}
            <div className="lg:border-r lg:border-[#B89555]/30">
              <MegaMenuSection icon={Newspaper} title="News & Updates">
                {newsLinks.map((item) => (
                  <MegaMenuIconLink key={item.href} to={item.href} onClick={onClose} icon={item.icon} title={item.label} compact />
                ))}
              </MegaMenuSection>
            </div>
            
            <div className="lg:border-r lg:border-[#B89555]/30 border-t lg:border-t-0 border-[#B89555]/30">
              <MegaMenuSection icon={BarChart3} title="Market Intelligence">
                {intelligenceLinks.map((item) => (
                  <MegaMenuIconLink key={item.href} to={item.href} onClick={onClose} icon={item.icon} title={item.label} compact />
                ))}
              </MegaMenuSection>
            </div>
            
            <div className="lg:border-r lg:border-[#B89555]/30 border-t lg:border-t-0 border-[#B89555]/30">
              <MegaMenuSection icon={BookOpen} title="Guides">
                {guidesLinks.map((item) => (
                  <MegaMenuIconLink key={item.href} to={item.href} onClick={onClose} icon={item.icon} title={item.label} compact />
                ))}
              </MegaMenuSection>
            </div>
            
            <div className="border-t lg:border-t-0 border-[#B89555]/30">
              <MegaMenuSection icon={Briefcase} title="Services">
                {servicesLinks.map((item) => (
                  <MegaMenuIconLink key={item.href} to={item.href} onClick={onClose} icon={item.icon} title={item.label} compact />
                ))}
              </MegaMenuSection>
            </div>
            
            {/* Row 2 — top border for row separation */}
            <div className="lg:border-r lg:border-[#B89555]/30 border-t border-[#B89555]/30">
              <MegaMenuSection icon={Sparkles} title="Business Suites">
                {businessSuitesLinks.map((item) => (
                  <MegaMenuIconLink key={item.href} to={item.href} onClick={onClose} icon={item.icon} title={item.label} compact />
                ))}
              </MegaMenuSection>
            </div>
            
            <div className="lg:border-r lg:border-[#B89555]/30 border-t border-[#B89555]/30">
              <MegaMenuSection icon={LayoutDashboard} title={getModeTitle()}>
                {modeLinks.map((item) => (
                  <MegaMenuIconLink key={item.href} to={item.href} onClick={onClose} icon={item.icon} title={item.label} compact />
                ))}
              </MegaMenuSection>
            </div>
            
            <div className="lg:border-r lg:border-[#B89555]/30 border-t border-[#B89555]/30">
              <MegaMenuSection icon={Building2} title="Company">
                {companyLinks.map((item) => (
                  <MegaMenuIconLink key={item.href} to={item.href} onClick={onClose} icon={item.icon} title={item.label} compact />
                ))}
              </MegaMenuSection>
            </div>
            
            <div className="border-t border-[#B89555]/30">
              <MegaMenuSection icon={Shield} title="Legal">
                {legalLinks.map((item) => (
                  <MegaMenuIconLink key={item.href} to={item.href} onClick={onClose} icon={item.icon} title={item.label} compact />
                ))}
              </MegaMenuSection>
            </div>
          </div>
        </div>
    </MegaMenuShell>
  );
});

MegaMenuInsights.displayName = 'MegaMenuInsights';

export default MegaMenuInsights;