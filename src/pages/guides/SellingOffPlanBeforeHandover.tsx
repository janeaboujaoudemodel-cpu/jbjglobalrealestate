import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText, ShieldCheck, Building2, HelpCircle, ArrowRight,
  CheckCircle2, AlertTriangle, ScrollText, Landmark,
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

/**
 * Selling Off-Plan Property in Dubai Before Handover
 *
 * SEO target: "how to sell off plan properties in dubai" (~880 vol/mo).
 * Covers DLD rules, developer NOC, assignment vs. resale, fees, and
 * common pitfalls. Ivory + gold JBJ editorial system.
 */

const STEPS = [
  {
    icon: FileText,
    title: "1. Confirm you're eligible to resell",
    body: "Most Dubai developers require a minimum of 30–40% of the total purchase price paid (including DLD 4% fee) before you can assign or resell an off-plan unit. Review your SPA (Sale & Purchase Agreement) — the exact threshold and any transfer restrictions are stated there.",
  },
  {
    icon: Landmark,
    title: "2. Settle outstanding installments & service charges",
    body: "Any missed installments, late fees, or unpaid service charges must be cleared before the developer will issue clearance. Request an updated statement of account and settle the balance in writing.",
  },
  {
    icon: ShieldCheck,
    title: "3. Request a Developer NOC (No Objection Certificate)",
    body: "The developer's NOC confirms the unit can be transferred and states the outstanding balance for the new buyer. Fees typically range from AED 1,500 to AED 5,000, and issuance takes 3–10 working days. Some developers apply an administrative fee equal to 2% of the sale price.",
  },
  {
    icon: Building2,
    title: "4. Market the unit at a realistic price",
    body: "Off-plan resale (secondary market) pricing must reflect current market comparables, remaining payment plan, handover date, and any premium/discount vs. the current developer launch. An RERA-licensed broker like JBJ can produce a comparative pricing report and package the listing for buyers and other brokers.",
  },
  {
    icon: ScrollText,
    title: "5. Sign the MOU (Form F) with the new buyer",
    body: "Once a buyer is confirmed, both parties sign the DLD-standard Form F (MOU). The buyer typically pays a 10% deposit held by the registration trustee, and the buyer commits to assuming the remaining payment plan.",
  },
  {
    icon: CheckCircle2,
    title: "6. Transfer at the DLD Trustee Office",
    body: "The final transfer happens at a DLD-approved trustee office. The buyer pays the balance of the amount already paid to the developer, plus the DLD 4% transfer fee on the resale value, plus admin & trustee fees. The developer reissues the Oqood (interim registration) in the new buyer's name.",
  },
];

const FEES = [
  { label: "DLD transfer fee", detail: "4% of the resale value + AED 580 admin" },
  { label: "Developer NOC fee", detail: "AED 1,500 – AED 5,000 (varies by developer)" },
  { label: "Developer admin / assignment fee", detail: "Some developers charge up to 2% of the sale price" },
  { label: "Trustee office fee", detail: "AED 4,200 (for units above AED 500K)" },
  { label: "Oqood re-registration", detail: "AED 3,000 (paid at DLD)" },
  { label: "Agency commission", detail: "Typically 2% of the sale value + 5% VAT" },
];

const PITFALLS = [
  "Assuming any off-plan unit can be resold — many developers lock resale until 30–40% is paid.",
  "Pricing based on the original purchase price rather than current market comparables.",
  "Forgetting that the DLD 4% fee is calculated on the resale price paid by the new buyer, not the developer's original price.",
  "Signing an MOU before the developer NOC is issued — the transfer will not proceed without it.",
  "Not disclosing outstanding post-handover installments (buyers must formally assume them).",
];

const FAQS = [
  {
    question: "Can I sell my off-plan property in Dubai before handover?",
    answer:
      "Yes. Off-plan resale (also called 'assignment' or 'secondary off-plan sale') is legal in Dubai, but you must have paid the minimum threshold stated in your SPA — usually 30–40% of the total purchase price — and obtain a No Objection Certificate (NOC) from the developer before transferring to the new buyer at a DLD trustee office.",
  },
  {
    question: "How much of the property do I need to have paid to resell?",
    answer:
      "Most Dubai developers require between 30% and 40% of the total purchase price to be paid before allowing an assignment. The exact figure is stated in your Sale & Purchase Agreement (SPA). Premium developers such as Emaar, DAMAC, Nakheel, Sobha and Meraas each set their own minimum.",
  },
  {
    question: "What is a developer NOC and how do I get one?",
    answer:
      "A No Objection Certificate confirms the developer approves the transfer of your off-plan unit to a new buyer, and states the outstanding balance the new buyer must assume. You request it directly from the developer's transfer team; fees range from AED 1,500 to AED 5,000 and it usually takes 3–10 working days.",
  },
  {
    question: "What fees are involved in an off-plan resale?",
    answer:
      "Expect: 4% DLD transfer fee on the resale value, developer NOC fee (AED 1,500–5,000), an optional developer admin/assignment fee (up to 2% of the sale price at some developers), a DLD trustee office fee (~AED 4,200), Oqood re-registration (~AED 3,000), and 2% agency commission + 5% VAT if you use a broker.",
  },
  {
    question: "How is the DLD 4% fee calculated on an off-plan resale?",
    answer:
      "The 4% Dubai Land Department fee is calculated on the resale price paid by the new buyer, not the original developer price. It's typically split by contract — most commonly paid in full by the buyer, but this is negotiable and must be stated in the MOU (Form F).",
  },
  {
    question: "Can I make a profit selling off-plan before handover?",
    answer:
      "Yes, if the market and community have appreciated since your purchase and the payment plan remains attractive to buyers. Profit is not guaranteed — off-plan resale margins depend on developer launch pricing today, handover proximity, and the strength of comparable secondary listings.",
  },
  {
    question: "Do I need a RERA-licensed broker to sell my off-plan unit?",
    answer:
      "It's not legally mandatory, but strongly recommended. A RERA-licensed brokerage handles Form F (MOU), NOC coordination, trustee booking, and buyer qualification — reducing the risk of a failed transfer. JBJ Global Real Estate is RERA-licensed and specialises in off-plan resale advisory.",
  },
];

export default function SellingOffPlanBeforeHandover() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A]">
      <SEOHead
        title="How to Sell Off-Plan Property in Dubai Before Handover"
        description="Step-by-step guide to selling off-plan property in Dubai before handover: DLD rules, developer NOC, minimum paid thresholds, fees, and the transfer process — by JBJ Global Real Estate."
        keywords="how to sell off plan properties in dubai, sell off-plan Dubai before handover, off-plan resale Dubai, DLD NOC off-plan, assign off-plan property Dubai, off-plan secondary market Dubai"
        canonicalPath="/guides/selling-off-plan-dubai-before-handover"
        faqItems={FAQS}
        breadcrumbItems={[
          { name: "Home", path: "/" },
          { name: "Guides", path: "/guides" },
          { name: "Selling Off-Plan Before Handover", path: "/guides/selling-off-plan-dubai-before-handover" },
        ]}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#064E3B] via-[#032A1E] to-black text-white">
        <div className="absolute inset-0 opacity-20 [background:radial-gradient(60%_80%_at_15%_20%,rgba(184,149,85,0.35),transparent),radial-gradient(50%_60%_at_85%_85%,rgba(184,149,85,0.2),transparent)]" />
        <div className="relative mx-auto max-w-5xl px-6 lg:px-12 py-20 lg:py-28">
          <div className="inline-flex items-center gap-2 text-[10px] tracking-[0.42em] uppercase text-[#D4B87A]">
            <ScrollText className="w-3 h-3" /> Off-Plan Resale Guide
          </div>
          <h1 className="mt-4 font-serif text-4xl md:text-6xl leading-[1.05]">
            How to sell an off-plan property in Dubai
            <span className="italic text-[#D4B87A]"> before handover.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-white/80 text-base md:text-lg">
            The complete 2026 playbook — DLD rules, developer NOC procedure,
            minimum paid thresholds, fees, and the trustee-office transfer flow.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-[#D4B87A] text-[#0d3a2b] hover:bg-[#c9a862]">
              <Link to="/list-property">List your off-plan unit <ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
              <Link to="/contact">Speak to an advisor</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-5xl px-6 lg:px-12 py-16 lg:py-24">
        <div className="text-[11px] tracking-[0.32em] uppercase text-[#B89555]">The Process</div>
        <h2 className="mt-2 font-serif text-3xl md:text-4xl text-[#0d3a2b]">Six steps from decision to DLD transfer</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="rounded-lg border border-[#E7DFCE] bg-white p-6 shadow-[0_10px_30px_-20px_rgba(6,78,59,0.35)]"
            >
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#F7F2EA] text-[#064E3B]">
                <s.icon className="w-5 h-5" />
              </div>
              <h3 className="mt-4 font-serif text-xl text-[#0d3a2b]">{s.title}</h3>
              <p className="mt-2 text-[#1A1A1A]/75 leading-relaxed">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Fees */}
      <section className="bg-[#F7F2EA]/60 border-y border-[#E7DFCE]">
        <div className="mx-auto max-w-5xl px-6 lg:px-12 py-16 lg:py-20">
          <div className="text-[11px] tracking-[0.32em] uppercase text-[#B89555]">Cost Breakdown</div>
          <h2 className="mt-2 font-serif text-3xl md:text-4xl text-[#0d3a2b]">Fees to expect on an off-plan resale</h2>
          <div className="mt-8 overflow-hidden rounded-lg border border-[#E7DFCE] bg-white">
            <table className="w-full text-sm">
              <thead className="bg-[#0d3a2b] text-white">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Fee</th>
                  <th className="text-left px-5 py-3 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {FEES.map((f, i) => (
                  <tr key={f.label} className={i % 2 ? "bg-[#FDFBF7]" : "bg-white"}>
                    <td className="px-5 py-3 font-medium text-[#0d3a2b]">{f.label}</td>
                    <td className="px-5 py-3 text-[#1A1A1A]/80">{f.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-[#1A1A1A]/60">
            Figures indicative for 2026. Always confirm with your developer and RERA-licensed broker before signing.
          </p>
        </div>
      </section>

      {/* Pitfalls */}
      <section className="mx-auto max-w-5xl px-6 lg:px-12 py-16 lg:py-24">
        <div className="text-[11px] tracking-[0.32em] uppercase text-[#B89555]">Watch Out</div>
        <h2 className="mt-2 font-serif text-3xl md:text-4xl text-[#0d3a2b]">Common pitfalls sellers get wrong</h2>
        <ul className="mt-8 space-y-4">
          {PITFALLS.map((p) => (
            <li key={p} className="flex gap-3 rounded-lg border border-[#E7DFCE] bg-white p-4">
              <AlertTriangle className="w-5 h-5 text-[#B89555] flex-shrink-0 mt-0.5" />
              <span className="text-[#1A1A1A]/85">{p}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* FAQ */}
      <section className="bg-white border-t border-[#E7DFCE]">
        <div className="mx-auto max-w-4xl px-6 lg:px-12 py-16 lg:py-24">
          <div className="text-[11px] tracking-[0.32em] uppercase text-[#B89555] flex items-center gap-2">
            <HelpCircle className="w-3 h-3" /> Frequently Asked
          </div>
          <h2 className="mt-2 font-serif text-3xl md:text-4xl text-[#0d3a2b]">Off-plan resale FAQs</h2>
          <Accordion type="single" collapsible className="mt-8">
            {FAQS.map((f, i) => (
              <AccordionItem key={f.question} value={`item-${i}`} className="border-[#E7DFCE]">
                <AccordionTrigger className="text-left font-serif text-lg text-[#0d3a2b] hover:no-underline">
                  {f.question}
                </AccordionTrigger>
                <AccordionContent className="text-[#1A1A1A]/80 leading-relaxed">
                  {f.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-[#064E3B] via-[#032A1E] to-black text-white">
        <div className="mx-auto max-w-4xl px-6 lg:px-12 py-16 lg:py-20 text-center">
          <h2 className="font-serif text-3xl md:text-4xl">Ready to resell your off-plan unit?</h2>
          <p className="mt-3 text-white/75 max-w-2xl mx-auto">
            JBJ Global Real Estate is a RERA-licensed brokerage specialising in off-plan resale. We handle NOC coordination, pricing strategy, buyer qualification, and DLD trustee transfer end-to-end.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Button asChild size="lg" className="bg-[#D4B87A] text-[#0d3a2b] hover:bg-[#c9a862]">
              <Link to="/list-property">List your unit <ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
              <Link to="/seller-guide">Full seller guide</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
