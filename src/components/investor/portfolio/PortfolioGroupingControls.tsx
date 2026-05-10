import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, Layers, MapPin, CheckSquare } from "lucide-react";

export type GroupingType = "objective" | "asset-type" | "location" | "status";

export type ObjectiveFilter = "all" | "income" | "growth" | "balanced" | "end-use";
export type AssetTypeFilter = "all" | "off-plan" | "ready" | "rental" | "development";
export type LocationFilter = "all" | string;
export type StatusFilter = "all" | "owned" | "reserved" | "under-review" | "sold";

interface PortfolioGroupingControlsProps {
  activeGrouping: GroupingType;
  onGroupingChange: (grouping: GroupingType) => void;
  objectiveFilter: ObjectiveFilter;
  onObjectiveChange: (value: ObjectiveFilter) => void;
  assetTypeFilter: AssetTypeFilter;
  onAssetTypeChange: (value: AssetTypeFilter) => void;
  locationFilter: LocationFilter;
  onLocationChange: (value: LocationFilter) => void;
  statusFilter: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
  availableLocations: string[];
}

export default function PortfolioGroupingControls({
  activeGrouping,
  onGroupingChange,
  objectiveFilter,
  onObjectiveChange,
  assetTypeFilter,
  onAssetTypeChange,
  locationFilter,
  onLocationChange,
  statusFilter,
  onStatusChange,
  availableLocations,
}: PortfolioGroupingControlsProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
        <Layers className="w-5 h-5 text-[#1A1A1A]" />
        Portfolio Grouping
      </h2>
      
      {/* Primary Grouping Tabs */}
      <Tabs value={activeGrouping} onValueChange={(v) => onGroupingChange(v as GroupingType)}>
        <TabsList className="bg-muted/50 h-auto p-1 flex-wrap">
          <TabsTrigger value="objective" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F7F1E6] data-[state=active]:via-[#ECE2D2] data-[state=active]:to-[#D8C7A6] data-[state=active]:text-[#1A1A1A] data-[state=active]:border-[#B89555]/40">
            <Target className="w-4 h-4" />
            By Objective
          </TabsTrigger>
          <TabsTrigger value="asset-type" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F7F1E6] data-[state=active]:via-[#ECE2D2] data-[state=active]:to-[#D8C7A6] data-[state=active]:text-[#1A1A1A] data-[state=active]:border-[#B89555]/40">
            <Layers className="w-4 h-4" />
            By Asset Type
          </TabsTrigger>
          <TabsTrigger value="location" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F7F1E6] data-[state=active]:via-[#ECE2D2] data-[state=active]:to-[#D8C7A6] data-[state=active]:text-[#1A1A1A] data-[state=active]:border-[#B89555]/40">
            <MapPin className="w-4 h-4" />
            By Location
          </TabsTrigger>
          <TabsTrigger value="status" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F7F1E6] data-[state=active]:via-[#ECE2D2] data-[state=active]:to-[#D8C7A6] data-[state=active]:text-[#1A1A1A] data-[state=active]:border-[#B89555]/40">
            <CheckSquare className="w-4 h-4" />
            By Status
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Secondary Filters */}
      <div className="flex flex-wrap gap-3">
        {activeGrouping === "objective" && (
          <Select value={objectiveFilter} onValueChange={(v) => onObjectiveChange(v as ObjectiveFilter)}>
            <SelectTrigger className="w-[180px] border-[#B89555]/30">
              <SelectValue placeholder="Filter by objective" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Objectives</SelectItem>
              <SelectItem value="income">Income-focused</SelectItem>
              <SelectItem value="growth">Growth-focused</SelectItem>
              <SelectItem value="balanced">Balanced</SelectItem>
              <SelectItem value="end-use">End-use / Lifestyle</SelectItem>
            </SelectContent>
          </Select>
        )}

        {activeGrouping === "asset-type" && (
          <Select value={assetTypeFilter} onValueChange={(v) => onAssetTypeChange(v as AssetTypeFilter)}>
            <SelectTrigger className="w-[180px] border-[#B89555]/30">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="off-plan">Off-plan</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="rental">Rental-focused</SelectItem>
              <SelectItem value="development">Development-stage</SelectItem>
            </SelectContent>
          </Select>
        )}

        {activeGrouping === "location" && (
          <Select value={locationFilter} onValueChange={onLocationChange}>
            <SelectTrigger className="w-[180px] border-[#B89555]/30">
              <SelectValue placeholder="Filter by location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {availableLocations.map((loc) => (
                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {activeGrouping === "status" && (
          <Select value={statusFilter} onValueChange={(v) => onStatusChange(v as StatusFilter)}>
            <SelectTrigger className="w-[180px] border-[#B89555]/30">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="owned">Owned</SelectItem>
              <SelectItem value="reserved">Reserved</SelectItem>
              <SelectItem value="under-review">Under Review</SelectItem>
              <SelectItem value="sold">Sold / Archived</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
    </section>
  );
}
