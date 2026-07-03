/**
 * AI Tool routes — all /ai-* pages
 * These render inside MainLayoutWrapper
 */
import { lazy } from "react";
import { Route, Navigate } from "react-router-dom";
import BrokerGuard from "@/components/BrokerGuard";

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

export const AIToolRoutes = () => (
  <>
    <Route path="/ai-property-analyzer" element={<Navigate to="/ai-hub" replace />} />
    <Route path="/ai-lead-qualification" element={<Navigate to="/ai-hub" replace />} />
    <Route path="/ai-price-predictor" element={<AIPricePredictorPage />} />
    <Route path="/ai-neighborhood-insights" element={<Navigate to="/ai-hub" replace />} />
    <Route path="/ai-roi-calculator" element={<Navigate to="/ai-hub" replace />} />
    <Route path="/ai-competitor-analysis" element={<Navigate to="/ai-hub" replace />} />
    <Route path="/ai-market-report" element={<Navigate to="/ai-hub" replace />} />
    <Route path="/ai-objection-handler" element={<Navigate to="/ai-hub" replace />} />
    <Route path="/ai-followup-scheduler" element={<Navigate to="/ai-hub" replace />} />
    <Route path="/ai-follow-up-scheduler" element={<Navigate to="/ai-followup-scheduler" replace />} />
    <Route path="/ai-meeting-summarizer" element={<Navigate to="/ai-hub" replace />} />
    <Route path="/ai-translation-hub" element={<Navigate to="/ai-hub" replace />} />
    <Route path="/ai-video-tour-script" element={<Navigate to="/toolkit/video-suite" replace />} />
    <Route path="/ai-contract-reviewer" element={<Navigate to="/ai-hub" replace />} />
    <Route path="/ai-document-generator" element={<Navigate to="/ai-hub" replace />} />
    <Route path="/ai-call-summarizer" element={<Navigate to="/ai-hub" replace />} />
    <Route path="/ai-client-matcher" element={<Navigate to="/ai-hub" replace />} />
    <Route path="/ai-email-generator" element={<Navigate to="/ai-hub" replace />} />
    <Route path="/ai-social-media" element={<Navigate to="/ai-hub" replace />} />
    <Route path="/ai-investment-report" element={<Navigate to="/ai-hub" replace />} />
    <Route path="/ai-description-writer" element={<Navigate to="/ai-hub" replace />} />
    <Route path="/ai-calendar" element={<Navigate to="/ai-hub" replace />} />
    <Route path="/ai-budget-planner" element={<Navigate to="/ai-hub" replace />} />
    <Route path="/ai-financial-advisor" element={<Navigate to="/ai-budget-planner" replace />} />
    <Route path="/ai-personal-shopper" element={<Navigate to="/ai-hub" replace />} />
    {/* /ai-home-finder is canonical (defined in PublicRoutes). /quiz no longer exists. */}
    <Route path="/tools-guide" element={<Navigate to="/ai-hub" replace />} />
    <Route path="/my-ai-history" element={<MyAIHistory />} />
    <Route path="/meeting-center" element={<MeetingCenter />} />
    <Route path="/voice-settings" element={<VoiceAgentSettings />} />
  </>
);
