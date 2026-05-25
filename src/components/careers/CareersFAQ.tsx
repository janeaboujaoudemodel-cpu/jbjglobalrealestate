import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
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
    a: "Qualified candidates are usually contacted within a few business days. Priority applicants may receive accelerated screening through Jessica, our AI recruitment assistant.",
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
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#F7F2EA] via-[#FDFBF7] to-[#F7F2EA]">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#B89555]/70 bg-[#FDFBF7] px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[#102540]">
            <HelpCircle className="h-3 w-3 text-[#B89555]" /> Frequently Asked
          </div>
          <h2 className="mt-5 text-3xl md:text-4xl font-semibold text-[#1A1A1A] tracking-tight">
            Questions, answered
          </h2>
          <p className="mt-3 text-sm md:text-base text-[#1A1A1A]/70 max-w-xl mx-auto">
            Clear, accurate answers on roles, licensing, hiring timelines, and applicant privacy.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((f, i) => {
            const open = openIdx === i;
            return (
              <div
                key={f.q}
                className={cn(
                  "overflow-hidden rounded-2xl border bg-[#FDFBF7]/95 backdrop-blur-sm transition-all duration-300",
                  open
                    ? "border-[#B89555] shadow-[0_18px_40px_-22px_rgba(16,37,64,0.28)]"
                    : "border-[#B89555]/35 hover:border-[#B89555]/70 hover:shadow-[0_10px_30px_-20px_rgba(16,37,64,0.22)]"
                )}
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(open ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={open}
                >
                  <span className="text-base font-semibold text-[#1A1A1A]">{f.q}</span>
                  <span
                    className={cn(
                      "grid h-7 w-7 shrink-0 place-items-center rounded-full border transition-all",
                      open
                        ? "border-[#102540] bg-[#102540]"
                        : "border-[#B89555]/60 bg-[#FDFBF7]"
                    )}
                  >
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 transition-transform",
                        open ? "rotate-180 text-white" : "text-[#102540]"
                      )}
                      data-allow-dark-cta={open ? "" : undefined}
                      data-no-contrast-guard={open ? "" : undefined}
                    />
                  </span>
                </button>
                <div
                  className={cn(
                    "grid transition-all duration-300 ease-out",
                    open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm leading-relaxed text-[#1A1A1A]/80">{f.a}</p>
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
