import { FounderVisibilityToggle } from "@/components/admin/FounderVisibilityToggle";
import { PodcastVisibilityToggle } from "@/components/admin/PodcastVisibilityToggle";
import { User, Mic, Shield } from "lucide-react";

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
            <h1 className="text-xl font-bold text-white">Founder & Podcast Controls</h1>
            <p className="text-sm text-zinc-400">Manage visibility toggles for founder content and podcast sections</p>
          </div>
        </div>
      </div>

      {/* Toggles Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FounderVisibilityToggle />
        <PodcastVisibilityToggle />
      </div>

      {/* Info Section */}
      <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/50 p-5 space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#C9A84C]" />
          About These Controls
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-zinc-400">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#C9A84C]/70" />
              <span className="font-medium text-zinc-300">Founder Visibility</span>
            </div>
            <p>Controls all founder-related content across the website including biography, headshots, video footage, Press Kit page, and Company Profile page. The Digital Business Card remains always visible.</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-[#C9A84C]/70" />
              <span className="font-medium text-zinc-300">Podcast Visibility</span>
            </div>
            <p>Controls the JBJ Podcast section on the homepage. When hidden, only the owner can see it for testing. Toggle to public when ready to launch episodes to all visitors.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerFounderSettings;
