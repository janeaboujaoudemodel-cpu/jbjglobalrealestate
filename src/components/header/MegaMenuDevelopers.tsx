import React from 'react';
import { Building2, Eye } from 'lucide-react';
import menuCorporateOffice from '@/assets/menu-corporate-office.jpg';
import dubaiLandmarksVideo from '@/assets/videos/dubai-landmarks-hero.mp4';
import { MegaMenuFeaturedCard, MegaMenuIconLink, MegaMenuShell, MegaMenuCard, MegaMenuCTAButton, MegaMenuSectionDivider } from '@/components/header/mega-menu-primitives';
import { useDevelopers } from '@/hooks/useProjects';

/** Curated famous developers shown first */
const FEATURED_DEVELOPER_SLUGS = [
  'emaar',
  'damac',
  'nakheel',
  'meraas',
  'sobha',
  'aldar',
  'omniyat',
  'select-group',
  'ellington',
  'azizi-developments',
  'dubai-properties',
  'danube-properties',
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Featured card — wider (5 cols), different video than areas */}
          <div className="lg:col-span-5 flex">
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

          {/* Developers list — narrower (7 cols), no scroll */}
          <div className="lg:col-span-7 lg:border-l lg:border-gold/30 lg:pl-8">
            <MegaMenuCard icon={Building2} title="Top Developers">
              <div className="grid grid-cols-2 gap-1">
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
            
            <MegaMenuSectionDivider />

            <MegaMenuCTAButton
              to="/developers"
              onClick={onClose}
              icon={Eye}
              title="View All Developers"
            />
          </div>
        </div>
      </div>
    </MegaMenuShell>
  );
});

MegaMenuDevelopers.displayName = 'MegaMenuDevelopers';

export default MegaMenuDevelopers;
