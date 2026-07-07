import * as React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import jbjMonogram from "@/assets/jbj-monogram-light-transparent.png";
import jbjFullLogoLight from "@/assets/jbj-fulllogo-light.png";
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
                    data-icon-circle="true"
                    className="jj-emerald-action inline-grid w-8 h-8 min-w-8 min-h-8 aspect-square rounded-full place-items-center shrink-0 p-0 overflow-hidden"
                    aria-hidden="true"
                  >
                    <Sparkles className="w-4 h-4 allow-white" style={{ color: '#FFFFFF' }} strokeWidth={2.5} />
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
                background: "linear-gradient(135deg, #064E3B 0%, #042C1C 58%, #000000 100%)",
                border: "1px solid rgba(0,0,0,0.28)",
                boxShadow: "0 20px 40px -10px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.12)",
              }}
              data-hero-dark
              data-surface="emerald"
              data-no-contrast-guard

            >
              <div
                className="absolute inset-0 opacity-35"
                style={{
                  backgroundImage: "linear-gradient(120deg, transparent 0%, rgba(0,0,0,0.34) 36%, rgba(6,78,59,0.20) 50%, rgba(0,0,0,0.38) 64%, transparent 100%)",
                }}
              />
              <div className="relative z-10 flex flex-col items-center justify-center -mb-2" aria-hidden="true">
                <img
                  src={jbjMonogram}
                  alt="JBJ"
                  className="w-40 h-40 object-contain select-none"
                  style={{ filter: "drop-shadow(0 5px 16px rgba(0,0,0,0.68))" }}
                />
                <img
                  src={jbjFullLogoLight}
                  alt="JBJ Global Real Estate"
                  className="-mt-8 h-12 w-auto object-contain select-none"
                  style={{ filter: "drop-shadow(0 3px 12px rgba(0,0,0,0.72))" }}
                />
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
