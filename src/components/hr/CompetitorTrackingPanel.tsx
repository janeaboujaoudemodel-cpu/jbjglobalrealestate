import { Building2 } from "lucide-react";
import CareersEmptyState from "@/components/careers-portal/EmptyState";

/**
 * CompetitorTrackingPanel — Phase 1 cleanup.
 *
 * All fabricated counters removed (previous "12 competitors tracked",
 * "47 open positions", "23 new hires (30d)", "5 alerts" were placeholder
 * values). No scraping, no simulated activity. Until a real intelligence
 * feed is connected, render a clean empty state.
 */
export function CompetitorTrackingPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1A1A1A]">Competitor Intelligence</h2>
        <p className="text-[#1A1A1A]/70 text-sm">
          Track competitor hiring and market movements in UAE real estate.
        </p>
      </div>

      <CareersEmptyState
        icon={Building2}
        title="No competitor intelligence connected yet"
        body="JBJ GLOBAL REAL ESTATE does not display fabricated competitor data. Once a verified market-intelligence feed is wired, competitor companies, open roles and talent-movement signals will appear here in real time."
        badge="JBJ GLOBAL REAL ESTATE — Phase 3"
      />
    </div>
  );
}

export default CompetitorTrackingPanel;
