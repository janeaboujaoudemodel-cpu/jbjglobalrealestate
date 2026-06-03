import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Sparkles, ArrowRight, Brain, Download, Award, Share2, Users, X, Mail, MessageCircle, Link as LinkIcon, Building2, RefreshCcw, ChevronDown } from "lucide-react";
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
import MatchCriteriaTable, { buildCriteriaRowsForExport, computeMatchTotals } from "@/components/matchmaker/MatchCriteriaTable";
import {
  type MatchmakerFormData,
  readMatchmakerSession,
  writeMatchmakerSession,
  clearMatchmakerSession,
} from "@/hooks/useMatchmakerSession";
import { buildPropertyPresentationParagraphs, findAmenityPhotoUrl } from "@/utils/matchmakerProse";

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
  /* Price pill — repaint inside AI Home Finder so it doesn't bleed champagne/gold */
  .aihf-results .price-pill-premium {
    background: linear-gradient(135deg, rgba(2,17,15,0.92) 0%, rgba(3,30,24,0.92) 100%) !important;
    border: 1px solid rgba(94,234,212,0.55) !important;
    box-shadow: inset 0 0 18px rgba(103,232,249,0.08) !important;
    max-width: 100% !important;
    flex-wrap: wrap !important;
    padding: 6px 10px !important;
  }
  .aihf-results .price-pill-eyebrow {
    color: #67E8F9 !important;
    -webkit-text-fill-color: #67E8F9 !important;
    background: rgba(94,234,212,0.12) !important;
    border-color: rgba(94,234,212,0.40) !important;
  }
  .aihf-results .price-pill-value {
    color: var(--price-orange) !important;
    -webkit-text-fill-color: var(--price-orange) !important;
  }
  /* Kill the global champagne-white hover flash on price pills inside results */
  .aihf-results .group:hover .price-pill-premium,
  .aihf-results .group:focus-within .price-pill-premium,
  .aihf-results .price-pill-premium:hover,
  .aihf-results .price-pill-premium:focus-visible {
    background: linear-gradient(135deg, rgba(2,17,15,0.95) 0%, rgba(3,30,24,0.95) 100%) !important;
    border-color: rgba(94,234,212,0.85) !important;
    box-shadow: 0 10px 26px rgba(34,211,238,0.30), inset 0 0 18px rgba(103,232,249,0.12) !important;
  }
  .aihf-results .group:hover .price-pill-premium .price-pill-eyebrow,
  .aihf-results .group:focus-within .price-pill-premium .price-pill-eyebrow,
  .aihf-results .price-pill-premium:hover .price-pill-eyebrow {
    color: #67E8F9 !important;
    -webkit-text-fill-color: #67E8F9 !important;
    opacity: 1 !important;
  }
  .aihf-results .group:hover .price-pill-premium .price-pill-value,
  .aihf-results .group:focus-within .price-pill-premium .price-pill-value,
  .aihf-results .price-pill-premium:hover .price-pill-value {
    color: var(--price-orange) !important;
    -webkit-text-fill-color: var(--price-orange) !important;
  }
  /* Favorite/Heart + shortlist + Add-Badge buttons — Tiffany cyan inside results.
     FavoriteButton renders .jj-favorite-trigger; ShortlistBadgeButton's trigger
     is targeted via its lucide-award child icon. */
  .aihf-results .jj-favorite-trigger,
  .aihf-results button:has(> svg.lucide-award) {
    background: linear-gradient(135deg, rgba(2,17,15,0.78) 0%, rgba(3,30,24,0.82) 100%) !important;
    border: 1px solid rgba(94,234,212,0.55) !important;
    box-shadow: 0 6px 18px rgba(34,211,238,0.18), inset 0 0 12px rgba(103,232,249,0.08) !important;
  }
  .aihf-results .jj-favorite-trigger:hover,
  .aihf-results button:has(> svg.lucide-award):hover {
    border-color: rgba(94,234,212,0.95) !important;
    box-shadow: 0 10px 26px rgba(34,211,238,0.35), inset 0 0 16px rgba(103,232,249,0.14) !important;
  }
  .aihf-results .jj-favorite-trigger svg,
  .aihf-results button:has(> svg.lucide-award) svg {
    stroke: #5EEAD4 !important;
    color: #5EEAD4 !important;
    filter: drop-shadow(0 0 6px rgba(94,234,212,0.45));
  }
  .aihf-results button:has(> svg.lucide-award) span {
    color: #5EEAD4 !important;
    -webkit-text-fill-color: #5EEAD4 !important;
  }
  /* Favorited heart: keep the saved state legible with a Tiffany-friendly pink */
  .aihf-results .jj-favorite-trigger svg.fill-red-500,
  .aihf-results .jj-favorite-trigger svg[fill="currentColor"].text-red-500 {
    fill: #FF6B8A !important;
    stroke: #FF6B8A !important;
    color: #FF6B8A !important;
  }
  /* Tiffany dropdown menu (Add Badge) — global, NOT scoped to .aihf-results
     because Radix portals the menu outside the page root. */
  [data-aihf-menu],
  [data-aihf-menu][role="menu"] {
    background: linear-gradient(160deg, #04161C 0%, #031E18 100%) !important;
    background-color: #04161C !important;
    border: 1px solid rgba(94,234,212,0.55) !important;
    box-shadow: 0 20px 50px rgba(34,211,238,0.25) !important;
    color: #FFFFFF !important;
  }
  [data-aihf-menu] [role="menuitem"],
  [data-aihf-menu] [role="menuitem"] * {
    background-color: transparent !important;
    color: #FFFFFF !important;
    -webkit-text-fill-color: #FFFFFF !important;
  }
  [data-aihf-menu] [role="menuitem"][data-medal="gold"],
  [data-aihf-menu] [role="menuitem"][data-medal="gold"] * { color: #FFD27A !important; -webkit-text-fill-color: #FFD27A !important; }
  [data-aihf-menu] [role="menuitem"][data-medal="silver"],
  [data-aihf-menu] [role="menuitem"][data-medal="silver"] * { color: #E8F0FF !important; -webkit-text-fill-color: #E8F0FF !important; }
  [data-aihf-menu] [role="menuitem"][data-medal="bronze"],
  [data-aihf-menu] [role="menuitem"][data-medal="bronze"] * { color: #FFB07A !important; -webkit-text-fill-color: #FFB07A !important; }
  [data-aihf-menu] [role="menuitem"][data-medal="remove"],
  [data-aihf-menu] [role="menuitem"][data-medal="remove"] * { color: #FF8FA3 !important; -webkit-text-fill-color: #FF8FA3 !important; }
  [data-aihf-menu] [role="menuitem"]:hover,
  [data-aihf-menu] [role="menuitem"]:focus,
  [data-aihf-menu] [role="menuitem"][data-highlighted] {
    background: rgba(94,234,212,0.18) !important;
    color: #67E8F9 !important;
    -webkit-text-fill-color: #67E8F9 !important;
  }
  [data-aihf-menu] [role="menuitem"]:hover *,
  [data-aihf-menu] [role="menuitem"]:focus *,
  [data-aihf-menu] [role="menuitem"][data-highlighted] * {
    color: #67E8F9 !important;
    -webkit-text-fill-color: #67E8F9 !important;
  }

  /* Share dialog X close — Tiffany glow pill (override shadcn's champagne/gold default).
     The shadcn DialogContent renders <DialogPrimitive.Close> as a direct <button>
     child with a sr-only "Close" span — no aria-label. We target it as the
     absolute-positioned direct button child of our aihf dialog. */
  [data-aihf-dialog] > button,
  .aihf-results > button[aria-label="Close"] {
    background: linear-gradient(135deg, rgba(94,234,212,0.18) 0%, rgba(34,211,238,0.22) 100%) !important;
    background-image: linear-gradient(135deg, rgba(94,234,212,0.18) 0%, rgba(34,211,238,0.22) 100%) !important;
    border: 1px solid rgba(94,234,212,0.75) !important;
    border-radius: 9999px !important;
    opacity: 1 !important;
    box-shadow:
      0 0 18px rgba(94,234,212,0.55),
      inset 0 0 10px rgba(103,232,249,0.18) !important;
    color: #67E8F9 !important;
  }
  [data-aihf-dialog] > button:hover,
  .aihf-results > button[aria-label="Close"]:hover {
    background: linear-gradient(135deg, rgba(94,234,212,0.32) 0%, rgba(34,211,238,0.36) 100%) !important;
    background-image: linear-gradient(135deg, rgba(94,234,212,0.32) 0%, rgba(34,211,238,0.36) 100%) !important;
    border-color: rgba(103,232,249,0.95) !important;
    box-shadow:
      0 0 28px rgba(94,234,212,0.85),
      inset 0 0 14px rgba(103,232,249,0.28) !important;
    transform: translateY(-1px);
  }
  [data-aihf-dialog] > button svg,
  [data-aihf-dialog] > button svg *,
  .aihf-results > button[aria-label="Close"] svg,
  .aihf-results > button[aria-label="Close"] svg * {
    color: #5EEAD4 !important;
    stroke: #5EEAD4 !important;
    -webkit-text-fill-color: #5EEAD4 !important;
    filter: drop-shadow(0 0 6px rgba(94,234,212,0.7));
  }
`;



const QuizResults = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasActiveMembership } = useMembership();
  const [searchParams, setSearchParams] = useSearchParams();
  const projectSlugs = searchParams.get("projects")?.split(",").filter(Boolean) || [];
  const tierParam = (searchParams.get("tier") || "exact") as
    | "exact" | "close" | "nearest" | "fallback";
  const isFreeUse = searchParams.get("free") === "true";
  const [badges, setBadges] = useState<Record<string, 'top1' | 'top2' | 'top3' | null>>({});
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareTrigger, setShareTrigger] = useState<"share" | "post-download">("share");
  const [showVipModal, setShowVipModal] = useState(false);
  const [sessionAnswers, setSessionAnswers] = useState<Record<string, string | string[]>>({});
  const [matchmakerFormData, setMatchmakerFormData] = useState<MatchmakerFormData | null>(null);

  // Hydrate from persisted matchmaker session: restore answers + recover URL slugs after refresh
  useEffect(() => {
    const s = readMatchmakerSession();
    if (s?.answers) setSessionAnswers(s.answers);
    if (s?.formData) setMatchmakerFormData(s.formData);
    if (!projectSlugs.length && s?.resultSlugs?.length) {
      const params = new URLSearchParams();
      params.set("projects", s.resultSlugs.join(","));
      params.set("session", s.sessionId);
      if (s.resultTiers?.[0]) params.set("tier", s.resultTiers[0]);
      params.set("free", "true");
      setSearchParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startNewMatch = () => {
    clearMatchmakerSession();
    navigate("/quiz");
  };


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

  // Load any image URL as a data URL (CORS-friendly Supabase/storage images).
  // Returns null on failure so the PDF still renders.
  const loadImageAsDataUrl = async (
    url?: string | null,
    timeoutMs = 5000
  ): Promise<{ data: string; w: number; h: number; type: "JPEG" | "PNG" } | null> => {
    if (!url) return null;
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeoutMs);
      const res = await fetch(url, { signal: ctrl.signal, mode: "cors" });
      clearTimeout(t);
      if (!res.ok) return null;
      const blob = await res.blob();
      const dataUrl: string = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onloadend = () => resolve(r.result as string);
        r.onerror = reject;
        r.readAsDataURL(blob);
      });
      const dims = await new Promise<{ w: number; h: number }>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = reject;
        img.src = dataUrl;
      });
      const type: "JPEG" | "PNG" = /png/i.test(blob.type) ? "PNG" : "JPEG";
      return { data: dataUrl, w: dims.w, h: dims.h, type };
    } catch {
      return null;
    }
  };

  // Build a real, branded PDF report via jsPDF (Tiffany presentation report)
  const buildPdf = async (): Promise<{ blob: Blob; filename: string } | null> => {
    if (!projects?.length) return null;

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    // Tiffany palette — single family used everywhere
    const ink: [number, number, number] = [2, 17, 15];
    const inkDeep: [number, number, number] = [4, 22, 28];
    const navy: [number, number, number] = [3, 30, 24];
    const tiffany: [number, number, number] = [34, 211, 238];
    const tiffanyLight: [number, number, number] = [94, 234, 212];
    const tiffanyDeep: [number, number, number] = [14, 116, 144];
    const tiffanyMuted: [number, number, number] = [205, 245, 245];
    const tiffanyDim: [number, number, number] = [160, 215, 220];
    const white: [number, number, number] = [255, 255, 255];

    const M = 36;
    const HEADER_H = 78;
    const FOOTER_H = 46;
    const CONTENT_TOP = HEADER_H + 26; // first usable y
    const CONTENT_BOTTOM = pageH - FOOTER_H - 8;

    const origin = typeof window !== "undefined" ? window.location.origin : "https://jbj.ae";
    const dateStr = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    const clientName = (matchmakerFormData?.fullName || "").trim();
    const preparedLine = clientName ? `Prepared for ${clientName} · ${dateStr}` : `Prepared exclusively · ${dateStr}`;
    const monogram = await loadMonogram();

    const drawOmbreWordmark = (text: string, x: number, y: number) => {
      const segments = ["JBJ ", "GLOBAL ", "REAL ", "ESTATE"];
      const colors: [number, number, number][] = [
        [94, 234, 212],
        [34, 211, 238],
        [14, 165, 233],
        [3, 105, 161],
      ];
      doc.setFillColor(5, 42, 48);
      doc.roundedRect(x - 4, y - 13, doc.getTextWidth(text) + 10, 18, 6, 6, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      let cursor = x;
      segments.forEach((segment, idx) => {
        doc.setTextColor(...colors[idx]);
        doc.text(segment, cursor, y);
        cursor += doc.getTextWidth(segment);
      });
    };

    const drawPageBg = () => {
      doc.setFillColor(...ink);
      doc.rect(0, 0, pageW, pageH, "F");
      // Subtle tiffany glow line near top edge
      doc.setDrawColor(...tiffanyDeep);
      doc.setLineWidth(0.4);
      doc.line(0, HEADER_H, pageW, HEADER_H);
    };

    const drawHeader = () => {
      // Single clean Tiffany band — no triple-stripe
      doc.setFillColor(...inkDeep);
      doc.rect(0, 0, pageW, HEADER_H, "F");

      // Tiffany hairline accent under monogram chip
      doc.setDrawColor(...tiffany);
      doc.setLineWidth(0.6);
      doc.line(0, HEADER_H - 0.5, pageW, HEADER_H - 0.5);

      // Monogram chip — ink square + tiffany hairline ring
      const chipSize = 54;
      const chipX = M;
      const chipY = (HEADER_H - chipSize) / 2;
      doc.setFillColor(...ink);
      doc.roundedRect(chipX, chipY, chipSize, chipSize, 8, 8, "F");
      doc.setDrawColor(...tiffanyLight);
      doc.setLineWidth(0.7);
      doc.roundedRect(chipX, chipY, chipSize, chipSize, 8, 8, "S");
      if (monogram) {
        try {
          doc.addImage(monogram, "PNG", chipX + 5, chipY + 5, chipSize - 10, chipSize - 10);
        } catch {
          /* ignore */
        }
      }

      // Wordmark + tagline
      const tx = chipX + chipSize + 14;
      drawOmbreWordmark("JBJ GLOBAL REAL ESTATE", tx, chipY + 22);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...tiffanyLight);
      doc.text("AI Home Finder  |  Personalized Recommendations", tx, chipY + 38);

      // Prepared-for line, not a confidentiality warning
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...tiffanyDim);
      doc.text(preparedLine, pageW - M, chipY + 22, { align: "right" });
      doc.setTextColor(...tiffanyDim);
      doc.setFontSize(7.5);
      doc.text("Curated by JBJ GLOBAL REAL ESTATE", pageW - M, chipY + 38, {
        align: "right",
      });
    };

    const drawFooter = (pageNum: number, total: number) => {
      // Tiffany hairline
      doc.setDrawColor(...tiffany);
      doc.setLineWidth(0.5);
      doc.line(0, pageH - FOOTER_H, pageW, pageH - FOOTER_H);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...tiffanyMuted);
      doc.text(
        "Powered by JBJ GLOBAL REAL ESTATE  —  Brokerage  |  Dubai, UAE",
        M,
        pageH - FOOTER_H + 16
      );
      // Clickable contact links
      const emailLabel = "CONTACT@JBJ.AE";
      const sep = "  |  ";
      const webLabel = "www.jbj.ae";
      doc.setTextColor(...tiffanyLight);
      doc.setFont("helvetica", "bold");
      doc.text(emailLabel, M, pageH - FOOTER_H + 30);
      const emailW = doc.getTextWidth(emailLabel);
      // underline
      doc.setDrawColor(...tiffanyLight);
      doc.setLineWidth(0.5);
      doc.line(M, pageH - FOOTER_H + 32, M + emailW, pageH - FOOTER_H + 32);
      doc.link(M, pageH - FOOTER_H + 22, emailW, 12, {
        url: "mailto:contact@jbj.ae",
      });
      doc.setTextColor(...tiffanyMuted);
      doc.setFont("helvetica", "normal");
      doc.text(sep, M + emailW, pageH - FOOTER_H + 30);
      const sepW = doc.getTextWidth(sep);
      doc.setTextColor(...tiffanyLight);
      doc.setFont("helvetica", "bold");
      doc.text(webLabel, M + emailW + sepW, pageH - FOOTER_H + 30);
      const webW = doc.getTextWidth(webLabel);
      doc.line(
        M + emailW + sepW,
        pageH - FOOTER_H + 32,
        M + emailW + sepW + webW,
        pageH - FOOTER_H + 32
      );
      doc.link(M + emailW + sepW, pageH - FOOTER_H + 22, webW, 12, {
        url: "https://www.jbj.ae",
      });

      doc.setFont("helvetica", "normal");
      doc.setTextColor(...tiffanyDim);
      doc.text(`Page ${pageNum} / ${total}`, pageW - M, pageH - FOOTER_H + 30, {
        align: "right",
      });
    };

    // Draw a tiffany-underlined clickable hyperlink at (x,y) and return its width.
    const drawHyperlink = (label: string, url: string, x: number, y: number, size = 9.5) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(size);
      doc.setTextColor(...tiffanyLight);
      doc.text(label, x, y);
      const w = doc.getTextWidth(label);
      doc.setDrawColor(...tiffanyLight);
      doc.setLineWidth(0.5);
      doc.line(x, y + 2, x + w, y + 2);
      doc.link(x, y - size + 1, w, size + 2, { url });
      return w;
    };

    // Word-wrap text and return the new y after drawing.
    const drawWrapped = (
      text: string,
      x: number,
      y: number,
      maxW: number,
      lineH: number,
      color: [number, number, number] = white,
      size = 10,
      weight: "normal" | "bold" = "normal"
    ): number => {
      if (!text) return y;
      doc.setFont("helvetica", weight);
      doc.setFontSize(size);
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(text, maxW) as string[];
      for (const ln of lines) {
        doc.text(ln, x, y);
        y += lineH;
      }
      return y;
    };

    // Strip HTML tags from rich descriptions stored in DB.
    const stripHtml = (s?: string | null) =>
      (s || "")
        .replace(/<style[^>]*>.*?<\/style>/gis, "")
        .replace(/<script[^>]*>.*?<\/script>/gis, "")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&#39;|&apos;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/\n{3,}/g, "\n\n")
        .trim();

    const top = projects.slice(0, 3);
    const rankLabels = ["#1 Best Match", "#2 Strong Fit", "#3 Good Fit"];
    const rankFills: [number, number, number][] = [tiffanyLight, tiffany, tiffanyDeep];

    const fmtBeds = (p: any) =>
      p.bedrooms_min != null && p.bedrooms_max != null
        ? p.bedrooms_min === 0
          ? `Studio${p.bedrooms_max > 0 ? `-${p.bedrooms_max} BR` : ""}`
          : `${p.bedrooms_min}-${p.bedrooms_max} BR`
        : "Type TBC";
    const fmtSize = (p: any) =>
      p.size_min_sqft && p.size_max_sqft
        ? `${p.size_min_sqft.toLocaleString()}-${p.size_max_sqft.toLocaleString()} sq ft`
        : p.size_min_sqft
        ? `${p.size_min_sqft.toLocaleString()} sq ft+`
        : "—";
    const fmtPrice = (p: any) => {
      if (!p.price_from) return "Price on Request";
      const lo = `AED ${(p.price_from / 1_000_000).toFixed(1)}M`;
      if (p.price_to && p.price_to > p.price_from) {
        return `${lo} - AED ${(p.price_to / 1_000_000).toFixed(1)}M`;
      }
      return `From ${lo}`;
    };

    // Pre-load cover images for the top properties (parallel, non-blocking failures).
    const covers = await Promise.all(
      top.map((p) =>
        loadImageAsDataUrl(
          p.cover_image_url || p.images?.[0]?.image_url || null
        )
      )
    );

    // ============= PAGE 1 — COVER =============
    drawPageBg();
    drawHeader();

    let y = CONTENT_TOP;

    // Tiffany "AI Property Matchmaker" eyebrow chip
    doc.setFillColor(20, 70, 80);
    doc.setDrawColor(...tiffanyLight);
    doc.setLineWidth(0.6);
    const chipText = "AI PROPERTY MATCHMAKER  |  EXCLUSIVE BY JBJ";
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    const chipW = doc.getTextWidth(chipText) + 22;
    doc.roundedRect(M, y, chipW, 20, 10, 10, "FD");
    doc.setTextColor(...tiffanyLight);
    doc.text(chipText, M + 11, y + 13.5);
    y += 38;

    // Title
    doc.setTextColor(...white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.text("Your AI-Selected Properties", M, y);
    y += 22;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...tiffanyMuted);
    y = drawWrapped(
      "A curated shortlist of the top properties from our inventory, ranked against your exact requirements. Each property is presented in full on the following pages — with photos, key details, and direct listing links.",
      M,
      y,
      pageW - 2 * M,
      15,
      tiffanyMuted,
      11
    );
    y += 12;

    // Three rank cards
    const cardGap = 12;
    const cardW = (pageW - 2 * M - 2 * cardGap) / 3;
    const cardH = 230;
    top.forEach((p, i) => {
      const cx = M + i * (cardW + cardGap);
      const cy = y;

      // Card bg
      doc.setFillColor(5, 34, 38);
      doc.setDrawColor(...tiffanyDeep);
      doc.setLineWidth(0.7);
      doc.roundedRect(cx, cy, cardW, cardH, 10, 10, "FD");

      // Photo area
      const imgH = 110;
      doc.setFillColor(8, 50, 60);
      doc.roundedRect(cx + 8, cy + 8, cardW - 16, imgH, 6, 6, "F");
      const cov = covers[i];
      if (cov) {
        try {
          doc.addImage(
            cov.data,
            cov.type,
            cx + 8,
            cy + 8,
            cardW - 16,
            imgH,
            undefined,
            "FAST"
          );
        } catch {
          /* placeholder */
        }
      } else {
        doc.setTextColor(...tiffanyLight);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("JBJ", cx + cardW / 2, cy + 8 + imgH / 2 + 3, { align: "center" });
      }

      // Rank pill (over photo, top-left)
      doc.setFillColor(...rankFills[i]);
      const rankLabel = rankLabels[i];
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      const rW = doc.getTextWidth(rankLabel) + 14;
      doc.roundedRect(cx + 14, cy + 14, rW, 16, 8, 8, "F");
      doc.setTextColor(...ink);
      doc.text(rankLabel, cx + 14 + rW / 2, cy + 25, { align: "center" });

      // Name
      let ty = cy + 8 + imgH + 18;
      doc.setTextColor(...white);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      const nameLines = doc.splitTextToSize(p.name || "—", cardW - 20) as string[];
      const trimmedName = nameLines.slice(0, 2);
      trimmedName.forEach((ln) => {
        doc.text(ln, cx + 12, ty);
        ty += 13;
      });

      // Developer
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...tiffanyDim);
      doc.text(
        doc.splitTextToSize(`by ${p.developer?.name || "—"}`, cardW - 20)[0],
        cx + 12,
        ty
      );
      ty += 14;

      // Price
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(...tiffanyLight);
      doc.text(fmtPrice(p), cx + 12, ty);
      ty += 12;

      // Bedrooms
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...tiffanyMuted);
      doc.text(fmtBeds(p), cx + 12, ty);
    });
    y += cardH + 18;

    // What's inside this report
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...tiffanyLight);
    doc.text("What's inside this report", M, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...tiffanyMuted);
    const bullets = [
      "How each property matches your stated requirements (Page 2).",
      "Full presentation for each property: photos, key facts, payment plan, listing link.",
      "Direct contact line to a JBJ Consultant for questions or viewing requests.",
    ];
    bullets.forEach((b) => {
      doc.setTextColor(...tiffanyLight);
      doc.text("•", M, y);
      doc.setTextColor(...tiffanyMuted);
      y = drawWrapped(b, M + 12, y, pageW - 2 * M - 12, 14, tiffanyMuted, 10) + 2;
    });

    // ============= PAGE 2 — MATCH CRITERIA TABLE =============
    const criteriaRows = buildCriteriaRowsForExport(sessionAnswers, top);
    if (criteriaRows.length > 0) {
      doc.addPage();
      drawPageBg();
      drawHeader();

      let cy = CONTENT_TOP;
      doc.setTextColor(...white);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("How each property matches your requirements", M, cy);
      cy += 18;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(...tiffanyMuted);
      doc.text(
        "MATCH = exact   |   CLOSE = close fit   |   MISS = does not match.  Actual value shown in each cell.",
        M,
        cy
      );
      cy += 18;

      // Tiffany-only verdict palette (no orange/red/green/gold)
      const verdictLabel = (v: "match" | "close" | "miss") =>
        v === "match" ? "MATCH" : v === "close" ? "CLOSE" : "MISS";
      const verdictFill = (v: "match" | "close" | "miss"): [number, number, number] =>
        v === "match"
          ? [10, 80, 75]
          : v === "close"
          ? [8, 55, 70]
          : [10, 30, 40];
      const verdictText = (v: "match" | "close" | "miss"): [number, number, number] =>
        v === "match" ? tiffanyLight : v === "close" ? tiffanyDim : [140, 175, 180];

      const cHead = [
        "Your Requirement",
        ...top.map((p, i) => `#${i + 1}  ${p.name}`),
      ];
      const cBody = criteriaRows.map((row) => [
        `${row.label}\n${row.userPick}`,
        ...row.cells.map((c) => `${verdictLabel(c.verdict)}\n${c.value}`),
      ]);
      const totals = top.map((_, i) => computeMatchTotals(criteriaRows, i));
      cBody.push([
        "MATCH SUMMARY\nWhy we ranked them this way",
        ...totals.map(
          (t) =>
            `${t.match} matched  |  ${t.close} close  |  ${t.miss} missed\n${t.match}/${t.total} criteria met`
        ),
      ]);

      autoTable(doc, {
        startY: cy,
        margin: { left: M, right: M, bottom: FOOTER_H + 12 },
        theme: "grid",
        head: [cHead],
        body: cBody,
        styles: {
          font: "helvetica",
          fontSize: 9.5,
          textColor: white,
          fillColor: [4, 24, 28],
          lineColor: [16, 90, 100],
          lineWidth: 0.3,
          cellPadding: 9,
          minCellHeight: 30,
          overflow: "linebreak",
          valign: "middle",
          halign: "left",
        },
        headStyles: {
          fillColor: tiffany,
          textColor: ink,
          fontStyle: "bold",
          fontSize: 10.5,
          cellPadding: 9,
          halign: "left",
          valign: "middle",
        },
        columnStyles: {
          0: {
            fontStyle: "bold",
            fillColor: [4, 56, 60],
            textColor: tiffanyMuted,
            cellWidth: 130,
          },
        },
        didParseCell: (data) => {
          if (
            data.section === "body" &&
            data.column.index > 0 &&
            data.row.index < criteriaRows.length
          ) {
            const v = criteriaRows[data.row.index]?.cells[data.column.index - 1]?.verdict;
            if (v) {
              data.cell.styles.fillColor = verdictFill(v);
              data.cell.styles.textColor = verdictText(v);
              data.cell.styles.fontStyle = "bold";
            }
          }
          if (data.section === "body" && data.row.index === criteriaRows.length) {
            data.cell.styles.fillColor = [6, 60, 70];
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.textColor = tiffanyLight;
          }
        },
      });
    }

    // ============= PER-PROPERTY PRESENTATION PAGES =============
    for (let idx = 0; idx < top.length; idx++) {
      const p = top[idx];
      doc.addPage();
      drawPageBg();
      drawHeader();

      let py = CONTENT_TOP;

      // Rank + name banner
      doc.setFillColor(8, 56, 64);
      doc.setDrawColor(...tiffanyLight);
      doc.setLineWidth(0.7);
      doc.roundedRect(M, py, pageW - 2 * M, 50, 10, 10, "FD");

      // Rank pill on the left
      doc.setFillColor(...rankFills[idx]);
      const rl = rankLabels[idx];
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      const rlW = doc.getTextWidth(rl) + 18;
      doc.roundedRect(M + 14, py + 14, rlW, 22, 11, 11, "F");
      doc.setTextColor(...ink);
      doc.text(rl, M + 14 + rlW / 2, py + 29, { align: "center" });

      // Name + developer
      doc.setTextColor(...white);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text(p.name || "—", M + 14 + rlW + 14, py + 22);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...tiffanyLight);
      doc.text(
        `by ${p.developer?.name || "—"}`,
        M + 14 + rlW + 14,
        py + 38
      );

      // Date right
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...tiffanyDim);
      doc.text(dateStr, pageW - M - 14, py + 22, { align: "right" });

      py += 50 + 14;

      // Hero photo (full width) — only if available
      const cov = covers[idx];
      if (cov) {
        const imgW = pageW - 2 * M;
        const aspect = cov.h / cov.w || 0.6;
        let imgH = Math.min(220, imgW * aspect);
        doc.setFillColor(8, 50, 60);
        doc.roundedRect(M, py, imgW, imgH, 8, 8, "F");
        try {
          doc.addImage(cov.data, cov.type, M, py, imgW, imgH, undefined, "FAST");
        } catch {
          /* ignore */
        }
        // Tiffany hairline frame
        doc.setDrawColor(...tiffanyLight);
        doc.setLineWidth(0.6);
        doc.roundedRect(M, py, imgW, imgH, 8, 8, "S");
        py += imgH + 14;
      }

      // Key facts (2-column grid, drawn manually so it never looks like Excel)
      const facts: Array<[string, string]> = [
        ["Location", `${p.location || ""}${p.emirate ? `, ${p.emirate}` : ""}`.trim() || "—"],
        ["Community", p.community?.name || "—"],
        ["Price", fmtPrice(p)],
        ["Bedrooms", fmtBeds(p)],
        ["Size Range", fmtSize(p)],
        ["Handover", p.handover_date || "TBA"],
        ["Payment Plan", p.payment_plan || "Contact Us"],
        ["Sale Status", p.sale_status || "Available"],
      ];
      const colW = (pageW - 2 * M - 12) / 2;
      const cellH = 38;
      for (let i = 0; i < facts.length; i += 2) {
        if (py + cellH > CONTENT_BOTTOM) {
          // Footer placeholder will be drawn later; add a clean page break.
          doc.addPage();
          drawPageBg();
          drawHeader();
          py = CONTENT_TOP;
        }
        for (let c = 0; c < 2; c++) {
          const f = facts[i + c];
          if (!f) continue;
          const fx = M + c * (colW + 12);
          doc.setFillColor(5, 38, 44);
          doc.setDrawColor(16, 90, 100);
          doc.setLineWidth(0.4);
          doc.roundedRect(fx, py, colW, cellH, 6, 6, "FD");
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(...tiffanyDim);
          doc.text(f[0].toUpperCase(), fx + 10, py + 14);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10.5);
          doc.setTextColor(...white);
          const valLines = doc.splitTextToSize(f[1], colW - 20) as string[];
          doc.text(valLines.slice(0, 1)[0] || "—", fx + 10, py + 30);
        }
        py += cellH + 8;
      }

      // Description
      const desc = stripHtml(p.description);
      if (desc) {
        if (py + 60 > CONTENT_BOTTOM) {
          doc.addPage();
          drawPageBg();
          drawHeader();
          py = CONTENT_TOP;
        }
        py += 6;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...tiffanyLight);
        doc.text("About this property", M, py);
        py += 16;
        const descLines = doc.splitTextToSize(desc, pageW - 2 * M) as string[];
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...tiffanyMuted);
        for (const ln of descLines) {
          if (py + 14 > CONTENT_BOTTOM) {
            doc.addPage();
            drawPageBg();
            drawHeader();
            py = CONTENT_TOP;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(...tiffanyMuted);
          }
          doc.text(ln, M, py);
          py += 14;
        }
      }

      // Amenities (if any)
      const amenities = Array.isArray(p.amenities) ? p.amenities : [];
      if (amenities.length) {
        if (py + 40 > CONTENT_BOTTOM) {
          doc.addPage();
          drawPageBg();
          drawHeader();
          py = CONTENT_TOP;
        }
        py += 8;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...tiffanyLight);
        doc.text("Amenities & Features", M, py);
        py += 14;
        // Render as wrapping pills
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        let ax = M;
        const ay0 = py;
        let ay = ay0;
        amenities.slice(0, 24).forEach((a: string) => {
          const label = String(a || "").trim();
          if (!label) return;
          const pw = doc.getTextWidth(label) + 14;
          if (ax + pw > pageW - M) {
            ax = M;
            ay += 22;
          }
          if (ay + 16 > CONTENT_BOTTOM) return;
          doc.setFillColor(8, 56, 64);
          doc.setDrawColor(...tiffanyDeep);
          doc.setLineWidth(0.4);
          doc.roundedRect(ax, ay, pw, 18, 9, 9, "FD");
          doc.setTextColor(...tiffanyLight);
          doc.text(label, ax + pw / 2, ay + 12, { align: "center" });
          ax += pw + 6;
        });
        py = ay + 22;
      }

      // Listing CTA at bottom of last per-property page
      if (py + 40 > CONTENT_BOTTOM) {
        doc.addPage();
        drawPageBg();
        drawHeader();
        py = CONTENT_TOP;
      }
      py += 8;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...tiffanyMuted);
      doc.text("Listing:", M, py);
      const url = `${origin}/project/${p.slug}`;
      drawHyperlink(url, url, M + 42, py, 9.5);
    }

    // ============= PAGE NUMBERS + FOOTERS (all pages) =============
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



  // Open a link synchronously inside the click gesture so popup blockers don't fire.
  // PDF generation runs in the BACKGROUND after the link opens.
  const openLinkSync = (url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => a.remove(), 0);
  };

  const generatePdfInBackground = () => {
    generateAndCachePdf()
      .then((built) => {
        if (built) triggerDownload(built.blob, built.filename);
      })
      .catch(() => {
        /* silent — link already opened */
      });
  };

  // Channel handlers — synchronous open, then background PDF download.
  const handleShareWhatsApp = () => {
    const text = buildShareText();
    openLinkSync(`https://wa.me/?text=${encodeURIComponent(`${text}\n\n(PDF report downloaded — attach it from your downloads.)`)}`);
    generatePdfInBackground();
    toast.success("Opening WhatsApp — attach the downloaded PDF");
  };

  const handleShareEmail = () => {
    const subject = "My JBJ AI Property Recommendations";
    const text = buildShareText();
    openLinkSync(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`${text}\n\n(PDF report downloaded — attach it to this email from your downloads.)`)}`);
    generatePdfInBackground();
    toast.success("Opening email — attach the downloaded PDF");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(buildShareText());
      toast.success("Recommendations copied to clipboard");
    } catch {
      toast.error("Unable to copy");
    }
  };

  const handleShareToConsultant = () => {
    if (!projects?.length) return;
    const subject = "AI Property Recommendations — Request Consultation";
    const body = `Dear JBJ Global Real Estate Team,\n\nI have completed the AI Property Assessment and would like a consultation on the following recommendations:\n\n${buildShareText(false)}\n\nThe branded PDF report has been downloaded to my device and I will attach it to this email.\n\nBest regards`;
    openLinkSync(`mailto:${JBJ_CONSULTANT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    generatePdfInBackground();
    toast.success("Opening email to JBJ — attach the downloaded PDF");
  };

  const handleConsultantWhatsApp = () => {
    const text = `Hello JBJ Global Real Estate,\n\nI just completed the AI Property Finder and would like a consultation on these recommendations:\n\n${buildShareText(false)}`;
    openLinkSync(`https://wa.me/${JBJ_CONSULTANT_WHATSAPP}?text=${encodeURIComponent(`${text}\n\n(PDF report downloaded — attach it from your downloads.)`)}`);
    generatePdfInBackground();
    toast.success("Opening WhatsApp to JBJ — attach the downloaded PDF");
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
          <p className="aihf-muted text-lg max-w-2xl mx-auto mb-4">
            {tierParam === "exact" && "3 perfect matches based on your exact requirements."}
            {tierParam === "close" && "1 or more filters were softened to find you the closest fits."}
            {tierParam === "nearest" && "No exact match in inventory — here are the closest 3 to your criteria."}
            {tierParam === "fallback" && "Top-rated properties available right now, ranked for you."}
          </p>
          {tierParam !== "exact" && projects && projects.length > 0 && (
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-xs font-semibold"
              style={{
                background: "rgba(245,158,11,0.18)",
                border: "1px solid rgba(245,158,11,0.55)",
                color: "#FBBF24",
              }}
            >
              <Sparkles className="w-3.5 h-3.5" style={{ color: "#FBBF24", stroke: "#FBBF24" }} />
              Closest matches — see the table below for what each property ticks
            </div>
          )}

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
            <Button
              onClick={startNewMatch}
              data-no-contrast-guard
              className="aihf-outline font-semibold"
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Start a new match
            </Button>
          </div>
        </div>

        {/* Criteria × Properties tick table */}
        {projects && projects.length > 0 && Object.keys(sessionAnswers).length > 0 && (
          <>
            <MatchCriteriaTable answers={sessionAnswers} projects={projects.slice(0, 3)} />
            <div className="flex justify-center mb-12">
              <Button
                data-no-contrast-guard
                onClick={() => {
                  document.getElementById("aihf-top-pick")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="aihf-cta aihf-cta-glow font-bold px-8 py-5 text-base rounded-xl"
              >
                View these properties
                <ChevronDown className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </>
        )}

        {/* Empty state — only shown if DB returned literally nothing */}
        {(!projects || projects.length === 0) && !isLoading && (
          <div className="aihf-panel rounded-2xl p-8 mb-12 text-center max-w-2xl mx-auto">
            <Sparkles className="w-10 h-10 mx-auto mb-3 aihf-tiffany" />
            <h3 className="text-xl font-semibold mb-2">Let's refresh your matches</h3>
            <p className="aihf-muted mb-5">
              Your saved selection isn't currently available. Start a new match — it takes under a minute and we'll always return you the closest properties.
            </p>
            <Button onClick={startNewMatch} className="aihf-cta font-semibold">
              <Brain className="w-4 h-4 mr-2" />
              Start a new match
            </Button>
          </div>
        )}


        {/* Top Recommendation */}
        {projects && projects.length > 0 && (

          <div className="mb-12">
            <div id="aihf-top-pick" className="aihf-panel relative backdrop-blur-sm rounded-3xl overflow-hidden scroll-mt-24">
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
                      <DropdownMenuContent
                        data-aihf-menu
                        className="border-0"
                        style={{
                          background: "linear-gradient(160deg, #04161C 0%, #031E18 100%)",
                          border: "1px solid rgba(94,234,212,0.55)",
                          boxShadow: "0 20px 50px rgba(34,211,238,0.25)",
                          color: "#FFFFFF",
                        }}
                      >
                        <DropdownMenuItem data-medal="gold" onClick={() => handleSetBadge(projects[0].id, 'top1')}>
                          Top 1 — Gold
                        </DropdownMenuItem>
                        <DropdownMenuItem data-medal="silver" onClick={() => handleSetBadge(projects[0].id, 'top2')}>
                          Top 2 — Silver
                        </DropdownMenuItem>
                        <DropdownMenuItem data-medal="bronze" onClick={() => handleSetBadge(projects[0].id, 'top3')}>
                          Top 3 — Bronze
                        </DropdownMenuItem>
                        {badges[projects[0].id] && (
                          <DropdownMenuItem data-medal="remove" onClick={() => handleSetBadge(projects[0].id, null)}>
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
                        <DropdownMenuContent
                          data-aihf-menu
                          className="border-0"
                          style={{
                            background: "linear-gradient(160deg, #04161C 0%, #031E18 100%)",
                            border: "1px solid rgba(94,234,212,0.55)",
                            boxShadow: "0 20px 50px rgba(34,211,238,0.25)",
                            color: "#FFFFFF",
                          }}
                        >
                          <DropdownMenuItem data-medal="gold" onClick={() => handleSetBadge(project.id, 'top1')}>
                            Top 1 — Gold
                          </DropdownMenuItem>
                          <DropdownMenuItem data-medal="silver" onClick={() => handleSetBadge(project.id, 'top2')}>
                            Top 2 — Silver
                          </DropdownMenuItem>
                          <DropdownMenuItem data-medal="bronze" onClick={() => handleSetBadge(project.id, 'top3')}>
                            Top 3 — Bronze
                          </DropdownMenuItem>
                          {badge && (
                            <DropdownMenuItem data-medal="remove" onClick={() => handleSetBadge(project.id, null)}>
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
                onClick={startNewMatch}
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

      {/* Share Modal — Tiffany theme matching AI Home Finder */}
      <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
        <DialogContent
          data-aihf-dialog
          data-allow-dark-cta
          data-no-contrast-guard
          data-on-dark
          className="aihf-results allow-white sm:max-w-md border-0"
          style={{
            background: "linear-gradient(160deg, #04161C 0%, #031E18 55%, #02110F 100%)",
            border: "1px solid rgba(94,234,212,0.45)",
            boxShadow:
              "0 24px 70px rgba(45,212,191,0.25), inset 0 0 34px rgba(103,232,249,0.07)",
            color: "#FFFFFF",
          }}
        >
          <style>{AIHF_RESULTS_STYLE}</style>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ color: "#FFFFFF" }}>
              <Share2 className="w-5 h-5 aihf-tiffany" />
              {shareTrigger === "post-download" ? "Share your report" : "Share your recommendations"}
            </DialogTitle>
            <DialogDescription className="aihf-muted">
              {shareTrigger === "post-download"
                ? "Your PDF has been downloaded. Share these properties with anyone, or send them to a JBJ Consultant."
                : "Pick a channel to share the full list of AI recommendations."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="aihf-tile rounded-lg p-3 max-h-40 overflow-y-auto">
              <p className="aihf-muted text-xs mb-2">Properties included:</p>
              {projects?.map((p, i) => (
                <div key={p.id} className="flex items-center gap-2 text-sm py-0.5">
                  <span className="aihf-tiffany font-semibold">#{i + 1}</span>
                  <span className="truncate" style={{ color: "#FFFFFF" }}>{p.name}</span>
                </div>
              ))}
            </div>

            {/* Channel grid */}
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={handleShareWhatsApp} className="aihf-cta font-semibold justify-start">
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
              <Button onClick={handleShareEmail} className="aihf-cta font-semibold justify-start">
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
              <Button onClick={handleCopyLink} className="aihf-outline font-semibold justify-start">
                <LinkIcon className="w-4 h-4 mr-2" />
                Copy text
              </Button>
              <Button onClick={handleDownloadReport} className="aihf-outline font-semibold justify-start">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>

            <div className="pt-3 space-y-2" style={{ borderTop: "1px solid rgba(94,234,212,0.30)" }}>
              <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: "#FFFFFF" }}>
                <Building2 className="w-3.5 h-3.5 aihf-tiffany" />
                Send to a JBJ Consultant
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={handleShareToConsultant} className="aihf-cta aihf-cta-glow font-semibold">
                  <Mail className="w-4 h-4 mr-2" />
                  Email JBJ
                </Button>
                <Button onClick={handleConsultantWhatsApp} className="aihf-cta aihf-cta-glow font-semibold">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp JBJ
                </Button>
              </div>
              <p className="aihf-muted text-[11px] text-center pt-1">
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
