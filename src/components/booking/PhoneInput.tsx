/**
 * PhoneInput — international phone input with country flag + dial code picker.
 * Defaults to UAE (🇦🇪). Wraps `react-phone-number-input`.
 */
import "react-phone-number-input/style.css";
import PhoneInputBase, { type Value } from "react-phone-number-input";
import { cn } from "@/lib/utils";

export interface PhoneValue {
  e164: string;
  countryCode?: string; // ISO-2 e.g. "AE"
  national?: string;
}

interface Props {
  value: string;
  onChange: (v: string, meta: PhoneValue) => void;
  className?: string;
  id?: string;
}

export function PhoneInput({ value, onChange, className, id }: Props) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border border-[#B89555]/30 bg-white px-3 py-2",
        "focus-within:border-[#B89555] transition",
        className,
      )}
    >
      <PhoneInputBase
        id={id}
        international
        defaultCountry="AE"
        countryCallingCodeEditable={false}
        value={(value || undefined) as Value}
        onChange={(v) => {
          const e164 = (v ?? "") as string;
          onChange(e164, { e164 });
        }}
        onCountryChange={() => { /* react-phone-number-input handles internally */ }}
        className="phone-input-wrapper flex-1 [&_input]:outline-none [&_input]:bg-transparent [&_input]:text-[#1A1A1A] [&_input]:text-sm [&_.PhoneInputCountrySelect]:mr-2 [&_.PhoneInputCountryIcon]:w-6 [&_.PhoneInputCountryIcon]:h-4 [&_.PhoneInputCountryIcon]:rounded-sm [&_.PhoneInputCountryIcon]:overflow-hidden"
      />
    </div>
  );
}
