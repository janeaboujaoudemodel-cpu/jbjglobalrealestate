import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLeadCapture } from "@/hooks/useLeadCapture";
import { useFounderVisibility } from "@/contexts/FounderVisibilityContext";
import { useActivityTracking } from "@/hooks/useActivityTracking";
import { getCountryList, getLanguageList } from "@/constants/localeOptions";
import { CONTACT_INFO } from "@/constants/stats";
import { ytd2026, topAreas2026, topNationalities } from "@/constants/dldMarketData";
import { buildMarketReportHtml } from "./marketReportTemplate";

export interface MarketReportForm {
  fullName: string;
  email: string;
  phone: string;
  nationality: string;
  language: string;
  preferredContact: string;
  serviceNeeded: string;
}

export function useMarketReport() {
  const countries = useMemo(() => getCountryList(), []);
  const languages = useMemo(() => getLanguageList(), []);
  const [downloaded, setDownloaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [bookHtml, setBookHtml] = useState<string | null>(null);
  const [showBookPreview, setShowBookPreview] = useState(false);
  const [showCTAModal, setShowCTAModal] = useState(false);
  const bookFrameRef = useRef<HTMLIFrameElement>(null);
  const { isLeadCaptured, leadData, captureLead } = useLeadCapture();
  const navigate = useNavigate();
  const { isFounderVisible } = useFounderVisibility();
  const { trackEvent } = useActivityTracking();

  const [form, setForm] = useState<MarketReportForm>({
    fullName: "",
    email: "",
    phone: "",
    nationality: "",
    language: "",
    preferredContact: "",
    serviceNeeded: "",
  });

  // Pre-fill form with captured lead data
  useEffect(() => {
    if (isLeadCaptured && leadData) {
      setForm({
        fullName: leadData.fullName || "",
        email: leadData.email || "",
        phone: leadData.phone || "",
        nationality: leadData.nationality || "",
        language: leadData.language || "",
        preferredContact: "",
        serviceNeeded: "",
      });
    }
  }, [isLeadCaptured, leadData]);

  const canDirectDownload = isLeadCaptured && leadData?.email;

  const isValid = canDirectDownload || (
    form.fullName.trim().length > 1 &&
    form.email.trim().includes("@") &&
    form.phone.trim().length >= 6 &&
    form.nationality.trim().length > 0 &&
    form.language.trim().length > 0 &&
    form.preferredContact.trim().length > 0 &&
    form.serviceNeeded.trim().length > 0
  );

  const buildInquiryUrl = () => {
    const base = CONTACT_INFO.inquiryFormUrl;
    const params = new URLSearchParams();
    params.set("source", "market-report");
    if (form.fullName) params.set("name", form.fullName);
    if (form.email) params.set("email", form.email);
    if (form.phone) params.set("phone", form.phone);
    if (form.nationality) params.set("nationality", form.nationality);
    if (form.language) params.set("language", form.language);
    return `${base}?${params.toString()}`;
  };

  const downloadBook = async (existingWindow?: Window | null) => {
    // Fetch live data from database — all in parallel
    const [newsResult, projectsResult, areasResult, developersResult, dldResult] = await Promise.all([
      supabase
        .from("market_news")
        .select("title, excerpt, published_date, source, category")
        .order("published_date", { ascending: false })
        .limit(5),
      supabase
        .from("projects")
        .select("name, slug, location, price_from, developer_name, cover_image_url, area_name, short_description, description")
        .eq("is_published", true)
        .not("price_from", "is", null)
        .gt("price_from", 0)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("areas")
        .select("name, slug, image_url, is_trending, is_high_demand, property_count, emirate")
        .eq("is_active", true)
        .order("property_count", { ascending: false })
        .limit(8),
      supabase
        .from("developers")
        .select("name, logo_url, slug")
        .in("name", ["Emaar Properties","Ellington Properties","Meraas","Nakheel","Sobha Realty","Aldar Properties","DAMAC Properties","Binghatti Developers"]),
      supabase
        .from("dld_market_data" as any)
        .select("data_key, data_json"),
    ]);

    const latestNews = newsResult.data || [];
    const featuredProjects = projectsResult.data || [];
    const featuredAreas = areasResult.data || [];
    const featuredDevelopers = developersResult.data || [];

    // Build live DLD data with fallback
    const dldMap: Record<string, any> = {};
    for (const row of (dldResult.data || []) as any[]) { dldMap[row.data_key] = row.data_json; }
    const liveYtd = dldMap.ytd2026 || ytd2026;
    const liveTopAreas = dldMap.topAreas2026 || topAreas2026;
    const liveNationalities = dldMap.topNationalities || topNationalities;

    const html = buildMarketReportHtml({
      liveYtd,
      liveTopAreas,
      liveNationalities,
      latestNews,
      featuredProjects,
      featuredAreas,
      featuredDevelopers,
      isFounderVisible,
    });

    if (isGeneratingPdf) {
      toast.info("PDF is already being prepared...");
      return false;
    }

    setIsGeneratingPdf(true);

    const generatePDF = async () => {
      const { default: html2canvas } = await import("html2canvas");
      const { default: jsPDF } = await import("jspdf");
      const { PDFDocument } = await import("pdf-lib");

      const container = document.createElement("div");
      container.style.cssText = "position:fixed;left:-9999px;top:0;width:794px;opacity:0;pointer-events:none;z-index:-1;";
      container.innerHTML = html;
      document.body.appendChild(container);

      try {
        const pages = container.querySelectorAll(".page");
        if (!pages.length) throw new Error("No pages found for PDF rendering");

        const allImages = Array.from(container.querySelectorAll("img")) as HTMLImageElement[];
        await Promise.all(allImages.map((img) => {
          if (img.complete && img.naturalWidth > 0) return Promise.resolve();
          return new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          });
        }));

        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
        const pdfWidth = 210;
        const pdfHeight = 297;

        const linkAnnotations: Array<{ page: number; x: number; y: number; w: number; h: number; url: string }> = [];

        for (let i = 0; i < pages.length; i++) {
          const page = pages[i] as HTMLElement;

          const anchors = page.querySelectorAll("a[href]");
          anchors.forEach((a) => {
            const anchor = a as HTMLAnchorElement;
            const href = anchor.getAttribute("href");
            if (!href || href.startsWith("#")) return;
            const fullUrl = href.startsWith("http") ? href : `https://JBJ.AE${href}`;
            const rect = anchor.getBoundingClientRect();
            const pageRect = page.getBoundingClientRect();
            const scale = pdfWidth / 794;
            const linkX = (rect.left - pageRect.left) * scale;
            const linkY = (rect.top - pageRect.top) * scale;
            const linkW = rect.width * scale;
            const linkH = rect.height * scale;
            if (linkW > 0 && linkH > 0) {
              linkAnnotations.push({ page: i, x: linkX, y: linkY, w: linkW, h: linkH, url: fullUrl });
            }
          });

          const isCoverPage = page.classList.contains('cover');
          const isBackCover = i === pages.length - 1 && page.style.background?.includes('#09090b');
          const bgColor = (isCoverPage || isBackCover) ? '#09090b' : '#FDFBF7';

          const canvas = await html2canvas(page, {
            scale: 1, useCORS: true, allowTaint: false, logging: false,
            width: 794, height: 1123, windowWidth: 794, backgroundColor: bgColor,
          });

          const imgData = canvas.toDataURL("image/jpeg", 0.82);
          if (i > 0) pdf.addPage();
          pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");

          canvas.width = 1;
          canvas.height = 1;
          await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
        }

        // Post-process with pdf-lib to add clickable link annotations
        const jspdfBytes = pdf.output("arraybuffer");
        const pdfDoc = await PDFDocument.load(jspdfBytes);
        const pdfPages = pdfDoc.getPages();

        for (const link of linkAnnotations) {
          const pdfPage = pdfPages[link.page];
          if (!pdfPage) continue;
          const pageHeight = pdfPage.getHeight();
          const pageWidth = pdfPage.getWidth();
          const ptScale = pageWidth / pdfWidth;
          const x = link.x * ptScale;
          const y = pageHeight - (link.y * ptScale) - (link.h * ptScale);
          const w = link.w * ptScale;
          const h = link.h * ptScale;

          pdfPage.node.addAnnot(
            pdfDoc.context.register(
              pdfDoc.context.obj({
                Type: 'Annot',
                Subtype: 'Link',
                Rect: [x, y, x + w, y + h],
                Border: [0, 0, 0],
                A: { Type: 'Action', S: 'URI', URI: link.url },
              })
            )
          );
        }

        const finalBytes = await pdfDoc.save();
        const blob = new Blob([new Uint8Array(finalBytes) as any], { type: "application/pdf" });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = "UAE-Real-Estate-Market-Intelligence-2026-JBJ-Global.pdf";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
      } finally {
        document.body.removeChild(container);
      }
    };

    try {
      await generatePDF();
      setDownloaded(true);
      toast.success("PDF downloaded successfully!");
      return true;
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Download failed. Please try again.");
      return false;
    } finally {
      if (existingWindow) {
        try { existingWindow.close(); } catch { /* ignore */ }
      }
      setIsGeneratingPdf(false);
    }
  };

  // Auto-download when navigated from BookDownloadDialog with ?auto-download=true
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("auto-download") === "true") {
      const url = new URL(window.location.href);
      url.searchParams.delete("auto-download");
      window.history.replaceState({}, "", url.pathname);
      const timer = setTimeout(() => {
        downloadBook().then((opened) => {
          if (opened) {
            toast.success("Your book is ready!");
          } else {
            toast.error("Couldn't open the book. Please try again.");
          }
        });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSubmit = async () => {
    if (!isValid || isSubmitting || isGeneratingPdf) return;

    setIsSubmitting(true);
    setShowThankYou(true);

    try {
      if (!isLeadCaptured && form.email) {
        await captureLead(
          {
            email: form.email,
            fullName: form.fullName,
            phone: form.phone,
            nationality: form.nationality,
            language: form.language,
          },
          "market_report_download",
          "client"
        );
      }

      void supabase.functions
        .invoke("send-market-report-email", {
          body: {
            fullName: form.fullName || leadData?.fullName,
            email: form.email || leadData?.email,
            phone: form.phone || leadData?.phone,
            nationality: form.nationality || leadData?.nationality,
            language: form.language || leadData?.language,
          },
        })
        .catch(console.error);

      const opened = await downloadBook();
      if (opened) {
        trackEvent("book_download", { form_source: "new_lead", page: "/market-report" });
        toast.success("Your book is ready!");
        setTimeout(() => setShowCTAModal(true), 2000);
      } else {
        toast.error("Couldn't open the book. Please try again.");
      }
    } catch (error) {
      console.error("Error during submission:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setShowThankYou(false);
      setIsSubmitting(false);
    }
  };

  const handleDirectDownload = async () => {
    const opened = await downloadBook();
    if (opened) {
      trackEvent("book_download", { form_source: "returning_lead", page: "/market-report" });
      void supabase.functions
        .invoke("send-market-report-email", {
          body: {
            fullName: leadData?.fullName,
            email: leadData?.email,
            phone: leadData?.phone,
            nationality: leadData?.nationality,
            language: leadData?.language,
            isReturning: true,
          },
        })
        .catch(console.error);
      toast.success("Your book is ready!");
      setTimeout(() => setShowCTAModal(true), 2000);
    } else {
      toast.error("Couldn't open the book. Please try again.");
    }
  };

  return {
    // Data
    countries,
    languages,
    form,
    setForm,
    // State
    downloaded,
    isSubmitting,
    isGeneratingPdf,
    showThankYou,
    bookHtml,
    setBookHtml,
    showBookPreview,
    setShowBookPreview,
    showCTAModal,
    setShowCTAModal,
    bookFrameRef,
    // Derived
    isValid,
    canDirectDownload,
    isLeadCaptured,
    leadData,
    isFounderVisible,
    // Actions
    handleSubmit,
    handleDirectDownload,
    buildInquiryUrl,
  };
}
