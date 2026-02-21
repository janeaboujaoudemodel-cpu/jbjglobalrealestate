import React from 'react';
import { MapPin, Eye } from 'lucide-react';
import menuDowntownSkyline from '@/assets/menu-downtown-dubai-skyline.jpg';
import dubaiDowntownVideo from '@/assets/videos/why-dubai-downtown-burj-khalifa.mp4';
import { MegaMenuFeaturedCard, MegaMenuIconLink, MegaMenuShell, MegaMenuCard, MegaMenuCTAButton, MegaMenuSectionDivider } from '@/components/header/mega-menu-primitives';
import { useAreas } from '@/hooks/useAreas';

/** Curated premium areas shown first — famous & trending */
const FEATURED_AREA_SLUGS = [
  'downtown-dubai',
  'palm-jumeirah',
  'dubai-marina',
  'dubai-hills',
  'business-bay',
  'dubai-islands',
  'jvc-jumeirah-village-circle',
  'dubai-creek-harbour',
  'emaar-beachfront',
  'al-marjan-island',
  'meydan-nad-al-sheba-1',
  'jumeirah-beach-residence',
];

interface MegaMenuAreasProps {
  onClose: () => void;
}

const MegaMenuAreas = React.forwardRef<HTMLDivElement, MegaMenuAreasProps>(({ onClose }, ref) => {
  const { data: areas } = useAreas();

  // Sort: featured slugs first (in order), then rest alphabetically — but cap at ~12
  const displayAreas = React.useMemo(() => {
    if (!areas || areas.length === 0) return [];
    const slugMap = new Map(areas.map(a => [a.slug, a]));
    const ordered: { name: string; slug: string }[] = [];
    // Add featured first in defined order
    for (const slug of FEATURED_AREA_SLUGS) {
      const a = slugMap.get(slug);
      if (a) ordered.push({ name: a.name, slug: a.slug });
    }
    return ordered.slice(0, 12);
  }, [areas]);

  return (
    <MegaMenuShell ref={ref}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Featured card — wider (5 cols) */}
          <div className="lg:col-span-5 flex">
            <MegaMenuFeaturedCard
              to="/areas"
              onClick={onClose}
              image={menuDowntownSkyline}
              video={dubaiDowntownVideo}
              kicker="AREAS"
              title="Dubai's Prime Locations"
              description="Discover the best communities"
              cta="Explore Areas"
              className="flex-1 min-h-[260px] lg:min-h-[300px]"
            />
          </div>

          {/* Areas list — narrower (7 cols), no scroll */}
          <div className="lg:col-span-7 lg:border-l lg:border-gold/30 lg:pl-8">
            <MegaMenuCard icon={MapPin} title="Top Areas">
              <div className="grid grid-cols-2 gap-1">
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
            
            <MegaMenuSectionDivider />

            <MegaMenuCTAButton
              to="/areas"
              onClick={onClose}
              icon={Eye}
              title="View All Areas"
            />
          </div>
        </div>
      </div>
    </MegaMenuShell>
  );
});

MegaMenuAreas.displayName = 'MegaMenuAreas';

export default MegaMenuAreas;
