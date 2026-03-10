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
const AIVideoTourScriptPage = lazy(() => import("@/pages/AIVideoTourScriptPage"));
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
    <Route path="/ai-property-analyzer" element={<AIPropertyAnalyzerPage />} />
    <Route path="/ai-lead-qualification" element={<BrokerGuard><AILeadQualificationPage /></BrokerGuard>} />
    <Route path="/ai-price-predictor" element={<AIPricePredictorPage />} />
    <Route path="/ai-neighborhood-insights" element={<AINeighborhoodInsightsPage />} />
    <Route path="/ai-roi-calculator" element={<AIROICalculatorPage />} />
    <Route path="/ai-competitor-analysis" element={<AICompetitorAnalysisPage />} />
    <Route path="/ai-market-report" element={<AIMarketReportPage />} />
    <Route path="/ai-objection-handler" element={<BrokerGuard><AIObjectionHandlerPage /></BrokerGuard>} />
    <Route path="/ai-followup-scheduler" element={<BrokerGuard><AIFollowupSchedulerPage /></BrokerGuard>} />
    <Route path="/ai-follow-up-scheduler" element={<Navigate to="/ai-followup-scheduler" replace />} />
    <Route path="/ai-meeting-summarizer" element={<BrokerGuard><AIMeetingSummarizerPage /></BrokerGuard>} />
    <Route path="/ai-translation-hub" element={<AITranslationHubPage />} />
    <Route path="/ai-video-tour-script" element={<AIVideoTourScriptPage />} />
    <Route path="/ai-contract-reviewer" element={<BrokerGuard><AIContractReviewerPage /></BrokerGuard>} />
    <Route path="/ai-document-generator" element={<AIDocumentGeneratorPage />} />
    <Route path="/ai-call-summarizer" element={<BrokerGuard><AICallSummarizerPage /></BrokerGuard>} />
    <Route path="/ai-client-matcher" element={<BrokerGuard><AIClientMatcherPage /></BrokerGuard>} />
    <Route path="/ai-email-generator" element={<AIEmailGeneratorPage />} />
    <Route path="/ai-social-media" element={<AISocialMediaPage />} />
    <Route path="/ai-investment-report" element={<AIInvestmentReportPage />} />
    <Route path="/ai-description-writer" element={<AIDescriptionWriterPage />} />
    <Route path="/ai-calendar" element={<AICalendar />} />
    <Route path="/ai-budget-planner" element={<AIFinancialAdvisor />} />
    <Route path="/ai-financial-advisor" element={<Navigate to="/ai-budget-planner" replace />} />
    <Route path="/ai-personal-shopper" element={<AIPersonalShopper />} />
    <Route path="/ai-home-finder" element={<Navigate to="/quiz" replace />} />
    <Route path="/tools-guide" element={<Navigate to="/ai-hub" replace />} />
    <Route path="/my-ai-history" element={<MyAIHistory />} />
    <Route path="/meeting-center" element={<MeetingCenter />} />
    <Route path="/voice-settings" element={<VoiceAgentSettings />} />
  </>
);
