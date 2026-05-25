import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "Do I need a RERA license to apply?",
    a: "Not at the time of application. If selected for a sales role, JBJ will sponsor your RERA training and certification as part of onboarding.",
  },
  {
    q: "Is the role commission-only or salary-based?",
    a: "It depends on the position. Broker roles are commission-based with industry-leading splits. Marketing, operations, HR, and tech roles include a competitive base salary plus performance bonuses.",
  },
  {
    q: "How long does the hiring process take?",
    a: "Most candidates hear back within 48–72 hours. The full process — application, Jessica AI screening, interview with leadership, and offer — typically completes within 7–10 business days.",
  },
  {
    q: "Can I apply from outside the UAE?",
    a: "Yes. We sponsor relocation and visa for the right candidates. Many of our team relocated from Europe, Asia, and the Americas.",
  },
  {
    q: "What languages do I need to speak?",
    a: "English is required. Arabic, Russian, French, Mandarin, Hindi, or Urdu are highly valued for client-facing roles serving our international clientele.",
  },
  {
    q: "Is my information confidential?",
    a: "Absolutely. All applications are encrypted, access is restricted to the hiring team, and your data is never shared with third parties. You can request deletion at any time.",
  },
];

export function CareersFAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="relative py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#F7F2EA] via-[#FDFBF7] to-[#F7F2EA]">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#B89555] bg-[#FDFBF7] px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#102540]">
            <HelpCircle className="h-3 w-3 text-[#B89555]" /> Frequently Asked
          </div>
          <h2 className="mt-4 text-3xl md:text-4xl font-semibold text-[#1A1A1A] tracking-tight">
            Questions, answered
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((f, i) => {
            const open = openIdx === i;
            return (
              <div
                key={f.q}
                className={cn(
                  "overflow-hidden rounded-2xl border-2 transition-all bg-[#FDFBF7]",
                  open ? "border-[#102540] shadow-[0_10px_30px_-15px_rgba(16,37,64,0.35)]" : "border-[#B89555]/40 hover:border-[#102540]/40"
                )}
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(open ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={open}
                >
                  <span className="text-base font-bold text-[#1A1A1A]">{f.q}</span>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 shrink-0 text-[#102540] transition-transform",
                      open && "rotate-180"
                    )}
                  />
                </button>
                <div
                  className={cn(
                    "grid transition-all duration-300 ease-out",
                    open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-4 text-sm leading-relaxed text-[#1A1A1A]/80">{f.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-sm font-semibold text-[#102540]/80">
          Still have questions? Email{" "}
          <a href="mailto:careers@JBJ.ae" className="text-[#102540] underline">
            careers@JBJ.ae
          </a>
        </p>
      </div>
    </section>
  );
}

export default CareersFAQ;
