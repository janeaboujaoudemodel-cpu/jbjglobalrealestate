import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Linkedin, Users, TrendingUp, MessageSquare, UserPlus } from "lucide-react";

export function LinkedInInsightsPanel() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">LinkedIn Intelligence</h2>
          <p className="text-muted-foreground text-sm">Track competitor hiring and talent movements</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs">Profiles Tracked</p>
                <p className="text-2xl font-bold text-foreground">156</p>
              </div>
              <Users className="h-8 w-8 text-[#0A66C2]/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs">Job Changes</p>
                <p className="text-2xl font-bold text-amber-600">12</p>
              </div>
              <TrendingUp className="h-8 w-8 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs">New Connections</p>
                <p className="text-2xl font-bold text-emerald-600">34</p>
              </div>
              <UserPlus className="h-8 w-8 text-emerald-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs">InMails Sent</p>
                <p className="text-2xl font-bold text-foreground">48</p>
              </div>
              <MessageSquare className="h-8 w-8 text-[#0A66C2]/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Linkedin className="h-5 w-5 text-[#0A66C2]" />
            LinkedIn Integration Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Linkedin className="h-16 w-16 mx-auto mb-4 text-[#0A66C2]/40" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Connect LinkedIn Recruiter</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Once connected, you'll be able to track competitor hiring patterns, 
              monitor talent movements in the UAE real estate market, and receive 
              AI-powered insights on recruitment trends.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
