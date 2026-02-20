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
  'mortgage-calculator': { bg: 'bg-amber-950/40', accent: 'text-amber-400', border: 'border-amber-500/30', gradient: 'from-amber-500/20 to-amber-950/40', ring: 'ring-amber-500/30' },
  'rental-index': { bg: 'bg-emerald-950/40', accent: 'text-emerald-400', border: 'border-emerald-500/30', gradient: 'from-emerald-500/20 to-emerald-950/40', ring: 'ring-emerald-500/30' },
  'investment-report': { bg: 'bg-green-950/40', accent: 'text-green-400', border: 'border-green-500/30', gradient: 'from-green-500/20 to-green-950/40', ring: 'ring-green-500/30' },
  
  // Market Intelligence
  'market-report': { bg: 'bg-cyan-950/40', accent: 'text-cyan-400', border: 'border-cyan-500/30', gradient: 'from-cyan-500/20 to-cyan-950/40', ring: 'ring-cyan-500/30' },
  'competitor-analysis': { bg: 'bg-orange-950/40', accent: 'text-orange-400', border: 'border-orange-500/30', gradient: 'from-orange-500/20 to-orange-950/40', ring: 'ring-orange-500/30' },
  
  // Communication
  'email-generator': { bg: 'bg-teal-950/40', accent: 'text-teal-400', border: 'border-teal-500/30', gradient: 'from-teal-500/20 to-teal-950/40', ring: 'ring-teal-500/30' },
  'translation-hub': { bg: 'bg-amber-950/40', accent: 'text-amber-400', border: 'border-amber-500/30', gradient: 'from-amber-500/20 to-amber-950/40', ring: 'ring-amber-500/30' },
  'video-tour-script': { bg: 'bg-pink-950/40', accent: 'text-pink-400', border: 'border-pink-500/30', gradient: 'from-pink-500/20 to-pink-950/40', ring: 'ring-pink-500/30' },
  'objection-handler': { bg: 'bg-rose-950/40', accent: 'text-rose-400', border: 'border-rose-500/30', gradient: 'from-rose-500/20 to-rose-950/40', ring: 'ring-rose-500/30' },
  'social-media': { bg: 'bg-pink-950/40', accent: 'text-pink-400', border: 'border-pink-500/30', gradient: 'from-pink-500/20 to-pink-950/40', ring: 'ring-pink-500/30' },
  'description-writer': { bg: 'bg-violet-950/40', accent: 'text-violet-400', border: 'border-violet-500/30', gradient: 'from-violet-500/20 to-violet-950/40', ring: 'ring-violet-500/30' },
  
  // Documents
  'document-generator': { bg: 'bg-lime-950/40', accent: 'text-lime-400', border: 'border-lime-500/30', gradient: 'from-lime-500/20 to-lime-950/40', ring: 'ring-lime-500/30' },
  'contract-reviewer': { bg: 'bg-red-950/40', accent: 'text-red-400', border: 'border-red-500/30', gradient: 'from-red-500/20 to-red-950/40', ring: 'ring-red-500/30' },
  
  // Productivity / Corporate
  'ai-stamp': { bg: 'bg-amber-950/40', accent: 'text-amber-400', border: 'border-amber-500/30', gradient: 'from-amber-500/20 to-amber-950/40', ring: 'ring-amber-500/30' },
  'business-card-designer': { bg: 'bg-gold/10', accent: 'text-yellow-400', border: 'border-yellow-500/30', gradient: 'from-yellow-500/20 to-amber-950/40', ring: 'ring-yellow-500/30' },
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
  'card-scanner': { bg: 'bg-amber-950/40', accent: 'text-amber-400', border: 'border-amber-500/30', gradient: 'from-amber-500/20 to-amber-950/40', ring: 'ring-amber-500/30' },
  
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
    label: 'Property & Valuation',
    icon: Building2,
    color: 'sky',
    tools: [
      { id: 'property-analyzer', name: 'Property Analyzer', icon: Building2, description: 'Deep analysis of property features and investment potential', href: '/ai-property-analyzer' },
      { id: 'price-predictor', name: 'Price Predictor', icon: TrendingUp, description: 'AI-powered price predictions and market trends', href: '/ai-price-predictor' },
      { id: 'neighborhood-insights', name: 'Neighborhood Insights', icon: MapPin, description: 'Detailed area analysis and local market data', href: '/ai-neighborhood-insights' },
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
      { id: 'roi-calculator', name: 'ROI Calculator', icon: Calculator, description: 'Calculate investment returns and projections', href: '/ai-roi-calculator' },
      { id: 'mortgage-calculator', name: 'Mortgage Calculator', icon: Calculator, description: 'Calculate mortgage payments and affordability', href: '/mortgage-calculator' },
      { id: 'rental-index', name: 'JBJ Rental Index', icon: BarChart3, description: 'Dubai rental market index and trends', href: '/rental-index' },
      { id: 'investment-report', name: 'Investment Report', icon: FileBarChart, description: 'Generate detailed investment analysis reports', href: '/ai-investment-report' },
    ],
  },
  {
    id: 'market',
    label: 'Market Intelligence',
    icon: BarChart3,
    color: 'indigo',
    tools: [
      { id: 'market-report', name: 'Market Report', icon: FileBarChart, description: 'Comprehensive market analysis reports', href: '/ai-market-report' },
      { id: 'competitor-analysis', name: 'Competitor Analysis', icon: BarChart3, description: 'Analyze competitor properties and pricing', href: '/ai-competitor-analysis' },
    ],
  },
  {
    id: 'communication',
    label: 'Communication',
    icon: MessageSquare,
    color: 'amber',
    tools: [
      { id: 'email-generator', name: 'Email Generator', icon: Mail, description: 'Create professional follow-up and marketing emails', href: '/ai-email-generator' },
      { id: 'translation-hub', name: 'Translation Hub', icon: Languages, description: 'Translate content into multiple languages', href: '/ai-translation-hub' },
      { id: 'video-tour-script', name: 'Video Tour Script', icon: Video, description: 'Generate engaging property tour scripts', href: '/ai-video-tour-script' },
      { id: 'objection-handler', name: 'Objection Handler', icon: MessageSquare, description: 'Get expert responses to buyer objections', href: '/ai-objection-handler' },
      { id: 'social-media', name: 'Social Media', icon: Share2, description: 'Generate social media posts for listings', href: '/ai-social-media' },
      { id: 'description-writer', name: 'Description Writer', icon: PenTool, description: 'Create compelling property descriptions', href: '/ai-description-writer' },
    ],
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: FileText,
    color: 'lime',
    tools: [
      { id: 'document-generator', name: 'Document Generator', icon: FileText, description: 'Generate professional real estate documents', href: '/ai-document-generator' },
      { id: 'contract-reviewer', name: 'Contract Reviewer', icon: FileSearch, description: 'Review contracts and highlight key terms', href: '/ai-contract-reviewer' },
    ],
  },
  {
    id: 'productivity',
    label: 'Productivity',
    icon: CalendarDays,
    color: 'violet',
    tools: [
      { id: 'ai-stamp', name: 'AI Stamp Generator', icon: Stamp, description: 'Create bilingual professional company stamps and seals', href: '/toolkit/stamp-generator' },
      { id: 'business-card-designer', name: 'Business Card Designer', icon: CreditCard, description: 'Design premium digital and print-ready business cards', href: '/toolkit/corporate-suite/business-card' },
      { id: 'logo-maker', name: 'Logo Maker', icon: Palette, description: 'Generate AI-powered company logos with custom branding', href: '/toolkit/corporate-suite/logo' },
      { id: 'cv-builder', name: 'Resume Builder', icon: FileText, description: 'Build professional CVs with 12 international templates', href: '/toolkit/corporate-suite/cv-builder' },
      { id: 'cover-letter', name: 'Cover Letter Generator', icon: Pen, description: 'AI-crafted cover letters tailored to any role', href: '/toolkit/corporate-suite/cover-letter' },
      { id: 'company-profile', name: 'Company Profile', icon: Award, description: 'Create multi-page A4 company profiles with AI', href: '/toolkit/corporate-suite/company-profile' },
      { id: 'e-sign', name: 'JBJ E-Sign', icon: Globe, description: 'Professional contract signing with multi-signer support', href: '/e-signature' },
      { id: 'scan-sign', name: 'Scan & Sign', icon: Image, description: 'Scan documents, add signature, export as PDF', href: '/toolkit/scan-sign' },
      { id: 'meeting-summarizer', name: 'Meeting Summarizer', icon: FileAudio, description: 'Summarize meetings and extract action items', href: '/ai-meeting-summarizer' },
      { id: 'call-summarizer', name: 'Call Summarizer', icon: Phone, description: 'Summarize call recordings and notes', href: '/ai-call-summarizer' },
      { id: 'lead-qualification', name: 'Lead Qualification', icon: Target, description: 'Automatically qualify and score leads', href: '/ai-lead-qualification' },
      { id: 'followup-scheduler', name: 'Follow-up Scheduler', icon: CalendarDays, description: 'Smart scheduling for lead follow-ups', href: '/ai-follow-up-scheduler' },
      { id: 'client-matcher', name: 'Client Matcher', icon: Users, description: 'Match clients with ideal properties', href: '/ai-client-matcher' },
      { id: 'calendar-notes', name: 'Calendar & Notes', icon: CalendarDays, description: 'Manage schedule and notes with AI', href: '/ai-calendar' },
      { id: 'video-meet', name: 'Video Meet', icon: Video, description: 'Professional video meetings', href: '/video-meeting' },
      { id: 'card-scanner', name: 'Business Card Scanner', icon: CreditCard, description: 'Scan and digitize business cards', href: '/business-card-scanner' },
    ],
  },
  {
    id: 'creative',
    label: 'Creative & Design',
    icon: Palette,
    color: 'fuchsia',
    tools: [
      { id: 'interior-design', name: 'Interior Design AI', icon: Palette, description: 'AI-powered interior design suggestions', href: '/interior-design-ai' },
      { id: 'virtual-staging', name: 'Virtual Staging', icon: Wand2, description: 'Stage empty rooms with AI furniture', href: '/virtual-staging-ai' },
      { id: 'video-studio', name: 'AI Video Studio', icon: Video, description: 'Create professional property videos', href: '/toolkit/ai-video-studio' },
      { id: 'voice-studio', name: 'Voice Studio', icon: Mic, description: 'AI voice generation for tours', href: '/toolkit/voice-studio' },
      { id: 'background-remover', name: 'Background Remover', icon: Scissors, description: 'Remove backgrounds from photos', href: '/toolkit/background-ai' },
      { id: 'image-resize', name: 'Image Resizer', icon: Image, description: 'Resize images for any platform', href: '/toolkit/image-resize' },
    ],
  },
];

// Section color mappings
export const sectionColors: Record<string, { active: string; inactive: string; border: string }> = {
  sky: { active: 'text-sky-400 bg-sky-500/10', inactive: 'text-zinc-400 hover:text-sky-400', border: 'border-sky-400' },
  emerald: { active: 'text-emerald-400 bg-emerald-500/10', inactive: 'text-zinc-400 hover:text-emerald-400', border: 'border-emerald-400' },
  indigo: { active: 'text-indigo-400 bg-indigo-500/10', inactive: 'text-zinc-400 hover:text-indigo-400', border: 'border-indigo-400' },
  amber: { active: 'text-amber-400 bg-amber-500/10', inactive: 'text-zinc-400 hover:text-amber-400', border: 'border-amber-400' },
  lime: { active: 'text-lime-400 bg-lime-500/10', inactive: 'text-zinc-400 hover:text-lime-400', border: 'border-lime-400' },
  violet: { active: 'text-violet-400 bg-violet-500/10', inactive: 'text-zinc-400 hover:text-violet-400', border: 'border-violet-400' },
  fuchsia: { active: 'text-fuchsia-400 bg-fuchsia-500/10', inactive: 'text-zinc-400 hover:text-fuchsia-400', border: 'border-fuchsia-400' },
};
