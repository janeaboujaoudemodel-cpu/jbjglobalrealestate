import React from 'react';
import { 
  BookOpen, BarChart3, Building2, Users, Briefcase, Award, 
  Phone, ClipboardCheck, Heart, MessageCircle, Eye, FileText,
  Home, Newspaper, Scale, Layers, Sparkles, MapPin, Calculator,
  GraduationCap, Shield, HelpCircle
} from 'lucide-react';
import menuCorporateOffice from '@/assets/menu-corporate-office.jpg';
import {
  MegaMenuFeaturedCard,
  MegaMenuIconLink,
  MegaMenuShell,
  MegaMenuSectionTitle,
  MegaMenuSectionDivider,
} from '@/components/header/mega-menu-primitives';

interface MegaMenuMoreProps {
  onClose: () => void;
}

const MegaMenuMore = React.forwardRef<HTMLDivElement, MegaMenuMoreProps>(({ onClose }, ref) => {
  // About & Company links
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
    { label: 'Philanthropy', href: '/philanthropy', icon: Heart },
    { label: 'Testimonials', href: '/testimonials', icon: MessageCircle },
  ];

  // Resource Hubs & Guides
  const hubLinks = [
    { label: 'Guides Library', href: '/guides', icon: BookOpen, description: 'Browse our full guides library' },
    { label: 'Market Intelligence', href: '/market-intelligence', icon: BarChart3, description: 'Market reports & area data' },
    { label: 'News & Insights', href: '/news', icon: Newspaper, description: 'Latest updates & articles' },
    { label: 'FAQ', href: '/faq', icon: HelpCircle, description: 'Frequently asked questions' },
  ];

  // All pages not in main navigation
  const additionalPages = [
    { label: 'Buyer Guide', href: '/buyer-guide', icon: GraduationCap },
    { label: 'Seller Guide', href: '/seller-guide', icon: GraduationCap },
    { label: 'Sell Your Property', href: '/seller-listing', icon: Home },
    { label: 'Rent Guide', href: '/rent-guide', icon: BookOpen },
    { label: 'Tenant Guide', href: '/tenant-guide', icon: BookOpen },
    { label: 'Landlord Guide', href: '/landlord-guide', icon: BookOpen },
    { label: 'Landlord Portal', href: '/landlord-portal', icon: Building2 },
    { label: 'Investor Education', href: '/investor-education', icon: GraduationCap },
    { label: 'Investor FAQ', href: '/investor-faq', icon: HelpCircle },
    { label: 'Broker Education', href: '/broker-education', icon: GraduationCap },
    { label: 'Broker FAQ', href: '/broker-faq', icon: HelpCircle },
    { label: 'Golden Visa Guide', href: '/guides/golden-visa-uae', icon: Award },
    { label: 'Quiz / AI Home Finder', href: '/quiz', icon: Sparkles },
    { label: 'Property Map', href: '/map', icon: MapPin },
    { label: 'Compare Properties', href: '/compare', icon: Layers },
  ];

  // Partners & Services
  const partnerLinks = [
    { label: 'Partners Hub', href: '/partners', icon: Users },
    { label: 'Mortgage Partners', href: '/partners/mortgage', icon: Calculator },
    { label: 'Legal Partners', href: '/partners/legal', icon: Scale },
    { label: 'Company Setup', href: '/partners/company-setup', icon: Building2 },
    { label: 'Visa Services', href: '/partners/visa-services', icon: Award },
    { label: 'Referral Partner', href: '/referral-partner', icon: Users },
  ];

  // Legal & Trust
  const legalLinks = [
    { label: 'Terms of Service', href: '/terms', icon: FileText },
    { label: 'Privacy Policy', href: '/privacy', icon: Shield },
    { label: 'Cookies Policy', href: '/cookies', icon: FileText },
    { label: 'Trust & Audit Center', href: '/trust-and-audit-center', icon: Shield },
    { label: 'Intellectual Property', href: '/intellectual-property', icon: Shield },
  ];

  return (
    <MegaMenuShell ref={ref}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Featured photo */}
          <div className="lg:col-span-3 flex items-stretch justify-center">
            <MegaMenuFeaturedCard
              to="/about"
              onClick={onClose}
              image={menuCorporateOffice}
              kicker="MORE"
              title="About JBJ Global Real Estate"
              description="Discover our story, team, and commitment to excellence."
              cta="Learn More"
              className="w-full h-full min-h-[280px]"
            />
          </div>

          {/* Right: Links in 3 Columns */}
          <div className="lg:col-span-9 lg:border-l lg:border-gold/30 lg:pl-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Column 1: About & Company */}
              <div className="relative">
                <MegaMenuSectionTitle icon={Building2} title="About & Company" />
                <div className="space-y-0.5 max-h-[320px] overflow-y-auto pr-1">
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
                <div className="hidden sm:block absolute top-0 -right-2 h-full w-px bg-gradient-to-b from-transparent via-gold/40 to-transparent" />
              </div>

              {/* Column 2: Resources & Guides */}
              <div className="relative">
                <MegaMenuSectionTitle icon={BookOpen} title="Resources & Guides" />
                <div className="space-y-0.5 max-h-[320px] overflow-y-auto pr-1">
                  {hubLinks.map((item) => (
                    <MegaMenuIconLink
                      key={item.href}
                      to={item.href}
                      onClick={onClose}
                      icon={item.icon}
                      title={item.label}
                      compact
                    />
                  ))}
                  <div className="h-[1px] bg-gradient-to-r from-transparent via-gold/30 to-transparent my-2" />
                  {additionalPages.map((item) => (
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
                <div className="hidden sm:block absolute top-0 -right-2 h-full w-px bg-gradient-to-b from-transparent via-gold/40 to-transparent" />
              </div>

              {/* Column 3: Partners & Legal */}
              <div>
                <MegaMenuSectionTitle icon={Users} title="Partners" />
                <div className="space-y-0.5">
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
                <div className="h-[1px] bg-gradient-to-r from-transparent via-gold/30 to-transparent my-3" />
                <MegaMenuSectionTitle icon={Shield} title="Legal & Trust" />
                <div className="space-y-0.5">
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
        </div>
      </div>
    </MegaMenuShell>
  );
});

MegaMenuMore.displayName = 'MegaMenuMore';

export default MegaMenuMore;
