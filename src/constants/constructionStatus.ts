/**
 * Construction Status Constants - Used for API sync and filtering
 * These are the official construction statuses from the Reelly API
 */

export const CONSTRUCTION_STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "completed", label: "Completed" },
  { value: "presale", label: "Presale" },
  { value: "under_construction", label: "Under Construction" },
  { value: "resale_offplan", label: "Resale Off-Plan" },
  { value: "ready_resale", label: "Ready Resale" },
] as const;

// Mapping from API values to display labels
export const CONSTRUCTION_STATUS_LABELS: Record<string, string> = {
  "completed": "Completed",
  "presale": "Presale",
  "under_construction": "Under Construction",
  "resale_offplan": "Resale Off-Plan",
  "ready_resale": "Ready Resale",
  // Alternative API formats
  "Completed": "Completed",
  "Presale": "Presale",
  "Under Construction": "Under Construction",
  "Resale Off-Plan": "Resale Off-Plan",
  "Ready Resale": "Ready Resale",
};

// Convert API construction status to normalized database value
export function normalizeConstructionStatus(apiStatus: string | null | undefined): string | null {
  if (!apiStatus) return null;
  
  const normalizedMap: Record<string, string> = {
    // Exact matches from API
    "Completed": "Completed",
    "Presale": "Presale",
    "Under Construction": "Under Construction",
    "Resale Off-Plan": "Resale Off-Plan",
    "Ready Resale": "Ready Resale",
    // Snake case variants
    "completed": "Completed",
    "presale": "Presale",
    "under_construction": "Under Construction",
    "resale_offplan": "Resale Off-Plan",
    "ready_resale": "Ready Resale",
    // Legacy mappings
    "off_plan": "Under Construction",
    "ready": "Completed",
    "pre_launch": "Presale",
    "resale": "Ready Resale",
  };
  
  return normalizedMap[apiStatus] || apiStatus;
}

// Get badge color for construction status
export function getConstructionStatusColor(status: string | null | undefined): string {
  const normalizedStatus = normalizeConstructionStatus(status);
  
  switch (normalizedStatus) {
    case "Completed":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "Presale":
      return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    case "Under Construction":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "Resale Off-Plan":
      return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    case "Ready Resale":
      return "bg-teal-500/20 text-teal-400 border-teal-500/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export type ConstructionStatusValue = typeof CONSTRUCTION_STATUS_OPTIONS[number]['value'];
