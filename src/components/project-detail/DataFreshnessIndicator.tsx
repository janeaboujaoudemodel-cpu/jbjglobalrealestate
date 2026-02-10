import { Clock, RefreshCw, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DataFreshnessIndicatorProps {
  updatedAt?: string | null;
  importSource?: string | null;
  externalId?: string | null;
  className?: string;
}

export default function DataFreshnessIndicator({
  updatedAt,
  importSource,
  externalId,
  className = "",
}: DataFreshnessIndicatorProps) {
  if (!updatedAt && !importSource) return null;

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return "Today";
      } else if (diffDays === 1) {
        return "Yesterday";
      } else if (diffDays < 7) {
        return `${diffDays} days ago`;
      } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
      } else {
        return date.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric"
        });
      }
    } catch {
      return null;
    }
  };

  const getSourceLabel = (source?: string | null) => {
    if (!source) return null;
    const s = source.toLowerCase();
    if (s.includes("reelly")) return "Verified";
    if (s.includes("provident")) return "Verified";
    if (s.includes("manual") || s.includes("admin")) return "Verified";
    return source;
  };

  const sourceLabel = getSourceLabel(importSource);
  const formattedDate = updatedAt ? formatDate(updatedAt) : null;

  return (
    <div className={`flex items-center gap-3 flex-wrap ${className}`}>
      {/* Last Updated */}
      {formattedDate && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Updated {formattedDate}</span>
        </div>
      )}

      {/* Data Source */}
      {sourceLabel && (
        <Badge 
          variant="outline" 
          className="text-xs px-2 py-0.5 border-gold/30 bg-gold/5"
        >
          <Database className="w-3 h-3 mr-1" />
          {sourceLabel}
        </Badge>
      )}

      {/* External Reference removed from public UI - was showing hashtags */}
    </div>
  );
}
