import React from 'react';
import { MapPin, Eye } from 'lucide-react';
import menuDowntownSkyline from '@/assets/menu-downtown-dubai-skyline.jpg';
import dubaiLandmarksVideo from '@/assets/videos/dubai-landmarks-hero.mp4';
import { MegaMenuFeaturedCard, MegaMenuIconLink, MegaMenuShell, MegaMenuCard, MegaMenuCTAButton } from '@/components/header/mega-menu-primitives';
import { useAreas } from '@/hooks/useAreas';

interface MegaMenuAreasProps {
  onClose: () => void;
}

const MegaMenuAreas = React.forwardRef<HTMLDivElement, MegaMenuAreasProps>(({ onClose }, ref) => {
  // Fetch ALL active areas (no limit)
  const { data: areas, isLoading } = useAreas();

  const displayAreas = areas && areas.length > 0 
    ? areas.map(a => ({ name: a.name, slug: a.slug }))
    : [];

  return (
    <MegaMenuShell ref={ref}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 flex">
            <MegaMenuFeaturedCard
              to="/areas"
              onClick={onClose}
              image={menuDowntownSkyline}
              video={dubaiLandmarksVideo}
              kicker="AREAS"
              title="Dubai's Prime Locations"
              description="Discover the best communities"
              cta="Explore Areas"
              className="flex-1 min-h-[260px] lg:min-h-[300px]"
            />
          </div>

          <div className="lg:col-span-8 lg:border-l lg:border-gold/30 lg:pl-8">
            <MegaMenuCard icon={MapPin} title="All Areas">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-0.5 max-h-[350px] overflow-y-auto pr-2">
                {displayAreas.map((area) => (
                  <MegaMenuIconLink
                    key={area.slug}
                    to={`/area/${area.slug}`}
                    onClick={onClose}
                    icon={MapPin}
                    title={area.name}
                    compact
                  />
                ))}
              </div>
            </MegaMenuCard>
            
            <div className="mt-4">
              <MegaMenuCTAButton
                to="/areas"
                onClick={onClose}
                icon={Eye}
                title="View All Areas"
              />
            </div>
          </div>
        </div>
      </div>
    </MegaMenuShell>
  );
});

MegaMenuAreas.displayName = 'MegaMenuAreas';

export default MegaMenuAreas;
