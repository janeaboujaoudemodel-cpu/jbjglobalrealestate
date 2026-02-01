import React from 'react';
import { Building2, Calendar, Check, Sparkles, Eye } from 'lucide-react';
import menuOffplanProject from '@/assets/menu-offplan-project.jpg';
import { MegaMenuFeaturedCard, MegaMenuIconLink, MegaMenuShell, MegaMenuSectionTitle } from '@/components/header/mega-menu-primitives';

interface MegaMenuProjectsProps {
  onClose: () => void;
}

const MegaMenuProjects: React.FC<MegaMenuProjectsProps> = ({ onClose }) => {
  const projectCategories = [
    { label: 'Off-Plan Projects', href: '/properties?status=off-plan', icon: Building2 },
    { label: 'Ready Projects', href: '/properties?status=ready', icon: Check },
    { label: 'New Launches', href: '/properties?sort=newest', icon: Sparkles },
    { label: 'Handover Soon', href: '/properties?handover=2025', icon: Calendar },
    { label: 'View All Projects', href: '/properties', icon: Eye },
  ];

  return (
    <MegaMenuShell>
      <div className="max-w-[1560px] mx-auto px-8 lg:px-12 py-10 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Single, larger rectangular photo */}
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

          {/* Right: Categories (with divider) */}
          <div className="lg:col-span-6 lg:border-l lg:border-gold/30 lg:pl-10">
            <MegaMenuSectionTitle icon={Building2} title="Project Categories" />
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
          </div>
        </div>
      </div>
    </MegaMenuShell>
  );
};

export default MegaMenuProjects;
