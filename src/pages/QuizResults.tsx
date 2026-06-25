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
import { SafeImage } from "@/components/SafeImage";
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
import { useUserMode } from "@/hooks/useUserMode";
import MatchCriteriaTable, { buildCriteriaRowsForExport, computeMatchTotals } from "@/components/matchmaker/MatchCriteriaTable";
import {
  type MatchmakerFormData,
  readMatchmakerSession,
  writeMatchmakerSession,
  clearMatchmakerSession,
} from "@/hooks/useMatchmakerSession";
import { buildPropertyPresentationParagraphs, findAmenityPhotoUrl } from "@/utils/matchmakerProse";
import ReportPreviewModal, { type ReportBranding } from "@/components/ai-home-finder/ReportPreviewModal";

const INQUIRY_FORM_URL = "https://jbj.ae/contact";
const JBJ_CONSULTANT_EMAIL = "CONTACT@JBJ.AE";
const JBJ_CONSULTANT_WHATSAPP = "971501234567"; // International format, no + or spaces

const AIHF_RESULTS_STYLE = `
  .aihf-results, .aihf-results :is(h1,h2,h3,h4,p,span,a,button,div):not(.aihf-cta):not(.aihf-cta *):not(.aihf-action-icon):not(.aihf-action-icon *):not(.jj-pill-emerald-metallic):not(.jj-pill-emerald-metallic *):not(.jj-surface-emerald):not(.jj-surface-emerald *):not([data-emerald-action="true"]):not([data-emerald-action="true"] *), .aihf-results svg:not(.aihf-cta svg):not(.aihf-action-icon svg):not(.jj-pill-emerald-metallic svg):not(.jj-surface-emerald svg):not([data-emerald-action="true"] svg) {
    color: #1A1A1A !important;
    -webkit-text-fill-color: #1A1A1A !important;
    opacity: 1 !important;
  }
  .aihf-results svg:not(.aihf-cta svg):not(.aihf-action-icon svg):not(.jj-pill-emerald-metallic svg):not(.jj-surface-emerald svg):not([data-emerald-action="true"] svg),
  .aihf-results svg:not(.aihf-cta svg):not(.aihf-action-icon svg):not(.jj-pill-emerald-metallic svg):not(.jj-surface-emerald svg):not([data-emerald-action="true"] svg) * { stroke: #1A1A1A !important; }
  .aihf-results .aihf-muted { color: rgba(26,26,26,0.70) !important; -webkit-text-fill-color: rgba(26,26,26,0.70) !important; }
  .aihf-results .aihf-tiffany { color: #B89555 !important; -webkit-text-fill-color: #B89555 !important; }
  .aihf-results .aihf-panel {
    background: linear-gradient(135deg, #FDFBF7 0%, #F7F2EA 55%, #EFE6D6 100%) !important;
    border: 1px solid rgba(184,149,85,0.60) !important;
    box-shadow: 0 0 18px rgba(184,149,85,0.14), 0 18px 55px rgba(0,0,0,0.12) !important;
  }
  .aihf-results .aihf-tile {
    background: #EFE6D6 !important;
    border: 1px solid rgba(184,149,85,0.45) !important;
  }
  .aihf-results .aihf-cta, .aihf-results .aihf-cta:hover, .aihf-results .aihf-cta:focus-visible {
    background: var(--jj-emerald-ombre) !important;
    background-image: var(--jj-emerald-ombre) !important;
    border: 0 !important;
    box-shadow: 0 10px 24px -12px rgba(6,78,59,0.82), inset 0 1px 0 rgba(255,255,255,0.16) !important;
  }
  .aihf-results .aihf-cta, .aihf-results .aihf-cta *, .aihf-results .aihf-cta svg {
    color: #FFFFFF !important;
    -webkit-text-fill-color: #FFFFFF !important;
    stroke: #FFFFFF !important;
    opacity: 1 !important;
  }
  .aihf-results .aihf-cta svg *, .aihf-results .aihf-cta :is(path,line,polyline,polygon,rect,circle,ellipse) { stroke: #FFFFFF !important; color: #FFFFFF !important; }
  .aihf-results .aihf-cta:hover { background: var(--jj-emerald-ombre-hover) !important; background-image: var(--jj-emerald-ombre-hover) !important; transform: translateY(-1px); }
  .aihf-results .aihf-cta-glow {
    background: var(--jj-emerald-ombre) !important;
    background-image: var(--jj-emerald-ombre) !important;
    border: 0 !important;
    box-shadow: 0 10px 24px -12px rgba(6,78,59,0.82), inset 0 1px 0 rgba(255,255,255,0.16) !important;
    transform: translateZ(0);
    transition: transform .25s ease, background-color .25s ease !important;
  }
  .aihf-results .aihf-cta-glow:hover {
    background: var(--jj-emerald-ombre-hover) !important;
    background-image: var(--jj-emerald-ombre-hover) !important;
    transform: translateY(-1px);
  }
  .aihf-results .aihf-outline {
    background: #FDFBF7 !important;
    border: 1px solid rgba(184,149,85,0.55) !important;
  }
  .aihf-results .aihf-result-card {
    border-radius: 1rem !important;
    border: 1px solid rgba(184,149,85,0.60) !important;
    background: linear-gradient(135deg, #FDFBF7 0%, #F7F2EA 55%, #EFE6D6 100%) !important;
    box-shadow: 0 0 18px rgba(184,149,85,0.14), 0 18px 55px rgba(0,0,0,0.12) !important;
  }
  .aihf-results .aihf-action-icon {
    background: var(--jj-emerald-ombre) !important;
    background-image: var(--jj-emerald-ombre) !important;
    border: 0 !important;
    color: #FFFFFF !important;
    -webkit-text-fill-color: #FFFFFF !important;
  }
  .aihf-results .aihf-action-icon svg,
  .aihf-results .aihf-action-icon svg *,
  .aihf-results .aihf-action-icon :is(path,line,polyline,polygon,rect,circle,ellipse) {
    color: #FFFFFF !important;
    -webkit-text-fill-color: #FFFFFF !important;
    stroke: #FFFFFF !important;
    opacity: 1 !important;
  }
  /* Price pill — champagne+ink inside results */
  .aihf-results .price-pill-premium {
    background: #EFE6D6 !important;
    border: 1px solid rgba(184,149,85,0.55) !important;
    box-shadow: none !important;
    max-width: 100% !important;
    flex-wrap: wrap !important;
    padding: 6px 10px !important;
  }
  .aihf-results .price-pill-eyebrow {
    color: #1A1A1A !important;
    -webkit-text-fill-color: #1A1A1A !important;
    background: transparent !important;
    border-color: rgba(184,149,85,0.40) !important;
  }
  .aihf-results .price-pill-value {
    color: var(--price-orange) !important;
    -webkit-text-fill-color: var(--price-orange) !important;
  }
  .aihf-results .group:hover .price-pill-premium,
  .aihf-results .group:focus-within .price-pill-premium,
  .aihf-results .price-pill-premium:hover,
  .aihf-results .price-pill-premium:focus-visible {
    background: #EFE6D6 !important;
    border-color: rgba(184,149,85,0.85) !important;
    box-shadow: none !important;
  }
  .aihf-results .group:hover .price-pill-premium .price-pill-eyebrow,
  .aihf-results .group:focus-within .price-pill-premium .price-pill-eyebrow,
  .aihf-results .price-pill-premium:hover .price-pill-eyebrow {
    color: #1A1A1A !important;
    -webkit-text-fill-color: #1A1A1A !important;
    opacity: 1 !important;
  }
  .aihf-results .group:hover .price-pill-premium .price-pill-value,
  .aihf-results .group:focus-within .price-pill-premium .price-pill-value,
  .aihf-results .price-pill-premium:hover .price-pill-value {
    color: var(--price-orange) !important;
    -webkit-text-fill-color: var(--price-orange) !important;
  }
  /* Favorite / shortlist buttons — locked emerald fill + white glyph */
  .aihf-results .jj-favorite-trigger,
  .aihf-results .jj-favorite-trigger:hover {
    background-image: var(--jj-emerald-ombre) !important;
    background-color: #064E3B !important;
    border: 1px solid rgba(255,255,255,0.35) !important;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.22), 0 10px 24px -12px rgba(6,78,59,0.95) !important;
  }
  .aihf-results .jj-favorite-trigger svg,
  .aihf-results .jj-favorite-trigger svg * {
    stroke: #FFFFFF !important;
    color: #FFFFFF !important;
    filter: none;
  }
  .aihf-results button:has(> svg.lucide-award) span {
    color: #1A1A1A !important;
    -webkit-text-fill-color: #1A1A1A !important;
  }
  /* Add Badge dropdown — champagne menu */
  [data-aihf-menu],
  [data-aihf-menu][role="menu"] {
    background: #FDFBF7 !important;
    background-color: #FDFBF7 !important;
    border: 1px solid rgba(184,149,85,0.55) !important;
    box-shadow: 0 12px 30px rgba(0,0,0,0.08) !important;
    color: #1A1A1A !important;
  }
  [data-aihf-menu] [role="menuitem"],
  [data-aihf-menu] [role="menuitem"] * {
    background-color: transparent !important;
    color: #1A1A1A !important;
    -webkit-text-fill-color: #1A1A1A !important;
  }
  [data-aihf-menu] [role="menuitem"][data-medal="gold"],
  [data-aihf-menu] [role="menuitem"][data-medal="gold"] * { color: #B89555 !important; -webkit-text-fill-color: #B89555 !important; }
  [data-aihf-menu] [role="menuitem"][data-medal="silver"],
  [data-aihf-menu] [role="menuitem"][data-medal="silver"] * { color: #1A1A1A !important; -webkit-text-fill-color: #1A1A1A !important; }
  [data-aihf-menu] [role="menuitem"][data-medal="bronze"],
  [data-aihf-menu] [role="menuitem"][data-medal="bronze"] * { color: #8a6a3a !important; -webkit-text-fill-color: #8a6a3a !important; }
  [data-aihf-menu] [role="menuitem"][data-medal="remove"],
  [data-aihf-menu] [role="menuitem"][data-medal="remove"] * { color: #B23A48 !important; -webkit-text-fill-color: #B23A48 !important; }
  [data-aihf-menu] [role="menuitem"]:hover,
  [data-aihf-menu] [role="menuitem"]:focus,
  [data-aihf-menu] [role="menuitem"][data-highlighted] {
    background: #EFE6D6 !important;
    color: #1A1A1A !important;
    -webkit-text-fill-color: #1A1A1A !important;
  }
  [data-aihf-menu] [role="menuitem"]:hover *,
  [data-aihf-menu] [role="menuitem"]:focus *,
  [data-aihf-menu] [role="menuitem"][data-highlighted] * {
    color: #1A1A1A !important;
    -webkit-text-fill-color: #1A1A1A !important;
  }

  /* Share dialog close — champagne pill + gold hairline */
  [data-aihf-dialog] > button,
  .aihf-results > button[aria-label="Close"] {
    background: #EFE6D6 !important;
    background-image: none !important;
    border: 1px solid rgba(184,149,85,0.65) !important;
    border-radius: 9999px !important;
    opacity: 1 !important;
    box-shadow: none !important;
    color: #1A1A1A !important;
  }
  [data-aihf-dialog] > button:hover,
  .aihf-results > button[aria-label="Close"]:hover {
    background: #F7F2EA !important;
    border-color: rgba(184,149,85,0.95) !important;
    box-shadow: none !important;
    transform: translateY(-1px);
  }
  [data-aihf-dialog] > button svg,
  [data-aihf-dialog] > button svg *,
  .aihf-results > button[aria-label="Close"] svg,
  .aihf-results > button[aria-label="Close"] svg * {
    color: #1A1A1A !important;
    stroke: #1A1A1A !important;
    -webkit-text-fill-color: #1A1A1A !important;
    filter: none;
  }
`;



const QuizResults = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isBrokerMode } = useUserMode();
  const { hasActiveMembership } = useMembership();
  const [searchParams, setSearchParams] = useSearchParams();
  const projectSlugs = searchParams.get("projects")?.split(",").filter(Boolean) || [];
  const tierParam = (searchParams.get("tier") || "exact") as
    | "exact" | "close" | "nearest" | "fallback";
  const isFreeUse = searchParams.get("free") === "true";
  const [badges, setBadges] = useState<Record<string, 'top1' | 'top2' | 'top3' | null>>({});
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareTrigger, setShareTrigger] = useState<"share" | "post-download">("share");
  const [previewOpen, setPreviewOpen] = useState(false);
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
    navigate("/ai-home-finder");
  };


  const { data: projects, isLoading } = useQuery({
    queryKey: ["quiz-results", projectSlugs],
    queryFn: async () => {
      if (!projectSlugs.length) return [];
      const { applyPurchaseOnly, isPurchaseListing } = await import("@/lib/projects/excludeLeasing");
      const baseQuery = supabase
        .from("projects")
        .select(`
          *,
          developer:developers(id, name, slug, description, logo_url),
          images:project_images(id, image_url, alt_text, display_order),
          community:communities(id, name, slug),
          documents:project_documents(id, file_url, file_name, document_type)
        `)
        .in("slug", projectSlugs)
        .eq("is_published", true);
      const { data, error } = await applyPurchaseOnly(baseQuery);

      if (error) throw error;

      // Filter sold-out + any leasing leak client-side; keep NULL sale_status rows.
      const filtered = (data || []).filter((p: any) => {
        if (p.is_sold_out === true) return false;
        const status = (p.sale_status || "").toLowerCase();
        if (status.includes("sold")) return false;
        if (!isPurchaseListing(p)) return false;
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

      // If everything was filtered out (stale matchmaker session pointing at
      // leasing / unpublished / sold rows), clear the session so the UI shows
      // the "Saved selection isn't available — start a new match" empty state.
      if (normalized.length === 0 && projectSlugs.length > 0) {
        try { clearMatchmakerSession(); } catch {}
      }

      const ordered = normalized
        .sort((a, b) => projectSlugs.indexOf(a.slug) - projectSlugs.indexOf(b.slug));

      // Pad up to 3 matches: if leasing/sold filter removed picks, top up with
      // closest published purchase listings so users always see 3 cards.
      if (ordered.length < 3) {
        const excludeSlugs = ordered.map((p: any) => p.slug);
        const padQuery = supabase
          .from("projects")
          .select(`
            *,
            developer:developers(id, name, slug, description, logo_url),
            images:project_images(id, image_url, alt_text, display_order),
            community:communities(id, name, slug),
            documents:project_documents(id, file_url, file_name, document_type)
          `)
          .eq("is_published", true)
          .neq("is_sold_out", true)
          .not("slug", "in", `(${excludeSlugs.length ? excludeSlugs.map(s => `"${s}"`).join(",") : '""'})`)
          .order("created_at", { ascending: false })
          .limit(8);
        const { data: padData } = await applyPurchaseOnly(padQuery);
        const padNorm = (padData || [])
          .filter((p: any) => isPurchaseListing(p))
          .map((p: any) => ({
            ...p,
            images: p.images?.length > 0
              ? p.images
              : p.cover_image_url
                ? [{ id: "cover", image_url: p.cover_image_url, alt_text: p.name, display_order: 0 }]
                : [],
          }));
        for (const p of padNorm) {
          if (ordered.length >= 3) break;
          if (!ordered.find((x: any) => x.slug === p.slug)) ordered.push(p);
        }
      }
      return ordered.slice(0, 3);
    },
    enabled: projectSlugs.length > 0,
  });


  const handleSetBadge = (projectId: string, badge: 'top1' | 'top2' | 'top3' | null) => {
    setBadges(prev => ({ ...prev, [projectId]: badge }));
  };

  const badgeLabels = {
    top1: { label: "Top 1", sublabel: "Best", color: "bg-[#EFE6D6] border border-[#B89555]/60", textColor: "text-[#1A1A1A]", medalColor: "text-[#B89555]" },
    top2: { label: "Top 2", sublabel: "Strong", color: "bg-[#F7F2EA] border border-[#B89555]/55", textColor: "text-[#1A1A1A]", medalColor: "text-[#B89555]" },
    top3: { label: "Top 3", sublabel: "Fit", color: "bg-[#FDFBF7] border border-[#B89555]/45", textColor: "text-[#1A1A1A]", medalColor: "text-[#B89555]" },
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
          : "Bedroom mix on request";
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
  const buildPdf = async (branding?: ReportBranding): Promise<{ blob: Blob; filename: string } | null> => {
    if (!projects?.length) return null;

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    // JBJ champagne+gold+black palette — used everywhere in the PDF
    const ink: [number, number, number] = [26, 26, 26];
    const inkDeep: [number, number, number] = [10, 10, 10];
    const navy: [number, number, number] = [10, 10, 10];
    const tiffany: [number, number, number] = [184, 149, 85];
    const tiffanyLight: [number, number, number] = [239, 230, 214];
    const tiffanyDeep: [number, number, number] = [138, 106, 58];
    const tiffanyMuted: [number, number, number] = [247, 242, 234];
    const tiffanyDim: [number, number, number] = [253, 251, 247];
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
    const greetingLine = clientName ? `Dear ${clientName},` : `Dear Valued Client,`;
    const headerDateLine = dateStr;
    const monogram = await loadMonogram();

    const drawOmbreWordmark = (text: string, x: number, y: number) => {
      const segments = ["JBJ ", "GLOBAL ", "REAL ", "ESTATE"];
      const colors: [number, number, number][] = [
        [184, 149, 85],
        [184, 149, 85],
        [184, 149, 85],
        [184, 149, 85],
      ];
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setFillColor(10, 10, 10);
      doc.roundedRect(x - 4, y - 13, doc.getTextWidth(text) + 10, 18, 6, 6, "F");
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
      doc.text(headerDateLine, pageW - M, chipY + 22, { align: "right" });
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

    const drawWrappedHyperlink = (
      label: string,
      url: string,
      x: number,
      y: number,
      maxW: number,
      size = 9.5,
      lineH = 13
    ) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(size);
      doc.setTextColor(...tiffanyLight);
      const safeLabel = label
        .replace(/([/?&=#-])/g, "$1\u200B")
        .replace(/\u200B\u200B/g, "\u200B");
      const lines = doc.splitTextToSize(safeLabel, maxW) as string[];
      lines.forEach((line, idx) => {
        const text = line.replace(/\u200B/g, "");
        const yy = y + idx * lineH;
        doc.text(text, x, yy);
        const w = Math.min(doc.getTextWidth(text), maxW);
        doc.setDrawColor(...tiffanyLight);
        doc.setLineWidth(0.45);
        doc.line(x, yy + 2, x + w, yy + 2);
        doc.link(x, yy - size + 1, w, size + 2, { url });
      });
      return y + lines.length * lineH;
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

    const top = projects.slice(0, 3);
    const rankLabels = ["#1 Best Match", "#2 Strong Fit", "#3 Good Fit"];
    const rankFills: [number, number, number][] = [tiffanyLight, tiffany, tiffanyDeep];

    const fmtBeds = (p: any) =>
      p.bedrooms_min != null && p.bedrooms_max != null
        ? p.bedrooms_min === 0
          ? `Studio${p.bedrooms_max > 0 ? `-${p.bedrooms_max} BR` : ""}`
          : `${p.bedrooms_min}-${p.bedrooms_max} BR`
        : "Bedroom mix on request";
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
    y += 42;

    // Title
    doc.setTextColor(...white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.text("Your AI-Selected Properties", M, y);
    y += 20;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...tiffanyLight);
    doc.text(greetingLine, M, y);
    y += 18;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...tiffanyMuted);
    y = drawWrapped(
      "Thank you for trusting JBJ Global Real Estate. Please find below a curated shortlist of the top properties from our inventory, ranked against your exact requirements. Each property is presented in full on the following pages — with photos, key details, and direct listing links.",
      M,
      y,
      pageW - 2 * M,
      15,
      tiffanyMuted,
      11
    );
    y += 14;

    // ===== Prepared-by branding strip (page 1 only) =====
    if (branding && branding.mode !== "none") {
      const stripH = 86;
      const stripY = y;
      doc.setFillColor(247, 242, 234);
      doc.setDrawColor(...tiffany);
      doc.setLineWidth(0.6);
      doc.roundedRect(M, stripY, pageW - 2 * M, stripH, 8, 8, "FD");

      let bx = M + 12;
      const by = stripY + 12;
      const showPhoto = (branding.mode === "both" || branding.mode === "photo") && branding.photoDataUrl;
      const showLogo = (branding.mode === "both" || branding.mode === "logo") && branding.logoDataUrl;

      if (showPhoto) {
        try {
          doc.addImage(branding.photoDataUrl!, "PNG", bx, by, 62, 62);
          bx += 74;
        } catch { /* ignore */ }
      }
      if (showLogo) {
        try {
          doc.setFillColor(...white);
          doc.roundedRect(bx, by, 70, 62, 4, 4, "F");
          doc.addImage(branding.logoDataUrl!, "PNG", bx + 4, by + 4, 62, 54);
          bx += 82;
        } catch { /* ignore */ }
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...tiffanyDeep);
      const roleLabel = (
        branding.role === "broker" ? "BROKER" :
        branding.role === "developer" ? "DEVELOPER" :
        branding.role === "owner" ? "OWNER" : "JBJ CONSULTANT"
      );
      doc.text(`PREPARED BY — ${roleLabel}`, bx, by + 10);

      let ty = by + 24;
      if (branding.name) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(...ink);
        doc.text(branding.name, bx, ty);
        ty += 13;
      }
      if (branding.companyName) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(60, 50, 40);
        doc.text(branding.companyName, bx, ty);
        ty += 11;
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(80, 70, 55);
      const line1 = [branding.phone, branding.email].filter(Boolean).join("   •   ");
      if (line1) { doc.text(line1, bx, ty); ty += 10; }
      const line2 = [
        branding.whatsapp ? `WhatsApp: ${branding.whatsapp}` : null,
        branding.website,
      ].filter(Boolean).join("   •   ");
      if (line2) { doc.text(line2, bx, ty); ty += 10; }
      if (branding.address) { doc.text(branding.address, bx, ty); ty += 10; }
      if (branding.socials) { doc.text(branding.socials.slice(0, 80), bx, ty); }

      y = stripY + stripH + 14;
    }



    // Three rank cards
    const cardGap = 12;
    const cardW = (pageW - 2 * M - 2 * cardGap) / 3;
    const cardH = 278;
    top.forEach((p, i) => {
      const cx = M + i * (cardW + cardGap);
      const cy = y;

      // Card bg
      doc.setFillColor(5, 34, 38);
      doc.setDrawColor(...tiffanyDeep);
      doc.setLineWidth(0.7);
      doc.roundedRect(cx, cy, cardW, cardH, 10, 10, "FD");

      // Photo area
      const imgH = 128;
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

      doc.setDrawColor(18, 92, 98);
      doc.setLineWidth(0.35);
      doc.line(cx + 12, ty - 6, cx + cardW - 12, ty - 6);

      // Price
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(...tiffanyLight);
      doc.text(fmtPrice(p), cx + 12, ty);
      ty += 16;

      doc.setDrawColor(18, 92, 98);
      doc.setLineWidth(0.35);
      doc.line(cx + 12, ty - 7, cx + cardW - 12, ty - 7);

      // Bedrooms
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...tiffanyMuted);
      doc.text(fmtBeds(p), cx + 12, ty);
      ty += 14;
      const loc = doc.splitTextToSize(`${p.location || "Dubai"}${p.emirate ? `, ${p.emirate}` : ""}`, cardW - 24) as string[];
      doc.setTextColor(...tiffanyDim);
      doc.text(loc.slice(0, 2), cx + 12, ty);
    });
    y += cardH + 20;

    // What's inside this report — pinned above footer so the cover does not leave a loose blank void.
    y = Math.max(y, pageH - FOOTER_H - 92);
    doc.setFillColor(4, 27, 30);
    doc.setDrawColor(16, 90, 100);
    doc.setLineWidth(0.4);
    doc.roundedRect(M, y - 18, pageW - 2 * M, 76, 8, 8, "FD");
    y -= 2;
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
        ...top.map((p, i) => `      #${i + 1}  ${p.name}`),
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
          cellPadding: 10,
          minCellHeight: 38,
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
        didDrawCell: (data) => {
          if (data.section === "head" && data.column.index > 0) {
            const cov = covers[data.column.index - 1];
            if (cov) {
              try {
                doc.addImage(cov.data, cov.type, data.cell.x + 8, data.cell.y + 7, 24, 24, undefined, "FAST");
                doc.setDrawColor(...ink);
                doc.setLineWidth(0.4);
                doc.roundedRect(data.cell.x + 8, data.cell.y + 7, 24, 24, 4, 4, "S");
              } catch {
                /* ignore header thumb */
              }
            }
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

      // Presentation prose — natural sentences, not raw brochure label/value dumps.
      const paragraphs = buildPropertyPresentationParagraphs(p, 3);
      if (paragraphs.length) {
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
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...tiffanyMuted);
        for (const paragraph of paragraphs) {
          const descLines = doc.splitTextToSize(paragraph, pageW - 2 * M) as string[];
          for (const ln of descLines) {
            if (py + 14 > CONTENT_BOTTOM) {
              doc.addPage();
              drawPageBg();
              drawHeader();
              py = CONTENT_TOP;
              doc.setFont("helvetica", "bold");
              doc.setFontSize(11);
              doc.setTextColor(...tiffanyLight);
              doc.text(`Property #${idx + 1} continued`, M, py);
              py += 18;
              doc.setFont("helvetica", "normal");
              doc.setFontSize(10);
              doc.setTextColor(...tiffanyMuted);
            }
            doc.text(ln, M, py);
            py += 14;
          }
          py += 7;
        }
      }

      // Amenities with photos where the inventory provides real amenity imagery.
      const amenities = Array.isArray(p.amenities) ? p.amenities.slice(0, 12) : [];
      if (amenities.length) {
        if (py + 98 > CONTENT_BOTTOM) {
          doc.addPage();
          drawPageBg();
          drawHeader();
          py = CONTENT_TOP;
        }
        py += 4;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...tiffanyLight);
        doc.text("Amenities & Features", M, py);
        py += 15;
        const amenityPhotos = await Promise.all(
          amenities.map((a: string) =>
            loadImageAsDataUrl(findAmenityPhotoUrl(a, p.amenity_images as Record<string, string> | null), 2500)
          )
        );
        const cols = 4;
        const gap = 8;
        const aw = (pageW - 2 * M - gap * (cols - 1)) / cols;
        const ah = 66;
        for (let aIdx = 0; aIdx < amenities.length; aIdx++) {
          const col = aIdx % cols;
          if (col === 0 && aIdx > 0) py += ah + 8;
          if (py + ah > CONTENT_BOTTOM) {
            doc.addPage();
            drawPageBg();
            drawHeader();
            py = CONTENT_TOP;
          }
          const ax = M + col * (aw + gap);
          doc.setFillColor(5, 38, 44);
          doc.setDrawColor(16, 90, 100);
          doc.setLineWidth(0.35);
          doc.roundedRect(ax, py, aw, ah, 6, 6, "FD");
          const photo = amenityPhotos[aIdx];
          if (photo) {
            try {
              doc.addImage(photo.data, photo.type, ax + 4, py + 4, aw - 8, 36, undefined, "FAST");
            } catch {
              /* ignore amenity photo */
            }
          } else {
            doc.setFillColor(8, 56, 64);
            doc.roundedRect(ax + 4, py + 4, aw - 8, 36, 5, 5, "F");
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            doc.setTextColor(...tiffanyLight);
            doc.text("JBJ", ax + aw / 2, py + 26, { align: "center" });
          }
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(...tiffanyMuted);
          const labelLines = doc.splitTextToSize(String(amenities[aIdx]), aw - 10) as string[];
          doc.text(labelLines.slice(0, 2), ax + 5, py + 50);
        }
        py += ah + 8;
      }

      // Listing CTA with wrapped, visibly underlined URL.
      if (py + 58 > CONTENT_BOTTOM) {
        doc.addPage();
        drawPageBg();
        drawHeader();
        py = CONTENT_TOP;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...tiffanyMuted);
      doc.text("Listing:", M, py);
      const url = `${origin}/project/${p.slug}`;
      py = drawWrappedHyperlink(url, url, M + 42, py, pageW - M - (M + 42), 9.5, 13) + 7;

      doc.setFillColor(8, 56, 64);
      doc.setDrawColor(...tiffanyLight);
      doc.roundedRect(M, py, 176, 24, 12, 12, "FD");
      drawHyperlink("Download this property brochure", url, M + 12, py + 16, 8.5);
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

  const handleDownloadPropertyBrochure = async (project: any, rankIndex: number) => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const M = 42;
    // Champagne / gold / ink palette — single source of truth
    const page: [number, number, number] = [253, 251, 247];    // #FDFBF7
    const champagne: [number, number, number] = [247, 242, 234]; // #F7F2EA
    const ink: [number, number, number] = [26, 26, 26];        // #1A1A1A
    const inkMuted: [number, number, number] = [90, 90, 90];
    const gold: [number, number, number] = [184, 149, 85];     // #B89555
    const fmtBedsLocal = (p: any) =>
      p.bedrooms_min != null && p.bedrooms_max != null
        ? p.bedrooms_min === 0
          ? `Studio${p.bedrooms_max > 0 ? ` – ${p.bedrooms_max} BR` : ""}`
          : `${p.bedrooms_min} – ${p.bedrooms_max} BR`
        : "Bedroom mix on request";
    const fmtPriceLocal = (p: any) => {
      if (!p.price_from) return "Price on Request";
      const lo = `AED ${(p.price_from / 1_000_000).toFixed(1)}M`;
      return p.price_to && p.price_to > p.price_from
        ? `${lo} – AED ${(p.price_to / 1_000_000).toFixed(1)}M`
        : `From ${lo}`;
    };

    // Optional broker brand (broker mode + signed in) — pulled from crm_brokers
    let brokerBrand: {
      agentName?: string;
      company?: string;
      phone?: string;
      email?: string;
      whatsapp?: string;
      title?: string;
      tagline?: string;
      logoUrl?: string;
    } | null = null;
    if (isBrokerMode && user?.id) {
      try {
        const { data: b } = await supabase
          .from("crm_brokers")
          .select("full_name, agent_display_name, current_company, company_phone, company_email, personal_phone, personal_email, phone_e164, whatsapp, position_title, role_title, tagline, logo_url")
          .eq("auth_user_id", user.id)
          .maybeSingle();
        if (b) {
          brokerBrand = {
            agentName: b.agent_display_name || b.full_name || undefined,
            company: b.current_company || undefined,
            phone: b.company_phone || b.personal_phone || b.phone_e164 || undefined,
            email: b.company_email || b.personal_email || undefined,
            whatsapp: b.whatsapp || undefined,
            title: b.position_title || b.role_title || undefined,
            tagline: b.tagline || undefined,
            logoUrl: b.logo_url || undefined,
          };
        }
      } catch { /* ignore */ }
    }

    // ===== Page background =====
    doc.setFillColor(...page);
    doc.rect(0, 0, pageW, pageH, "F");

    // ===== Letterhead (white, monogram + wordmark, gold hairline) =====
    const HEADER_H = 88;
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageW, HEADER_H, "F");
    // monogram
    try {
      const monogramUrl = `${window.location.origin}/jbj-monogram-dark-on-light.png`;
      const mono = await loadImageAsDataUrl(monogramUrl, 2000);
      if (mono) {
        doc.addImage(mono.data, mono.type, M, 18, 52, 52, undefined, "FAST");
      }
    } catch { /* ignore */ }
    // wordmark (right)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...ink);
    doc.text("JBJ GLOBAL REAL ESTATE", pageW - M, 38, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...inkMuted);
    doc.text(`AI Home Finder · Property #${rankIndex + 1}`, pageW - M, 54, { align: "right" });
    // gold hairline
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.6);
    doc.line(M, HEADER_H, pageW - M, HEADER_H);

    // ===== Hero: title + developer =====
    let y = HEADER_H + 28;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(...ink);
    const titleLines = doc.splitTextToSize(project.name || "Property brochure", pageW - 2 * M) as string[];
    titleLines.slice(0, 2).forEach((line) => { doc.text(line, M, y); y += 22; });
    // "by {developer}" — "by" ink/70, name gold
    if (project.developer?.name) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      const by = "by ";
      doc.setTextColor(90, 90, 90);
      doc.text(by, M, y);
      const byW = doc.getTextWidth(by);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...gold);
      doc.text(String(project.developer.name), M + byW, y);
      y += 14;
    }
    y += 8;

    // ===== Cover image (gold hairline, no fill) =====
    const cover = await loadImageAsDataUrl(
      project.cover_image_url || project.images?.[0]?.image_url || null,
      3500
    );
    if (cover) {
      const coverH = 230;
      try { doc.addImage(cover.data, cover.type, M, y, pageW - 2 * M, coverH, undefined, "FAST"); } catch { /* ignore */ }
      doc.setDrawColor(...gold);
      doc.setLineWidth(0.6);
      doc.rect(M, y, pageW - 2 * M, coverH, "S");
      y += coverH + 18;
    }

    // ===== Fact tiles (champagne fill, ink text, gold hairline) =====
    const facts: Array<[string, string]> = [
      ["LOCATION", `${project.location || "Dubai"}${project.emirate ? `, ${project.emirate}` : ""}`],
      ["PRICE", fmtPriceLocal(project)],
      ["BEDROOMS", fmtBedsLocal(project)],
      ["HANDOVER", project.handover_date || "On Request"],
    ];
    const colW = (pageW - 2 * M - 12) / 2;
    const tileH = 44;
    facts.forEach((f, i) => {
      const x = M + (i % 2) * (colW + 12);
      const yy = y + Math.floor(i / 2) * (tileH + 10);
      doc.setFillColor(...champagne);
      doc.setDrawColor(...gold);
      doc.setLineWidth(0.5);
      doc.roundedRect(x, yy, colW, tileH, 4, 4, "FD");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...gold);
      doc.text(f[0], x + 12, yy + 16);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(...ink);
      const v = doc.splitTextToSize(String(f[1]), colW - 24) as string[];
      doc.text(v[0] || "", x + 12, yy + 32);
    });
    y += Math.ceil(facts.length / 2) * (tileH + 10) + 12;

    // ===== Presentation overview =====
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...ink);
    doc.text("Presentation overview", M, y);
    // small gold underline
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.6);
    doc.line(M, y + 4, M + 60, y + 4);
    y += 18;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    const footerReserve = brokerBrand ? 110 : 78;
    for (const paragraph of buildPropertyPresentationParagraphs(project, 3)) {
      const lines = doc.splitTextToSize(paragraph, pageW - 2 * M) as string[];
      for (const line of lines) {
        if (y > pageH - footerReserve) break;
        doc.text(line, M, y);
        y += 13;
      }
      y += 6;
      if (y > pageH - footerReserve) break;
    }

    // ===== Footer (gold hairline + link + optional broker block) =====
    const url = `${window.location.origin}/project/${project.slug}`;
    const footerTop = pageH - (brokerBrand ? 90 : 56);
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.6);
    doc.line(M, footerTop, pageW - M, footerTop);

    if (brokerBrand) {
      // Two-column co-branded footer
      const fy = footerTop + 16;
      let leftX = M;
      // Broker logo (max 36x36) on the left, if present
      if (brokerBrand.logoUrl) {
        try {
          const lg = await loadImageAsDataUrl(brokerBrand.logoUrl, 600);
          if (lg) {
            doc.addImage(lg.data, lg.type, M, footerTop + 8, 36, 36, undefined, "FAST");
            leftX = M + 44;
          }
        } catch { /* ignore */ }
      }
      // Left: agent + company
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(...ink);
      doc.text(brokerBrand.agentName || "Your Agent", leftX, fy);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(90, 90, 90);
      if (brokerBrand.title) doc.text(brokerBrand.title, leftX, fy + 12);
      if (brokerBrand.company) {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...gold);
        doc.text(brokerBrand.company, leftX, fy + 24);
      }
      if (brokerBrand.tagline) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        const tg = doc.splitTextToSize(brokerBrand.tagline, pageW * 0.55) as string[];
        doc.text(tg[0] || "", leftX, fy + 36);
      }
      // Right: phone / email / whatsapp
      const rx = pageW - M;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...ink);
      let ry = fy;
      if (brokerBrand.phone) { doc.text(brokerBrand.phone, rx, ry, { align: "right" }); ry += 12; }
      if (brokerBrand.email) { doc.text(brokerBrand.email, rx, ry, { align: "right" }); ry += 12; }
      if (brokerBrand.whatsapp) { doc.text(`WhatsApp ${brokerBrand.whatsapp}`, rx, ry, { align: "right" }); }
      // Listing URL on bottom strip
      doc.setFontSize(8);
      doc.setTextColor(...gold);
      doc.text(url, M, pageH - 14);
      doc.link(M, pageH - 22, pageW - 2 * M, 14, { url });
    } else {
      // JBJ-only footer
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(...ink);
      doc.text("View full listing", M, footerTop + 18);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...gold);
      doc.text(url, M, footerTop + 32);
      doc.link(M, footerTop + 22, pageW - 2 * M, 14, { url });
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 140);
      doc.text("JBJ Global Real Estate · CONTACT@JBJ.AE · jbj.ae", pageW - M, footerTop + 32, { align: "right" });
    }

    triggerDownload(doc.output("blob"), `JBJ-${project.slug}-Brochure.pdf`);
    toast.success(
      brokerBrand
        ? "Co-branded brochure downloaded"
        : "Property brochure downloaded"
    );
  };

  // Cache the most recent generated PDF (blob + filename) so share handlers can attach it
  const [lastPdf, setLastPdf] = useState<{ blob: Blob; filename: string } | null>(null);

  const generateAndCachePdf = async (branding?: ReportBranding) => {
    const built = await buildPdf(branding);
    if (!built) {
      toast.error("Could not generate the report yet.");
      return null;
    }
    setLastPdf(built);
    return built;
  };

  // Old direct-download entrypoints — now open the Preview & Branding modal first.
  const handleDownloadReport = () => setPreviewOpen(true);
  const handleOpenShare = () => setPreviewOpen(true);

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

  // From the preview modal — generate branded PDF, then act.
  const previewDownload = async (branding: ReportBranding) => {
    const built = await generateAndCachePdf(branding);
    if (!built) return;
    triggerDownload(built.blob, built.filename);
    toast.success("Branded report downloaded!");
  };

  const previewShareWhatsApp = async (branding: ReportBranding) => {
    const text = buildShareText();
    const built = await generateAndCachePdf(branding);
    if (built) triggerDownload(built.blob, built.filename);
    openLinkSync(`https://wa.me/?text=${encodeURIComponent(`${text}\n\n(Branded PDF report downloaded — attach it from your downloads.)`)}`);
    toast.success("Opening WhatsApp — attach the downloaded PDF");
  };

  const previewShareEmail = async (branding: ReportBranding) => {
    const subject = "My JBJ AI Property Recommendations";
    const text = buildShareText();
    const built = await generateAndCachePdf(branding);
    if (built) triggerDownload(built.blob, built.filename);
    openLinkSync(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`${text}\n\n(Branded PDF report downloaded — attach it from your downloads.)`)}`);
    toast.success("Opening email — attach the downloaded PDF");
  };

  const previewCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildShareText());
      toast.success("Recommendations copied to clipboard");
    } catch {
      toast.error("Unable to copy");
    }
  };

  const previewSendToConsultant = async (branding: ReportBranding) => {
    if (!projects?.length) return;
    const subject = "AI Property Recommendations — Request Consultation";
    const body = `Dear JBJ Global Real Estate Team,\n\nI have completed the AI Property Assessment and would like a consultation on the following recommendations:\n\n${buildShareText(false)}\n\nThe branded PDF report has been downloaded to my device and I will attach it to this email.\n\nBest regards`;
    const built = await generateAndCachePdf(branding);
    if (built) triggerDownload(built.blob, built.filename);
    openLinkSync(`mailto:${JBJ_CONSULTANT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    toast.success("Opening email to JBJ — attach the downloaded PDF");
  };

  // Legacy share-modal handlers — kept so the existing post-action ShareModal still works.
  const generatePdfInBackground = () => {
    generateAndCachePdf()
      .then((built) => { if (built) triggerDownload(built.blob, built.filename); })
      .catch(() => { /* silent */ });
  };
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
    try { await navigator.clipboard.writeText(buildShareText()); toast.success("Recommendations copied to clipboard"); }
    catch { toast.error("Unable to copy"); }
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
    const text = `Hello JBJ Global Real Estate,\n\nI just completed the AI Home Finder and would like a consultation on these recommendations:\n\n${buildShareText(false)}`;
    openLinkSync(`https://wa.me/${JBJ_CONSULTANT_WHATSAPP}?text=${encodeURIComponent(`${text}\n\n(PDF report downloaded — attach it from your downloads.)`)}`);
    generatePdfInBackground();
    toast.success("Opening WhatsApp to JBJ — attach the downloaded PDF");
  };




  if (isLoading) {
    return (
      <section className="aihf-results min-h-screen flex items-center justify-center" style={{ background: "#FDFBF7" }}>
        <style>{AIHF_RESULTS_STYLE}</style>
        <div className="text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <p className="text-xl font-semibold">Finding your perfect matches...</p>
        </div>
      </section>
    );
  }

  return (
    <section data-allow-dark-cta data-no-contrast-guard data-on-dark className="aihf-results min-h-screen py-12 md:py-20" style={{ background: "#FDFBF7" }}>
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
                background: "rgba(16,122,87,0.14)",
                border: "1px solid rgba(16,122,87,0.55)",
                color: "#0E5B41",
              }}
            >
              <Sparkles className="w-3.5 h-3.5" style={{ color: "#107A57", stroke: "#107A57" }} />
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
            <div id="aihf-top-pick" className="aihf-result-card relative backdrop-blur-sm rounded-3xl overflow-hidden scroll-mt-24">
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                <div className="jj-pill-active text-sm font-semibold px-4 py-1.5 rounded-full">
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
                  <SafeImage
                    src={projects[0].cover_image_url || projects[0].images?.[0]?.image_url || undefined}
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
                          : "Bedroom mix on request"}
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
                          background: "#F7F2EA",
                          border: "1px solid rgba(184,149,85,0.55)",
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
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link to={`/project/${projects[0].slug}`}>
                      <Button className="aihf-cta jj-pill-emerald-metallic w-full md:w-auto font-semibold hover:-translate-y-0.5 transition-all duration-300">
                        View Property
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                    <Button
                      type="button"
                      onClick={() => handleDownloadPropertyBrochure(projects[0], 0)}
                      className="aihf-cta jj-pill-emerald-metallic w-full md:w-auto font-semibold"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Brochure
                    </Button>
                  </div>
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
                  : "Bedroom mix on request";
                return (
                  <div key={project.id} className="aihf-result-card relative group flex flex-col h-full rounded-2xl overflow-hidden min-h-[420px]">
                    <div className="absolute top-3 left-3 z-10 rounded-full jj-pill-active px-3 py-1">
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
                    <SafeImage
                      src={project.cover_image_url || project.images?.[0]?.image_url || undefined}
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
                      <Link to={`/project/${project.slug}`} className="mt-auto mb-3">
                          <Button className="aihf-cta jj-pill-emerald-metallic w-full font-semibold">
                          View Property
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                      <Button
                        type="button"
                        onClick={() => handleDownloadPropertyBrochure(project, index + 1)}
                        className="aihf-cta jj-pill-emerald-metallic w-full font-semibold text-xs"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download Brochure
                      </Button>
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
                            background: "#F7F2EA",
                            border: "1px solid rgba(184,149,85,0.55)",
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

        {/* Criteria × Properties comparison table — restored below the #1/#2/#3 cards */}
        {projects && projects.length > 0 && Object.keys(sessionAnswers).length > 0 && (
          <>
            <MatchCriteriaTable answers={sessionAnswers} projects={projects.slice(0, 3)} />
            <div className="flex justify-center mb-12">
              <Button
                data-no-contrast-guard
                onClick={() => {
                  document.getElementById("aihf-top-pick")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="aihf-cta aihf-cta-glow jj-pill-emerald-metallic font-bold px-8 py-5 text-base rounded-xl"
              >
                Back to property #1
                <ChevronDown className="w-5 h-5 ml-2 rotate-180" />
              </Button>
            </div>
          </>
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
                <div className="aihf-action-icon w-12 h-12 rounded-full flex items-center justify-center">
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
                  <Button className="aihf-cta jj-pill-emerald-metallic w-full font-semibold">
                  Compare with AI
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Professional Evaluation Card */}
            <div className="aihf-tile rounded-2xl p-6 backdrop-blur-sm flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="aihf-action-icon w-12 h-12 rounded-full flex items-center justify-center">
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
                <Button className="aihf-cta jj-pill-emerald-metallic w-full font-semibold flex items-center justify-center gap-2">
                  <Users className="w-5 h-5" />
                  Request Evaluation
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
            </div>

            {/* Regenerate / AI Finder Card */}
            <div className="aihf-tile rounded-2xl p-6 backdrop-blur-sm flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="aihf-action-icon w-12 h-12 rounded-full flex items-center justify-center">
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
                className="aihf-cta jj-pill-emerald-metallic w-full font-semibold"
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
            <Link to="/properties">
              <Button
                data-no-contrast-guard
                className="aihf-cta aihf-cta-glow jj-pill-emerald-metallic font-bold px-10 py-6 text-base rounded-xl"
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
            background: "#F7F2EA",
            border: "1px solid rgba(184,149,85,0.45)",
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

            <div className="pt-3 space-y-2" style={{ borderTop: "1px solid rgba(184,149,85,0.30)" }}>
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
          navigate("/ai-home-finder");
        }}
        userInfo={{
          fullName: user?.email?.split("@")[0] || "",
          email: user?.email || "",
          phone: "",
        }}
        mode="regenerate"
      />

      {/* Report Preview & Branding Modal */}
      <ReportPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        projects={(projects || []) as any}
        defaults={{
          name: matchmakerFormData?.fullName || "",
          email: user?.email || "",
          phone: matchmakerFormData?.phone || "",
          whatsapp: matchmakerFormData?.phone || "",
        }}
        onDownload={previewDownload}
        onShareWhatsApp={previewShareWhatsApp}
        onShareEmail={previewShareEmail}
        onCopy={previewCopy}
        onSendToConsultant={previewSendToConsultant}
      />

    </section>
  );
};

export default QuizResults;
