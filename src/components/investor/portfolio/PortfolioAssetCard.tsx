import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, FileText, Eye, FolderOpen, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

export interface PortfolioAsset {
  id: string;
  name: string;
  assetType: "off-plan" | "ready";
  location: string;
  emirate: string;
  community?: string;
  status: "owned" | "reserved" | "under-evaluation" | "sold";
  objective: "income" | "growth" | "balanced" | "end-use";
  documentsStatus: "available" | "missing" | "partial";
  lastUpdated: string;
  imageUrl?: string;
}

interface PortfolioAssetCardProps {
  asset: PortfolioAsset;
}

export default function PortfolioAssetCard({ asset }: PortfolioAssetCardProps) {
  const getStatusBadge = (status: PortfolioAsset["status"]) => {
    const styles = {
      owned: "jj-surface-emerald-soft text-[color:var(--emerald-1)] border-[color:var(--emerald-1)]/30/30",
      reserved: "bg-amber-500/10 text-amber-600 border-amber-500/30",
      "under-evaluation": "bg-blue-500/10 text-blue-600 border-blue-500/30",
      sold: "bg-[#B89555]/10 text-[#1A1A1A]/70 border-[#B89555]/30",
    };
    const labels = {
      owned: "Owned",
      reserved: "Reserved",
      "under-evaluation": "Under Evaluation",
      sold: "Sold / Archived",
    };
    return <Badge className={styles[status]}>{labels[status]}</Badge>;
  };

  const getTypeBadge = (type: "off-plan" | "ready") => {
    return (
      <Badge
        variant="outline"
        className={
          type === "off-plan"
            ? "border-[#B89555]/50 text-[#1A1A1A]"
            : "border-[color:var(--emerald-1)]/30/50 text-[color:var(--emerald-1)]"
        }
      >
        {type === "off-plan" ? "Off-Plan" : "Ready"}
      </Badge>
    );
  };

  const getObjectiveBadge = (objective: PortfolioAsset["objective"]) => {
    const styles = {
      income: "bg-blue-500/10 text-blue-600 border-blue-500/30",
      growth: "jj-surface-emerald-soft text-[color:var(--emerald-1)] border-[color:var(--emerald-1)]/30/30",
      balanced: "bg-purple-500/10 text-purple-600 border-purple-500/30",
      "end-use": "bg-amber-500/10 text-amber-600 border-amber-500/30",
    };
    const labels = {
      income: "Income",
      growth: "Growth",
      balanced: "Balanced",
      "end-use": "End-use",
    };
    return <Badge className={styles[objective]}>{labels[objective]}</Badge>;
  };

  const getDocumentsIndicator = (status: PortfolioAsset["documentsStatus"]) => {
    const config = {
      available: { color: "text-emerald-500", label: "Documents Available" },
      missing: { color: "text-red-500", label: "Documents Missing" },
      partial: { color: "text-amber-500", label: "Partial Documents" },
    };
    return (
      <span className={`text-xs flex items-center gap-1 ${config[status].color}`}>
        <FileText className="w-3 h-3" />
        {config[status].label}
      </span>
    );
  };

  return (
    <Card className="border-2 border-[#B89555]/30 overflow-hidden group hover:border-[#B89555] transition-colors">
      {/* Image Header */}
      <div className="aspect-video relative overflow-hidden bg-[#F7F2EA]">
        {asset.imageUrl ? (
          <img
            src={asset.imageUrl}
            alt={asset.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
           loading="lazy" decoding="async" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200">
            <Building2 className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
        <div className="absolute top-2 right-2 flex gap-2">
          {getTypeBadge(asset.assetType)}
        </div>
        <div className="absolute top-2 left-2">
          {getObjectiveBadge(asset.objective)}
        </div>
      </div>

      {/* Card Content */}
      <CardContent className="p-4 space-y-3">
        <div>
          <h4 className="font-semibold text-foreground mb-1 line-clamp-1">
            {asset.name}
          </h4>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {asset.community ? `${asset.community}, ` : ""}
            {asset.location}, {asset.emirate}
          </p>
        </div>

        {/* Status Row */}
        <div className="flex items-center justify-between">
          {getStatusBadge(asset.status)}
          {getDocumentsIndicator(asset.documentsStatus)}
        </div>

        {/* Last Updated */}
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          Last updated: {format(new Date(asset.lastUpdated), "MMM d, yyyy")}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-border/50">
          <Link to={`/project/${asset.id}`} className="flex-1">
            <Button variant="secondary" size="sm" className="w-full gap-1">
              <Eye className="w-4 h-4" />
              View Details
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="gap-1 border-[#B89555]/30">
            <FileText className="w-4 h-4" />
            Reports
          </Button>
          <Button variant="outline" size="sm" className="gap-1 border-[#B89555]/30">
            <FolderOpen className="w-4 h-4" />
            Docs
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
