import React from 'react';
import { Building2, Eye } from 'lucide-react';
import menuDubaiSkyline from '@/assets/menu-dubai-skyline.jpg';
import burjAlArabVideo from '@/assets/videos/burj-al-arab-aerial.mp4';
import { MegaMenuFeaturedCard, MegaMenuIconLink, MegaMenuShell, MegaMenuCard, MegaMenuCTAButton } from '@/components/header/mega-menu-primitives';
import { useDevelopers } from '@/hooks/useProjects';

interface MegaMenuDevelopersProps {
  onClose: () => void;
}

const MegaMenuDevelopers = React.forwardRef<HTMLDivElement, MegaMenuDevelopersProps>(({ onClose }, ref) => {
  // Fetch from DB, excluding hidden developers
  const { data: developers } = useDevelopers(false);

  const displayDevelopers = developers && developers.length > 0
    ? developers.map(d => ({ name: d.name, slug: d.slug }))
    : [];

  return (
    <MegaMenuShell ref={ref}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 flex">
            <MegaMenuFeaturedCard
              to="/developers"
              onClick={onClose}
              image={menuDubaiSkyline}
              video={burjAlArabVideo}
              kicker="DEVELOPERS"
              title="Top Developers"
              description="Dubai's most iconic developers"
              cta="View All Developers"
              className="flex-1 min-h-[260px] lg:min-h-[300px]"
            />
          </div>

          <div className="lg:col-span-8 lg:border-l lg:border-gold/30 lg:pl-8">
            <MegaMenuCard icon={Building2} title="All Developers">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-0.5 max-h-[350px] overflow-y-auto pr-2">
                {displayDevelopers.map((dev) => (
                  <MegaMenuIconLink
                    key={dev.slug}
                    to={`/developer/${dev.slug}`}
                    onClick={onClose}
                    icon={Building2}
                    title={dev.name}
                    compact
                  />
                ))}
              </div>
            </MegaMenuCard>
            
            <div className="mt-4">
              <MegaMenuCTAButton
                to="/developers"
                onClick={onClose}
                icon={Eye}
                title="View All Developers"
              />
            </div>
          </div>
        </div>
      </div>
    </MegaMenuShell>
  );
});

MegaMenuDevelopers.displayName = 'MegaMenuDevelopers';

export default MegaMenuDevelopers;
