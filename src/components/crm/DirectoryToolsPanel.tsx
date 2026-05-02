import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wand2, RefreshCcw, Globe2 } from "lucide-react";
import { useSeedUaeBrokerageDirectory, useEnrichUaeBrokerageDirectory, useEnrichDeveloperRegistry } from "@/hooks/useCRMRelationships";

const EMIRATES = ["Dubai","Abu Dhabi","Sharjah","Ajman","Ras Al Khaimah","Fujairah","Umm Al Quwain"];

/**
 * Admin-only directory tools. Exposed inside the Brokerages tab.
 * - Sync UAE brokerage directory (per emirate or all)
 * - Enrich missing brokerage contacts (fills phone / email / website / office)
 * - Enrich missing developer contacts (reuses existing edge fn)
 */
export const DirectoryToolsPanel = () => {
  const seed = useSeedUaeBrokerageDirectory();
  const enrichBrokers = useEnrichUaeBrokerageDirectory();
  const enrichDevs = useEnrichDeveloperRegistry();
  const [activeEmirate, setActiveEmirate] = useState<string | "all">("all");

  const runSeed = () =>
    seed.mutate({
      emirates: activeEmirate === "all" ? undefined : [activeEmirate],
      target_per_emirate: 200,
    });

  return (
    <Card className="border-[#B89555]/30 bg-[#FDFBF7]">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Globe2 className="w-4 h-4 text-[#B89555]" />
          <h3 className="text-sm font-semibold text-[#1A1A1A]">UAE Licensed Directory · Admin tools</h3>
          <Badge className="bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/40 ml-auto">Owner / Admin only</Badge>
        </div>

        <div className="space-y-2">
          <div className="text-xs text-[#1A1A1A]/70">Pull licensed brokerages from RERA / DMT / municipality registries.</div>
          <div className="flex flex-wrap gap-1.5">
            {(["all", ...EMIRATES] as const).map((e) => (
              <button
                key={e}
                onClick={() => setActiveEmirate(e as any)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                  activeEmirate === e
                    ? "bg-[#B89555] text-white border-[#B89555]"
                    : "bg-[#F7F2EA] text-[#1A1A1A] border-[#B89555]/30 hover:bg-[#EFE6D6]"
                }`}
              >
                {e === "all" ? "All emirates" : e}
              </button>
            ))}
          </div>
          <Button onClick={runSeed} disabled={seed.isPending} className="bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]/90">
            {seed.isPending ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Wand2 className="w-3.5 h-3.5 mr-2" />}
            Sync UAE brokerage directory
          </Button>
        </div>

        <div className="border-t border-[#B89555]/20 pt-4 space-y-2">
          <div className="text-xs text-[#1A1A1A]/70">
            Fill missing phone / email / website / office address for brokerages and developers — runs in batches.
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => enrichBrokers.mutate({ batchSize: 5, reverify: true })}
              disabled={enrichBrokers.isPending}
              className="border-[#B89555]/40"
            >
              {enrichBrokers.isPending ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5 mr-2" />}
              Enrich brokerages (batch of 5)
            </Button>
            <Button
              variant="outline"
              onClick={() => enrichDevs.mutate({ batchSize: 5 })}
              disabled={enrichDevs.isPending}
              className="border-[#B89555]/40"
            >
              {enrichDevs.isPending ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5 mr-2" />}
              Enrich developers (batch of 5)
            </Button>
          </div>
          <div className="text-[11px] text-[#1A1A1A]/60">
            Tip: re-click "Enrich" to process the next batch. Curated values are never overwritten — only blanks are filled.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
