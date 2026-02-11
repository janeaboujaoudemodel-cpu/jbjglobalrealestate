import { useMemo, useState } from "react";
import { Wallet } from "lucide-react";
import { Calculator, TrendingUp, Calendar, Percent, DollarSign, ArrowRight, Info, Building2 } from "lucide-react";
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

import MortgageAIAssistant from "@/components/mortgage/MortgageAIAssistant";
import { CONTACT_INFO } from "@/constants/stats";

const INQUIRY_FORM_URL = CONTACT_INFO.inquiryFormUrl;

interface MortgageCalculatorProps {
  defaultPrice?: number;
  compact?: boolean;
  showAssistant?: boolean;
  context?: {
    projectName?: string;
    location?: string;
  };
}

const MortgageCalculator = ({
  defaultPrice = 2000000,
  compact = false,
  showAssistant = false,
  context,
}: MortgageCalculatorProps) => {
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

    // Interest as percentage of loan amount (how much extra you pay on your loan)
    const interestPercentOfLoan = loanAmount > 0 ? (totalInterest / loanAmount) * 100 : 0;

    return {
      downPayment,
      loanAmount,
      monthlyPayment,
      totalPayment,
      totalInterest,
      interestPercentOfLoan,
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

  const formatCurrencyAbbreviated = (value: number) => {
    if (value >= 1_000_000_000) return `AED ${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `AED ${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `AED ${(value / 1_000).toFixed(0)}K`;
    return `AED ${value}`;
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
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Property Price */}
          <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 rounded-xl p-4 sm:p-5 text-center shadow-md min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 mx-auto mb-2 sm:mb-3 rounded-lg bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
            </div>
            <p className="text-black/60 text-[10px] sm:text-xs mb-1 uppercase tracking-wider">Property Price</p>
            <p className="text-gold font-bold text-lg sm:text-xl" style={{ fontFamily: "Poppins, sans-serif" }}>
              100%
            </p>
            <p className="text-black font-semibold text-[10px] sm:text-xs mt-1 break-words">
              {formatCurrency(propertyPrice)}
            </p>
          </div>

          {/* Down Payment */}
          <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 rounded-xl p-4 sm:p-5 text-center shadow-md min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 mx-auto mb-2 sm:mb-3 rounded-lg bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center">
              <Percent className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
            </div>
            <p className="text-black/60 text-[10px] sm:text-xs mb-1 uppercase tracking-wider">Down Payment</p>
            <p className="text-gold font-bold text-lg sm:text-xl" style={{ fontFamily: "Poppins, sans-serif" }}>
              {downPaymentPercent}%
            </p>
            <p className="text-black font-semibold text-[10px] sm:text-xs mt-1 break-words">
              {formatCurrency(calculations.downPayment)}
            </p>
          </div>
          
          {/* Loan Amount */}
          <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 rounded-xl p-4 sm:p-5 text-center shadow-md min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 mx-auto mb-2 sm:mb-3 rounded-lg bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
            </div>
            <p className="text-black/60 text-[10px] sm:text-xs mb-1 uppercase tracking-wider">Loan Amount</p>
            <p className="text-gold font-bold text-lg sm:text-xl" style={{ fontFamily: "Poppins, sans-serif" }}>
              {100 - downPaymentPercent}%
            </p>
            <p className="text-black font-semibold text-[10px] sm:text-xs mt-1 break-words">
              {formatCurrency(calculations.loanAmount)}
            </p>
          </div>
          
          {/* Monthly Payment */}
          <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 rounded-xl p-4 sm:p-5 text-center shadow-md min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 mx-auto mb-2 sm:mb-3 rounded-lg bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center">
              <Calculator className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
            </div>
            <p className="text-black/60 text-[10px] sm:text-xs mb-1 uppercase tracking-wider">Monthly Payment</p>
            <p className="text-gold font-bold text-lg sm:text-xl" style={{ fontFamily: "Poppins, sans-serif" }}>
              /month
            </p>
            <p className="text-black font-semibold text-[10px] sm:text-xs mt-1 break-words">
              {formatCurrency(calculations.monthlyPayment)}
            </p>
          </div>

          {/* Interest Rate */}
          <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 rounded-xl p-4 sm:p-5 text-center shadow-md min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 mx-auto mb-2 sm:mb-3 rounded-lg bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
            </div>
            <p className="text-black/60 text-[10px] sm:text-xs mb-1 uppercase tracking-wider">Interest Rate</p>
            <p className="text-gold font-bold text-lg sm:text-xl" style={{ fontFamily: "Poppins, sans-serif" }}>
              {interestRate}%
            </p>
            <p className="text-black font-semibold text-[10px] sm:text-xs mt-1 break-words">
              {formatCurrency(calculations.totalInterest)}
            </p>
            <p className="text-black/50 text-[10px] mt-0.5">{loanTermYears} Years</p>
          </div>

          {/* Total Cost */}
          <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 rounded-xl p-4 sm:p-5 text-center shadow-md min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 mx-auto mb-2 sm:mb-3 rounded-lg bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
            </div>
            <p className="text-black/60 text-[10px] sm:text-xs mb-1 uppercase tracking-wider">Total Cost</p>
            <p className="text-gold font-bold text-lg sm:text-xl" style={{ fontFamily: "Poppins, sans-serif" }}>
              100%
            </p>
            <p className="text-black font-semibold text-[10px] sm:text-xs mt-1 break-words">
              {formatCurrency(calculations.totalPayment)}
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-black/60 text-xs">
            *Example: {formatCurrency(propertyPrice)} property, {downPaymentPercent}% down, {interestRate}% rate, {loanTermYears} years
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
      {/* Header - Gold Premium Style - Centered & Bigger */}
      {!compact && (
        <div className="bg-gradient-to-r from-gold/20 via-gold/10 to-gold/20 border-b border-gold/30 p-6 lg:p-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-xl bg-gradient-to-br from-gold/30 to-gold/10 border border-gold/30 flex items-center justify-center mb-4">
              <Calculator className="w-7 h-7 lg:w-8 lg:h-8 text-gold" />
            </div>
            <h3 className="text-2xl lg:text-3xl font-bold text-foreground" style={{ fontFamily: "Poppins, sans-serif" }}>
              Mortgage Calculator
            </h3>
            <p className="text-muted-foreground text-sm lg:text-base mt-2">Estimate your monthly payments</p>
          </div>
        </div>
      )}

      <div className="p-4 lg:p-6">
        <div className="grid lg:grid-cols-[2fr_3fr] gap-6 lg:gap-8">
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
              <div className="py-4">
                <Slider
                  value={[propertyPrice]}
                  onValueChange={([value]) => setPropertyPrice(value)}
                  min={500000}
                  max={50000000}
                  step={100000}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground -mt-1">
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
              <div className="py-4">
                <Slider
                  value={[downPaymentPercent]}
                  onValueChange={([value]) => setDownPaymentPercent(value)}
                  min={5}
                  max={80}
                  step={5}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground -mt-1">
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
              <div className="py-4">
                <Slider
                  value={[interestRate]}
                  onValueChange={([value]) => setInterestRate(value)}
                  min={2}
                  max={10}
                  step={0.25}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground -mt-1">
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
              <div className="py-4">
                <Slider
                  value={[loanTermYears]}
                  onValueChange={([value]) => setLoanTermYears(value)}
                  min={5}
                  max={30}
                  step={5}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground -mt-1">
                <span>5 Years</span>
                <span>30 Years</span>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-4 lg:space-y-6">
            {/* Monthly Payment - Featured Gold Style - Responsive sizing */}
            <div className="bg-gradient-to-br from-gold/20 via-gold/10 to-transparent border border-gold/30 rounded-xl p-3 lg:p-6 text-center">
              <p className="text-muted-foreground text-xs lg:text-sm mb-1 lg:mb-2">Estimated Monthly Payment</p>
              <p 
                className="text-xl sm:text-2xl lg:text-4xl xl:text-5xl font-bold text-gold break-words"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                {formatCurrency(calculations.monthlyPayment)}
              </p>
              <p className="text-muted-foreground text-[10px] lg:text-xs mt-1 lg:mt-2">per month for {loanTermYears} years</p>
            </div>

            {/* 6 Champagne Summary Cards - 3x2 Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-5">
              <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 rounded-xl p-4 lg:p-5 text-center shadow-md min-w-0">
                <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-gold" />
                </div>
                <p className="text-black/60 text-[10px] lg:text-xs mb-2 uppercase tracking-wider">Property Price (100%)</p>
                <p className="text-black font-bold text-xs lg:text-sm xl:text-base whitespace-nowrap" style={{ fontFamily: "Poppins, sans-serif" }}>{formatCurrency(propertyPrice)}</p>
              </div>
              <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 rounded-xl p-4 lg:p-5 text-center shadow-md min-w-0">
                <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center">
                  <Percent className="w-4 h-4 text-gold" />
                </div>
                <p className="text-black/60 text-[10px] lg:text-xs mb-2 uppercase tracking-wider">Down Payment ({downPaymentPercent}%)</p>
                <p className="text-black font-bold text-xs lg:text-sm xl:text-base whitespace-nowrap" style={{ fontFamily: "Poppins, sans-serif" }}>{formatCurrency(calculations.downPayment)}</p>
              </div>
              <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 rounded-xl p-4 lg:p-5 text-center shadow-md min-w-0">
                <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-gold" />
                </div>
                <p className="text-black/60 text-[10px] lg:text-xs mb-2 uppercase tracking-wider">Loan Amount ({100 - downPaymentPercent}%)</p>
                <p className="text-black font-bold text-xs lg:text-sm xl:text-base whitespace-nowrap" style={{ fontFamily: "Poppins, sans-serif" }}>{formatCurrency(calculations.loanAmount)}</p>
              </div>
              <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 rounded-xl p-4 lg:p-5 text-center shadow-md min-w-0">
                <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center">
                  <Calculator className="w-4 h-4 text-gold" />
                </div>
                <p className="text-black/60 text-[10px] lg:text-xs mb-2 uppercase tracking-wider">Monthly Payment</p>
                <p className="text-black font-bold text-xs lg:text-sm xl:text-base whitespace-nowrap" style={{ fontFamily: "Poppins, sans-serif" }}>{formatCurrency(calculations.monthlyPayment)}</p>
              </div>
              <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 rounded-xl p-4 lg:p-5 text-center shadow-md min-w-0">
                <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-gold" />
                </div>
                <p className="text-black/60 text-[10px] lg:text-xs mb-2 uppercase tracking-wider">Interest ({interestRate}% · {loanTermYears}yr)</p>
                <p className="text-black font-bold text-xs lg:text-sm xl:text-base whitespace-nowrap" style={{ fontFamily: "Poppins, sans-serif" }}>{formatCurrency(calculations.totalInterest)}</p>
              </div>
              <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 rounded-xl p-4 lg:p-5 text-center shadow-md min-w-0">
                <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-gold" />
                </div>
                <p className="text-black/60 text-[10px] lg:text-xs mb-2 uppercase tracking-wider">Total Cost (All-In)</p>
                <p className="text-black font-bold text-xs lg:text-sm xl:text-base whitespace-nowrap" style={{ fontFamily: "Poppins, sans-serif" }}>{formatCurrency(calculations.totalPayment)}</p>
              </div>
            </div>

            {/* Payment Visualization */}
            <div className="space-y-2 pt-2">
              <p className="text-muted-foreground text-sm">Payment Breakdown</p>
              <div className="h-4 rounded-full overflow-hidden bg-muted/30 flex border border-gold/20">
                <div 
                  className="transition-all duration-500"
                  style={{ 
                    width: `${(calculations.loanAmount / calculations.totalPayment) * 100}%`,
                    background: 'linear-gradient(135deg, #F5EBD7 0%, #E8DCC8 50%, #D4C4A8 100%)'
                  }}
                />
                <div 
                  className="transition-all duration-500 bg-gold/40"
                  style={{ width: `${(calculations.totalInterest / calculations.totalPayment) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <span 
                    className="w-2.5 h-2.5 rounded-full border border-gold/30" 
                    style={{ background: 'linear-gradient(135deg, #F5EBD7 0%, #E8DCC8 50%, #D4C4A8 100%)' }}
                  />
                  <span className="text-muted-foreground">Principal ({((calculations.loanAmount / calculations.totalPayment) * 100).toFixed(0)}%)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-gold/40 border border-gold/30" />
                  <span className="text-muted-foreground">Interest ({((calculations.totalInterest / calculations.totalPayment) * 100).toFixed(0)}%)</span>
                </span>
              </div>
            </div>

            <p className="text-muted-foreground text-xs text-center pt-2">
              *Estimates are for illustrative purposes only. Actual rates may vary based on bank policies and eligibility.
            </p>

            {/* Request Mortgage Introduction CTA */}
            <div className="mt-6 pt-4 border-t border-gold/20">
              <p className="text-center text-muted-foreground text-sm mb-3">Prefer a Mortgage Advisor Through Our Licensed Partners?</p>
              <Button 
                variant="primary" 
                size="lg" 
                className="w-full"
                asChild
              >
                <a href="/contact">
                  Request Mortgage Introduction
                </a>
              </Button>
            </div>

          </div>
        </div>

        {showAssistant && (
          <div className="mt-6">
            <MortgageAIAssistant
              context={{
                propertyPrice,
                downPaymentPercent,
                interestRate,
                loanTermYears,
                downPayment: calculations.downPayment,
                loanAmount: calculations.loanAmount,
                monthlyPayment: calculations.monthlyPayment,
                totalInterest: calculations.totalInterest,
                totalPayment: calculations.totalPayment,
                projectName: context?.projectName,
                location: context?.location,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MortgageCalculator;