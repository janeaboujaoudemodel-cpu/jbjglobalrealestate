/**
 * FilterToolbar - Save Filter, Favorites, Shortlist badges
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { Save, Heart, List, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useFavorites, useShortlist } from "@/hooks/useFavorites";

interface FilterToolbarProps {
  projectCount: number;
  onSaveFilter?: (name: string) => void;
  variant?: 'light' | 'dark';
  className?: string;
}

export function FilterToolbar({
  projectCount,
  onSaveFilter,
  variant = 'light',
  className
}: FilterToolbarProps) {
  const [saveOpen, setSaveOpen] = useState(false);
  const [filterName, setFilterName] = useState("");
  const { data: favorites } = useFavorites();
  const { data: shortlist } = useShortlist();
  const isDark = variant === 'dark';

  const handleSave = () => {
    if (filterName.trim() && onSaveFilter) {
      onSaveFilter(filterName.trim());
      setFilterName("");
      setSaveOpen(false);
    }
  };

  const favoritesCount = favorites?.length || 0;
  const shortlistCount = shortlist?.length || 0;

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      {/* Project Count Badge */}
      <Badge 
        variant="secondary" 
        className={cn(
          "px-3 py-1.5 text-sm font-semibold",
          isDark 
            ? "bg-gold/20 text-gold border border-gold/30"
            : "bg-gold/10 text-gold border border-gold/30"
        )}
      >
        {projectCount.toLocaleString()} Projects
      </Badge>

      <div className="w-px h-6 bg-gold/30 mx-1" />

      {/* Save Filter */}
      <Popover open={saveOpen} onOpenChange={setSaveOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-9 gap-2",
              isDark 
                ? "bg-[#1a1a1a] border-[#2a2a2a] text-white hover:bg-[#2a2a2a]"
                : "bg-white/80 border-gold/30 text-black hover:bg-champagne-light"
            )}
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">Save Filter</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className={cn(
            "w-[280px] p-4",
            isDark ? "bg-[#1a1a1a] border-[#2a2a2a]" : "bg-white border-gold/20"
          )}
          align="start"
        >
          <div className="space-y-3">
            <h4 className={cn(
              "text-sm font-medium",
              isDark ? "text-white" : "text-black"
            )}>
              Save Current Filter
            </h4>
            <Input
              placeholder="Filter name..."
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              className={cn(
                isDark 
                  ? "bg-[#2a2a2a] border-[#3a3a3a] text-white placeholder:text-zinc-500"
                  : "bg-champagne-light border-gold/30 text-black"
              )}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSaveOpen(false)}
                className={isDark ? "text-zinc-400" : "text-black/60"}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!filterName.trim()}
                className="bg-gold text-black hover:bg-gold/90 flex-1"
              >
                Save
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Favorites */}
      <Link to="/favorites">
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-9 gap-2",
            isDark 
              ? "bg-[#1a1a1a] border-[#2a2a2a] text-white hover:bg-[#2a2a2a]"
              : "bg-white/80 border-gold/30 text-black hover:bg-champagne-light"
          )}
        >
          <Heart className={cn("w-4 h-4", favoritesCount > 0 && "fill-red-500 text-red-500")} />
          <span className="hidden sm:inline">Favorites</span>
          {favoritesCount > 0 && (
            <Badge 
              variant="secondary" 
              className="h-5 min-w-5 px-1.5 text-xs bg-red-500/20 text-red-500 border-0"
            >
              {favoritesCount}
            </Badge>
          )}
        </Button>
      </Link>

      {/* Shortlist */}
      <Link to="/shortlist">
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-9 gap-2",
            isDark 
              ? "bg-[#1a1a1a] border-[#2a2a2a] text-white hover:bg-[#2a2a2a]"
              : "bg-white/80 border-gold/30 text-black hover:bg-champagne-light"
          )}
        >
          <List className="w-4 h-4" />
          <span className="hidden sm:inline">Shortlist</span>
          {shortlistCount > 0 && (
            <Badge 
              variant="secondary" 
              className="h-5 min-w-5 px-1.5 text-xs bg-gold/20 text-gold border-0"
            >
              {shortlistCount}
            </Badge>
          )}
        </Button>
      </Link>

      {/* Map View */}
      <Link to="/map">
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-9 gap-2",
            isDark 
              ? "bg-[#1a1a1a] border-[#2a2a2a] text-white hover:bg-[#2a2a2a]"
              : "bg-white/80 border-gold/30 text-black hover:bg-champagne-light"
          )}
        >
          <Map className="w-4 h-4" />
          <span className="hidden sm:inline">Map</span>
        </Button>
      </Link>
    </div>
  );
}
