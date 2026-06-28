import { useState } from "react";
import { ChevronDown, HelpCircle, CircleDot } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "Do I need a RERA license to apply?",
    a: "No. For selected sales positions, JBJ may guide qualified candidates through the RERA training and onboarding process after successful evaluation.",
  },
  {
    q: "Is the role commission-only or salary-based?",
    a: "It depends on the role. Brokerage and sales roles are generally performance-based, while operational and corporate positions may include fixed compensation structures.",
  },
  {
    q: "How long does the hiring process take?",
    a: "Qualified candidates are usually contacted within a few business days. Priority applicants may receive accelerated screening through Jessica, our interview consultant.",
  },
  {
    q: "Can I apply from outside the UAE?",
    a: "Yes. International candidates may apply. Final hiring steps, licensing requirements, and any relocation arrangements depend on the selected role and UAE regulations.",
  },
  {
    q: "What languages do I need to speak?",
    a: "English is preferred. Arabic, French, Russian, Chinese, Spanish, and additional investor-facing languages are highly valued for client-facing positions.",
  },
  {
    q: "Is my information confidential?",
    a: "Yes. Applicant information is securely stored and only reviewed by authorized recruitment and management teams.",
  },
];

export function CareersFAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#F7F2EA] via-[#FDFBF7] to-[#EFE6D6]">
      <div className="max-w-3xl mx-auto" data-surface="champagne">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#B89555]/70 bg-[#FDFBF7] px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[#0A0A0A]">
            <HelpCircle className="h-3 w-3 text-[#B89555]" /> Frequently Asked
          </div>
          <h2 className="mt-5 text-3xl md:text-4xl font-semibold text-[#1A1A1A] tracking-tight">
            Questions, answered
          </h2>
          <p className="mt-3 text-sm md:text-base text-[#1A1A1A]/70 max-w-xl mx-auto">
            Clear, accurate answers on roles, licensing, hiring timelines, and applicant privacy.
          </p>
        </div>

        <div className="space-y-4">
          {FAQS.map((f, i) => {
            const open = openIdx === i;
            return (
              <div
                key={f.q}
                className={cn(
                  "overflow-hidden rounded-2xl border bg-[linear-gradient(180deg,rgba(255,253,249,0.98),rgba(243,235,221,0.96))] backdrop-blur-sm transition-all duration-300",
                  open
                    ? "careers-faq-open"
                    : "careers-faq-closed hover:border-[#047857]/35 hover:shadow-[0_18px_36px_-24px_rgba(6,78,59,0.20)]"
                )}
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(open ? null : i)}
                  className={cn(
                    "flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors",
                    open ? "bg-[#EEF7F1]" : "bg-transparent"
                  )}
                  aria-expanded={open}
                >
                  <span className={cn("text-base font-semibold leading-snug", open ? "text-[#1A1A1A]" : "text-[#1A1A1A]")}>{f.q}</span>
                  <span
                    data-surface={open ? "emerald" : "champagne"}
                    className={cn(
                      "grid h-10 w-10 shrink-0 place-items-center rounded-full border transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]",
                      open
                        ? "allow-white border-transparent bg-[image:var(--jj-emerald-ombre)] shadow-[0_12px_22px_-12px_rgba(6,78,59,0.45)]"
                        : "border-[#047857]/40 bg-[#F7F2EA]"
                    )}
                  >
                    {open ? (
                      <CircleDot
                        className="h-4 w-4 allow-white"
                        style={{ color: "#FFFFFF", stroke: "#FFFFFF" }}
                      />
                    ) : (
                      <ChevronDown
                        className="h-4 w-4"
                        style={{ color: "#047857", stroke: "#047857", opacity: 1 }}
                        strokeWidth={2.5}
                      />
                    )}


                  </span>
                </button>
                <div
                  className={cn(
                    "grid transition-all duration-300 ease-out",
                    open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 pt-0.5 text-sm leading-relaxed text-[#1A1A1A]">{f.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default CareersFAQ;
