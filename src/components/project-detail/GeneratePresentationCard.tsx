import * as React from "react";
import { motion } from "framer-motion";
import { Presentation, Sparkles } from "lucide-react";
import { useUserMode } from "@/hooks/useUserMode";
import { PresentationBuilderDialog } from "@/components/presentation-builder/PresentationBuilderDialog";
import type { DeckProject } from "@/components/presentation-builder/renderDeckHtml";

interface Props {
  project: DeckProject;
}

/**
 * Entry card for the project presentation generator.
 * Visible ONLY for broker / owner / developer modes (hidden for investor + anonymous).
 */
export const GeneratePresentationCard: React.FC<Props> = ({ project }) => {
  const { isBrokerMode, isDeveloperMode, mode } = useUserMode();
  const isOwner = mode === "owner";
  const allowed = isBrokerMode || isDeveloperMode || isOwner;
  const [open, setOpen] = React.useState(false);

  if (!allowed) return null;

  return (
    <>
      <div className="jj-card-inner">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#1A1A1A]/60 font-semibold mb-4">
              Sales Tool
            </p>
            <h3 className="text-3xl md:text-4xl font-semibold text-[#1A1A1A] mb-4 leading-tight tracking-tight">
              Generate Presentation
            </h3>
            <div className="w-16 h-px bg-[#B89555] mb-5" />
            <p className="text-[#1A1A1A]/85 mb-6 leading-relaxed text-[15px]">
              Build a tailored, branded deck for {project.name} in seconds. Choose the units, add your
              photo and contact, toggle sections — empty fields are skipped automatically. Export as PDF
              and share with your client.
            </p>
            <ul className="space-y-3 text-[15px] text-[#1A1A1A]">
              {[
                "Auto-pulls amenities, gallery, payment plan, developer profile",
                "Select up to 5 units with floor plans & pricing",
                "Your photo, name, title and contact (all optional)",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span
                    data-emerald-action="true"
                    className="jj-emerald-action inline-flex w-6 h-6 rounded-full items-center justify-center shrink-0"
                    aria-hidden="true"
                  >
                    <Sparkles className="w-3 h-3" style={{ color: '#FFFFFF' }} />
                  </span>
                  <span className="text-[#1A1A1A]/90">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-center">
            <motion.button
              type="button"
              onClick={() => setOpen(true)}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative w-[380px] h-[260px] rounded-lg overflow-hidden cursor-pointer flex flex-col items-center justify-center gap-4 text-white"
              style={{
                background: "linear-gradient(135deg, #0A0A0A 0%, #1F1F1F 60%, #0A0A0A 100%)",
                border: "1px solid rgba(184,149,85,0.55)",
                boxShadow: "0 20px 40px -10px rgba(0,0,0,0.4)",
              }}
              data-hero-dark
              data-surface="emerald"
              data-no-contrast-guard

            >
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: "radial-gradient(circle at 30% 20%, rgba(184,149,85,0.35), transparent 60%)",
                }}
              />
              <div
                data-emerald-action="true"
                className="jj-emerald-action relative z-10 w-16 h-16 rounded-full inline-flex items-center justify-center"
                style={{ boxShadow: "0 8px 18px rgba(0,0,0,0.4)" }}
              >
                <Presentation className="w-7 h-7" style={{ color: "#FFFFFF" }} />
              </div>
              <div className="relative z-10 text-center px-6" data-no-contrast-guard>
                <div id="jj-genpres-eyebrow" className="text-[11px] uppercase tracking-[0.3em] mb-1">
                  Click to start
                </div>
                <div id="jj-genpres-title" className="text-[20px] font-semibold">Generate Presentation</div>
                <div id="jj-genpres-sub" className="text-[12px] mt-1">Custom PDF deck · ~30 seconds</div>
              </div>


            </motion.button>


          </div>
        </div>
      </div>

      <PresentationBuilderDialog open={open} onOpenChange={setOpen} project={project} />
    </>
  );
};

export default GeneratePresentationCard;
