import type { PodcastEpisode } from "./types";
import { episode1Segments } from "./episode1";

// Thumbnails (unique per episode) — reuse existing premium assets
import ep1 from "@/assets/podcast-episode-1-thumbnail.jpg";
import ep2 from "@/assets/luxury-villa-hero.jpeg";
import ep3 from "@/assets/dubai-plane-view.png";
import ep4 from "@/assets/private-jet-interior-luxury.jpg";
import ep5 from "@/assets/rolls-royce-luxury.jpg";
import ep6 from "@/assets/yacht-deck-champagne.png";
import ep7 from "@/assets/luxury-villa-1.jpeg";
import ep8 from "@/assets/luxury-villa-2.jpeg";
import ep9 from "@/assets/luxury-villa-3.jpeg";
import ep10 from "@/assets/luxury-villa-4.jpeg";
import ep11 from "@/assets/luxury-villa-5.jpeg";
import ep12 from "@/assets/luxury-villa-6.jpeg";
import ep13 from "@/assets/luxury-villa-7.jpeg";
import ep14 from "@/assets/luxury-villa-8.jpeg";
import ep15 from "@/assets/founder-yacht-dubai.jpg";
import ep16 from "@/assets/founder-jet-interior.jpeg";
import ep17 from "@/assets/founder-lifestyle.jpeg";
import ep18 from "@/assets/founder-office.jpeg";
import ep19 from "@/assets/founder-hero.png";
import ep20 from "@/assets/team-hero-image.jpg";

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
  { code: "ur", name: "Urdu", flag: "🇵🇰" },
] as const;

export const podcastEpisodes: PodcastEpisode[] = [
  {
    id: 1,
    title: "Why Dubai Became the Capital of Global Investors",
    characters: ["Jane", "Alex", "Lina"],
    duration: "10:00",
    thumbnail: ep1, // Dubai skyline with Burj Khalifa
    segments: episode1Segments,
  },
  { id: 2, title: "Buying Property Smartly in a Global Market", characters: ["Jane", "Alex", "Lina"], duration: "14:20", thumbnail: ep2 }, // Luxury villa - matches buying property topic
  { id: 3, title: "The Truth About Off-Plan vs Ready Properties", characters: ["Jane", "Alex", "Lina"], duration: "11:30", thumbnail: ep3 }, // Dubai plane view - aerial perspective
  { id: 4, title: "How High-Net-Worth Investors Protect Capital", characters: ["Jane", "Alex", "Lina"], duration: "13:15", thumbnail: ep4 }, // Private jet - wealth preservation
  { id: 5, title: "Golden Visa Strategy Through Real Estate", characters: ["Jane", "Alex", "Lina"], duration: "10:50", thumbnail: ep15 }, // Founder yacht Dubai - residency/lifestyle
  { id: 6, title: "The Psychology of Successful Investors", characters: ["Jane", "Alex", "Lina"], duration: "12:00", thumbnail: ep6 }, // Yacht deck champagne - success mindset
  { id: 7, title: "Why Secondary Market Deals Matter", characters: ["Jane", "Alex", "Lina"], duration: "11:45", thumbnail: ep7 }, // Luxury villa - secondary market
  { id: 8, title: "Luxury Real Estate vs Mass Market Returns", characters: ["Jane", "Alex", "Lina"], duration: "13:30", thumbnail: ep8 }, // Luxury villa - luxury vs mass
  { id: 9, title: "Mistakes First-Time Investors Always Make", characters: ["Jane", "Alex", "Lina"], duration: "14:10", thumbnail: ep9 }, // Luxury villa - learning from mistakes
  { id: 10, title: "Building a Global Property Portfolio", characters: ["Jane", "Alex", "Lina"], duration: "15:00", thumbnail: ep10 }, // Luxury villa - portfolio building
  { id: 11, title: "How Developers Really Price Projects", characters: ["Jane", "Alex", "Lina"], duration: "12:20", thumbnail: ep11 }, // Luxury villa - developer pricing
  { id: 12, title: "Rental Yield vs Capital Appreciation", characters: ["Jane", "Alex", "Lina"], duration: "11:00", thumbnail: ep12 }, // Luxury villa - returns analysis
  { id: 13, title: "Investor Onboarding: What Professionals Look For", characters: ["Jane", "Alex", "Lina"], duration: "10:30", thumbnail: ep18 }, // Founder office - professional onboarding
  { id: 14, title: "Real Estate as a Wealth Transfer Tool", characters: ["Jane", "Alex", "Lina"], duration: "13:45", thumbnail: ep14 }, // Luxury villa - wealth transfer
  { id: 15, title: "Exit Strategies Nobody Explains", characters: ["Jane", "Alex", "Lina"], duration: "12:30", thumbnail: ep16 }, // Jet interior - exit/mobility
  { id: 16, title: "Legal Structures Every Investor Should Know", characters: ["Jane", "Alex", "Lina"], duration: "14:00", thumbnail: ep17 }, // Founder lifestyle - legal structures
  { id: 17, title: "The Future of Global Real Estate", characters: ["Jane", "Alex", "Lina"], duration: "11:15", thumbnail: ep19 }, // Founder hero - future vision
  { id: 18, title: "Building Trust in High-Value Transactions", characters: ["Jane", "Alex", "Lina"], duration: "10:45", thumbnail: ep13 }, // Luxury villa - trust/transactions
  { id: 19, title: "Why Most Investors Fail to Scale", characters: ["Jane", "Alex", "Lina"], duration: "12:50", thumbnail: ep20 }, // Team hero - scaling with team
  { id: 20, title: "The JBJ Investment Philosophy", characters: ["Jane", "Alex", "Lina"], duration: "15:30", thumbnail: ep5 }, // Rolls Royce - JBJ philosophy/luxury
];
