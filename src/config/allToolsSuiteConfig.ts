/**
 * All Tools Suite Configuration
 * Master configuration for the unified tools hub with dynamic color theming
 */

import { 
  Building2, TrendingUp, MapPin, Calculator, FileBarChart, BarChart3,
  Home, Mail, Languages, Video, FileText, FileSearch, CalendarDays,
  Palette, DollarSign, Users, MessageSquare, Sparkles, Phone,
  CreditCard, Layers, PenTool, Share2, FileAudio, Target,
  Briefcase, Wand2, Image, Mic, Camera, Scissors, Stamp, Pen, Globe, Award
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export interface ToolConfig {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
  href: string;
}

export interface ToolCategory {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  tools: ToolConfig[];
}

// Color theme mappings for each tool - used for dynamic content area theming
export const toolColorThemes: Record<string, {
  bg: string;
  accent: string;
  border: string;
  gradient: string;
  ring: string;
}> = {
  // Property & Valuation
  'property-analyzer': { bg: 'bg-orange-950/40', accent: 'text-orange-400', border: 'border-orange-500/30', gradient: 'from-orange-500/20 to-orange-950/40', ring: 'ring-orange-500/30' },
  'price-predictor': { bg: 'bg-blue-950/40', accent: 'text-blue-400', border: 'border-blue-500/30', gradient: 'from-blue-500/20 to-blue-950/40', ring: 'ring-blue-500/30' },
  'neighborhood-insights': { bg: 'bg-teal-950/40', accent: 'text-teal-400', border: 'border-teal-500/30', gradient: 'from-teal-500/20 to-teal-950/40', ring: 'ring-teal-500/30' },
  'property-evaluator': { bg: 'bg-blue-950/40', accent: 'text-blue-400', border: 'border-blue-500/30', gradient: 'from-blue-500/20 to-blue-950/40', ring: 'ring-blue-500/30' },
  'property-comparison': { bg: 'bg-sky-950/40', accent: 'text-sky-400', border: 'border-sky-500/30', gradient: 'from-sky-500/20 to-sky-950/40', ring: 'ring-sky-500/30' },
  'home-finder': { bg: 'bg-purple-950/40', accent: 'text-purple-400', border: 'border-purple-500/30', gradient: 'from-purple-500/20 to-purple-950/40', ring: 'ring-purple-500/30' },
  
  // Investment
  'roi-calculator': { bg: 'bg-emerald-950/40', accent: 'text-emerald-400', border: 'border-emerald-500/30', gradient: 'from-emerald-500/20 to-emerald-950/40', ring: 'ring-emerald-500/30' },
  'mortgage-calculator': { bg: 'bg-amber-950/40', accent: 'text-[#1A1A1A]', border: 'border-amber-500/30', gradient: 'from-amber-500/20 to-amber-950/40', ring: 'ring-amber-500/30' },
  'rental-index': { bg: 'bg-emerald-950/40', accent: 'text-emerald-400', border: 'border-emerald-500/30', gradient: 'from-emerald-500/20 to-emerald-950/40', ring: 'ring-emerald-500/30' },
  'investment-report': { bg: 'bg-green-950/40', accent: 'text-green-400', border: 'border-green-500/30', gradient: 'from-green-500/20 to-green-950/40', ring: 'ring-green-500/30' },
  
  // Market Intelligence
  'market-report': { bg: 'bg-cyan-950/40', accent: 'text-cyan-400', border: 'border-cyan-500/30', gradient: 'from-cyan-500/20 to-cyan-950/40', ring: 'ring-cyan-500/30' },
  'competitor-analysis': { bg: 'bg-orange-950/40', accent: 'text-orange-400', border: 'border-orange-500/30', gradient: 'from-orange-500/20 to-orange-950/40', ring: 'ring-orange-500/30' },
  
  // Communication
  'email-generator': { bg: 'bg-teal-950/40', accent: 'text-teal-400', border: 'border-teal-500/30', gradient: 'from-teal-500/20 to-teal-950/40', ring: 'ring-teal-500/30' },
  'translation-hub': { bg: 'bg-amber-950/40', accent: 'text-[#1A1A1A]', border: 'border-amber-500/30', gradient: 'from-amber-500/20 to-amber-950/40', ring: 'ring-amber-500/30' },
  'video-tour-script': { bg: 'bg-pink-950/40', accent: 'text-pink-400', border: 'border-pink-500/30', gradient: 'from-pink-500/20 to-pink-950/40', ring: 'ring-pink-500/30' },
  'objection-handler': { bg: 'bg-rose-950/40', accent: 'text-rose-400', border: 'border-rose-500/30', gradient: 'from-rose-500/20 to-rose-950/40', ring: 'ring-rose-500/30' },
  'social-media': { bg: 'bg-pink-950/40', accent: 'text-pink-400', border: 'border-pink-500/30', gradient: 'from-pink-500/20 to-pink-950/40', ring: 'ring-pink-500/30' },
  'description-writer': { bg: 'bg-violet-950/40', accent: 'text-violet-400', border: 'border-violet-500/30', gradient: 'from-violet-500/20 to-violet-950/40', ring: 'ring-violet-500/30' },
  
  // Documents
  'document-generator': { bg: 'bg-lime-950/40', accent: 'text-lime-400', border: 'border-lime-500/30', gradient: 'from-lime-500/20 to-lime-950/40', ring: 'ring-lime-500/30' },
  'contract-reviewer': { bg: 'bg-red-950/40', accent: 'text-red-400', border: 'border-red-500/30', gradient: 'from-red-500/20 to-red-950/40', ring: 'ring-red-500/30' },
  
  // Productivity / Corporate
  'ai-stamp': { bg: 'bg-amber-950/40', accent: 'text-[#1A1A1A]', border: 'border-amber-500/30', gradient: 'from-amber-500/20 to-amber-950/40', ring: 'ring-amber-500/30' },
  'business-card-designer': { bg: 'bg-[#EFE6D6]/10', accent: 'text-yellow-400', border: 'border-yellow-500/30', gradient: 'from-yellow-500/20 to-amber-950/40', ring: 'ring-yellow-500/30' },
  'logo-maker': { bg: 'bg-purple-950/40', accent: 'text-purple-400', border: 'border-purple-500/30', gradient: 'from-purple-500/20 to-purple-950/40', ring: 'ring-purple-500/30' },
  'cv-builder': { bg: 'bg-emerald-950/40', accent: 'text-emerald-400', border: 'border-emerald-500/30', gradient: 'from-emerald-500/20 to-emerald-950/40', ring: 'ring-emerald-500/30' },
  'cover-letter': { bg: 'bg-sky-950/40', accent: 'text-sky-400', border: 'border-sky-500/30', gradient: 'from-sky-500/20 to-sky-950/40', ring: 'ring-sky-500/30' },
  'company-profile': { bg: 'bg-rose-950/40', accent: 'text-rose-400', border: 'border-rose-500/30', gradient: 'from-rose-500/20 to-rose-950/40', ring: 'ring-rose-500/30' },
  'e-sign': { bg: 'bg-cyan-950/40', accent: 'text-cyan-400', border: 'border-cyan-500/30', gradient: 'from-cyan-500/20 to-cyan-950/40', ring: 'ring-cyan-500/30' },
  'scan-sign': { bg: 'bg-orange-950/40', accent: 'text-orange-400', border: 'border-orange-500/30', gradient: 'from-orange-500/20 to-orange-950/40', ring: 'ring-orange-500/30' },
  'meeting-summarizer': { bg: 'bg-violet-950/40', accent: 'text-violet-400', border: 'border-violet-500/30', gradient: 'from-violet-500/20 to-violet-950/40', ring: 'ring-violet-500/30' },
  'call-summarizer': { bg: 'bg-violet-950/40', accent: 'text-violet-400', border: 'border-violet-500/30', gradient: 'from-violet-500/20 to-violet-950/40', ring: 'ring-violet-500/30' },
  'lead-qualification': { bg: 'bg-purple-950/40', accent: 'text-purple-400', border: 'border-purple-500/30', gradient: 'from-purple-500/20 to-purple-950/40', ring: 'ring-purple-500/30' },
  'followup-scheduler': { bg: 'bg-green-950/40', accent: 'text-green-400', border: 'border-green-500/30', gradient: 'from-green-500/20 to-green-950/40', ring: 'ring-green-500/30' },
  'client-matcher': { bg: 'bg-indigo-950/40', accent: 'text-indigo-400', border: 'border-indigo-500/30', gradient: 'from-indigo-500/20 to-indigo-950/40', ring: 'ring-indigo-500/30' },
  'calendar-notes': { bg: 'bg-cyan-950/40', accent: 'text-cyan-400', border: 'border-cyan-500/30', gradient: 'from-cyan-500/20 to-cyan-950/40', ring: 'ring-cyan-500/30' },
  'video-meet': { bg: 'bg-violet-950/40', accent: 'text-violet-400', border: 'border-violet-500/30', gradient: 'from-violet-500/20 to-violet-950/40', ring: 'ring-violet-500/30' },
  'card-scanner': { bg: 'bg-amber-950/40', accent: 'text-[#1A1A1A]', border: 'border-amber-500/30', gradient: 'from-amber-500/20 to-amber-950/40', ring: 'ring-amber-500/30' },
  
  // Creative Tools
  'interior-design': { bg: 'bg-rose-950/40', accent: 'text-rose-400', border: 'border-rose-500/30', gradient: 'from-rose-500/20 to-rose-950/40', ring: 'ring-rose-500/30' },
  'virtual-staging': { bg: 'bg-fuchsia-950/40', accent: 'text-fuchsia-400', border: 'border-fuchsia-500/30', gradient: 'from-fuchsia-500/20 to-fuchsia-950/40', ring: 'ring-fuchsia-500/30' },
  'video-studio': { bg: 'bg-fuchsia-950/40', accent: 'text-fuchsia-400', border: 'border-fuchsia-500/30', gradient: 'from-fuchsia-500/20 to-fuchsia-950/40', ring: 'ring-fuchsia-500/30' },
  'voice-studio': { bg: 'bg-purple-950/40', accent: 'text-purple-400', border: 'border-purple-500/30', gradient: 'from-purple-500/20 to-purple-950/40', ring: 'ring-purple-500/30' },
  'background-remover': { bg: 'bg-rose-950/40', accent: 'text-rose-400', border: 'border-rose-500/30', gradient: 'from-rose-500/20 to-rose-950/40', ring: 'ring-rose-500/30' },
  'image-resize': { bg: 'bg-teal-950/40', accent: 'text-teal-400', border: 'border-teal-500/30', gradient: 'from-teal-500/20 to-teal-950/40', ring: 'ring-teal-500/30' },
};

// All tool categories for the unified hub
export const ALL_TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: 'property',
    label: 'Property Tools',
    icon: Building2,
    color: 'sky',
    tools: [
      { id: 'property-evaluator', name: 'Property Evaluator', icon: DollarSign, description: 'Comprehensive property value assessment', href: '/property-evaluator' },
      { id: 'property-comparison', name: 'Compare Properties', icon: Layers, description: 'Side-by-side property comparison tool', href: '/compare' },
      { id: 'home-finder', name: 'AI Home Finder', icon: Sparkles, description: 'Find your perfect home with AI matching', href: '/quiz' },
    ],
  },
  {
    id: 'investment',
    label: 'Investment & Finance',
    icon: Calculator,
    color: 'emerald',
    tools: [
      { id: 'mortgage-calculator', name: 'Mortgage Calculator', icon: Calculator, description: 'Calculate mortgage payments and affordability', href: '/mortgage-calculator' },
      { id: 'rental-index', name: 'JBJ Rental Index', icon: BarChart3, description: 'Dubai rental market index and trends', href: '/rental-index' },
    ],
  },
  {
    id: 'listings',
    label: 'Listing Tools',
    icon: Home,
    color: 'amber',
    tools: [
      { id: 'list-property-sale', name: 'List Property for Sale', icon: FileText, description: 'Submit a property for sale', href: '/listing-portal?type=sale' },
      { id: 'list-property-rent', name: 'List Property for Rent', icon: Home, description: 'Submit a property for rent', href: '/listing-portal?type=rent' },
    ],
  },
];

// Section color mappings
export const sectionColors: Record<string, { active: string; inactive: string; border: string }> = {
  sky: { active: 'text-sky-400 bg-sky-500/10', inactive: 'text-[#1A1A1A]/70 hover:text-sky-400', border: 'border-sky-400' },
  emerald: { active: 'text-emerald-400 bg-emerald-500/10', inactive: 'text-[#1A1A1A]/70 hover:text-emerald-400', border: 'border-emerald-400' },
  indigo: { active: 'text-indigo-400 bg-indigo-500/10', inactive: 'text-[#1A1A1A]/70 hover:text-indigo-400', border: 'border-indigo-400' },
  amber: { active: 'text-[#1A1A1A] bg-amber-500/10', inactive: 'text-[#1A1A1A]/70 hover:text-[#1A1A1A]', border: 'border-amber-400' },
  lime: { active: 'text-lime-400 bg-lime-500/10', inactive: 'text-[#1A1A1A]/70 hover:text-lime-400', border: 'border-lime-400' },
  violet: { active: 'text-violet-400 bg-violet-500/10', inactive: 'text-[#1A1A1A]/70 hover:text-violet-400', border: 'border-violet-400' },
  fuchsia: { active: 'text-fuchsia-400 bg-fuchsia-500/10', inactive: 'text-[#1A1A1A]/70 hover:text-fuchsia-400', border: 'border-fuchsia-400' },
};
