import React from 'react';
import { MapPin, Eye, BookOpen } from 'lucide-react';
import menuDowntownSkyline from '@/assets/menu-downtown-dubai-skyline.jpg';
import dubaiDowntownVideoAsset from '@/assets/videos/why-dubai-downtown-burj-khalifa.mp4.asset.json';
const dubaiDowntownVideo = dubaiDowntownVideoAsset.url;
import { MegaMenuFeaturedCard, MegaMenuIconLink, MegaMenuShell, MegaMenuSection, MegaMenuCTAButton, MegaMenuSectionDivider } from '@/components/header/mega-menu-primitives';
import { useAreas } from '@/hooks/useAreas';

const FEATURED_AREA_SLUGS = [
  'downtown-dubai', 'palm-jumeirah', 'dubai-marina', 'dubai-hills',
  'business-bay', 'dubai-islands', 'jvc-jumeirah-village-circle',
  'dubai-creek-harbour', 'emaar-beachfront', 'al-marjan-island',
  'meydan-nad-al-sheba-1', 'jumeirah-beach-residence',
];

interface MegaMenuAreasProps {
  onClose: () => void;
}

const MegaMenuAreas = React.forwardRef<HTMLDivElement, MegaMenuAreasProps>(({ onClose }, ref) => {
  const { data: areas } = useAreas();

  const displayAreas = React.useMemo(() => {
    if (!areas || areas.length === 0) return [];
    const slugMap = new Map(areas.map(a => [a.slug, a]));
    const ordered: { name: string; slug: string }[] = [];
    for (const slug of FEATURED_AREA_SLUGS) {
      const a = slugMap.get(slug);
      if (a) ordered.push({ name: a.name, slug: a.slug });
    }
    return ordered.slice(0, 12);
  }, [areas]);

  return (
    <MegaMenuShell ref={ref}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          <div className="lg:col-span-5 flex lg:pr-6">
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

          <div className="lg:col-span-7 lg:border-l lg:border-[#B89555]/30 lg:pl-2 border-t lg:border-t-0 border-[#B89555]/30 mt-6 lg:mt-0 pt-6 lg:pt-0">
            <MegaMenuSection icon={MapPin} title="Top Areas">
              <div className="grid grid-cols-2 gap-1">
                {displayAreas.map((area) => (
                  <MegaMenuIconLink key={area.slug} to={`/area/${area.slug}`} onClick={onClose} icon={MapPin} title={area.name} compact />
                ))}
              </div>
            </MegaMenuSection>
            
            <MegaMenuSectionDivider />

            <div className="flex flex-col sm:flex-row gap-2 px-2.5">
              <MegaMenuCTAButton to="/areas" onClick={onClose} icon={Eye} title="View All Areas" />
              <MegaMenuCTAButton to="/guides" onClick={onClose} icon={BookOpen} title="Read Area Guides" />
            </div>
          </div>
        </div>
      </div>
    </MegaMenuShell>
  );
});

MegaMenuAreas.displayName = 'MegaMenuAreas';

export default MegaMenuAreas;