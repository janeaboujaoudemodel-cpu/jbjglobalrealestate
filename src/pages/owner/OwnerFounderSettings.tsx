import { FounderVisibilityToggle } from "@/components/admin/FounderVisibilityToggle";
import { PodcastVisibilityToggle } from "@/components/admin/PodcastVisibilityToggle";
import { User, Mic, Shield, Eye, EyeOff, Radio, Info } from "lucide-react";

const OwnerFounderSettings = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C9A84C]/20 to-[#C9A84C]/5 flex items-center justify-center border border-[#C9A84C]/30">
            <User className="w-5 h-5 text-[#C9A84C]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-black">Founder & Podcast Controls</h1>
            <p className="text-sm text-zinc-500">Manage visibility toggles for founder content and podcast sections</p>
          </div>
        </div>
      </div>

      {/* Toggles Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FounderVisibilityToggle />
        <PodcastVisibilityToggle />
      </div>

      {/* Info Section - Premium Redesign */}
      <div className="rounded-xl border-2 border-[#C9A84C]/20 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] p-6 space-y-5 shadow-sm">
        <h3 className="text-base font-bold text-black flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#C9A84C]/15 flex items-center justify-center">
            <Info className="w-4 h-4 text-[#C9A84C]" />
          </div>
          About These Controls
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-lg border border-[#C9A84C]/20 bg-white/60 p-4 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-[#C9A84C]/10 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-[#C9A84C]" />
              </div>
              <span className="font-semibold text-black text-sm">Founder Visibility</span>
            </div>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Controls all founder-related content across the website including biography, headshots, video footage, Press Kit page, and Company Profile page. The Digital Business Card remains always visible.
            </p>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Eye className="w-3.5 h-3.5" />
              <span>Affects: Homepage, About, Press Kit, Company Profile</span>
            </div>
          </div>
          <div className="rounded-lg border border-[#C9A84C]/20 bg-white/60 p-4 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-[#C9A84C]/10 flex items-center justify-center">
                <Radio className="w-3.5 h-3.5 text-[#C9A84C]" />
              </div>
              <span className="font-semibold text-black text-sm">Podcast Visibility</span>
            </div>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Controls the JBJ Podcast section on the homepage. When hidden, only the owner can see it for testing purposes. Toggle to public when ready to launch episodes to all visitors.
            </p>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <EyeOff className="w-3.5 h-3.5" />
              <span>Owner-only preview mode available when hidden</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerFounderSettings;
