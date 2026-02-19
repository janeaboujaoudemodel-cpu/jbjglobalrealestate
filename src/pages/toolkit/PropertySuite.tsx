/**
 * Property Intelligence Suite - Embeds REAL existing tool pages
 * Tabs: Home Finder (Quiz) | Evaluator | Compare | Rental Index | Mortgage
 * ONLY real tool pages - no placeholders
 */

import React, { lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SEOHead } from '@/components/SEOHead';
import { Home, Calculator, Layers, BarChart3, DollarSign, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

// Lazy load REAL existing tool PAGES
const Quiz = lazy(() => import('@/pages/Quiz'));
const PropertyEvaluator = lazy(() => import('@/pages/PropertyEvaluator'));
const Compare = lazy(() => import('@/pages/Compare'));
const RentalIndex = lazy(() => import('@/pages/RentalIndex'));
const MortgageCalculatorComponent = lazy(() => import('@/components/MortgageCalculator'));

const LoadingSpinner = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold"></div>
  </div>
);

export default function PropertySuite() {
  return (
    <>
      <SEOHead 
        title="Property Intelligence Suite | JBJ Royal Tools"
        description="AI home finder, property valuations, comparison tools, rental index, and mortgage calculator."
      />
      
      <div className="min-h-screen bg-black">
        {/* Header */}
        <div className="border-b border-gold/20 bg-gradient-to-r from-black via-zinc-900/50 to-black">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center gap-4 mb-4">
              <Link to="/toolkit">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600"
                  style={{ color: '#a1a1aa', backgroundColor: 'transparent' }}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" style={{ color: '#a1a1aa' }} />
                  <span style={{ color: '#a1a1aa' }}>Back to Toolkit</span>
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border-2 border-gold/40 flex items-center justify-center">
                <Home className="w-7 h-7 text-gold" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  Property Intelligence <span className="text-gold">Suite</span>
                </h1>
                <p className="text-zinc-400 text-sm">AI matching, valuations, comparison & market data</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs - 5 tabs with REAL tools */}
        <Tabs defaultValue="finder" className="flex flex-col">
          <div className="border-b border-gold/20 bg-zinc-900/50">
            <div className="max-w-7xl mx-auto px-4">
              <TabsList className="w-full justify-start rounded-none bg-transparent p-0 h-auto gap-0 overflow-x-auto">
                <TabsTrigger
                  value="finder"
                  className="relative px-4 md:px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold text-zinc-400 hover:text-white transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <Home className="w-4 h-4" />
                  <span className="hidden sm:inline">Home Finder</span>
                </TabsTrigger>
                <TabsTrigger
                  value="evaluator"
                  className="relative px-4 md:px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold text-zinc-400 hover:text-white transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <Calculator className="w-4 h-4" />
                  <span className="hidden sm:inline">Evaluator</span>
                </TabsTrigger>
                <TabsTrigger
                  value="compare"
                  className="relative px-4 md:px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold text-zinc-400 hover:text-white transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <Layers className="w-4 h-4" />
                  <span className="hidden sm:inline">Compare</span>
                </TabsTrigger>
                <TabsTrigger
                  value="rental"
                  className="relative px-4 md:px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold text-zinc-400 hover:text-white transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Rental Index</span>
                </TabsTrigger>
                <TabsTrigger
                  value="mortgage"
                  className="relative px-4 md:px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold text-zinc-400 hover:text-white transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <DollarSign className="w-4 h-4" />
                  <span className="hidden sm:inline">Mortgage</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* Tab Content - REAL TOOL PAGES embedded */}
          <div className="flex-1 overflow-auto">
            <TabsContent value="finder" className="mt-0">
              <Suspense fallback={<LoadingSpinner />}>
                <Quiz />
              </Suspense>
            </TabsContent>

            <TabsContent value="evaluator" className="mt-0">
              <Suspense fallback={<LoadingSpinner />}>
                <PropertyEvaluator />
              </Suspense>
            </TabsContent>

            <TabsContent value="compare" className="mt-0">
              <Suspense fallback={<LoadingSpinner />}>
                <Compare />
              </Suspense>
            </TabsContent>

            <TabsContent value="rental" className="mt-0">
              <Suspense fallback={<LoadingSpinner />}>
                <RentalIndex />
              </Suspense>
            </TabsContent>

            <TabsContent value="mortgage" className="mt-0">
              <Suspense fallback={<LoadingSpinner />}>
                <MortgageCalculatorComponent />
              </Suspense>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </>
  );
}
