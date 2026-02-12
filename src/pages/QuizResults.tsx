import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, ArrowRight, RefreshCw, Download, Award, Share2, Users, X, Mail, Crown, Gift } from "lucide-react";
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
        .in("slug", projectSlugs);

      if (error) throw error;
      
      return data.sort((a, b) => {
        return projectSlugs.indexOf(a.slug) - projectSlugs.indexOf(b.slug);
      });
    },
    enabled: projectSlugs.length > 0,
  });

  const handleSetBadge = (projectId: string, badge: 'top1' | 'top2' | 'top3' | null) => {
    setBadges(prev => ({ ...prev, [projectId]: badge }));
  };

  const badgeLabels = {
    top1: { label: "Top 1", sublabel: "Gold", color: "bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 shadow-lg shadow-yellow-500/30", textColor: "text-white", medalColor: "text-yellow-400" },
    top2: { label: "Top 2", sublabel: "Silver", color: "bg-gradient-to-r from-zinc-300 via-slate-400 to-zinc-400 shadow-lg shadow-zinc-400/30", textColor: "text-white", medalColor: "text-zinc-300" },
    top3: { label: "Top 3", sublabel: "Bronze", color: "bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 shadow-lg shadow-amber-600/30", textColor: "text-white", medalColor: "text-amber-500" },
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
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 40px; background: #0a0a0a; color: #fff; }
    .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #9333ea; padding-bottom: 30px; }
    .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
    .logo span { color: #A8925A; }
    .title { font-size: 32px; margin: 20px 0 10px; }
    .subtitle { color: #888; font-size: 16px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-right: 8px; }
    .badge-gold { background: linear-gradient(to right, #fbbf24, #d97706); color: #000; }
    .badge-silver { background: linear-gradient(to right, #d1d5db, #9ca3af); color: #000; }
    .badge-bronze { background: linear-gradient(to right, #d97706, #b45309); color: #fff; }
    .project { background: #18181b; border-radius: 16px; padding: 24px; margin-bottom: 24px; border: 1px solid #581c87; }
    .project-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
    .project-name { font-size: 20px; font-weight: bold; margin-bottom: 4px; }
    .developer { color: #9333ea; font-size: 14px; }
    .rank { font-size: 28px; font-weight: bold; color: #9333ea; }
    .details { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 16px; }
    .detail-item { background: #27272a; padding: 12px; border-radius: 8px; }
    .detail-label { color: #71717a; font-size: 12px; margin-bottom: 4px; }
    .detail-value { font-size: 14px; font-weight: 500; }
    .footer { text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #27272a; color: #71717a; }
    .exclusive { background: linear-gradient(to right, rgba(147,51,234,0.2), rgba(147,51,234,0.1)); border: 1px solid rgba(147,51,234,0.3); padding: 12px 20px; border-radius: 8px; text-align: center; margin-bottom: 30px; }
    .exclusive span { color: #9333ea; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo"><span>JBJ</span> GLOBAL REAL ESTATE</div>
    <h1 class="title">Your AI Property Recommendations</h1>
    <p class="subtitle">Personalized selection based on your preferences</p>
  </div>

  <div class="exclusive">
    <span>★</span> #1 AI Property Matchmaker — Exclusive by JBJ Global Real Estate <span>★</span>
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
          <div class="detail-value">AED ${((project.price_from || 0) / 1000000).toFixed(1)}M</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Bedrooms</div>
          <div class="detail-value">${project.bedrooms_min || 0} - ${project.bedrooms_max || 0} BR</div>
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
    <p>Contact: Contact@JBJ.ae | www.JBJ.ae</p>
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
   Price: AED ${((p.price_from || 0) / 1000000).toFixed(1)}M - ${((p.price_to || 0) / 1000000).toFixed(1)}M
   Bedrooms: ${p.bedrooms_min} - ${p.bedrooms_max} BR
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
      <section className="min-h-screen bg-gradient-to-b from-purple-950 via-zinc-950 to-black flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-4 animate-pulse" />
          <p className="text-white text-xl">Finding your perfect matches...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gradient-to-b from-purple-950 via-zinc-950 to-black py-12 md:py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-600/30 to-purple-800/30 border border-purple-500/40 mb-6">
            <Sparkles className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-medium">#1 AI Property Matchmaker — Exclusive by JBJ Global Real Estate</span>
          </div>
          
          <h1 className="text-white text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
            Your AI-Selected Properties
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto mb-6">
            Based on your preferences, our AI has selected these properties that best match your criteria
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              onClick={handleDownloadReport}
              variant="outline"
              className="border-purple-500/50 text-white hover:bg-purple-500/10"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </Button>
            <Button
              onClick={() => setShareModalOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-purple-800 text-white hover:from-purple-500 hover:to-purple-700"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share with Consultant
            </Button>
          </div>
        </div>

        {/* Top Recommendation */}
        {projects && projects.length > 0 && (
          <div className="mb-12">
            <div className="relative bg-gradient-to-br from-purple-950/80 via-zinc-900 to-zinc-950 rounded-3xl overflow-hidden border border-purple-900/30">
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white text-sm font-semibold px-4 py-1.5 rounded-full">
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
                    src={projects[0].images?.[0]?.image_url || "/placeholder.svg"}
                    alt={projects[0].name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="p-8 md:p-10 flex flex-col justify-center">
                  <p className="text-zinc-500 text-sm mb-2">{projects[0].developer?.name}</p>
                  <h2 className="text-white text-3xl font-bold mb-3">{projects[0].name}</h2>
                  <p className="text-zinc-400 mb-6">{projects[0].location}, {projects[0].emirate}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-zinc-800/50 rounded-xl p-4">
                      <p className="text-zinc-500 text-sm">Price From</p>
                      <p className="text-white text-xl font-semibold">
                        AED {((projects[0].price_from || 0) / 1000000).toFixed(1)}M
                      </p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-xl p-4">
                      <p className="text-zinc-500 text-sm">Bedrooms</p>
                      <p className="text-white text-xl font-semibold">
                        {projects[0].bedrooms_min} - {projects[0].bedrooms_max} BR
                      </p>
                    </div>
                  </div>

                  {/* Badge Assignment for #1 */}
                  <div className="flex items-center gap-3 mb-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="border-purple-500/40 text-white hover:bg-purple-500/10">
                          <Award className="w-4 h-4 mr-2" />
                          {badges[projects[0].id] ? 'Change Badge' : 'Add Badge'}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-zinc-900 border-purple-900/30">
                        <DropdownMenuItem onClick={() => handleSetBadge(projects[0].id, 'top1')} className="text-yellow-400 hover:bg-purple-900/30">
                          🥇 Top 1 — Gold
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSetBadge(projects[0].id, 'top2')} className="text-gray-300 hover:bg-purple-900/30">
                          🥈 Top 2 — Silver
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSetBadge(projects[0].id, 'top3')} className="text-amber-500 hover:bg-purple-900/30">
                          🥉 Top 3 — Bronze
                        </DropdownMenuItem>
                        {badges[projects[0].id] && (
                          <DropdownMenuItem onClick={() => handleSetBadge(projects[0].id, null)} className="text-zinc-400 hover:bg-purple-900/30">
                            <X className="w-4 h-4 mr-2" /> Remove Badge
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <Link to={`/project/${projects[0].slug}`}>
                    <Button className="bg-white text-zinc-900 hover:bg-zinc-100 w-full md:w-auto">
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
            <h3 className="text-white text-xl font-semibold mb-6">More Great Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {projects.slice(1).map((project, index) => {
                const badge = badges[project.id];
                return (
                  <div key={project.id} className="relative group">
                    <div className="absolute -top-2 -left-2 z-10 w-8 h-8 bg-purple-900 rounded-full flex items-center justify-center border border-purple-700">
                      <span className="text-white text-sm font-bold">#{index + 2}</span>
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
                    <ProjectCard project={project} currency="AED" sizeUnit="sqft" />
                    {/* Badge Assignment */}
                    <div className="mt-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full border-purple-500/30 text-white hover:bg-purple-500/10 text-xs">
                            <Award className="w-3 h-3 mr-1" />
                            {badge ? 'Change Badge' : 'Add Badge'}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-zinc-900 border-purple-900/30">
                          <DropdownMenuItem onClick={() => handleSetBadge(project.id, 'top1')} className="text-yellow-400 hover:bg-purple-900/30">
                            🥇 Top 1 — Gold
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSetBadge(project.id, 'top2')} className="text-gray-300 hover:bg-purple-900/30">
                            🥈 Top 2 — Silver
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSetBadge(project.id, 'top3')} className="text-amber-500 hover:bg-purple-900/30">
                            🥉 Top 3 — Bronze
                          </DropdownMenuItem>
                          {badge && (
                            <DropdownMenuItem onClick={() => handleSetBadge(project.id, null)} className="text-zinc-400 hover:bg-purple-900/30">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* AI Comparison Card */}
          <div className="bg-zinc-900/80 rounded-2xl p-6 border border-purple-900/30 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">AI Comparison</h3>
                <p className="text-zinc-500 text-sm">Instant analysis</p>
              </div>
            </div>
            <p className="text-zinc-400 text-sm mb-4">
              Generate an AI-powered comparison table with star ratings, price analysis, and recommendations.
            </p>
            <Link to="/compare">
              <Button className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white shadow-lg shadow-purple-500/20">
                Compare with AI
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Professional Evaluation Card */}
          <div className="bg-zinc-900/80 rounded-2xl p-6 border border-purple-900/30 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-lg shadow-gold/30">
                <Users className="w-6 h-6 text-black" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Property Consultant</h3>
                <p className="text-zinc-500 text-sm">Expert consultation</p>
              </div>
            </div>
            <p className="text-zinc-400 text-sm mb-4">
              Request a personalized evaluation from our property consultants with detailed market insights.
            </p>
            <a href={INQUIRY_FORM_URL} target="_blank" rel="noopener noreferrer">
              <Button className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 py-3">
                <Users className="w-5 h-5 text-white" />
                <span className="text-base">Request Evaluation</span>
                <ArrowRight className="w-5 h-5" />
              </Button>
            </a>
          </div>
        </div>

        {/* Actions */}
        <div className="text-center">
          {/* Free Use Banner */}
          {isFreeUse && !hasActiveMembership && (
            <div className="bg-gradient-to-r from-gold/20 to-gold/10 border border-gold/40 rounded-2xl p-6 mb-8 max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Crown className="w-6 h-6 text-gold" />
                <h3 className="text-white text-xl font-semibold">Want More AI Power?</h3>
              </div>
              <p className="text-zinc-400 mb-4">
                You've used your free property match. Upgrade to VIP for unlimited regenerations and AI analysis!
              </p>
              <Button 
                onClick={() => setShowVipModal(true)}
                className="bg-gradient-to-r from-gold via-gold to-gold-dark text-black font-semibold hover:brightness-110 px-8 py-3"
              >
                <Crown className="w-5 h-5 mr-2" />
                Upgrade to VIP — $100/year
              </Button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <Button 
              onClick={() => {
                if (hasActiveMembership) {
                  navigate("/quiz");
                } else {
                  setShowVipModal(true);
                }
              }}
              variant="outline" 
              className={`font-semibold px-6 py-3 ${
                hasActiveMembership
                  ? "border-purple-400 bg-purple-900/30 text-white hover:bg-purple-500/30 hover:text-white"
                  : "border-gold/50 bg-gold/10 text-gold hover:bg-gold/20 hover:text-gold"
              }`}
            >
              {hasActiveMembership ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2" />
                  <span className="text-base">Regenerate with AI</span>
                </>
              ) : (
                <>
                  <Crown className="w-5 h-5 mr-2" />
                  <span className="text-base">Regenerate (VIP)</span>
                </>
              )}
            </Button>
            <Link to="/">
              <Button className="bg-white text-zinc-900 hover:bg-zinc-100">
                Browse All Properties
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          
          <p className="text-purple-300/80 text-xs">
            Powered & Made by{" "}
            <span className="text-white font-medium">JBJ Global Real Estate</span>
            {" "}• Brokerage | Dubai, UAE
          </p>
        </div>
      </div>

      {/* Share Modal */}
      <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
        <DialogContent className="bg-zinc-900 border-purple-900/30 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-purple-400" />
              Share Your Results
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Send your AI recommendations to our team for a personalized consultation
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="bg-zinc-800 rounded-lg p-4">
              <p className="text-zinc-400 text-xs mb-3">Properties to share:</p>
              {projects?.map((p, i) => {
                const badge = badges[p.id];
                return (
                  <div key={p.id} className="flex items-center gap-2 text-sm py-1">
                    <span className="text-purple-400">#{i + 1}</span>
                    {badge && (
                      <span className={badgeLabels[badge].medalColor}>
                        {badge === 'top1' ? '🥇' : badge === 'top2' ? '🥈' : '🥉'}
                      </span>
                    )}
                    <span className="text-white">{p.name}</span>
                  </div>
                );
              })}
            </div>

            <Button
              onClick={handleShareToCompany}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-800 text-white hover:from-purple-500 hover:to-purple-700"
            >
              <Mail className="w-4 h-4 mr-2" />
              Send to Contact@JBJ.ae
            </Button>

            <p className="text-zinc-500 text-xs text-center">
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