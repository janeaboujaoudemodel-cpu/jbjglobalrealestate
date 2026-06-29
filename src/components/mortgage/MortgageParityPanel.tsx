import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Scale, Building2 } from "lucide-react";

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

// UAE bank mortgage rate presets (indicative starting rates, 2026).
// Update centrally as market shifts.
const UAE_BANKS: { id: string; name: string; rate: number }[] = [
  { id: "enbd", name: "Emirates NBD", rate: 4.19 },
  { id: "adcb", name: "ADCB", rate: 4.24 },
  { id: "fab", name: "First Abu Dhabi Bank (FAB)", rate: 4.15 },
  { id: "dib", name: "Dubai Islamic Bank", rate: 4.35 },
  { id: "mashreq", name: "Mashreq Bank", rate: 4.29 },
  { id: "adib", name: "Abu Dhabi Islamic Bank", rate: 4.39 },
  { id: "hsbc", name: "HSBC UAE", rate: 4.49 },
  { id: "scb", name: "Standard Chartered", rate: 4.55 },
  { id: "cbd", name: "Commercial Bank of Dubai", rate: 4.34 },
  { id: "rakbank", name: "RAKBANK", rate: 4.45 },
  { id: "ajman", name: "Ajman Bank", rate: 4.49 },
  { id: "uab", name: "United Arab Bank", rate: 4.59 },
];

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

  // Bank A = pick a bank to benchmark against your current rate. Defaults to ENBD.
  // Bank B = pick a second bank to compare. Slider still lets you fine-tune Bank B's rate.
  const [bankAId, setBankAId] = useState<string>("enbd");
  const [bankBId, setBankBId] = useState<string>("fab");
  const bankA = UAE_BANKS.find((b) => b.id === bankAId) ?? UAE_BANKS[0];
  const bankB = UAE_BANKS.find((b) => b.id === bankBId) ?? UAE_BANKS[1];
  const [compareRate, setCompareRate] = useState<number>(bankB.rate);
  // When the user picks a different Bank B, snap the slider to that bank's rate.
  useEffect(() => {
    setCompareRate(bankB.rate);
  }, [bankBId]);


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

  // Comparison — each bank's monthly is computed from its own rate so swapping
  // banks updates both columns independently of the page-level interestRate.
  const monthlyFor = (ratePct: number) => {
    const r = ratePct / 100 / 12;
    const n = loanTermYears * 12;
    if (r <= 0) return loanAmount / n;
    return (loanAmount * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
  };
  const bankAMonthly = useMemo(() => monthlyFor(bankA.rate), [bankA.rate, loanAmount, loanTermYears]);
  const compareMonthly = useMemo(() => monthlyFor(compareRate), [compareRate, loanAmount, loanTermYears]);


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

  const compareMinRate = 2;
  const compareMaxRate = 10;
  const cardBg = isNavy
    ? "linear-gradient(135deg, #064E3B 0%, #042c1c 58%, #000000 100%)"
    : "#F7F2EA";
  const cardBorder = isNavy ? "1px solid rgba(52,211,153,0.48)" : "1px solid rgba(184,149,85,0.30)";
  const inkClass = isNavy ? "text-white" : "text-[#1A1A1A]";
  const subClass = isNavy ? "text-white/70" : "text-[#1A1A1A]/70";

  const Card = ({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) => (
    <div className={`mortgage-parity-card rounded-xl p-4 md:p-5 ${className}`} style={{ background: cardBg, border: cardBorder }}>
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
                className={`jj-residency-chip px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all shadow-sm ${active ? "jj-residency-chip-active" : ""}`}
                data-residency-active={active ? "true" : "false"}
                style={{
                  background: active
                    ? "linear-gradient(135deg, #064E3B 0%, #042C1C 58%, #000000 100%)"
                    : (isNavy ? "rgba(255,255,255,0.08)" : "#FDFBF7"),
                  border: active
                    ? "1px solid rgba(4,44,28,0.75)"
                    : (isNavy ? "1px solid rgba(255,255,255,0.35)" : "1px solid rgba(184,149,85,0.55)"),
                  color: active ? "#FFFFFF" : (isNavy ? "#FFFFFF" : "#1A1A1A"),
                  WebkitTextFillColor: active ? "#FFFFFF" : (isNavy ? "#FFFFFF" : "#1A1A1A"),
                  opacity: 1,
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
            background: ltvOk ? "rgba(6,78,59,0.08)" : "rgba(239,68,68,0.10)",
            border: `1px solid ${ltvOk ? "rgba(6,78,59,0.35)" : "rgba(239,68,68,0.45)"}`,
            color: isNavy ? "#FFFFFF" : "#1A1A1A",
          }}
        >
          {ltvOk ? <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#064E3B]" /> : <AlertTriangle className="w-4 h-4 mt-0.5 text-red-500" />}
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
            background: dbrOk ? "rgba(6,78,59,0.08)" : "rgba(239,68,68,0.10)",
            border: `1px solid ${dbrOk ? "rgba(6,78,59,0.35)" : "rgba(239,68,68,0.45)"}`,
            color: isNavy ? "#FFFFFF" : "#1A1A1A",
          }}
        >
          {dbrOk ? <CheckCircle2 className="w-4 h-4 mt-0.5 text-[#064E3B]" /> : <AlertTriangle className="w-4 h-4 mt-0.5 text-red-500" />}
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
      <Card title="Compare to Bank Rates" className="mortgage-compare-card">
        {/* Bank pickers — explicit dropdowns of UAE banks with starting rates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {([
            { label: "Bank A", value: bankAId, set: setBankAId, exclude: bankBId },
            { label: "Bank B", value: bankBId, set: setBankBId, exclude: bankAId },
          ] as const).map((picker) => (
            <label key={picker.label} className="block">
              <span className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${subClass}`}>
                <Building2 className="w-3.5 h-3.5" />
                {picker.label}
              </span>
              <div
                className="relative rounded-lg"
                style={{
                  background: isNavy ? "rgba(255,255,255,0.06)" : "#FFFFFF",
                  border: isNavy ? "1px solid rgba(147,197,253,0.35)" : "1px solid rgba(184,149,85,0.40)",
                }}
              >
                <select
                  value={picker.value}
                  onChange={(e) => picker.set(e.target.value)}
                  data-no-contrast-guard
                  aria-label={`${picker.label} — choose UAE bank`}
                  className={`${isNavy ? "allow-white " : ""}w-full appearance-none bg-transparent rounded-lg px-3 py-2.5 pr-9 text-sm font-semibold cursor-pointer outline-none`}
                  style={{
                    color: isNavy ? "#FFFFFF" : "#1A1A1A",
                    WebkitTextFillColor: isNavy ? "#FFFFFF" : "#1A1A1A",
                  }}
                >
                  {UAE_BANKS.map((b) => (
                    <option
                      key={b.id}
                      value={b.id}
                      disabled={b.id === picker.exclude}
                      style={{ color: "#1A1A1A", background: "#FFFFFF" }}
                    >
                      {b.name} — {b.rate.toFixed(2)}%
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: isNavy ? "#FFFFFF" : "#064E3B" }}
                />
              </div>
            </label>
          ))}
        </div>

        <div className={`grid grid-cols-2 gap-3 text-sm ${inkClass}`}>
          <div>
            <p className={`text-xs ${subClass}`}>{bankA.name} — {bankA.rate.toFixed(2)}%</p>
            <p className="font-bold text-lg tabular-nums mt-1">{aed(bankAMonthly)}</p>
            <p className={`text-[11px] ${subClass}`}>per month</p>
          </div>
          <div>
            <p className={`text-xs ${subClass}`}>{bankB.name} — {compareRate.toFixed(2)}%</p>
            <p className="font-bold text-lg tabular-nums mt-1">{aed(compareMonthly)}</p>
            <p className={`text-[11px] ${subClass}`}>per month</p>
          </div>
        </div>

        <div className="mt-4">
          <div className={`flex items-center justify-between text-[11px] mb-1.5 ${subClass}`}>
            <span className="font-semibold uppercase tracking-wider">Fine-tune {bankB.name} rate</span>
            <span className="font-bold tabular-nums" style={{ color: isNavy ? "#FFFFFF" : "#064E3B" }}>{compareRate.toFixed(2)}%</span>
          </div>
          {(() => {
            const minR = compareMinRate;
            const maxR = compareMaxRate;
            const progress = Math.min(100, Math.max(0, ((compareRate - minR) / (maxR - minR)) * 100));
            const fill = "linear-gradient(90deg, #064E3B 0%, #042C1C 58%, #000000 100%)";
            const track = isNavy ? "rgba(255,255,255,0.12)" : "#EFE6D6";
            return (
              <input
                type="range"
                data-mortgage-slider="Compare rate"
                data-no-contrast-guard
                min={minR}
                max={maxR}
                step={0.05}
                value={compareRate}
                aria-label="Compare rate"
                onInput={(e) => setCompareRate(Number((e.target as HTMLInputElement).value))}
                onChange={(e) => setCompareRate(Number(e.target.value))}
                className="mortgage-range-input w-full"
                style={{
                  ["--mortgage-range-progress" as any]: `${progress}%`,
                  ["--mortgage-range-fill" as any]: fill,
                  ["--mortgage-range-track" as any]: track,
                  boxShadow: isNavy ? 'inset 0 0 0 1px rgba(255,255,255,0.08)' : 'inset 0 0 0 1px rgba(6,78,59,0.14)',
                  ["--mortgage-range-thumb" as any]: "#FFFFFF",
                  ["--mortgage-range-thumb-shadow" as any]:
                    "0 0 0 1px rgba(255,255,255,0.72), 0 0 18px rgba(6,78,59,0.65), 0 4px 14px rgba(4,44,28,0.45)",
                }}
              />
            );
          })()}
          <div className={`flex justify-between text-[10px] mt-1 ${subClass}`}>
            <span>{compareMinRate.toFixed(1)}%</span>
            <span>{compareMaxRate.toFixed(1)}%</span>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: isNavy ? "#FFFFFF" : "#1A1A1A" }}>
          <Scale className="w-3.5 h-3.5" />
          <span>
            Monthly difference: <span className="font-bold tabular-nums">{aed(Math.abs(bankAMonthly - compareMonthly))}</span>
            {" "}({bankAMonthly > compareMonthly ? "save" : "extra"} on {bankB.name})
          </span>
        </div>
      </Card>


      {/* Amortization */}
      <div className="lg:col-span-2">
        <button
          type="button"
          onClick={() => setShowSchedule((s) => !s)}
          data-no-contrast-guard
          className={`${isNavy ? "allow-white " : ""}w-full rounded-xl px-4 py-3 flex items-center justify-between text-sm font-semibold`}
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
