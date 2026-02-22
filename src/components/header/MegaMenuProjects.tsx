import React from 'react';
import { Building2, Calendar, Check, Sparkles, Eye } from 'lucide-react';
import menuOffplanProject from '@/assets/menu-offplan-project.jpg';
import { MegaMenuFeaturedCard, MegaMenuIconLink, MegaMenuShell, MegaMenuCard, MegaMenuCTAButton } from '@/components/header/mega-menu-primitives';

interface MegaMenuProjectsProps {
  onClose: () => void;
}

const MegaMenuProjects = React.forwardRef<HTMLDivElement, MegaMenuProjectsProps>(({ onClose }, ref) => {
  const projectCategories = [
    { label: 'Off-Plan Projects', href: '/properties?status=off-plan', icon: Building2 },
    { label: 'Ready Projects', href: '/properties?status=ready', icon: Check },
    { label: 'New Launches', href: '/properties?sort=newest', icon: Sparkles },
    { label: 'Handover Soon', href: '/properties?handover=2025', icon: Calendar },
  ];

  return (
    <MegaMenuShell ref={ref}>
      <div className="max-w-[1560px] mx-auto px-8 lg:px-12 py-10 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Single, larger rectangular photo with video */}
          <div className="lg:col-span-6">
            <MegaMenuFeaturedCard
              to="/properties"
              onClick={onClose}
              image={menuOffplanProject}
              kicker="PROJECTS"
              title="Dubai Off-Plan Projects"
              description="Invest in Dubai's most promising developments"
              cta="View All Projects"
            />
          </div>

          {/* Right: Categories in Premium Card */}
          <div className="lg:col-span-6 lg:border-l lg:border-gold/30 lg:pl-10">
            <MegaMenuCard icon={Building2} title="Project Categories">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {projectCategories.map((item) => (
                  <MegaMenuIconLink
                    key={item.label}
                    to={item.href}
                    onClick={onClose}
                    icon={item.icon}
                    title={item.label}
                    compact
                  />
                ))}
              </div>
            </MegaMenuCard>
            
            {/* Full-width CTA Button */}
            <div className="mt-6">
              <MegaMenuCTAButton
                to="/properties"
                onClick={onClose}
                icon={Eye}
                title="View All Projects"
              />
            </div>
          </div>
        </div>
      </div>
    </MegaMenuShell>
  );
});

MegaMenuProjects.displayName = 'MegaMenuProjects';

export default MegaMenuProjects;