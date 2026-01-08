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

const INQUIRY_FORM_URL = "https://jbj.ae/contact";

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
      <div className="max-w-2xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Monthly Payment */}
          <div className="bg-white/80 border border-gold/30 rounded-xl p-4 sm:p-5 text-center shadow-md">
            <div className="w-9 h-9 sm:w-10 sm:h-10 mx-auto mb-2 sm:mb-3 rounded-lg bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center">
              <Calculator className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
            </div>
            <p className="text-zinc-500 text-[10px] sm:text-xs mb-1 uppercase tracking-wider">Monthly Payment</p>
            <p className="text-zinc-900 font-bold text-sm sm:text-base md:text-lg truncate" style={{ fontFamily: "Poppins, sans-serif" }}>
              {formatCurrency(calculations.monthlyPayment)}
            </p>
          </div>
          
          {/* Loan Amount */}
          <div className="bg-white/80 border border-gold/30 rounded-xl p-4 sm:p-5 text-center shadow-md">
            <div className="w-9 h-9 sm:w-10 sm:h-10 mx-auto mb-2 sm:mb-3 rounded-lg bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
            </div>
            <p className="text-zinc-500 text-[10px] sm:text-xs mb-1 uppercase tracking-wider">Loan Amount</p>
            <p className="text-zinc-900 font-bold text-sm sm:text-base md:text-lg truncate" style={{ fontFamily: "Poppins, sans-serif" }}>
              {formatCurrency(calculations.loanAmount)}
            </p>
          </div>
          
          {/* Total Interest */}
          <div className="bg-white/80 border border-gold/30 rounded-xl p-4 sm:p-5 text-center shadow-md">
            <div className="w-9 h-9 sm:w-10 sm:h-10 mx-auto mb-2 sm:mb-3 rounded-lg bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
            </div>
            <p className="text-zinc-500 text-[10px] sm:text-xs mb-1 uppercase tracking-wider">Total Interest</p>
            <p className="text-zinc-900 font-bold text-sm sm:text-base md:text-lg truncate" style={{ fontFamily: "Poppins, sans-serif" }}>
              {formatCurrency(calculations.totalInterest)}
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/contact">
            <Button className="bg-gradient-to-r from-zinc-900 to-black border border-gold/40 text-gold font-semibold px-8 py-5 text-base shadow-lg shadow-black/20 transition-all duration-300 hover:shadow-xl hover:shadow-gold/20 hover:scale-[1.02] hover:border-gold/60">
              Connect with Mortgage Partners
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
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
      {/* Header - Gold Premium Style */}
      <div className="bg-gradient-to-r from-gold/20 via-gold/10 to-gold/20 border-b border-gold/30 p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/30 to-gold/10 border border-gold/30 flex items-center justify-center">
            <Calculator className="w-6 h-6 text-gold" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground" style={{ fontFamily: "Poppins, sans-serif" }}>
              Mortgage Calculator
            </h3>
            <p className="text-muted-foreground text-sm">Estimate your monthly payments</p>
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
                <Label className="text-foreground flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gold" />
                  Property Price
                </Label>
                <span className="text-gold font-semibold">{formatCurrency(propertyPrice)}</span>
              </div>
              <Input
                type="text"
                value={formatNumberWithCommas(propertyPrice)}
                onChange={(e) => setPropertyPrice(parseFormattedNumber(e.target.value))}
                className="bg-background border-border text-foreground focus:border-gold"
              />
              <Slider
                value={[propertyPrice]}
                onValueChange={([value]) => setPropertyPrice(value)}
                min={500000}
                max={50000000}
                step={100000}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>AED 500K</span>
                <span>AED 50M</span>
              </div>
            </div>

            {/* Down Payment */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-foreground flex items-center gap-2">
                  <Percent className="w-4 h-4 text-gold" />
                  Down Payment
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-3.5 h-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-popover border-border text-popover-foreground">
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
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>5%</span>
                <span>{formatCurrency(calculations.downPayment)}</span>
                <span>80%</span>
              </div>
            </div>

            {/* Interest Rate */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-foreground flex items-center gap-2">
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
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>2%</span>
                <span>10%</span>
              </div>
            </div>

            {/* Loan Term */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-foreground flex items-center gap-2">
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
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>5 Years</span>
                <span>30 Years</span>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {/* Monthly Payment - Featured Gold Style */}
            <div className="bg-gradient-to-br from-gold/20 via-gold/10 to-transparent border border-gold/30 rounded-xl p-4 md:p-6 text-center">
              <p className="text-muted-foreground text-sm mb-2">Estimated Monthly Payment</p>
              <p 
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gold break-words"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                {formatCurrency(calculations.monthlyPayment)}
              </p>
              <p className="text-muted-foreground text-xs mt-2">per month for {loanTermYears} years</p>
            </div>

            {/* Breakdown Cards - Gold style */}
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div className="bg-muted/50 border border-border rounded-xl p-3 sm:p-4">
                <p className="text-muted-foreground text-[10px] sm:text-xs mb-1 truncate">Loan Amount</p>
                <p className="text-foreground font-bold text-sm sm:text-base md:text-lg truncate">{formatCurrency(calculations.loanAmount)}</p>
              </div>
              <div className="bg-muted/50 border border-border rounded-xl p-3 sm:p-4">
                <p className="text-muted-foreground text-[10px] sm:text-xs mb-1 truncate">Down Payment</p>
                <p className="text-foreground font-bold text-sm sm:text-base md:text-lg truncate">{formatCurrency(calculations.downPayment)}</p>
              </div>
              <div className="bg-muted/50 border border-border rounded-xl p-3 sm:p-4">
                <p className="text-muted-foreground text-[10px] sm:text-xs mb-1 truncate">Total Interest</p>
                <p className="text-gold font-bold text-sm sm:text-base md:text-lg truncate">{formatCurrency(calculations.totalInterest)}</p>
              </div>
              <div className="bg-muted/50 border border-border rounded-xl p-3 sm:p-4">
                <p className="text-muted-foreground text-[10px] sm:text-xs mb-1 truncate">Total Payment</p>
                <p className="text-foreground font-bold text-sm sm:text-base md:text-lg truncate">{formatCurrency(calculations.totalPayment)}</p>
              </div>
            </div>

            {/* Payment Visualization - Gold theme */}
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">Payment Breakdown</p>
              <div className="h-4 rounded-full overflow-hidden bg-muted flex">
                <div 
                  className="bg-primary transition-all duration-500"
                  style={{ width: `${(calculations.loanAmount / calculations.totalPayment) * 100}%` }}
                />
                <div 
                  className="bg-gold transition-all duration-500"
                  style={{ width: `${(calculations.totalInterest / calculations.totalPayment) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Principal</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-gold" />
                  <span className="text-muted-foreground">Interest</span>
                </span>
              </div>
            </div>

            {/* CTA - Gold gradient */}
            <a href={INQUIRY_FORM_URL} target="_blank" rel="noopener noreferrer" className="block">
              <Button className="w-full bg-gold hover:bg-gold-dark text-gold-foreground h-12 text-base font-semibold group">
                Request Mortgage Partner Introduction
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </a>

            <p className="text-muted-foreground text-xs text-center">
              *Estimates are for illustrative purposes only. Actual rates may vary based on bank policies and eligibility.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MortgageCalculator;