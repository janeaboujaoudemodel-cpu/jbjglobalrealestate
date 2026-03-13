/**
 * Unified Suites Hub - One page showing all tool suites organized by category
 * Each suite card links to its dedicated suite page with all tools inside
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '@/components/SEOHead';
import { motion } from 'framer-motion';
import { 
  Building2, Users, Palette, Briefcase, FileText, 
  ArrowRight, Sparkles, TrendingUp, Layers
} from 'lucide-react';

const suites = [
  {
    id: 'real-estate',
    title: 'Real Estate Intelligence',
    description: 'Property analysis, valuation, market reports, ROI calculators, mortgage tools, and neighborhood insights — everything for real estate professionals.',
    icon: Building2,
    href: '/business-suite/real-estate',
    toolCount: 22,
    gradient: 'from-sky-600 to-blue-700',
    glowColor: 'sky',
    highlights: ['Property Analyzer', 'Price Predictor', 'ROI Calculator', 'Market Reports', 'Mortgage Calculator'],
  },
  {
    id: 'broker',
    title: 'Broker Intelligence',
    description: 'Lead management, CRM, client communication, objection handling, meeting summaries, listing portals, and AI-powered sales acceleration tools.',
    icon: Users,
    href: '/broker-hub',
    toolCount: 18,
    gradient: 'from-fuchsia-600 to-purple-700',
    glowColor: 'fuchsia',
    highlights: ['Lead Qualification', 'CRM Dashboard', 'Objection Handler', 'Listing Portal', 'Call Summarizer'],
  },
  {
    id: 'investor',
    title: 'Investor Intelligence',
    description: 'Portfolio tracking, property evaluation, investment reports, home finder quiz, market intelligence, and educational resources for investors.',
    icon: TrendingUp,
    href: '/investor-hub',
    toolCount: 12,
    gradient: 'from-emerald-600 to-teal-700',
    glowColor: 'emerald',
    highlights: ['Property Evaluator', 'ROI Calculator', 'Price Predictor', 'Home Finder', 'Market Reports'],
  },
  {
    id: 'creative',
    title: 'Creative & Communication',
    description: 'Document generation, translation, video tour scripts, email generator, social media content, virtual staging, and interior design AI.',
    icon: Palette,
    href: '/business-suite/creative',
    toolCount: 10,
    gradient: 'from-pink-600 to-rose-700',
    glowColor: 'pink',
    highlights: ['Document Generator', 'Translation Hub', 'Video Tour Script', 'Virtual Staging', 'Interior Design'],
  },
  {
    id: 'corporate',
    title: 'Corporate & Productivity',
    description: 'Business cards, logos, stamps, CVs, company profiles, e-signatures, cover letters, and professional document tools.',
    icon: Briefcase,
    href: '/productivity-suite',
    toolCount: 16,
    gradient: 'from-amber-600 to-yellow-700',
    glowColor: 'amber',
    highlights: ['Smart Stamp', 'Business Card', 'Logo Maker', 'CV Builder', 'E-Sign'],
  },
];

const glowMap: Record<string, string> = {
  sky: 'shadow-sky-500/20',
  fuchsia: 'shadow-fuchsia-500/20',
  emerald: 'shadow-emerald-500/20',
  pink: 'shadow-pink-500/20',
  amber: 'shadow-amber-500/20',
};

const borderMap: Record<string, string> = {
  sky: 'border-sky-500/30 hover:border-sky-400/60',
  fuchsia: 'border-fuchsia-500/30 hover:border-fuchsia-400/60',
  emerald: 'border-emerald-500/30 hover:border-emerald-400/60',
  pink: 'border-pink-500/30 hover:border-pink-400/60',
  amber: 'border-amber-500/30 hover:border-amber-400/60',
};

const textMap: Record<string, string> = {
  sky: 'text-sky-400',
  fuchsia: 'text-fuchsia-400',
  emerald: 'text-emerald-400',
  pink: 'text-pink-400',
  amber: 'text-amber-400',
};

const SuitesHub = () => {
  return (
    <>
      <SEOHead
        title="Tool Suites | JBJ Global Real Estate"
        description="Access organized suites of AI-powered tools for real estate, brokerage, investment, creative, and corporate needs."
      />

      <div className="min-h-screen bg-black">
        {/* Hero */}
        <div className="relative pt-28 pb-16 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(200,167,102,0.1),transparent_60%)]" />
          <div className="relative max-w-6xl mx-auto px-4 text-center">
            <Link
              to="/toolkit"
              className="inline-flex items-center gap-2 text-zinc-400 hover:text-gold transition-colors mb-8 text-sm"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Back to Toolkit
            </Link>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/30 rounded-full mb-6">
                <Layers className="w-4 h-4 text-gold" />
                <span className="text-gold text-xs font-semibold uppercase tracking-wider">Tool Suites</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                All <span className="bg-gradient-to-r from-gold via-amber-400 to-gold bg-clip-text text-transparent">Suites</span>
              </h1>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                Organized collections of AI tools grouped by function. Each suite brings together everything you need in one place.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Suites Grid */}
        <div className="max-w-6xl mx-auto px-4 pb-20">
          <div className="grid md:grid-cols-2 gap-6">
            {suites.map((suite, idx) => {
              const Icon = suite.icon;
              return (
                <motion.div
                  key={suite.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Link
                    to={suite.href}
                    className={`group block relative p-6 md:p-8 rounded-2xl border-2 ${borderMap[suite.glowColor]} bg-zinc-950/80 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl ${glowMap[suite.glowColor]} hover:scale-[1.01]`}
                  >
                    {/* Gradient glow */}
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${suite.gradient} opacity-[0.04] group-hover:opacity-[0.08] transition-opacity`} />

                    <div className="relative">
                      {/* Icon + Title */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${suite.gradient} flex items-center justify-center shrink-0`}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h2 className="text-xl font-bold text-white mb-1">{suite.title}</h2>
                          <span className={`text-xs font-medium ${textMap[suite.glowColor]}`}>
                            {suite.toolCount} tools included
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-zinc-400 text-sm leading-relaxed mb-5">
                        {suite.description}
                      </p>

                      {/* Tool highlights */}
                      <div className="flex flex-wrap gap-2 mb-5">
                        {suite.highlights.map(h => (
                          <span
                            key={h}
                            className={`text-[11px] px-2.5 py-1 rounded-full border ${borderMap[suite.glowColor].split(' ')[0]} bg-zinc-900/80 ${textMap[suite.glowColor]} font-medium`}
                          >
                            {h}
                          </span>
                        ))}
                      </div>

                      {/* CTA */}
                      <div className={`flex items-center gap-2 text-sm font-semibold ${textMap[suite.glowColor]} group-hover:translate-x-1 transition-transform`}>
                        Open Suite
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* All Tools Link */}
          <div className="mt-10 text-center">
            <Link
              to="/business-suite/all-tools"
              className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900/80 border border-gold/30 rounded-full text-gold hover:bg-gold/10 transition-all text-sm font-medium"
            >
              <Sparkles className="w-4 h-4" />
              View All Individual Tools
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default SuitesHub;
