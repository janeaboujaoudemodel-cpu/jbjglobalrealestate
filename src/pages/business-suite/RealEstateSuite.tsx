/**
 * Real Estate Business Suite - Unified tabbed interface for ALL real estate related AI tools
 * Replaces the original 6-tab suite with comprehensive section-based organization
 */

import React, { lazy, Suspense, useState } from 'react';
import { SEOHead } from '@/components/SEOHead';
import { 
  Building2, TrendingUp, MapPin, Calculator, FileBarChart, BarChart3,
  Home, Mail, Languages, Video, FileText, FileSearch, CalendarDays,
  Palette, Sofa, DollarSign, Users, MessageSquare, Sparkles, Phone,
  CreditCard, Layers
} from 'lucide-react';
import { ToolSuiteHeader } from '@/components/toolkit/ToolSuiteHeader';
import { cn } from '@/lib/utils';

// Lazy load all tool pages
const AIPropertyAnalyzerPage = lazy(() => import('@/pages/AIPropertyAnalyzerPage'));
const AIPricePredictorPage = lazy(() => import('@/pages/AIPricePredictorPage'));
const AINeighborhoodInsightsPage = lazy(() => import('@/pages/AINeighborhoodInsightsPage'));
const AIROICalculatorPage = lazy(() => import('@/pages/AIROICalculatorPage'));
const AIMarketReportPage = lazy(() => import('@/pages/AIMarketReportPage'));
const AICompetitorAnalysisPage = lazy(() => import('@/pages/AICompetitorAnalysisPage'));
const AITranslationHubPage = lazy(() => import('@/pages/AITranslationHubPage'));
const AIDocumentGeneratorPage = lazy(() => import('@/pages/AIDocumentGeneratorPage'));
const AIVideoTourScriptPage = lazy(() => import('@/pages/AIVideoTourScriptPage'));
const AIContractReviewerPage = lazy(() => import('@/pages/AIContractReviewerPage'));
const AIObjectionHandlerPage = lazy(() => import('@/pages/AIObjectionHandlerPage'));
const AIMeetingSummarizerPage = lazy(() => import('@/pages/AIMeetingSummarizerPage'));
const AILeadQualificationPage = lazy(() => import('@/pages/AILeadQualificationPage'));
const AIEmailGeneratorPage = lazy(() => import('@/pages/AIEmailGeneratorPage'));
const AICalendar = lazy(() => import('@/pages/AICalendar'));
const VideoMeeting = lazy(() => import('@/pages/VideoMeeting'));
const BusinessCardScanner = lazy(() => import('@/pages/BusinessCardScanner'));
const MortgageCalculator = lazy(() => import('@/pages/MortgageCalculator'));
const RentalIndex = lazy(() => import('@/pages/RentalIndex'));
const PropertyEvaluator = lazy(() => import('@/pages/PropertyEvaluator'));
const Compare = lazy(() => import('@/pages/Compare'));
const Quiz = lazy(() => import('@/pages/Quiz'));

// Tool sections configuration - Expanded with all real estate tools
const SECTIONS = [
  {
    id: 'analysis',
    label: 'Property Analysis',
    icon: Building2,
    color: 'sky',
    tools: [
      { id: 'analyzer', name: 'Property Analyzer', icon: Building2 },
      { id: 'predictor', name: 'Price Predictor', icon: TrendingUp },
      { id: 'neighborhood', name: 'Neighborhood Insights', icon: MapPin },
      { id: 'evaluator', name: 'Property Evaluator', icon: DollarSign },
      { id: 'compare', name: 'Property Comparison', icon: Layers },
      { id: 'quiz', name: 'AI Home Finder', icon: Sparkles },
    ],
  },
  {
    id: 'investment',
    label: 'Investment',
    icon: Calculator,
    color: 'emerald',
    tools: [
      { id: 'roi', name: 'ROI Calculator', icon: Calculator },
      { id: 'mortgage', name: 'Mortgage Calculator', icon: Calculator },
      { id: 'rental-index', name: 'Rental Index', icon: BarChart3 },
    ],
  },
  {
    id: 'market',
    label: 'Market Intelligence',
    icon: BarChart3,
    color: 'indigo',
    tools: [
      { id: 'report', name: 'Market Report', icon: FileBarChart },
      { id: 'competitor', name: 'Competitor Analysis', icon: BarChart3 },
    ],
  },
  {
    id: 'communication',
    label: 'Communication',
    icon: MessageSquare,
    color: 'amber',
    tools: [
      { id: 'email', name: 'Email Generator', icon: Mail },
      { id: 'translation', name: 'Translation Hub', icon: Languages },
      { id: 'video-script', name: 'Video Tour Script', icon: Video },
      { id: 'objection', name: 'Objection Handler', icon: MessageSquare },
    ],
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: FileText,
    color: 'lime',
    tools: [
      { id: 'document', name: 'Document Generator', icon: FileText },
      { id: 'contract', name: 'Contract Reviewer', icon: FileSearch },
    ],
  },
  {
    id: 'productivity',
    label: 'Productivity',
    icon: CalendarDays,
    color: 'violet',
    tools: [
      { id: 'meeting', name: 'Meeting Summarizer', icon: CalendarDays },
      { id: 'lead', name: 'Lead Qualification', icon: Users },
      { id: 'calendar', name: 'Calendar & Notes', icon: CalendarDays },
      { id: 'video-meet', name: 'Video Meet', icon: Video },
      { id: 'card-scanner', name: 'Business Card Scanner', icon: CreditCard },
    ],
  },
];

// Color mappings for section tabs
const sectionColors: Record<string, { active: string; inactive: string; border: string }> = {
  sky: { active: 'text-sky-400 bg-sky-500/10', inactive: 'text-zinc-400 hover:text-sky-400', border: 'border-sky-400' },
  emerald: { active: 'text-emerald-400 bg-emerald-500/10', inactive: 'text-zinc-400 hover:text-emerald-400', border: 'border-emerald-400' },
  indigo: { active: 'text-indigo-400 bg-indigo-500/10', inactive: 'text-zinc-400 hover:text-indigo-400', border: 'border-indigo-400' },
  amber: { active: 'text-amber-400 bg-amber-500/10', inactive: 'text-zinc-400 hover:text-amber-400', border: 'border-amber-400' },
  lime: { active: 'text-lime-400 bg-lime-500/10', inactive: 'text-zinc-400 hover:text-lime-400', border: 'border-lime-400' },
  violet: { active: 'text-violet-400 bg-violet-500/10', inactive: 'text-zinc-400 hover:text-violet-400', border: 'border-violet-400' },
  fuchsia: { active: 'text-fuchsia-400 bg-fuchsia-500/10', inactive: 'text-zinc-400 hover:text-fuchsia-400', border: 'border-fuchsia-400' },
};

const LoadingSpinner = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold"></div>
  </div>
);

// Map tool IDs to their respective page components
const toolComponents: Record<string, React.LazyExoticComponent<any>> = {
  analyzer: AIPropertyAnalyzerPage,
  predictor: AIPricePredictorPage,
  neighborhood: AINeighborhoodInsightsPage,
  roi: AIROICalculatorPage,
  report: AIMarketReportPage,
  competitor: AICompetitorAnalysisPage,
  translation: AITranslationHubPage,
  document: AIDocumentGeneratorPage,
  'video-script': AIVideoTourScriptPage,
  contract: AIContractReviewerPage,
  objection: AIObjectionHandlerPage,
  meeting: AIMeetingSummarizerPage,
  lead: AILeadQualificationPage,
  email: AIEmailGeneratorPage,
  calendar: AICalendar,
  'video-meet': VideoMeeting,
  'card-scanner': BusinessCardScanner,
  mortgage: MortgageCalculator,
  'rental-index': RentalIndex,
  evaluator: PropertyEvaluator,
  compare: Compare,
  quiz: Quiz,
};

const RealEstateSuite = () => {
  const [activeSection, setActiveSection] = useState('analysis');
  const [activeTool, setActiveTool] = useState('analyzer');

  const currentSection = SECTIONS.find(s => s.id === activeSection) || SECTIONS[0];
  const currentColors = sectionColors[currentSection.color] || sectionColors.sky;
  const ToolComponent = toolComponents[activeTool];

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    const section = SECTIONS.find(s => s.id === sectionId);
    if (section && section.tools.length > 0) {
      setActiveTool(section.tools[0].id);
    }
  };

  return (
    <>
      <SEOHead 
        title="Real Estate Intelligence Suite | JBJ Global"
        description="Complete AI-powered toolkit for property analysis, valuation, market intelligence, and real estate productivity."
      />
      
      <div className="min-h-screen bg-black">
        {/* Header */}
        <ToolSuiteHeader
          title="Real Estate "
          titleHighlight="Intelligence Suite"
          subtitle="Complete AI-powered toolkit for property professionals"
          icon={Building2}
          backHref="/toolkit"
          backText="Back to Toolkit"
        />

        {/* Section Tabs - Horizontal Pills */}
        <div className="sticky top-0 z-40 bg-zinc-900/95 backdrop-blur-sm border-b border-gold/20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex gap-1 py-3 overflow-x-auto scrollbar-hide">
              {SECTIONS.map((section) => {
                const Icon = section.icon;
                const colors = sectionColors[section.color];
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => handleSectionChange(section.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                      isActive
                        ? `${colors.active} border ${colors.border}`
                        : `${colors.inactive} border border-transparent hover:border-zinc-700`
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{section.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tool Selector - Sub-tabs within section */}
        <div className="bg-zinc-950 border-b border-zinc-800">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex gap-2 py-3 overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
              {currentSection.tools.map((tool) => {
                const Icon = tool.icon;
                const isActive = activeTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all whitespace-nowrap min-w-fit",
                      isActive
                        ? `${currentColors.active} border ${currentColors.border}`
                        : "text-zinc-500 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-700"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {tool.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tool Content - Lazy loaded */}
        <div className="flex-1">
          <Suspense fallback={<LoadingSpinner />}>
            {ToolComponent && <ToolComponent />}
          </Suspense>
        </div>
      </div>
    </>
  );
};

export default RealEstateSuite;
