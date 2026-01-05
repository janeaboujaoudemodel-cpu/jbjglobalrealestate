import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Calculator, TrendingUp, Calendar, Percent, DollarSign, ArrowRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const INQUIRY_FORM_URL = "https://jjglobalcapital.com/form/property-investment-inquiry-form/";

interface MortgageCalculatorProps {
  defaultPrice?: number;
  compact?: boolean;
}

const MortgageCalculator = ({ defaultPrice = 2000000, compact = false }: MortgageCalculatorProps) => {
  const [propertyPrice, setPropertyPrice] = useState(defaultPrice);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [interestRate, setInterestRate] = useState(4.5);
  const [loanTermYears, setLoanTermYears] = useState(25);

  const calculations = useMemo(() => {
    const downPayment = (propertyPrice * downPaymentPercent) / 100;
    const loanAmount = propertyPrice - downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = loanTermYears * 12;

    // Monthly payment formula: M = P[r(1+r)^n]/[(1+r)^n-1]
    let monthlyPayment = 0;
    if (monthlyRate > 0) {
      monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
                       (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    } else {
      monthlyPayment = loanAmount / numberOfPayments;
    }

    const totalPayment = monthlyPayment * numberOfPayments;
    const totalInterest = totalPayment - loanAmount;

    return {
      downPayment,
      loanAmount,
      monthlyPayment,
      totalPayment,
      totalInterest,
    };
  }, [propertyPrice, downPaymentPercent, interestRate, loanTermYears]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format number with commas for input display
  const formatNumberWithCommas = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  // Parse formatted input back to number
  const parseFormattedNumber = (value: string) => {
    const parsed = parseInt(value.replace(/,/g, ''), 10);
    return isNaN(parsed) ? 0 : parsed;
  };

  if (compact) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="grid grid-cols-3 gap-4">
          {/* Monthly Payment */}
          <div className="bg-white/80 border border-gold/30 rounded-xl p-5 text-center shadow-md">
            <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-gold" />
            </div>
            <p className="text-zinc-500 text-xs mb-1 uppercase tracking-wider">Monthly Payment</p>
            <p className="text-zinc-900 font-bold text-lg" style={{ fontFamily: "Poppins, sans-serif" }}>
              {formatCurrency(calculations.monthlyPayment)}
            </p>
          </div>
          
          {/* Loan Amount */}
          <div className="bg-white/80 border border-gold/30 rounded-xl p-5 text-center shadow-md">
            <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-gold" />
            </div>
            <p className="text-zinc-500 text-xs mb-1 uppercase tracking-wider">Loan Amount</p>
            <p className="text-zinc-900 font-bold text-lg" style={{ fontFamily: "Poppins, sans-serif" }}>
              {formatCurrency(calculations.loanAmount)}
            </p>
          </div>
          
          {/* Total Interest */}
          <div className="bg-white/80 border border-gold/30 rounded-xl p-5 text-center shadow-md">
            <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-gold" />
            </div>
            <p className="text-zinc-500 text-xs mb-1 uppercase tracking-wider">Total Interest</p>
            <p className="text-zinc-900 font-bold text-lg" style={{ fontFamily: "Poppins, sans-serif" }}>
              {formatCurrency(calculations.totalInterest)}
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/mortgage-advisory">
            <Button className="bg-gradient-to-r from-zinc-900 to-black border border-gold/40 text-gold font-semibold px-8 py-5 text-base shadow-lg shadow-black/20 transition-all duration-300 hover:shadow-xl hover:shadow-gold/20 hover:scale-[1.02] hover:border-gold/60">
              Get Mortgage Advisory
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <p className="text-zinc-500 text-xs mt-3">
            *Estimates based on AED 2M property, 20% down, 4.5% rate, 25 years
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-900/30 via-zinc-900/95 to-purple-950/30 border border-purple-500/30 rounded-2xl overflow-hidden">
      {/* Header - Purple Premium Style */}
      <div className="bg-gradient-to-r from-purple-600/20 via-purple-500/15 to-purple-600/20 border-b border-purple-500/30 p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-purple-600/20 border border-purple-400/30 flex items-center justify-center">
            <Calculator className="w-6 h-6 text-purple-300" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white" style={{ fontFamily: "Poppins, sans-serif" }}>
              Mortgage Calculator
            </h3>
            <p className="text-purple-200/70 text-sm">Estimate your monthly payments</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            {/* Property Price */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-zinc-300 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gold" />
                  Property Price
                </Label>
                <span className="text-gold font-semibold">{formatCurrency(propertyPrice)}</span>
              </div>
              <Input
                type="text"
                value={formatNumberWithCommas(propertyPrice)}
                onChange={(e) => setPropertyPrice(parseFormattedNumber(e.target.value))}
                className="bg-zinc-900/50 border-zinc-700 text-white focus:border-gold"
              />
              <Slider
                value={[propertyPrice]}
                onValueChange={([value]) => setPropertyPrice(value)}
                min={500000}
                max={50000000}
                step={100000}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-zinc-500">
                <span>AED 500K</span>
                <span>AED 50M</span>
              </div>
            </div>

            {/* Down Payment */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-zinc-300 flex items-center gap-2">
                  <Percent className="w-4 h-4 text-gold" />
                  Down Payment
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-3.5 h-3.5 text-zinc-500" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-zinc-900 border-zinc-700 text-zinc-300">
                        <p>UAE typically requires 20-25% for residents</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <span className="text-gold font-semibold">{downPaymentPercent}%</span>
              </div>
              <Slider
                value={[downPaymentPercent]}
                onValueChange={([value]) => setDownPaymentPercent(value)}
                min={5}
                max={80}
                step={5}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-zinc-500">
                <span>5%</span>
                <span>{formatCurrency(calculations.downPayment)}</span>
                <span>80%</span>
              </div>
            </div>

            {/* Interest Rate */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-zinc-300 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-gold" />
                  Interest Rate (Annual)
                </Label>
                <span className="text-gold font-semibold">{interestRate}%</span>
              </div>
              <Slider
                value={[interestRate]}
                onValueChange={([value]) => setInterestRate(value)}
                min={2}
                max={10}
                step={0.25}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-zinc-500">
                <span>2%</span>
                <span>10%</span>
              </div>
            </div>

            {/* Loan Term */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-zinc-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gold" />
                  Loan Term
                </Label>
                <span className="text-gold font-semibold">{loanTermYears} Years</span>
              </div>
              <Slider
                value={[loanTermYears]}
                onValueChange={([value]) => setLoanTermYears(value)}
                min={5}
                max={30}
                step={5}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-zinc-500">
                <span>5 Years</span>
                <span>30 Years</span>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {/* Monthly Payment - Featured Purple Style */}
            <div className="bg-gradient-to-br from-purple-500/20 via-purple-600/10 to-transparent border border-purple-400/30 rounded-xl p-6 text-center">
              <p className="text-purple-200/70 text-sm mb-2">Estimated Monthly Payment</p>
              <p 
                className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-white to-purple-300"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                {formatCurrency(calculations.monthlyPayment)}
              </p>
              <p className="text-purple-300/50 text-xs mt-2">per month for {loanTermYears} years</p>
            </div>

            {/* Breakdown Cards - Purple style */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-purple-900/20 border border-purple-500/20 rounded-xl p-4">
                <p className="text-purple-300/60 text-xs mb-1">Loan Amount</p>
                <p className="text-white font-bold text-lg">{formatCurrency(calculations.loanAmount)}</p>
              </div>
              <div className="bg-purple-900/20 border border-purple-500/20 rounded-xl p-4">
                <p className="text-purple-300/60 text-xs mb-1">Down Payment</p>
                <p className="text-white font-bold text-lg">{formatCurrency(calculations.downPayment)}</p>
              </div>
              <div className="bg-purple-900/20 border border-purple-500/20 rounded-xl p-4">
                <p className="text-purple-300/60 text-xs mb-1">Total Interest</p>
                <p className="text-purple-300 font-bold text-lg">{formatCurrency(calculations.totalInterest)}</p>
              </div>
              <div className="bg-purple-900/20 border border-purple-500/20 rounded-xl p-4">
                <p className="text-purple-300/60 text-xs mb-1">Total Payment</p>
                <p className="text-white font-bold text-lg">{formatCurrency(calculations.totalPayment)}</p>
              </div>
            </div>

            {/* Payment Visualization - Purple theme */}
            <div className="space-y-2">
              <p className="text-purple-200/70 text-sm">Payment Breakdown</p>
              <div className="h-4 rounded-full overflow-hidden bg-zinc-800/50 flex">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-500"
                  style={{ width: `${(calculations.loanAmount / calculations.totalPayment) * 100}%` }}
                />
                <div 
                  className="bg-gradient-to-r from-gold to-gold-light transition-all duration-500"
                  style={{ width: `${(calculations.totalInterest / calculations.totalPayment) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  <span className="text-zinc-400">Principal</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-gold" />
                  <span className="text-zinc-400">Interest</span>
                </span>
              </div>
            </div>

            {/* CTA - Purple gradient */}
            <a href={INQUIRY_FORM_URL} target="_blank" rel="noopener noreferrer" className="block">
              <Button className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white h-12 text-base font-semibold group border border-purple-400/30">
                Get Professional Mortgage Advisory
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </a>

            <p className="text-zinc-500 text-xs text-center">
              *Estimates are for illustrative purposes only. Actual rates may vary based on bank policies and eligibility.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MortgageCalculator;