import type { PodcastEpisode } from "./types";
import { episode1Segments } from "./episode1";

// Generated episode-specific thumbnails (matching each topic)
import ep1 from "@/assets/podcast/ep1-why-dubai-capital.jpg";
import ep2 from "@/assets/podcast/ep2-buying-property.jpg";
import ep3 from "@/assets/podcast/ep3-offplan-vs-ready.jpg";
import ep4 from "@/assets/podcast/ep4-capital-protection.jpg";
import ep5 from "@/assets/podcast/ep5-golden-visa.jpg";
import ep6 from "@/assets/podcast/ep6-investor-psychology.jpg";
import ep7 from "@/assets/podcast/ep7-secondary-market.jpg";
import ep8 from "@/assets/podcast/ep8-luxury-vs-mass.jpg";
import ep9 from "@/assets/podcast/ep9-investor-mistakes.jpg";
import ep10 from "@/assets/podcast/ep10-global-portfolio.jpg";
import ep11 from "@/assets/podcast/ep11-developer-pricing.jpg";
import ep12 from "@/assets/podcast/ep12-yield-vs-appreciation.jpg";
import ep13 from "@/assets/podcast/ep13-investor-onboarding.jpg";
import ep14 from "@/assets/podcast/ep14-wealth-transfer.jpg";
import ep15 from "@/assets/podcast/ep15-exit-strategies.jpg";
import ep16 from "@/assets/podcast/ep16-legal-structures.jpg";
import ep17 from "@/assets/podcast/ep17-future-real-estate.jpg";
import ep18 from "@/assets/podcast/ep18-building-trust.jpg";
import ep19 from "@/assets/podcast/ep19-scaling-failures.jpg";
import ep20 from "@/assets/podcast/ep20-jbj-philosophy.jpg";

export const podcastLanguages = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "ar", name: "Arabic", flag: "🇦🇪" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "tr", name: "Turkish", flag: "🇹🇷" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "fa", name: "Persian", flag: "🇮🇷" },
] as const;

export const podcastEpisodes: PodcastEpisode[] = [
  {
    id: 1,
    title: "Why Dubai Became the Capital of Global Investors",
    characters: ["Jane", "Alex", "Lina"],
    // Duration is computed from the generated audio at runtime (avoid hardcoded/fake durations).
    duration: "Auto",
    thumbnail: ep1,
    segments: episode1Segments,
  },
  // NOTE: Upcoming episodes are visible but NOT playable until you add the script segments.
  { id: 2, title: "Buying Property Smartly in a Global Market", characters: ["Jane", "Alex", "Lina"], duration: "Coming soon", thumbnail: ep2 },
  { id: 3, title: "The Truth About Off-Plan vs Ready Properties", characters: ["Jane", "Alex", "Lina"], duration: "Coming soon", thumbnail: ep3 },
  { id: 4, title: "How High-Net-Worth Investors Protect Capital", characters: ["Jane", "Alex", "Lina"], duration: "Coming soon", thumbnail: ep4 },
  { id: 5, title: "Golden Visa Strategy Through Real Estate", characters: ["Jane", "Alex", "Lina"], duration: "Coming soon", thumbnail: ep5 },
  { id: 6, title: "The Psychology of Successful Investors", characters: ["Jane", "Alex", "Lina"], duration: "Coming soon", thumbnail: ep6 },
  { id: 7, title: "Why Secondary Market Deals Matter", characters: ["Jane", "Alex", "Lina"], duration: "Coming soon", thumbnail: ep7 },
  { id: 8, title: "Luxury Real Estate vs Mass Market Returns", characters: ["Jane", "Alex", "Lina"], duration: "Coming soon", thumbnail: ep8 },
  { id: 9, title: "Mistakes First-Time Investors Always Make", characters: ["Jane", "Alex", "Lina"], duration: "Coming soon", thumbnail: ep9 },
  { id: 10, title: "Building a Global Property Portfolio", characters: ["Jane", "Alex", "Lina"], duration: "Coming soon", thumbnail: ep10 },
  { id: 11, title: "How Developers Really Price Projects", characters: ["Jane", "Alex", "Lina"], duration: "Coming soon", thumbnail: ep11 },
  { id: 12, title: "Rental Yield vs Capital Appreciation", characters: ["Jane", "Alex", "Lina"], duration: "Coming soon", thumbnail: ep12 },
  { id: 13, title: "Investor Onboarding: What Professionals Look For", characters: ["Jane", "Alex", "Lina"], duration: "Coming soon", thumbnail: ep13 },
  { id: 14, title: "Real Estate as a Wealth Transfer Tool", characters: ["Jane", "Alex", "Lina"], duration: "Coming soon", thumbnail: ep14 },
  { id: 15, title: "Exit Strategies Nobody Explains", characters: ["Jane", "Alex", "Lina"], duration: "Coming soon", thumbnail: ep15 },
  { id: 16, title: "Legal Structures Every Investor Should Know", characters: ["Jane", "Alex", "Lina"], duration: "Coming soon", thumbnail: ep16 },
  { id: 17, title: "The Future of Global Real Estate", characters: ["Jane", "Alex", "Lina"], duration: "Coming soon", thumbnail: ep17 },
  { id: 18, title: "Building Trust in High-Value Transactions", characters: ["Jane", "Alex", "Lina"], duration: "Coming soon", thumbnail: ep18 },
  { id: 19, title: "Why Most Investors Fail to Scale", characters: ["Jane", "Alex", "Lina"], duration: "Coming soon", thumbnail: ep19 },
  { id: 20, title: "The JBJ Investment Philosophy", characters: ["Jane", "Alex", "Lina"], duration: "Coming soon", thumbnail: ep20 },
];
