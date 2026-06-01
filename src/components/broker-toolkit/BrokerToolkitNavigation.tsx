import { Wrench, GraduationCap, Users, Target, TrendingUp } from "lucide-react";

interface BrokerToolkitNavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const SECTIONS = [
  { id: "tools", label: "Tools", icon: Wrench },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "support", label: "Support Team", icon: Users },
  { id: "crm", label: "CRM & Leads", icon: Target },
  { id: "growth", label: "Growth & Rewards", icon: TrendingUp },
];

export function BrokerToolkitNavigation({
  activeSection,
  onSectionChange,
}: BrokerToolkitNavigationProps) {
  return (
    <section
      id="what-you-get"
      className="jj-band jj-band--page sticky top-[88px] z-30 py-3 border-b border-[#B89555]/25"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-2 overflow-x-auto scrollbar-hide">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                type="button"
                data-cta={isActive ? "pill-active" : "pill-idle"}
                onClick={() => {
                  onSectionChange(section.id);
                  document
                    .getElementById(`section-${section.id}`)
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`${
                  isActive ? "jj-pill-active" : "jj-cta-outline"
                } inline-flex items-center gap-2 h-9 px-4 rounded-full text-sm font-medium whitespace-nowrap`}
              >
                <Icon className="w-4 h-4" />
                <span>{section.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
