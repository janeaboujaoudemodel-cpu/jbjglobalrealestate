import React from 'react';
import { 
  Newspaper, BarChart3, FileText, TrendingUp, 
  BookOpen, Calendar, Globe, Target
} from 'lucide-react';
import {
  MegaMenuIconLink,
  MegaMenuShell,
  MegaMenuSectionTitle,
} from '@/components/header/mega-menu-primitives';

interface MegaMenuInsightsProps {
  onClose: () => void;
}

const MegaMenuInsights = React.forwardRef<HTMLDivElement, MegaMenuInsightsProps>(({ onClose }, ref) => {
  // Column 1: News & Updates
  const newsLinks = [
    { label: 'Latest News', href: '/news', icon: Newspaper },
    { label: 'Market Updates', href: '/news?category=market', icon: TrendingUp },
    { label: 'Company News', href: '/news?category=company', icon: Globe },
    { label: 'Press Releases', href: '/press-kit', icon: FileText },
  ];

  // Column 2: Market Intelligence
  const intelligenceLinks = [
    { label: 'Market Overview', href: '/market-intelligence/overview', icon: BarChart3 },
    { label: 'Area Intelligence', href: '/market-intelligence/areas', icon: Target },
    { label: 'Market Reports', href: '/market-intelligence/reports', icon: FileText },
    { label: 'Methodology', href: '/market-intelligence/methodology', icon: BookOpen },
  ];

  // Column 3: Guides & Education
  const guidesLinks = [
    { label: 'Guides Library', href: '/guides', icon: BookOpen },
    { label: 'Buyer Guide', href: '/buyer-guide', icon: FileText },
    { label: 'Seller Guide', href: '/seller-guide', icon: FileText },
    { label: 'Investor Education', href: '/investor-education', icon: TrendingUp },
  ];

  // Column 4: Events & Calendar
  const eventsLinks = [
    { label: 'Events Calendar', href: '/events', icon: Calendar },
    { label: 'Webinars', href: '/webinars', icon: Globe },
    { label: 'FAQ', href: '/faq', icon: FileText },
  ];

  return (
    <MegaMenuShell ref={ref} noScroll>
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-4 lg:py-5">
        {/* 4 Equal Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

          {/* Column 2: Market Intelligence */}
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

          {/* Column 3: Guides & Education */}
          <div className="relative">
            <MegaMenuSectionTitle icon={BookOpen} title="Guides & Education" />
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

          {/* Column 4: Events & Resources */}
          <div>
            <MegaMenuSectionTitle icon={Calendar} title="Events & Resources" />
            <div className="space-y-0">
              {eventsLinks.map((item) => (
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
