import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Scale } from "lucide-react";

interface Props {
  propertyPrice: number;
  loanAmount: number;
  monthlyPayment: number;
  downPaymentPercent: number;
  interestRate: number;
  loanTermYears: number;
  isNavy?: boolean;
}

type Residency = "uae_national" | "expat" | "non_resident";

const RESIDENCY: Record<Residency, { label: string; maxLtv: number }> = {
  uae_national: { label: "UAE National", maxLtv: 85 },
  expat: { label: "Expat Resident", maxLtv: 80 },
  non_resident: { label: "Non-Resident", maxLtv: 50 },
};

const aed = (v: number) =>
  new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED", maximumFractionDigits: 0 }).format(v || 0);

export default function MortgageParityPanel({
  propertyPrice,
  loanAmount,
  monthlyPayment,
  downPaymentPercent,
  interestRate,
  loanTermYears,
  isNavy = false,
}: Props) {
  const [residency, setResidency] = useState<Residency>("expat");
  const [monthlyIncome, setMonthlyIncome] = useState<number>(40000);
  const [showSchedule, setShowSchedule] = useState(false);
  const [compareRate, setCompareRate] = useState<number>(Math.max(2, interestRate - 0.5));

  const cap = RESIDENCY[residency].maxLtv;
  const ltv = 100 - downPaymentPercent;
  const ltvOk = ltv <= cap;

  const fees = useMemo(() => {
    const dld = propertyPrice * 0.04;
    const agency = propertyPrice * 0.02;
    const mortgageReg = loanAmount * 0.0025 + 290;
    const valuation = 3000;
    const bankArrangement = loanAmount * 0.01;
    const noc = 1500;
    const trustee = 4000;
    const total = dld + agency + mortgageReg + valuation + bankArrangement + noc + trustee;
    return { dld, agency, mortgageReg, valuation, bankArrangement, noc, trustee, total };
  }, [propertyPrice, loanAmount]);

  const dbrCap = monthlyIncome * 0.5;
  const dbrPct = monthlyIncome > 0 ? (monthlyPayment / monthlyIncome) * 100 : 0;
  const dbrOk = monthlyPayment <= dbrCap;

  // Comparison
  const compareMonthly = useMemo(() => {
    const r = compareRate / 100 / 12;
    const n = loanTermYears * 12;
    if (r <= 0) return loanAmount / n;
    return (loanAmount * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
  }, [compareRate, loanAmount, loanTermYears]);

  // Amortization (yearly summary)
  const schedule = useMemo(() => {
    const r = interestRate / 100 / 12;
    const n = loanTermYears * 12;
    let balance = loanAmount;
    const rows: { year: number; principal: number; interest: number; balance: number }[] = [];
    for (let y = 1; y <= loanTermYears; y++) {
      let yp = 0;
      let yi = 0;
      for (let m = 0; m < 12; m++) {
        const interest = balance * r;
        const principal = monthlyPayment - interest;
        balance = Math.max(0, balance - principal);
        yp += principal;
        yi += interest;
      }
      rows.push({ year: y, principal: yp, interest: yi, balance });
    }
    return rows;
  }, [interestRate, loanTermYears, loanAmount, monthlyPayment]);

  const cardBg = isNavy
    ? "linear-gradient(135deg, #0B2244 0%, #08152B 55%, #000 100%)"
    : "#F7F2EA";
  const cardBorder = isNavy ? "1px solid rgba(96,165,250,0.30)" : "1px solid rgba(184,149,85,0.30)";
  const inkClass = isNavy ? "text-white" : "text-[#1A1A1A]";
  const subClass = isNavy ? "text-white/70" : "text-[#1A1A1A]/70";

  const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="rounded-xl p-4 md:p-5" style={{ background: cardBg, border: cardBorder }}>
      <p className={`text-[11px] uppercase tracking-[0.16em] font-semibold mb-3 ${subClass}`}>{title}</p>
      {children}
    </div>
  );

  return (
    <div className="mt-6 md:mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
      {/* Residency + LTV */}
      <Card title="Residency & LTV Cap">
        <div className="flex flex-wrap gap-2 mb-3">
          {(Object.keys(RESIDENCY) as Residency[]).map((k) => {
            const active = residency === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setResidency(k)}
                data-no-contrast-guard
                className={`allow-white px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${active ? "" : "opacity-70 hover:opacity-100"}`}
                style={{
                  background: active
                    ? (isNavy ? "rgba(96,165,250,0.22)" : "#EFE6D6")
                    : "transparent",
                  border: active
                    ? (isNavy ? "1px solid rgba(147,197,253,0.55)" : "1px solid #B89555")
                    : (isNavy ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(184,149,85,0.35)"),
                  color: isNavy ? "#FFFFFF" : "#1A1A1A",
                }}
              >
                {RESIDENCY[k].label}
              </button>
            );
          })}
        </div>
        <div className={`flex items-center justify-between text-sm ${inkClass}`}>
          <span className={subClass}>Max LTV</span>
          <span className="font-bold tabular-nums">{cap}%</span>
        </div>
        <div className={`flex items-center justify-between text-sm mt-1 ${inkClass}`}>
          <span className={subClass}>Your LTV</span>
          <span className="font-bold tabular-nums">{ltv}%</span>
        </div>
        <div
          className="mt-3 flex items-start gap-2 rounded-lg p-2.5 text-xs"
          style={{
            background: ltvOk ? "rgba(16,185,129,0.10)" : "rgba(239,68,68,0.10)",
            border: `1px solid ${ltvOk ? "rgba(16,185,129,0.35)" : "rgba(239,68,68,0.45)"}`,
            color: isNavy ? "#FFFFFF" : "#1A1A1A",
          }}
        >
          {ltvOk ? <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 mt-0.5 text-red-500" />}
          <span>{ltvOk ? "Loan-to-value within UAE Central Bank limit." : `Exceeds ${cap}% cap — increase down payment by AED ${Math.ceil(((ltv - cap) / 100) * propertyPrice).toLocaleString()}.`}</span>
        </div>
      </Card>

      {/* Affordability */}
      <Card title="Affordability (DBR 50%)">
        <label className={`text-xs font-semibold ${subClass}`}>Your monthly income (AED)</label>
        <input
          type="number"
          value={monthlyIncome}
          onChange={(e) => setMonthlyIncome(Number(e.target.value) || 0)}
          data-no-contrast-guard
          className="allow-white mt-1 w-full rounded-lg px-3 py-2 text-sm font-semibold tabular-nums"
          style={{
            background: isNavy ? "rgba(255,255,255,0.06)" : "#FFFFFF",
            border: isNavy ? "1px solid rgba(147,197,253,0.35)" : "1px solid rgba(184,149,85,0.40)",
            color: isNavy ? "#FFFFFF" : "#1A1A1A",
          }}
        />
        <div className={`mt-3 text-sm ${inkClass}`}>
          <div className="flex justify-between"><span className={subClass}>Monthly installment</span><span className="font-bold tabular-nums">{aed(monthlyPayment)}</span></div>
          <div className="flex justify-between mt-1"><span className={subClass}>50% DBR cap</span><span className="font-bold tabular-nums">{aed(dbrCap)}</span></div>
          <div className="flex justify-between mt-1"><span className={subClass}>DBR ratio</span><span className="font-bold tabular-nums">{dbrPct.toFixed(1)}%</span></div>
        </div>
        <div
          className="mt-3 flex items-start gap-2 rounded-lg p-2.5 text-xs"
          style={{
            background: dbrOk ? "rgba(16,185,129,0.10)" : "rgba(239,68,68,0.10)",
            border: `1px solid ${dbrOk ? "rgba(16,185,129,0.35)" : "rgba(239,68,68,0.45)"}`,
            color: isNavy ? "#FFFFFF" : "#1A1A1A",
          }}
        >
          {dbrOk ? <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 mt-0.5 text-red-500" />}
          <span>{dbrOk ? "Within the UAE Central Bank 50% debt burden ratio." : "Above 50% DBR — banks may decline. Extend term or reduce loan."}</span>
        </div>
      </Card>

      {/* Fees breakdown */}
      <Card title="One-time Fees & Closing Costs">
        <div className={`space-y-1.5 text-sm ${inkClass}`}>
          {[
            ["DLD Transfer (4%)", fees.dld],
            ["Agency Fee (2%)", fees.agency],
            ["Mortgage Registration (0.25% + 290)", fees.mortgageReg],
            ["Bank Arrangement (1%)", fees.bankArrangement],
            ["Property Valuation", fees.valuation],
            ["Trustee Office", fees.trustee],
            ["NOC", fees.noc],
          ].map(([label, val]) => (
            <div key={label as string} className="flex justify-between">
              <span className={subClass}>{label as string}</span>
              <span className="font-semibold tabular-nums">{aed(val as number)}</span>
            </div>
          ))}
          <div
            className="flex justify-between pt-2 mt-2 font-bold"
            style={{ borderTop: isNavy ? "1px solid rgba(147,197,253,0.30)" : "1px solid rgba(184,149,85,0.35)" }}
          >
            <span>Total upfront (incl. down payment)</span>
            <span className="tabular-nums" style={{ color: "var(--price-orange, #E97A2C)" }}>{aed(fees.total + (propertyPrice * downPaymentPercent) / 100)}</span>
          </div>
        </div>
      </Card>

      {/* Comparison */}
      <Card title="Compare Two Bank Rates">
        <div className={`grid grid-cols-2 gap-3 text-sm ${inkClass}`}>
          <div>
            <p className={`text-xs ${subClass}`}>Bank A — {interestRate}%</p>
            <p className="font-bold text-lg tabular-nums mt-1">{aed(monthlyPayment)}</p>
            <p className={`text-[11px] ${subClass}`}>per month</p>
          </div>
          <div>
            <p className={`text-xs ${subClass}`}>Bank B — {compareRate.toFixed(2)}%</p>
            <p className="font-bold text-lg tabular-nums mt-1">{aed(compareMonthly)}</p>
            <p className={`text-[11px] ${subClass}`}>per month</p>
          </div>
        </div>
        <input
          type="range"
          min={2}
          max={10}
          step={0.05}
          value={compareRate}
          onChange={(e) => setCompareRate(Number(e.target.value))}
          data-no-contrast-guard
          className="allow-white mortgage-range-input w-full mt-3"
          aria-label="Compare rate"
        />
        <div className="mt-2 flex items-center gap-2 text-xs" style={{ color: isNavy ? "#FFFFFF" : "#1A1A1A" }}>
          <Scale className="w-3.5 h-3.5" />
          <span>Monthly difference: <span className="font-bold tabular-nums">{aed(Math.abs(monthlyPayment - compareMonthly))}</span> ({(monthlyPayment > compareMonthly ? "save" : "extra")} on Bank B)</span>
        </div>
      </Card>

      {/* Amortization */}
      <div className="lg:col-span-2">
        <button
          type="button"
          onClick={() => setShowSchedule((s) => !s)}
          data-no-contrast-guard
          className="allow-white w-full rounded-xl px-4 py-3 flex items-center justify-between text-sm font-semibold"
          style={{ background: cardBg, border: cardBorder, color: isNavy ? "#FFFFFF" : "#1A1A1A" }}
        >
          <span>Amortization Schedule (yearly)</span>
          {showSchedule ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showSchedule && (
          <div className="mt-3 rounded-xl overflow-hidden" style={{ background: cardBg, border: cardBorder }}>
            <div className="overflow-x-auto">
              <table className={`w-full text-sm ${inkClass}`}>
                <thead>
                  <tr className={`text-xs uppercase tracking-wider ${subClass}`} style={{ borderBottom: isNavy ? "1px solid rgba(147,197,253,0.30)" : "1px solid rgba(184,149,85,0.30)" }}>
                    <th className="text-left px-4 py-2.5 font-semibold">Year</th>
                    <th className="text-right px-4 py-2.5 font-semibold">Principal</th>
                    <th className="text-right px-4 py-2.5 font-semibold">Interest</th>
                    <th className="text-right px-4 py-2.5 font-semibold">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((r) => (
                    <tr key={r.year} style={{ borderTop: isNavy ? "1px solid rgba(147,197,253,0.10)" : "1px solid rgba(184,149,85,0.12)" }}>
                      <td className="px-4 py-2 font-semibold">{r.year}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{aed(r.principal)}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{aed(r.interest)}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{aed(r.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
