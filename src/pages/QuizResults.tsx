import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Sparkles, ArrowRight, Brain, Download, Award, Share2, Users, X, Mail, MessageCircle, Link as LinkIcon, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import FavoriteButton from "@/components/FavoriteButton";
import PricePill from "@/components/ui/price-pill";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PaymentModal } from "@/components/PaymentModal";
import { useMembership } from "@/hooks/useMembership";
import { useAuth } from "@/contexts/AuthContext";

const INQUIRY_FORM_URL = "https://jbj.ae/contact";
const JBJ_CONSULTANT_EMAIL = "CONTACT@JBJ.AE";
const JBJ_CONSULTANT_WHATSAPP = "971501234567"; // International format, no + or spaces

const AIHF_RESULTS_STYLE = `
  .aihf-results, .aihf-results :is(h1,h2,h3,h4,p,span,a,button,div), .aihf-results svg {
    color: #FFFFFF !important;
    -webkit-text-fill-color: #FFFFFF !important;
    opacity: 1 !important;
  }
  .aihf-results svg, .aihf-results svg * { stroke: #FFFFFF !important; }
  .aihf-results .aihf-muted { color: rgba(255,255,255,0.78) !important; -webkit-text-fill-color: rgba(255,255,255,0.78) !important; }
  .aihf-results .aihf-tiffany { color: #67E8F9 !important; -webkit-text-fill-color: #67E8F9 !important; }
  .aihf-results .aihf-panel {
    background: linear-gradient(135deg, rgba(8,47,73,0.78), rgba(3,30,24,0.90)) !important;
    border: 1px solid rgba(45,212,191,0.52) !important;
    box-shadow: 0 28px 80px rgba(34,211,238,0.18), inset 0 0 40px rgba(103,232,249,0.07) !important;
  }
  .aihf-results .aihf-tile {
    background: rgba(2,17,15,0.72) !important;
    border: 1px solid rgba(45,212,191,0.38) !important;
  }
  .aihf-results .aihf-cta, .aihf-results .aihf-cta:hover, .aihf-results .aihf-cta:focus-visible {
    background: linear-gradient(135deg, #5EEAD4 0%, #22D3EE 100%) !important;
    border: 1px solid rgba(103,232,249,0.80) !important;
    box-shadow: 0 18px 42px rgba(34,211,238,0.24) !important;
  }
  .aihf-results .aihf-cta, .aihf-results .aihf-cta *, .aihf-results .aihf-cta svg {
    color: #02110F !important;
    -webkit-text-fill-color: #02110F !important;
    stroke: #02110F !important;
  }
  .aihf-results .aihf-cta-glow {
    background: linear-gradient(135deg, #5EEAD4 0%, #22D3EE 55%, #0E7490 100%) !important;
    border: 1px solid rgba(103,232,249,0.95) !important;
    box-shadow:
      0 22px 48px rgba(34,211,238,0.45),
      0 0 32px rgba(94,234,212,0.55),
      inset 0 1px 0 rgba(255,255,255,0.45),
      inset 0 -3px 6px rgba(2,17,15,0.18) !important;
    transform: translateZ(0);
    transition: transform .25s ease, box-shadow .25s ease !important;
  }
  .aihf-results .aihf-cta-glow:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow:
      0 28px 60px rgba(34,211,238,0.6),
      0 0 48px rgba(94,234,212,0.75),
      inset 0 1px 0 rgba(255,255,255,0.55) !important;
  }
  .aihf-results .aihf-outline {
    background: rgba(5,28,24,0.82) !important;
    border: 1px solid rgba(45,212,191,0.55) !important;
  }
  .aihf-results .price-pill-premium, .aihf-results .price-pill-premium * {
    color: #1A1A1A !important;
    -webkit-text-fill-color: #1A1A1A !important;
  }
  .aihf-results .price-pill-value { color: var(--price-orange) !important; -webkit-text-fill-color: var(--price-orange) !important; }
`;



const QuizResults = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasActiveMembership } = useMembership();
  const [searchParams] = useSearchParams();
  const projectSlugs = searchParams.get("projects")?.split(",") || [];
  const isFreeUse = searchParams.get("free") === "true";
  const [badges, setBadges] = useState<Record<string, 'top1' | 'top2' | 'top3' | null>>({});
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareTrigger, setShareTrigger] = useState<"share" | "post-download">("share");
  const [showVipModal, setShowVipModal] = useState(false);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["quiz-results", projectSlugs],
    queryFn: async () => {
      if (!projectSlugs.length) return [];
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          developer:developers(id, name, slug, description, logo_url),
          images:project_images(id, image_url, alt_text, display_order),
          community:communities(id, name, slug),
          documents:project_documents(id, file_url, file_name, document_type)
        `)
        .in("slug", projectSlugs);

      if (error) throw error;

      // Filter sold-out client-side so NULL sale_status / is_sold_out rows are kept.
      const filtered = (data || []).filter((p: any) => {
        if (p.is_sold_out === true) return false;
        const status = (p.sale_status || "").toLowerCase();
        if (status.includes("sold")) return false;
        return true;
      });

      const normalized = filtered.map((p: any) => ({
        ...p,
        images: p.images?.length > 0
          ? p.images
          : p.cover_image_url
            ? [{ id: "cover", image_url: p.cover_image_url, alt_text: p.name, display_order: 0 }]
            : [],
      }));

      return normalized
        .sort((a, b) => projectSlugs.indexOf(a.slug) - projectSlugs.indexOf(b.slug));
    },
    enabled: projectSlugs.length > 0,
  });


  const handleSetBadge = (projectId: string, badge: 'top1' | 'top2' | 'top3' | null) => {
    setBadges(prev => ({ ...prev, [projectId]: badge }));
  };

  const badgeLabels = {
    top1: { label: "Top 1", sublabel: "Best", color: "bg-gradient-to-r from-[#5EEAD4] to-[#22D3EE] border-2 border-[#67E8F9] shadow-lg", textColor: "text-[#02110F]", medalColor: "text-[#67E8F9]" },
    top2: { label: "Top 2", sublabel: "Strong", color: "bg-gradient-to-r from-[#0E7490] to-[#22D3EE] border-2 border-[#67E8F9] shadow-lg", textColor: "text-white", medalColor: "text-[#5EEAD4]" },
    top3: { label: "Top 3", sublabel: "Fit", color: "bg-gradient-to-r from-[#031E18] to-[#0E7490] border-2 border-[#5EEAD4] shadow-lg", textColor: "text-white", medalColor: "text-[#22D3EE]" },
  };

  // Build a plain-text summary of recommendations (used by share channels)
  const buildShareText = (includeIntro = true) => {
    if (!projects?.length) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "https://jbj.ae";
    const lines = projects.map((p, i) => {
      const badge = badges[p.id];
      const badgeStr = badge ? ` [${badgeLabels[badge].label}]` : "";
      const price = p.price_from
        ? `AED ${(p.price_from / 1000000).toFixed(1)}M`
        : "Price on Request";
      const beds =
        p.bedrooms_min != null && p.bedrooms_max != null
          ? p.bedrooms_min === 0
            ? `Studio${p.bedrooms_max > 0 ? ` - ${p.bedrooms_max} BR` : ""}`
            : `${p.bedrooms_min} - ${p.bedrooms_max} BR`
          : "Type TBC";
      return [
        `#${i + 1} ${p.name}${badgeStr}`,
        `Developer: ${p.developer?.name || "N/A"}`,
        `Location: ${p.location || ""}, ${p.emirate || "UAE"}`,
        `Price: ${price}`,
        `Bedrooms: ${beds}`,
        `Handover: ${p.handover_date || "TBA"}`,
        `Link: ${origin}/project/${p.slug}`,
      ].join("\n");
    });
    const intro = includeIntro
      ? "JBJ Global Real Estate — AI Property Recommendations\n\n"
      : "";
    return intro + lines.join("\n\n");
  };

  // Build a real, branded PDF report via jsPDF
  // Load brand monogram as a data URL once per build
  const loadMonogram = async (): Promise<string | null> => {
    try {
      const res = await fetch("/jbj-monogram-light-on-dark.png");
      if (!res.ok) return null;
      const blob = await res.blob();
      return await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  // Build a real, branded PDF report via jsPDF (Tiffany comparison report)
  const buildPdf = async (): Promise<{ blob: Blob; filename: string } | null> => {
    if (!projects?.length) return null;

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    // Tiffany palette (matches on-screen tool)
    const ink: [number, number, number] = [2, 17, 15];
    const navy: [number, number, number] = [3, 30, 24];
    const tiffany: [number, number, number] = [34, 211, 238];
    const tiffanyLight: [number, number, number] = [94, 234, 212];
    const tiffanyDeep: [number, number, number] = [14, 116, 144];
    const tiffanyMuted: [number, number, number] = [205, 245, 245];
    const white: [number, number, number] = [255, 255, 255];

    const origin = typeof window !== "undefined" ? window.location.origin : "https://jbj.ae";
    const monogram = await loadMonogram();

    const drawPageBg = () => {
      // Deep-navy page (matches results screen)
      doc.setFillColor(...ink);
      doc.rect(0, 0, pageW, pageH, "F");
    };

    const drawHeader = () => {
      // Tiffany gradient band approximated with 3 stacked bars
      doc.setFillColor(...tiffanyLight);
      doc.rect(0, 0, pageW, 28, "F");
      doc.setFillColor(...tiffany);
      doc.rect(0, 28, pageW, 28, "F");
      doc.setFillColor(...tiffanyDeep);
      doc.rect(0, 56, pageW, 22, "F");

      // Monogram (left)
      if (monogram) {
        try {
          doc.addImage(monogram, "PNG", 36, 14, 50, 50);
        } catch {
          /* ignore */
        }
      }

      // Wordmark
      doc.setTextColor(...ink);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text("JBJ GLOBAL REAL ESTATE", monogram ? 100 : 36, 34);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("AI Home Finder — Personalized Recommendations", monogram ? 100 : 36, 50);

      // Date right
      doc.setTextColor(...ink);
      doc.setFontSize(8);
      doc.text(
        new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }),
        pageW - 36,
        50,
        { align: "right" }
      );
    };

    const drawFooter = (pageNum: number, total: number) => {
      doc.setDrawColor(...tiffany);
      doc.setLineWidth(0.6);
      doc.line(36, pageH - 50, pageW - 36, pageH - 50);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...tiffanyMuted);
      doc.text("Powered by JBJ Global Real Estate — Brokerage | Dubai, UAE", 36, pageH - 32);
      doc.text("CONTACT@JBJ.AE  ·  www.jbj.ae", 36, pageH - 20);
      doc.text(`Page ${pageNum} / ${total}`, pageW - 36, pageH - 20, { align: "right" });
    };

    drawPageBg();
    drawHeader();

    // Hero title block
    doc.setTextColor(...white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Your AI-Selected Properties", 36, 120);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...tiffanyMuted);
    doc.text("Side-by-side comparison of your top matches.", 36, 138);

    // Top-3 ranking pills
    const rankLabels = ["#1 Best Match", "#2 Strong Fit", "#3 Good Fit"];
    const top = projects.slice(0, 3);
    let pillX = 36;
    top.forEach((_, i) => {
      const w = 110;
      doc.setFillColor(...(i === 0 ? tiffanyLight : i === 1 ? tiffany : tiffanyDeep));
      doc.roundedRect(pillX, 152, w, 22, 11, 11, "F");
      doc.setTextColor(...ink);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(rankLabels[i], pillX + w / 2, 167, { align: "center" });
      pillX += w + 10;
    });

    // ---------- Comparison table ----------
    const headerRow = ["Attribute", ...top.map((p, i) => `#${i + 1}  ${p.name}`)];
    const fmtBeds = (p: any) =>
      p.bedrooms_min != null && p.bedrooms_max != null
        ? p.bedrooms_min === 0
          ? `Studio${p.bedrooms_max > 0 ? `–${p.bedrooms_max} BR` : ""}`
          : `${p.bedrooms_min}–${p.bedrooms_max} BR`
        : "Type TBC";
    const fmtSize = (p: any) =>
      p.size_min_sqft && p.size_max_sqft
        ? `${p.size_min_sqft.toLocaleString()}–${p.size_max_sqft.toLocaleString()} sq ft`
        : p.size_min_sqft
        ? `${p.size_min_sqft.toLocaleString()} sq ft+`
        : "—";
    const fmtPrice = (p: any) =>
      p.price_from ? `AED ${(p.price_from / 1000000).toFixed(1)}M` : "Price on Request";

    const rows: string[][] = [
      ["Developer", ...top.map((p) => p.developer?.name || "—")],
      ["Location", ...top.map((p) => `${p.location || ""}${p.emirate ? `, ${p.emirate}` : ""}`.trim() || "—")],
      ["Community", ...top.map((p) => p.community?.name || "—")],
      ["Price From", ...top.map(fmtPrice)],
      ["Bedrooms", ...top.map(fmtBeds)],
      ["Size Range", ...top.map(fmtSize)],
      ["Handover", ...top.map((p) => p.handover_date || "TBA")],
      ["Payment Plan", ...top.map((p) => p.payment_plan || "Contact Us")],
      ["Sale Status", ...top.map((p) => p.sale_status || "Available")],
      ["Listing", ...top.map((p) => `${origin}/project/${p.slug}`)],
    ];

    autoTable(doc, {
      startY: 188,
      margin: { left: 36, right: 36 },
      theme: "grid",
      head: [headerRow],
      body: rows,
      styles: {
        font: "helvetica",
        fontSize: 9,
        textColor: white,
        fillColor: navy,
        lineColor: tiffany,
        lineWidth: 0.3,
        cellPadding: 6,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: tiffany,
        textColor: ink,
        fontStyle: "bold",
        fontSize: 10,
        halign: "left",
      },
      alternateRowStyles: { fillColor: [6, 40, 34] },
      columnStyles: {
        0: { fontStyle: "bold", fillColor: [4, 56, 50], textColor: tiffanyMuted, cellWidth: 90 },
      },
      didDrawPage: () => {
        drawPageBg();
        drawHeader();
      },
    });

    // Per-property detail cards (one per page after comparison table)
    top.forEach((p, idx) => {
      doc.addPage();
      drawPageBg();
      drawHeader();

      // Card header
      doc.setFillColor(...tiffany);
      doc.roundedRect(36, 110, pageW - 72, 36, 6, 6, "F");
      doc.setTextColor(...ink);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(`#${idx + 1}  ${p.name}`, 48, 134);

      doc.setTextColor(...tiffanyMuted);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(rankLabels[idx], pageW - 48, 134, { align: "right" });

      autoTable(doc, {
        startY: 160,
        margin: { left: 36, right: 36 },
        theme: "grid",
        styles: {
          font: "helvetica",
          fontSize: 10,
          textColor: white,
          fillColor: navy,
          lineColor: tiffany,
          lineWidth: 0.3,
          cellPadding: 8,
        },
        headStyles: { fillColor: tiffanyDeep, textColor: white, fontStyle: "bold" },
        body: [
          ["Developer", p.developer?.name || "—"],
          ["Location", `${p.location || ""}${p.emirate ? `, ${p.emirate}` : ""}`.trim() || "—"],
          ["Community", p.community?.name || "—"],
          ["Price From", fmtPrice(p)],
          ["Bedrooms", fmtBeds(p)],
          ["Size Range", fmtSize(p)],
          ["Handover", p.handover_date || "TBA"],
          ["Payment Plan", p.payment_plan || "Contact Us"],
          ["Sale Status", p.sale_status || "Available"],
          ["Listing URL", `${origin}/project/${p.slug}`],
        ],
        columnStyles: {
          0: { cellWidth: 130, fontStyle: "bold", fillColor: [4, 56, 50], textColor: tiffanyMuted },
          1: { cellWidth: "auto" },
        },
      });
    });

    // Page numbers + footers
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      drawFooter(i, totalPages);
    }

    const sessionId =
      (typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("session")) ||
      "session";
    const filename = `JBJ-AI-Recommendations-${sessionId}-${Date.now()}.pdf`;
    const blob = doc.output("blob");
    return { blob, filename };
  };

  // Robust download — uses blob + anchor (doc.save() is unreliable inside preview iframes)
  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  // Cache the most recent generated PDF (blob + filename) so share handlers can attach it
  const [lastPdf, setLastPdf] = useState<{ blob: Blob; filename: string } | null>(null);

  const generateAndCachePdf = async () => {
    const built = await buildPdf();
    if (!built) {
      toast.error("Could not generate the report yet.");
      return null;
    }
    setLastPdf(built);
    return built;
  };

  const handleDownloadReport = async () => {
    const built = await generateAndCachePdf();
    if (!built) return;
    triggerDownload(built.blob, built.filename);
    toast.success("Report downloaded!");
    setShareTrigger("post-download");
    setShareModalOpen(true);
  };

  // "Share with Consultant" → generate PDF, auto-download, open share modal
  const handleOpenShare = async () => {
    const built = await generateAndCachePdf();
    if (built) {
      triggerDownload(built.blob, built.filename);
      toast.success("Report ready — choose how to share");
    }
    setShareTrigger("post-download");
    setShareModalOpen(true);
  };

  // Helper — Web Share API with file when supported, else fallback URL
  const shareWithFile = async (opts: {
    title: string;
    text: string;
    fallbackUrl: string;
    successMsg: string;
  }) => {
    let pdf = lastPdf;
    if (!pdf) pdf = await generateAndCachePdf();
    if (pdf) {
      try {
        const file = new File([pdf.blob], pdf.filename, { type: "application/pdf" });
        const nav: any = navigator;
        if (nav.canShare && nav.canShare({ files: [file] })) {
          await nav.share({ title: opts.title, text: opts.text, files: [file] });
          toast.success("Shared with PDF attached");
          return;
        }
      } catch {
        /* user cancelled or unsupported — fall through */
      }
      // Ensure file is at least on disk before opening fallback
      triggerDownload(pdf.blob, pdf.filename);
    }
    window.open(opts.fallbackUrl, "_blank", "noopener,noreferrer");
    toast.success(opts.successMsg);
  };

  // Channel handlers
  const handleShareWhatsApp = async () => {
    const text = buildShareText();
    await shareWithFile({
      title: "JBJ AI Property Recommendations",
      text,
      fallbackUrl: `https://wa.me/?text=${encodeURIComponent(
        `${text}\n\n(PDF report downloaded — attach it from your downloads.)`
      )}`,
      successMsg: "Opening WhatsApp — attach the downloaded PDF",
    });
  };

  const handleShareEmail = async () => {
    const subject = "My JBJ AI Property Recommendations";
    const text = buildShareText();
    await shareWithFile({
      title: subject,
      text,
      fallbackUrl: `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
        `${text}\n\n(PDF report downloaded — attach it to this email from your downloads.)`
      )}`,
      successMsg: "Opening email — attach the downloaded PDF",
    });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(buildShareText());
      toast.success("Recommendations copied to clipboard");
    } catch {
      toast.error("Unable to copy");
    }
  };

  const handleShareToConsultant = async () => {
    if (!projects?.length) return;
    const subject = "AI Property Recommendations — Request Consultation";
    const body = `Dear JBJ Global Real Estate Team,\n\nI have completed the AI Property Assessment and would like a consultation on the following recommendations:\n\n${buildShareText(
      false
    )}\n\nThe branded PDF report has been downloaded to my device and I will attach it to this email.\n\nBest regards`;
    await shareWithFile({
      title: subject,
      text: body,
      fallbackUrl: `mailto:${JBJ_CONSULTANT_EMAIL}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`,
      successMsg: "Opening email to JBJ — attach the downloaded PDF",
    });
  };

  const handleConsultantWhatsApp = async () => {
    const text = `Hello JBJ Global Real Estate,\n\nI just completed the AI Property Finder and would like a consultation on these recommendations:\n\n${buildShareText(
      false
    )}`;
    await shareWithFile({
      title: "AI Property Recommendations",
      text,
      fallbackUrl: `https://wa.me/${JBJ_CONSULTANT_WHATSAPP}?text=${encodeURIComponent(
        `${text}\n\n(PDF report downloaded — attach it from your downloads.)`
      )}`,
      successMsg: "Opening WhatsApp to JBJ — attach the downloaded PDF",
    });
  };



  if (isLoading) {
    return (
      <section className="aihf-results min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(180deg, #02110F 0%, #031E18 45%, #020B0A 100%)" }}>
        <style>{AIHF_RESULTS_STYLE}</style>
        <div className="text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <p className="text-xl font-semibold">Finding your perfect matches...</p>
        </div>
      </section>
    );
  }

  return (
    <section data-allow-dark-cta data-no-contrast-guard data-on-dark className="aihf-results min-h-screen py-12 md:py-20" style={{ background: "linear-gradient(180deg, #02110F 0%, #031E18 45%, #020B0A 100%)" }}>
      <style>{AIHF_RESULTS_STYLE}</style>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-6" style={{ background: "rgba(45,212,191,0.14)", borderColor: "rgba(103,232,249,0.52)" }}>
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">#1 AI Property Matchmaker — Exclusive by JBJ Global Real Estate</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Your AI-Selected Properties
          </h1>
          <p className="aihf-muted text-lg max-w-2xl mx-auto mb-6">
            Based on your preferences, our AI has selected these properties that best match your criteria
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              onClick={handleDownloadReport}
              data-no-contrast-guard
              className="aihf-cta font-semibold shadow-md hover:-translate-y-0.5 transition-all duration-300"
            >
              <Download className="w-4 h-4 mr-2" />

              Download Report
            </Button>
            <Button
              onClick={handleOpenShare}
              data-no-contrast-guard
              className="aihf-outline font-semibold"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share with Consultant
            </Button>
          </div>
        </div>


        {/* Top Recommendation */}
        {projects && projects.length > 0 && (
          <div className="mb-12">
            <div className="aihf-panel relative backdrop-blur-sm rounded-3xl overflow-hidden">
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                <div className="bg-gradient-to-r from-[#5EEAD4] to-[#22D3EE] text-sm font-semibold px-4 py-1.5 rounded-full">
                  #1 Best Match
                </div>
                {badges[projects[0].id] && (
                  <Badge className={`${badgeLabels[badges[projects[0].id]!].color} ${badgeLabels[badges[projects[0].id]!].textColor} font-semibold px-3 py-1`}>
                    <Award className="w-3 h-3 mr-1" />
                    {badgeLabels[badges[projects[0].id]!].label}
                  </Badge>
                )}
              </div>
              <div className="absolute top-4 right-4 z-10">
                <FavoriteButton projectId={projects[0].id} size="lg" />
              </div>
              
              <div className="grid md:grid-cols-2">
                <div className="aspect-[4/3] md:aspect-auto">
                  <img
                    src={projects[0].cover_image_url || projects[0].images?.[0]?.image_url || "https://placehold.co/800x600/F5F0E6/C9A84C?text=JBJ+Global"}
                    alt={projects[0].name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="p-8 md:p-10 flex flex-col justify-center">
                  <p className="aihf-muted text-sm mb-2">{projects[0].developer?.name}</p>
                  <h2 className="text-3xl font-bold mb-3">{projects[0].name}</h2>
                  <p className="aihf-muted mb-6">{projects[0].location}, {projects[0].emirate}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="aihf-tile rounded-xl p-4">
                      <p className="aihf-muted text-sm mb-2">Price From</p>
                      <PricePill price={projects[0].price_from} currency="AED" />
                    </div>
                    <div className="aihf-tile rounded-xl p-4">
                      <p className="aihf-muted text-sm">Bedrooms</p>
                      <p className="text-xl font-semibold">
                        {projects[0].bedrooms_min != null && projects[0].bedrooms_max != null
                          ? projects[0].bedrooms_min === 0
                            ? `Studio${projects[0].bedrooms_max > 0 ? ` - ${projects[0].bedrooms_max} BR` : ''}`
                            : `${projects[0].bedrooms_min} - ${projects[0].bedrooms_max} BR`
                          : "Type TBC"}
                      </p>
                    </div>
                  </div>

                  {/* Badge Assignment for #1 */}
                  <div className="flex items-center gap-3 mb-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="aihf-outline">
                          <Award className="w-4 h-4 mr-2" />
                          {badges[projects[0].id] ? 'Change Badge' : 'Add Badge'}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-[#FDFBF7] border-[#B89555]/30">
                        <DropdownMenuItem onClick={() => handleSetBadge(projects[0].id, 'top1')} className="text-[#B89555] hover:bg-[#B89555]/10">
                          Top 1 — Gold
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSetBadge(projects[0].id, 'top2')} className="text-[#888] hover:bg-[#B89555]/10">
                          Top 2 — Silver
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSetBadge(projects[0].id, 'top3')} className="text-[#CD7F32] hover:bg-[#B89555]/10">
                          Top 3 — Bronze
                        </DropdownMenuItem>
                        {badges[projects[0].id] && (
                          <DropdownMenuItem onClick={() => handleSetBadge(projects[0].id, null)} className="text-[#1A1A1A]/70 hover:bg-[#B89555]/10">
                            <X className="w-4 h-4 mr-2" /> Remove Badge
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <Link to={`/project/${projects[0].slug}`}>
                    <Button className="aihf-cta w-full md:w-auto font-semibold hover:-translate-y-0.5 transition-all duration-300">
                      View Property
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other Recommendations */}
        {projects && projects.length > 1 && (
          <div className="mb-12">
            <h3 className="text-xl font-semibold mb-6">More Great Options</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.slice(1).map((project, index) => {
                const badge = badges[project.id];
                const bedrooms = project.bedrooms_min != null && project.bedrooms_max != null
                  ? project.bedrooms_min === 0
                    ? `Studio${project.bedrooms_max > 0 ? ` - ${project.bedrooms_max} BR` : ''}`
                    : `${project.bedrooms_min} - ${project.bedrooms_max} BR`
                  : "Type TBC";
                return (
                  <div key={project.id} className="aihf-panel relative group flex flex-col h-full rounded-2xl overflow-hidden min-h-[420px]">
                    <div className="absolute top-3 left-3 z-10 rounded-full bg-gradient-to-r from-[#5EEAD4] to-[#22D3EE] px-3 py-1 shadow-md">
                      <span className="text-sm font-bold">#{index + 2}</span>
                    </div>
                    {badge && (
                      <div className="absolute top-3 left-16 z-10">
                        <Badge className={`${badgeLabels[badge].color} ${badgeLabels[badge].textColor} font-semibold px-2 py-0.5 text-xs`}>
                          {badgeLabels[badge].label}
                        </Badge>
                      </div>
                    )}
                    <div className="absolute top-3 right-3 z-10">
                      <FavoriteButton projectId={project.id} size="sm" showShortlist={true} />
                    </div>
                    <img
                      src={project.cover_image_url || project.images?.[0]?.image_url || "https://placehold.co/800x600/04161C/67E8F9?text=JBJ"}
                      alt={project.name}
                      className="aspect-[16/10] w-full object-cover"
                      loading="lazy"
                    />
                    <div className="flex flex-1 flex-col p-5">
                      <p className="aihf-muted text-sm mb-1">{project.developer?.name || "JBJ Global Real Estate"}</p>
                      <h4 className="text-lg font-bold leading-tight mb-2">{project.name}</h4>
                      <p className="aihf-muted text-sm mb-4">{project.location || "Dubai"}, {project.emirate || "UAE"}</p>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="aihf-tile rounded-xl p-3">
                          <p className="aihf-muted text-xs mb-2">Price</p>
                          <PricePill price={project.price_from} currency="AED" />
                        </div>
                        <div className="aihf-tile rounded-xl p-3">
                          <p className="aihf-muted text-xs">Bedrooms</p>
                          <p className="font-semibold">{bedrooms}</p>
                        </div>
                      </div>
                      <Link to={`/project/${project.slug}`} className="mt-auto">
                        <Button className="aihf-cta w-full font-semibold">
                          View Property
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                    {/* Badge Assignment */}
                    <div className="px-5 pb-5">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="aihf-outline w-full text-xs">
                            <Award className="w-3 h-3 mr-1" />
                            {badge ? 'Change Badge' : 'Add Badge'}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[#FDFBF7] border-[#B89555]/30">
                          <DropdownMenuItem onClick={() => handleSetBadge(project.id, 'top1')} className="text-[#B89555] hover:bg-[#B89555]/10">
                            Top 1 — Gold
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSetBadge(project.id, 'top2')} className="text-[#888] hover:bg-[#B89555]/10">
                            Top 2 — Silver
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSetBadge(project.id, 'top3')} className="text-[#CD7F32] hover:bg-[#B89555]/10">
                            Top 3 — Bronze
                          </DropdownMenuItem>
                          {badge && (
                            <DropdownMenuItem onClick={() => handleSetBadge(project.id, null)} className="text-[#1A1A1A]/70 hover:bg-[#B89555]/10">
                              <X className="w-3 h-3 mr-1" /> Remove
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Cards */}
        <div data-allow-dark-cta data-no-contrast-guard className="aihf-panel rounded-2xl p-6 mb-12">
          <h3 className="text-lg font-semibold mb-5 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Want More AI Power?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* AI Comparison Card */}
            <div className="aihf-tile rounded-2xl p-6 backdrop-blur-sm flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#5EEAD4] to-[#22D3EE] flex items-center justify-center shadow-md shadow-cyan-400/20">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold">AI Comparison</h3>
                  <p className="aihf-muted text-sm">Instant analysis</p>
                </div>
              </div>
              <p className="aihf-muted text-sm mb-4 flex-1">
                Generate an AI-powered comparison table with star ratings, price analysis, and recommendations.
              </p>
              <Link to="/compare">
                <Button className="aihf-cta w-full font-semibold">
                  Compare with AI
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Professional Evaluation Card */}
            <div className="aihf-tile rounded-2xl p-6 backdrop-blur-sm flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#5EEAD4] to-[#22D3EE] flex items-center justify-center shadow-md shadow-cyan-400/20">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Property Consultant</h3>
                  <p className="aihf-muted text-sm">Expert consultation</p>
                </div>
              </div>
              <p className="aihf-muted text-sm mb-4 flex-1">
                Request a personalized evaluation from our property consultants with detailed market insights.
              </p>
              <a href={INQUIRY_FORM_URL} target="_blank" rel="noopener noreferrer">
                <Button className="aihf-cta w-full font-semibold flex items-center justify-center gap-2">
                  <Users className="w-5 h-5" />
                  Request Evaluation
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
            </div>

            {/* Regenerate / AI Finder Card */}
            <div className="aihf-tile rounded-2xl p-6 backdrop-blur-sm flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#5EEAD4] to-[#22D3EE] flex items-center justify-center shadow-md shadow-cyan-400/20">
                  <Brain className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold">AI Home Finder</h3>
                  <p className="aihf-muted text-sm">New search</p>
                </div>
              </div>
              <p className="aihf-muted text-sm mb-4 flex-1">
                Not satisfied? Retake the AI quiz with different preferences to discover new matches.
              </p>
              <Button
                onClick={() => navigate("/quiz")}
                className="aihf-cta w-full font-semibold"
              >
                <Brain className="w-4 h-4 mr-2" />
                Regenerate with AI
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <Link to="/">
              <Button
                data-no-contrast-guard
                className="aihf-cta aihf-cta-glow font-bold px-10 py-6 text-base rounded-xl"
              >
                Browse All Properties
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
          <p className="text-[#1A1A1A]/70 text-xs">
            Powered & Made by{" "}
            <span className="text-[#1A1A1A] font-medium">JBJ Global Real Estate</span>
            {" "}— Brokerage | Dubai, UAE
          </p>
        </div>
      </div>

      {/* Share Modal — unified channels (WhatsApp / Email / Copy / JBJ Consultant) */}
      <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
        <DialogContent className="bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#1A1A1A]">
              <Share2 className="w-5 h-5 text-[#B89555]" />
              {shareTrigger === "post-download" ? "Share your report" : "Share your recommendations"}
            </DialogTitle>
            <DialogDescription className="text-[#1A1A1A]/70">
              {shareTrigger === "post-download"
                ? "Your PDF has been downloaded. You can also share these properties with anyone, or send them directly to a JBJ Consultant."
                : "Pick a channel to share the full list of AI recommendations."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="bg-[#F7F2EA] rounded-lg p-3 border border-[#B89555]/20 max-h-40 overflow-y-auto">
              <p className="text-[#1A1A1A]/70 text-xs mb-2">Properties included:</p>
              {projects?.map((p, i) => {
                const badge = badges[p.id];
                return (
                  <div key={p.id} className="flex items-center gap-2 text-sm py-0.5">
                    <span className="text-[#B89555] font-semibold">#{i + 1}</span>
                    {badge && (
                      <span className={badgeLabels[badge].medalColor}>
                        {badge === "top1" ? "(Gold)" : badge === "top2" ? "(Silver)" : "(Bronze)"}
                      </span>
                    )}
                    <span className="text-[#1A1A1A] truncate">{p.name}</span>
                  </div>
                );
              })}
            </div>

            {/* Channel grid */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleShareWhatsApp}
                variant="outline"
                className="bg-[#FDFBF7] text-[#1A1A1A] hover:bg-[#F7F2EA] hover:text-[#1A1A1A] border-[#B89555]/40 justify-start"
              >
                <MessageCircle className="w-4 h-4 mr-2 text-[#B89555]" />
                WhatsApp
              </Button>
              <Button
                onClick={handleShareEmail}
                variant="outline"
                className="bg-[#FDFBF7] text-[#1A1A1A] hover:bg-[#F7F2EA] hover:text-[#1A1A1A] border-[#B89555]/40 justify-start"
              >
                <Mail className="w-4 h-4 mr-2 text-[#B89555]" />
                Email
              </Button>
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="bg-[#FDFBF7] text-[#1A1A1A] hover:bg-[#F7F2EA] hover:text-[#1A1A1A] border-[#B89555]/40 justify-start"
              >
                <LinkIcon className="w-4 h-4 mr-2 text-[#B89555]" />
                Copy text
              </Button>
              <Button
                onClick={handleDownloadReport}
                variant="outline"
                className="bg-[#FDFBF7] text-[#1A1A1A] hover:bg-[#F7F2EA] hover:text-[#1A1A1A] border-[#B89555]/40 justify-start"
              >
                <Download className="w-4 h-4 mr-2 text-[#B89555]" />
                Download PDF
              </Button>
            </div>

            <div className="pt-2 border-t border-[#B89555]/20 space-y-2">
              <p className="text-[#1A1A1A] text-xs font-semibold flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#B89555]" />
                Send to a JBJ Consultant
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleShareToConsultant}
                  data-allow-dark-cta
                  className="bg-[#102540] text-white hover:bg-[#1a3d63] hover:text-white [&_svg]:text-white font-semibold border border-[#B89555]"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email JBJ
                </Button>
                <Button
                  onClick={handleConsultantWhatsApp}
                  data-allow-dark-cta
                  className="bg-[#102540] text-white hover:bg-[#1a3d63] hover:text-white [&_svg]:text-white font-semibold border border-[#B89555]"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp JBJ
                </Button>
              </div>
              <p className="text-[#1A1A1A]/60 text-[11px] text-center pt-1">
                Our consultants typically reply within 24 hours.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>



      {/* VIP Upgrade Modal */}
      <PaymentModal
        open={showVipModal}
        onOpenChange={setShowVipModal}
        onSuccess={() => {
          setShowVipModal(false);
          navigate("/quiz");
        }}
        userInfo={{
          fullName: user?.email?.split("@")[0] || "",
          email: user?.email || "",
          phone: "",
        }}
        mode="regenerate"
      />
    </section>
  );
};

export default QuizResults;
