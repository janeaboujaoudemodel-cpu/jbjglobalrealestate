import React from 'react';
import { 
  BookOpen, BarChart3, Building2, Users, Briefcase, Award, 
  Phone, ClipboardCheck, Heart, MessageCircle, Eye 
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
    { label: 'Careers', href: '/join', icon: Briefcase },
    { label: 'Our Awards', href: '/awards', icon: Award },
    { label: 'Contact Us', href: '/contact', icon: Phone },
    { label: 'Real Estate Guides', href: '/guides', icon: BookOpen },
    { label: 'Complaint Procedure', href: '/complaint', icon: ClipboardCheck },
    { label: 'Philanthropy', href: '/philanthropy', icon: Heart },
    { label: 'Testimonials', href: '/testimonials', icon: MessageCircle },
  ];

  // High-level hub links only (no deep pages)
  const hubLinks = [
    { label: 'Guides Library', href: '/guides', icon: BookOpen, description: 'Browse our full guides library' },
    { label: 'Market Intelligence', href: '/market-intelligence', icon: BarChart3, description: 'Market reports & area data' },
  ];

  return (
    <MegaMenuShell ref={ref}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Featured photo */}
          <div className="lg:col-span-5 flex items-stretch justify-center">
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

          {/* Right: Links */}
          <div className="lg:col-span-7 lg:border-l lg:border-gold/30 lg:pl-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* About & Company */}
              <div>
                <MegaMenuSectionTitle icon={Building2} title="About & Company" />
                <div className="space-y-0.5">
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
              </div>

              {/* Resource Hubs */}
              <div>
                <MegaMenuSectionTitle icon={BookOpen} title="Resource Hubs" />
                <div className="space-y-0.5">
                  {hubLinks.map((item) => (
                    <MegaMenuIconLink
                      key={item.href}
                      to={item.href}
                      onClick={onClose}
                      icon={item.icon}
                      title={item.label}
                      description={item.description}
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
