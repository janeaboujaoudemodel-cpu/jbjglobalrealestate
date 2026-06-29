import BrokerEmptyState from "@/components/broker-portal/BrokerEmptyState";
import { Construction } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  title: string;
  description?: string;
  cta?: { to: string; label: string };
}

/**
 * Placeholder section for sidebar entries whose underlying surface isn't
 * yet wired into the new portal shell (Deals, Commissions, Marketing Toolkit,
 * Documents deep-link, etc.). Renders a branded empty state — never a blank
 * white panel.
 */
export default function BrokerComingSoonSection({ title, description, cta }: Props) {
  return (
    <div className="space-y-4">
      <header className="mb-2">
        <div className="text-[10px] uppercase tracking-[0.22em] text-[#1A1A1A]/55">
          Broker Portal
        </div>
        <h1 className="text-2xl md:text-3xl font-semibold text-[#1A1A1A] mt-1">{title}</h1>
      </header>
      <BrokerEmptyState
        icon={<Construction className="h-4 w-4" />}
        title={`${title} workspace`}
        description={
          description ||
          "This section is being moved into your portal shell. Existing tools remain available from their direct links."
        }
        action={
          cta && (
            <Link
              to={cta.to}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-md jj-surface-emerald allow-white text-white text-xs font-medium hover:-translate-y-0.5 hover:brightness-110 transition-colors"
              data-allow-dark-cta
            >
              {cta.label}
            </Link>
          )
        }
      />
    </div>
  );
}
