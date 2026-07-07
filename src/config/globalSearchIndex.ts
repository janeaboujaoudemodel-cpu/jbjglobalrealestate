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

export type SearchItemAccess = 'public' | 'authenticated' | 'owner' | 'crm' | 'listing-admin' | 'broker' | 'professional';

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
  { id: 'quiz', label: 'AI Home Finder', route: '/ai-home-finder', keywords: ['ai', 'quiz', 'finder', 'match', 'recommend', 'suggestion', 'home finder'], description: 'AI-powered property matching', icon: Sparkles, access: 'public', category: 'page' },
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
    access: tool.id === 'property-comparison' ? 'professional' as SearchItemAccess : 'public' as SearchItemAccess,
    category: 'tool' as const,
  }));

// Broken or hidden tools must not appear through aliases.
const toolAliases: SearchItem[] = [];

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
  if (!q) return 0;
  const label = item.label.toLowerCase();
  const keywordsText = item.keywords.join(' ').toLowerCase();
  const descText = item.description.toLowerCase();

  // Strong direct matches
  if (label === q) return 100;
  if (label.startsWith(q)) return 80;
  if (item.keywords.some(k => k.toLowerCase() === q)) return 70;
  if (label.includes(q)) return 60;
  if (item.keywords.some(k => k.toLowerCase().startsWith(q))) return 50;
  if (keywordsText.includes(q)) return 30;
  if (descText.includes(q)) return 20;

  // Token-level fuzzy fallback — every token that appears anywhere adds points,
  // so multi-word or partial queries (e.g. "marina 2 bed", "emaar beachfront sqft")
  // always surface the nearest items instead of an empty screen.
  const tokens = q.split(/\s+/).filter(t => t.length >= 2);
  if (!tokens.length) return 0;
  const haystack = `${label} ${keywordsText} ${descText}`;
  let fuzzy = 0;
  for (const t of tokens) {
    if (label.includes(t)) fuzzy += 8;
    else if (haystack.includes(t)) fuzzy += 4;
    else if (t.length >= 4 && haystack.includes(t.slice(0, Math.max(3, t.length - 1)))) fuzzy += 2;
  }
  return fuzzy;
}

export interface SearchItemsOptions {
  isOwner?: boolean;
  hasCRMAccess?: boolean;
  hasListingAdminAccess?: boolean;
  isBroker?: boolean;
  isDeveloper?: boolean;
  isAuthenticated?: boolean;
  limit?: number;
}

function accessibleFor(item: SearchItem, o: SearchItemsOptions): boolean {
  const {
    isOwner = false,
    hasCRMAccess = false,
    hasListingAdminAccess = false,
    isBroker = false,
    isDeveloper = false,
    isAuthenticated = false,
  } = o;
  switch (item.access) {
    case 'public': return true;
    case 'authenticated': return isAuthenticated;
    case 'owner': return isOwner;
    case 'crm': return isOwner || hasCRMAccess;
    case 'listing-admin': return isOwner || hasListingAdminAccess;
    case 'broker': return isOwner || isBroker || hasCRMAccess;
    case 'professional': return isOwner || isBroker || isDeveloper || hasCRMAccess;
    default: return false;
  }
}

// Filter and rank search results
export function searchItems(query: string, options: SearchItemsOptions = {}): SearchItem[] {
  const { limit = 10 } = options;
  const accessibleItems = allSearchItems.filter(item => accessibleFor(item, options));

  if (!query.trim()) {
    return accessibleItems
      .filter(item => item.category === 'page' || item.category === 'tool')
      .slice(0, limit);
  }

  const scored = accessibleItems
    .map(item => ({ item, score: scoreSearchResult(item, query) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map(({ item }) => item);
}

/**
 * Always returns the nearest N items, even when no token matches.
 * Used to render the "We couldn't find an exact match, but here's the closest" panel.
 */
export function nearestSearchItems(query: string, options: SearchItemsOptions = {}): SearchItem[] {
  const { limit = 6 } = options;
  const accessibleItems = allSearchItems.filter(item => accessibleFor(item, options));
  const q = query.trim();
  if (!q) return accessibleItems.slice(0, limit);

  const scored = accessibleItems
    .map(item => ({ item, score: scoreSearchResult(item, q) }))
    .sort((a, b) => b.score - a.score);

  // Always return something — fall back to popular pages if every score is 0.
  const positive = scored.filter(s => s.score > 0).slice(0, limit).map(s => s.item);
  if (positive.length >= 3) return positive;
  const filler = accessibleItems
    .filter(i => (i.category === 'page' || i.category === 'tool') && !positive.includes(i))
    .slice(0, limit - positive.length);
  return [...positive, ...filler];
}

export default allSearchItems;
