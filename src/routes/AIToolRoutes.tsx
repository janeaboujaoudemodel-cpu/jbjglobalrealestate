/**
 * AI Tool routes — all /ai-* pages
 * These render inside MainLayoutWrapper
 *
 * Every paid AI tool is wrapped in <AIToolPreviewGate>. The gate lets users
 * SEE the tool (blurred preview) but blocks interaction until they subscribe.
 * Owners/admins bypass automatically. Free tools (AI Home Finder, Business
 * Card Scanner, CRM) skip the gate.
 */
import { lazy } from "react";
import { Route, Navigate } from "react-router-dom";
import { AIToolPreviewGate } from "@/components/subscription/AIToolPreviewGate";

const AICalendar = lazy(() => import("@/pages/AICalendar"));
const AIFinancialAdvisor = lazy(() => import("@/pages/AIFinancialAdvisor"));
const AIPersonalShopper = lazy(() => import("@/pages/AIPersonalShopper"));
const AIPropertyAnalyzerPage = lazy(() => import("@/pages/AIPropertyAnalyzerPage"));
const AILeadQualificationPage = lazy(() => import("@/pages/AILeadQualificationPage"));
const AIPricePredictorPage = lazy(() => import("@/pages/AIPricePredictorPage"));
const AINeighborhoodInsightsPage = lazy(() => import("@/pages/AINeighborhoodInsightsPage"));
const AIROICalculatorPage = lazy(() => import("@/pages/AIROICalculatorPage"));
const AICompetitorAnalysisPage = lazy(() => import("@/pages/AICompetitorAnalysisPage"));
const AIMarketReportPage = lazy(() => import("@/pages/AIMarketReportPage"));
const AIObjectionHandlerPage = lazy(() => import("@/pages/AIObjectionHandlerPage"));
const AIFollowupSchedulerPage = lazy(() => import("@/pages/AIFollowupSchedulerPage"));
const AIMeetingSummarizerPage = lazy(() => import("@/pages/AIMeetingSummarizerPage"));
const AITranslationHubPage = lazy(() => import("@/pages/AITranslationHubPage"));

const AIContractReviewerPage = lazy(() => import("@/pages/AIContractReviewerPage"));
const AIDocumentGeneratorPage = lazy(() => import("@/pages/AIDocumentGeneratorPage"));
const AICallSummarizerPage = lazy(() => import("@/pages/AICallSummarizerPage"));
const AIClientMatcherPage = lazy(() => import("@/pages/AIClientMatcherPage"));
const AIEmailGeneratorPage = lazy(() => import("@/pages/AIEmailGeneratorPage"));
const AISocialMediaPage = lazy(() => import("@/pages/AISocialMediaPage"));
const AIInvestmentReportPage = lazy(() => import("@/pages/AIInvestmentReportPage"));
const AIDescriptionWriterPage = lazy(() => import("@/pages/AIDescriptionWriterPage"));
const MyAIHistory = lazy(() => import("@/pages/MyAIHistory"));
const MeetingCenter = lazy(() => import("@/pages/MeetingCenter"));
const VoiceAgentSettings = lazy(() => import("@/pages/VoiceAgentSettings"));

const gated = (toolId: string, toolName: string, node: React.ReactNode) => (
  <AIToolPreviewGate toolId={toolId} toolName={toolName}>{node}</AIToolPreviewGate>
);

export const AIToolRoutes = () => (
  <>
    <Route path="/ai-property-analyzer" element={gated("ai-property-analyzer", "AI Property Analyzer", <AIPropertyAnalyzerPage />)} />
    <Route path="/ai-lead-qualification" element={gated("ai-lead-qualification", "AI Lead Qualification", <AILeadQualificationPage />)} />
    <Route path="/ai-price-predictor" element={gated("ai-price-predictor", "AI Price Predictor", <AIPricePredictorPage />)} />
    <Route path="/ai-neighborhood-insights" element={gated("ai-neighborhood-insights", "AI Neighborhood Insights", <AINeighborhoodInsightsPage />)} />
    <Route path="/ai-roi-calculator" element={gated("ai-roi-calculator", "AI ROI Calculator", <AIROICalculatorPage />)} />
    <Route path="/ai-competitor-analysis" element={gated("ai-competitor-analysis", "AI Competitor Analysis", <AICompetitorAnalysisPage />)} />
    <Route path="/ai-market-report" element={gated("ai-market-report", "AI Market Report", <AIMarketReportPage />)} />
    <Route path="/ai-objection-handler" element={gated("ai-objection-handler", "AI Objection Handler", <AIObjectionHandlerPage />)} />
    <Route path="/ai-followup-scheduler" element={gated("ai-followup-scheduler", "AI Follow-up Scheduler", <AIFollowupSchedulerPage />)} />
    <Route path="/ai-follow-up-scheduler" element={<Navigate to="/ai-followup-scheduler" replace />} />
    <Route path="/ai-meeting-summarizer" element={gated("ai-meeting-summarizer", "AI Meeting Summarizer", <AIMeetingSummarizerPage />)} />
    <Route path="/ai-translation-hub" element={gated("ai-translation-hub", "AI Translation Hub", <AITranslationHubPage />)} />
    <Route path="/ai-video-tour-script" element={<Navigate to="/toolkit/video-suite" replace />} />
    <Route path="/ai-contract-reviewer" element={gated("ai-contract-reviewer", "AI Contract Reviewer", <AIContractReviewerPage />)} />
    <Route path="/ai-document-generator" element={gated("ai-document-generator", "AI Document Generator", <AIDocumentGeneratorPage />)} />
    <Route path="/ai-call-summarizer" element={gated("ai-call-summarizer", "AI Call Summarizer", <AICallSummarizerPage />)} />
    <Route path="/ai-client-matcher" element={gated("ai-client-matcher", "AI Client Matcher", <AIClientMatcherPage />)} />
    <Route path="/ai-email-generator" element={gated("ai-email-generator", "AI Email Generator", <AIEmailGeneratorPage />)} />
    <Route path="/ai-social-media" element={gated("ai-social-media", "AI Social Media Studio", <AISocialMediaPage />)} />
    <Route path="/ai-investment-report" element={gated("ai-investment-report", "AI Investment Report", <AIInvestmentReportPage />)} />
    <Route path="/ai-description-writer" element={gated("ai-description-writer", "AI Description Writer", <AIDescriptionWriterPage />)} />
    <Route path="/ai-calendar" element={gated("ai-calendar", "AI Calendar", <AICalendar />)} />
    <Route path="/ai-budget-planner" element={gated("ai-budget-planner", "AI Financial Advisor", <AIFinancialAdvisor />)} />
    <Route path="/ai-financial-advisor" element={<Navigate to="/ai-budget-planner" replace />} />
    <Route path="/ai-personal-shopper" element={gated("ai-personal-shopper", "AI Personal Shopper", <AIPersonalShopper />)} />
    {/* /ai-home-finder is canonical (defined in PublicRoutes) and stays FREE — lead-gen engine. */}
    <Route path="/tools-guide" element={<Navigate to="/ai-hub" replace />} />
    <Route path="/my-ai-history" element={<MyAIHistory />} />
    <Route path="/meeting-center" element={<MeetingCenter />} />
    <Route path="/voice-settings" element={<VoiceAgentSettings />} />
  </>
);
