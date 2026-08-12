/**
 * InlineCurrencySelect — currency picker that fills its parent box.
 *
 * No pill, no second border: the surrounding search segment IS the control.
 * Writing the selection persists to localStorage and broadcasts
 * `currencyChange`, so every price on the platform follows instantly
 * (see `useCurrency`).
 */
import { useEffect, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SUPPORTED_CURRENCIES } from "@/components/CurrencySwitcher";

const CURRENCY_KEY = "jj_currency";

export function setCurrencyGlobal(code: string) {
  localStorage.setItem(CURRENCY_KEY, code);
  window.dispatchEvent(new CustomEvent("currencyChange", { detail: code }));
}

interface Props {
  dark?: boolean;
}

export default function InlineCurrencySelect({ dark }: Props) {
  const [code, setCode] = useState<string>(() =>
    typeof window !== "undefined" ? localStorage.getItem(CURRENCY_KEY) || "AED" : "AED",
  );

  useEffect(() => {
    const handler = (e: Event) => {
      const next = (e as CustomEvent).detail;
      if (typeof next === "string") setCode(next);
    };
    window.addEventListener("currencyChange", handler);
    return () => window.removeEventListener("currencyChange", handler);
  }, []);

  const active = SUPPORTED_CURRENCIES.find((c) => c.code === code) || SUPPORTED_CURRENCIES[0];
  const fg = dark ? "#FFFFFF" : "#1A1A1A";

  const pick = (next: string) => {
    setCode(next);
    setCurrencyGlobal(next);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-no-contrast-guard
          className="group flex h-full w-full min-w-0 items-center justify-center gap-1.5 bg-transparent px-2 py-1.5 text-center lg:px-3"
          style={{ color: fg, borderRadius: 0 }}
          aria-label="Select currency"
        >
          {/* One clean line: symbol · code · chevron. The word "Currency" is
              redundant once the active code is shown. */}
          <span
            aria-hidden
            className="shrink-0 text-[11px] font-semibold leading-none"
            style={{ color: dark ? "rgba(255,255,255,0.75)" : "rgba(26,26,26,0.65)" }}
          >
            {active.symbol === active.code ? null : active.symbol}
          </span>
          <span
            className="text-[13px] font-semibold leading-none lg:text-sm"
            style={{ color: fg, letterSpacing: "0.06em", whiteSpace: "nowrap" }}
          >
            {active.code}
          </span>
          <ChevronDown
            className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-hover:translate-y-[1px]"
            style={{ color: dark ? "rgba(255,255,255,0.7)" : "rgba(26,26,26,0.6)" }}
          />
        </button>
      </DropdownMenuTrigger>


      <DropdownMenuContent align="start" className="z-[300] max-h-80 w-64 overflow-y-auto">
        {SUPPORTED_CURRENCIES.map((c) => (
          <DropdownMenuItem key={c.code} onClick={() => pick(c.code)} className="gap-2 text-sm">
            <span className="w-8 shrink-0 text-[11px] font-semibold opacity-70">{c.symbol === c.code ? "" : c.symbol}</span>
            <span className="font-semibold">{c.code}</span>
            <span className="truncate opacity-70">{c.name}</span>
            {c.code === code ? <Check className="ml-auto h-4 w-4" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
