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
  const { data: areas, isLoading } = useAreas({ limit: 12 });

  // Only show database areas - no static fallbacks
  const displayAreas = areas && areas.length > 0 
    ? areas.map(a => ({ name: a.name, slug: a.slug }))
    : [];

  return (
    <MegaMenuShell ref={ref}>
      {/* Reduced padding for smaller menu */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 flex">
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

          <div className="lg:col-span-7 lg:border-l lg:border-gold/30 lg:pl-8">
            {/* Single Premium Card for Areas */}
            <MegaMenuCard icon={MapPin} title="Top Areas in Dubai">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5">
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
            
            {/* View All CTA */}
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