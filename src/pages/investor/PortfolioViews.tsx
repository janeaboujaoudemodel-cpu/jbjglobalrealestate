import { useState, useEffect, useMemo } from "react";
import VideoBackground from "@/components/VideoBackground";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Briefcase, Download, MessageCircle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

// Portfolio Components
import PortfolioOverview from "@/components/investor/portfolio/PortfolioOverview";
import PortfolioGroupingControls, {
  GroupingType,
  ObjectiveFilter,
  AssetTypeFilter,
  LocationFilter,
  StatusFilter,
} from "@/components/investor/portfolio/PortfolioGroupingControls";
import PortfolioAssetCard, { PortfolioAsset } from "@/components/investor/portfolio/PortfolioAssetCard";
import PortfolioPerformanceContext from "@/components/investor/portfolio/PortfolioPerformanceContext";
import PortfolioDocumentsVault from "@/components/investor/portfolio/PortfolioDocumentsVault";
import PortfolioExport from "@/components/investor/portfolio/PortfolioExport";
import PortfolioNextSteps from "@/components/investor/portfolio/PortfolioNextSteps";
import PortfolioFAQ from "@/components/investor/portfolio/PortfolioFAQ";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

export default function PortfolioViews() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [investorName, setInvestorName] = useState<string | undefined>();

  // Portfolio data
  const [assets, setAssets] = useState<PortfolioAsset[]>([]);

  // Grouping and filter states
  const [activeGrouping, setActiveGrouping] = useState<GroupingType>("objective");
  const [objectiveFilter, setObjectiveFilter] = useState<ObjectiveFilter>("all");
  const [assetTypeFilter, setAssetTypeFilter] = useState<AssetTypeFilter>("all");
  const [locationFilter, setLocationFilter] = useState<LocationFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/investor-dashboard/portfolio");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchPortfolioData();
    }
  }, [user]);

  const fetchPortfolioData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch profile for investor name
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      if (profileData?.full_name) {
        setInvestorName(profileData.full_name);
      }

      // Fetch favorites as portfolio assets
      const { data: favoritesData } = await supabase
        .from("favorites")
        .select("id, project_id, created_at")
        .eq("user_id", user.id);

      if (favoritesData && favoritesData.length > 0) {
        const projectIds = favoritesData.map((f) => f.project_id);
        const { data: projectsData } = await supabase
          .from("projects")
          .select("id, name, location, emirate, status, updated_at")
          .in("id", projectIds);

        if (projectsData) {
          // Map to PortfolioAsset with demo objectives
          const objectives: PortfolioAsset["objective"][] = ["income", "growth", "balanced", "end-use"];
          const statuses: PortfolioAsset["status"][] = ["owned", "reserved", "under-evaluation"];
          const docStatuses: PortfolioAsset["documentsStatus"][] = ["available", "partial", "missing"];

          const portfolioAssets: PortfolioAsset[] = projectsData.map((p, idx) => ({
            id: p.id,
            name: p.name,
            assetType: p.status === "off-plan" ? "off-plan" : "ready",
            location: p.location || "Dubai",
            emirate: p.emirate || "Dubai",
            status: statuses[idx % statuses.length],
            objective: objectives[idx % objectives.length],
            documentsStatus: docStatuses[idx % docStatuses.length],
            lastUpdated: p.updated_at,
          }));

          setAssets(portfolioAssets);
        }
      }
    } catch (error) {
      console.error("Error fetching portfolio data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Compute stats
  const stats = useMemo(() => {
    return {
      totalAssets: assets.length,
      activeHoldings: assets.filter((a) => a.status === "owned").length,
      underEvaluation: assets.filter((a) => a.status === "under-evaluation").length,
      reservedPending: assets.filter((a) => a.status === "reserved").length,
      reportsAvailable: assets.filter((a) => a.documentsStatus === "available").length,
    };
  }, [assets]);

  // Available locations for filter
  const availableLocations = useMemo(() => {
    const emirates = [...new Set(assets.map((a) => a.emirate))];
    const locations = [...new Set(assets.map((a) => a.location))];
    return [...emirates, ...locations.filter((l) => !emirates.includes(l))];
  }, [assets]);

  // Filter assets based on current grouping and filters
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      if (activeGrouping === "objective" && objectiveFilter !== "all") {
        return asset.objective === objectiveFilter;
      }
      if (activeGrouping === "asset-type" && assetTypeFilter !== "all") {
        if (assetTypeFilter === "rental") return asset.objective === "income";
        if (assetTypeFilter === "development") return asset.assetType === "off-plan";
        return asset.assetType === assetTypeFilter;
      }
      if (activeGrouping === "location" && locationFilter !== "all") {
        return asset.emirate === locationFilter || asset.location === locationFilter;
      }
      if (activeGrouping === "status" && statusFilter !== "all") {
        if (statusFilter === "under-review") return asset.status === "under-evaluation";
        if (statusFilter === "sold") return false; // No sold assets in demo
        return asset.status === statusFilter;
      }
      return true;
    });
  }, [assets, activeGrouping, objectiveFilter, assetTypeFilter, locationFilter, statusFilter]);

  // Performance context items (for assets with relevant data)
  const performanceContextItems = useMemo(() => {
    return filteredAssets.slice(0, 6).map((asset) => ({
      assetId: asset.id,
      assetName: asset.name,
      rentalContext:
        asset.objective === "income"
          ? "Strong rental demand in this area based on historical data."
          : undefined,
      resaleLiquidity:
        asset.objective === "growth"
          ? "Moderate resale activity; typical holding period 3-5 years."
          : undefined,
      ownershipCosts: "Service charges detailed in linked reports.",
    }));
  }, [filteredAssets]);

  // Document counts (demo data)
  const documentCounts = useMemo(() => ({
    contracts: Math.min(assets.length, 5),
    approvals: Math.min(assets.length, 3),
    reports: stats.reportsAvailable,
    uploads: Math.min(assets.length * 2, 10),
  }), [assets, stats]);

  const getGroupingLabel = () => {
    const labels = {
      objective: "By Objective",
      "asset-type": "By Asset Type",
      location: "By Location",
      status: "By Status",
    };
    return labels[activeGrouping];
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Premium Video Hero Section */}
      <section className="jj-hero-fullscreen relative flex items-center justify-center overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0">
          <VideoBackground 
            src="https://videos.pexels.com/video-files/5528027/5528027-uhd_2560_1440_30fps.mp4"
            poster="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&q=80"
          />
          {/* Overlay gradients */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 bg-gold/20 backdrop-blur-sm text-gold px-4 py-2 rounded-full text-sm font-medium mb-6 border border-gold/30">
                <Briefcase className="w-4 h-4" />
                Portfolio Views
              </div>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
                Your Investment Portfolio,{" "}
                <span className="text-gold">Organized With Clarity</span>
              </h1>
              <p className="text-zinc-300 text-lg mb-8 max-w-2xl mx-auto">
                Portfolio Views is where investors see their assets and opportunities in a structured, 
                readable format—grouped by purpose, timeline, and performance context.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="primary" size="lg" className="gap-2">
                  <Briefcase className="w-5 h-5" />
                  View My Portfolio
                </Button>
                <Button variant="secondary" size="lg" className="gap-2">
                  <Download className="w-5 h-5" />
                  Download Portfolio Summary
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Content - Layer 2 Champagne Background */}
      <section className="py-16">
        <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] mx-[0.125rem] md:mx-2 lg:mx-4 xl:mx-6 2xl:mx-8 rounded-2xl p-8 md:p-12">
          {/* Back Link */}
          <Link
            to="/investor-dashboard"
            className="inline-flex items-center gap-2 text-zinc-600 hover:text-gold transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="space-y-12"
          >
          {/* Section 1: Portfolio Overview */}
          <motion.div variants={fadeInUp}>
            <PortfolioOverview stats={stats} />
          </motion.div>

          {/* Section 2: Portfolio Grouping Controls */}
          <motion.div variants={fadeInUp}>
            <PortfolioGroupingControls
              activeGrouping={activeGrouping}
              onGroupingChange={setActiveGrouping}
              objectiveFilter={objectiveFilter}
              onObjectiveChange={setObjectiveFilter}
              assetTypeFilter={assetTypeFilter}
              onAssetTypeChange={setAssetTypeFilter}
              locationFilter={locationFilter}
              onLocationChange={setLocationFilter}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              availableLocations={availableLocations}
            />
          </motion.div>

          {/* Section 3: Portfolio Asset Cards */}
          <motion.div variants={fadeInUp}>
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">
                  Your Assets ({filteredAssets.length})
                </h2>
              </div>
              {filteredAssets.length === 0 ? (
                <div className="text-center py-12 bg-muted/20 rounded-lg border-2 border-dashed border-gold/30">
                  <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">No assets match your current filters</p>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your grouping or filters to see more assets.
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAssets.map((asset) => (
                    <PortfolioAssetCard key={asset.id} asset={asset} />
                  ))}
                </div>
              )}
            </section>
          </motion.div>

          {/* Section 4: Performance Context */}
          <motion.div variants={fadeInUp}>
            <PortfolioPerformanceContext contextItems={performanceContextItems} />
          </motion.div>

          {/* Section 5: Documents Vault */}
          <motion.div variants={fadeInUp}>
            <PortfolioDocumentsVault documentCounts={documentCounts} />
          </motion.div>

          {/* Section 6: Portfolio Export */}
          <motion.div variants={fadeInUp}>
            <PortfolioExport
              investorName={investorName}
              assetCount={assets.length}
              currentGrouping={getGroupingLabel()}
            />
          </motion.div>

          {/* Section 7: Next Steps */}
          <motion.div variants={fadeInUp}>
            <PortfolioNextSteps />
          </motion.div>

          {/* FAQ Section */}
          <motion.div variants={fadeInUp}>
            <PortfolioFAQ />
          </motion.div>
        </motion.div>
        </div>
      </section>
    </div>
  );
}
