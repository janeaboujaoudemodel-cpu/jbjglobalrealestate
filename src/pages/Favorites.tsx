import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites, useShortlist, useToggleShortlist } from "@/hooks/useFavorites";
import { useGuestFavorites, useGuestShortlist } from "@/hooks/useGuestFavorites";
import { useShortlistBadges } from "@/hooks/useShortlistBadges";
import { useDesignFavorites, useDesignShortlist, useToggleDesignFavorite, groupByType, DESIGN_TYPE_LABELS, DesignItemType } from "@/hooks/useDesignFavorites";
import { CONTACT_INFO, getWhatsAppUrl } from "@/constants/stats";
import { ChevronLeft, Heart, ListPlus, ArrowRight, ArrowUpRight, Award, X, Mail, Share2, Sparkles, Users, CheckSquare, Download, MessageCircle, Copy, Stamp, FileText, Briefcase, PenTool, File, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import ProjectCard from "@/components/ProjectCard";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import ProjectCard from "@/components/ProjectCard";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const INQUIRY_FORM_URL = "https://JBJ.ae/contact";

const Favorites = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") === "shortlist" ? "shortlist" : "favorites";
  const [selectedFavorites, setSelectedFavorites] = useState<string[]>([]);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  
  const { data: userFavorites, isLoading: loadingFavorites } = useFavorites();
  const { data: userShortlist, isLoading: loadingShortlist } = useShortlist();
  const { favorites: guestFavorites, toggleFavorite } = useGuestFavorites();
  const { shortlist: guestShortlist, toggleShortlist: toggleGuestShortlist } = useGuestShortlist();
  const { setBadge, getBadge } = useShortlistBadges();
  const toggleShortlistMutation = useToggleShortlist();

  const favoriteIds = user 
    ? (userFavorites?.map(f => f.project_id) || [])
    : guestFavorites.map(f => f.project_id);
  
  const shortlistIds = user
    ? (userShortlist?.map(s => s.project_id) || [])
    : guestShortlist.map(s => s.project_id);

  const { data: favoriteProjects, isLoading: loadingFavProjects } = useQuery({
    queryKey: ["favorite-projects", favoriteIds],
    queryFn: async () => {
      if (!favoriteIds.length) return [];
      const { data, error } = await supabase
        .from("projects")
        .select(`*, developer:developers(id, name, slug), images:project_images(id, image_url, alt_text, display_order), community:communities(id, name, slug), documents:project_documents(id, file_url, file_name, document_type)`)
        .in("id", favoriteIds);
      if (error) throw error;
      return data;
    },
    enabled: favoriteIds.length > 0,
  });

  const { data: shortlistedProjects, isLoading: loadingShortProjects } = useQuery({
    queryKey: ["shortlisted-projects-full", shortlistIds],
    queryFn: async () => {
      if (!shortlistIds.length) return [];
      const { data, error } = await supabase
        .from("projects")
        .select(`*, developer:developers(id, name, slug), images:project_images(id, image_url, alt_text, display_order), community:communities(id, name, slug), documents:project_documents(id, file_url, file_name, document_type)`)
        .in("id", shortlistIds);
      if (error) throw error;
      return data;
    },
    enabled: shortlistIds.length > 0,
  });

  const isLoading = user ? loadingFavorites || loadingShortlist : false;
  const favCount = favoriteIds.length;
  const shortlistCount = shortlistIds.length;

  const getProjectBadge = (projectId: string) => getBadge(projectId);
  const handleSetBadge = (projectId: string, badge: 'top1' | 'top2' | 'top3' | null) => setBadge(projectId, badge);

  const handleMoveToShortlist = () => {
    if (selectedFavorites.length === 0) { toast.error("Please select properties to move"); return; }
    selectedFavorites.forEach((projectId) => {
      if (!shortlistIds.includes(projectId)) {
        if (user) { toggleShortlistMutation.mutate({ projectId, isShortlisted: false }); }
        else { toggleGuestShortlist(projectId); }
      }
    });
    toast.success(`Moved ${selectedFavorites.length} properties to shortlist`);
    setSelectedFavorites([]);
  };

  const toggleFavoriteSelection = (projectId: string) => {
    setSelectedFavorites(prev => prev.includes(projectId) ? prev.filter(id => id !== projectId) : [...prev, projectId]);
  };

  const selectAllFavorites = () => {
    if (favoriteProjects) setSelectedFavorites(favoriteProjects.map(p => p.id));
  };

  const buildShortlistShareText = () => {
    const list = (shortlistedProjects || []).map((p, i) => {
      const badge = getProjectBadge(p.id);
      const badgeStr = badge ? badge === 'top1' ? " (Top 1 — Gold)" : badge === 'top2' ? " (Top 2 — Silver)" : " (Top 3 — Bronze)" : "";
      const url = `${window.location.origin}/project/${p.slug}`;
      return `${i + 1}. ${p.name}${badgeStr} — ${p.developer?.name || 'Developer'} — ${url}`;
    });
    const subject = "My Property Shortlist — JBJ Global Real Estate";
    const body = `Hi,\n\nHere is my shortlisted properties for review:\n\n${list.join("\n")}\n\nI would like a consultation and tailored advisory on my shortlist.\n\nBest regards`;
    const whatsapp = `My JBJ Global Real Estate shortlist:\n\n${list.join("\n")}`;
    return { subject, body, whatsapp, plain: list.join("\n") };
  };

  const openMailto = (to?: string) => {
    const { subject, body } = buildShortlistShareText();
    const mailtoLink = to
      ? `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      : `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  const handleEmailShare = () => {
    if (!shortlistedProjects?.length) return;
    openMailto(shareEmail || undefined);
    setShareModalOpen(false);
    toast.success("Opening email client...");
  };

  const handleSendToTeam = () => {
    if (!shortlistedProjects?.length) return;
    openMailto(CONTACT_INFO.email);
    setShareModalOpen(false);
    toast.success("Opening email to JBJ Global Real Estate team...");
  };

  const handleShareWhatsApp = () => {
    if (!shortlistedProjects?.length) return;
    const { whatsapp } = buildShortlistShareText();
    window.location.href = getWhatsAppUrl(whatsapp);
  };

  const handleCopyShortlist = async () => {
    if (!shortlistedProjects?.length) return;
    try {
      const { plain } = buildShortlistShareText();
      await navigator.clipboard.writeText(plain);
      toast.success("Shortlist copied");
    } catch { toast.error("Could not copy shortlist"); }
  };

  const handleDownloadShortlist = () => {
    if (!shortlistedProjects?.length) return;
    const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><title>Shortlist — JBJ Global Real Estate</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui;background:#FDFBF7;color:#1a1a1a;padding:32px}.container{max-width:1100px;margin:0 auto}.header{border-bottom:1px solid rgba(201,168,76,.35);padding-bottom:18px;margin-bottom:22px;text-align:center}.logo{letter-spacing:.18em;font-weight:700}.gold{color:#C9A84C}.sub{color:#666;margin-top:10px;font-size:13px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}.card{background:#fff;border:1px solid rgba(201,168,76,.2);border-radius:14px;overflow:hidden}.img{width:100%;height:160px;object-fit:contain;object-position:center;display:block;background:#f5f0e6}.content{padding:14px}.title{font-size:16px;font-weight:700;margin-bottom:6px}.meta{color:#666;font-size:12px;margin-bottom:10px}.badge{display:inline-block;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:700;background:rgba(201,168,76,.15);border:1px solid rgba(201,168,76,.35)}.links a{color:#C9A84C;text-decoration:none}.footer{margin-top:26px;padding-top:16px;border-top:1px solid rgba(201,168,76,.2);color:#888;text-align:center;font-size:12px}</style>
</head><body><div class="container"><div class="header"><div class="logo"><span class="gold">JBJ</span> GLOBAL REAL ESTATE</div><div class="sub">Shortlist prepared on ${dateStr}</div></div><div class="grid">${shortlistedProjects.map((p, i) => {
      const badge = getProjectBadge(p.id);
      const badgeStr = badge ? badge === 'top1' ? 'Top 1 — Gold' : badge === 'top2' ? 'Top 2 — Silver' : 'Top 3 — Bronze' : null;
      const img = p.images?.[0]?.image_url || "";
      const url = `${window.location.origin}/project/${p.slug}`;
      return `<div class="card">${img ? `<img class="img" src="${img}" alt="${p.name}"/>` : ''}<div class="content"><div class="title">${i + 1}. ${p.name}</div><div class="meta">${p.developer?.name || 'Developer'} • ${p.location || 'UAE'}</div>${badgeStr ? `<div class="badge">${badgeStr}</div>` : ''}<div class="links" style="margin-top:10px;font-size:12px">View: <a href="${url}">${url}</a></div></div></div>`;
    }).join('')}</div><div class="footer">CONTACT@JBJ.AE • +971 56 591 1000 • JBJ.AE</div></div></body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `JBJ-Shortlist-${dateStr.replace(/\s+/g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Shortlist downloaded");
  };

  const badgeLabels = {
    top1: { label: "Top 1 — Gold", color: "bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 shadow-lg shadow-yellow-500/30", textColor: "text-white" },
    top2: { label: "Top 2 — Silver", color: "bg-gradient-to-r from-zinc-300 via-slate-400 to-zinc-400 shadow-lg shadow-zinc-400/30", textColor: "text-zinc-900" },
    top3: { label: "Top 3 — Bronze", color: "bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 shadow-lg shadow-amber-600/30", textColor: "text-white" },
  };

  return (
    <section className="min-h-screen bg-gradient-to-b from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] py-8 md:py-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <Link to="/" className="inline-flex items-center gap-2 text-gold/60 hover:text-gold transition-colors mb-8">
          <ChevronLeft className="w-5 h-5" />
          <span>Back to Properties</span>
        </Link>

        <h1 className="text-black text-3xl font-bold mb-2">My Saved Properties</h1>
        <p className="text-black/50 mb-8">Manage your favorites and shortlist</p>

        {!user && (
          <div className="bg-white/60 border border-gold/20 rounded-xl p-4 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-black/60 text-sm">
              <span className="text-black/80 font-medium">Guest Mode:</span> Your saved properties are stored locally. Sign in to sync across devices.
            </p>
            <Link to="/auth" className="shrink-0">
              <Button size="sm" className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] text-black font-semibold hover:brightness-95 border border-gold/30">
                Sign In
              </Button>
            </Link>
          </div>
        )}

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="bg-white/60 border border-gold/20 p-1 mb-8">
            <TabsTrigger
              value="favorites"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border data-[state=active]:border-gold/30 text-black/50"
            >
              <Heart className="w-4 h-4 mr-2" />
              Favorites ({favCount})
            </TabsTrigger>
            <TabsTrigger
              value="shortlist"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border data-[state=active]:border-gold/30 text-black/50"
            >
              <ListPlus className="w-4 h-4 mr-2" />
              Shortlist ({shortlistCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="favorites">
            {isLoading || loadingFavProjects ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="aspect-[4/3] bg-white/40 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : favoriteProjects?.length ? (
              <>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 bg-white/60 rounded-xl p-4 border border-gold/20 gap-3">
                  <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={selectAllFavorites} className="border-gold/30 text-black hover:bg-gold/10">
                      <CheckSquare className="w-4 h-4 mr-2" />
                      Select All
                    </Button>
                    <span className="text-black/50 text-sm">{selectedFavorites.length} selected</span>
                  </div>
                  <Button onClick={handleMoveToShortlist} disabled={selectedFavorites.length === 0} className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] text-black hover:brightness-95 border border-gold/30">
                    <ListPlus className="w-4 h-4 mr-2" />
                    Move to Shortlist
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {favoriteProjects.map((project) => (
                    <div key={project.id} className="relative">
                      <div className="absolute top-2 left-2 z-20">
                        <div
                          className={`w-6 h-6 rounded-md flex items-center justify-center cursor-pointer transition-all ${
                            selectedFavorites.includes(project.id)
                              ? "bg-gold text-black"
                              : "bg-white/80 border border-gold/30 hover:border-gold"
                          }`}
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavoriteSelection(project.id); }}
                        >
                          {selectedFavorites.includes(project.id) && (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <ProjectCard project={project} currency="AED" sizeUnit="sqft" />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16 bg-white/60 rounded-2xl border border-gold/20">
                <div className="max-w-md mx-auto px-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 flex items-center justify-center mx-auto mb-6">
                    <Heart className="w-10 h-10 text-gold/70" />
                  </div>
                  <h3 className="text-black text-xl font-semibold mb-3">Your Favorites List is Empty</h3>
                  <p className="text-black/50 mb-3">Save properties you love by clicking the heart icon on any listing.</p>
                  <p className="text-black/30 text-sm mb-8">Tip: Add properties to your favorites, then move your top picks to your shortlist for final evaluation.</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link to="/properties">
                      <Button className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] text-black hover:brightness-95 border border-gold/30">
                        Explore Properties <ArrowUpRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                    <Link to="/quiz">
                      <Button variant="outline" className="border-gold/30 text-black hover:bg-gold/10">
                        <Sparkles className="w-4 h-4 mr-2" /> AI Home Finder
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="shortlist">
            {isLoading || loadingShortProjects ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="aspect-[4/3] bg-white/40 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : shortlistedProjects?.length ? (
              <>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 bg-white/60 rounded-xl p-4 border border-gold/20">
                  <p className="text-black/50 text-sm">
                    Rank your top properties with badges: <span className="text-yellow-600">🥇 Gold</span>, <span className="text-zinc-500">🥈 Silver</span>, <span className="text-amber-600">🥉 Bronze</span>
                  </p>
                  <Button onClick={() => setShareModalOpen(true)} className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] text-black hover:brightness-95 border border-gold/30">
                    <Share2 className="w-4 h-4 mr-2" /> Share My Shortlist
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {shortlistedProjects.map((project) => {
                    const badge = getProjectBadge(project.id);
                    return (
                      <div key={project.id} className="relative">
                        {badge && (
                          <div className="absolute top-2 left-2 z-10">
                            <Badge className={`${badgeLabels[badge].color} ${badgeLabels[badge].textColor} font-bold px-4 py-1.5 flex items-center gap-1.5 text-sm`}>
                              {badgeLabels[badge].label}
                              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSetBadge(project.id, null); }} className="ml-1 hover:opacity-70">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </Badge>
                          </div>
                        )}
                        <ProjectCard project={project} currency="AED" sizeUnit="sqft" />
                        <div className="mt-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="w-full border-gold/30 text-black hover:bg-gold/10">
                                <Award className="w-4 h-4 mr-2" /> {badge ? `Change Badge` : `Add Badge`}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-white border-gold/20">
                              <DropdownMenuItem onClick={() => handleSetBadge(project.id, 'top1')} className="text-yellow-600 cursor-pointer font-medium">🥇 Top 1 (Gold)</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSetBadge(project.id, 'top2')} className="text-zinc-500 cursor-pointer font-medium">🥈 Top 2 (Silver)</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSetBadge(project.id, 'top3')} className="text-amber-600 cursor-pointer font-medium">🥉 Top 3 (Bronze)</DropdownMenuItem>
                              {badge && (
                                <DropdownMenuItem onClick={() => handleSetBadge(project.id, null)} className="text-black/40 cursor-pointer">
                                  <X className="w-4 h-4 mr-2" /> Remove Badge
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Action Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/60 rounded-2xl p-6 border border-gold/20">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-black font-semibold">AI Comparison</h3>
                        <p className="text-black/40 text-sm">Get instant analysis</p>
                      </div>
                    </div>
                    <p className="text-black/50 text-sm mb-4">Generate an AI-powered comparison table with star ratings, price analysis, and recommendations.</p>
                    <Link to="/compare">
                      <Button className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 text-white">
                        Compare with AI <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>

                  <div className="bg-white/60 rounded-2xl p-6 border border-gold/20">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#E8DCC8] to-[#D4C4A8] flex items-center justify-center border border-gold/30">
                        <Users className="w-6 h-6 text-black" />
                      </div>
                      <div>
                        <h3 className="text-black font-semibold">Professional Evaluation</h3>
                        <p className="text-black/40 text-sm">Expert consultation</p>
                      </div>
                    </div>
                    <p className="text-black/50 text-sm mb-4">Request a personalized evaluation from our property consultants with detailed market insights.</p>
                    <a href={INQUIRY_FORM_URL} target="_blank" rel="noopener noreferrer">
                      <Button className="w-full bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] text-black hover:brightness-95 border border-gold/30">
                        Request Evaluation <ArrowUpRight className="w-4 h-4 ml-2" />
                      </Button>
                    </a>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-16 bg-white/60 rounded-2xl border border-gold/20">
                <div className="max-w-md mx-auto">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold/20 to-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-6">
                    <ListPlus className="w-10 h-10 text-gold/70" />
                  </div>
                  <h3 className="text-black text-xl font-semibold mb-3">Your Shortlist is Empty</h3>
                  <p className="text-black/50 mb-3">Move your top property picks from Favorites to your Shortlist. Assign medals (🥇🥈🥉) to rank your best choices.</p>
                  <p className="text-black/30 text-sm mb-8">Tip: Your shortlist can be shared with our team for professional brokerage support.</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link to="/properties">
                      <Button className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] text-black hover:brightness-95 border border-gold/30">
                        Explore Properties <ArrowUpRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                    {favCount > 0 && (
                      <Button variant="outline" className="border-gold/30 text-black hover:bg-gold/10" onClick={() => { const tabs = document.querySelector('[value="favorites"]'); if (tabs) (tabs as HTMLElement).click(); }}>
                        View Favorites ({favCount})
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Share Shortlist Modal */}
      <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
        <DialogContent className="bg-white border-gold/20 text-black">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-gold" /> Shortlist Consultation & Copy
            </DialogTitle>
            <DialogDescription className="text-black/50">
              Send your shortlist to the JBJ Global Real Estate team for consultation, or download/share a copy.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {shortlistedProjects && shortlistedProjects.length > 0 && (
              <div className="bg-[#F5F0E6] rounded-lg p-4 max-h-[150px] overflow-y-auto border border-gold/15">
                <p className="text-black/40 text-xs mb-2">Properties in shortlist:</p>
                {shortlistedProjects.map((p, i) => {
                  const badge = getProjectBadge(p.id);
                  return (
                    <div key={p.id} className="flex items-center gap-2 text-sm py-1">
                      <span className="text-gold">#{i + 1}</span>
                      {badge && <span className={`text-xs ${badge === "top1" ? "text-yellow-600" : badge === "top2" ? "text-amber-600" : "text-zinc-500"}`}>{badge === "top1" ? "🥇" : badge === "top2" ? "🥉" : "🥈"}</span>}
                      <span className="text-black">{p.name}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <Button onClick={handleSendToTeam} className="w-full bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] text-black hover:brightness-95 border border-gold/30">
              <Users className="w-4 h-4 mr-2" /> Send to JBJ Global Real Estate Team (Consultation)
            </Button>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gold/15" />
              <span className="text-black/30 text-xs">SAVE A COPY</span>
              <div className="flex-1 h-px bg-gold/15" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Button onClick={handleDownloadShortlist} variant="outline" className="border-gold/20 text-black hover:bg-gold/10">
                <Download className="w-4 h-4 mr-2" /> Download HTML
              </Button>
              <Button onClick={handleShareWhatsApp} variant="outline" className="border-gold/20 text-black hover:bg-gold/10">
                <MessageCircle className="w-4 h-4 mr-2 text-green-500" /> WhatsApp
              </Button>
              <Button onClick={handleCopyShortlist} variant="outline" className="border-gold/20 text-black hover:bg-gold/10">
                <Copy className="w-4 h-4 mr-2" /> Copy Text
              </Button>
            </div>

            <div>
              <Label htmlFor="email" className="text-black/60">Email a copy to yourself</Label>
              <div className="flex gap-2 mt-1">
                <Input id="email" type="email" placeholder="your.email@example.com" value={shareEmail} onChange={(e) => setShareEmail(e.target.value)} className="bg-[#F5F0E6] border-gold/20 text-black" />
                <Button onClick={handleEmailShare} variant="outline" className="border-gold/20 text-black hover:bg-gold/10 shrink-0">
                  <Mail className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <p className="text-black/30 text-xs text-center leading-relaxed">
              Software developed and implemented by The Founder & CEO, Jane Bou Jaoude<br />
              Designed exclusively for JBJ Global Real Estate
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default Favorites;
