import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";

export function CompetitorTrackingPanel() {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Competitor Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-center py-8">
          Please approve the database migration to enable competitor tracking
        </p>
      </CardContent>
    </Card>
  );
}
