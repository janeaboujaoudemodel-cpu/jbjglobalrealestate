import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, MapPin, Building2, FileText } from "lucide-react";

export type ReportCategory = "all" | "market" | "area" | "asset" | "advisory";
export type GeographicScope = "all" | "uae" | "dubai" | "abu-dhabi" | "sharjah";
export type DateRange = "all" | "30days" | "90days" | "year" | "older";

interface ReportCategoryTabsProps {
  activeCategory: ReportCategory;
  onCategoryChange: (category: ReportCategory) => void;
  geographicScope: GeographicScope;
  onScopeChange: (scope: GeographicScope) => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

export default function ReportCategoryTabs({
  activeCategory,
  onCategoryChange,
  geographicScope,
  onScopeChange,
  dateRange,
  onDateRangeChange,
}: ReportCategoryTabsProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
        <FileText className="w-5 h-5 text-[#1A1A1A]" />
        Report Categories
      </h2>

      {/* Primary Category Tabs */}
      <Tabs value={activeCategory} onValueChange={(v) => onCategoryChange(v as ReportCategory)}>
        <TabsList className="bg-muted/50 h-auto p-1 flex-wrap">
          <TabsTrigger value="all" className="gap-2 data-[state=active]:bg-[#EFE6D6] data-[state=active]:text-[#1A1A1A]">
            All Reports
          </TabsTrigger>
          <TabsTrigger value="market" className="gap-2 data-[state=active]:bg-[#EFE6D6] data-[state=active]:text-[#1A1A1A]">
            <BarChart3 className="w-4 h-4" />
            Market Reports
          </TabsTrigger>
          <TabsTrigger value="area" className="gap-2 data-[state=active]:bg-[#EFE6D6] data-[state=active]:text-[#1A1A1A]">
            <MapPin className="w-4 h-4" />
            Area Intelligence
          </TabsTrigger>
          <TabsTrigger value="asset" className="gap-2 data-[state=active]:bg-[#EFE6D6] data-[state=active]:text-[#1A1A1A]">
            <Building2 className="w-4 h-4" />
            Asset-Specific
          </TabsTrigger>
          <TabsTrigger value="advisory" className="gap-2 data-[state=active]:bg-[#EFE6D6] data-[state=active]:text-[#1A1A1A]">
            <FileText className="w-4 h-4" />
            Custom / Advisory
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Secondary Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={geographicScope} onValueChange={(v) => onScopeChange(v as GeographicScope)}>
          <SelectTrigger className="w-[180px] border-[#B89555]/30">
            <SelectValue placeholder="Geographic scope" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            <SelectItem value="uae">UAE-wide</SelectItem>
            <SelectItem value="dubai">Dubai</SelectItem>
            <SelectItem value="abu-dhabi">Abu Dhabi</SelectItem>
            <SelectItem value="sharjah">Sharjah</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateRange} onValueChange={(v) => onDateRangeChange(v as DateRange)}>
          <SelectTrigger className="w-[180px] border-[#B89555]/30">
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="30days">Last 30 Days</SelectItem>
            <SelectItem value="90days">Last 90 Days</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
            <SelectItem value="older">Older</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </section>
  );
}
