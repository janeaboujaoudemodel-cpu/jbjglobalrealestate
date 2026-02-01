import React from 'react';
import { 
  TrendingUp, UserCircle, Briefcase, Heart, FileText, 
  BarChart3, Calculator, PieChart
} from 'lucide-react';
import menuDubaiSkyline from '@/assets/menu-dubai-skyline.jpg';
import { MegaMenuFeaturedCard, MegaMenuIconLink, MegaMenuShell, MegaMenuSectionTitle } from '@/components/header/mega-menu-primitives';

interface MegaMenuInvestorHubProps {
  onClose: () => void;
}

const MegaMenuInvestorHub = React.forwardRef<HTMLDivElement, MegaMenuInvestorHubProps>(({ onClose }, ref) => {
  const dashboardLinks = [
    { name: 'Investor Dashboard', href: '/my-account', icon: UserCircle, description: 'Your investment overview' },
    { name: 'Portfolio Views', href: '/favorites', icon: Heart, description: 'Saved properties & shortlists' },
    { name: 'Investor Tools', href: '/ai-hub', icon: Briefcase, description: 'AI-powered analysis tools' },
  ];

  const toolsLinks = [
    { name: 'Property Evaluator', href: '/property-evaluation', icon: BarChart3 },
    { name: 'Mortgage Calculator', href: '/mortgage-calculator', icon: Calculator },
    { name: 'ROI Calculator', href: '/roi-calculator', icon: PieChart },
    { name: 'Market Reports', href: '/market-intelligence/reports', icon: FileText },
  ];

  return (
    <MegaMenuShell ref={ref}>
      <div className="max-w-[1560px] mx-auto px-8 lg:px-12 py-10 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6">
            <MegaMenuFeaturedCard
              to="/my-account"
              onClick={onClose}
              image={menuDubaiSkyline}
              kicker="INVESTOR HUB"
              title="Your Investment Dashboard"
              description="Access tools, track properties, and monitor your portfolio"
              cta="Go to Dashboard"
            />
          </div>

          <div className="lg:col-span-6 lg:border-l lg:border-gold/30 lg:pl-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <MegaMenuSectionTitle icon={TrendingUp} title="Dashboard & Portfolio" />
                <div className="space-y-1">
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
              </div>

              <div>
                <MegaMenuSectionTitle icon={Briefcase} title="Investor Tools" />
                <div className="space-y-1">
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
          </div>
        </div>
      </div>
    </MegaMenuShell>
  );
});

MegaMenuInvestorHub.displayName = 'MegaMenuInvestorHub';

export default MegaMenuInvestorHub;
