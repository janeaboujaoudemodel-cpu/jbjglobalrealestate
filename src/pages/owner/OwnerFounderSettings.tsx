import { FounderVisibilityToggle } from "@/components/admin/FounderVisibilityToggle";
import { PodcastVisibilityToggle } from "@/components/admin/PodcastVisibilityToggle";
import { ConsVisibilityToggle } from "@/components/admin/ConsVisibilityToggle";
import { User, Mic, Shield, Eye, EyeOff, Radio, Info, Headphones, Settings2, Volume2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const OwnerFounderSettings = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#B89555]/20 to-[#B89555]/5 flex items-center justify-center border border-[#B89555]/30">
            <User className="w-5 h-5 text-[#B89555]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A]">Founder & Podcast Controls</h1>
            <p className="text-sm text-[#1A1A1A]/70">Manage visibility toggles and podcast recording studio</p>
          </div>
        </div>
      </div>

      {/* Toggles Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FounderVisibilityToggle />
        <PodcastVisibilityToggle />
        <ConsVisibilityToggle />
      </div>

      {/* Podcast Studio Quick Access */}
      <Card className="border-2 border-[#B89555]/20 bg-gradient-to-br from-white/80 via-white/60 to-[#F7F2EA] shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-[#1A1A1A] flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#B89555]/15 flex items-center justify-center">
              <Headphones className="w-4 h-4 text-[#B89555]" />
            </div>
            Podcast Recording Studio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-[#1A1A1A]/70">
            Record, edit, and manage podcast episodes with integrated voice synthesis. Choose from premium voices, accents, and languages for professional audio production.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-[#B89555]/10 text-[#8B7D3A] border border-[#B89555]/20">
              <Mic className="w-3 h-3 mr-1" /> Voice Selection
            </Badge>
            <Badge className="bg-[#B89555]/10 text-[#8B7D3A] border border-[#B89555]/20">
              <Volume2 className="w-3 h-3 mr-1" /> Multi-accent
            </Badge>
            <Badge className="bg-[#B89555]/10 text-[#8B7D3A] border border-[#B89555]/20">
              <Settings2 className="w-3 h-3 mr-1" /> ElevenLabs Connected
            </Badge>
          </div>
          <Button 
            onClick={() => navigate("/owner/podcast-studio")}
            className="bg-gradient-to-r from-[#B89555] to-amber-600 hover:from-[#B89555]/90 hover:to-amber-600/90 text-[#1A1A1A] font-semibold shadow-lg shadow-[#B89555]/20"
          >
            <Headphones className="w-4 h-4 mr-2" />
            Open Podcast Studio
          </Button>
        </CardContent>
      </Card>

      {/* Info Section */}
      <div className="rounded-xl border-2 border-[#B89555]/20 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] p-6 space-y-5 shadow-sm">
        <h3 className="text-base font-bold text-[#1A1A1A] flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#B89555]/15 flex items-center justify-center">
            <Info className="w-4 h-4 text-[#B89555]" />
          </div>
          About These Controls
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-lg border border-[#B89555]/20 bg-[#FDFBF7]/60 p-4 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-[#B89555]/10 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-[#B89555]" />
              </div>
              <span className="font-semibold text-[#1A1A1A] text-sm">Founder Visibility</span>
            </div>
            <p className="text-sm text-[#1A1A1A]/70 leading-relaxed">
              Controls all founder-related content across the website including biography, headshots, video footage, Press Kit page, and Company Profile page. The Digital Business Card remains always visible.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#1A1A1A]/70">
              <Eye className="w-3.5 h-3.5" />
              <span>Affects: Homepage, About, Press Kit, Company Profile</span>
            </div>
          </div>
          <div className="rounded-lg border border-[#B89555]/20 bg-[#FDFBF7]/60 p-4 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-[#B89555]/10 flex items-center justify-center">
                <Radio className="w-3.5 h-3.5 text-[#B89555]" />
              </div>
              <span className="font-semibold text-[#1A1A1A] text-sm">Podcast Visibility</span>
            </div>
            <p className="text-sm text-[#1A1A1A]/70 leading-relaxed">
              Controls the JBJ Podcast section on the homepage. When hidden, only the owner can see it for testing purposes. Toggle to public when ready to launch episodes to all visitors.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#1A1A1A]/70">
              <EyeOff className="w-3.5 h-3.5" />
              <span>Owner-only preview mode available when hidden</span>
            </div>
          </div>
          <div className="rounded-lg border border-[#B89555]/20 bg-[#FDFBF7]/60 p-4 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-[#B89555]/10 flex items-center justify-center">
                <Headphones className="w-3.5 h-3.5 text-[#B89555]" />
              </div>
              <span className="font-semibold text-[#1A1A1A] text-sm">Podcast Studio</span>
            </div>
            <p className="text-sm text-[#1A1A1A]/70 leading-relaxed">
              Access the full podcast recording studio with ElevenLabs voice integration. Record episodes, choose voices, control accents, and manage your podcast production workflow.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#1A1A1A]/70">
              <Mic className="w-3.5 h-3.5" />
              <span>Integrated with ElevenLabs voice API</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerFounderSettings;
