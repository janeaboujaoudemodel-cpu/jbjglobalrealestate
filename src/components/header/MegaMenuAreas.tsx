import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Eye, ArrowRight } from 'lucide-react';
import menuDowntownSkyline from '@/assets/menu-downtown-dubai-skyline.jpg';
import { MegaMenuFeaturedCard, MegaMenuIconLink, MegaMenuShell, MegaMenuSectionTitle } from '@/components/header/mega-menu-primitives';
import { useAreas } from '@/hooks/useAreas';

interface MegaMenuAreasProps {
  onClose: () => void;
}

const MegaMenuAreas = React.forwardRef<HTMLDivElement, MegaMenuAreasProps>(({ onClose }, ref) => {
  const { data: areas } = useAreas({ limit: 12 });

  // Fallback static areas if database is empty
  const fallbackAreas = [
    { name: 'Dubai Creek Harbour', slug: 'dubai-creek-harbour' },
    { name: 'Business Bay', slug: 'business-bay' },
    { name: 'Dubai Marina', slug: 'dubai-marina' },
    { name: 'Palm Jumeirah', slug: 'palm-jumeirah' },
    { name: 'Downtown Dubai', slug: 'downtown-dubai' },
    { name: 'Jumeirah Village Circle', slug: 'jvc' },
    { name: 'Dubai Hills Estate', slug: 'dubai-hills-estate' },
    { name: 'Emaar Beachfront', slug: 'emaar-beachfront' },
    { name: 'Sobha Hartland', slug: 'sobha-hartland' },
    { name: 'Dubai Islands', slug: 'dubai-islands' },
    { name: 'MBR City', slug: 'mbr-city' },
    { name: 'Jumeirah Beach Residence', slug: 'jbr' },
  ];

  const displayAreas = areas && areas.length > 0 
    ? areas.map(a => ({ name: a.name, slug: a.slug }))
    : fallbackAreas;

  // Split into two columns
  const half = Math.ceil(displayAreas.length / 2);
  const firstColumn = displayAreas.slice(0, half);
  const secondColumn = displayAreas.slice(half);

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
              kicker="AREAS"
              title="Dubai's Prime Locations"
              description="Discover the best communities"
              cta="Explore Areas"
              className="flex-1 min-h-[260px] lg:min-h-[300px]"
            />
          </div>

          <div className="lg:col-span-7 lg:border-l lg:border-gold/30 lg:pl-8">
            <MegaMenuSectionTitle
              icon={MapPin}
              title="Top Areas in Dubai"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5">
              {firstColumn.map((area) => (
                <MegaMenuIconLink
                  key={area.slug}
                  to={`/area/${area.slug}`}
                  onClick={onClose}
                  icon={MapPin}
                  title={area.name}
                  compact
                />
              ))}
              {secondColumn.map((area) => (
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
            
            {/* View All - emphasized */}
            <div className="mt-3">
              <MegaMenuIconLink
                to="/areas"
                onClick={onClose}
                icon={Eye}
                title="View All Areas"
                compact
                emphasis
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
