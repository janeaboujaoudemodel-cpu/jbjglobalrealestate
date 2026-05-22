import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { TrendingUp, Briefcase, Building2, ArrowRight, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserModeContext } from "@/contexts/UserModeContext";
import { useIsRegistered } from "@/hooks/useIsRegistered";
import { toast } from "sonner";

type Category = "investor" | "broker" | "developer";

const CATEGORIES: Array<{
  id: Category;
  label: string;
  tagline: string;
  description: string;
  icon: typeof TrendingUp;
  bullets: string[];
}> = [
  {
    id: "investor",
    label: "I'm an Investor",
    tagline: "Buy, hold, and grow",
    description:
      "Browse properties, track your portfolio, and access institutional market intelligence.",
    icon: TrendingUp,
    bullets: ["Property Search & ROI Tools", "Market Intelligence", "Portfolio Tracking"],
  },
  {
    id: "broker",
    label: "I'm a Broker",
    tagline: "Sell smarter, faster",
    description:
      "Access CRM, AI lead tools, broker education, and a curated developer inventory.",
    icon: Briefcase,
    bullets: ["CRM & Lead Manager", "Broker Academy", "Developer Inventory"],
  },
  {
    id: "developer",
    label: "I'm a Developer",
    tagline: "Launch with confidence",
    description:
      "Submit projects, manage launches, and reach our verified broker network.",
    icon: Building2,
    bullets: ["Submit Projects", "Manage Launches", "Broker Network Reach"],
  },
];

export default function CategorySelectorSection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setMode, hasMadeInitialSelection } = useUserModeContext();

  // Once a user is registered (logged in) AND has picked a category that is wired
  // to their account, suppress this section entirely — they've already chosen.
  if (user && hasMadeInitialSelection) {
    return null;
  }


  const handleSelect = async (cat: Category) => {
    // Track source regardless of auth state so anonymous picks still appear in counters
    try {
      const { registerRolePick, SIGNUP_SOURCES } = await import('@/lib/signupSources');
      await registerRolePick({ source: SIGNUP_SOURCES.HOMEPAGE_ROLE_CARD, role: cat });
    } catch {
      /* non-blocking */
    }

    if (!user) {
      navigate(`/auth?returnTo=${encodeURIComponent(`/welcome?preselect=${cat}`)}&preselect=${cat}`);
      return;
    }
    try {
      await setMode(cat as "investor" | "broker" | "developer");
      toast.success(`Welcome — let's complete your ${cat} profile.`);
      navigate(`/register/${cat}`);
    } catch {
      navigate(`/register/${cat}`);
    }
  };

  return (
    <section
      aria-label="Choose your account type"
      className="relative w-full bg-[#FDFBF7] py-16 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-[0.2em] text-[#1A1A1A]/70 mb-3">
            Get started in 30 seconds
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] tracking-tight">
            Tell us who you are
          </h2>
          <p className="mt-3 text-[#1A1A1A]/70 max-w-2xl mx-auto">
            Pick your category to unlock the right tools, dashboards, and a tailored
            registration flow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {CATEGORIES.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <motion.button
                key={cat.id}
                type="button"
                data-no-contrast-guard
                onClick={() => handleSelect(cat.id)}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className="group relative h-full flex flex-col text-left bg-[#F7F2EA] border border-[#B89555]/40 rounded-2xl p-6 hover:border-[#1A1A1A] hover:shadow-xl transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B89555]"
                style={{ color: "#1A1A1A" }}
              >
                {/* Header: icon + tagline tightly aligned */}
                <div className="flex items-center gap-3 mb-5">
                  <span
                    data-no-contrast-guard
                    aria-hidden="true"
                    className="jj-role-icon-tile w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-200"
                    style={{
                      backgroundColor: "#EFE6D6",
                      border: "1px solid #B89555",
                    }}
                  >
                    <Icon
                      className="jj-role-icon w-6 h-6 shrink-0"
                      strokeWidth={2.25}
                      style={{
                        color: "#1A1A1A",
                        stroke: "#1A1A1A",
                        opacity: 1,
                      }}
                    />
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] leading-tight text-[#1A1A1A] group-hover:text-[#1A1A1A] transition-colors">
                    {cat.tagline}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">{cat.label}</h3>
                <p className="text-sm text-[#1A1A1A]/70 mb-5 leading-relaxed">
                  {cat.description}
                </p>

                <ul className="space-y-2 mb-6">
                  {cat.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-sm text-[#1A1A1A]">
                      <CheckCircle2 className="w-4 h-4 text-[#B89555] flex-shrink-0" style={{ color: "#B89555", stroke: "#B89555", opacity: 1 }} />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                {/* Continue row pinned to bottom so all dividers align */}
                <div
                  data-no-contrast-guard
                  className="mt-auto flex items-center justify-between w-full pt-4 border-t border-[#B89555]/30"
                >
                  <span
                    className="text-sm font-semibold"
                    style={{ color: "#B89555" }}
                  >
                    Continue
                  </span>
                  <ArrowRight
                    className="w-4 h-4 group-hover:translate-x-1 transition-transform flex-shrink-0"
                    strokeWidth={2.5}
                    style={{ color: "#B89555", stroke: "#B89555", opacity: 1 }}
                  />
                </div>
              </motion.button>
            );
          })}
        </div>

        <p className="text-center text-xs text-[#1A1A1A]/70 mt-8">
          Your selection is saved to your account. You can change it any time from your profile.
        </p>
      </div>
    </section>
  );
}
