/**
 * Toolkit & Creative Suite routes
 */
import React, { lazy, Suspense } from "react";
import { Route, Navigate } from "react-router-dom";
import OwnerGuard from "@/components/OwnerGuard";
import PageLoader from "@/components/PageLoader";

const VideoResizePack = lazy(() => import("@/pages/toolkit/VideoResizePack"));
const PdfFromPhotos = lazy(() => import("@/pages/toolkit/PdfFromPhotos"));
const ImageResize = lazy(() => import("@/pages/toolkit/ImageResize"));
const VoiceStudio = lazy(() => import("@/pages/toolkit/VoiceStudio"));
const VoiceStudioPro = lazy(() => import("@/pages/toolkit/VoiceStudioPro"));
const AIVideoStudioPage = lazy(() => import("@/pages/toolkit/AIVideoStudioPage"));
const StampGeneratorLanding = lazy(() => import("@/pages/toolkit/StampGeneratorPage"));
const ScanSignToolkitPage = lazy(() => import("@/pages/toolkit/ScanSignPage"));
const StampProjectsDashboard = lazy(() => import("@/components/stamp-generator/StampProjectsDashboard"));
const StampProjectWizard = lazy(() => import("@/components/stamp-generator/StampProjectWizard"));
const StampGeneratorMain = lazy(() => import("@/components/stamp-generator/StampGeneratorPage"));
const StampExportPage = lazy(() => import("@/components/stamp-generator/StampExportPage"));
const StampGalleryPage = lazy(() => import("@/components/stamp-generator/StampGalleryPage"));
const StampHistoryDashboard = lazy(() => import("@/components/stamp-generator/StampHistoryDashboard"));
const CaptionsTranslate = lazy(() => import("@/pages/toolkit/CaptionsTranslate"));
const BackgroundAI = lazy(() => import("@/pages/toolkit/BackgroundAI"));
const BeautyFilters = lazy(() => import("@/pages/toolkit/BeautyFilters"));
const PDFEditor = lazy(() => import("@/pages/toolkit/PDFEditor"));
const VideoSuite = lazy(() => import("@/pages/toolkit/VideoSuite"));
const VoiceSuite = lazy(() => import("@/pages/toolkit/VoiceSuite"));
const PhotoSuite = lazy(() => import("@/pages/toolkit/PhotoSuite"));
const PDFSuite = lazy(() => import("@/pages/toolkit/PDFSuite"));
const PropertySuite = lazy(() => import("@/pages/toolkit/PropertySuite"));
const CorporateSuite = lazy(() => import("@/pages/toolkit/CorporateSuite"));
const BusinessCardDesigner = lazy(() => import("@/components/corporate-suite/BusinessCardDesigner"));
const CVResumeBuilder = lazy(() => import("@/components/corporate-suite/CVResumeBuilder"));
const CoverLetterGenerator = lazy(() => import("@/components/corporate-suite/CoverLetterGenerator"));
const LandingPageBuilder = lazy(() => import("@/components/corporate-suite/LandingPageBuilder"));
const LogoCreator = lazy(() => import("@/components/corporate-suite/LogoCreator"));
const CompanyProfileBuilder = lazy(() => import("@/components/corporate-suite/CompanyProfileBuilder"));
const AllToolsSuite = lazy(() => import("@/pages/business-suite/AllToolsSuite"));
const RealEstateSuite = lazy(() => import("@/pages/business-suite/RealEstateSuite"));
const BrokerSuite = lazy(() => import("@/pages/business-suite/BrokerSuite"));
const CreativeSuite = lazy(() => import("@/pages/business-suite/CreativeSuite"));
const ProductivitySuite = lazy(() => import("@/pages/business-suite/ProductivitySuite"));
const SuitesHub = lazy(() => import("@/pages/business-suite/SuitesHub"));
const Studio = lazy(() => import("@/pages/Studio"));
const StudioEditor = lazy(() => import("@/pages/StudioEditor"));
const StudioSettings = lazy(() => import("@/pages/StudioSettings"));

import BrokerGuard from "@/components/BrokerGuard";

/** Wraps a lazy component with the standard PageLoader fallback */
const L = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

export const ToolkitRoutes = () => (
  <>
    {/* Toolkit hub redirect */}
    <Route path="/toolkit" element={<Navigate to="/ai-hub" replace />} />
    <Route path="/royal-tools" element={<Navigate to="/toolkit" replace />} />

    {/* Scan & Sign */}
    <Route path="/toolkit/scan-sign" element={<L><ScanSignToolkitPage /></L>} />
    <Route path="/toolkit/e-sign" element={<Navigate to="/e-signature" replace />} />

    {/* Stamp Generator */}
    <Route path="/toolkit/stamp-generator" element={<L><StampGeneratorLanding /></L>} />
    <Route path="/toolkit/stamp-generator/projects" element={<L><StampProjectsDashboard /></L>} />
    <Route path="/toolkit/stamp-generator/new" element={<L><StampProjectWizard /></L>} />
    <Route path="/toolkit/stamp-generator/:projectId/generate" element={<L><StampGeneratorMain /></L>} />
    <Route path="/toolkit/stamp-generator/:projectId/export/:designId" element={<L><StampExportPage /></L>} />
    <Route path="/toolkit/stamp-generator/:projectId/gallery" element={<L><StampGalleryPage /></L>} />
    <Route path="/toolkit/stamp-generator/history" element={<L><StampHistoryDashboard /></L>} />

    {/* Corporate Suite */}
    <Route path="/toolkit/corporate-suite" element={<L><CorporateSuite /></L>} />
    <Route path="/toolkit/corporate-suite/business-card" element={<L><BusinessCardDesigner /></L>} />
    <Route path="/toolkit/corporate-suite/cv-resume" element={<L><CVResumeBuilder /></L>} />
    <Route path="/toolkit/corporate-suite/cover-letter" element={<L><CoverLetterGenerator /></L>} />
    <Route path="/toolkit/corporate-suite/landing-page" element={<L><LandingPageBuilder /></L>} />
    <Route path="/toolkit/corporate-suite/logo-creator" element={<L><LogoCreator /></L>} />
    <Route path="/toolkit/corporate-suite/company-profile" element={<L><CompanyProfileBuilder /></L>} />

    {/* Creative Suite - Owner only */}
    <Route path="/studio" element={<OwnerGuard><L><Studio /></L></OwnerGuard>} />
    <Route path="/studio/editor/:projectId" element={<OwnerGuard><L><StudioEditor /></L></OwnerGuard>} />
    <Route path="/studio/settings" element={<OwnerGuard><L><StudioSettings /></L></OwnerGuard>} />

    {/* Master Suite Routes */}
    <Route path="/toolkit/video-suite" element={<L><VideoSuite /></L>} />
    <Route path="/toolkit/voice-suite" element={<L><VoiceSuite /></L>} />
    <Route path="/toolkit/photo-suite" element={<L><PhotoSuite /></L>} />
    <Route path="/toolkit/pdf-suite" element={<L><PDFSuite /></L>} />
    <Route path="/toolkit/property-suite" element={<L><PropertySuite /></L>} />

    {/* Individual toolkit tools */}
    <Route path="/toolkit/video-resize-pack" element={<L><VideoResizePack /></L>} />
    <Route path="/toolkit/smart-reframe" element={<L><VideoResizePack /></L>} />
    <Route path="/toolkit/pdf-from-photos" element={<L><PdfFromPhotos /></L>} />
    <Route path="/toolkit/pdf-editor" element={<L><PDFEditor /></L>} />
    <Route path="/toolkit/image-resize" element={<L><ImageResize /></L>} />
    <Route path="/toolkit/voice-studio" element={<L><VoiceStudio /></L>} />
    <Route path="/toolkit/voice-studio-pro" element={<L><VoiceStudioPro /></L>} />
    <Route path="/toolkit/ai-video-studio" element={<L><AIVideoStudioPage /></L>} />
    <Route path="/toolkit/captions-translate" element={<L><CaptionsTranslate /></L>} />
    <Route path="/toolkit/background-ai" element={<L><BackgroundAI /></L>} />
    <Route path="/toolkit/beauty-filters" element={<L><BeautyFilters /></L>} />

    {/* Business Suite Routes */}
    <Route path="/business-suite/all" element={<L><AllToolsSuite /></L>} />
    <Route path="/business-suite/real-estate" element={<L><RealEstateSuite /></L>} />
    <Route path="/business-suite/broker" element={<L><BrokerGuard><BrokerSuite /></BrokerGuard></L>} />
    <Route path="/business-suite/creative" element={<L><CreativeSuite /></L>} />
    <Route path="/business-suite/productivity" element={<L><ProductivitySuite /></L>} />
    <Route path="/suites" element={<L><SuitesHub /></L>} />
  </>
);
