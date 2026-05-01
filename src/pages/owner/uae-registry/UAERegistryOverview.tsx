import { Link } from "react-router-dom";
import { Building2, Users, MapPin, Mail } from "lucide-react";
import OwnerGuard from "@/components/OwnerGuard";
import { Card } from "@/components/ui/card";
import { EMIRATES, useRegistryList } from "@/hooks/useUAERegistry";
import { Badge } from "@/components/ui/badge";

function EmirateTile({ emirate }: { emirate: typeof EMIRATES[number] }) {
  const devs = useRegistryList("developer", emirate);
  const brks = useRegistryList("brokerage", emirate);
  const devCount = devs.data?.length ?? 0;
  const brkCount = brks.data?.length ?? 0;
  return (
    <Card className="p-5 bg-[#FDFBF7] border border-[#B89555]/30 hover:shadow-md transition">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="h-4 w-4" style={{ color: "#000" }} />
        <h3 className="font-semibold text-base" style={{ color: "#000" }}>{emirate}</h3>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <Link to={`/owner/uae-registry/developers?emirate=${encodeURIComponent(emirate)}`} className="block p-3 rounded-md bg-[#F7F2EA] hover:bg-[#F7F2EA]">
          <div className="flex items-center gap-2 mb-1"><Building2 className="h-3.5 w-3.5" /><span className="text-xs" style={{ color: "#1A1A1A" }}>Developers</span></div>
          <div className="text-xl font-bold" style={{ color: "#000" }}>{devCount}</div>
        </Link>
        <Link to={`/owner/uae-registry/brokerages?emirate=${encodeURIComponent(emirate)}`} className="block p-3 rounded-md bg-[#F7F2EA] hover:bg-[#F7F2EA]">
          <div className="flex items-center gap-2 mb-1"><Users className="h-3.5 w-3.5" /><span className="text-xs" style={{ color: "#1A1A1A" }}>Brokerages</span></div>
          <div className="text-xl font-bold" style={{ color: "#000" }}>{brkCount}</div>
        </Link>
      </div>
    </Card>
  );
}

export default function UAERegistryOverview() {
  return (
    <OwnerGuard>
      <div className="min-h-screen bg-[#FDFBF7] px-6 py-8 max-w-7xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold" style={{ color: "#000" }}>UAE Registration Registry</h1>
          <p className="text-sm mt-1" style={{ color: "#1A1A1A" }}>
            Outreach engine for UAE developers & brokerages. Sender locked: <strong>CONTACT@JBJ.AE</strong>.
          </p>
          <div className="mt-3 flex gap-2">
            <Badge variant="outline" className="border-[#1A1A1A] text-[#1A1A1A]"><Mail className="h-3 w-3 mr-1" />CONTACT@JBJ.AE</Badge>
            <Link to="/owner/uae-registry/developers" className="text-xs underline" style={{ color: "#000" }}>All developers</Link>
            <Link to="/owner/uae-registry/brokerages" className="text-xs underline" style={{ color: "#000" }}>All brokerages</Link>
          </div>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {EMIRATES.map((e) => <EmirateTile key={e} emirate={e} />)}
        </div>
      </div>
    </OwnerGuard>
  );
}
