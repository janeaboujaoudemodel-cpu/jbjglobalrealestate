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
        .in("slug", projectSlugs)
        .not("is_sold_out", "eq", true)
        .not("sale_status", "ilike", "%sold%");

      if (error) throw error;

      const normalized = (data || []).map(p => ({
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
    top1: { label: "Top 1", sublabel: "Gold", color: "bg-gradient-to-r from-[#B89555] via-[#E8D5A3] to-[#B89555] border-2 border-[#B89555] shadow-lg", textColor: "text-[#1A1A1A]", medalColor: "text-[#B89555]" },
    top2: { label: "Top 2", sublabel: "Silver", color: "bg-gradient-to-r from-[#A0A0A0] via-[#E8E8E8] to-[#A0A0A0] border-2 border-[#B0B0B0] shadow-lg", textColor: "text-[#1A1A1A]", medalColor: "text-[#A0A0A0]" },
    top3: { label: "Top 3", sublabel: "Bronze", color: "bg-gradient-to-r from-[#CD7F32] via-[#E8A84C] to-[#CD7F32] border-2 border-[#CD7F32] shadow-lg", textColor: "text-white", medalColor: "text-[#CD7F32]" },
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
  const buildPdf = () => {
    if (!projects?.length) return null;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const ink: [number, number, number] = [26, 26, 26];
    const gold: [number, number, number] = [184, 149, 85];
    const champagne: [number, number, number] = [247, 242, 234];
    const origin = typeof window !== "undefined" ? window.location.origin : "https://jbj.ae";

    const drawHeader = () => {
      // Champagne header bar
      doc.setFillColor(...champagne);
      doc.rect(0, 0, pageW, 70, "F");
      // Gold hairline
      doc.setDrawColor(...gold);
      doc.setLineWidth(0.8);
      doc.line(0, 70, pageW, 70);
      // Brand
      doc.setTextColor(...ink);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("JBJ GLOBAL REAL ESTATE", 40, 32);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...gold);
      doc.text("AI Property Recommendations", 40, 50);
      // Date right
      doc.setTextColor(120, 120, 120);
      doc.setFontSize(8);
      doc.text(new Date().toLocaleDateString(), pageW - 40, 50, { align: "right" });
    };

    const drawFooter = (pageNum: number, total: number) => {
      doc.setDrawColor(...gold);
      doc.setLineWidth(0.6);
      doc.line(40, pageH - 50, pageW - 40, pageH - 50);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(110, 110, 110);
      doc.text("Powered by JBJ Global Real Estate — Brokerage | Dubai, UAE", 40, pageH - 32);
      doc.text("CONTACT@JBJ.AE  ·  www.jbj.ae", 40, pageH - 20);
      doc.text(`Page ${pageNum} / ${total}`, pageW - 40, pageH - 20, { align: "right" });
    };

    drawHeader();

    // Title
    doc.setTextColor(...ink);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Your AI-Selected Properties", 40, 110);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text(
      "Personalized selection based on your preferences",
      40,
      130
    );

    // Build one table per project
    let cursorY = 160;
    projects.forEach((p, idx) => {
      const badge = badges[p.id];
      const badgeStr = badge ? `  [${badgeLabels[badge].label}]` : "";
      if (cursorY > pageH - 200) {
        doc.addPage();
        drawHeader();
        cursorY = 100;
      }

      // Project title row
      doc.setFillColor(...champagne);
      doc.rect(40, cursorY, pageW - 80, 32, "F");
      doc.setDrawColor(...gold);
      doc.setLineWidth(0.5);
      doc.rect(40, cursorY, pageW - 80, 32);
      doc.setTextColor(...ink);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text(`#${idx + 1}  ${p.name}${badgeStr}`, 50, cursorY + 21);
      cursorY += 32;

      const beds =
        p.bedrooms_min != null && p.bedrooms_max != null
          ? p.bedrooms_min === 0
            ? `Studio${p.bedrooms_max > 0 ? ` - ${p.bedrooms_max} BR` : ""}`
            : `${p.bedrooms_min} - ${p.bedrooms_max} BR`
          : "Type TBC";

      autoTable(doc, {
        startY: cursorY,
        margin: { left: 40, right: 40 },
        theme: "grid",
        styles: { font: "helvetica", fontSize: 10, textColor: ink, lineColor: [220, 200, 160] },
        headStyles: { fillColor: champagne, textColor: ink, fontStyle: "bold" },
        body: [
          ["Developer", p.developer?.name || "N/A"],
          ["Location", `${p.location || ""}, ${p.emirate || "UAE"}`],
          [
            "Price From",
            p.price_from ? `AED ${(p.price_from / 1000000).toFixed(1)}M` : "Price on Request",
          ],
          ["Bedrooms", beds],
          ["Handover", p.handover_date || "TBA"],
          ["Payment Plan", p.payment_plan || "Contact Us"],
          ["Listing", `${origin}/project/${p.slug}`],
        ],
        columnStyles: {
          0: { cellWidth: 110, fontStyle: "bold", fillColor: [253, 251, 247] },
          1: { cellWidth: "auto" },
        },
      });

      cursorY = (doc as any).lastAutoTable.finalY + 18;
    });

    // Page numbers
    const total = doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      drawFooter(i, total);
    }

    return doc;
  };

  const handleDownloadReport = () => {
    const doc = buildPdf();
    if (!doc) return;
    doc.save("JBJ-AI-Property-Recommendations.pdf");
    toast.success("Report downloaded!");
    // Immediately offer sharing options after download
    setShareTrigger("post-download");
    setShareModalOpen(true);
  };

  const handleOpenShare = () => {
    setShareTrigger("share");
    setShareModalOpen(true);
  };

  // Channel handlers
  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(buildShareText());
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
    toast.success("Opening WhatsApp…");
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent("My JBJ AI Property Recommendations");
    const body = encodeURIComponent(buildShareText());
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    toast.success("Opening email client…");
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
    const subject = encodeURIComponent("AI Property Recommendations — Request Consultation");
    const body = encodeURIComponent(
      `Dear JBJ Global Real Estate Team,\n\nI have completed the AI Property Assessment and would like a consultation on the following recommendations:\n\n${buildShareText(false)}\n\nPlease contact me to discuss further.\n\nBest regards`
    );
    window.location.href = `mailto:${JBJ_CONSULTANT_EMAIL}?subject=${subject}&body=${body}`;
    toast.success("Sending to JBJ Consultant…");
  };

  const handleConsultantWhatsApp = () => {
    const text = encodeURIComponent(
      `Hello JBJ Global Real Estate,\n\nI just completed the AI Property Finder and would like a consultation on these recommendations:\n\n${buildShareText(false)}`
    );
    window.open(
      `https://wa.me/${JBJ_CONSULTANT_WHATSAPP}?text=${text}`,
      "_blank",
      "noopener,noreferrer"
    );
    toast.success("Opening WhatsApp to JBJ…");
  };


  if (isLoading) {
    return (
      <section className="min-h-screen bg-gradient-to-b from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-[#B89555] mx-auto mb-4 animate-pulse" />
          <p className="text-[#1A1A1A] text-xl font-semibold">Finding your perfect matches...</p>
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
              <Download className="w-4 h-4 mr-2 text-[#B89555]" />
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
            <h3 className="text-[#1A1A1A] text-xl font-semibold mb-6">More Great Options</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.slice(1).map((project, index) => {
                const badge = badges[project.id];
                return (
                  <div key={project.id} className="relative group flex flex-col h-full border-2 border-[#B89555]/40 rounded-2xl overflow-hidden min-h-[420px] bg-[#FDFBF7]/60 backdrop-blur-sm shadow-[0_4px_16px_rgba(200,167,102,0.15)]">
                    <div className="absolute -top-2 -left-2 z-10 w-8 h-8 bg-[#B89555] rounded-full flex items-center justify-center border-2 border-white shadow-md">
                      <span className="text-[#1A1A1A] text-sm font-bold">#{index + 2}</span>
                    </div>
                    {badge && (
                      <div className="absolute top-2 left-8 z-10">
                        <Badge className={`${badgeLabels[badge].color} ${badgeLabels[badge].textColor} font-semibold px-2 py-0.5 text-xs`}>
                          {badgeLabels[badge].label}
                        </Badge>
                      </div>
                    )}
                    <div className="absolute top-3 right-3 z-10">
                      <FavoriteButton projectId={project.id} size="sm" showShortlist={true} />
                    </div>
                    <div className="flex-1">
                      <ProjectCard project={project} currency="AED" sizeUnit="sqft" />
                    </div>
                    {/* Badge Assignment */}
                    <div className="mt-2 px-2 pb-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full border-[#B89555] text-[#1A1A1A] bg-[#B89555]/10 hover:bg-[#B89555]/20 text-xs">
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
        <div data-allow-dark-cta className="rounded-2xl p-6 bg-[#102540] border border-[#B89555] mb-12">
          <h3 className="text-white text-lg font-semibold mb-5 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#B89555]" />
            Want More AI Power?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* AI Comparison Card */}
            <div className="bg-[#FDFBF7]/80 rounded-2xl p-6 border border-[#B89555]/30 backdrop-blur-sm flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[hsl(40,50%,92%)] via-[hsl(38,40%,87%)] to-[hsl(36,35%,82%)] flex items-center justify-center shadow-md shadow-gold/20">
                  <Sparkles className="w-6 h-6 text-[#1A1A1A]" />
                </div>
                <div>
                  <h3 className="text-[#1A1A1A] font-semibold">AI Comparison</h3>
                  <p className="text-[#1A1A1A]/70 text-sm">Instant analysis</p>
                </div>
              </div>
              <p className="text-[#1A1A1A]/70 text-sm mb-4 flex-1">
                Generate an AI-powered comparison table with star ratings, price analysis, and recommendations.
              </p>
              <Link to="/compare">
                <Button className="w-full bg-gradient-to-r from-[hsl(40,50%,92%)] to-[hsl(36,35%,82%)] hover:brightness-95 text-foreground font-semibold border-2 border-[#B89555]/30">
                  Compare with AI
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Professional Evaluation Card */}
            <div className="bg-[#FDFBF7]/80 rounded-2xl p-6 border border-[#B89555]/30 backdrop-blur-sm flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[hsl(40,50%,92%)] via-[hsl(38,40%,87%)] to-[hsl(36,35%,82%)] flex items-center justify-center shadow-md shadow-gold/20">
                  <Users className="w-6 h-6 text-[#1A1A1A]" />
                </div>
                <div>
                  <h3 className="text-[#1A1A1A] font-semibold">Property Consultant</h3>
                  <p className="text-[#1A1A1A]/70 text-sm">Expert consultation</p>
                </div>
              </div>
              <p className="text-[#1A1A1A]/70 text-sm mb-4 flex-1">
                Request a personalized evaluation from our property consultants with detailed market insights.
              </p>
              <a href={INQUIRY_FORM_URL} target="_blank" rel="noopener noreferrer">
                <Button className="w-full bg-gradient-to-r from-[hsl(40,50%,92%)] to-[hsl(36,35%,82%)] hover:brightness-95 text-foreground font-semibold border-2 border-[#B89555]/30 flex items-center justify-center gap-2">
                  <Users className="w-5 h-5" />
                  Request Evaluation
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
            </div>

            {/* Regenerate / AI Finder Card */}
            <div className="bg-[#FDFBF7]/80 rounded-2xl p-6 border border-[#B89555]/30 backdrop-blur-sm flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[hsl(40,50%,92%)] via-[hsl(38,40%,87%)] to-[hsl(36,35%,82%)] flex items-center justify-center shadow-md shadow-gold/20">
                  <Brain className="w-6 h-6 text-[#1A1A1A]" />
                </div>
                <div>
                  <h3 className="text-[#1A1A1A] font-semibold">AI Home Finder</h3>
                  <p className="text-[#1A1A1A]/70 text-sm">New search</p>
                </div>
              </div>
              <p className="text-[#1A1A1A]/70 text-sm mb-4 flex-1">
                Not satisfied? Retake the AI quiz with different preferences to discover new matches.
              </p>
              <Button
                onClick={() => navigate("/quiz")}
                className="w-full bg-gradient-to-r from-[hsl(40,50%,92%)] to-[hsl(36,35%,82%)] hover:brightness-95 text-foreground font-semibold border-2 border-[#B89555]/30"
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
              <Button data-allow-dark-cta className="bg-[#102540] text-white hover:bg-[#1a3d63] hover:text-white [&_svg]:text-white font-semibold px-6 py-3 border border-[#B89555] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(184,149,85,0.35)] transition-all duration-300">
                Browse All Properties
                <ArrowRight className="w-4 h-4 ml-2" />
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
