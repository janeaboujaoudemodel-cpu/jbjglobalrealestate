import React from 'react';
import { Building2, Eye } from 'lucide-react';
import menuCorporateOffice from '@/assets/menu-corporate-office.jpg';
import dubaiLandmarksVideoAsset from '@/assets/videos/dubai-landmarks-hero.mp4.asset.json';
const dubaiLandmarksVideo = dubaiLandmarksVideoAsset.url;
import { MegaMenuFeaturedCard, MegaMenuIconLink, MegaMenuShell, MegaMenuSection, MegaMenuCTAButton, MegaMenuSectionDivider } from '@/components/header/mega-menu-primitives';
import { useDevelopers } from '@/hooks/useProjects';

const FEATURED_DEVELOPER_SLUGS = [
  'emaar', 'damac', 'nakheel', 'meraas', 'sobha', 'aldar',
  'omniyat', 'select-group', 'ellington', 'azizi-developments',
  'dubai-properties', 'danube-properties',
];

interface MegaMenuDevelopersProps {
  onClose: () => void;
}

const MegaMenuDevelopers = React.forwardRef<HTMLDivElement, MegaMenuDevelopersProps>(({ onClose }, ref) => {
  const { data: developers } = useDevelopers(false);

  const displayDevelopers = React.useMemo(() => {
    if (!developers || developers.length === 0) return [];
    const slugMap = new Map(developers.map(d => [d.slug, d]));
    const ordered: { name: string; slug: string }[] = [];
    for (const slug of FEATURED_DEVELOPER_SLUGS) {
      const d = slugMap.get(slug);
      if (d) ordered.push({ name: d.name, slug: d.slug });
    }
    return ordered.slice(0, 12);
  }, [developers]);

  return (
    <MegaMenuShell ref={ref}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          <div className="lg:col-span-5 flex lg:pr-6">
            <MegaMenuFeaturedCard
              to="/developers"
              onClick={onClose}
              image={menuCorporateOffice}
              video={dubaiLandmarksVideo}
              kicker="DEVELOPERS"
              title="Top Developers"
              description="Dubai's most iconic developers"
              cta="View All Developers"
              className="flex-1 min-h-[260px] lg:min-h-[300px]"
            />
          </div>

          <div className="lg:col-span-7 lg:border-l lg:border-[#B89555]/30 lg:pl-2 border-t lg:border-t-0 border-[#B89555]/30 mt-6 lg:mt-0 pt-6 lg:pt-0">
            <MegaMenuSection icon={Building2} title="Top Developers">
              <div className="grid grid-cols-2 gap-1">
                {displayDevelopers.map((dev) => (
                  <MegaMenuIconLink key={dev.slug} to={`/developer/${dev.slug}`} onClick={onClose} icon={Building2} title={dev.name} compact />
                ))}
              </div>
            </MegaMenuSection>
            
            <MegaMenuSectionDivider />

            <div className="px-2.5">
              <MegaMenuCTAButton to="/developers" onClick={onClose} icon={Eye} title="View All Developers" />
            </div>
          </div>
        </div>
      </div>
    </MegaMenuShell>
  );
});

MegaMenuDevelopers.displayName = 'MegaMenuDevelopers';

export default MegaMenuDevelopers;