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
 * Matches Provident Estate's sidebar advertising layout
 * Full-width promotional card that appears between listing rows
 */
export const FeaturedProjectAd = ({
  title,
  subtitle,
  description,
  imageUrl,
  projectSlug,
  ctaText = "Learn More"
}: FeaturedProjectAdProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="col-span-full"
    >
      <Link 
        to={`/projects/${projectSlug}`}
        className="block group"
      >
        <div 
          className="relative overflow-hidden rounded-2xl border-2 border-gold/40 shadow-[0_8px_30px_rgba(200,167,102,0.25)] hover:shadow-[0_12px_40px_rgba(200,167,102,0.35)] transition-all duration-500"
          style={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%)'
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
            <div className="absolute inset-0 bg-gradient-to-br from-gold/20 via-black to-black -z-10" />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            
            {/* Content overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
              {/* Subtitle / Tagline */}
              <p className="text-gold text-sm md:text-base font-medium tracking-wide mb-2 uppercase">
                {subtitle}
              </p>
              
              {/* Title */}
              <h3 
                className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                {title}
              </h3>
              
              {/* Description */}
              <p className="text-white/80 text-sm md:text-base max-w-2xl mb-5 line-clamp-2">
                {description}
              </p>
              
              {/* CTA Button */}
              <Button
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

// Pre-configured featured ads matching Provident's promotional projects
export const FEATURED_ADS = [
  {
    id: 'inaura',
    title: 'Inaura Hotels & Residences',
    subtitle: 'Luxury Living in Downtown Dubai',
    description: 'A landmark branded living destination rising in Downtown Dubai, defined by architectural movement and wellness integration.',
    imageUrl: 'https://d3h330vgpwpjr8.cloudfront.net/x/1128x/Feature_309f6a8c5c.webp',
    projectSlug: 'inaura-hotels-and-residences-arada-properties-downtown-dubai',
    ctaText: 'Explore Now'
  },
  {
    id: 'mercedes-benz',
    title: 'Mercedes-Benz Places - Binghatti City',
    subtitle: 'Driven by Automotive Precision',
    description: "Find your home in the world's first Mercedes-Benz-branded city located in the heart of Meydan.",
    imageUrl: 'https://d3h330vgpwpjr8.cloudfront.net/x/1128x/Mercedes_Benz_Places_2_16c6f5cada.webp',
    projectSlug: 'mercedes-benz-places-binghatti-meydan',
    ctaText: 'Learn More'
  },
  {
    id: 'expo-city',
    title: 'Expo City Dubai Luxury Homes',
    subtitle: 'Legacy of World Expo 2020',
    description: 'Discover exclusive residences in the heart of innovation at Expo City Dubai, where the future meets luxury living.',
    imageUrl: 'https://d3h330vgpwpjr8.cloudfront.net/x/1128x/Expo_2020_f00f1e0c8d.webp',
    projectSlug: 'expo-city-dubai',
    ctaText: 'Explore Now'
  }
];

export default FeaturedProjectAd;
