import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { TrendingUp, Briefcase, Building2, ArrowRight, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserModeContext } from "@/contexts/UserModeContext";
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
  const { setMode } = useUserModeContext();

  const handleSelect = async (cat: Category) => {
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
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-3">
            Get started in 30 seconds
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] tracking-tight">
            Tell us who you are
          </h2>
          <p className="mt-3 text-neutral-600 max-w-2xl mx-auto">
            Pick your category to unlock the right tools, dashboards, and a tailored
            registration flow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {CATEGORIES.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <motion.button
                key={cat.id}
                type="button"
                onClick={() => handleSelect(cat.id)}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className="group relative text-left bg-[#FDFBF7] border border-neutral-200 rounded-2xl p-6 hover:border-[#1A1A1A] hover:shadow-xl transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center group-hover:bg-[#1A1A1A] transition-colors">
                    <Icon className="w-6 h-6 text-[#1A1A1A] group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-xs uppercase tracking-wider text-neutral-400 group-hover:text-[#1A1A1A] transition-colors">
                    {cat.tagline}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">{cat.label}</h3>
                <p className="text-sm text-neutral-600 mb-5 leading-relaxed">
                  {cat.description}
                </p>

                <ul className="space-y-2 mb-6">
                  {cat.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-sm text-neutral-700">
                      <CheckCircle2 className="w-4 h-4 text-[#1A1A1A] flex-shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                  <span className="text-sm font-semibold text-[#1A1A1A]">Continue</span>
                  <ArrowRight className="w-4 h-4 text-[#1A1A1A] group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.button>
            );
          })}
        </div>

        <p className="text-center text-xs text-neutral-500 mt-8">
          Your selection is saved to your account. You can change it any time from your profile.
        </p>
      </div>
    </section>
  );
}
