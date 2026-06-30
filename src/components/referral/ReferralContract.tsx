import { format } from "date-fns";
import jbjFullLogoLight from "@/assets/jbj-fulllogo-light.png";

interface ReferralContractProps {
  partnerName: string;
  partnerEmail: string;
  partnerPhone?: string;
  partnerNationality?: string;
  passportNumber?: string;
  commissionRate: number;
  contractDate: Date;
  signatureDataUrl?: string | null;
}

export default function ReferralContract({
  partnerName,
  partnerEmail,
  partnerPhone,
  partnerNationality,
  passportNumber,
  commissionRate = 5,
  contractDate,
  signatureDataUrl
}: ReferralContractProps) {
  return (
    <div className="bg-[#FDFBF7] text-[#1A1A1A] p-8 max-w-3xl mx-auto font-serif" id="referral-contract">
      {/* Header - Large logo only, no duplicate company name */}
      <div className="text-center border-b-2 border-[#B89555] pb-6 mb-8">
        <img src={jbjFullLogoLight} alt="JBJ Global Real Estate" className="h-28 mx-auto mb-4"  loading="lazy" decoding="async" />
        <p className="text-sm text-[#1A1A1A]/70 mt-1">Real Estate Brokerage</p>
        <p className="text-xs text-[#1A1A1A]/70 mt-2">Dubai, United Arab Emirates</p>
      </div>

      {/* Title */}
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold uppercase tracking-widest">Referral Partner Agreement</h2>
        <p className="text-sm text-[#1A1A1A]/70 mt-2">
          Agreement Date: {format(contractDate, "MMMM d, yyyy")}
        </p>
        <p className="text-sm text-[#1A1A1A]/70">
          Reference No: JJ-REF-{format(contractDate, "yyyyMMdd")}-{Math.random().toString(36).substring(2, 8).toUpperCase()}
        </p>
      </div>

      {/* Parties */}
      <section className="mb-6">
        <h3 className="font-bold text-sm uppercase tracking-wide border-b border-[#B89555]/30 pb-2 mb-4">
          Parties to This Agreement
        </h3>
        <div className="grid grid-cols-2 gap-8 text-sm">
          <div>
            <p className="font-semibold mb-2">The Company:</p>
            <p>JBJ Global Real Estate L.L.C.</p>
            <p>Dubai, United Arab Emirates</p>
            <p>Email: Contact@JBJ.ae</p>
          </div>
          <div>
            <p className="font-semibold mb-2">The Referral Partner:</p>
            <p>{partnerName}</p>
            {partnerNationality && <p>Nationality: {partnerNationality}</p>}
            {passportNumber && <p>Passport: {passportNumber}</p>}
            <p>Email: {partnerEmail}</p>
            {partnerPhone && <p>Phone: {partnerPhone}</p>}
          </div>
        </div>
      </section>

      {/* Terms */}
      <section className="mb-6">
        <h3 className="font-bold text-sm uppercase tracking-wide border-b border-[#B89555]/30 pb-2 mb-4">
          Terms and Conditions
        </h3>
        
        <div className="space-y-4 text-sm leading-relaxed">
          <div>
            <p className="font-semibold">1. Purpose</p>
            <p className="pl-4">
              This Agreement establishes the terms under which the Referral Partner may refer potential 
              property buyers to JBJ Global Real Estate ("the Company") in exchange for 
              referral commissions.
            </p>
          </div>

          <div>
            <p className="font-semibold">2. Referral Commission</p>
            <p className="pl-4">
              The Referral Partner shall receive <strong>{commissionRate}% (five percent)</strong> of the 
              commission received by the Company from the developer upon successful completion of a 
              property transaction originating from a valid referral.
            </p>
          </div>

          <div>
            <p className="font-semibold">3. Valid Referral Definition</p>
            <p className="pl-4">
              A valid referral is defined as a client who: (a) was introduced by the Referral Partner 
              using their unique referral code; (b) was not previously registered with the Company; 
              (c) successfully completes a property purchase through the Company within 12 months of 
              the initial referral date.
            </p>
          </div>

          <div>
            <p className="font-semibold">4. Payment Terms</p>
            <p className="pl-4">
              Referral commissions shall be paid within 30 business days of the Company receiving 
              the developer's commission payment. Payments will be made via bank transfer to the 
              account details provided by the Referral Partner.
            </p>
          </div>

          <div>
            <p className="font-semibold">5. Referral Partner Obligations</p>
            <p className="pl-4">
              The Referral Partner agrees to: (a) provide accurate information about referred clients; 
              (b) not make false or misleading claims about properties or the Company; (c) comply with 
              all applicable laws and regulations in their jurisdiction; (d) maintain confidentiality 
              of client information.
            </p>
          </div>

          <div>
            <p className="font-semibold">6. Independent Contractor Status</p>
            <p className="pl-4">
              The Referral Partner is an independent contractor and not an employee, agent, or 
              representative of the Company. The Referral Partner is solely responsible for any 
              tax obligations arising from referral commissions received.
            </p>
          </div>

          <div>
            <p className="font-semibold">7. Termination</p>
            <p className="pl-4">
              Either party may terminate this Agreement with 30 days written notice. Upon termination, 
              the Referral Partner remains entitled to commissions for referrals made prior to termination, 
              subject to the 12-month validity period.
            </p>
          </div>

          <div>
            <p className="font-semibold">8. Governing Law</p>
            <p className="pl-4">
              This Agreement shall be governed by and construed in accordance with the laws of the 
              United Arab Emirates. Any disputes shall be resolved through arbitration in Dubai.
            </p>
          </div>
        </div>
      </section>

      {/* Acknowledgment */}
      <section className="mb-8 p-4 bg-[#F7F2EA] border border-[#B89555]/30 rounded-lg">
        <p className="text-sm">
          By signing below, the Referral Partner acknowledges that they have read, understood, and 
          agree to be bound by all terms and conditions of this Agreement. The Referral Partner 
          confirms that the information provided is accurate and that the signature matches their 
          official identification document.
        </p>
      </section>

      {/* Signatures */}
      <section className="grid grid-cols-2 gap-8 pt-8 border-t border-[#B89555]/30">
        <div>
          <p className="font-semibold text-sm mb-4">For JBJ Global Real Estate:</p>
          <div className="h-20 border-b border-[#B89555]/30 mb-2 flex items-end justify-center pb-2">
            <span className="text-[#1A1A1A]/70 italic text-sm">Authorized Signatory</span>
          </div>
          <p className="text-sm">Name: ________________________</p>
          <p className="text-sm mt-2">Date: {format(contractDate, "dd/MM/yyyy")}</p>
        </div>
        <div>
          <p className="font-semibold text-sm mb-4">Referral Partner:</p>
          <div className="h-20 border-b border-[#B89555]/30 mb-2 flex items-end justify-center pb-2">
            {signatureDataUrl ? (
              <img src={signatureDataUrl} alt="Signature" className="h-16 max-w-full object-contain"  loading="lazy" decoding="async" />
            ) : (
              <span className="text-[#1A1A1A]/70 italic text-sm">Sign here</span>
            )}
          </div>
          <p className="text-sm">Name: {partnerName}</p>
          <p className="text-sm mt-2">Date: {format(contractDate, "dd/MM/yyyy")}</p>
        </div>
      </section>

      {/* Footer */}
      <div className="mt-12 pt-4 border-t border-[#B89555]/30 text-center text-xs text-[#1A1A1A]/70">
        <p>JBJ Global Real Estate L.L.C. | Dubai, United Arab Emirates</p>
        <p>www.JBJ.ae | Contact@JBJ.ae</p>
        <p className="mt-2">This document is electronically generated and valid without physical stamp.</p>
      </div>
    </div>
  );
}
