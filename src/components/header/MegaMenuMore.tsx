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
  MegaMenuSectionTitle,
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

  // Column 2: Toolkit (PUBLIC)
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
    { label: 'Market Reports', href: '/market-intelligence/reports', icon: FileText },
    { label: 'Investment Guides', href: '/guides?category=investment', icon: TrendingUp },
    { label: 'Portfolio Views', href: '/favorites', icon: Heart },
  ];

  // Column 4: Brokers (MODE + ROLE BASED - visible in Broker Mode)
  const brokerLinks = [
    { label: 'Broker Hub', href: '/broker-toolkit', icon: Briefcase },
    { label: 'Broker Dashboard', href: '/broker-dashboard', icon: UserCircle },
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
        {/* 5 Columns - Services, Toolkit, Investors, Brokers (conditional), Company */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${isBrokerMode ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-4`}>
          {/* Column 1: Services */}
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

          {/* Column 2: Toolkit */}
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

          {/* Column 3: Investors */}
          <div className="relative">
            <MegaMenuSectionTitle icon={TrendingUp} title="Investors" />
            <div className="space-y-0">
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
            </div>
            <div className="hidden lg:block absolute top-0 -right-2 h-full w-px bg-gradient-to-b from-transparent via-gold/40 to-transparent" />
          </div>

          {/* Column 4: Brokers - Only visible in Broker Mode */}
          {isBrokerMode && (
            <div className="relative">
              <MegaMenuSectionTitle icon={Users} title="Brokers" />
              <div className="space-y-0">
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
              </div>
              <div className="hidden lg:block absolute top-0 -right-2 h-full w-px bg-gradient-to-b from-transparent via-gold/40 to-transparent" />
            </div>
          )}

          {/* Column 5 (or 4): Company */}
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

MegaMenuMore.displayName = 'MegaMenuMore';

export default MegaMenuMore;
