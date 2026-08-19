import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeaturedProjectAdProps {
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  projectSlug: string;
  ctaText?: string;
}

/**
 * Featured Project Ad Card
 * Full-width promotional card that appears between listing rows
 */
export const FeaturedProjectAd = ({
  title,
  subtitle,
  description,
  imageUrl,
  projectSlug,
  ctaText = "View Project Details"
}: FeaturedProjectAdProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.05 }}
      className="col-span-full"
    >
      <Link 
        to={`/project/${projectSlug}`}
        className="block group"
      >
        <div
          data-on-dark
          data-no-contrast-guard
          className="allow-white relative overflow-hidden rounded-2xl border border-white/18 shadow-[0_8px_30px_rgba(0,0,0,0.28)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.36)] transition-all duration-500"
          style={{
            background: 'linear-gradient(135deg, #064E3B 0%, #042C1C 58%, #010806 100%)'
          }}
        >
          {/* Image Section */}
          <div className="relative h-64 md:h-80 overflow-hidden">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
            {/* Fallback gradient behind image */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#064E3B]/30 via-black to-black -z-10" />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/20" />
            
            {/* Content overlay */}
            <div
              className="absolute bottom-0 left-0 right-0 p-6 md:p-8 allow-white [&_*]:!text-white"
              data-on-dark
              data-photo-copy-lock
              data-no-contrast-guard
              style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
            >
              <p
                data-no-contrast-guard
                style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
                className="text-sm md:text-base font-semibold tracking-[0.15em] mb-2 uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
              >
                {subtitle}
              </p>

              {/* Title */}
              <h3
                data-no-contrast-guard
                style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
                className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]"
              >
                {title}
              </h3>

              {/* Description */}
              <p
                data-no-contrast-guard
                style={{ color: "rgba(255,255,255,0.92)", WebkitTextFillColor: "rgba(255,255,255,0.92)" }}
                className="text-sm md:text-base max-w-2xl mb-5 line-clamp-2 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]"
              >
                {description}
              </p>

              
              {/* CTA Button */}
              <Button aria-label="Next"
                variant="primary"
                className="group/btn h-12 px-8 font-semibold"
              >
                {ctaText}
                <ArrowRight className="w-4 h-4 ml-2 transform group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

// Pre-configured featured ads
export const FEATURED_ADS = [
  {
    id: 'inaura',
    title: 'Inaura Hotels & Residences',
    subtitle: 'Luxury Living in Downtown Dubai',
    description: 'A landmark branded living destination rising in Downtown Dubai, defined by architectural movement and wellness integration.',
    imageUrl: 'https://d3h330vgpwpjr8.cloudfront.net/x/1650x/Banner_389cbe13ae.webp',
    projectSlug: 'inaura-hotels-and-residences-arada-properties-downtown-dubai',
    ctaText: 'Explore Now'
  },
  {
    id: 'mercedes-benz',
    title: 'Mercedes-Benz Places - Binghatti City',
    subtitle: 'Mercedes-Benz Places',
    description: "Find your home in the world's first Mercedes-Benz-branded city located in the heart of Meydan.",
    imageUrl: 'https://d3h330vgpwpjr8.cloudfront.net/x/1128x/Mercedes_Benz_Places_2_16c6f5cada.webp',
    projectSlug: 'mercedes-benz-places-binghatti-meydan',
    ctaText: 'View Project Details'
  },
  {
    // Replaces the old "Expo City Dubai" entry: that slug had no live project
    // and its CDN image returned 403 (banner rendered with no photo).
    id: 'expo-valley-views',
    title: 'Expo Valley Views',
    subtitle: 'Legacy of World Expo 2020',
    description: 'Exclusive residences inside Expo City Dubai, where landscaped valleys and innovation districts meet luxury living.',
    imageUrl: 'https://ggfx-providentestate.s3.eu-west-2.amazonaws.com/i/Feature_2105b67f29.jpg',
    projectSlug: 'expo-valley-views-expo-city',
    ctaText: 'Explore Now'
  }

];

export default FeaturedProjectAd;
