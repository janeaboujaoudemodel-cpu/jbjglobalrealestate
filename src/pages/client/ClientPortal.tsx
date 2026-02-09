import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import SEOHead from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
  BookOpen,
  BarChart3,
  Settings,
  LogOut,
  Info,
  Building2,
  Home,
  Key,
} from "lucide-react";
import ClientMarketSnapshot from "@/components/client-intelligence/ClientMarketSnapshot";

interface SavedArea {
  id: string;
  name: string;
  trend: "up" | "stable" | "down";
  lastViewed: string;
}

interface ClientPreferences {
  intent: "buy" | "sell" | "rent" | null;
  preferredAreas: SavedArea[];
  notifications: boolean;
}

/**
 * Client Portal - Authenticated client area with personalized insights.
 * Read-only, compliant, no internal metrics exposed.
 * Part of Part 12 - Premium Advisory Mode.
 */
const ClientPortal = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [preferences, setPreferences] = useState<ClientPreferences>({
    intent: null,
    preferredAreas: [],
    notifications: false,
  });

  // Sample saved areas - would come from user profile in production
  const sampleSavedAreas: SavedArea[] = [
    { id: "1", name: "Downtown Dubai", trend: "up", lastViewed: "2 days ago" },
    { id: "2", name: "Dubai Marina", trend: "stable", lastViewed: "1 week ago" },
    { id: "3", name: "Business Bay", trend: "up", lastViewed: "3 days ago" },
  ];

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to access the Client Portal.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }
      setUser(session.user);
      // In production, load preferences from database
      setPreferences({
        intent: "buy",
        preferredAreas: sampleSavedAreas,
        notifications: true,
      });
      setLoading(false);
    };
    checkAuth();
  }, [navigate, toast]);

  const getTrendIcon = (trend: "up" | "stable" | "down") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-emerald-500" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-amber-500" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getIntentIcon = () => {
    switch (preferences.intent) {
      case "buy":
        return <Home className="w-5 h-5 text-primary" />;
      case "sell":
        return <Building2 className="w-5 h-5 text-primary" />;
      case "rent":
        return <Key className="w-5 h-5 text-primary" />;
      default:
        return <Info className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <section className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <SEOHead
        title="Client Portal | JBJ Global Real Estate"
        description="Access your personalized market insights and saved areas."
        keywords="client portal, market insights, Dubai real estate"
        noIndex
      />
      <section className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Client Portal</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Your personalized market intelligence
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => navigate("/profile?tab=settings")}>
                <Settings className="w-4 h-4 mr-2" />
                Preferences
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>

          {/* Focus Summary */}
          <Card className="mb-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="py-6">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  {getIntentIcon()}
                  <span className="font-medium text-foreground">
                    Your Focus:{" "}
                    <span className="text-primary uppercase">{preferences.intent || "Not set"}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {preferences.preferredAreas.length} saved areas
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Tabs */}
          <Tabs defaultValue="insights" className="space-y-6">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="insights" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Insights
              </TabsTrigger>
              <TabsTrigger value="areas" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Saved Areas
              </TabsTrigger>
              <TabsTrigger value="resources" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Resources
              </TabsTrigger>
            </TabsList>

            {/* Insights Tab */}
            <TabsContent value="insights" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {preferences.preferredAreas.slice(0, 4).map((area) => (
                  <ClientMarketSnapshot
                    key={area.id}
                    areaName={area.name}
                    buyTrend={area.trend}
                    sellActivity="moderate"
                    rentDemand={area.trend === "up" ? "high" : "moderate"}
                    supplyLevel={area.trend === "up" ? 45 : 55}
                    demandLevel={area.trend === "up" ? 70 : 55}
                    historicalData={[
                      { period: "Q1", value: 50 },
                      { period: "Q2", value: 55 },
                      { period: "Q3", value: 60 },
                      { period: "Q4", value: area.trend === "up" ? 70 : 58 },
                    ]}
                  />
                ))}
              </div>

              {/* Disclaimer */}
              <Card className="bg-muted/30 border-border/50">
                <CardContent className="py-4">
                  <p className="text-xs text-muted-foreground text-center">
                    Insights are based on aggregated official data and are provided for informational purposes only.
                    This does not constitute financial, investment, or legal advice.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Saved Areas Tab */}
            <TabsContent value="areas" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Saved Areas</CardTitle>
                  <CardDescription>
                    Areas you're monitoring for BUY · SELL · RENT activity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {preferences.preferredAreas.map((area) => (
                      <div
                        key={area.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/market-intelligence/areas/${area.name.toLowerCase().replace(/\s+/g, "-")}`)}
                      >
                        <div className="flex items-center gap-3">
                          <MapPin className="w-5 h-5 text-primary" />
                          <div>
                            <span className="font-medium text-foreground">{area.name}</span>
                            <p className="text-xs text-muted-foreground">
                              Last viewed {area.lastViewed}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getTrendIcon(area.trend)}
                          <Badge variant="outline" className="capitalize">
                            {area.trend}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Resources Tab */}
            <TabsContent value="resources" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate("/market-intelligence/reports")}>
                  <CardContent className="py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">Market Reports</h3>
                        <p className="text-sm text-muted-foreground">
                          Monthly briefs, quarterly reviews, and annual summaries
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate("/market-intelligence/areas")}>
                  <CardContent className="py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">Area Guides</h3>
                        <p className="text-sm text-muted-foreground">
                          Explore market data across Dubai's key areas
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate("/market-intelligence/methodology")}>
                  <CardContent className="py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">Methodology</h3>
                        <p className="text-sm text-muted-foreground">
                          How we aggregate and present market data
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate("/contact")}>
                  <CardContent className="py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Info className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">Book Consultation</h3>
                        <p className="text-sm text-muted-foreground">
                          Discuss your BUY · SELL · RENT requirements
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </>
  );
};

export default ClientPortal;
