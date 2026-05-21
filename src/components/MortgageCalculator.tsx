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
  showHeading?: boolean;
  context?: {
    projectName?: string;
    location?: string;
  };
}

const MortgageCalculator = ({
  defaultPrice = 2000000,
  compact = false,
  showAssistant = false,
  showHeading = true,
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

    let monthlyPayment = 0;
    if (monthlyRate > 0) {
      monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
                       (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    } else {
      monthlyPayment = loanAmount / numberOfPayments;
    }

    const totalPayment = monthlyPayment * numberOfPayments;
    const totalInterest = totalPayment - loanAmount;
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

  const formatNumberWithCommas = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const parseFormattedNumber = (value: string) => {
    const parsed = parseInt(value.replace(/,/g, ''), 10);
    return isNaN(parsed) ? 0 : parsed;
  };

  if (compact) {
    return (
      <div className="max-w-5xl mx-auto">
        {showHeading && (
        <div className="text-center mb-6 md:mb-8">
          <h3 className="text-[#1A1A1A] text-2xl sm:text-3xl md:text-4xl font-bold whitespace-nowrap">
            Mortgage Calculator
          </h3>
          <p className="text-[#1A1A1A]/70 mt-2 md:mt-3 max-w-lg mx-auto text-sm md:text-base">
            Estimate your monthly payments and explore financing options.
          </p>
        </div>
        )}

        {/* Interactive Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
          {/* Property Price Slider */}
          <div className="bg-[#F7F2EA] rounded-xl border border-[#B89555]/30 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#1A1A1A]/70 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#1A1A1A]/70" />
                Property Price
              </span>
              <span className="text-[#1A1A1A] font-bold text-sm">{formatCurrencyAbbreviated(propertyPrice)}</span>
            </div>
            <Slider
              value={[propertyPrice]}
              onValueChange={([value]) => setPropertyPrice(value)}
              min={500000}
              max={50000000}
              step={100000}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-[#1A1A1A]/70 mt-1">
              <span>AED 500K</span>
              <span>AED 50M</span>
            </div>
          </div>

          {/* Down Payment Slider */}
          <div className="bg-[#F7F2EA] rounded-xl border border-[#B89555]/30 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#1A1A1A]/70 uppercase tracking-wider flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-[#1A1A1A]/70" />
                Down Payment
              </span>
              <span className="text-[#1A1A1A] font-bold text-sm">{downPaymentPercent}% — {formatCurrencyAbbreviated(calculations.downPayment)}</span>
            </div>
            <Slider
              value={[downPaymentPercent]}
              onValueChange={([value]) => setDownPaymentPercent(value)}
              min={5}
              max={80}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-[#1A1A1A]/70 mt-1">
              <span>5%</span>
              <span>80%</span>
            </div>
          </div>

          {/* Interest Rate Slider */}
          <div className="bg-[#F7F2EA] rounded-xl border border-[#B89555]/30 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#1A1A1A]/70 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#1A1A1A]/70" />
                Interest Rate
              </span>
              <span className="text-[#1A1A1A] font-bold text-sm">{interestRate}%</span>
            </div>
            <Slider
              value={[interestRate]}
              onValueChange={([value]) => setInterestRate(value)}
              min={2}
              max={10}
              step={0.25}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-[#1A1A1A]/70 mt-1">
              <span>2%</span>
              <span>10%</span>
            </div>
          </div>

          {/* Loan Term Slider */}
          <div className="bg-[#F7F2EA] rounded-xl border border-[#B89555]/30 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#1A1A1A]/70 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#1A1A1A]/70" />
                Loan Term
              </span>
              <span className="text-[#1A1A1A] font-bold text-sm">{loanTermYears} Years</span>
            </div>
            <Slider
              value={[loanTermYears]}
              onValueChange={([value]) => setLoanTermYears(value)}
              min={5}
              max={30}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-[#1A1A1A]/70 mt-1">
              <span>5 Years</span>
              <span>30 Years</span>
            </div>
          </div>
        </div>

        {/* Results — single premium horizontal row at all breakpoints */}
        <div className="grid grid-cols-4 gap-2 md:gap-4 items-stretch">
          {/* Monthly Payment — featured */}
          <div
            className="rounded-xl p-3 md:p-4 text-center flex flex-col justify-center"
            style={{
              background: "linear-gradient(135deg, #FDFBF7 0%, #F7F1E6 50%, #ECE2D2 100%)",
              border: "1px solid rgba(184,149,85,0.55)",
              boxShadow: "0 6px 20px rgba(184,149,85,0.18), inset 0 1px 0 rgba(255,255,255,0.9)",
            }}
          >
            <p className="text-[9px] md:text-[10px] mb-1 uppercase tracking-[0.14em] text-[#1A1A1A]/60 font-semibold leading-tight">
              Monthly
            </p>
            <p className="font-bold text-[13px] md:text-xl text-[#1A1A1A] tabular-nums leading-tight break-words">
              {formatCurrencyAbbreviated(calculations.monthlyPayment)}
            </p>
            <p className="text-[9px] md:text-[10px] mt-0.5 text-[#1A1A1A]/60">
              {loanTermYears}y
            </p>
          </div>

          <div className="bg-[#F7F2EA] border border-[#B89555]/30 rounded-xl p-3 md:p-4 text-center shadow-sm flex flex-col justify-center">
            <p className="text-[#1A1A1A]/60 text-[9px] md:text-[10px] mb-1 uppercase tracking-wider leading-tight">Down Payment</p>
            <p className="text-[#1A1A1A] font-bold text-[13px] md:text-lg tabular-nums break-words">{formatCurrencyAbbreviated(calculations.downPayment)}</p>
            <p className="text-[#1A1A1A]/60 text-[9px] md:text-[10px] mt-0.5">{downPaymentPercent}%</p>
          </div>

          <div className="bg-[#F7F2EA] border border-[#B89555]/30 rounded-xl p-3 md:p-4 text-center shadow-sm flex flex-col justify-center">
            <p className="text-[#1A1A1A]/60 text-[9px] md:text-[10px] mb-1 uppercase tracking-wider leading-tight">Loan Amount</p>
            <p className="text-[#1A1A1A] font-bold text-[13px] md:text-lg tabular-nums break-words">{formatCurrencyAbbreviated(calculations.loanAmount)}</p>
            <p className="text-[#1A1A1A]/60 text-[9px] md:text-[10px] mt-0.5">{100 - downPaymentPercent}% fin.</p>
          </div>

          <div className="bg-[#F7F2EA] border border-[#B89555]/30 rounded-xl p-3 md:p-4 text-center shadow-sm flex flex-col justify-center">
            <p className="text-[#1A1A1A]/60 text-[9px] md:text-[10px] mb-1 uppercase tracking-wider leading-tight">Total Cost</p>
            <p className="text-[#1A1A1A] font-bold text-[13px] md:text-lg tabular-nums break-words">{formatCurrencyAbbreviated(calculations.totalPayment)}</p>
            <p className="text-[#1A1A1A]/60 text-[9px] md:text-[10px] mt-0.5 tabular-nums">+{formatCurrencyAbbreviated(calculations.totalInterest)}</p>
          </div>
        </div>


      </div>
    );
  }


  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
      {/* Header - Gold Premium Style - Centered & Bigger */}
      {!compact && (
        <div className="bg-gradient-to-r from-gold/20 via-gold/10 to-gold/20 border-b border-[#B89555]/30 p-6 lg:p-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-xl bg-gradient-to-br from-gold/30 to-gold/10 border border-[#B89555]/30 flex items-center justify-center mb-4">
              <Calculator className="w-7 h-7 lg:w-8 lg:h-8 text-[#1A1A1A]" />
            </div>
            <h3 className="text-2xl lg:text-3xl font-bold text-foreground">
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
                  <DollarSign className="w-4 h-4 text-[#1A1A1A]" />
                  Property Price
                </Label>
                <span className="text-[#1A1A1A] font-semibold">{formatCurrency(propertyPrice)}</span>
              </div>
              <Input
                type="text"
                value={formatNumberWithCommas(propertyPrice)}
                onChange={(e) => setPropertyPrice(parseFormattedNumber(e.target.value))}
                className="bg-background border-border text-foreground focus:border-[#B89555]"
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
                  <Percent className="w-4 h-4 text-[#1A1A1A]" />
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
                <span className="text-[#1A1A1A] font-semibold">{downPaymentPercent}%</span>
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
                  <TrendingUp className="w-4 h-4 text-[#1A1A1A]" />
                  Interest Rate (Annual)
                </Label>
                <span className="text-[#1A1A1A] font-semibold">{interestRate}%</span>
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
                  <Calendar className="w-4 h-4 text-[#1A1A1A]" />
                  Loan Term
                </Label>
                <span className="text-[#1A1A1A] font-semibold">{loanTermYears} Years</span>
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
            <div className="bg-gradient-to-br from-gold/20 via-gold/10 to-transparent border border-[#B89555]/30 rounded-xl p-3 lg:p-6 text-center">
              <p className="text-muted-foreground text-xs lg:text-sm mb-1 lg:mb-2">Estimated Monthly Payment</p>
              <p 
                className="text-xl sm:text-2xl lg:text-4xl xl:text-5xl font-bold text-[#1A1A1A] break-words"
              >
                {formatCurrency(calculations.monthlyPayment)}
              </p>
              <p className="text-muted-foreground text-[10px] lg:text-xs mt-1 lg:mt-2">per month for {loanTermYears} years</p>
            </div>

            {/* 6 Champagne Summary Cards - 3x2 Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-5">
              <div className="bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] border border-[#B89555]/40 rounded-xl p-4 lg:p-5 text-center shadow-md min-w-0">
                <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-[#1A1A1A]" />
                </div>
                <p className="text-[#1A1A1A]/60 text-[10px] lg:text-xs mb-2 uppercase tracking-wider">Property Price (100%)</p>
                <p className="text-[#1A1A1A] font-bold text-xs lg:text-sm xl:text-base whitespace-nowrap">{formatCurrency(propertyPrice)}</p>
              </div>
              <div className="bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] border border-[#B89555]/40 rounded-xl p-4 lg:p-5 text-center shadow-md min-w-0">
                <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center">
                  <Percent className="w-4 h-4 text-[#1A1A1A]" />
                </div>
                <p className="text-[#1A1A1A]/60 text-[10px] lg:text-xs mb-2 uppercase tracking-wider">Down Payment ({downPaymentPercent}%)</p>
                <p className="text-[#1A1A1A] font-bold text-xs lg:text-sm xl:text-base whitespace-nowrap">{formatCurrency(calculations.downPayment)}</p>
              </div>
              <div className="bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] border border-[#B89555]/40 rounded-xl p-4 lg:p-5 text-center shadow-md min-w-0">
                <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-[#1A1A1A]" />
                </div>
                <p className="text-[#1A1A1A]/60 text-[10px] lg:text-xs mb-2 uppercase tracking-wider">Loan Amount ({100 - downPaymentPercent}%)</p>
                <p className="text-[#1A1A1A] font-bold text-xs lg:text-sm xl:text-base whitespace-nowrap">{formatCurrency(calculations.loanAmount)}</p>
              </div>
              <div className="bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] border border-[#B89555]/40 rounded-xl p-4 lg:p-5 text-center shadow-md min-w-0">
                <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center">
                  <Calculator className="w-4 h-4 text-[#1A1A1A]" />
                </div>
                <p className="text-[#1A1A1A]/60 text-[10px] lg:text-xs mb-2 uppercase tracking-wider">Monthly Payment</p>
                <p className="text-[#1A1A1A] font-bold text-xs lg:text-sm xl:text-base whitespace-nowrap">{formatCurrency(calculations.monthlyPayment)}</p>
              </div>
              <div className="bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] border border-[#B89555]/40 rounded-xl p-4 lg:p-5 text-center shadow-md min-w-0">
                <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-[#1A1A1A]" />
                </div>
                <p className="text-[#1A1A1A]/60 text-[10px] lg:text-xs mb-2 uppercase tracking-wider">Interest ({interestRate}% · {loanTermYears}yr)</p>
                <p className="text-[#1A1A1A] font-bold text-xs lg:text-sm xl:text-base whitespace-nowrap">{formatCurrency(calculations.totalInterest)}</p>
              </div>
              <div className="bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] border border-[#B89555]/40 rounded-xl p-4 lg:p-5 text-center shadow-md min-w-0">
                <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-[#1A1A1A]" />
                </div>
                <p className="text-[#1A1A1A]/60 text-[10px] lg:text-xs mb-2 uppercase tracking-wider">Total Cost (All-In)</p>
                <p className="text-[#1A1A1A] font-bold text-xs lg:text-sm xl:text-base whitespace-nowrap">{formatCurrency(calculations.totalPayment)}</p>
              </div>
            </div>

            {/* Payment Visualization */}
            <div className="space-y-2 pt-2">
              <p className="text-muted-foreground text-sm">Payment Breakdown</p>
              <div className="h-4 rounded-full overflow-hidden bg-muted/30 flex border border-[#B89555]/20">
                <div 
                  className="transition-all duration-500"
                  style={{ 
                    width: `${(calculations.loanAmount / calculations.totalPayment) * 100}%`,
                    background: 'linear-gradient(135deg, #F7F1E6 0%, #ECE2D2 50%, #D8C7A6 100%)'
                  }}
                />
                <div 
                  className="transition-all duration-500 bg-[#EFE6D6]/40"
                  style={{ width: `${(calculations.totalInterest / calculations.totalPayment) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <span 
                    className="w-2.5 h-2.5 rounded-full border border-[#B89555]/30" 
                    style={{ background: 'linear-gradient(135deg, #F7F1E6 0%, #ECE2D2 50%, #D8C7A6 100%)' }}
                  />
                  <span className="text-muted-foreground">Principal ({((calculations.loanAmount / calculations.totalPayment) * 100).toFixed(0)}%)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EFE6D6]/40 border border-[#B89555]/30" />
                  <span className="text-muted-foreground">Interest ({((calculations.totalInterest / calculations.totalPayment) * 100).toFixed(0)}%)</span>
                </span>
              </div>
            </div>

            <p className="text-muted-foreground text-xs text-center pt-2">
              *Estimates are for illustrative purposes only. Actual rates may vary based on bank policies and eligibility.
            </p>

            {/* Request Mortgage Introduction CTA */}
            <div className="mt-6 pt-4 border-t border-[#B89555]/20">
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
