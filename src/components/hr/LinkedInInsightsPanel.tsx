import { Linkedin, Upload } from "lucide-react";
import CareersEmptyState from "@/components/careers-portal/EmptyState";

/**
 * LinkedInInsightsPanel — Phase 1 cleanup.
 *
 * All fabricated counters removed (previous "156 profiles tracked", "12 job
 * changes", "34 connections", "48 InMails" were placeholder values).
 * No scraping. No fake "Connect LinkedIn Recruiter" action.
 *
 * Phase 3a will rebuild this as a **legal manual-import + AI enrichment**
 * workflow: user pastes a LinkedIn URL or uploads an exported PDF/CV,
 * Lovable AI Gateway enriches it, and results are persisted to
 * `hr_linkedin_insights`. Future ATS connectors (LinkedIn Talent Solutions,
 * Ashby, Greenhouse, Lever) will be opt-in and credentialed.
 */
export function LinkedInInsightsPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1A1A1A]">LinkedIn Recruiting</h2>
        <p className="text-[#1A1A1A]/70 text-sm">
          Manual import + AI enrichment. No scraping, no fake automation. JBJ GLOBAL REAL ESTATE only displays data sourced legally.
        </p>
      </div>

      <CareersEmptyState
        icon={Linkedin}
        title="Manual import & AI enrichment — coming in Phase 3a"
        body="Paste a LinkedIn profile URL or upload an exported PDF/CV. Lovable AI enriches the profile into a candidate record under CV Center. Official LinkedIn Talent Solutions / Ashby / Greenhouse / Lever connectors will be added once credentials are provisioned."
        badge="JBJ GLOBAL REAL ESTATE — Phase 3a"
      >
        <div className="inline-flex items-center gap-2 text-[12px] text-[#1A1A1A]/60 border border-[#B89555]/40 rounded-full px-3 py-1.5 bg-white/40">
          <Upload className="w-3.5 h-3.5" /> Import flow will land here
        </div>
      </CareersEmptyState>
    </div>
  );
}

export default LinkedInInsightsPanel;
