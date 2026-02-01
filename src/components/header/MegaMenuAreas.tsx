import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Eye, ArrowRight } from 'lucide-react';
import menuDowntownDubai from '@/assets/menu-downtown-dubai.jpg';
import { MegaMenuFeaturedCard, MegaMenuIconLink, MegaMenuShell, MegaMenuSectionTitle } from '@/components/header/mega-menu-primitives';

interface MegaMenuAreasProps {
  onClose: () => void;
}

const MegaMenuAreas: React.FC<MegaMenuAreasProps> = ({ onClose }) => {
  const areas = [
    { name: 'Dubai Creek Harbour', slug: 'dubai-creek-harbour' },
    { name: 'Business Bay', slug: 'business-bay' },
    { name: 'Dubai Marina', slug: 'dubai-marina' },
    { name: 'Palm Jumeirah', slug: 'palm-jumeirah' },
    { name: 'Downtown Dubai', slug: 'downtown-dubai' },
    { name: 'Jumeirah Village Circle', slug: 'jvc' },
    { name: 'Emaar Beachfront', slug: 'emaar-beachfront' },
    { name: 'Sobha Hartland', slug: 'sobha-hartland' },
    { name: 'Expo City', slug: 'expo-city' },
    { name: 'Dubai Hills Estate', slug: 'dubai-hills-estate' },
    { name: 'Dubai Islands', slug: 'dubai-islands' },
    { name: 'Palm Jebel Ali', slug: 'palm-jebel-ali' },
    { name: 'The World Islands', slug: 'the-world-islands' },
    { name: 'The Oasis', slug: 'the-oasis' },
    { name: 'MBR City', slug: 'mbr-city' },
    { name: 'Jumeirah Beach Residence', slug: 'jbr' },
  ];

  // Split into two columns
  const half = Math.ceil(areas.length / 2);
  const firstColumn = areas.slice(0, half);
  const secondColumn = areas.slice(half);

  return (
    <MegaMenuShell>
      <div className="max-w-[1560px] mx-auto px-8 lg:px-12 py-10 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6">
            <MegaMenuFeaturedCard
              to="/areas"
              onClick={onClose}
              image={menuDowntownDubai}
              kicker="AREAS"
              title="Dubai's Prime Locations"
              description="Discover the best communities in Dubai"
              cta="Explore Areas"
            />
          </div>

          <div className="lg:col-span-6 lg:border-l lg:border-gold/30 lg:pl-10">
            <MegaMenuSectionTitle
              icon={MapPin}
              title="Top Areas in Dubai"
              rightSlot={
                <Link
                  to="/areas"
                  onClick={onClose}
                  className="text-black text-sm font-medium hover:text-gold transition-colors flex items-center gap-1"
                >
                  <Eye className="w-4 h-4 text-gold" />
                  View All
                </Link>
              }
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {firstColumn.map((area) => (
                <MegaMenuIconLink
                  key={area.slug}
                  to={`/areas/${area.slug}`}
                  onClick={onClose}
                  icon={MapPin}
                  title={area.name}
                  compact
                />
              ))}
              {secondColumn.map((area) => (
                <MegaMenuIconLink
                  key={area.slug}
                  to={`/areas/${area.slug}`}
                  onClick={onClose}
                  icon={MapPin}
                  title={area.name}
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

export default MegaMenuAreas;
