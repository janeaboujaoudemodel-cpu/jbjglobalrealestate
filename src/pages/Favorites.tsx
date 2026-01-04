import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites, useShortlist, useToggleShortlist } from "@/hooks/useFavorites";
import { useGuestFavorites, useGuestShortlist } from "@/hooks/useGuestFavorites";
import { ChevronLeft, Heart, ListPlus, ArrowRight, Award, X, Mail, Share2, Sparkles, Users, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const INQUIRY_FORM_URL = "https://jjglobalcapital.com/form/property-investment-inquiry-form/";

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
  const { shortlist: guestShortlist, setBadge, getBadge, toggleShortlist: toggleGuestShortlist } = useGuestShortlist();
  const toggleShortlistMutation = useToggleShortlist();

  // Determine which data to use based on auth status
  const favoriteIds = user 
    ? (userFavorites?.map(f => f.project_id) || [])
    : guestFavorites.map(f => f.project_id);
  
  const shortlistIds = user
    ? (userShortlist?.map(s => s.project_id) || [])
    : guestShortlist.map(s => s.project_id);

  // Fetch favorite projects
  const { data: favoriteProjects, isLoading: loadingFavProjects } = useQuery({
    queryKey: ["favorite-projects", favoriteIds],
    queryFn: async () => {
      if (!favoriteIds.length) return [];
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          developer:developers(id, name, slug),
          images:project_images(id, image_url, alt_text, display_order),
          community:communities(id, name, slug),
          documents:project_documents(id, file_url, file_name, document_type)
        `)
        .in("id", favoriteIds);

      if (error) throw error;
      return data;
    },
    enabled: favoriteIds.length > 0,
  });

  // Fetch shortlisted projects
  const { data: shortlistedProjects, isLoading: loadingShortProjects } = useQuery({
    queryKey: ["shortlisted-projects-full", shortlistIds],
    queryFn: async () => {
      if (!shortlistIds.length) return [];
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          developer:developers(id, name, slug),
          images:project_images(id, image_url, alt_text, display_order),
          community:communities(id, name, slug),
          documents:project_documents(id, file_url, file_name, document_type)
        `)
        .in("id", shortlistIds);

      if (error) throw error;
      return data;
    },
    enabled: shortlistIds.length > 0,
  });

  const isLoading = user ? loadingFavorites || loadingShortlist : false;
  const favCount = favoriteIds.length;
  const shortlistCount = shortlistIds.length;

  // Get badge for a project (guest only for now)
  const getProjectBadge = (projectId: string) => {
    if (!user) {
      return getBadge(projectId);
    }
    return null;
  };

  // Set badge for a project
  const handleSetBadge = (projectId: string, badge: 'top1' | 'top2' | 'top3' | null) => {
    if (!user) {
      setBadge(projectId, badge);
    }
  };

  // Move selected favorites to shortlist
  const handleMoveToShortlist = () => {
    if (selectedFavorites.length === 0) {
      toast.error("Please select properties to move");
      return;
    }

    selectedFavorites.forEach((projectId) => {
      if (!shortlistIds.includes(projectId)) {
        if (user) {
          toggleShortlistMutation.mutate({ projectId, isShortlisted: false });
        } else {
          toggleGuestShortlist(projectId);
        }
      }
    });

    toast.success(`Moved ${selectedFavorites.length} properties to shortlist`);
    setSelectedFavorites([]);
  };

  // Toggle favorite selection
  const toggleFavoriteSelection = (projectId: string) => {
    setSelectedFavorites(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  // Select all favorites
  const selectAllFavorites = () => {
    if (favoriteProjects) {
      setSelectedFavorites(favoriteProjects.map(p => p.id));
    }
  };

  // Share shortlist via email
  const handleShareShortlist = () => {
    if (!shortlistedProjects?.length) return;

    const projectList = shortlistedProjects.map((p, i) => {
      const badge = getProjectBadge(p.id);
      const badgeStr = badge ? ` [${badge === 'top1' ? '🥇 Top 1' : badge === 'top2' ? '🥈 Top 2' : '🥉 Top 3'}]` : '';
      return `${i + 1}. ${p.name}${badgeStr} - ${p.developer?.name || 'Unknown Developer'} - AED ${((p.price_from || 0) / 1000000).toFixed(1)}M+`;
    }).join('\n');

    const subject = encodeURIComponent("My Property Shortlist - JJ Global Capital");
    const body = encodeURIComponent(`Hi,

Here is my shortlisted properties for your review:

${projectList}

I would like to request a professional evaluation and consultation.

Best regards`);

    const mailtoLink = shareEmail 
      ? `mailto:${shareEmail}?subject=${subject}&body=${body}`
      : `mailto:?subject=${subject}&body=${body}`;

    window.location.href = mailtoLink;
    setShareModalOpen(false);
    toast.success("Opening email client...");
  };

  const badgeLabels = {
    top1: { label: "Top 1 — Gold", color: "bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 shadow-lg shadow-yellow-500/30", textColor: "text-white" },
    top2: { label: "Top 2 — Silver", color: "bg-gradient-to-r from-zinc-300 via-slate-400 to-zinc-400 shadow-lg shadow-zinc-400/30", textColor: "text-white" },
    top3: { label: "Top 3 — Bronze", color: "bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 shadow-lg shadow-amber-600/30", textColor: "text-white" },
  };

  return (
    <section className="min-h-screen bg-zinc-950 py-8 md:py-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Back to Properties</span>
        </Link>

        <h1 className="text-white text-3xl font-bold mb-8">My Saved Properties</h1>

        {!user && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-8 flex items-center justify-between">
            <p className="text-zinc-400">
              <span className="text-zinc-300">Guest Mode:</span> Your saved properties are stored locally. Sign in to sync across devices.
            </p>
            <Link to="/auth">
              <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                Sign In
              </Button>
            </Link>
          </div>
        )}

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="bg-zinc-900 border border-zinc-800 p-1 mb-8">
            <TabsTrigger
              value="favorites"
              className="data-[state=active]:bg-white data-[state=active]:text-zinc-900 text-zinc-400"
            >
              <Heart className="w-4 h-4 mr-2" />
              Favorites ({favCount})
            </TabsTrigger>
            <TabsTrigger
              value="shortlist"
              className="data-[state=active]:bg-white data-[state=active]:text-zinc-900 text-zinc-400"
            >
              <ListPlus className="w-4 h-4 mr-2" />
              Shortlist ({shortlistCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="favorites">
            {isLoading || loadingFavProjects ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="aspect-[4/3] bg-zinc-900 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : favoriteProjects?.length ? (
              <>
                {/* Actions Bar for Favorites */}
                <div className="flex items-center justify-between mb-6 bg-zinc-900 rounded-lg p-4 border border-zinc-800">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAllFavorites}
                      className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    >
                      <CheckSquare className="w-4 h-4 mr-2" />
                      Select All
                    </Button>
                    <span className="text-zinc-500 text-sm">
                      {selectedFavorites.length} selected
                    </span>
                  </div>
                  <Button
                    onClick={handleMoveToShortlist}
                    disabled={selectedFavorites.length === 0}
                    className="bg-gradient-to-r from-gold to-gold-dark text-black hover:opacity-90"
                  >
                    <ListPlus className="w-4 h-4 mr-2" />
                    Move to Shortlist
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {favoriteProjects.map((project) => (
                    <div key={project.id} className="relative">
                      {/* Selection Checkbox */}
                      <div className="absolute top-2 left-2 z-20">
                        <div 
                          className={`w-6 h-6 rounded-md flex items-center justify-center cursor-pointer transition-all ${
                            selectedFavorites.includes(project.id)
                              ? "bg-gold text-black"
                              : "bg-black/60 border border-zinc-600 hover:border-gold"
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleFavoriteSelection(project.id);
                          }}
                        >
                          {selectedFavorites.includes(project.id) && (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <ProjectCard project={project} />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16 bg-zinc-900 rounded-2xl border border-zinc-800">
                <Heart className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-400 mb-6">No favorite properties yet</p>
                <Link to="/">
                  <Button className="bg-white text-zinc-900 hover:bg-zinc-100">
                    Browse Properties
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>

          <TabsContent value="shortlist">
            {isLoading || loadingShortProjects ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="aspect-[4/3] bg-zinc-900 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : shortlistedProjects?.length ? (
              <>
                {/* Shortlist Actions Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 bg-zinc-900 rounded-lg p-4 border border-zinc-800">
                  <p className="text-zinc-400 text-sm">
                    Rank your top properties with badges: <span className="text-yellow-400">🥇 Top 1</span>, <span className="text-gray-300">🥈 Top 2</span>, <span className="text-amber-500">🥉 Top 3</span>
                  </p>
                  <Button
                    onClick={() => setShareModalOpen(true)}
                    className="bg-gradient-to-r from-gold to-gold-dark text-black hover:opacity-90"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share My Shortlist
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {shortlistedProjects.map((project) => {
                    const badge = getProjectBadge(project.id);
                    return (
                      <div key={project.id} className="relative">
                        {/* Badge indicator */}
                        {badge && (
                          <div className="absolute top-2 left-2 z-10">
                            <Badge className={`${badgeLabels[badge].color} ${badgeLabels[badge].textColor} font-bold px-4 py-1.5 flex items-center gap-1.5 text-sm`}>
                              {badgeLabels[badge].label}
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleSetBadge(project.id, null);
                                }}
                                className="ml-1 hover:opacity-70"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </Badge>
                          </div>
                        )}
                        
                        <ProjectCard project={project} />
                        
                        {/* Badge assignment dropdown */}
                        <div className="mt-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                              >
                                <Award className="w-4 h-4 mr-2" />
                                {badge ? `Change Badge` : `Add Badge`}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-zinc-900 border-zinc-800">
                              <DropdownMenuItem
                                onClick={() => handleSetBadge(project.id, 'top1')}
                                className="text-yellow-400 hover:bg-zinc-800 cursor-pointer font-medium"
                              >
                                🥇 Top 1 (Gold)
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleSetBadge(project.id, 'top2')}
                                className="text-zinc-300 hover:bg-zinc-800 cursor-pointer font-medium"
                              >
                                🥈 Top 2 (Silver)
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleSetBadge(project.id, 'top3')}
                                className="text-amber-500 hover:bg-zinc-800 cursor-pointer font-medium"
                              >
                                🥉 Top 3 (Bronze)
                              </DropdownMenuItem>
                              {badge && (
                                <DropdownMenuItem
                                  onClick={() => handleSetBadge(project.id, null)}
                                  className="text-zinc-400 hover:bg-zinc-800 cursor-pointer"
                                >
                                  <X className="w-4 h-4 mr-2" />
                                  Remove Badge
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
                  {/* AI Comparison Card */}
                  <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">AI Comparison</h3>
                        <p className="text-zinc-500 text-sm">Get instant analysis</p>
                      </div>
                    </div>
                    <p className="text-zinc-400 text-sm mb-4">
                      Generate an AI-powered comparison table with star ratings, price analysis, and recommendations.
                    </p>
                    <Link to="/compare">
                      <Button className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white">
                        Compare with AI
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>

                  {/* Professional Evaluation Card */}
                  <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center">
                        <Users className="w-6 h-6 text-black" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">Professional Evaluation</h3>
                        <p className="text-zinc-500 text-sm">Expert consultation</p>
                      </div>
                    </div>
                    <p className="text-zinc-400 text-sm mb-4">
                      Request a personalized evaluation from our property consultants with detailed market insights.
                    </p>
                    <a href={INQUIRY_FORM_URL} target="_blank" rel="noopener noreferrer">
                      <Button className="w-full bg-gradient-to-r from-gold to-gold-dark text-black hover:opacity-90">
                        Request Evaluation
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </a>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-16 bg-zinc-900 rounded-2xl border border-zinc-800">
                <ListPlus className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-400 mb-2">No properties in your shortlist</p>
                <p className="text-zinc-500 text-sm mb-6">
                  Add properties from your favorites or browse to compare them
                </p>
                <Link to="/">
                  <Button className="bg-white text-zinc-900 hover:bg-zinc-100">
                    Browse Properties
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Share Shortlist Modal */}
      <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-gold" />
              Share Your Shortlist
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Send your shortlisted properties to yourself or our team for consultation
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {shortlistedProjects && shortlistedProjects.length > 0 && (
              <div className="bg-zinc-800 rounded-lg p-4 max-h-[150px] overflow-y-auto">
                <p className="text-zinc-400 text-xs mb-2">Properties to share ({shortlistedProjects.length}/5):</p>
                {shortlistedProjects.map((p, i) => {
                  const badge = getProjectBadge(p.id);
                  return (
                    <div key={p.id} className="flex items-center gap-2 text-sm py-1">
                      <span className="text-gold">#{i + 1}</span>
                      {badge && (
                        <span className={`text-xs ${badge === 'top1' ? 'text-yellow-400' : badge === 'top2' ? 'text-gray-300' : 'text-amber-500'}`}>
                          {badge === 'top1' ? '🥇' : badge === 'top2' ? '🥈' : '🥉'}
                        </span>
                      )}
                      <span className="text-white">{p.name}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Option 1: Share to own email */}
            <div>
              <Label htmlFor="email" className="text-zinc-300">Share to your email</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
                <Button
                  onClick={handleShareShortlist}
                  variant="outline"
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 shrink-0"
                >
                  <Mail className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-zinc-800" />
              <span className="text-zinc-500 text-xs">OR</span>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>

            {/* Option 2: Share to company */}
            <Button
              onClick={() => {
                setShareEmail("invest@jjglobalcapital.com");
                handleShareShortlist();
              }}
              className="w-full bg-gradient-to-r from-gold to-gold-dark text-black hover:opacity-90"
            >
              <Users className="w-4 h-4 mr-2" />
              Send to JJ Global Capital Team
            </Button>

            <p className="text-zinc-500 text-xs text-center">
              Our property consultants will contact you within 24 hours to discuss your selection
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default Favorites;
