/**
 * Global Search Index - Central registry for searchable destinations
 * Used by GlobalSearchModal for deep-linking to any page/tool
 */

import { 
  Home, Building2, Sparkles, FileText, Scale, Layers, Phone, Award, 
  Newspaper, User, Heart, Settings, LayoutDashboard, Shield, FolderOpen,
  Video, Mic, Palette, Calculator, BarChart3, Users, Mail, Calendar,
  Camera, Ruler, Brain, PenTool, TrendingUp, Globe, Target, MessageSquare,
  Map, ClipboardCheck, Briefcase, ScanLine, DollarSign, Lightbulb, Bot,
  BookOpen, GraduationCap, Key, HelpCircle
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { allTools } from "@/config/royalToolsRegistry";

export type SearchItemAccess = 'public' | 'authenticated' | 'owner' | 'crm' | 'listing-admin' | 'broker';

export interface SearchItem {
  id: string;
  label: string;
  route: string;
  keywords: string[];
  description: string;
  icon: LucideIcon;
  access: SearchItemAccess;
  category: 'page' | 'tool' | 'admin' | 'guide' | 'service';
}

// Public pages
const publicPages: SearchItem[] = [
  { id: 'home', label: 'Home', route: '/', keywords: ['home', 'homepage', 'main', 'start'], description: 'Return to homepage', icon: Home, access: 'public', category: 'page' },
  { id: 'properties', label: 'Properties', route: '/properties', keywords: ['property', 'properties', 'real estate', 'apartment', 'villa', 'buy', 'invest', 'off-plan', 'ready', 'listing', 'listings'], description: 'Browse all properties', icon: Building2, access: 'public', category: 'page' },
  { id: 'concierge', label: 'Luxury Concierge', route: '/concierge', keywords: ['concierge', 'luxury', 'jet', 'yacht', 'car', 'limousine', 'travel', 'lifestyle', 'vip'], description: 'Premium lifestyle services', icon: Sparkles, access: 'public', category: 'page' },
  { id: 'quiz', label: 'AI Home Finder', route: '/quiz', keywords: ['ai', 'quiz', 'finder', 'match', 'recommend', 'suggestion', 'home finder'], description: 'AI-powered property matching', icon: Sparkles, access: 'public', category: 'page' },
  { id: 'market-report', label: 'Market Report', route: '/market-report', keywords: ['market', 'report', 'analysis', 'insights', 'uae', 'dubai', 'data'], description: 'UAE market insights', icon: FileText, access: 'public', category: 'page' },
  { id: 'mortgage', label: 'Mortgage Calculator', route: '/mortgage-calculator', keywords: ['mortgage', 'calculator', 'finance', 'loan', 'payment', 'bank'], description: 'Mortgage estimation tool', icon: Calculator, access: 'public', category: 'page' },
  { id: 'contact', label: 'Contact Us', route: '/contact', keywords: ['contact', 'email', 'phone', 'whatsapp', 'reach', 'inquiry', 'call'], description: 'Get in touch', icon: Phone, access: 'public', category: 'page' },
  { id: 'about', label: 'About Us', route: '/about', keywords: ['about', 'company', 'who', 'us', 'jbj'], description: 'Learn about JBJ Global Real Estate', icon: Building2, access: 'public', category: 'page' },
  { id: 'founder', label: 'Founder & Leadership', route: '/founder', keywords: ['founder', 'jane', 'jaoude', 'leadership', 'ceo', 'chairwoman', 'bio'], description: 'Meet Jane Bou Jaoude', icon: User, access: 'public', category: 'page' },
  { id: 'awards', label: 'Awards', route: '/awards', keywords: ['award', 'awards', 'recognition', 'achievement', 'trophy'], description: 'Our achievements', icon: Award, access: 'public', category: 'page' },
  { id: 'news', label: 'News & Insights', route: '/news', keywords: ['news', 'blog', 'article', 'update', 'insights', 'press'], description: 'Latest updates', icon: Newspaper, access: 'public', category: 'page' },
  { id: 'favorites', label: 'Favorites & Shortlist', route: '/favorites', keywords: ['favorites', 'shortlist', 'saved', 'compare', 'wishlist', 'liked'], description: 'Your saved properties', icon: Heart, access: 'public', category: 'page' },
  { id: 'toolkit', label: 'All Tools Hub', route: '/toolkit', keywords: ['toolkit', 'tools', 'hub', 'all tools', 'utilities'], description: 'Professional AI-powered tools', icon: Sparkles, access: 'public', category: 'page' },
  { id: 'areas', label: 'Area Guides', route: '/areas', keywords: ['areas', 'neighborhoods', 'locations', 'dubai areas', 'communities'], description: 'Explore Dubai areas', icon: Map, access: 'public', category: 'page' },
  { id: 'developers', label: 'Developers', route: '/developers', keywords: ['developers', 'builder', 'emaar', 'damac', 'meraas', 'nakheel'], description: 'Browse developers', icon: Building2, access: 'public', category: 'page' },
];

// Guides
const guides: SearchItem[] = [
  { id: 'buyer-guide', label: 'Buyer Guide', route: '/buyer-guide', keywords: ['buyer', 'buying', 'purchase', 'guide'], description: 'Guide for property buyers', icon: BookOpen, access: 'public', category: 'guide' },
  { id: 'seller-guide', label: 'Seller Guide', route: '/seller-guide', keywords: ['seller', 'selling', 'sell property', 'guide'], description: 'Guide for property sellers', icon: BookOpen, access: 'public', category: 'guide' },
  { id: 'rent-guide', label: 'Rental Guide', route: '/rent-guide', keywords: ['rent', 'renting', 'tenant', 'lease', 'rental', 'guide'], description: 'Rental guide for Dubai properties', icon: Key, access: 'public', category: 'guide' },
  { id: 'tenant-guide', label: 'Tenant Guide', route: '/tenant-guide', keywords: ['tenant', 'rental', 'lease', 'guide'], description: 'Rights and responsibilities', icon: BookOpen, access: 'public', category: 'guide' },
  { id: 'landlord-guide', label: 'Landlord Guide', route: '/landlord-guide', keywords: ['landlord', 'owner', 'rental income', 'guide'], description: 'For property owners', icon: BookOpen, access: 'public', category: 'guide' },
  { id: 'golden-visa', label: 'Golden Visa Guide', route: '/guides/golden-visa-uae', keywords: ['golden visa', 'visa', 'residency', 'uae visa', 'investor visa'], description: 'UAE Golden Visa information', icon: Award, access: 'public', category: 'guide' },
  { id: 'faq', label: 'FAQ', route: '/faq', keywords: ['faq', 'questions', 'help', 'support', 'answers'], description: 'Frequently asked questions', icon: HelpCircle, access: 'public', category: 'guide' },
];

// Services
const services: SearchItem[] = [
  { id: 'services', label: 'Our Services', route: '/services', keywords: ['services', 'what we do'], description: 'All our services', icon: Briefcase, access: 'public', category: 'service' },
  { id: 'law-firm', label: 'Law Firm', route: '/services/law-firm', keywords: ['law', 'legal', 'firm', 'lawyer', 'attorney', 'contract'], description: 'Legal services', icon: Scale, access: 'public', category: 'service' },
  { id: 'design-build', label: 'Design & Build', route: '/services/design-build', keywords: ['design', 'build', 'architecture', 'interior', 'fitout', 'construction', 'renovation'], description: 'Architecture & design services', icon: Layers, access: 'public', category: 'service' },
  { id: 'property-management', label: 'Property Management', route: '/services/property-management', keywords: ['property management', 'manage', 'rental management'], description: 'Property management services', icon: Building2, access: 'public', category: 'service' },
  { id: 'valuation', label: 'Property Valuation', route: '/sell/valuation', keywords: ['valuation', 'value', 'appraisal', 'worth', 'price'], description: 'Get property valuation', icon: BarChart3, access: 'public', category: 'service' },
];

// Admin/Owner routes
const adminRoutes: SearchItem[] = [
  { id: 'owner-dashboard', label: 'Owner Command Center', route: '/owner', keywords: ['owner', 'command center', 'owner dashboard', 'admin', 'management'], description: 'Owner dashboard', icon: LayoutDashboard, access: 'owner', category: 'admin' },
  { id: 'admin-panel', label: 'Admin Panel', route: '/admin', keywords: ['admin', 'panel', 'administration', 'settings', 'hr', 'it'], description: 'Administrative controls', icon: Shield, access: 'owner', category: 'admin' },
  { id: 'listing-admin', label: 'Listing Admin', route: '/listing-admin', keywords: ['listing', 'admin', 'listings', 'properties admin', 'data ops'], description: 'Manage property listings', icon: FolderOpen, access: 'listing-admin', category: 'admin' },
  { id: 'studio', label: 'Creative Studio', route: '/studio', keywords: ['studio', 'creative', 'projects', 'video', 'media'], description: 'Creative projects studio', icon: Palette, access: 'owner', category: 'admin' },
  { id: 'crm', label: 'CRM Dashboard', route: '/crm', keywords: ['crm', 'leads', 'pipeline', 'sales', 'customers', 'clients', 'contacts'], description: 'Customer relationship management', icon: Users, access: 'crm', category: 'admin' },
  { id: 'founder-assistant', label: 'My Assistant', route: '/founder-assistant', keywords: ['assistant', 'ai assistant', 'helper', 'personal assistant'], description: 'Personal AI assistant', icon: Bot, access: 'owner', category: 'admin' },
  { id: 'ai-hub', label: 'AI Hub', route: '/ai-hub', keywords: ['ai hub', 'artificial intelligence', 'ai tools', 'ai center'], description: 'AI tools hub', icon: Brain, access: 'public', category: 'admin' },
];

// Convert tools registry to search items - filter out any with undefined icons
const toolsFromRegistry: SearchItem[] = allTools
  .filter(tool => tool.icon && typeof tool.icon === 'function')
  .map(tool => ({
    id: tool.id,
    label: tool.name,
    route: tool.href,
    keywords: [
      ...tool.tags.map(t => t.toLowerCase()),
      tool.name.toLowerCase(),
      ...tool.description.toLowerCase().split(' ').filter(w => w.length > 3),
    ],
    description: tool.description,
    icon: tool.icon,
    access: 'public' as SearchItemAccess,
    category: 'tool' as const,
  }));

// Additional tool aliases for better search
const toolAliases: SearchItem[] = [
  { id: 'graphic-designer', label: 'Graphic Designer', route: '/jbj-design-studio', keywords: ['graphic', 'designer', 'brochure', 'marketing pack', 'flyer', 'poster'], description: 'Create marketing materials', icon: PenTool, access: 'public', category: 'tool' },
  { id: 'interior-design', label: 'AI Interior Design', route: '/interior-design-ai', keywords: ['interior', 'design', 'room', 'decor', 'staging', 'furniture'], description: 'AI interior design tool', icon: Palette, access: 'public', category: 'tool' },
  { id: 'property-measurement', label: 'Property Measurement', route: '/property-measurement', keywords: ['measurement', 'size', 'sqft', 'square feet', 'area', 'dimensions'], description: 'Measure property sizes', icon: Ruler, access: 'public', category: 'tool' },
  { id: 'video-studio', label: 'Video Studio', route: '/toolkit/ai-video-studio', keywords: ['video', 'editor', 'captions', 'subtitles', 'edit video'], description: 'Professional video editor', icon: Video, access: 'public', category: 'tool' },
  { id: 'voice-studio', label: 'Voice Studio', route: '/toolkit/voice-studio', keywords: ['voice', 'audio', 'tts', 'text to speech', 'voiceover'], description: 'AI voice generation', icon: Mic, access: 'public', category: 'tool' },
  { id: 'voice-studio-pro', label: 'Voice Studio Pro', route: '/toolkit/voice-studio-pro', keywords: ['voice', 'clone', 'cloning', 'tts', 'text to speech', 'multilingual', 'arabic', 'languages', 'elevenlabs', 'narration'], description: 'Voice cloning + multi-language TTS', icon: Mic, access: 'public', category: 'tool' },
];

// Broker-specific routes
const brokerRoutes: SearchItem[] = [
  { id: 'broker-dashboard', label: 'Broker Dashboard', route: '/broker-dashboard', keywords: ['broker', 'dashboard', 'agent'], description: 'Broker workspace', icon: LayoutDashboard, access: 'broker', category: 'admin' },
  { id: 'broker-education', label: 'Broker Education', route: '/broker-education', keywords: ['broker', 'education', 'training', 'learning', 'courses'], description: 'Broker training center', icon: GraduationCap, access: 'broker', category: 'admin' },
  { id: 'broker-toolkit', label: 'Broker Toolkit', route: '/broker-toolkit', keywords: ['broker', 'toolkit', 'tools', 'resources'], description: 'Broker tools and resources', icon: Briefcase, access: 'broker', category: 'admin' },
];

// Combine all search items
export const allSearchItems: SearchItem[] = [
  ...publicPages,
  ...guides,
  ...services,
  ...adminRoutes,
  ...toolsFromRegistry,
  ...toolAliases,
  ...brokerRoutes,
];

// Search scoring function
export function scoreSearchResult(item: SearchItem, query: string): number {
  const q = query.toLowerCase().trim();
  const label = item.label.toLowerCase();
  const keywords = item.keywords.join(' ').toLowerCase();
  
  // Exact label match = highest score
  if (label === q) return 100;
  
  // Label starts with query
  if (label.startsWith(q)) return 80;
  
  // Label contains query as word
  if (label.includes(q)) return 60;
  
  // Exact keyword match
  if (item.keywords.some(k => k.toLowerCase() === q)) return 70;
  
  // Keyword starts with query
  if (item.keywords.some(k => k.toLowerCase().startsWith(q))) return 50;
  
  // Keyword contains query
  if (keywords.includes(q)) return 30;
  
  // Description contains query
  if (item.description.toLowerCase().includes(q)) return 20;
  
  return 0;
}

// Filter and rank search results
export function searchItems(
  query: string,
  options: {
    isOwner?: boolean;
    hasCRMAccess?: boolean;
    hasListingAdminAccess?: boolean;
    isBroker?: boolean;
    isAuthenticated?: boolean;
    limit?: number;
  } = {}
): SearchItem[] {
  const { 
    isOwner = false, 
    hasCRMAccess = false, 
    hasListingAdminAccess = false,
    isBroker = false,
    isAuthenticated = false,
    limit = 10 
  } = options;
  
  // Filter by access
  const accessibleItems = allSearchItems.filter(item => {
    switch (item.access) {
      case 'public':
        return true;
      case 'authenticated':
        return isAuthenticated;
      case 'owner':
        return isOwner;
      case 'crm':
        return isOwner || hasCRMAccess;
      case 'listing-admin':
        return isOwner || hasListingAdminAccess;
      case 'broker':
        return isOwner || isBroker || hasCRMAccess;
      default:
        return false;
    }
  });
  
  // If no query, return top public items
  if (!query.trim()) {
    return accessibleItems
      .filter(item => item.category === 'page' || item.category === 'tool')
      .slice(0, limit);
  }
  
  // Score and rank
  const scored = accessibleItems
    .map(item => ({ item, score: scoreSearchResult(item, query) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);
  
  return scored.slice(0, limit).map(({ item }) => item);
}

export default allSearchItems;
