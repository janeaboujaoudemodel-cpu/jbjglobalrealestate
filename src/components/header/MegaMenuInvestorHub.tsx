import React from 'react';
import { 
  TrendingUp, UserCircle, Briefcase, Heart, FileText, 
  BarChart3, Calculator, PieChart
} from 'lucide-react';
import menuDubaiSkyline from '@/assets/menu-dubai-skyline.jpg';
import dubaiInvestmentVideo from '@/assets/videos/dubai-investment-hero.mp4';
import { MegaMenuFeaturedCard, MegaMenuIconLink, MegaMenuShell, MegaMenuSectionTitle, MegaMenuCTAButton } from '@/components/header/mega-menu-primitives';

interface MegaMenuInvestorHubProps {
  onClose: () => void;
}

const MegaMenuInvestorHub = React.forwardRef<HTMLDivElement, MegaMenuInvestorHubProps>(({ onClose }, ref) => {
  const dashboardLinks = [
    { name: 'Investor Dashboard', href: '/my-dashboard', icon: UserCircle, description: 'Your investment overview' },
    { name: 'Portfolio Views', href: '/favorites', icon: Heart, description: 'Saved properties & shortlists' },
    { name: 'Investor Tools', href: '/ai-hub', icon: Briefcase, description: 'AI-powered analysis tools' },
  ];

  const toolsLinks = [
    { name: 'Investor Guides', href: '/guides?category=investor', icon: FileText },
    { name: 'Property Evaluator', href: '/property-evaluator', icon: BarChart3 },
    { name: 'Mortgage Calculator', href: '/mortgage-calculator', icon: Calculator },
    { name: 'ROI Calculator', href: '/property-evaluator', icon: PieChart },
    { name: 'Market Reports', href: '/market-intelligence/reports', icon: FileText },
  ];

  return (
    <MegaMenuShell ref={ref}>
      <div className="max-w-[1560px] mx-auto px-8 lg:px-12 py-10 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6">
            <MegaMenuFeaturedCard
              to="/my-dashboard"
              onClick={onClose}
              image={menuDubaiSkyline}
              video={dubaiInvestmentVideo}
              kicker="INVESTOR HUB"
              title="Your Investment Dashboard"
              description="Access tools, track properties, and monitor your portfolio"
              cta="Go to Dashboard"
            />
          </div>

          <div className="lg:col-span-6 lg:border-l lg:border-gold/30 lg:pl-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {/* Column 1: Dashboard & Portfolio */}
              <div className="relative flex flex-col">
                <MegaMenuSectionTitle icon={TrendingUp} title="Dashboard & Portfolio" />
                <div className="space-y-1 min-h-[160px]">
                  {dashboardLinks.map((item) => (
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

              {/* Column 2: Investor Tools */}
              <div className="flex flex-col">
                <MegaMenuSectionTitle icon={Briefcase} title="Investor Tools" />
                <div className="space-y-1 min-h-[160px]">
                  {toolsLinks.map((item) => (
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
                to="/my-dashboard"
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

MegaMenuInvestorHub.displayName = 'MegaMenuInvestorHub';

export default MegaMenuInvestorHub;
