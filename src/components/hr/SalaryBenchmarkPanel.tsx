import { DollarSign } from "lucide-react";
import CareersEmptyState from "@/components/careers-portal/EmptyState";

/**
 * SalaryBenchmarkPanel — Phase 1 cleanup.
 *
 * All fabricated metrics removed (previous AED 18,500, +12%, "24 roles",
 * "8 competitors" were placeholder values). Until a real salary feed is wired
 * (Cooper Fitch / Hays / Mercer or an internal benchmark dataset),
 * render a clean empty state only. JBJ GLOBAL REAL ESTATE never displays
 * invented numbers.
 */
export function SalaryBenchmarkPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#1A1A1A]">Salary Benchmarks</h2>
        <p className="text-[#1A1A1A]/70 text-sm">
          UAE real estate compensation intelligence. Numbers appear only once a real
          benchmark feed is connected.
        </p>
      </div>

      <CareersEmptyState
        icon={DollarSign}
        title="Awaiting UAE market salary data"
        body="No benchmark feed is connected yet. Once a verified data source is wired (Cooper Fitch, Hays, Mercer or an internal dataset), live ranges will appear here per role, seniority and Emirate."
        badge="JBJ GLOBAL REAL ESTATE — Phase 3"
      />
    </div>
  );
}

export default SalaryBenchmarkPanel;
