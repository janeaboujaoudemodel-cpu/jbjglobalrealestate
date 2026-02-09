/**
 * Real Estate Business Suite - Combined tabbed interface for all 6 AI real estate tools
 * Opens directly into the suite with tabs, no intermediate cards
 */

import React, { lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SEOHead } from '@/components/SEOHead';
import { Building2, TrendingUp, MapPin, Calculator, FileBarChart, BarChart3 } from 'lucide-react';
import { ToolSuiteHeader } from '@/components/toolkit/ToolSuiteHeader';

// Lazy load the REAL existing tool pages
const AIPropertyAnalyzerPage = lazy(() => import('@/pages/AIPropertyAnalyzerPage'));
const AIPricePredictorPage = lazy(() => import('@/pages/AIPricePredictorPage'));
const AINeighborhoodInsightsPage = lazy(() => import('@/pages/AINeighborhoodInsightsPage'));
const AIROICalculatorPage = lazy(() => import('@/pages/AIROICalculatorPage'));
const AIMarketReportPage = lazy(() => import('@/pages/AIMarketReportPage'));
const AICompetitorAnalysisPage = lazy(() => import('@/pages/AICompetitorAnalysisPage'));

const LoadingSpinner = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold"></div>
  </div>
);

const RealEstateSuite = () => {
  return (
    <>
      <SEOHead 
        title="Real Estate Intelligence Suite | JBJ Global"
        description="Complete AI-powered toolkit for property analysis, valuation, and market intelligence."
      />
      
      <div className="min-h-screen bg-black">
        {/* Header with readable back button */}
        <ToolSuiteHeader
          title="Property "
          titleHighlight="Intelligence"
          subtitle="AI-powered property analysis, valuation, and market intelligence"
          icon={Building2}
          backHref="/toolkit"
          backText="Back to Toolkit"
        />

        {/* Tabs - 6 tabs with REAL tools */}
        <Tabs defaultValue="analyzer" className="flex flex-col">
          <div className="border-b border-gold/20 bg-zinc-900/50">
            <div className="max-w-7xl mx-auto px-4">
              <TabsList className="w-full justify-start rounded-none bg-transparent p-0 h-auto gap-0 overflow-x-auto">
                <TabsTrigger
                  value="analyzer"
                  className="relative px-4 md:px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold text-zinc-400 hover:text-white transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <Building2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Property Analyzer</span>
                </TabsTrigger>
                <TabsTrigger
                  value="predictor"
                  className="relative px-4 md:px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold text-zinc-400 hover:text-white transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span className="hidden sm:inline">Price Predictor</span>
                </TabsTrigger>
                <TabsTrigger
                  value="neighborhood"
                  className="relative px-4 md:px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold text-zinc-400 hover:text-white transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <MapPin className="w-4 h-4" />
                  <span className="hidden sm:inline">Neighborhood</span>
                </TabsTrigger>
                <TabsTrigger
                  value="roi"
                  className="relative px-4 md:px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold text-zinc-400 hover:text-white transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <Calculator className="w-4 h-4" />
                  <span className="hidden sm:inline">ROI Calculator</span>
                </TabsTrigger>
                <TabsTrigger
                  value="report"
                  className="relative px-4 md:px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold text-zinc-400 hover:text-white transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <FileBarChart className="w-4 h-4" />
                  <span className="hidden sm:inline">Market Report</span>
                </TabsTrigger>
                <TabsTrigger
                  value="competitor"
                  className="relative px-4 md:px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold text-zinc-400 hover:text-white transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Competitor</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* Tab Content - REAL TOOL PAGES embedded */}
          <div className="flex-1 overflow-auto">
            <TabsContent value="analyzer" className="mt-0">
              <Suspense fallback={<LoadingSpinner />}>
                <AIPropertyAnalyzerPage />
              </Suspense>
            </TabsContent>

            <TabsContent value="predictor" className="mt-0">
              <Suspense fallback={<LoadingSpinner />}>
                <AIPricePredictorPage />
              </Suspense>
            </TabsContent>

            <TabsContent value="neighborhood" className="mt-0">
              <Suspense fallback={<LoadingSpinner />}>
                <AINeighborhoodInsightsPage />
              </Suspense>
            </TabsContent>

            <TabsContent value="roi" className="mt-0">
              <Suspense fallback={<LoadingSpinner />}>
                <AIROICalculatorPage />
              </Suspense>
            </TabsContent>

            <TabsContent value="report" className="mt-0">
              <Suspense fallback={<LoadingSpinner />}>
                <AIMarketReportPage />
              </Suspense>
            </TabsContent>

            <TabsContent value="competitor" className="mt-0">
              <Suspense fallback={<LoadingSpinner />}>
                <AICompetitorAnalysisPage />
              </Suspense>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </>
  );
};

export default RealEstateSuite;
