import React from 'react';
import { 
  Briefcase, Building2, Users, Calculator, Scale, Award, 
  Phone, Heart, FileText, Shield, Sparkles, MapPin,
  UserCircle, GraduationCap, FolderOpen, ClipboardCheck,
  BarChart3, TrendingUp, Layers
} from 'lucide-react';
import {
  MegaMenuIconLink,
  MegaMenuShell,
  MegaMenuCard,
} from '@/components/header/mega-menu-primitives';
import { useUserModeContext } from '@/contexts/UserModeContext';
import { useFounderVisibility } from '@/contexts/FounderVisibilityContext';

interface MegaMenuMoreProps {
  onClose: () => void;
}

const MegaMenuMore = React.forwardRef<HTMLDivElement, MegaMenuMoreProps>(({ onClose }, ref) => {
  const { isBrokerMode } = useUserModeContext();
  const { isFounderVisible } = useFounderVisibility();

  // Column 1: Services
  const servicesLinks = [
    { label: 'Our Services', href: '/services', icon: Briefcase },
    { label: 'Property Management', href: '/services/property-management', icon: Building2 },
    { label: 'Golden Visa', href: '/guides/golden-visa-uae', icon: Award },
    { label: 'Mortgage Advisory', href: '/partners/mortgage', icon: Calculator },
    { label: 'Valuation', href: '/sell/valuation', icon: BarChart3 },
    { label: 'Sell Your Property', href: '/seller-listing', icon: ClipboardCheck },
  ];

  // Column 2: Business Suites (NEW)
  const businessSuitesLinks = [
    { label: 'All Tools Suite', href: '/business-suite/all', icon: Layers },
    { label: 'Real Estate Suite', href: '/business-suite/real-estate', icon: Building2 },
    { label: 'Broker Intelligence', href: '/business-suite/broker', icon: Users },
    { label: 'Creative Suite', href: '/business-suite/creative', icon: Sparkles },
    { label: 'Productivity Suite', href: '/business-suite/productivity', icon: ClipboardCheck },
    { label: 'Call Summarizer', href: '/ai-call-summarizer', icon: Phone },
    { label: 'Meeting Center', href: '/meeting-center', icon: Briefcase },
  ];

  // Column 3: Toolkit (PUBLIC)
  const toolkitLinks = [
    { label: 'All Tools', href: '/toolkit', icon: Sparkles },
    { label: 'Creative Suite', href: '/studio', icon: Sparkles },
    { label: 'ROI Calculator', href: '/calculator/roi', icon: Calculator },
    { label: 'Mortgage Calculator', href: '/mortgage-calculator', icon: Calculator },
    { label: 'Compare Properties', href: '/compare', icon: Layers },
    { label: 'Property Map', href: '/map', icon: MapPin },
    { label: 'AI Home Finder', href: '/quiz', icon: Sparkles },
  ];

  // Column 3: Investors
  const investorLinks = [
    { label: 'Investor Dashboard', href: '/investor-dashboard', icon: UserCircle },
    { label: 'Investor Education', href: '/investor-education', icon: GraduationCap },
    { label: 'Listing Portal', href: '/listing-portal/submit', icon: ClipboardCheck },
    { label: 'Market Reports', href: '/market-intelligence/reports', icon: FileText },
    { label: 'Investment Guides', href: '/guides?category=investment', icon: TrendingUp },
    { label: 'Portfolio Views', href: '/favorites', icon: Heart },
  ];

  // Column 4: Brokers (MODE + ROLE BASED - visible in Broker Mode)
  const brokerLinks = [
    { label: 'Broker Hub', href: '/broker-toolkit', icon: Briefcase },
    { label: 'Broker Dashboard', href: '/broker-dashboard', icon: UserCircle },
    { label: 'Listing Portal', href: '/listing-portal/submit', icon: ClipboardCheck },
    { label: 'Broker CRM', href: '/crm', icon: Users },
    { label: 'Training', href: '/broker-education', icon: GraduationCap },
    { label: 'Resources', href: '/broker-resources', icon: FolderOpen },
  ];

  // Column 5: Company (Founder link is conditional on visibility toggle)
  const companyLinks = [
    { label: 'About JBJ', href: '/about', icon: Building2 },
    ...(isFounderVisible ? [{ label: 'Founder & Leadership', href: '/founder', icon: UserCircle }] : []),
    { label: 'Meet the Team', href: '/team', icon: Users },
    { label: 'Contact Us', href: '/contact', icon: Phone },
    { label: 'Careers', href: '/join', icon: Briefcase },
    { label: 'Press & Media', href: '/press-kit', icon: FileText },
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
        {/* Grid of Premium Cards */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${isBrokerMode ? 'lg:grid-cols-6' : 'lg:grid-cols-5'} gap-4`}>
          {/* Card 1: Services */}
          <MegaMenuCard icon={Briefcase} title="Services">
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
          </MegaMenuCard>

          {/* Card 2: Business Suites */}
          <MegaMenuCard icon={Layers} title="Business Suites">
            {businessSuitesLinks.map((item) => (
              <MegaMenuIconLink
                key={item.href}
                to={item.href}
                onClick={onClose}
                icon={item.icon}
                title={item.label}
                compact
              />
            ))}
          </MegaMenuCard>

          {/* Card 3: Toolkit */}
          <MegaMenuCard icon={Sparkles} title="Toolkit">
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
          </MegaMenuCard>

          {/* Card 4: Investors */}
          <MegaMenuCard icon={TrendingUp} title="Investors">
            {investorLinks.map((item) => (
              <MegaMenuIconLink
                key={item.href}
                to={item.href}
                onClick={onClose}
                icon={item.icon}
                title={item.label}
                compact
              />
            ))}
          </MegaMenuCard>

          {/* Card 5: Brokers - Only visible in Broker Mode */}
          {isBrokerMode && (
            <MegaMenuCard icon={Users} title="Brokers">
              {brokerLinks.map((item) => (
                <MegaMenuIconLink
                  key={item.href}
                  to={item.href}
                  onClick={onClose}
                  icon={item.icon}
                  title={item.label}
                  compact
                />
              ))}
            </MegaMenuCard>
          )}

          {/* Card 6 (or 5): Company + Legal */}
          <MegaMenuCard icon={Building2} title="Company & Legal">
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
            {legalLinks.slice(0, 3).map((item) => (
              <MegaMenuIconLink
                key={item.href}
                to={item.href}
                onClick={onClose}
                icon={item.icon}
                title={item.label}
                compact
              />
            ))}
          </MegaMenuCard>
        </div>
      </div>
    </MegaMenuShell>
  );
});

MegaMenuMore.displayName = 'MegaMenuMore';

export default MegaMenuMore;