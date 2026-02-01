import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Eye, ArrowRight } from 'lucide-react';
import menuDubaiSkyline from '@/assets/menu-dubai-skyline.jpg';
import { MegaMenuFeaturedCard, MegaMenuIconLink, MegaMenuShell, MegaMenuSectionTitle } from '@/components/header/mega-menu-primitives';

interface MegaMenuDevelopersProps {
  onClose: () => void;
}

const MegaMenuDevelopers: React.FC<MegaMenuDevelopersProps> = ({ onClose }) => {
  const developers = [
    { name: 'Emaar Properties', slug: 'emaar' },
    { name: 'DAMAC Properties', slug: 'damac' },
    { name: 'Sobha Realty', slug: 'sobha' },
    { name: 'Nakheel Properties', slug: 'nakheel' },
    { name: 'Binghatti', slug: 'binghatti' },
    { name: 'Meraas', slug: 'meraas' },
    { name: 'Meraki', slug: 'meraki' },
    { name: 'Aldar Properties', slug: 'aldar' },
    { name: 'Ellington Properties', slug: 'ellington' },
    { name: 'H&H Development', slug: 'hh-development' },
    { name: 'Beyond', slug: 'beyond' },
    { name: 'Leos Development', slug: 'leos' },
    { name: 'Object One', slug: 'object-one' },
    { name: 'Azizi Developments', slug: 'azizi' },
    { name: 'HRE Developments', slug: 'hre' },
    { name: 'Select Group', slug: 'select-group' },
    { name: 'Danube Properties', slug: 'danube' },
    { name: 'Dubai Properties', slug: 'dubai-properties' },
  ];

  // Split into two columns
  const half = Math.ceil(developers.length / 2);
  const firstColumn = developers.slice(0, half);
  const secondColumn = developers.slice(half);

  return (
    <MegaMenuShell>
      <div className="max-w-[1560px] mx-auto px-8 lg:px-12 py-10 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6">
            <MegaMenuFeaturedCard
              to="/developers/emaar"
              onClick={onClose}
              image={menuDubaiSkyline}
              kicker="DEVELOPERS"
              title="Emaar Properties"
              description="Dubai's most iconic developer"
              cta="View All Projects"
            />
          </div>

          <div className="lg:col-span-6 lg:border-l lg:border-gold/30 lg:pl-10">
            <MegaMenuSectionTitle
              icon={Building2}
              title="Top Developers in Dubai"
              rightSlot={
                <Link
                  to="/developers"
                  onClick={onClose}
                  className="text-black text-sm font-medium hover:text-gold transition-colors flex items-center gap-1"
                >
                  <Eye className="w-4 h-4 text-gold" />
                  View All
                </Link>
              }
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {firstColumn.map((dev) => (
                <MegaMenuIconLink
                  key={dev.slug}
                  to={`/developers/${dev.slug}`}
                  onClick={onClose}
                  icon={Building2}
                  title={dev.name}
                  compact
                />
              ))}
              {secondColumn.map((dev) => (
                <MegaMenuIconLink
                  key={dev.slug}
                  to={`/developers/${dev.slug}`}
                  onClick={onClose}
                  icon={Building2}
                  title={dev.name}
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

export default MegaMenuDevelopers;
