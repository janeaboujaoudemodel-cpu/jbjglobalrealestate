import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Linkedin, Users, TrendingUp, MessageSquare, UserPlus } from "lucide-react";

export function LinkedInInsightsPanel() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-black">LinkedIn Intelligence</h2>
          <p className="text-zinc-600 text-sm">Track competitor hiring and talent movements</p>
        </div>
      </div>

      {/* Stats - Premium Theme */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#F5EBD7] to-[#E8DCC8] border-2 border-gold/30 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-600 text-xs">Profiles Tracked</p>
                <p className="text-2xl font-bold text-black">156</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#0A66C2]/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-[#0A66C2]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-[#F5EBD7] to-[#E8DCC8] border-2 border-gold/30 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-600 text-xs">Job Changes</p>
                <p className="text-2xl font-bold text-amber-600">12</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-[#F5EBD7] to-[#E8DCC8] border-2 border-gold/30 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-600 text-xs">New Connections</p>
                <p className="text-2xl font-bold text-emerald-600">34</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-[#F5EBD7] to-[#E8DCC8] border-2 border-gold/30 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-600 text-xs">InMails Sent</p>
                <p className="text-2xl font-bold text-black">48</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#0A66C2]/20 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-[#0A66C2]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Premium Theme */}
      <Card className="bg-gradient-to-br from-[#FDFBF7] to-[#F5EBD7] border-2 border-gold/30 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-black">
            <Linkedin className="h-5 w-5 text-[#0A66C2]" />
            LinkedIn Integration Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-[#0A66C2]/10 flex items-center justify-center">
              <Linkedin className="h-10 w-10 text-[#0A66C2]" />
            </div>
            <h3 className="text-lg font-semibold text-black mb-2">Connect LinkedIn Recruiter</h3>
            <p className="text-zinc-600 max-w-md mx-auto">
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
