/**
 * JBJ Royal Tools Hub - Central Registry
 * Single source of truth for all tools across Header, Footer, and Hub page
 */

import { 
  Video, Mic, FileText, FileImage, Languages, Wand2, Sparkles, Play,
  Calculator, Brain, Palette, Scale, BarChart3, Users, Mail, FileSignature,
  Camera, Ruler, Calendar, PenTool, Building2, TrendingUp, Globe, Target,
  MessageSquare, Layers, Map, ClipboardList, Shield, Briefcase, ScanLine,
  Home, DollarSign, Lightbulb, AreaChart, Bot, Presentation, Table2, Video as VideoIcon
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ToolStatus = 'active' | 'coming-soon' | 'beta';
export type ToolCategory = 'media' | 'ai-property' | 'ai-sales' | 'ai-reports' | 'ai-communication' | 'ai-content' | 'productivity' | 'creative';

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  href: string;
  icon: LucideIcon;
  category: ToolCategory;
  status: ToolStatus;
  tags: string[];
  isNew?: boolean;
  isFlagship?: boolean;
}

// ============ MEDIA TOOLS (Toolkit) ============
export const mediaTools: ToolDefinition[] = [
  {
    id: 'ai-video-studio',
    name: 'Creative Video Suite',
    description: 'Professional CapCut-style video editor with multi-track timeline, AI captions, voiceover, effects, and smart reframing.',
    href: '/toolkit/ai-video-studio',
    icon: Play,
    category: 'media',
    status: 'active',
    tags: ['Video', 'AI', 'Captions', 'Effects'],
  },
  {
    id: 'video-resize-pack',
    name: 'Video Resize + Smart Reframe',
    description: 'Resize videos for any social platform with AI-powered per-shot subject tracking and smart cropping.',
    href: '/toolkit/video-resize-pack',
    icon: Video,
    category: 'media',
    status: 'active',
    tags: ['Video', 'Resize', 'AI Reframe'],
  },
  {
    id: 'voice-studio',
    name: 'Voice Studio',
    description: 'AI voice generation, text-to-speech with multiple voices, accents, and languages.',
    href: '/toolkit/voice-studio',
    icon: Mic,
    category: 'media',
    status: 'active',
    tags: ['Audio', 'TTS', 'AI Voice'],
  },
  {
    id: 'pdf-from-photos',
    name: 'Photo → PDF Generator',
    description: 'Convert multiple photos to a professional PDF with custom layouts, page sizes, and title pages.',
    href: '/toolkit/pdf-from-photos',
    icon: FileText,
    category: 'media',
    status: 'active',
    tags: ['PDF', 'Photos', 'Documents'],
  },
  {
    id: 'image-resize',
    name: 'Image Resizer + Social Sizes',
    description: 'Resize images for Instagram, Facebook, LinkedIn, and more with preset dimensions and batch export.',
    href: '/toolkit/image-resize',
    icon: FileImage,
    category: 'media',
    status: 'active',
    tags: ['Images', 'Social Media', 'Batch'],
  },
  {
    id: 'captions-translate',
    name: 'Captions & Translation',
    description: 'Auto-transcribe video audio and translate captions to 100+ languages with RTL support.',
    href: '/toolkit/captions-translate',
    icon: Languages,
    category: 'media',
    status: 'active',
    tags: ['Captions', 'Translate', 'Subtitles'],
  },
  {
    id: 'background-ai',
    name: 'AI Background Remover',
    description: 'Remove or replace backgrounds from photos instantly using AI. Perfect for property listings.',
    href: '/toolkit/background-ai',
    icon: Wand2,
    category: 'media',
    status: 'active',
    tags: ['AI', 'Background', 'Photos'],
  },
  {
    id: 'beauty-filters',
    name: 'Beauty Filters',
    description: 'Apply professional beauty enhancements and filters to your photos for listings and marketing.',
    href: '/toolkit/beauty-filters',
    icon: Sparkles,
    category: 'media',
    status: 'active',
    tags: ['Filters', 'Enhancement', 'Photos'],
  },
];

// ============ CREATIVE SUITE ============
export const creativeTools: ToolDefinition[] = [
  {
    id: 'creative-suite',
    name: 'Creative Suite™',
    description: 'Full-featured creative studio for video projects, marketing packs, and property presentations.',
    href: '/studio',
    icon: Sparkles,
    category: 'creative',
    status: 'active',
    tags: ['Studio', 'Video', 'Projects'],
  },
];

// ============ AI PROPERTY TOOLS ============
export const aiPropertyTools: ToolDefinition[] = [
  {
    id: 'ai-home-finder',
    name: 'AI Home Finder',
    description: 'AI-powered quiz to find your perfect property match based on your preferences.',
    href: '/quiz',
    icon: Home,
    category: 'ai-property',
    status: 'active',
    tags: ['AI', 'Search', 'Quiz'],
  },
  {
    id: 'property-comparison',
    name: 'Property Comparison',
    description: 'Compare multiple properties side-by-side with detailed analytics.',
    href: '/compare',
    icon: Layers,
    category: 'ai-property',
    status: 'active',
    tags: ['Compare', 'Analytics'],
  },
  {
    id: 'property-evaluator',
    name: 'JBJ Property Evaluator',
    description: 'Get instant property valuations powered by market data and AI.',
    href: '/property-evaluator',
    icon: Calculator,
    category: 'ai-property',
    status: 'active',
    tags: ['Valuation', 'AI'],
  },
  {
    id: 'rental-index',
    name: 'JBJ Rental Index',
    description: 'Dubai rental market index with real-time pricing data.',
    href: '/rental-index',
    icon: BarChart3,
    category: 'ai-property',
    status: 'active',
    tags: ['Rental', 'Index'],
  },
  {
    id: 'mortgage-calculator',
    name: 'Mortgage Calculator',
    description: 'Calculate mortgage payments, affordability, and compare rates.',
    href: '/mortgage-calculator',
    icon: DollarSign,
    category: 'ai-property',
    status: 'active',
    tags: ['Mortgage', 'Calculator'],
  },
  {
    id: 'interior-design-ai',
    name: 'AI Interior Design',
    description: 'AI-powered interior design suggestions for any space.',
    href: '/interior-design-ai',
    icon: Palette,
    category: 'ai-property',
    status: 'active',
    tags: ['Interior', 'Design', 'AI'],
  },
  {
    id: 'virtual-staging-ai',
    name: 'AI Virtual Staging',
    description: 'Virtually stage empty properties with AI-generated furniture.',
    href: '/virtual-staging-ai',
    icon: Building2,
    category: 'ai-property',
    status: 'active',
    tags: ['Staging', 'AI'],
  },
];

// ============ AI SALES & CRM TOOLS ============
export const aiSalesTools: ToolDefinition[] = [
  {
    id: 'ai-lead-qualification',
    name: 'AI Lead Qualification',
    description: 'Automatically qualify and score leads using AI analysis.',
    href: '/ai-lead-qualification',
    icon: Target,
    category: 'ai-sales',
    status: 'active',
    tags: ['Leads', 'AI', 'CRM'],
  },
  {
    id: 'ai-followup-scheduler',
    name: 'AI Follow-up Scheduler',
    description: 'Smart follow-up scheduling based on lead behavior.',
    href: '/ai-followup-scheduler',
    icon: Calendar,
    category: 'ai-sales',
    status: 'active',
    tags: ['Follow-up', 'Schedule', 'AI'],
  },
  {
    id: 'ai-objection-handler',
    name: 'AI Objection Handler',
    description: 'Get AI-suggested responses to common objections.',
    href: '/ai-objection-handler',
    icon: MessageSquare,
    category: 'ai-sales',
    status: 'active',
    tags: ['Sales', 'AI'],
  },
  {
    id: 'ai-client-matcher',
    name: 'AI Client Matcher',
    description: 'Match clients to properties using AI preferences analysis.',
    href: '/ai-client-matcher',
    icon: Users,
    category: 'ai-sales',
    status: 'active',
    tags: ['Matching', 'AI'],
  },
];

// ============ AI REPORTS & INVESTMENT ============
export const aiReportTools: ToolDefinition[] = [
  {
    id: 'ai-market-report',
    name: 'AI Market Report',
    description: 'Generate comprehensive market reports with AI analysis.',
    href: '/ai-market-report',
    icon: AreaChart,
    category: 'ai-reports',
    status: 'active',
    tags: ['Market', 'Reports', 'AI'],
  },
  {
    id: 'ai-competitor-analysis',
    name: 'AI Competitor Analysis',
    description: 'Analyze competitor listings and pricing strategies.',
    href: '/ai-competitor-analysis',
    icon: TrendingUp,
    category: 'ai-reports',
    status: 'active',
    tags: ['Competitor', 'Analysis', 'AI'],
  },
  {
    id: 'ai-roi-calculator',
    name: 'AI ROI Calculator',
    description: 'Calculate investment returns with AI market predictions.',
    href: '/ai-roi-calculator',
    icon: Calculator,
    category: 'ai-reports',
    status: 'active',
    tags: ['ROI', 'Investment', 'AI'],
  },
  {
    id: 'ai-investment-report',
    name: 'AI Investment Report',
    description: 'Generate detailed investment analysis reports.',
    href: '/ai-investment-report',
    icon: FileText,
    category: 'ai-reports',
    status: 'active',
    tags: ['Investment', 'Reports', 'AI'],
  },
];

// ============ AI COMMUNICATION ============
export const aiCommunicationTools: ToolDefinition[] = [
  {
    id: 'ai-meeting-summarizer',
    name: 'AI Meeting Summarizer',
    description: 'Automatically summarize meetings and extract action items.',
    href: '/ai-meeting-summarizer',
    icon: ClipboardList,
    category: 'ai-communication',
    status: 'active',
    tags: ['Meeting', 'Summary', 'AI'],
  },
  {
    id: 'ai-translation-hub',
    name: 'AI Translation Hub',
    description: 'Translate communications to any language instantly.',
    href: '/ai-translation-hub',
    icon: Globe,
    category: 'ai-communication',
    status: 'active',
    tags: ['Translation', 'AI'],
  },
  {
    id: 'ai-video-tour-script',
    name: 'AI Video Tour Script',
    description: 'Generate professional video tour scripts for properties.',
    href: '/ai-video-tour-script',
    icon: VideoIcon,
    category: 'ai-communication',
    status: 'active',
    tags: ['Video', 'Script', 'AI'],
  },
  {
    id: 'ai-email-generator',
    name: 'AI Email Generator',
    description: 'Generate professional emails for any occasion.',
    href: '/ai-email-generator',
    icon: Mail,
    category: 'ai-communication',
    status: 'active',
    tags: ['Email', 'AI'],
  },
];

// ============ AI CONTENT ============
export const aiContentTools: ToolDefinition[] = [
  {
    id: 'ai-social-media',
    name: 'AI Social Media',
    description: 'Generate engaging social media content for properties.',
    href: '/ai-social-media',
    icon: PenTool,
    category: 'ai-content',
    status: 'active',
    tags: ['Social', 'Content', 'AI'],
  },
  {
    id: 'ai-description-writer',
    name: 'AI Description Writer',
    description: 'Write compelling property descriptions automatically.',
    href: '/ai-description-writer',
    icon: FileText,
    category: 'ai-content',
    status: 'active',
    tags: ['Description', 'AI'],
  },
  {
    id: 'ai-contract-reviewer',
    name: 'AI Contract Reviewer',
    description: 'Review contracts and highlight important clauses.',
    href: '/ai-contract-reviewer',
    icon: Scale,
    category: 'ai-content',
    status: 'active',
    tags: ['Contract', 'Legal', 'AI'],
  },
  {
    id: 'ai-document-generator',
    name: 'AI Document Generator',
    description: 'Generate professional documents from templates.',
    href: '/ai-document-generator',
    icon: FileSignature,
    category: 'ai-content',
    status: 'active',
    tags: ['Document', 'AI'],
  },
];

// ============ PRODUCTIVITY TOOLS ============
export const productivityTools: ToolDefinition[] = [
  {
    id: 'stamp-generator',
    name: 'Company Stamp Generator',
    description: 'Create professional company seals and office stamps. Export SVG, PNG, JPG & PDF in multiple sizes.',
    href: '/toolkit/stamp-generator',
    icon: Shield,
    category: 'productivity',
    status: 'active',
    tags: ['Stamp', 'Branding', 'Export'],
    isNew: true,
  },
  {
    id: 'scan-sign',
    name: 'Scan & Sign Documents',
    description: 'Camera-based document scanning with digital signature overlay and AI auto-enhance. Export to PDF.',
    href: '/toolkit/scan-sign',
    icon: ScanLine,
    category: 'productivity',
    status: 'active',
    tags: ['Scanner', 'Signature', 'PDF', 'DocuSign'],
  },
  {
    id: 'business-card-scanner',
    name: 'Business Card Scanner',
    description: 'Scan and digitize business cards instantly.',
    href: '/business-card-scanner',
    icon: ScanLine,
    category: 'productivity',
    status: 'active',
    tags: ['Scanner', 'Cards'],
  },
  {
    id: 'documents',
    name: 'Documents & Spreadsheets',
    description: 'Create and manage documents and spreadsheets.',
    href: '/documents',
    icon: Table2,
    category: 'productivity',
    status: 'active',
    tags: ['Documents', 'Spreadsheets'],
  },
  {
    id: 'video-meeting',
    name: 'Video Meet',
    description: 'Host video meetings with clients and team.',
    href: '/video-meeting',
    icon: VideoIcon,
    category: 'productivity',
    status: 'active',
    tags: ['Video', 'Meeting'],
  },
  {
    id: 'ai-calendar',
    name: 'Calendar & Notes',
    description: 'Manage your schedule and notes with AI assistance.',
    href: '/ai-calendar',
    icon: Calendar,
    category: 'productivity',
    status: 'active',
    tags: ['Calendar', 'Notes'],
  },
];

// ============ AGGREGATED EXPORTS ============
export const allTools: ToolDefinition[] = [
  ...mediaTools,
  ...creativeTools,
  ...aiPropertyTools,
  ...aiSalesTools,
  ...aiReportTools,
  ...aiCommunicationTools,
  ...aiContentTools,
  ...productivityTools,
];

export const activeTools = allTools.filter(t => t.status === 'active');
export const comingSoonTools = allTools.filter(t => t.status === 'coming-soon');

export const toolsByCategory = {
  media: mediaTools,
  creative: creativeTools,
  'ai-property': aiPropertyTools,
  'ai-sales': aiSalesTools,
  'ai-reports': aiReportTools,
  'ai-communication': aiCommunicationTools,
  'ai-content': aiContentTools,
  productivity: productivityTools,
};

export const categoryLabels: Record<ToolCategory, string> = {
  media: 'Media Tools',
  creative: 'Creative Suite',
  'ai-property': 'AI Property Tools',
  'ai-sales': 'AI Sales & CRM',
  'ai-reports': 'AI Reports & Investment',
  'ai-communication': 'AI Communication',
  'ai-content': 'AI Content',
  productivity: 'Productivity',
};
