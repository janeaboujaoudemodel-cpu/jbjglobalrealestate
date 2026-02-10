import React from 'react';
import { 
  UserCircle, Briefcase, GraduationCap, FolderOpen, 
  ClipboardCheck, Users, Award
} from 'lucide-react';
import brokerHubHero from '@/assets/broker-hub-hero.jpg';
import brokerDashboardVideo from '@/assets/videos/broker-dashboard-hero.mp4';
import { MegaMenuFeaturedCard, MegaMenuIconLink, MegaMenuShell, MegaMenuSectionTitle, MegaMenuCTAButton } from '@/components/header/mega-menu-primitives';

interface MegaMenuBrokerHubProps {
  onClose: () => void;
}

const MegaMenuBrokerHub = React.forwardRef<HTMLDivElement, MegaMenuBrokerHubProps>(({ onClose }, ref) => {
  const brokerDashboardLinks = [
    { name: 'Broker Dashboard', href: '/broker-dashboard', icon: UserCircle, description: 'Your broker control center' },
    { name: 'Broker Toolkit', href: '/broker-toolkit#tools', icon: Briefcase, description: 'Professional tools & resources' },
    { name: 'Partner Program', href: '/partners', icon: Users, description: 'Join our partner network' },
  ];

  const educationLinks = [
    { name: 'Broker Guides', href: '/guides?category=broker', icon: FolderOpen },
    { name: 'Broker Education', href: '/broker-education', icon: GraduationCap },
    { name: 'Broker Resources', href: '/broker-resources', icon: FolderOpen },
    { name: 'Broker FAQ', href: '/broker-faq', icon: ClipboardCheck },
    { name: 'Certifications', href: '/services/broker-certification', icon: Award },
  ];

  return (
    <MegaMenuShell ref={ref}>
      <div className="max-w-[1560px] mx-auto px-8 lg:px-12 py-10 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6">
            <MegaMenuFeaturedCard
              to="/broker-dashboard"
              onClick={onClose}
              image={brokerHubHero}
              video={brokerDashboardVideo}
              kicker="BROKER HUB"
              title="Your Broker Dashboard"
              description="Access tools, education, and resources for brokers"
              cta="Go to Dashboard"
            />
          </div>

          <div className="lg:col-span-6 lg:border-l lg:border-gold/30 lg:pl-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {/* Column 1: Dashboard & Tools */}
              <div className="relative flex flex-col">
                <MegaMenuSectionTitle icon={Briefcase} title="Dashboard & Tools" />
                <div className="space-y-1 min-h-[160px]">
                  {brokerDashboardLinks.map((item) => (
                    <MegaMenuIconLink
                      key={item.name}
                      to={item.href}
                      onClick={onClose}
                      icon={item.icon}
                      title={item.name}
                      description={item.description}
                      compact
                    />
                  ))}
                </div>
                {/* Vertical divider between columns */}
                <div className="hidden sm:block absolute top-0 -right-4 h-full w-px bg-gradient-to-b from-transparent via-gold/40 to-transparent" />
              </div>

              {/* Column 2: Education & Resources */}
              <div className="flex flex-col">
                <MegaMenuSectionTitle icon={GraduationCap} title="Education & Resources" />
                <div className="space-y-1 min-h-[160px]">
                  {educationLinks.map((item) => (
                    <MegaMenuIconLink
                      key={item.name}
                      to={item.href}
                      onClick={onClose}
                      icon={item.icon}
                      title={item.name}
                      compact
                    />
                  ))}
                </div>
              </div>
            </div>
            
            {/* Full-width CTA Button at bottom */}
            <div className="mt-6">
              <MegaMenuCTAButton
                to="/broker-dashboard"
                onClick={onClose}
                icon={UserCircle}
                title="Go to Dashboard"
              />
            </div>
          </div>
        </div>
      </div>
    </MegaMenuShell>
  );
});

MegaMenuBrokerHub.displayName = 'MegaMenuBrokerHub';

export default MegaMenuBrokerHub;
