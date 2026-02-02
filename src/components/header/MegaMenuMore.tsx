import React from 'react';
import { 
  BookOpen, BarChart3, Building2, Users, Briefcase, Award, 
  Phone, ClipboardCheck, Heart, MessageCircle 
} from 'lucide-react';
import menuCorporateOffice from '@/assets/menu-corporate-office.jpg';
import {
  MegaMenuFeaturedCard,
  MegaMenuIconLink,
  MegaMenuShell,
  MegaMenuSectionTitle,
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
      <div className="max-w-[1560px] mx-auto px-8 lg:px-12 py-10 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left: Featured photo - vertically stretched and centered */}
          <div className="lg:col-span-6 flex">
            <MegaMenuFeaturedCard
              to="/about"
              onClick={onClose}
              image={menuCorporateOffice}
              kicker="MORE"
              title="About JBJ Global Real Estate"
              description="Discover our story, team, and commitment to excellence."
              cta="Learn More"
              className="flex-1 min-h-[380px] lg:min-h-[420px]"
            />
          </div>

          {/* Right: Links */}
          <div className="lg:col-span-6 lg:border-l lg:border-gold/30 lg:pl-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {/* About & Company */}
              <div>
                <MegaMenuSectionTitle icon={Building2} title="About & Company" />
                <div className="space-y-1">
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
                <div className="space-y-1">
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
