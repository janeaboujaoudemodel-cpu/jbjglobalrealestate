import "react-phone-number-input/style.css";
import PhoneInputBase, { type Value } from "react-phone-number-input";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (v: string) => void;
  id?: string;
  autoComplete?: string;
  placeholder?: string;
}

/**
 * International phone input with country flag + dial code picker,
 * styled to match the JBJ champagne/emerald form language.
 * Defaults to UAE.
 */
export default function PhoneField({ value, onChange, id, autoComplete = "tel", placeholder }: Props) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 h-11 rounded-md border border-[#B89555]/40 bg-white px-3",
        "focus-within:border-[#064E3B] focus-within:ring-2 focus-within:ring-[#064E3B]/15 transition-colors"
      )}
    >
      <PhoneInputBase
        id={id}
        international
        defaultCountry="AE"
        countryCallingCodeEditable={false}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={(value || undefined) as Value}
        onChange={(v) => onChange((v ?? "") as string)}
        className={cn(
          "phone-input-jbj flex-1 items-center",
          "[&_input]:outline-none [&_input]:bg-transparent [&_input]:text-[#1A1A1A] [&_input]:text-sm [&_input]:h-11",
          "[&_.PhoneInputCountry]:mr-2 [&_.PhoneInputCountry]:flex [&_.PhoneInputCountry]:items-center [&_.PhoneInputCountry]:gap-1",
          "[&_.PhoneInputCountrySelect]:cursor-pointer",
          "[&_.PhoneInputCountryIcon]:w-6 [&_.PhoneInputCountryIcon]:h-4 [&_.PhoneInputCountryIcon]:rounded-sm [&_.PhoneInputCountryIcon]:overflow-hidden [&_.PhoneInputCountryIcon]:shadow-sm",
          "[&_.PhoneInputCountrySelectArrow]:opacity-60 [&_.PhoneInputCountrySelectArrow]:ml-1"
        )}
      />
    </div>
  );
}
