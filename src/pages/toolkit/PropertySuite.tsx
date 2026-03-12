/**
 * Property Intelligence Suite — Premium Champagne-Gold with Color-Coded Tabs
 */

import React, { lazy, Suspense, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SEOHead } from '@/components/SEOHead';
import { Home, Calculator, Layers, BarChart3, DollarSign, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const Quiz = lazy(() => import('@/pages/Quiz'));
const PropertyEvaluator = lazy(() => import('@/pages/PropertyEvaluator'));
const Compare = lazy(() => import('@/pages/Compare'));
const RentalIndex = lazy(() => import('@/pages/RentalIndex'));
const MortgageCalculatorComponent = lazy(() => import('@/components/MortgageCalculator'));

const LoadingSpinner = () => (
  <div className="min-h-[50vh] flex items-center justify-center" style={{ background: "linear-gradient(180deg, #FDFBF7 0%, #F5EFE3 100%)" }}>
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="h-7 w-7 animate-spin" style={{ color: "#B8943E" }} />
      <p className="text-xs" style={{ color: "rgba(0,0,0,0.35)" }}>Loading tool...</p>
    </div>
  </div>
);

const tabs = [
  { value: "finder", label: "AI Home Finder", shortLabel: "Finder", icon: Home, color: "#8B5CF6" },
  { value: "evaluator", label: "Evaluator", shortLabel: "Eval", icon: Calculator, color: "#3B82F6" },
  { value: "compare", label: "Compare", shortLabel: "Compare", icon: Layers, color: "#EF4444" },
  { value: "rental", label: "Rental Index", shortLabel: "Rental", icon: BarChart3, color: "#22C55E" },
  { value: "mortgage", label: "Mortgage", shortLabel: "Mortgage", icon: DollarSign, color: "#F59E0B" },
];

export default function PropertySuite() {
  const [activeTab, setActiveTab] = useState("finder");
  const activeColor = tabs.find(t => t.value === activeTab)?.color || "#B8943E";

  return (
    <>
      <SEOHead 
        title="Property Intelligence Suite | JBJ Royal Tools"
        description="AI home finder, property valuations, comparison tools, rental index, and mortgage calculator."
      />
      
      <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #FDFBF7 0%, #EDE4D3 100%)" }}>
        {/* ── Suite Header ── */}
        <div style={{ background: "linear-gradient(180deg, #F5EBD7 0%, #EDE4D3 100%)", borderBottom: "1px solid rgba(184,148,62,0.25)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-0">
            {/* Back link */}
            <Link to="/toolkit"
              className="inline-flex items-center gap-1.5 text-xs mb-4 transition-colors group"
              style={{ color: "rgba(0,0,0,0.4)" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "rgba(0,0,0,0.75)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(0,0,0,0.4)"}>
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Back to Royal Tools Hub
            </Link>

            {/* Title row */}
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, #F5EBD7, #D4C4A8)", border: "1px solid rgba(184,148,62,0.4)", boxShadow: "0 0 30px rgba(184,148,62,0.15)" }}>
                <Home className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: "#B8943E" }} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight" style={{ color: "#1A1A1A" }}>
                    Property Intelligence <span style={{ color: "#B8943E" }}>Suite</span>
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ background: "rgba(184,148,62,0.12)", border: "1px solid rgba(184,148,62,0.3)", color: "#B8943E" }}>
                    <Sparkles className="w-2.5 h-2.5" /> AI Powered
                  </span>
                </div>
                <p className="text-xs sm:text-sm mt-0.5 hidden sm:block" style={{ color: "rgba(0,0,0,0.45)" }}>
                  AI matching · Valuations · Comparison · Market data
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Tab Bar */}
          <div style={{ background: "rgba(245,235,215,0.5)", borderBottom: "1px solid rgba(184,148,62,0.15)" }}>
            <div className="max-w-7xl mx-auto px-2 sm:px-6">
              <TabsList className="w-full justify-start rounded-none bg-transparent p-0 h-auto gap-0 border-0 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                {tabs.map(({ value, label, shortLabel, icon: Icon, color }) => {
                  const isActive = activeTab === value;
                  return (
                    <TabsTrigger key={value} value={value}
                      className="relative flex items-center gap-1.5 px-3 sm:px-5 py-3.5 rounded-none border-0 bg-transparent whitespace-nowrap text-xs sm:text-sm font-medium transition-all outline-none"
                      style={{
                        color: isActive ? color : "rgba(0,0,0,0.4)",
                      }}
                    >
                      <div
                        className="w-5 h-5 sm:w-6 sm:h-6 rounded-md flex items-center justify-center shrink-0 transition-all"
                        style={{
                          background: isActive ? `${color}18` : "transparent",
                          border: isActive ? `1px solid ${color}30` : "1px solid transparent",
                        }}
                      >
                        <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: isActive ? color : "rgba(0,0,0,0.35)" }} />
                      </div>
                      <span className="sm:hidden">{shortLabel}</span>
                      <span className="hidden sm:inline">{label}</span>
                      {/* Active indicator */}
                      <div
                        className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full transition-all"
                        style={{ background: isActive ? color : "transparent" }}
                      />
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-auto">
            <TabsContent value="finder" className="mt-0">
              <Suspense fallback={<LoadingSpinner />}><Quiz /></Suspense>
            </TabsContent>
            <TabsContent value="evaluator" className="mt-0">
              <Suspense fallback={<LoadingSpinner />}><PropertyEvaluator /></Suspense>
            </TabsContent>
            <TabsContent value="compare" className="mt-0">
              <Suspense fallback={<LoadingSpinner />}><Compare /></Suspense>
            </TabsContent>
            <TabsContent value="rental" className="mt-0">
              <Suspense fallback={<LoadingSpinner />}><RentalIndex /></Suspense>
            </TabsContent>
            <TabsContent value="mortgage" className="mt-0">
              <Suspense fallback={<LoadingSpinner />}><MortgageCalculatorComponent /></Suspense>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </>
  );
}
