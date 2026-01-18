import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Linkedin } from "lucide-react";

export function LinkedInInsightsPanel() {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Linkedin className="h-5 w-5 text-blue-500" />
          LinkedIn Intelligence Feed
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-center py-8">
          Please approve the database migration to enable LinkedIn insights tracking
        </p>
      </CardContent>
    </Card>
  );
}
