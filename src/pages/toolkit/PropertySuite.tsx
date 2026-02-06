/**
 * Property Intelligence Suite - Master page for all property tools
 * Tabs: Home Finder | Evaluator | Compare | Rental Index | Mortgage
 * 
 * CRITICAL: Each tab links to the REAL full tool pages - no placeholders
 */

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SEOHead } from '@/components/SEOHead';
import { 
  Home, Calculator, Layers, BarChart3, DollarSign, ArrowLeft, Sparkles
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

// AI Home Finder Panel - Links to quiz
const HomeFinderPanel = () => {
  const navigate = useNavigate();

  const steps = [
    { label: 'Budget', desc: 'Price range' },
    { label: 'Location', desc: 'Area preferences' },
    { label: 'Lifestyle', desc: 'Your needs' },
    { label: 'Features', desc: 'Must-haves' },
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-2 border-purple-500/40 flex items-center justify-center">
          <Home className="w-10 h-10 text-purple-400" />
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-medium mb-4">
          <Sparkles className="w-3 h-3" />
          AI-Powered
        </div>
        <h3 className="text-2xl font-semibold text-white mb-2">AI Home Finder</h3>
        <p className="text-zinc-400 max-w-md mx-auto">
          Answer a few questions and let our AI find your perfect property match based on your lifestyle and preferences.
        </p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {steps.map((step) => (
          <div key={step.label} className="p-4 bg-slate-800/50 rounded-lg border border-purple-500/20">
            <p className="text-white font-medium text-sm">{step.label}</p>
            <p className="text-zinc-500 text-xs mt-1">{step.desc}</p>
          </div>
        ))}
      </div>
      
      <p className="text-zinc-500 text-xs text-center mb-4">Powered by JBJ Global Real Estate</p>
      
      <Button
        className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-lg shadow-purple-500/25"
        onClick={() => navigate('/quiz')}
      >
        Start AI Home Finder
      </Button>
    </div>
  );
};

// Property Evaluator Panel
const EvaluatorPanel = () => {
  const navigate = useNavigate();

  const features = [
    { name: 'Market Value', desc: 'Current estimated value' },
    { name: 'ROI Analysis', desc: 'Investment returns' },
    { name: 'Price Trends', desc: 'Historical data' },
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gold/20 border-2 border-gold/40 flex items-center justify-center mx-auto mb-4">
          <Calculator className="w-8 h-8 text-gold" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">JBJ Property Evaluator</h3>
        <p className="text-zinc-400 max-w-md mx-auto">
          Get instant property valuations powered by market data and AI analysis.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {features.map((feature) => (
          <div key={feature.name} className="p-4 bg-slate-800/50 rounded-lg border border-gold/20">
            <p className="text-white font-medium text-sm">{feature.name}</p>
            <p className="text-zinc-500 text-xs mt-1">{feature.desc}</p>
          </div>
        ))}
      </div>
      
      <Button
        className="w-full bg-gold text-black hover:bg-gold/90"
        onClick={() => navigate('/property-evaluator')}
      >
        Get Evaluation
      </Button>
    </div>
  );
};

// Compare Panel
const ComparePanel = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gold/20 border-2 border-gold/40 flex items-center justify-center mx-auto mb-4">
          <Layers className="w-8 h-8 text-gold" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Property Comparison</h3>
        <p className="text-zinc-400 max-w-md mx-auto">
          Compare multiple properties side-by-side with detailed analytics and insights.
        </p>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-8">
        {['Property A', 'Property B', 'Property C'].map((prop) => (
          <div 
            key={prop} 
            className="p-4 bg-slate-800/50 rounded-lg border border-gold/20 border-dashed text-center cursor-pointer hover:border-gold/40 transition-colors"
            onClick={() => navigate('/compare')}
          >
            <p className="text-zinc-500 text-sm">{prop}</p>
            <p className="text-zinc-600 text-xs mt-1">+ Add</p>
          </div>
        ))}
      </div>
      
      <Button
        className="w-full bg-gold text-black hover:bg-gold/90"
        onClick={() => navigate('/compare')}
      >
        Start Comparing
      </Button>
    </div>
  );
};

// Rental Index Panel
const RentalIndexPanel = () => {
  const navigate = useNavigate();

  const areas = [
    { area: 'Downtown', trend: '+5.2%' },
    { area: 'Marina', trend: '+3.8%' },
    { area: 'JBR', trend: '+4.1%' },
    { area: 'Palm', trend: '+6.3%' },
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gold/20 border-2 border-gold/40 flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-8 h-8 text-gold" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">JBJ Rental Index</h3>
        <p className="text-zinc-400 max-w-md mx-auto">
          Dubai rental market index with real-time pricing data and trends.
        </p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {areas.map((item) => (
          <div key={item.area} className="p-4 bg-slate-800/50 rounded-lg border border-gold/20">
            <p className="text-white font-medium text-sm">{item.area}</p>
            <p className="text-emerald-400 text-xs mt-1">{item.trend}</p>
          </div>
        ))}
      </div>
      
      <Button
        className="w-full bg-gold text-black hover:bg-gold/90"
        onClick={() => navigate('/rental-index')}
      >
        View Rental Index
      </Button>
    </div>
  );
};

// Mortgage Calculator Panel
const MortgagePanel = () => {
  const navigate = useNavigate();

  const features = [
    { name: 'Monthly Payment', desc: 'EMI calculation' },
    { name: 'Affordability', desc: 'What you can buy' },
    { name: 'Bank Rates', desc: 'Compare offers' },
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gold/20 border-2 border-gold/40 flex items-center justify-center mx-auto mb-4">
          <DollarSign className="w-8 h-8 text-gold" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Mortgage Calculator</h3>
        <p className="text-zinc-400 max-w-md mx-auto">
          Calculate mortgage payments, affordability, and compare rates from UAE banks.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {features.map((feature) => (
          <div key={feature.name} className="p-4 bg-slate-800/50 rounded-lg border border-gold/20">
            <p className="text-white font-medium text-sm">{feature.name}</p>
            <p className="text-zinc-500 text-xs mt-1">{feature.desc}</p>
          </div>
        ))}
      </div>
      
      <Button
        className="w-full bg-gold text-black hover:bg-gold/90"
        onClick={() => navigate('/mortgage-calculator')}
      >
        Calculate Mortgage
      </Button>
    </div>
  );
};

export default function PropertySuite() {
  const [activeTab, setActiveTab] = useState('home-finder');

  const tabs = [
    { id: 'home-finder', label: 'Home Finder', icon: Home, description: 'AI property matching' },
    { id: 'evaluator', label: 'Evaluator', icon: Calculator, description: 'Property valuation' },
    { id: 'compare', label: 'Compare', icon: Layers, description: 'Side-by-side analysis' },
    { id: 'rental', label: 'Rental Index', icon: BarChart3, description: 'Market data' },
    { id: 'mortgage', label: 'Mortgage', icon: DollarSign, description: 'Calculator' },
  ];

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
                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Toolkit
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
                <p className="text-zinc-400 text-sm">
                  AI matching, valuations, comparison & market data
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col">
          <div className="border-b border-gold/20 bg-zinc-900/50">
            <div className="max-w-7xl mx-auto px-4">
              <TabsList className="w-full justify-start rounded-none bg-transparent p-0 h-auto gap-0 overflow-x-auto">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="relative px-4 md:px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold text-zinc-400 hover:text-white transition-colors flex items-center gap-2 whitespace-nowrap"
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 bg-slate-950 min-h-[60vh]">
            <TabsContent value="home-finder" className="mt-0">
              <HomeFinderPanel />
            </TabsContent>

            <TabsContent value="evaluator" className="mt-0">
              <EvaluatorPanel />
            </TabsContent>

            <TabsContent value="compare" className="mt-0">
              <ComparePanel />
            </TabsContent>

            <TabsContent value="rental" className="mt-0">
              <RentalIndexPanel />
            </TabsContent>

            <TabsContent value="mortgage" className="mt-0">
              <MortgagePanel />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </>
  );
}
