import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, TrendingUp, Target, AlertCircle } from "lucide-react";

export function CompetitorTrackingPanel() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Competitor Intelligence</h2>
          <p className="text-muted-foreground text-sm">Track competitor hiring and market movements</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs">Competitors Tracked</p>
                <p className="text-2xl font-bold text-foreground">12</p>
              </div>
              <Building2 className="h-8 w-8 text-gold/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs">Open Positions</p>
                <p className="text-2xl font-bold text-amber-600">47</p>
              </div>
              <Target className="h-8 w-8 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs">New Hires (30d)</p>
                <p className="text-2xl font-bold text-emerald-600">23</p>
              </div>
              <Users className="h-8 w-8 text-emerald-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs">Market Alerts</p>
                <p className="text-2xl font-bold text-red-600">5</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-gold" />
            Competitor Tracking Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 mx-auto mb-4 text-gold/40" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Competitive Intelligence Dashboard</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              This feature will allow you to track competitor companies, monitor their 
              hiring activities, and receive alerts when key talent becomes available 
              in the UAE real estate market.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
