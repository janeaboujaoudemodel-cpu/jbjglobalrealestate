import React from "react";
import { ShareModal, BatchPrintDialog, NfcGuideDialog } from "./BusinessCardDialogs";
import { BusinessCardHeader } from "./BusinessCardHeader";
import { BusinessCardLeftPanel } from "./BusinessCardLeftPanel";
import { BusinessCardCenterPanel } from "./BusinessCardCenterPanel";
import { BusinessCardRightPanel } from "./BusinessCardRightPanel";
import { useBusinessCardState } from "./useBusinessCardState";

export default function BusinessCardDesigner() {
  const s = useBusinessCardState();

  return (
    <>
    <div className="min-h-screen" style={{ background: "hsl(var(--pearl-1,48 30% 97%))" }}>
      <BusinessCardHeader
        editLayout={s.editLayout}
        setEditLayout={s.setEditLayout}
        onResetLayout={s.handleResetLayout}
        isSaving={s.isSaving}
        onSave={s.handleSaveCard}
        cardLicenseCode={s.cardLicenseCode}
        isSharing={s.isSharing}
        onShare={s.handleShareCard}
        cardShape={s.cardShape}
        isExportingHtml={s.isExportingHtml}
        onExportHtml={s.handleExportHtml}
        isExportingPng={s.isExportingPng}
        onExportPng={s.handleExportPng}
        onBatchPrint={() => s.setBatchPrintOpen(true)}
        isExporting={s.isExporting}
        onExportPdf={s.handleExport}
      />

      {s.shareToken && (
        <ShareModal
          open={s.shareModalOpen}
          onOpenChange={s.setShareModalOpen}
          shareToken={s.shareToken}
          frontPrimary={s.frontPrimary}
        />
      )}

      {/* ── Main Content ───────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-4 grid grid-cols-1 lg:grid-cols-[320px_1fr_320px] gap-5">

        {/* ── Left panel ──────────────────────────────────────── */}
        <BusinessCardLeftPanel
          cardShape={s.cardShape}
          setCardShape={s.setCardShape}
          shapeOpen={s.shapeOpen}
          setShapeOpen={s.setShapeOpen}
          setNfcGuideOpen={s.setNfcGuideOpen}
          activeTemplate={s.activeTemplate}
          setActiveTemplate={s.setActiveTemplate}
          side={s.side}
          handleExtractedCard={s.handleExtractedCard}
          tradeLicenseOpen={s.tradeLicenseOpen}
          setTradeLicenseOpen={s.setTradeLicenseOpen}
          handleTradeLicenseExtracted={s.handleTradeLicenseExtracted}
          loadSavedOpen={s.loadSavedOpen}
          setLoadSavedOpen={s.setLoadSavedOpen}
          savedDesigns={s.savedDesigns}
          isLoadingSaved={s.isLoadingSaved}
          isDeletingSaved={s.isDeletingSaved}
          handleLoadSavedDesigns={s.handleLoadSavedDesigns}
          handleRestoreSaved={s.handleRestoreSaved}
          handleDeleteSaved={s.handleDeleteSaved}
          bilingualOpen={s.bilingualOpen}
          setBilingualOpen={s.setBilingualOpen}
          bilingualMode={s.bilingualMode}
          setBilingualMode={s.setBilingualMode}
          bilingualLang={s.bilingualLang}
          setBilingualLang={s.setBilingualLang}
          bilingualDir={s.bilingualDir}
          secondaryData={s.secondaryData}
          setSecondaryData={s.setSecondaryData}
          galleryOpen={s.galleryOpen}
          setGalleryOpen={s.setGalleryOpen}
          galleryPrompt={s.galleryPrompt}
          setGalleryPrompt={s.setGalleryPrompt}
          galleryDesigns={s.galleryDesigns}
          setGalleryDesigns={s.setGalleryDesigns}
          galleryFavorites={s.galleryFavorites}
          setGalleryFavorites={s.setGalleryFavorites}
          isGeneratingGallery={s.isGeneratingGallery}
          galleryPage={s.galleryPage}
          setGalleryPage={s.setGalleryPage}
          GALLERY_PER_PAGE={s.GALLERY_PER_PAGE}
          handleGenerateGallery={s.handleGenerateGallery}
          toggleGalleryFavorite={s.toggleGalleryFavorite}
          applyGalleryDesign={s.applyGalleryDesign}
          data={s.data}
          setData={s.setData}
          set={s.set}
          cardFontFamily={s.cardFontFamily}
          cardFontBold={s.cardFontBold}
          cardFontItalic={s.cardFontItalic}
          cardFontSize={s.cardFontSize}
        />

        {/* ── Center panel: Preview ─────────────────────────────── */}
        <BusinessCardCenterPanel
          side={s.side}
          setSide={s.setSide}
          editLayout={s.editLayout}
          setEditLayout={s.setEditLayout}
          isSharing={s.isSharing}
          handleShareCard={s.handleShareCard}
          cardShape={s.cardShape}
          cardPreviewRef={s.cardPreviewRef}
          data={s.data}
          frontTemplate={s.frontTemplate}
          backTemplate={s.backTemplate}
          frontPrimary={s.frontPrimary}
          frontSecondary={s.frontSecondary}
          frontAccent={s.frontAccent}
          backPrimary={s.backPrimary}
          backSecondary={s.backSecondary}
          backAccent={s.backAccent}
          fieldPositions={s.fieldPositions}
          handleFieldMove={s.handleFieldMove}
          qrEnabled={s.qrEnabled}
          qrDataStr={s.qrDataStr}
          qrSize={s.qrSize}
          effectiveQrColor={s.effectiveQrColor}
          qrBgColor={s.qrBgColor}
          qrPosition={s.qrPosition}
          qrSide={s.qrSide}
          logoUrl={s.logoUrl}
          logoSize={s.logoSize}
          logoPos={s.logoPos}
          setLogoPos={s.setLogoPos}
          aiDesignData={s.aiDesignData}
          cardFontFamily={s.cardFontFamily}
          cardFontBold={s.cardFontBold}
          cardFontItalic={s.cardFontItalic}
          cardFontSize={s.cardFontSize}
          bilingualMode={s.bilingualMode}
          bilingualDir={s.bilingualDir}
          bilingualLang={s.bilingualLang}
          secondaryData={s.secondaryData}
          setInlineEditField={s.setInlineEditField}
          inlineEditField={s.inlineEditField}
          setData={s.setData}
          finishEffect={s.finishEffect}
          frontColorIdx={s.frontColorIdx}
          backColorIdx={s.backColorIdx}
          setFrontTemplate={s.setFrontTemplate}
          setBackTemplate={s.setBackTemplate}
          landingPageData={s.landingPageData}
          setLandingPageData={s.setLandingPageData}
          digitalTab={s.digitalTab}
          setDigitalTab={s.setDigitalTab}
          isExportingHtml={s.isExportingHtml}
          handleExportHtml={s.handleExportHtml}
        />

        {/* ── Right panel: Style Controls ──────────────────────── */}
        <BusinessCardRightPanel
          colorOpen={s.colorOpen}
          setColorOpen={s.setColorOpen}
          cardShape={s.cardShape}
          frontColorIdx={s.frontColorIdx}
          setFrontColorIdx={s.setFrontColorIdx}
          frontCustomColor={s.frontCustomColor}
          setFrontCustomColor={s.setFrontCustomColor}
          backColorIdx={s.backColorIdx}
          setBackColorIdx={s.setBackColorIdx}
          backCustomColor={s.backCustomColor}
          setBackCustomColor={s.setBackCustomColor}
          frontPrimary={s.frontPrimary}
          backPrimary={s.backPrimary}
          useGradient={s.useGradient}
          setUseGradient={s.setUseGradient}
          gradientEnd={s.gradientEnd}
          setGradientEnd={s.setGradientEnd}
          gradientDirection={s.gradientDirection}
          setGradientDirection={s.setGradientDirection}
          brandAssetOpen={s.brandAssetOpen}
          setBrandAssetOpen={s.setBrandAssetOpen}
          logoUrl={s.logoUrl}
          setLogoUrl={s.setLogoUrl}
          logoSize={s.logoSize}
          setLogoSize={s.setLogoSize}
          typographyOpen={s.typographyOpen}
          setTypographyOpen={s.setTypographyOpen}
          cardFontFamily={s.cardFontFamily}
          setCardFontFamily={s.setCardFontFamily}
          cardFontBold={s.cardFontBold}
          setCardFontBold={s.setCardFontBold}
          cardFontItalic={s.cardFontItalic}
          setCardFontItalic={s.setCardFontItalic}
          cardFontSize={s.cardFontSize}
          setCardFontSize={s.setCardFontSize}
          cardTextAlign={s.cardTextAlign}
          setCardTextAlign={s.setCardTextAlign}
          cardUnderline={s.cardUnderline}
          setCardUnderline={s.setCardUnderline}
          cardLetterSpacing={s.cardLetterSpacing}
          setCardLetterSpacing={s.setCardLetterSpacing}
          cardLineHeight={s.cardLineHeight}
          setCardLineHeight={s.setCardLineHeight}
          qrOpen={s.qrOpen}
          setQrOpen={s.setQrOpen}
          qrEnabled={s.qrEnabled}
          setQrEnabled={s.setQrEnabled}
          qrContentType={s.qrContentType}
          setQrContentType={s.setQrContentType}
          qrCustomContent={s.qrCustomContent}
          setQrCustomContent={s.setQrCustomContent}
          qrSize={s.qrSize}
          setQrSize={s.setQrSize}
          qrColor={s.qrColor}
          setQrColor={s.setQrColor}
          qrBgColor={s.qrBgColor}
          setQrBgColor={s.setQrBgColor}
          qrPosition={s.qrPosition}
          setQrPosition={s.setQrPosition}
          qrSide={s.qrSide}
          setQrSide={s.setQrSide}
          qrAiPrompt={s.qrAiPrompt}
          setQrAiPrompt={s.setQrAiPrompt}
          isAiStylingQr={s.isAiStylingQr}
          handleAiQrStyle={s.handleAiQrStyle}
          effectiveQrColor={s.effectiveQrColor}
          qrDataStr={s.qrDataStr}
          data={s.data}
          aiDesignOpen={s.aiDesignOpen}
          setAiDesignOpen={s.setAiDesignOpen}
          aiTone={s.aiTone}
          setAiTone={s.setAiTone}
          aiIndustry={s.aiIndustry}
          setAiIndustry={s.setAiIndustry}
          aiStyle={s.aiStyle}
          setAiStyle={s.setAiStyle}
          aiDesignData={s.aiDesignData}
          setAiDesignData={s.setAiDesignData}
          isGeneratingDesign={s.isGeneratingDesign}
          handleGenerateDesign={s.handleGenerateDesign}
          activeTemplate={s.activeTemplate}
          setActiveTemplate={s.setActiveTemplate}
          frontSecondary={s.frontSecondary}
          frontAccent={s.frontAccent}
          finishOpen={s.finishOpen}
          setFinishOpen={s.setFinishOpen}
          finishEffect={s.finishEffect}
          setFinishEffect={s.setFinishEffect}
          mockupOpen={s.mockupOpen}
          setMockupOpen={s.setMockupOpen}
          mockupScene={s.mockupScene}
          setMockupScene={s.setMockupScene}
          frontTemplate={s.frontTemplate}
        />
      </div>
    </div>

      <BatchPrintDialog
        open={s.batchPrintOpen}
        onOpenChange={s.setBatchPrintOpen}
        count={s.batchPrintCount}
        setCount={s.setBatchPrintCount}
        onPrint={s.handleBatchPrint}
      />

      <NfcGuideDialog open={s.nfcGuideOpen} onOpenChange={s.setNfcGuideOpen} />
    </>
  );
}
