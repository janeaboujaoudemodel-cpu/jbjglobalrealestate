/**
 * Hover-prefetch map for lazy-loaded AI tool pages.
 * Mirrors the dynamic imports in src/routes/AIToolRoutes.tsx so that
 * hovering a sidebar link warms the chunk cache before the click.
 */
const PREFETCH_MAP: Record<string, () => Promise<unknown>> = {
  "/map": () => import("@/pages/PropertyMap"),
  "/ai-property-analyzer": () => import("@/pages/AIPropertyAnalyzerPage"),
  "/ai-lead-qualification": () => import("@/pages/AILeadQualificationPage"),
  "/ai-price-predictor": () => import("@/pages/AIPricePredictorPage"),
  "/ai-neighborhood-insights": () => import("@/pages/AINeighborhoodInsightsPage"),
  "/ai-roi-calculator": () => import("@/pages/AIROICalculatorPage"),
  "/ai-competitor-analysis": () => import("@/pages/AICompetitorAnalysisPage"),
  "/ai-market-report": () => import("@/pages/AIMarketReportPage"),
  "/ai-objection-handler": () => import("@/pages/AIObjectionHandlerPage"),
  "/ai-followup-scheduler": () => import("@/pages/AIFollowupSchedulerPage"),
  "/ai-meeting-summarizer": () => import("@/pages/AIMeetingSummarizerPage"),
  "/ai-translation-hub": () => import("@/pages/AITranslationHubPage"),
  "/ai-contract-reviewer": () => import("@/pages/AIContractReviewerPage"),
  "/ai-document-generator": () => import("@/pages/AIDocumentGeneratorPage"),
  "/ai-call-summarizer": () => import("@/pages/AICallSummarizerPage"),
  "/ai-client-matcher": () => import("@/pages/AIClientMatcherPage"),
  "/ai-email-generator": () => import("@/pages/AIEmailGeneratorPage"),
  "/ai-social-media": () => import("@/pages/AISocialMediaPage"),
  "/ai-investment-report": () => import("@/pages/AIInvestmentReportPage"),
  "/ai-description-writer": () => import("@/pages/AIDescriptionWriterPage"),
  "/ai-calendar": () => import("@/pages/AICalendar"),
  "/ai-budget-planner": () => import("@/pages/AIFinancialAdvisor"),
  "/ai-personal-shopper": () => import("@/pages/AIPersonalShopper"),
  "/my-ai-history": () => import("@/pages/MyAIHistory"),
  "/meeting-center": () => import("@/pages/MeetingCenter"),
  "/voice-settings": () => import("@/pages/VoiceAgentSettings"),
};

const PREFETCHED = new Set<string>();

/** Trigger the lazy chunk for the given href if we know about it. Idempotent and safe. */
export function prefetchAITool(href: string): void {
  if (!href || PREFETCHED.has(href)) return;
  // Strip any querystring/hash for matching
  const path = href.split("?")[0].split("#")[0];
  const loader = PREFETCH_MAP[path];
  if (!loader) return;
  PREFETCHED.add(path);
  // Fire-and-forget. Errors here are not user-facing — the route loader
  // will surface its own error if it actually breaks on click.
  loader().catch(() => {
    PREFETCHED.delete(path);
  });
}
