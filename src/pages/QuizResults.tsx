import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, ArrowRight, RefreshCw, Download, Award, Share2, Users, X, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ProjectCard from "@/components/ProjectCard";
import FavoriteButton from "@/components/FavoriteButton";
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


const QuizResults = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasActiveMembership } = useMembership();
  const [searchParams] = useSearchParams();
  const projectSlugs = searchParams.get("projects")?.split(",") || [];
  const isFreeUse = searchParams.get("free") === "true";
  const [badges, setBadges] = useState<Record<string, 'top1' | 'top2' | 'top3' | null>>({});
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [showVipModal, setShowVipModal] = useState(false);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["quiz-results", projectSlugs],
    queryFn: async () => {
      if (!projectSlugs.length) return [];
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          developer:developers(id, name, slug, description),
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
        .filter(p => p.cover_image_url || p.images.length > 0)
        .filter(p => {
          const hd = (p as any).handover_date;
          if (hd) {
            const hLower = hd.toLowerCase();
            if (!hLower.includes("ready")) {
              const yearMatch = hd.match(/\b(20\d{2})\b/);
              if (yearMatch && parseInt(yearMatch[1]) < 2026) return false;
            }
          }
          return true;
        })
        .sort((a, b) => projectSlugs.indexOf(a.slug) - projectSlugs.indexOf(b.slug));
    },
    enabled: projectSlugs.length > 0,
  });

  const handleSetBadge = (projectId: string, badge: 'top1' | 'top2' | 'top3' | null) => {
    setBadges(prev => ({ ...prev, [projectId]: badge }));
  };

  const badgeLabels = {
    top1: { label: "Top 1", sublabel: "Gold", color: "bg-gradient-to-r from-[#C9A84C] via-[#E8D5A3] to-[#C9A84C] border-2 border-[#C9A84C] shadow-lg", textColor: "text-black", medalColor: "text-[#C9A84C]" },
    top2: { label: "Top 2", sublabel: "Silver", color: "bg-gradient-to-r from-[#A0A0A0] via-[#E8E8E8] to-[#A0A0A0] border-2 border-[#B0B0B0] shadow-lg", textColor: "text-black", medalColor: "text-[#A0A0A0]" },
    top3: { label: "Top 3", sublabel: "Bronze", color: "bg-gradient-to-r from-[#CD7F32] via-[#E8A84C] to-[#CD7F32] border-2 border-[#CD7F32] shadow-lg", textColor: "text-white", medalColor: "text-[#CD7F32]" },
  };

  const handleDownloadReport = () => {
    if (!projects?.length) return;

    const reportHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>JBJ Global Real Estate - AI Property Recommendations</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 40px; background: #FDFBF7; color: #1a1a1a; }
    .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #C9A84C; padding-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; color: #1a1a1a; }
    .logo span { color: #C9A84C; }
    .title { font-size: 32px; margin: 20px 0 10px; color: #1a1a1a; }
    .subtitle { color: #666; font-size: 16px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-right: 8px; }
    .badge-gold { background: linear-gradient(to right, #C9A84C, #E8D5A3); color: #000; border: 2px solid #C9A84C; }
    .badge-silver { background: linear-gradient(to right, #A0A0A0, #E8E8E8); color: #000; border: 2px solid #B0B0B0; }
    .badge-bronze { background: linear-gradient(to right, #CD7F32, #E8A84C); color: #fff; border: 2px solid #CD7F32; }
    .project { background: #fff; border-radius: 16px; padding: 24px; margin-bottom: 24px; border: 2px solid #C9A84C; box-shadow: 0 4px 16px rgba(200,167,102,0.15); }
    .project-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
    .project-name { font-size: 20px; font-weight: bold; margin-bottom: 4px; color: #1a1a1a; }
    .developer { color: #C9A84C; font-size: 14px; font-weight: 600; }
    .rank { font-size: 28px; font-weight: bold; color: #C9A84C; }
    .details { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 16px; }
    .detail-item { background: #F5F0E6; padding: 12px; border-radius: 8px; border: 1px solid #C9A84C20; }
    .detail-label { color: #888; font-size: 12px; margin-bottom: 4px; }
    .detail-value { font-size: 14px; font-weight: 600; color: #1a1a1a; }
    .footer { text-align: center; margin-top: 40px; padding-top: 30px; border-top: 2px solid #C9A84C; color: #666; }
    .exclusive { background: linear-gradient(to right, rgba(201,168,76,0.15), rgba(201,168,76,0.08)); border: 2px solid rgba(201,168,76,0.4); padding: 12px 20px; border-radius: 8px; text-align: center; margin-bottom: 30px; }
    .exclusive span { color: #C9A84C; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo"><span>JBJ</span> GLOBAL REAL ESTATE</div>
    <h1 class="title">Your AI Property Recommendations</h1>
    <p class="subtitle">Personalized selection based on your preferences</p>
  </div>

  <div class="exclusive">
    <span>&#9733;</span> #1 AI Property Matchmaker — Exclusive by JBJ Global Real Estate <span>&#9733;</span>
  </div>

  ${projects.map((project, index) => {
    const badge = badges[project.id];
    return `
    <div class="project">
      <div class="project-header">
        <div>
          ${badge ? `<span class="badge badge-${badge === 'top1' ? 'gold' : badge === 'top2' ? 'silver' : 'bronze'}">${badgeLabels[badge].label} (${badgeLabels[badge].sublabel})</span>` : ''}
          <h2 class="project-name">${project.name}</h2>
          <p class="developer">${project.developer?.name || 'Developer'}</p>
        </div>
        <div class="rank">#${index + 1}</div>
      </div>
      <div class="details">
        <div class="detail-item">
          <div class="detail-label">Location</div>
          <div class="detail-value">${project.location || 'N/A'}, ${project.emirate || 'UAE'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Price From</div>
          <div class="detail-value">${project.price_from ? `AED ${(project.price_from / 1000000).toFixed(1)}M` : 'Price on Request'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Bedrooms</div>
          <div class="detail-value">${project.bedrooms_min != null && project.bedrooms_max != null ? `${project.bedrooms_min === 0 ? 'Studio' : project.bedrooms_min} - ${project.bedrooms_max} BR` : 'Type TBC'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Handover</div>
          <div class="detail-value">${project.handover_date || 'TBA'}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Size Range</div>
          <div class="detail-value">${project.size_min?.toLocaleString() || 'N/A'} - ${project.size_max?.toLocaleString() || 'N/A'} sqft</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Payment Plan</div>
          <div class="detail-value">${project.payment_plan || 'Contact Us'}</div>
        </div>
      </div>
    </div>
    `;
  }).join('')}

  <div class="footer">
    <p>Generated by JBJ Global Real Estate AI Property Matcher</p>
    <p>Powered & Made by JBJ Global Real Estate — Brokerage</p>
    <p>Contact: CONTACT@JBJ.AE | www.JBJ.ae</p>
  </div>
</body>
</html>
    `;

    const blob = new Blob([reportHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'JBJ-Global-Real-Estate-AI-Recommendations.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Report downloaded!");
  };

  const handleShareToCompany = () => {
    if (!projects?.length) return;

    const projectList = projects.map((p, i) => {
      const badge = badges[p.id];
      const badgeStr = badge ? ` [${badgeLabels[badge].label} - ${badgeLabels[badge].sublabel}]` : '';
      return `${i + 1}. ${p.name}${badgeStr}
   Developer: ${p.developer?.name || 'N/A'}
   Location: ${p.location}, ${p.emirate}
    Price: ${p.price_from ? `AED ${(p.price_from / 1000000).toFixed(1)}M` : 'Price on Request'}
   Bedrooms: ${p.bedrooms_min != null && p.bedrooms_max != null ? `${p.bedrooms_min === 0 ? 'Studio' : p.bedrooms_min} - ${p.bedrooms_max} BR` : 'Type TBC'}
   Handover: ${p.handover_date || 'TBA'}`;
    }).join('\n\n');

    const subject = encodeURIComponent("AI Property Recommendations - Request for Consultation");
    const body = encodeURIComponent(`Dear JBJ Global Real Estate Team,

I have completed the AI Property Assessment and would like to request a consultation regarding the following recommendations:

${projectList}

Please contact me to discuss these options further.

Best regards`);

    window.location.href = `mailto:CONTACT@JBJ.AE?subject=${subject}&body=${body}`;
    setShareModalOpen(false);
    toast.success("Opening email client...");
  };

  if (isLoading) {
    return (
      <section className="min-h-screen bg-gradient-to-b from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-[#C9A84C] mx-auto mb-4 animate-pulse" />
          <p className="text-stone-800 text-xl font-semibold">Finding your perfect matches...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gradient-to-b from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] py-12 md:py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#C9A84C]/20 to-[#C9A84C]/10 border border-[#C9A84C]/40 mb-6">
            <Sparkles className="w-4 h-4 text-[#C9A84C]" />
            <span className="text-stone-800 text-sm font-medium">#1 AI Property Matchmaker — Exclusive by JBJ Global Real Estate</span>
          </div>
          
          <h1 className="text-stone-900 text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
            Your AI-Selected Properties
          </h1>
          <p className="text-stone-500 text-lg max-w-2xl mx-auto mb-6">
            Based on your preferences, our AI has selected these properties that best match your criteria
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              onClick={handleDownloadReport}
              className="bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] text-stone-900 hover:brightness-95 font-semibold shadow-md border-2 border-[#C9A84C]"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </Button>
            <Button
              onClick={() => setShareModalOpen(true)}
              className="bg-gradient-to-r from-[#C9A84C] to-[#B8973F] text-black hover:brightness-110 font-semibold"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share with Consultant
            </Button>
          </div>
        </div>

        {/* Top Recommendation */}
        {projects && projects.length > 0 && (
          <div className="mb-12">
            <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden border-2 border-[#C9A84C] shadow-[0_8px_32px_rgba(200,167,102,0.2)]">
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                <div className="bg-gradient-to-r from-[#C9A84C] to-[#B8973F] text-black text-sm font-semibold px-4 py-1.5 rounded-full">
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
                  <p className="text-stone-500 text-sm mb-2">{projects[0].developer?.name}</p>
                  <h2 className="text-stone-900 text-3xl font-bold mb-3">{projects[0].name}</h2>
                  <p className="text-stone-600 mb-6">{projects[0].location}, {projects[0].emirate}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-[#F5F0E6] rounded-xl p-4 border border-[#C9A84C]/20">
                      <p className="text-stone-500 text-sm">Price From</p>
                      <p className="text-stone-900 text-xl font-semibold">
                        {projects[0].price_from
                          ? `AED ${(projects[0].price_from / 1000000).toFixed(1)}M`
                          : "Price on Request"}
                      </p>
                    </div>
                    <div className="bg-[#F5F0E6] rounded-xl p-4 border border-[#C9A84C]/20">
                      <p className="text-stone-500 text-sm">Bedrooms</p>
                      <p className="text-stone-900 text-xl font-semibold">
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
                        <Button variant="outline" size="sm" className="border-[#C9A84C] text-stone-800 bg-[#C9A84C]/10 hover:bg-[#C9A84C]/20">
                          <Award className="w-4 h-4 mr-2" />
                          {badges[projects[0].id] ? 'Change Badge' : 'Add Badge'}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-white border-[#C9A84C]/30">
                        <DropdownMenuItem onClick={() => handleSetBadge(projects[0].id, 'top1')} className="text-[#C9A84C] hover:bg-[#C9A84C]/10">
                          Top 1 — Gold
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSetBadge(projects[0].id, 'top2')} className="text-[#888] hover:bg-[#C9A84C]/10">
                          Top 2 — Silver
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSetBadge(projects[0].id, 'top3')} className="text-[#CD7F32] hover:bg-[#C9A84C]/10">
                          Top 3 — Bronze
                        </DropdownMenuItem>
                        {badges[projects[0].id] && (
                          <DropdownMenuItem onClick={() => handleSetBadge(projects[0].id, null)} className="text-stone-400 hover:bg-[#C9A84C]/10">
                            <X className="w-4 h-4 mr-2" /> Remove Badge
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <Link to={`/project/${projects[0].slug}`}>
                    <Button className="bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] text-stone-900 hover:brightness-95 w-full md:w-auto border-2 border-[#C9A84C] font-semibold">
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
            <h3 className="text-stone-900 text-xl font-semibold mb-6">More Great Options</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.slice(1).map((project, index) => {
                const badge = badges[project.id];
                return (
                  <div key={project.id} className="relative group flex flex-col h-full border-2 border-[#C9A84C]/40 rounded-2xl overflow-hidden min-h-[420px] bg-white/60 backdrop-blur-sm shadow-[0_4px_16px_rgba(200,167,102,0.15)]">
                    <div className="absolute -top-2 -left-2 z-10 w-8 h-8 bg-[#C9A84C] rounded-full flex items-center justify-center border-2 border-white shadow-md">
                      <span className="text-black text-sm font-bold">#{index + 2}</span>
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
                          <Button variant="outline" size="sm" className="w-full border-[#C9A84C] text-stone-800 bg-[#C9A84C]/10 hover:bg-[#C9A84C]/20 text-xs">
                            <Award className="w-3 h-3 mr-1" />
                            {badge ? 'Change Badge' : 'Add Badge'}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-white border-[#C9A84C]/30">
                          <DropdownMenuItem onClick={() => handleSetBadge(project.id, 'top1')} className="text-[#C9A84C] hover:bg-[#C9A84C]/10">
                            Top 1 — Gold
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSetBadge(project.id, 'top2')} className="text-[#888] hover:bg-[#C9A84C]/10">
                            Top 2 — Silver
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSetBadge(project.id, 'top3')} className="text-[#CD7F32] hover:bg-[#C9A84C]/10">
                            Top 3 — Bronze
                          </DropdownMenuItem>
                          {badge && (
                            <DropdownMenuItem onClick={() => handleSetBadge(project.id, null)} className="text-stone-400 hover:bg-[#C9A84C]/10">
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
        <div className="border-2 border-[#C9A84C]/40 rounded-2xl p-6 bg-white/60 backdrop-blur-sm mb-12">
          <h3 className="text-stone-900 text-lg font-semibold mb-5 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#C9A84C]" />
            Want More AI Power?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* AI Comparison Card */}
            <div className="bg-white/80 rounded-2xl p-6 border border-[#C9A84C]/30 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C9A84C] to-[#B8973F] flex items-center justify-center shadow-lg shadow-[#C9A84C]/30">
                  <Sparkles className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h3 className="text-stone-900 font-semibold">AI Comparison</h3>
                  <p className="text-stone-500 text-sm">Instant analysis</p>
                </div>
              </div>
              <p className="text-stone-600 text-sm mb-4">
                Generate an AI-powered comparison table with star ratings, price analysis, and recommendations.
              </p>
              <Link to="/compare">
                <Button className="w-full bg-gradient-to-r from-[#C9A84C] to-[#B8973F] hover:brightness-110 text-black font-semibold shadow-lg shadow-[#C9A84C]/20">
                  Compare with AI
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Professional Evaluation Card */}
            <div className="bg-white/80 rounded-2xl p-6 border border-[#C9A84C]/30 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C9A84C] to-[#B8973F] flex items-center justify-center shadow-lg shadow-[#C9A84C]/30">
                  <Users className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h3 className="text-stone-900 font-semibold">Property Consultant</h3>
                  <p className="text-stone-500 text-sm">Expert consultation</p>
                </div>
              </div>
              <p className="text-stone-600 text-sm mb-4">
                Request a personalized evaluation from our property consultants with detailed market insights.
              </p>
              <a href={INQUIRY_FORM_URL} target="_blank" rel="noopener noreferrer">
                <Button className="w-full bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] text-stone-900 border-2 border-[#C9A84C] hover:brightness-95 font-semibold flex items-center justify-center gap-2">
                  <Users className="w-5 h-5" />
                  Request Evaluation
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
            </div>

            {/* Regenerate / AI Finder Card */}
            <div className="bg-white/80 rounded-2xl p-6 border border-[#C9A84C]/30 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C9A84C] to-[#B8973F] flex items-center justify-center shadow-lg shadow-[#C9A84C]/30">
                  <RefreshCw className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h3 className="text-stone-900 font-semibold">AI Home Finder</h3>
                  <p className="text-stone-500 text-sm">New search</p>
                </div>
              </div>
              <p className="text-stone-600 text-sm mb-4">
                Not satisfied? Retake the AI quiz with different preferences to discover new matches.
              </p>
              <Button
                onClick={() => navigate("/quiz")}
                className="w-full bg-gradient-to-r from-[#C9A84C] to-[#B8973F] hover:brightness-110 text-black font-semibold shadow-lg shadow-[#C9A84C]/20"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate with AI
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <Link to="/">
              <Button className="bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] text-stone-900 hover:brightness-95 font-semibold px-6 py-3 border-2 border-[#C9A84C]">
                Browse All Properties
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          <p className="text-stone-500 text-xs">
            Powered & Made by{" "}
            <span className="text-stone-900 font-medium">JBJ Global Real Estate</span>
            {" "}— Brokerage | Dubai, UAE
          </p>
        </div>
      </div>

      {/* Share Modal */}
      <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
        <DialogContent className="bg-white border-[#C9A84C]/30 text-stone-900 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-stone-900">
              <Share2 className="w-5 h-5 text-[#C9A84C]" />
              Share Your Results
            </DialogTitle>
            <DialogDescription className="text-stone-500">
              Send your AI recommendations to our team for a personalized consultation
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="bg-[#F5F0E6] rounded-lg p-4 border border-[#C9A84C]/20">
              <p className="text-stone-500 text-xs mb-3">Properties to share:</p>
              {projects?.map((p, i) => {
                const badge = badges[p.id];
                return (
                  <div key={p.id} className="flex items-center gap-2 text-sm py-1">
                    <span className="text-[#C9A84C] font-semibold">#{i + 1}</span>
                    {badge && (
                      <span className={badgeLabels[badge].medalColor}>
                        {badge === 'top1' ? '(Gold)' : badge === 'top2' ? '(Silver)' : '(Bronze)'}
                      </span>
                    )}
                    <span className="text-stone-800">{p.name}</span>
                  </div>
                );
              })}
            </div>

            <Button
              onClick={handleShareToCompany}
              className="w-full bg-gradient-to-r from-[#C9A84C] to-[#B8973F] text-black hover:brightness-110 font-semibold"
            >
              <Mail className="w-4 h-4 mr-2" />
              Send to CONTACT@JBJ.AE
            </Button>

            <p className="text-stone-500 text-xs text-center">
              Our property consultants will contact you within 24 hours
            </p>
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
